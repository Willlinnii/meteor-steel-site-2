const admin = require('firebase-admin');
const { getAnthropicClient, getOpenAIClient, getUserKeys } = require('./_lib/llm');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { computeNatalChart } = require('./_lib/natalChart');
const { getUserTier, getTierConfig, getCurrentMonthKey, JOURNEYER_SUBS } = require('./_lib/usageTiers');
const { shouldReestimate, updateStorageEstimate } = require('./_lib/storageEstimate');

// Shared engine — data, formatters, prompt builders
const {
  truncate,
  getCorePrompt,
  getSystemPrompt,
  getPersonaPrompt,
  detectAreaFromMessage,
  VALID_AREAS,
  NATAL_CHART_GUIDANCE,
  // Data re-exports used directly in chat.js
  monomyth,
  stageOverviews,
  steelProcess,
  synthesis,
  monomythTheorists,
  monomythMyths,
  monomythPsychles,
  yellowBrickRoad,
  mythicEarthSites,
  // Celestial Drama
  getMonomythStageFromMoonPhase,
  buildCelestialDramaPrompt,
} = require('./_lib/engine');

// Model config — centralized for easy swapping and future BYOK support
const MODELS = {
  fast: process.env.LLM_FAST_MODEL || 'claude-haiku-4-5-20251001',
  quality: process.env.LLM_QUALITY_MODEL || 'claude-sonnet-4-20250514',
  narrative: process.env.LLM_NARRATIVE_MODEL || 'gpt-4o-mini',
};

// In-memory rate limiting by user (resets when the serverless function cold-starts)
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

// --- Natal chart tool definition ---

const NATAL_CHART_TOOL = {
  name: 'compute_natal_chart',
  description: 'Compute a precise natal astrological chart using real astronomical computation (astronomy-engine library). Returns exact ecliptic longitudes for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, plus Ascendant, Midheaven, Whole Sign houses, aspects, Vedic positions, and Chinese zodiac. ALWAYS call this tool when a user mentions their birthday, asks about their chart, or provides birth data. Never say you cannot do this — this tool IS the capability.',
  input_schema: {
    type: 'object',
    properties: {
      year: { type: 'integer' },
      month: { type: 'integer', description: '1-12' },
      day: { type: 'integer', description: '1-31' },
      hour: { type: 'integer', description: '24h format, -1 if unknown' },
      minute: { type: 'integer', description: '0-59' },
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      city: { type: 'string' },
      utcOffset: { type: 'number', description: 'UTC offset in hours for the birth timezone at the date of birth (e.g. -5 for CDT, -6 for CST, +0 for GMT, +1 for CET, +5.5 for IST). MUST account for daylight saving time if it was in effect on the birth date.' },
    },
    required: ['year', 'month', 'day', 'hour', 'minute', 'latitude', 'longitude', 'utcOffset'],
  },
};

// --- Mythic Earth highlight tool ---

const HIGHLIGHT_SITES_TOOL = {
  name: 'highlight_sites',
  description: 'Highlight specific sites on the Mythic Earth globe. Call this whenever the user asks about sites, regions, traditions, or categories — the globe will fly to and visually highlight the matching sites. Always call this tool when you can identify relevant sites from the user\'s query.',
  input_schema: {
    type: 'object',
    properties: {
      site_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of site IDs to highlight on the globe (e.g. ["delphi", "eleusis", "mt-olympus"])',
      },
    },
    required: ['site_ids'],
  },
};

// --- Story seed tool definition ---

const SAVE_STORY_SEED = {
  name: 'save_story_seed',
  description: 'Save a story seed when the user has shared enough about a story they want to develop. Call after 2-3+ exchanges, not on the first message.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Short evocative name for the story' },
      type: { type: 'string', description: 'Story type: personal, band, screenplay, novel, myth, other' },
      premise: { type: 'string', description: '1-2 sentence summary of the story' },
      stageEntries: {
        type: 'object',
        description: 'Map of monomyth stage IDs to content from what the user shared. IDs: golden-age, falling-star, impact-crater, forge, quenching, integration, drawing, new-age. Only include stages with clear content.',
        additionalProperties: { type: 'string' }
      }
    },
    required: ['name', 'premise']
  }
};

// --- Atlas routing table — detect intent, give a real response, offer the link ---

const ATLAS_ROUTES = [
  { keywords: 'birthday, birth time, astrology, chart', label: 'Open Divination', path: '/divination', note: 'interactive chart with houses, aspects, cultural traditions. Use compute_natal_chart tool first if they share birth data' },
  { keywords: 'profile, credentials, background, expertise', label: 'Set Up Profile', path: '/profile', note: 'guided credential assessment, natal chart, professional identity' },
  { keywords: 'guidance, coaching, life transition, feeling stuck or lost', label: 'Start a Consultation', path: '/consulting/intake', note: 'structured mythic consultation mapping situation to archetypal patterns' },
  { keywords: 'teaching, mentoring, contributing expertise, guild, practitioner', label: 'Explore the Guild', path: '/guild', note: 'where practitioners gather to teach and consult' },
  { keywords: 'deeper study, find a mentor, guided learning', label: 'Find a Mentor', path: '/guild-directory', note: 'browse the mentor directory for guided study' },
  { keywords: 'tarot, reading, card pull, divination, oracle', label: 'Open Divination', path: '/divination', note: 'full readings with card imagery and cultural traditions' },
  { keywords: 'bio, CV, resume, transmute into narrative', label: 'Open Profile', path: '/profile', note: 'transmute raw biographical text into mythic narrative' },
];

// --- Yellow Brick Road challenge prompt builders ---

function buildYBRChallengePrompt(persona, challengeData, level) {
  const levelLabels = { 1: 'basic recognition', 2: 'deeper understanding', 3: 'transformative integration' };
  return `${persona}

--- YELLOW BRICK ROAD: GATEKEEPER MODE ---

You are now testing a traveler on the Yellow Brick Road. You are still fully in character as yourself — speak as you always do. But you are also a gatekeeper. The traveler must demonstrate understanding to pass.

CURRENT CHALLENGE (Level ${level} — ${levelLabels[level] || 'unknown'}):
Theme: ${challengeData.theme}
Challenge prompt you already posed: "${challengeData.prompt}"
Evaluation hint (for your judgment only, do not reveal): ${challengeData.evaluationHint}

INSTRUCTIONS:
1. Read the traveler's response carefully.
2. Respond in character — acknowledge what they said, engage with it, push deeper if needed.
3. Judge whether they have demonstrated genuine understanding at this level:
   - Level 1: Can they recognize the pattern? Basic awareness is enough.
   - Level 2: Can they connect it to lived experience? Personal insight required.
   - Level 3: Can they hold the tension between opposites? Integration, not just knowledge.
4. Be generous but not a pushover. A sincere attempt with real reflection should pass. Vague platitudes or surface-level answers should not.
5. At the END of your response, on a new line, append exactly this tag (no other text on that line):
   <ybr-result>{"passed": true}</ybr-result>
   or
   <ybr-result>{"passed": false}</ybr-result>

Keep your response conversational and relatively brief (2-4 sentences of in-character dialogue + the tag).`;
}

function buildYBRAtlasHintPrompt(entityName, challengeData, level) {
  return `You are Atlas, the mythic companion of the Mythouse. A traveler is walking the Yellow Brick Road and is currently facing ${entityName} at Level ${level}.

The challenge theme is: ${challengeData.theme}
The challenge prompt is: "${challengeData.prompt}"

The traveler is asking you for a hint. Help them think about this challenge WITHOUT giving them the answer directly. Point them toward the right direction using mythic language, questions, and gentle nudges. You can reference the entity's correspondences (metal, sin, virtue, archetype, element, etc.) to help illuminate the path.

Do NOT tell them what to say. Help them find it themselves. Keep your hint brief (2-3 sentences).`;
}

function getYBRChallenge(stopId, level) {
  const stop = yellowBrickRoad.journeySequence.find(s => s.id === stopId);
  if (!stop) return null;
  const phaseKey = stop.phase;
  const entityChallenges = yellowBrickRoad.challenges[stop.entity];
  if (!entityChallenges) return null;
  const levelData = entityChallenges[phaseKey]?.[level - 1];
  if (!levelData) return null;
  return { stop, levelData };
}

// --- Wheel Journey prompt builders ---

const WHEEL_JOURNEY_LABELS = {
  monomyth: {
    'golden-age': 'Surface', 'falling-star': 'Calling', 'impact-crater': 'Crossing',
    'forge': 'Initiating', 'quenching': 'Nadir', 'integration': 'Return',
    'drawing': 'Arrival', 'new-age': 'Renewal',
  },
  'meteor-steel': {
    'golden-age': 'Golden Age', 'falling-star': 'Calling Star', 'impact-crater': 'Crater Crossing',
    'forge': 'Trials of Forge', 'quenching': 'Quench', 'integration': 'Integration',
    'drawing': 'Draw', 'new-age': 'Age of Steel',
  },
  fused: {
    'golden-age': 'Golden Age', 'falling-star': 'Calling Star', 'impact-crater': 'Crater Crossing',
    'forge': 'Trials of Forge', 'quenching': 'Quench', 'integration': 'Integration',
    'drawing': 'Draw', 'new-age': 'Age of Steel',
  },
};

function getWheelStageContent(journeyId, stageId) {
  if (journeyId === 'monomyth') {
    const prose = monomyth[stageId] || '';
    const overview = stageOverviews[stageId] || '';
    const theorists = monomythTheorists[stageId];
    let theoristText = '';
    if (theorists) {
      for (const [, entries] of Object.entries(theorists)) {
        for (const [, t] of Object.entries(entries)) {
          theoristText += `${t.name} (${t.concept}): ${truncate(t.description, 200)}\n`;
        }
      }
    }
    const myths = monomythMyths[stageId];
    let mythText = '';
    if (myths) {
      for (const m of Object.values(myths)) {
        mythText += `${m.title} (${m.tradition}): ${truncate(m.description, 200)}\n`;
      }
    }
    const psychles = monomythPsychles[stageId];
    let cycleText = '';
    if (psychles?.cycles) {
      for (const c of Object.values(psychles.cycles)) {
        cycleText += `${c.label}: ${c.phase} — ${truncate(c.description, 120)}\n`;
      }
    }
    return `STAGE OVERVIEW:\n${overview}\n\nMONOMYTH PROSE (Atlas narration):\n${prose}\n\nTHEORISTS:\n${theoristText}\nMYTHS:\n${mythText}\nCYCLES:\n${cycleText}`;
  }
  // meteor-steel
  const process = steelProcess[stageId] || '';
  const overview = stageOverviews[stageId] || '';
  const mono = monomyth[stageId] || '';
  const synth = synthesis[stageId] || '';
  return `STAGE OVERVIEW:\n${overview}\n\nSTEEL PROCESS:\n${process}\n\nMONOMYTH:\n${mono}\n\nSYNTHESIS:\n${synth}`;
}

function buildWheelJourneyPrompt(journeyId, stageId) {
  const labels = WHEEL_JOURNEY_LABELS[journeyId] || {};
  const stageLabel = labels[stageId] || stageId;
  const stageContent = getWheelStageContent(journeyId, stageId);
  const journeyLabel = journeyId === 'monomyth' ? "the Hero's Journey (Monomyth)" : 'the Meteor Steel process';

  return `You are Atlas, the mythic companion of the Mythouse. You are testing a traveler who is walking the wheel of ${journeyLabel}.

They are currently at the "${stageLabel}" stage.

FULL CONTENT FOR THIS STAGE (use this to judge their understanding):
${stageContent}

INSTRUCTIONS:
1. The traveler must describe what happens at this stage — the key events, themes, and transformations — with meaningful detail.
2. If their answer is vague, surface-level, or wrong, gently correct them, offer a hint about what they're missing, and ask them to try again. Do NOT pass them.
3. If they demonstrate real understanding of the stage's core meaning — they don't need to be perfect, but they should show genuine comprehension — pass them.
4. Encourage them to explore the page content before answering if they seem stuck.
5. Stay in character as Atlas — warm, wise, grounded, a companion who has walked this wheel before.
6. Keep responses conversational and relatively brief (2-4 sentences + the result tag).
7. At the END of your response, on a new line, append exactly this tag:
   <ybr-result>{"passed": true}</ybr-result>
   or
   <ybr-result>{"passed": false}</ybr-result>`;
}

