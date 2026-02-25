// api/teacher.js
// Teacher Mode API — syllabus parsing + content matching.
// Single action: parse-syllabus (POST, Firebase auth required).

const Anthropic = require('@anthropic-ai/sdk');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { searchContent, getContentCatalog } = require('./_lib/contentIndex');

// ── Rate limiting (same pattern as chat.js) ──
const rateMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Content categories available (for Claude prompt) ──
const CONTENT_CATEGORIES = [
  'pantheon — deities from 78 world mythologies (Greek, Egyptian, Norse, Hindu, Chinese, etc.)',
  'sacred-site — temples, oracles, holy mountains, sacred geography worldwide',
  'library — books on mythology, psychology, religion, storytelling',
  'monomyth-stage — 8 stages of the hero\'s journey (Golden Age, Calling, Crossing, Forge, Nadir, Return, Resurrection, New World)',
  'monomyth-model — theoretical frameworks (Campbell, Jung, Vogler, Murdock, Propp, etc.)',
  'theorist — individual theorists mapped to monomyth stages',
  'monomyth-myth — mythological savior figures mapped to monomyth stages (Osiris, Inanna, Buddha, etc.)',
  'monomyth-film — films analyzed through monomyth lens',
  'cycle — natural cycles (solar day, lunar month, solar year, sleep, procreation, mortality)',
  'figure — mythological figures (Achilles, Gilgamesh, etc.) and modern figures (Superman, etc.)',
  'savior — religious/mythological savior figures (Jesus, Buddha, etc.)',
  'constellation — 88 constellations with mythology and cultural star names',
  'planet — 7 classical planets with metals, deities, archetypes',
  'zodiac — 12 zodiac signs with cross-cultural traditions',
  'element — 4 classical elements (Fire, Earth, Air, Water)',
  'cardinal — 4 cardinal directions / seasonal thresholds (equinoxes and solstices)',
  'archetype — character archetypes linked to planets and sins/virtues',
  'game — ancient board games (Senet, Ur, Mancala, Go, Chess, etc.)',
  'tv-episode — Mythology Channel episodes on specific mythological topics',
  'medicine-wheel — indigenous four-directional knowledge systems',
  'journey — guided journeys (monomyth, planetary, zodiac, consulting)',
  'fallen-starlight — narrative story in 8 chapters following the monomyth',
  'calendar — 12-month mythic calendar with birthstones, flowers, holidays',
];

// ── Handler ──

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const { action } = req.body || {};

  // --- get-catalog: lightweight endpoint for client-side autocomplete ---
  if (action === 'get-catalog') {
    const uid = await getUidFromRequest(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized.' });
    return res.status(200).json({ catalog: getContentCatalog() });
  }

  // --- parse-syllabus ---
  if (action !== 'parse-syllabus') {
    return res.status(400).json({ error: 'Invalid action. Must be: parse-syllabus or get-catalog' });
  }

  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!checkRateLimit(uid)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }

  const { syllabusText } = req.body;
  if (!syllabusText || typeof syllabusText !== 'string') {
    return res.status(400).json({ error: 'syllabusText is required.' });
  }
  if (syllabusText.length < 50) {
    return res.status(400).json({ error: 'Syllabus text too short (minimum 50 characters).' });
  }
  if (syllabusText.length > 15000) {
    return res.status(400).json({ error: 'Syllabus text too long (maximum 15,000 characters).' });
  }

  try {
    // Call Claude Haiku to parse syllabus
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const parsePrompt = `You are a syllabus parser for a mythology education platform. Extract all topics, readings, figures, concepts, themes, and assignments from the syllabus text below.

The platform contains these content categories:
${CONTENT_CATEGORIES.map(c => `- ${c}`).join('\n')}

For each item you extract, produce normalized search terms that would match content in these categories. Think about:
- Deity names (e.g., "Zeus", "Osiris", "Shiva")
- Culture names (e.g., "Greek", "Egyptian", "Norse")
- Theorist names (e.g., "Joseph Campbell", "Carl Jung", "Mircea Eliade")
- Book titles (e.g., "The Hero with a Thousand Faces")
- Mythological concepts (e.g., "hero's journey", "monomyth", "archetype")
- Specific myths or stories (e.g., "Odyssey", "Gilgamesh", "Inanna's Descent")
- Astronomical/astrological terms (e.g., "zodiac", "constellation", "Orion")

Return ONLY a JSON array (no markdown, no explanation). Each item:
{
  "id": "p-1",  // sequential ID
  "text": "original text from syllabus",
  "category": "topic|reading|figure|concept|assignment|theme",
  "weekNumber": null or number,
  "searchTerms": ["term1", "term2", "term3"]  // 2-5 normalized search terms
}

Extract up to 50 items. Focus on items that could match mythology, psychology, religion, storytelling, or cultural content.

SYLLABUS TEXT:
${syllabusText}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: parsePrompt }],
    });

    // Parse Claude's response
    const responseText = response.content[0]?.text || '';
    let parsedItems;
    try {
      // Try to extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      parsedItems = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error('Failed to parse Claude response:', responseText.slice(0, 200));
      return res.status(500).json({ error: 'Failed to parse syllabus. Please try again.' });
    }

    // Match each parsed item against content index
    const matchedItems = [];
    const unmatchedItems = [];

    for (const item of parsedItems) {
      const results = searchContent(item.searchTerms || []);
      if (results.length > 0) {
        // Take top 3 matches per parsed item
        const topMatches = results.slice(0, 3).map(r => ({
          contentId: r.id,
          category: r.category,
          name: r.name,
          route: r.route,
          score: r.score,
          matchedFrom: item.id,
          manuallyAdded: false,
        }));
        matchedItems.push(...topMatches);
      } else {
        unmatchedItems.push({
          text: item.text,
          parsedItemId: item.id,
          category: item.category,
          reason: 'No matching content found',
        });
      }
    }

    // Deduplicate matched items by contentId (keep highest score)
    const deduped = new Map();
    for (const m of matchedItems) {
      const existing = deduped.get(m.contentId);
      if (!existing || m.score > existing.score) {
        deduped.set(m.contentId, m);
      }
    }

    return res.status(200).json({
      parsedItems,
      matchedItems: [...deduped.values()],
      unmatchedItems,
    });
  } catch (err) {
    console.error('Teacher parse error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