function buildStoryModePrompt(journeyId, stageId) {
  const labels = WHEEL_JOURNEY_LABELS[journeyId] || {};
  const stageLabel = labels[stageId] || stageId;
  const stageContent = getWheelStageContent(journeyId, stageId);
  const journeyLabel = journeyId === 'monomyth' ? "the Hero's Journey (Monomyth)" : 'the Meteor Steel process';

  return `You are Atlas, the mythic companion of the Mythouse. A traveler is building a fictional story along the wheel of ${journeyLabel}.

They are currently at the "${stageLabel}" stage.

THEMATIC CONTENT FOR THIS STAGE (use this to understand the stage's themes, not to test knowledge):
${stageContent}

INSTRUCTIONS:
1. The traveler is creating a story. They should offer a scene, character moment, or turning point that fits this stage's themes.
2. If their contribution is very thin (just a word or two with no story element), gently encourage them to add more detail. Do NOT test their knowledge of the theory.
3. If they offer any meaningful story element — a scene, a character beat, an image, a plot point — pass them. Be generous. Creativity matters more than accuracy.
4. Reflect back what they've created with warmth, and hint at what the next stage might bring.
5. Stay in character as Atlas — warm, wise, a creative companion.
6. Keep responses brief (2-4 sentences + the result tag).
7. At the END of your response, on a new line, append exactly this tag:
   <ybr-result>{"passed": true}</ybr-result>
   or
   <ybr-result>{"passed": false}</ybr-result>`;
}

function buildPersonalModePrompt(journeyId, stageId) {
  const labels = WHEEL_JOURNEY_LABELS[journeyId] || {};
  const stageLabel = labels[stageId] || stageId;
  const stageContent = getWheelStageContent(journeyId, stageId);
  const journeyLabel = journeyId === 'monomyth' ? "the Hero's Journey (Monomyth)" : 'the Meteor Steel process';

  return `You are Atlas, the mythic companion of the Mythouse. A traveler is sharing personal experiences along the wheel of ${journeyLabel}.

They are currently at the "${stageLabel}" stage.

THEMATIC CONTENT FOR THIS STAGE (use this to understand the stage's mythic patterns, not to test knowledge):
${stageContent}

INSTRUCTIONS:
1. The traveler is sharing a personal experience related to this stage's themes.
2. Receive their story with warmth. Reflect back any mythic patterns you see in what they shared — gently, without lecturing.
3. Be very generous with passing. If they share something genuine — even brief — pass them. Do NOT test their knowledge of the theory.
4. Do NOT ask follow-up questions that delay them. One warm reflection is enough.
5. Stay in character as Atlas — warm, perceptive, honoring of vulnerability.
6. Keep responses brief and warm (2-3 sentences + the result tag).
7. At the END of your response, on a new line, append exactly this tag:
   <ybr-result>{"passed": true}</ybr-result>
   or
   <ybr-result>{"passed": false}</ybr-result>`;
}

function buildFusedJourneyPrompt(stageId, aspect, gameMode) {
  const labels = WHEEL_JOURNEY_LABELS.fused;
  const stageLabel = labels[stageId] || stageId;
  const monomythContent = getWheelStageContent('monomyth', stageId);
  const steelContent = getWheelStageContent('meteor-steel', stageId);
  const bothContent = `MONOMYTH CONTENT FOR THIS STAGE:\n${monomythContent}\n\nMETEOR STEEL CONTENT FOR THIS STAGE:\n${steelContent}`;

  if (gameMode === 'story') {
    if (aspect === 'monomyth') {
      return `You are Atlas, the mythic companion of the Mythouse. A traveler is building a fictional story along a fused wheel — monomyth and meteor steel combined.\n\nThey are currently at the "${stageLabel}" stage, MONOMYTH PHASE.\n\n${bothContent}\n\nINSTRUCTIONS:\n1. The traveler is creating a story. They should offer a scene, character moment, or turning point that fits this stage's MONOMYTH themes — the hero's journey.\n2. If their contribution is very thin, gently encourage more detail. Do NOT test knowledge.\n3. If they offer any meaningful story element, pass them. Be generous.\n4. Reflect back what they've created with warmth. Hint that the forge phase comes next.\n5. Stay in character as Atlas — warm, wise, a creative companion.\n6. Keep responses brief (2-4 sentences + the result tag).\n7. At the END of your response, on a new line, append exactly this tag:\n   <ybr-result>{"passed": true}</ybr-result>\n   or\n   <ybr-result>{"passed": false}</ybr-result>`;
    }
    return `You are Atlas, the mythic companion of the Mythouse. A traveler is building a fictional story along a fused wheel — monomyth and meteor steel combined.\n\nThey are currently at the "${stageLabel}" stage, METEOR STEEL PHASE.\n\n${bothContent}\n\nINSTRUCTIONS:\n1. The traveler already created a monomyth scene for this stage. Now they're adding the METEOR STEEL dimension — how the forge deepens or transforms their story.\n2. If their contribution is very thin, gently encourage more. Do NOT test knowledge.\n3. If they offer any meaningful creative element connecting to the forge/steel metaphor, pass them. Be generous.\n4. Reflect how the two dimensions weave together.\n5. Stay in character as Atlas — warm, wise, a creative companion.\n6. Keep responses brief (2-4 sentences + the result tag).\n7. At the END of your response, on a new line, append exactly this tag:\n   <ybr-result>{"passed": true}</ybr-result>\n   or\n   <ybr-result>{"passed": false}</ybr-result>`;
  }

  if (gameMode === 'personal') {
    if (aspect === 'monomyth') {
      return `You are Atlas, the mythic companion of the Mythouse. A traveler is sharing personal experiences along a fused wheel — monomyth and meteor steel combined.\n\nThey are currently at the "${stageLabel}" stage, MONOMYTH PHASE.\n\n${bothContent}\n\nINSTRUCTIONS:\n1. The traveler is sharing a personal experience related to this stage's MONOMYTH themes — the hero's journey.\n2. Receive their story with warmth. Reflect any mythic patterns gently.\n3. Be very generous with passing. If they share something genuine, pass them. Do NOT test knowledge.\n4. Do NOT ask follow-up questions that delay them. One warm reflection is enough. Hint that the forge phase comes next.\n5. Stay in character as Atlas — warm, perceptive, honoring of vulnerability.\n6. Keep responses brief (2-3 sentences + the result tag).\n7. At the END of your response, on a new line, append exactly this tag:\n   <ybr-result>{"passed": true}</ybr-result>\n   or\n   <ybr-result>{"passed": false}</ybr-result>`;
    }
    return `You are Atlas, the mythic companion of the Mythouse. A traveler is sharing personal experiences along a fused wheel — monomyth and meteor steel combined.\n\nThey are currently at the "${stageLabel}" stage, METEOR STEEL PHASE.\n\n${bothContent}\n\nINSTRUCTIONS:\n1. The traveler already shared a monomyth experience for this stage. Now ask how the meteor steel metaphor illuminates what they shared — forging, tempering, transformation through fire.\n2. Receive with warmth. Reflect how the steel metaphor deepens what they already shared.\n3. Be very generous. If they engage with the forge/steel metaphor at all, pass them. Do NOT test knowledge.\n4. Stay in character as Atlas — warm, perceptive, honoring of vulnerability.\n5. Keep responses brief (2-3 sentences + the result tag).\n6. At the END of your response, on a new line, append exactly this tag:\n   <ybr-result>{"passed": true}</ybr-result>\n   or\n   <ybr-result>{"passed": false}</ybr-result>`;
  }

  // Riddle mode
  if (aspect === 'monomyth') {
    return `You are Atlas, the mythic companion of the Mythouse. You are testing a traveler on a fused wheel — monomyth and meteor steel combined.\n\nThey are currently at the "${stageLabel}" stage, MONOMYTH PHASE.\n\n${bothContent}\n\nINSTRUCTIONS:\n1. The traveler must describe what happens at this stage from the MONOMYTH perspective — the hero's journey. Key events, themes, transformations.\n2. If their answer is vague, surface-level, or wrong, gently correct, offer a hint, and ask them to try again.\n3. If they demonstrate real understanding of the monomyth dimension, pass them.\n4. Hint that the forge phase comes next.\n5. Stay in character as Atlas — warm, wise, grounded.\n6. Keep responses brief (2-4 sentences + the result tag).\n7. At the END of your response, on a new line, append exactly this tag:\n   <ybr-result>{"passed": true}</ybr-result>\n   or\n   <ybr-result>{"passed": false}</ybr-result>`;
  }
  return `You are Atlas, the mythic companion of the Mythouse. You are testing a traveler on a fused wheel — monomyth and meteor steel combined.\n\nThey are currently at the "${stageLabel}" stage, METEOR STEEL PHASE.\n\n${bothContent}\n\nINSTRUCTIONS:\n1. The traveler already passed the monomyth phase. Now they must show how this stage connects to the METEOR STEEL process — the forge, the metallurgy, the transformation of raw material.\n2. If their answer is vague or misses the steel/forge dimension, gently correct and ask again.\n3. If they demonstrate understanding of how the hero's journey meets the forge at this stage, pass them.\n4. Stay in character as Atlas — warm, wise, grounded.\n5. Keep responses brief (2-4 sentences + the result tag).\n6. At the END of your response, on a new line, append exactly this tag:\n   <ybr-result>{"passed": true}</ybr-result>\n   or\n   <ybr-result>{"passed": false}</ybr-result>`;
}

// --- Profile Onboarding tool + prompt ---

const UPDATE_PROFILE_TOOL = {
  name: 'update_profile',
  description: 'Update a professional credential category for the user. Call this as soon as you have enough information to assign a level for a category. You may call it multiple times during the conversation — once per category.',
  input_schema: { type: 'object', properties: { category: { type: 'string', enum: ['scholar', 'mediaVoice', 'storyteller', 'healer', 'adventurer', 'curator'] }, level: { type: 'integer', description: '1-4 depending on category' }, details: { type: 'string', description: 'Brief summary of what the user shared that justifies this level' } }, required: ['category', 'level', 'details'] },
};

const UPDATE_NATAL_CHART_TOOL = {
  name: 'update_natal_chart',
  description: 'Save computed natal chart to user profile. Call this after receiving compute_natal_chart result, passing the full chart object.',
  input_schema: { type: 'object', properties: { chartData: { type: 'object', description: 'Full natal chart result from compute_natal_chart' } }, required: ['chartData'] },
};

const APPROVE_CURATOR_TOOL = {
  name: 'approve_curator',
  description: 'Grant curator permissions to add products to the Curated Collection. Call this when a level 2+ curator accepts the offer to contribute to the store.',
  input_schema: { type: 'object', properties: { approved: { type: 'boolean', description: 'Whether the user accepted curator permissions' } }, required: ['approved'] },
};

function buildProfileOnboardingPrompt(existingCredentials, existingNatalChart) {
  const existing = existingCredentials || {};
  const existingList = Object.entries(existing)
    .filter(([, d]) => d && d.level > 0)
    .map(([cat, d]) => `${cat}: level ${d.level} — ${d.details || 'no details'}`)
    .join('\n');

  return `You are Atlas, the mythic companion of the Mythouse. You are having a conversation to learn about a member's professional background and lived experience — to understand who they are beyond their coursework.

THERE ARE SIX CREDENTIAL CATEGORIES. Go through them conversationally:

1. **Scholar** — Academic credentials in mythology, depth psychology, philosophy, anthropology, or related fields.
   - Level 1: Has academic credentials (degree, certification, or equivalent study)
   - Level 2: Teaches at the collegiate or university level
   - Level 3: Full professor with published research

2. **Media Voice** — Work in media, podcasts, digital content, broadcasting.
   - Level 1: Active in podcasts, web content, or digital media
   - Level 2: Television, radio, or documentary work

3. **Storyteller** — Writing, oral storytelling, narrative craft.
   - Level 1: Active writer or oral storyteller
   - Level 2: Published work or professional sales
   - Level 3: Work with six-figure budgets or major distribution
   - Level 4: Has a recognized hit or landmark work

4. **Healer** — Coaching, therapy, psychological practice.
   - Level 1: Coach, therapist, or psychological practitioner
   - Level 2: Years of practice with established clientele
   - Level 3: Well-known practice or significant body of therapeutic work

5. **Adventurer** — Travel to mythic sites, fieldwork, experiential mythology.
   - Level 1: Has traveled to mythic sites or engaged with myth in the field
   - Level 2: Research expeditions, archaeological digs, or led mythic coursework
   - Level 3: Has visited the Seven Wonders or equivalent mythic pilgrimage

6. **Curator** — Curation, art dealing, resale, gallery work, space design.
   - Level 1: Curates or sells things casually / hobby
   - Level 2: Professional curator, gallery work, professional resale, space design
   - Level 3: Established practice with significant portfolio or reputation

## CURATOR PERMISSIONS
If a user is assigned Curator level 2 or higher, offer them the ability to contribute products directly to the Mythouse Curated Collection (our community-curated store page).
- Say something like: "As a professional curator, you're eligible to contribute directly to our Curated Collection — a community-curated store of treasures. Would you like me to activate those permissions for you?"
- If they accept, call the approve_curator tool with approved=true.
- If they decline, that's fine — move on. No pressure.

INSTRUCTIONS:
- Start by warmly asking which of these categories they identify with. List them briefly and invitingly.
- Do NOT go through all five as a checklist. Ask which resonate, then explore those.
- For each category they identify with, ask enough to determine the right tier. One or two follow-up questions is usually enough.
- Call the update_profile tool AS SOON as you can assign a level — don't wait until the end. This saves partial progress.
- If they don't identify with a category, skip it gracefully.
- Keep the conversation to 5-10 exchanges total. Be warm and mythic but concise.
- On return visits, acknowledge existing credentials and ask if anything has changed.
${existingList ? `\nEXISTING CREDENTIALS (the user already has these — acknowledge them):\n${existingList}` : ''}

VOICE:
- You are Atlas — warm, curious, grounded. Not a form. Not an interview. A conversation between companions.
- "Tell me about your path..." not "Please list your qualifications."
- Celebrate what they share. Connect it to the mythic when natural.

## NATAL CHART PHASE — after credentials are complete

After you've finished exploring all credential categories the user identifies with (or they indicate they're done), offer to compute their natal chart:

"Would you like to share your birthday so I can generate your natal chart? This will let you ask astrological questions about yourself and explore readings across different cultural traditions."

**If they accept:**
1. Ask for: birth date, birth time (tell them it's optional — without it you can still compute planet positions, just not Ascendant/houses), and birth city.
2. Call compute_natal_chart with proper coordinates and utcOffset.
   - You know approximate lat/lon for most world cities. Use your best knowledge.
   - utcOffset must account for DST on their birth date:
     US Eastern: Std=-5, DST=-4. US Central: Std=-6, DST=-5. US Mountain: Std=-7, DST=-6. US Pacific: Std=-8, DST=-7.
     DST rules: 2nd Sun Mar → 1st Sun Nov (2007+); 1st Sun Apr → last Sun Oct (before 2007).
     GMT=0, UK BST=+1, CET=+1, CEST=+2, India IST=+5.5, Japan JST=+9.
   - Use hour=-1 if birth time unknown.
3. After receiving the chart result, call update_natal_chart with the full chart data to save it.
4. Give a brief Big Three summary (Sun sign, Moon sign, Rising sign if available). Keep it to 2-3 sentences — save the full reading for later Atlas conversations.
5. Then wrap up the conversation warmly.

**If they decline:** "No worries — the stars will be there whenever you're ready." Then wrap up.

${existingNatalChart ? `EXISTING NATAL CHART: The user already has a chart on file (Sun in ${existingNatalChart.planets?.[0]?.sign || '?'}, Moon in ${existingNatalChart.planets?.[1]?.sign || '?'}). Acknowledge this and offer to recalculate if their birth data has changed, rather than asking from scratch.` : ''}`;
}

// --- Tarot Reading prompt builders ---

function buildTarotIntentionPrompt(cultureLabel) {
  return `You are Atlas, the mythic companion of the Mythouse. A traveler has come to you for a three-card tarot reading from the ${cultureLabel} deck.\n\nYOUR TASK: Help the traveler set their intention for this reading. Ask warmly what this reading is about — what question, situation, or feeling they'd like to explore.\n\nRULES:\n- Keep responses to 2-4 sentences. Be warm, present, and inviting.\n- After the traveler shares their intention (typically after 1-2 exchanges, at most 3), confirm what you've heard and emit the tag <tarot-ready></tarot-ready> at the very end of your message.\n- Do NOT interpret cards, reference specific cards, or discuss positions. This phase is purely about listening and setting intention.\n- Speak in Atlas's warm, mythic voice — grounded but not theatrical.`;
}

function buildTarotInterpretationPrompt(cultureLabel, cards, intention) {
  const cardDescriptions = cards.map(c => {
    const corrLabel = c.type ? `${c.type}: ${c.correspondence}` : '';
    return `- **${c.position.toUpperCase()}**: #${c.number} ${c.name}${c.description ? ` — ${c.description}` : ''}${corrLabel ? ` [${corrLabel}]` : ''}`;
  }).join('\n');

  return `You are Atlas, the mythic companion of the Mythouse. A traveler has drawn three cards from the ${cultureLabel} deck and asks for your interpretation.\n\nTHE TRAVELER'S INTENTION:\n"${intention}"\n\nTHE THREE CARDS DRAWN:\n${cardDescriptions}\n\nYOUR TASK: Interpret this reading.\n1. Read each card in its position (Past, Present, Future) — what does it illuminate about the traveler's question?\n2. Weave in cultural mythology from the ${cultureLabel} tradition where the card names and stories are drawn.\n3. Connect correspondences — planets to metals, zodiac signs to elements, elements to seasons. Let the web of meaning enrich the reading.\n4. Find the narrative arc across all three cards — what story do they tell together?\n5. Close with a grounding reflection — something the traveler can carry with them.\n\nRULES:\n- 300-500 words. Rich but not overwhelming.\n- Warm, mythic Atlas voice. Speak as a guide, not a fortune-teller.\n- NO predictions or fortune-telling. Offer perspective, reflection, possibility.\n- Honor the specific cards drawn and the traveler's stated intention.\n- You may use the traveler's own words when reflecting their intention back.`;
}

// ════════════════════════════════════════════════════════════════════
// Handler
// ════════════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const userKeys = await getUserKeys(uid);
  const isByok = !!userKeys.anthropicKey;

  if (!isByok) {
    if (!checkRateLimit(uid)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment before asking another question.' });
    }
  }

  // --- Usage tier enforcement ---
  let usageTier = 'free';
  let usageTierConfig = getTierConfig('free');
  let usageMonthKey = null;
  let messagesUsedThisMonth = 0;

  if (ensureFirebaseAdmin()) {
    const firestore = admin.firestore();
    const [usageSnap, profileSnap] = await Promise.all([
      firestore.doc(`users/${uid}/meta/usage`).get(),
      firestore.doc(`users/${uid}/meta/profile`).get(),
    ]);
    const usageData = usageSnap.exists ? usageSnap.data() : {};
    const profileData = profileSnap.exists ? profileSnap.data() : {};
    usageTier = getUserTier(profileData);
    usageTierConfig = getTierConfig(usageTier);

    // TODO: Pre-paywall auto-grant — permanently write tier-journeyer for active users.
    // Remove this block when ready to enforce paid tiers.
    const subs = profileData?.subscriptions || {};
    if (!subs['tier-keeper'] && !subs['tier-journeyer'] && !JOURNEYER_SUBS.some(id => subs[id])) {
      firestore.doc(`users/${uid}/meta/profile`).set({
        subscriptions: { 'tier-journeyer': true },
      }, { merge: true }).catch(err => console.error('Auto-grant tier failed:', err?.message));
    }
    const monthKey = getCurrentMonthKey();
    usageMonthKey = usageData.monthKey || null;
    messagesUsedThisMonth = usageData.messagesThisMonth || 0;
    if (usageMonthKey !== monthKey) messagesUsedThisMonth = 0;

    if (!isByok && messagesUsedThisMonth >= usageTierConfig.monthlyMessages) {
      return res.status(429).json({
        limitReached: true,
        tier: usageTier,
        tierLabel: usageTierConfig.label,
        used: messagesUsedThisMonth,
        limit: usageTierConfig.monthlyMessages,
        error: `You've reached your monthly message limit of ${usageTierConfig.monthlyMessages} messages on the ${usageTierConfig.label} plan. Upgrade for more messages, or add your own API key for unlimited use.`,
      });
    }
  }

  // Helper: send 200 response and fire-and-forget usage increment
  function sendAndTrack(body) {
    if (ensureFirebaseAdmin()) {
      const monthKey = getCurrentMonthKey();
      const firestore = admin.firestore();
      const chatMode = (req.body || {}).mode || 'atlas';
      const safeMode = String(chatMode).replace(/[^a-zA-Z0-9_-]/g, '_');
      const needsReset = usageMonthKey !== monthKey;

      const update = {
        totalMessages: admin.firestore.FieldValue.increment(1),
        monthKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (needsReset) {
        update.messagesThisMonth = 1;
        update.modeBreakdown = { [safeMode]: 1 };
      } else {
        update.messagesThisMonth = admin.firestore.FieldValue.increment(1);
        update[`modeBreakdown.${safeMode}`] = admin.firestore.FieldValue.increment(1);
      }

      firestore.doc(`users/${uid}/meta/usage`).set(update, { merge: true })
        .catch(err => console.error('Usage tracking failed:', err?.message));

      // Periodically re-estimate storage (every 100 messages)
      if ((messagesUsedThisMonth + 1) % 100 === 0) {
        updateStorageEstimate(uid).catch(() => {});
      }
    }
    return sendAndTrack(body);
  }

  const { messages, area, persona, mode, challengeStop, level, journeyId, stageId, gameMode, stageData, aspect, courseSummary, episodeContext, situationalContext, existingCredentials, existingNatalChart, qualifiedMentorTypes, uploadedDocument, tarotPhase, tarotCards, tarotIntention, culture, template, stageContent, targetStage, stageEntries, adjacentDrafts, requestDraft, drafts, completionType, completionData, currentSummary, currentFullStory, clientType, engagementContext } = req.body || {};

  // --- Story Forge mode (narrative generation via OpenAI) ---
  if (mode === 'forge') {
    if (!template || !Array.isArray(stageContent) || stageContent.length === 0) {
      return res.status(400).json({ error: 'Template and stageContent are required.' });
    }
    const userContent = stageContent.map(s => `=== ${s.stageId} (${s.label}) ===\n${s.entries.join('\n')}`).join('\n\n');
    const stageInstruction = targetStage
      ? `Generate ONLY the chapter for the stage marked "${targetStage}". Weave the user's notes for this stage into polished narrative prose. Reference material from other stages for continuity but focus on this chapter. Still use the === stage-id === format around it.`
      : `Weave ALL the user's material into a cohesive narrative with one chapter per monomyth stage. Transform their raw notes into polished prose while preserving their voice, images, and meaning.`;
    const forgeSystemPrompt = `You are a master storyteller and narrative architect. You weave raw material — notes, reflections, and creative fragments — into cohesive narrative.\n\nThe user is writing a ${template}. Their material follows the 8-stage monomyth cycle:\n1. Golden Age (golden-age)\n2. Calling Star (falling-star)\n3. Crater Crossing (impact-crater)\n4. Trials of Forge (forge)\n5. Quench (quenching)\n6. Integration (integration)\n7. Draw (drawing)\n8. Age of Steel (new-age)\n\n${stageInstruction}\n\nFormat: Precede each chapter with a line === stage-id === (using the parenthetical id above, e.g. === golden-age ===). Keep each chapter 200-400 words. Be literary but accessible. Match the tone to the template type.`;
    const openai = getOpenAIClient(userKeys.openaiKey);
    try {
      const completion = await openai.chat.completions.create({ model: MODELS.narrative, messages: [{ role: 'system', content: forgeSystemPrompt }, { role: 'user', content: userContent }], max_tokens: 4000, temperature: 0.8 });
      return sendAndTrack({ story: completion.choices[0]?.message?.content || '' });
    } catch (err) {
      console.error('Forge API error:', err?.message, err?.status);
      if (err.status === 401 && !!userKeys.openaiKey) return res.status(401).json({ error: 'Your OpenAI API key is invalid or expired. Please update it in your profile settings.', keyError: true });
      return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
    }
  }

  // --- Conversational Forge Draft mode ---
  if (mode === 'forge-draft') {
    if (!stageId || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'stageId and messages are required.' });
    const stageText = monomyth[stageId] || '';
    let atlasExcerpt = '';
    const atlasMatch = stageText.match(/(?:ATLAS:\s*)([\s\S]*?)(?=\n\n[A-Z]+:|$)/);
    if (atlasMatch) atlasExcerpt = atlasMatch[1].trim().slice(0, 600);
    const rawMaterial = (stageEntries || []).map(e => `[${e.mode}] ${e.text}`).join('\n');
    const adjPrev = adjacentDrafts?.previous ? adjacentDrafts.previous.slice(0, 500) : '';
    const adjNext = adjacentDrafts?.next ? adjacentDrafts.next.slice(0, 500) : '';
    const adjContext = [adjPrev && `PREVIOUS STAGE DRAFT:\n${adjPrev}`, adjNext && `NEXT STAGE DRAFT:\n${adjNext}`].filter(Boolean).join('\n\n');
    const draftSystemPrompt = `You are Atlas, a story collaborator working with the writer on their ${template || 'Personal Myth'}. You are helping them develop the "${stageId}" stage of their monomyth narrative.\n\nYOUR ROLE: Ask questions, notice what's vivid, suggest ways to deepen. Be conversational (3-5 sentences). Never rewrite the user's material without being asked. You are an editor, not a ghostwriter.\n\nSTAGE CONTEXT:\n${atlasExcerpt}\n\nTHE WRITER'S RAW MATERIAL FOR THIS STAGE:\n${rawMaterial || '(No entries yet — help them get started.)'}\n\n${adjContext ? `NEIGHBORING DRAFTS (for continuity):\n${adjContext}` : ''}\n\nTOOLS:\n- You have a "suggest_mythic_parallel" tool. Use it AT MOST once per exchange, and ONLY when you notice a genuinely striking parallel between the writer's material and a mythic tradition. Do not force it.\n- You have a "produce_draft" tool. Use it when the user explicitly asks for a draft, or when requestDraft is true. The draft should be 200-400 words of polished prose that preserves the writer's voice.\n\n${requestDraft ? 'The user has requested a polished draft. Use the produce_draft tool.' : ''}`;
    const raw = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const trimmed = [];
    for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } }
    if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: isByok ? MODELS.quality : MODELS.fast, max_tokens: 2000, system: draftSystemPrompt, messages: trimmed, tools: [{ name: 'suggest_mythic_parallel', description: 'Surface a striking parallel between the writer\'s material and a mythic tradition. Use sparingly — at most once per exchange.', input_schema: { type: 'object', properties: { parallel: { type: 'string', description: 'The mythic parallel observed' }, source: { type: 'string', description: 'The mythic tradition or source' }, suggestion: { type: 'string', description: 'A brief suggestion for how this parallel could enrich the writing' } }, required: ['parallel', 'source', 'suggestion'] } }, { name: 'produce_draft', description: 'Produce a polished 200-400 word draft passage for this stage.', input_schema: { type: 'object', properties: { draft: { type: 'string', description: 'The polished draft passage (200-400 words)' } }, required: ['draft'] } }] });
      let reply = '', draft = null, mythicParallel = null;
      for (const block of response.content) { if (block.type === 'text') { reply += block.text; } else if (block.type === 'tool_use') { if (block.name === 'suggest_mythic_parallel') mythicParallel = block.input; else if (block.name === 'produce_draft') draft = block.input.draft; } }
      return sendAndTrack({ reply, draft, mythicParallel });
    } catch (err) {
      console.error('Forge draft API error:', err?.message, err?.status);
      if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired. Please update it in your profile settings.', keyError: true });
      return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
    }
  }

  // --- Conversational Forge Assemble mode ---
  if (mode === 'forge-assemble') {
    if (!drafts || typeof drafts !== 'object' || Object.keys(drafts).length === 0) return res.status(400).json({ error: 'Drafts object is required.' });
    const stageOrder = ['golden-age', 'falling-star', 'impact-crater', 'forge', 'quenching', 'integration', 'drawing', 'new-age'];
    const draftContent = stageOrder.filter(id => drafts[id]).map(id => `=== ${id} ===\n${drafts[id]}`).join('\n\n');
    const assemblePrompt = `You are a master narrative editor. The writer has drafted individual passages for stages of their ${template || 'Personal Myth'} monomyth. Weave these stage drafts into a continuous narrative.\n\nINSTRUCTIONS:\n- Preserve the writer's voice, imagery, and meaning\n- Smooth transitions between stages\n- Maintain the === stage-id === delimiters before each section\n- Keep each section close to its original length — do not substantially expand or cut\n- Be literary but accessible. Match the tone to the template type.`;
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: isByok ? MODELS.quality : MODELS.fast, max_tokens: 4000, system: assemblePrompt, messages: [{ role: 'user', content: draftContent }] });
      return sendAndTrack({ story: response.content.map(b => b.text || '').join('') });
    } catch (err) {
      console.error('Forge assemble API error:', err?.message, err?.status);
      if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired. Please update it in your profile settings.', keyError: true });
      return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
    }
  }

  // --- Protagonism / Antagonism Generator mode ---
  if (mode === 'protagonism' || mode === 'antagonism') {
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Messages array is required.' });
    const raw = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const trimmed = []; for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } } if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();
    const polarityPrompt = mode === 'protagonism' ? `You are a narrative instrument. You read antagonism and respond with protagonism. You do not analyze sources, evaluate truth claims, discuss people, or fact-check. You read the narrative force — the polarity.\n\nWhatever antagonism is presented, you respond with the equal-and-opposite protagonistic force it inspires. Speak in terms of forces, not people. Antagonism and protagonism. What does this darkness call forth? What light does it demand?\n\nKeep responses concise (150-300 words), poetic but grounded. Do not summarize or restate what the user wrote. Respond only with the protagonism.` : `You are a narrative instrument. You read protagonism and respond with antagonism. You do not analyze sources, evaluate truth claims, discuss people, or fact-check. You read the narrative force — the polarity.\n\nWhatever protagonism is presented, you respond with the equal-and-opposite antagonistic force it reveals. Speak in terms of forces, not people. Protagonism and antagonism. What shadow does this light cast? What resistance does it provoke? What is the cost, the tension, the opposing current beneath the surface?\n\nKeep responses concise (150-300 words), poetic but grounded. Do not summarize or restate what the user wrote. Respond only with the antagonism.`;
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.quality, max_tokens: 1500, system: polarityPrompt, messages: trimmed });
      return sendAndTrack({ reply: response.content.map(b => b.text || '').join('') });
    } catch (err) {
      console.error(`${mode} API error:`, err?.message, err?.status);
      if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired. Please update it in your profile settings.', keyError: true });
      return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
    }
  }

  // --- Tarot Reading mode ---
  if (mode === 'tarot-reading') {
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Messages array is required.' });
    const raw = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const tarotTrimmed = []; for (const msg of raw) { if (tarotTrimmed.length > 0 && tarotTrimmed[tarotTrimmed.length - 1].role === msg.role) { tarotTrimmed[tarotTrimmed.length - 1].content += '\n' + msg.content; } else { tarotTrimmed.push({ ...msg }); } } if (tarotTrimmed.length > 0 && tarotTrimmed[0].role !== 'user') tarotTrimmed.shift();
    const CULTURE_LABELS = { tarot: 'Tarot', roman: 'Roman', greek: 'Greek', norse: 'Norse', babylonian: 'Babylonian', vedic: 'Vedic', islamic: 'Islamic', christian: 'Medieval Christianity' };
    const cultureLabel = CULTURE_LABELS[culture] || culture || 'Tarot';
    const isInterpretation = tarotPhase === 'interpretation';
    const systemPrompt = isInterpretation ? buildTarotInterpretationPrompt(cultureLabel, tarotCards || [], tarotIntention || '') : buildTarotIntentionPrompt(cultureLabel);
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: tarotTrimmed, max_tokens: isInterpretation ? 2048 : 512 });
      let reply = response.content?.find(c => c.type === 'text')?.text || 'No response generated.';
      if (!isInterpretation) { const hasReadyTag = /<tarot-ready><\/tarot-ready>/.test(reply); reply = reply.replace(/<tarot-ready><\/tarot-ready>/g, '').trim(); return sendAndTrack({ reply, readyToDraw: hasReadyTag || undefined }); }
      return sendAndTrack({ reply });
    } catch (err) {
      console.error('Tarot Reading API error:', err?.message, err?.status);
      return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
    }
  }

  // --- Journey Synthesis mode ---
  if (mode === 'journey-synthesis') {
    if (!journeyId || !gameMode || !Array.isArray(stageData)) return res.status(400).json({ error: 'journeyId, gameMode, and stageData are required for synthesis.' });
    const journeyLabel = journeyId === 'fused' ? 'the Fused Journey (Monomyth & Meteor Steel)' : journeyId === 'monomyth' ? "the Hero's Journey (Monomyth)" : 'the Meteor Steel process';
    const stageBlock = stageData.map(s => `### ${s.stageLabel}\n${(s.userMessages || []).join('\n')}`).join('\n\n');
    let systemPrompt;
    if (gameMode === 'story') { systemPrompt = `You are Atlas. A traveler has walked the full wheel of ${journeyLabel}, building a story at each stage. Below are the story elements they created at each stage.\n\nWeave these fragments into a single, cohesive narrative. Honor their ideas and characters. Add connective tissue so it reads as one flowing story. Match the mythic rhythm of the journey. 800-1500 words. Be literary but accessible. Preserve the traveler's voice and ideas.\n\nSTORY FRAGMENTS BY STAGE:\n${stageBlock}`; }
    else { systemPrompt = `You are Atlas. A traveler has walked the full wheel of ${journeyLabel}, sharing personal experiences at each stage. Below are the experiences they shared.\n\nWeave their experiences into a mythic biography in third person. Show how their life follows the pattern of the monomyth. Honor the vulnerability of what they shared. 600-1200 words. Be warm, perceptive, and honoring.\n\nPERSONAL EXPERIENCES BY STAGE:\n${stageBlock}`; }
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.quality, system: systemPrompt, messages: [{ role: 'user', content: 'Please weave my journey into a complete narrative.' }], max_tokens: 4096 });
      return sendAndTrack({ story: response.content?.find(c => c.type === 'text')?.text || 'No narrative generated.' });
    } catch (err) { console.error('Synthesis API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Story Match mode ---
  if (mode === 'story-match') {
    if (!uid) return res.status(401).json({ error: 'Unauthorized.' });
    if (!ensureFirebaseAdmin()) return res.status(500).json({ error: 'Server not configured.' });
    const targetUid = req.body?.targetUid || req.body?.friendUid;
    const conversationId = req.body?.conversationId || null;
    if (!targetUid || typeof targetUid !== 'string') return res.status(400).json({ error: 'targetUid is required.' });
    if (targetUid === uid) return res.status(400).json({ error: 'Cannot match with yourself.' });
    const CACHE_DAYS = 7, MAX_CARDS = 20, SUMMARY_CHARS = 150;
    const firestore = admin.firestore();
    try {
      const [myProfileSnap, targetProfileSnap] = await Promise.all([firestore.doc(`match-profiles/${uid}`).get(), firestore.doc(`match-profiles/${targetUid}`).get()]);
      if (!myProfileSnap.exists) return res.status(403).json({ error: 'You must enable matching first.' });
      if (!targetProfileSnap.exists) return res.status(403).json({ error: 'Target user does not have matching enabled.' });
      const myMode = myProfileSnap.data()?.mode || 'friends';
      if (myMode === 'friends') { const friendReqs = firestore.collection('friend-requests'); const [sent, received] = await Promise.all([friendReqs.where('senderUid', '==', uid).where('recipientUid', '==', targetUid).where('status', '==', 'accepted').limit(1).get(), friendReqs.where('senderUid', '==', targetUid).where('recipientUid', '==', uid).where('status', '==', 'accepted').limit(1).get()]); if (sent.empty && received.empty) return res.status(403).json({ error: 'Not friends with this user.' }); }
      else if (myMode === 'family') { const friendReqsFamily = firestore.collection('friend-requests'); const [sentFam, receivedFam] = await Promise.all([friendReqsFamily.where('senderUid', '==', uid).where('recipientUid', '==', targetUid).where('status', '==', 'accepted').where('relationship', '==', 'family').limit(1).get(), friendReqsFamily.where('senderUid', '==', targetUid).where('recipientUid', '==', uid).where('status', '==', 'accepted').where('relationship', '==', 'family').limit(1).get()]); if (sentFam.empty && receivedFam.empty) return res.status(403).json({ error: 'Not a family connection.' }); }
      else if (myMode === 'romantic') { const targetMode = targetProfileSnap.data()?.mode || 'friends'; if (targetMode !== 'romantic' && targetMode !== 'new-friends') return res.status(403).json({ error: 'Target is not in a compatible mode.' }); const frFamily = firestore.collection('friend-requests'); const [sFam, rFam] = await Promise.all([frFamily.where('senderUid', '==', uid).where('recipientUid', '==', targetUid).where('status', '==', 'accepted').where('relationship', '==', 'family').limit(1).get(), frFamily.where('senderUid', '==', targetUid).where('recipientUid', '==', uid).where('status', '==', 'accepted').where('relationship', '==', 'family').limit(1).get()]); if (!sFam.empty || !rFam.empty) return res.status(403).json({ error: 'Cannot romantically match with family members.' }); }
      const cacheRef = firestore.doc(`match-profiles/${uid}/comparisons/${targetUid}`);
      const cached = await cacheRef.get();
      if (cached.exists) { const data = cached.data(); const expiresAt = data.expiresAt?.toMillis?.() || 0; if (expiresAt > Date.now()) return sendAndTrack(data); }
      const [myCardsSnap, theirCardsSnap] = await Promise.all([firestore.collection(`users/${uid}/story-cards`).get(), firestore.collection(`users/${targetUid}/story-cards`).get()]);
      const serialize = (snap, ownerUid) => { const cards = []; snap.forEach(d => { const data = d.data(); cards.push({ title: data.title || '', category: data.category || '', summary: (data.summary || '').substring(0, SUMMARY_CHARS), visibility: data.visibility || 'public', sourceId: d.id, ownerUid }); }); return cards.slice(0, MAX_CARDS); };
      const myCards = serialize(myCardsSnap, uid), theirCards = serialize(theirCardsSnap, targetUid);
      if (myCards.length === 0 || theirCards.length === 0) return sendAndTrack({ score: 0, summary: 'Not enough story cards to compare.', highlights: [], computedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + CACHE_DAYS * 86400000).toISOString() });
      const hasVault = myCards.some(c => c.visibility === 'vault') || theirCards.some(c => c.visibility === 'vault');
      const vaultInstructions = hasVault ? `\n\nIMPORTANT: Some cards are marked [VAULT]. For any match involving a vault card, do NOT reveal the card's actual content. Instead, generate a vague thematic hint about the connection. Mark vault highlights with "isVault": true, the "ownerUid" of the vault card owner, and the "cardSourceId".` : '';
      const matchPrompt = `Compare these two users' story card collections and find thematic connections, shared archetypes, and narrative patterns.${vaultInstructions}\n\nUser A's cards:\n${myCards.map(c => `- [${c.category}]${c.visibility === 'vault' ? ' [VAULT]' : ''} ${c.title}: ${c.summary}`).join('\n')}\n\nUser B's cards:\n${theirCards.map(c => `- [${c.category}]${c.visibility === 'vault' ? ' [VAULT]' : ''} ${c.title}: ${c.summary}`).join('\n')}\n\nRespond with valid JSON only, no markdown:\n{\n  "score": <0-100 story resonance score>,\n  "summary": "<2-3 sentence narrative about their shared themes>",\n  "highlights": [\n    { "category": "<theme category>", "label": "<short label>", "detail": "<one sentence>"${hasVault ? ', "isVault": <boolean>, "ownerUid": "<uid or null>", "cardSourceId": "<sourceId or null>"' : ''} }\n  ]\n}`;
      const anthropic = getAnthropicClient(userKeys.anthropicKey);
      const response = await anthropic.messages.create({ model: MODELS.fast, max_tokens: 500, messages: [{ role: 'user', content: matchPrompt }] });
      const text = response.content?.[0]?.text || '{}';
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = { score: 0, summary: 'Could not analyze stories.', highlights: [] }; }
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CACHE_DAYS * 86400000);
      // Build a Set of actual vault sourceIds from the card data (ground truth)
      const vaultSourceIds = new Set([...myCards, ...theirCards].filter(c => c.visibility === 'vault').map(c => c.sourceId));
      const vaultOwnerBySourceId = Object.fromEntries([...myCards, ...theirCards].filter(c => c.visibility === 'vault').map(c => [c.sourceId, c.ownerUid]));
      // Enforce vault status on highlights using actual card data, not AI output
      const highlights = (parsed.highlights || []).slice(0, 5).map(h => {
        const isActuallyVault = h.cardSourceId ? vaultSourceIds.has(h.cardSourceId) : false;
        return { ...h, isVault: isActuallyVault, ownerUid: isActuallyVault ? (vaultOwnerBySourceId[h.cardSourceId] || h.ownerUid || null) : null };
      });
      const vaultHints = highlights.filter(h => h.isVault).map(h => ({ ownerUid: h.ownerUid, cardCategory: h.category, hintText: h.detail, cardSourceId: h.cardSourceId || null }));
      const result = { score: Math.min(100, Math.max(0, parsed.score || 0)), summary: (parsed.summary || '').substring(0, 500), highlights, vaultHints, computedAt: now, expiresAt };
      await cacheRef.set(result);
      if (conversationId && typeof conversationId === 'string') { try { const convRef = firestore.doc(`match-conversations/${conversationId}`); const convSnap = await convRef.get(); if (convSnap.exists) { const storyText = result.summary + (result.highlights?.length ? '\n\n' + result.highlights.map(h => `${h.label}: ${h.detail}`).join('\n') : ''); await firestore.collection(`match-conversations/${conversationId}/messages`).add({ senderUid: 'system', senderHandle: 'Atlas', text: storyText, type: 'ai-match', createdAt: admin.firestore.FieldValue.serverTimestamp() }); await convRef.update({ lastMessage: result.summary.substring(0, 100), lastMessageAt: admin.firestore.FieldValue.serverTimestamp(), lastMessageBy: 'system' }); } } catch (convErr) { console.error('Failed to write AI match message to conversation:', convErr); } }
      return sendAndTrack({ ...result, computedAt: now.toDate().toISOString(), expiresAt: expiresAt.toDate().toISOString() });
    } catch (err) { console.error('Story match error:', err); return res.status(500).json({ error: 'Failed to compute story match.' }); }
  }

  // --- Story Transmute mode ---
  if (mode === 'story-transmute') {
    const { rawText } = req.body || {};
    if (!rawText || typeof rawText !== 'string') return res.status(400).json({ error: 'rawText is required.' });
    const transmutePrompt = `You are Atlas, the mythic guide of Mythouse. A member has shared raw biographical material — it could be a CV, resume, bio, about-me text, or personal introduction.\n\nYour task: Transmute this raw material into a compelling personal mythic narrative. This will appear on their profile as "My Story."\n\nGUIDELINES:\n- Preserve all key facts, achievements, roles, and personality\n- Transform dry professional language into vivid, warm storytelling\n- Weave in subtle mythological imagery without being heavy-handed\n- Write in third person\n- 200-500 words depending on the richness of the source material\n- The result should read like the opening chapter of someone's personal myth\n- Do not invent facts that aren't in the source material\n- Do not include headers or section labels — write flowing prose\n\nRAW MATERIAL:\n${rawText.slice(0, 8000)}`;
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.quality, system: transmutePrompt, messages: [{ role: 'user', content: 'Please transmute my story.' }], max_tokens: 2048 });
      return sendAndTrack({ transmuted: response.content?.find(c => c.type === 'text')?.text || '' });
    } catch (err) { console.error('Story Transmute API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Celestial Drama mode (daily cached mythic story) ---
  if (mode === 'celestial-drama') {
    const db = admin.firestore();
    const cacheRef = db.collection('cache').doc('celestial-drama');
    try {
      const cacheDoc = await cacheRef.get();
      if (cacheDoc.exists) {
        const cached = cacheDoc.data();
        if (cached.expiresAt && cached.expiresAt.toMillis() > Date.now()) {
          return res.json({ story: cached.story, skyData: cached.skyData, moonPhaseAngle: cached.moonPhaseAngle, monomythStage: cached.monomythStage, monomythLabel: cached.monomythLabel, moonLabel: cached.moonLabel, generatedAt: cached.generatedAt, cached: true });
        }
      }
    } catch (cacheErr) { console.error('Drama cache read error:', cacheErr?.message); }
    try {
      const { MoonPhase: AstroMoonPhase } = require('astronomy-engine');
      const now = new Date();
      const skyData = computeNatalChart({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate(), hour: now.getUTCHours(), minute: now.getUTCMinutes(), latitude: 0, longitude: 0, utcOffset: 0 });
      const moonPhaseAngle = AstroMoonPhase(now);
      const monomythEntry = getMonomythStageFromMoonPhase(moonPhaseAngle);
      const dramaPrompt = buildCelestialDramaPrompt(skyData, moonPhaseAngle, monomythEntry);
      const anthropic = getAnthropicClient(userKeys.anthropicKey);
      const response = await anthropic.messages.create({ model: MODELS.quality, system: dramaPrompt, messages: [{ role: 'user', content: 'Tell today\'s celestial story.' }], max_tokens: 1500 });
      const story = response.content?.find(c => c.type === 'text')?.text || '';
      const result = { story, skyData: { planets: skyData.planets, aspects: skyData.aspects }, moonPhaseAngle, monomythStage: monomythEntry.stage, monomythLabel: monomythEntry.label, moonLabel: monomythEntry.moon, generatedAt: now.toISOString() };
      cacheRef.set({ ...result, expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000) }).catch(e => console.error('Drama cache write error:', e?.message));
      return res.json(result);
    } catch (err) {
      console.error('Celestial drama generation error:', err?.message, err?.status);
      try {
        const staleDoc = await cacheRef.get();
        if (staleDoc.exists) { const stale = staleDoc.data(); return res.json({ story: stale.story, skyData: stale.skyData, moonPhaseAngle: stale.moonPhaseAngle, monomythStage: stale.monomythStage, monomythLabel: stale.monomythLabel, moonLabel: stale.moonLabel, generatedAt: stale.generatedAt, cached: true, stale: true }); }
      } catch {}
      return res.status(500).json({ error: 'Failed to generate celestial drama.' });
    }
  }

  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Messages array is required.' });

  const validArea = area === 'auto' ? detectAreaFromMessage(messages) : (area && VALID_AREAS.includes(area) ? area : null);
  const raw = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
  const trimmed = []; for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } } if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();

  const anthropic = getAnthropicClient(userKeys.anthropicKey);
  const tools = [NATAL_CHART_TOOL, SAVE_STORY_SEED];
  if (validArea === 'mythic-earth') tools.push(HIGHLIGHT_SITES_TOOL);

  // --- Yellow Brick Road modes ---
  if (mode === 'ybr-challenge' || mode === 'ybr-atlas-hint') {
    const challengeInfo = getYBRChallenge(challengeStop, level || 1);
    if (!challengeInfo) return res.status(400).json({ error: 'Invalid challenge stop or level.' });
    let systemPrompt;
    if (mode === 'ybr-challenge') { const stop = challengeInfo.stop; const personaBase = getPersonaPrompt({ type: stop.type === 'planet' ? 'planet' : 'zodiac', name: stop.entity }); systemPrompt = buildYBRChallengePrompt(personaBase || `You are ${stop.entity}. Speak in first person.`, challengeInfo.levelData, level || 1); }
    else { systemPrompt = buildYBRAtlasHintPrompt(challengeInfo.stop.entity, challengeInfo.levelData, level || 1); }
    try {
      const response = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: trimmed, max_tokens: 1024 });
      let reply = response.content?.find(c => c.type === 'text')?.text || 'No response generated.';
      if (mode === 'ybr-challenge') { const resultMatch = reply.match(/<ybr-result>\s*(\{[^}]+\})\s*<\/ybr-result>/); let passed = null; if (resultMatch) { try { passed = !!JSON.parse(resultMatch[1]).passed; } catch {} reply = reply.replace(/<ybr-result>[\s\S]*?<\/ybr-result>/, '').trim(); } return sendAndTrack({ reply, passed, level: level || 1 }); }
      return sendAndTrack({ reply });
    } catch (err) { console.error('YBR API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Wheel Journey mode ---
  if (mode === 'wheel-journey') {
    if (!journeyId || !stageId) return res.status(400).json({ error: 'journeyId and stageId are required.' });
    const effectiveGameMode = gameMode || 'riddle';
    const systemPrompt = (journeyId === 'fused' && aspect) ? buildFusedJourneyPrompt(stageId, aspect, effectiveGameMode) : effectiveGameMode === 'story' ? buildStoryModePrompt(journeyId, stageId) : effectiveGameMode === 'personal' ? buildPersonalModePrompt(journeyId, stageId) : buildWheelJourneyPrompt(journeyId, stageId);
    try {
      const response = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: trimmed, max_tokens: 1024 });
      let reply = response.content?.find(c => c.type === 'text')?.text || 'No response generated.';
      const resultMatch = reply.match(/<ybr-result>\s*(\{[^}]+\})\s*<\/ybr-result>/); let passed = null; if (resultMatch) { try { passed = !!JSON.parse(resultMatch[1]).passed; } catch {} reply = reply.replace(/<ybr-result>[\s\S]*?<\/ybr-result>/, '').trim(); }
      return sendAndTrack({ reply, passed });
    } catch (err) { console.error('Wheel Journey API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Story Interview mode ---
  if (mode === 'story-interview') {
    const STAGE_IDS = ['golden-age', 'falling-star', 'impact-crater', 'forge', 'quenching', 'integration', 'drawing', 'new-age'];
    const STAGE_LABELS = { 'golden-age': 'Golden Age', 'falling-star': 'Calling Star', 'impact-crater': 'Crater Crossing', 'forge': 'Trials of Forge', 'quenching': 'Quench', 'integration': 'Integration', 'drawing': 'Draw', 'new-age': 'Age of Steel' };
    const UPDATE_STORY_TOOL = { name: 'update_story', description: 'Organize parts of the user\'s story into monomyth stages.', input_schema: { type: 'object', properties: { name: { type: 'string', description: 'A short, evocative name for this story' }, stageEntries: { type: 'object', description: 'Map of stage IDs to story content', additionalProperties: { type: 'string' } } }, required: [] } };
    const storyInterviewPrompt = `You are Atlas, the mythic companion of the Mythouse. You are conducting a personal story interview — helping someone tell the story of a real experience from their life and find the mythic pattern within it.\n\nTHE 8 MONOMYTH STAGES:\n${STAGE_IDS.map(id => `- ${id} (${STAGE_LABELS[id]})`).join('\n')}\n\nINTERVIEW PROCESS:\n1. FIRST: Ask the user to tell their story as a whole, however it comes to them. Don't interrupt or structure it yet. Let them speak.\n2. AFTER they share: Organize what they told you into the 8 monomyth stages using the update_story tool. Some stages may not have content yet — that's fine.\n3. THEN: Ask targeted follow-up questions to fill gaps.\n4. NAME THE STORY: Based on its essence, give the story an evocative name via the tool.\n5. CONTINUE until all 8 stages have meaningful content, then let the user know their story is complete.\n\nVOICE:\n- Be warm, curious, and deeply present. You are hearing someone's real life.\n- Reflect back the mythic patterns you see without lecturing.\n- Honor vulnerability. Don't rush. Don't analyze when they need to be heard.\n\nTOOL USAGE:\n- Call update_story as soon as you can assign content to stages — don't wait until the end.\n- You can call it multiple times as more of the story emerges.\n\nKeep responses conversational and relatively brief (3-5 sentences). Ask one question at a time.`;
    try {
      const response = await anthropic.messages.create({ model: MODELS.fast, system: storyInterviewPrompt, messages: trimmed, max_tokens: 1024, tools: [UPDATE_STORY_TOOL] });
      let reply = '', storyUpdate = null;
      const toolBlocks = response.content.filter(c => c.type === 'tool_use');
      const textBlock = response.content.find(c => c.type === 'text');
      if (toolBlocks.length > 0) {
        storyUpdate = {};
        for (const tb of toolBlocks) { if (tb.name === 'update_story' && tb.input) { if (tb.input.name) storyUpdate.name = tb.input.name; if (tb.input.stageEntries) storyUpdate.stageEntries = { ...(storyUpdate.stageEntries || {}), ...tb.input.stageEntries }; } }
        const toolResults = toolBlocks.map(tb => ({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true }) }));
        const followUp = await anthropic.messages.create({ model: MODELS.fast, system: storyInterviewPrompt, messages: [...trimmed, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }], max_tokens: 1024, tools: [UPDATE_STORY_TOOL] });
        reply = followUp.content?.find(c => c.type === 'text')?.text || 'Story updated.';
        for (const tb of followUp.content.filter(c => c.type === 'tool_use')) { if (tb.name === 'update_story' && tb.input) { if (!storyUpdate) storyUpdate = {}; if (tb.input.name) storyUpdate.name = tb.input.name; if (tb.input.stageEntries) storyUpdate.stageEntries = { ...(storyUpdate.stageEntries || {}), ...tb.input.stageEntries }; } }
      } else { reply = textBlock?.text || 'No response generated.'; }
      return sendAndTrack({ reply, storyUpdate: storyUpdate && Object.keys(storyUpdate).length > 0 ? storyUpdate : undefined });
    } catch (err) { console.error('Story Interview API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Story Synthesis mode ---
  if (mode === 'story-synthesis') {
    const { stageId: synthStageId, stageData: synthData } = req.body || {};
    if (!synthData || !Array.isArray(synthData)) return res.status(400).json({ error: 'stageData array is required for story synthesis.' });
    const isFullSynthesis = synthStageId === 'full';
    const entriesBlock = synthData.map(e => { const prefix = e.storyName ? `[${e.storyName}]` : ''; const stagePrefix = e.stage ? ` (${e.stage})` : ''; return `${prefix}${stagePrefix}: ${e.text}`; }).join('\n\n');
    const STAGE_LABELS_SYN = { 'golden-age': 'Golden Age', 'falling-star': 'Calling Star', 'impact-crater': 'Crater Crossing', 'forge': 'Trials of Forge', 'quenching': 'Quench', 'integration': 'Integration', 'drawing': 'Draw', 'new-age': 'Age of Steel' };
    const synthPrompt = isFullSynthesis ? `You are Atlas. A person has shared multiple personal stories organized across the 8 stages of the monomyth. Below are ALL their entries from ALL stories across ALL stages.\n\nSynthesize these into a unified Archetypal Journey — a personal mythic biography that weaves the threads of all their stories into one coherent narrative. Preserve the user's own words and phrases as much as possible. Show how the patterns of their different stories echo and reinforce each other across the monomyth stages.\n\nStructure the synthesis by stage, using the stage names as section headers. 800-1500 words. Be literary but honor their voice.\n\nALL ENTRIES:\n${entriesBlock}` : `You are Atlas. A person has shared multiple personal stories. Below are all their entries for the "${STAGE_LABELS_SYN[synthStageId] || synthStageId}" stage of the monomyth, drawn from different stories.\n\nSynthesize these entries into a unified personal narrative for this single stage. Preserve the user's own words and phrases. Show how different stories echo the same archetypal pattern at this stage. 200-500 words. Be warm, perceptive, and honoring of what they shared.\n\nENTRIES FOR THIS STAGE:\n${entriesBlock}`;
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.quality, system: synthPrompt, messages: [{ role: 'user', content: 'Please synthesize my stories.' }], max_tokens: 4096 });
      return sendAndTrack({ synthesis: response.content?.find(c => c.type === 'text')?.text || 'No synthesis generated.' });
    } catch (err) { console.error('Story Synthesis API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Profile Onboarding mode ---
  if (mode === 'profile-onboarding') {
    const profileSystemPrompt = buildProfileOnboardingPrompt(existingCredentials, existingNatalChart);
    const profileTools = [UPDATE_PROFILE_TOOL, NATAL_CHART_TOOL, UPDATE_NATAL_CHART_TOOL, APPROVE_CURATOR_TOOL];
    try {
      let currentMessages = [...trimmed], reply = ''; const credentialUpdates = {}; let natalChartUpdate = null, curatorApproved = undefined;
      for (let turn = 0; turn < 5; turn++) {
        const response = await anthropic.messages.create({ model: MODELS.fast, system: profileSystemPrompt, messages: currentMessages, max_tokens: 1024, tools: profileTools });
        const toolBlocks = response.content.filter(c => c.type === 'tool_use'); const textBlock = response.content.find(c => c.type === 'text');
        if (toolBlocks.length === 0) { reply = textBlock?.text || 'No response generated.'; break; }
        const toolResults = [];
        for (const tb of toolBlocks) { if (tb.name === 'update_profile' && tb.input) { credentialUpdates[tb.input.category] = { level: tb.input.level, details: tb.input.details }; toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, category: tb.input.category, level: tb.input.level }) }); } else if (tb.name === 'compute_natal_chart' && tb.input) { toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(computeNatalChart(tb.input)) }); } else if (tb.name === 'update_natal_chart' && tb.input) { natalChartUpdate = tb.input.chartData; toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, message: 'Natal chart saved to profile.' }) }); } else if (tb.name === 'approve_curator' && tb.input) { curatorApproved = !!tb.input.approved; toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, curatorApproved }) }); } }
        if (textBlock?.text) reply = textBlock.text;
        currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
      }
      const result = { reply }; if (Object.keys(credentialUpdates).length > 0) result.credentialUpdates = credentialUpdates; if (natalChartUpdate) result.natalChart = natalChartUpdate; if (curatorApproved !== undefined) result.curatorApproved = curatorApproved;
      return sendAndTrack(result);
    } catch (err) { console.error('Profile Onboarding API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Guild Application mode ---
  if (mode === 'guild-application' || mode === 'mentor-application') {
    const mentorTypes = qualifiedGuildTypes || qualifiedMentorTypes || []; const typeList = mentorTypes.map(t => `${t.title} (${t.credentialCategory}, Level ${t.credentialLevel})`).join(', ');
    const SAVE_GUILD_APPLICATION_TOOL = { name: 'save_guild_application', description: 'Save the guild application after gathering all information.', input_schema: { type: 'object', properties: { type: { type: 'string', enum: ['scholar', 'storyteller', 'healer', 'mediaVoice', 'adventurer'] }, summary: { type: 'string', description: 'The applicant\'s personal statement' } }, required: ['type', 'summary'] } };
    const guildSystemPrompt = `You are Atlas, the mythic companion of the Mythouse. You are guiding a member through their application to become a guild member.\n\nTHE APPLICANT QUALIFIES FOR THESE GUILD ROLES:\n${typeList || 'None'}\n\nGUILD TYPES AND THEIR MEANING:\n- Mythologist (scholar): Guide students through mythic scholarship, depth psychology, and academic inquiry.\n- Storyteller (storyteller): Help emerging writers and oral storytellers develop their craft through mythic structure.\n- Healer (healer): Support practitioners in integrating mythic wisdom into therapeutic and coaching work.\n- Media Voice (mediaVoice): Guide content creators in bringing mythic narratives to podcasts, video, and media.\n- Adventurer (adventurer): Lead experiential mythology — mythic travel, fieldwork, and embodied exploration.\n\nCONVERSATION FLOW (4-6 exchanges):\n1. Welcome them and confirm which guild type they'd like to apply for.\n2. Explain the commitment: 2-4 hours per month.\n3. Ask for a brief personal statement.\n4. Note they can upload a supporting document.\n5. Once you have type and statement, call save_guild_application.\n\n${uploadedDocument ? `UPLOADED DOCUMENT: "${uploadedDocument.name}". Acknowledge this.` : ''}\n\nVOICE: Warm, encouraging, but honest about the responsibility of guiding others in the guild.\n\nIMPORTANT: Call save_guild_application as soon as you have the type and a substantive statement. Do NOT ask for the same information twice.`;
    try {
      let currentMessages = [...trimmed], reply = '', guildApplication = null;
      for (let turn = 0; turn < 5; turn++) {
        const response = await anthropic.messages.create({ model: MODELS.fast, system: guildSystemPrompt, messages: currentMessages, max_tokens: 1024, tools: [SAVE_GUILD_APPLICATION_TOOL] });
        const toolBlocks = response.content.filter(c => c.type === 'tool_use'); const textBlock = response.content.find(c => c.type === 'text');
        if (toolBlocks.length === 0) { reply = textBlock?.text || 'No response generated.'; break; }
        const toolResults = []; for (const tb of toolBlocks) { if (tb.name === 'save_guild_application' && tb.input) { guildApplication = { type: tb.input.type, summary: tb.input.summary }; toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, type: tb.input.type }) }); } }
        if (textBlock?.text) reply = textBlock.text;
        currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
      }
      const result = { reply }; if (guildApplication) result.guildApplication = guildApplication;
      return sendAndTrack(result);
    } catch (err) { console.error('Guild Application API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Consulting Setup mode ---
  if (mode === 'consulting-setup') {
    const SAVE_CONSULTING_PROFILE_TOOL = { name: 'save_consulting_profile', description: 'Save the consulting profile after gathering project information.', input_schema: { type: 'object', properties: { projects: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, clientType: { type: 'string' }, outcome: { type: 'string' } }, required: ['title', 'description'] } }, specialties: { type: 'array', items: { type: 'string' } }, consultingTypes: { type: 'array', items: { type: 'string', enum: ['character', 'narrative', 'coaching', 'media', 'adventure'] } } }, required: ['projects', 'specialties', 'consultingTypes'] } };
    const consultingSystemPrompt = `You are Atlas, the mythic companion of the Mythouse. You are helping an active guild member set up their consulting profile.\n\nCONVERSATION FLOW (4-6 exchanges):\n1. Welcome them and explain that consulting profiles showcase their professional experience.\n2. Ask about their consulting experience — at least 3 projects.\n3. Ask about specialties and consulting types.\n4. Once you have at least 3 projects, call save_consulting_profile.\n\nVOICE: Professional but warm.\n\nIMPORTANT: You need at least 3 projects before calling the tool.`;
    try {
      let currentMessages = [...trimmed], reply = '', consultingProfile = null;
      for (let turn = 0; turn < 5; turn++) {
        const response = await anthropic.messages.create({ model: MODELS.fast, system: consultingSystemPrompt, messages: currentMessages, max_tokens: 1024, tools: [SAVE_CONSULTING_PROFILE_TOOL] });
        const toolBlocks = response.content.filter(c => c.type === 'tool_use'); const textBlock = response.content.find(c => c.type === 'text');
        if (toolBlocks.length === 0) { reply = textBlock?.text || 'No response generated.'; break; }
        const toolResults = []; for (const tb of toolBlocks) { if (tb.name === 'save_consulting_profile' && tb.input) { consultingProfile = { projects: tb.input.projects || [], specialties: tb.input.specialties || [], consultingTypes: tb.input.consultingTypes || [] }; toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, projectCount: consultingProfile.projects.length }) }); } }
        if (textBlock?.text) reply = textBlock.text;
        currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
      }
      const result = { reply }; if (consultingProfile) result.consultingProfile = consultingProfile;
      return sendAndTrack(result);
    } catch (err) { console.error('Consulting Setup API error:', err?.message, err?.status); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Consulting Intake mode ---
  if (mode === 'consulting-intake') {
    const SAVE_INTAKE_ASSESSMENT_TOOL = {
      name: 'save_intake_assessment',
      description: 'Save the mythic intake assessment after the conversation has revealed the client\'s archetypal pattern, journey stage, and narrative situation. Call this when you have enough information to write the assessment.',
      input_schema: {
        type: 'object',
        properties: {
          archetype: { type: 'string', description: 'The active archetype identified (e.g. "Saturn — The Builder", "Mars — The Warrior", "Moon — The Mirror")' },
          journeyStage: { type: 'string', description: 'Where the client is in their journey (e.g. "The Threshold", "The Forge", "The Return")' },
          narrative: { type: 'string', description: 'A 2-3 paragraph mythic assessment of where they are in their story, naming the archetype, the stage, and the invitation.' },
          suggestedTitle: { type: 'string', description: 'A mythic name for this engagement (e.g. "The Forge of Clarity", "The Threshold of Voice")' },
        },
        required: ['archetype', 'journeyStage', 'narrative', 'suggestedTitle'],
      },
    };

    const clientTypeLabel = clientType || 'seeker';
    const credentialBlock = existingCredentials ? `\nThe client has these existing credentials on Mythouse: ${JSON.stringify(existingCredentials).slice(0, 2000)}` : '';
    const natalBlock = existingNatalChart ? `\nThe client has a natal chart on file: Sun in ${existingNatalChart.planets?.[0]?.sign || '?'}, Moon in ${existingNatalChart.planets?.[1]?.sign || '?'}.` : '';

    const intakeSystemPrompt = `You are Atlas conducting a mythic narrative intake for the Mythouse consulting practice. Your role is to understand where this person or organization is in their story — not through business language but through archetypal, psychological, and narrative language.

The client identifies as: ${clientTypeLabel}${credentialBlock}${natalBlock}

YOUR APPROACH:
- Map their situation to the hero's journey stages
- Identify the active archetype (which of the planetary/zodiacal energies is most alive)
- Surface the mythic pattern in their situation
- Name the threshold they're standing at

CONVERSATION FLOW (4-8 exchanges):
1. Welcome them warmly into the practice. Ask what brought them here — the call.
2. Listen for the pattern. Ask what they're leaving behind — the departure.
3. Ask what they fear in this transition — the guardian at the threshold.
4. Ask what they hope to forge, create, or become — the boon.
5. When you have enough to see the pattern, call save_intake_assessment with your mythic assessment.

VOICE: Warm, perceptive, mythic but grounded. You are a guide, not a guru. Ask real questions. Listen for real patterns. Never inflate.

IMPORTANT: Do not rush to the assessment. Let the conversation breathe. But once you see the pattern clearly, call the tool.`;

    const raw = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const trimmed = []; for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } } if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();
    const anthropic = getAnthropicClient(userKeys.anthropicKey);

    try {
      let currentMessages = [...trimmed], reply = '', intakeAssessment = null;
      for (let turn = 0; turn < 5; turn++) {
        const response = await anthropic.messages.create({ model: MODELS.quality, system: intakeSystemPrompt, messages: currentMessages, max_tokens: 1500, tools: [SAVE_INTAKE_ASSESSMENT_TOOL] });
        const toolBlocks = response.content.filter(c => c.type === 'tool_use');
        const textBlock = response.content.find(c => c.type === 'text');
        if (toolBlocks.length === 0) { reply = textBlock?.text || 'No response generated.'; break; }
        const toolResults = [];
        for (const tb of toolBlocks) {
          if (tb.name === 'save_intake_assessment' && tb.input) {
            intakeAssessment = { archetype: tb.input.archetype || '', journeyStage: tb.input.journeyStage || '', narrative: tb.input.narrative || '', suggestedTitle: tb.input.suggestedTitle || 'Mythic Narrative Engagement' };
            toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, message: 'Intake assessment saved. Share the assessment with the client.' }) });
          }
        }
        if (textBlock?.text) reply = textBlock.text;
        if (toolResults.length === 0) break;
        currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
      }
      const result = { reply };
      if (intakeAssessment) result.intakeAssessment = intakeAssessment;
      return sendAndTrack(result);
    } catch (err) { console.error('Consulting Intake API error:', err?.message, err?.status); if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired.', keyError: true }); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Consulting Session mode ---
  if (mode === 'consulting-session') {
    if (!engagementContext) return res.status(400).json({ error: 'engagementContext is required for consulting sessions.' });

    const CAPTURE_ARTIFACT_TOOL = {
      name: 'capture_artifact',
      description: 'Capture a meaningful artifact from this session — a narrative insight, an exercise, or a key realization. Call this whenever the conversation produces something worth preserving.',
      input_schema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['narrative', 'insight', 'exercise', 'reflection'], description: 'The type of artifact' },
          content: { type: 'string', description: 'The artifact content — a paragraph or two capturing the insight, narrative, or exercise' },
        },
        required: ['type', 'content'],
      },
    };

    const MARK_STAGE_COMPLETE_TOOL = {
      name: 'mark_stage_complete',
      description: 'Mark the current engagement stage as complete. Call this only when the client has genuinely crossed the threshold of this stage — not just discussed it, but integrated it.',
      input_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'A brief mythic summary of what was accomplished in this stage' },
        },
        required: ['summary'],
      },
    };

    const { title, archetype, intakeNotes, currentStage, natalData } = engagementContext;
    const stageLabel = currentStage?.label || 'unknown stage';

    // Build natal/planetary context if available
    let natalContext = '';
    if (natalData) {
      const parts = [];
      if (natalData.sunSign) parts.push(`Sun in ${natalData.sunSign}`);
      if (natalData.moonSign) parts.push(`Moon in ${natalData.moonSign}`);
      if (natalData.risingSign) parts.push(`Rising ${natalData.risingSign}`);
      if (natalData.dominantPlanet) parts.push(`Dominant planet: ${natalData.dominantPlanet}`);
      if (parts.length > 0) natalContext = `\nNATAL CORRESPONDENCES: ${parts.join(' — ')}\nUse planetary and zodiacal language as a lens when it illuminates the client's situation. The natal chart is a diagnostic, not a prescription.`;
    }

    const sessionSystemPrompt = `You are Atlas as consulting partner in a mythic narrative session on the Mythouse platform.

ENGAGEMENT: "${title || 'Mythic Narrative Engagement'}"
ACTIVE ARCHETYPE: ${archetype || 'Not yet identified'}
CURRENT STAGE: ${stageLabel}
${currentStage?.description ? `STAGE MEANING: ${currentStage.description}` : ''}${natalContext}

MYTHIC ASSESSMENT FROM INTAKE:
${intakeNotes || 'No intake notes available.'}

YOUR ROLE:
- Guide this session through archetypal and narrative language
- Surface mythic parallels to the client's situation
- Help them see their situation as part of a larger pattern
- When they reach insight, capture it as an artifact
- When they identify next steps, frame them as mythic action items (not corporate to-dos)
- When the client has genuinely crossed the threshold of this stage, mark it complete

VOICE: Warm, perceptive, mythic but grounded. You are a guide walking alongside them, not above them. Let patterns speak. Never inflate.

TOOLS: Use capture_artifact when the conversation produces something worth preserving. Use mark_stage_complete only when the threshold has truly been crossed.`;

    const raw = messages.slice(-30).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const trimmed = []; for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } } if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();
    const anthropic = getAnthropicClient(userKeys.anthropicKey);

    try {
      let currentMessages = [...trimmed], reply = '', artifacts = [], stageComplete = null;
      for (let turn = 0; turn < 5; turn++) {
        const response = await anthropic.messages.create({ model: MODELS.quality, system: sessionSystemPrompt, messages: currentMessages, max_tokens: 1500, tools: [CAPTURE_ARTIFACT_TOOL, MARK_STAGE_COMPLETE_TOOL] });
        const toolBlocks = response.content.filter(c => c.type === 'tool_use');
        const textBlock = response.content.find(c => c.type === 'text');
        if (toolBlocks.length === 0) { reply = textBlock?.text || 'No response generated.'; break; }
        const toolResults = [];
        for (const tb of toolBlocks) {
          if (tb.name === 'capture_artifact' && tb.input) {
            artifacts.push({ type: tb.input.type || 'insight', content: tb.input.content || '', createdAt: new Date().toISOString() });
            toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, message: 'Artifact captured.' }) });
          }
          if (tb.name === 'mark_stage_complete' && tb.input) {
            stageComplete = { summary: tb.input.summary || '' };
            toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify({ success: true, message: 'Stage marked complete. Acknowledge the threshold crossing to the client.' }) });
          }
        }
        if (textBlock?.text) reply = textBlock.text;
        if (toolResults.length === 0) break;
        currentMessages = [...currentMessages, { role: 'assistant', content: response.content }, { role: 'user', content: toolResults }];
      }
      const result = { reply };
      if (artifacts.length > 0) result.artifacts = artifacts;
      if (stageComplete) result.stageComplete = stageComplete;
      return sendAndTrack(result);
    } catch (err) { console.error('Consulting Session API error:', err?.message, err?.status); if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired.', keyError: true }); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Consulting Synthesis mode ---
  if (mode === 'consulting-synthesis') {
    if (!engagementContext) return res.status(400).json({ error: 'engagementContext is required for consulting synthesis.' });

    const { title, archetype, intakeNotes, clientType, stages: engStages, sessions: engSessions } = engagementContext;

    // Build stage narratives from session data
    const stageBlock = (engStages || []).map(s => {
      const stageSessions = (engSessions || []).filter(sess => sess.stageId === s.id);
      const artifacts = stageSessions.flatMap(sess => (sess.artifacts || []).map(a => `[${a.type}] ${a.content}`));
      const clientWords = stageSessions.flatMap(sess => sess.messages || []);
      return `### ${s.label} (${s.description || ''})\nClient reflections: ${clientWords.join(' | ') || 'No recorded reflections'}\nArtifacts: ${artifacts.join('\n') || 'None captured'}`;
    }).join('\n\n');

    const synthesisPrompt = `You are Atlas. A traveler has completed a full mythic narrative consulting engagement on the Mythouse platform. Your task is to weave their entire journey into a mythic narrative — the story of their transformation.

ENGAGEMENT: "${title || 'Mythic Narrative Engagement'}"
CLIENT TYPE: ${clientType || 'seeker'}
ACTIVE ARCHETYPE: ${archetype || 'Not identified'}

INTAKE ASSESSMENT:
${intakeNotes || 'No intake notes.'}

JOURNEY THROUGH THE STAGES:
${stageBlock}

YOUR TASK:
Weave these fragments into a single, cohesive mythic narrative of this person's transformation. Honor their words and insights. Show how they moved through the stages — what died, what was forged, what emerged.

VOICE: Warm, mythic, honoring. This is their story. You are the narrator, not the hero. 800-1500 words. Use rich, literary language but keep it grounded and personal.

IMPORTANT: Never inflate the client into a hero who conquered or decoded. They walked, they noticed, they returned. Let the pattern speak.`;

    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.quality, system: synthesisPrompt, messages: [{ role: 'user', content: 'Please weave my consulting journey into a mythic narrative.' }], max_tokens: 4096 });
      const text = response.content?.find(c => c.type === 'text')?.text || 'No synthesis generated.';
      return sendAndTrack({ synthesis: text });
    } catch (err) { console.error('Consulting Synthesis API error:', err?.message, err?.status); if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired.', keyError: true }); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Consulting Forge mode — Story Forge applied to engagement material ---
  if (mode === 'consulting-forge') {
    if (!engagementContext || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'engagementContext and messages are required for consulting forge.' });
    const { title, archetype, intakeNotes, clientType, stages: engStages, sessions: engSessions, currentStageId } = engagementContext;

    // Gather raw material from sessions
    const rawMaterial = (engStages || []).map(s => {
      const stageSessions = (engSessions || []).filter(sess => sess.stageId === s.id);
      const artifacts = stageSessions.flatMap(sess => (sess.artifacts || []).map(a => `[${a.type}] ${a.content}`));
      const clientWords = stageSessions.flatMap(sess => sess.messages || []);
      return `=== ${s.label} ===\n${clientWords.length > 0 ? clientWords.join('\n') : '(No material yet)'}\n${artifacts.length > 0 ? 'Artifacts:\n' + artifacts.join('\n') : ''}`;
    }).join('\n\n');

    const forgePrompt = `You are Atlas, a story collaborator helping a consulting client forge the narrative of their transformation into a polished written work. This is the Story Forge applied to mythic consulting.

ENGAGEMENT: "${title || 'Mythic Narrative Engagement'}"
CLIENT TYPE: ${clientType || 'seeker'}
ACTIVE ARCHETYPE: ${archetype || 'Not identified'}

INTAKE ASSESSMENT:
${(intakeNotes || '').slice(0, 800)}

RAW MATERIAL FROM ENGAGEMENT:
${rawMaterial.slice(0, 4000)}

${currentStageId ? `Currently focused on stage: ${currentStageId}` : ''}

YOUR ROLE: Help the client craft their transformation story. Ask what they want to emphasize, notice what's vivid, suggest structure. Be a collaborator, not a ghostwriter.

TOOLS:
- suggest_mythic_parallel: Use when you notice a genuinely striking parallel between their material and a mythic tradition. At most once per exchange.
- produce_draft: Use when the client explicitly asks for a draft. 200-600 words, polished prose that preserves their voice and insights.

VOICE: Warm, editorial, mythic. You are helping them find the shape of their story.`;

    const raw = messages.slice(-20).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const trimmed = []; for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } } if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();

    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({
        model: MODELS.quality, max_tokens: 2500, system: forgePrompt, messages: trimmed,
        tools: [
          { name: 'suggest_mythic_parallel', description: 'Surface a parallel between the client\'s engagement material and a mythic tradition.', input_schema: { type: 'object', properties: { parallel: { type: 'string' }, source: { type: 'string' }, suggestion: { type: 'string' } }, required: ['parallel', 'source', 'suggestion'] } },
          { name: 'produce_draft', description: 'Produce a polished draft passage from the engagement material.', input_schema: { type: 'object', properties: { draft: { type: 'string', description: 'The polished draft passage (200-600 words)' } }, required: ['draft'] } },
        ],
      });
      let reply = '', draft = null, mythicParallel = null;
      for (const block of response.content) { if (block.type === 'text') { reply += block.text; } else if (block.type === 'tool_use') { if (block.name === 'suggest_mythic_parallel') mythicParallel = block.input; else if (block.name === 'produce_draft') draft = block.input.draft; } }
      return sendAndTrack({ reply, draft, mythicParallel });
    } catch (err) { console.error('Consulting Forge API error:', err?.message, err?.status); if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired.', keyError: true }); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Fellowship summary mode ---
  if (mode === 'fellowship-summary') {
    if (!completionType || !completionData) return res.status(400).json({ error: 'completionType and completionData are required.' });
    const fellowshipSystemPrompt = `You are Atlas, a warm mythic storyteller who celebrates the achievements of fellow travelers on Mythouse.\n\nA user has just completed something significant. Write a celebration in two parts:\n\n1. **summary** — 1-3 sentences, warm, mythic, second person.\n2. **fullStory** — 2-4 paragraphs, poetic mythic retelling.\n\nRespond ONLY with valid JSON: {"summary": "...", "fullStory": "..."}\n\nCompletion type: ${completionType}\nCompletion data: ${JSON.stringify(completionData).slice(0, 6000)}`;
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: MODELS.quality, system: fellowshipSystemPrompt, messages: [{ role: 'user', content: 'Please write the celebration for this achievement.' }], max_tokens: 1500 });
      const text = response.content?.find(c => c.type === 'text')?.text || '';
      let parsed; try { const jsonMatch = text.match(/\{[\s\S]*\}/); parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text); } catch { parsed = { summary: text.slice(0, 300), fullStory: text }; }
      return sendAndTrack({ summary: parsed.summary || '', fullStory: parsed.fullStory || '' });
    } catch (err) { console.error('Fellowship summary API error:', err?.message, err?.status); if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired.', keyError: true }); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Fellowship revise mode ---
  if (mode === 'fellowship-revise') {
    if (!currentSummary || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'currentSummary and messages are required.' });
    const reviseSystemPrompt = `You are Atlas, helping a user revise their Fellowship post on Mythouse.\n\nCurrent summary: ${currentSummary}\n${currentFullStory ? `Current full story: ${currentFullStory}` : ''}\n\nThe user wants to edit their post. Have a brief conversation to understand their changes, then produce the revised version. When you have enough information, respond with ONLY valid JSON: {"summary": "...", "fullStory": "..."}\n\nIf the user hasn't given enough direction yet, respond conversationally (plain text, no JSON) to ask what they'd like to change.`;
    const raw = messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }));
    const trimmed = []; for (const msg of raw) { if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) { trimmed[trimmed.length - 1].content += '\n' + msg.content; } else { trimmed.push({ ...msg }); } } if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();
    const anthropic = getAnthropicClient(userKeys.anthropicKey);
    try {
      const response = await anthropic.messages.create({ model: isByok ? MODELS.quality : MODELS.fast, system: reviseSystemPrompt, messages: trimmed, max_tokens: 1500 });
      const text = response.content?.find(c => c.type === 'text')?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*"summary"[\s\S]*\}/);
      if (jsonMatch) { try { const parsed = JSON.parse(jsonMatch[0]); return sendAndTrack({ reply: text, revised: true, summary: parsed.summary, fullStory: parsed.fullStory || '' }); } catch {} }
      return sendAndTrack({ reply: text, revised: false });
    } catch (err) { console.error('Fellowship revise API error:', err?.message, err?.status); if (err.status === 401 && isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired.', keyError: true }); return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` }); }
  }

  // --- Main conversational mode ---
  const personaPrompt = persona ? getPersonaPrompt(persona) : null;
  const areaContext = episodeContext ? { episode: episodeContext } : undefined;
  let systemPrompt = personaPrompt || getSystemPrompt(validArea, areaContext);

  if (courseSummary && typeof courseSummary === 'string' && courseSummary.length > 0) {
    systemPrompt += `\n\n--- COURSEWORK STATUS ---\nThe student's current coursework progress on Mythouse:\n${courseSummary}\n\nCOURSE ADVISOR GUIDELINES:\n- You are aware of their course progress but don't lead with it. Weave it in naturally.\n- If they ask about progress, courses, or what to do next — give specific, actionable guidance based on incomplete requirements.\n- Celebrate completions warmly. If a course is close to done (>80%), mention it once naturally.\n- Connect the current conversation topic to relevant course requirements when it fits organically.\n- Never interrupt a mythic, emotional, or creative conversation just to mention courses.\n- If they have no courses active, do not mention coursework at all.`;
  }

  if (situationalContext && typeof situationalContext === 'string' && situationalContext.length > 0) {
    systemPrompt += `\n\n${situationalContext.slice(0, 2000)}`;
  }

  if (!persona) {
    systemPrompt += `\n\nSTORY INTAKE:\nWhen someone expresses interest in working on a story — personal narrative, band history, screenplay, novel, creative project — engage naturally. Ask about the heart of the story, the turning points, the stakes. Don't force a rigid interview — let the conversation flow. When you've gathered enough detail (after at least 2-3 exchanges) to sketch a narrative arc, use the save_story_seed tool to capture it.\nAfter saving, give a brief readout of what you captured — the name, premise, and which stages you identified — and offer: "If you want to go deeper — develop each stage, work with drafts, weave your narrative together — the Story Forge is where that happens. [[Open Story Forge|/story-forge]]"\nDo NOT call save_story_seed on the first message. Have a real conversation first.`;

    systemPrompt += `\n\nROUTING:\nWhen you recognize the user would benefit from a dedicated experience, give a genuine first response — something real, not just a link drop — then offer one link. Only one per response. Don't route people who are just chatting.\n\n${ATLAS_ROUTES.map(r => `- ${r.keywords} → [[${r.label}|${r.path}]] — ${r.note}`).join('\n')}`;
  } else {
    systemPrompt += `\n\nCROSS-REFERRAL:\nIf the visitor asks about something beyond your domain — stories, profile, consulting, divination, courses, or other areas of the Mythouse — stay in character but suggest they speak with Atlas directly: "That is beyond my sphere. Atlas would know — switch to the Atlas voice above, or open the full Atlas at [[Open Atlas|/atlas]]."`;
  }

  try {
    const response = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: trimmed, max_tokens: 1024, ...(tools.length > 0 ? { tools } : {}) });
    let reply; const toolBlock = response.content.find(c => c.type === 'tool_use');
    if (response.stop_reason === 'tool_use' && toolBlock?.name === 'compute_natal_chart') {
      const chart = computeNatalChart(toolBlock.input);
      const followUp = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: [...trimmed, { role: 'assistant', content: response.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify(chart) }] }], max_tokens: 4096 });
      reply = followUp.content?.find(c => c.type === 'text')?.text || 'Chart computed but no reading generated.';
    } else if (response.stop_reason === 'tool_use' && toolBlock?.name === 'save_story_seed') {
      const seed = toolBlock.input;
      const storyId = `story-${Date.now()}`;
      const followUp = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: [...trimmed, { role: 'assistant', content: response.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify({ success: true, storyId, message: 'Story seed saved. Give the user a brief readout of what you captured and offer the Story Forge link.' }) }] }], max_tokens: 1024 });
      reply = followUp.content?.find(c => c.type === 'text')?.text || 'Story seed saved.';
      return sendAndTrack({ reply, storySeed: { ...seed, storyId } });
    } else if (response.stop_reason === 'tool_use' && toolBlock?.name === 'highlight_sites') {
      const validSiteIds = new Set(mythicEarthSites.map(s => s.id));
      const requestedIds = toolBlock.input.site_ids || [];
      const matchedIds = requestedIds.filter(id => validSiteIds.has(id));
      const matchedSites = mythicEarthSites.filter(s => matchedIds.includes(s.id));
      const followUp = await anthropic.messages.create({ model: MODELS.fast, system: systemPrompt, messages: [...trimmed, { role: 'assistant', content: response.content }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify({ highlighted: matchedIds.length, sites: matchedSites.map(s => s.name) }) }] }], max_tokens: 1024 });
      reply = followUp.content?.find(c => c.type === 'text')?.text || 'Here are the sites I found.';
      return sendAndTrack({ reply, sites: matchedSites });
    } else {
      reply = response.content?.find(c => c.type === 'text')?.text || response.content?.[0]?.text || 'No response generated.';
    }
    return sendAndTrack({ reply });
  } catch (err) {
    console.error('Anthropic API error:', err?.message, err?.status);
    if (err.status === 401) { if (isByok) return res.status(401).json({ error: 'Your Anthropic API key is invalid or expired. Please update it in your profile settings.', keyError: true }); return res.status(500).json({ error: 'API configuration error.' }); }
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
