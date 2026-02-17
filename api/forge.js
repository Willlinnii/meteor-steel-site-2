const OpenAI = require('openai');

const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

function buildSystemPrompt(template, targetStage) {
  const stageInstruction = targetStage
    ? `Generate ONLY the chapter for the stage marked "${targetStage}". Weave the user's notes for this stage into polished narrative prose. Reference material from other stages for continuity but focus on this chapter. Still use the === stage-id === format around it.`
    : `Weave ALL the user's material into a cohesive narrative with one chapter per monomyth stage. Transform their raw notes into polished prose while preserving their voice, images, and meaning.`;

  return `You are a master storyteller and narrative architect. You weave raw material — notes, reflections, and creative fragments — into cohesive narrative.

The user is writing a ${template}. Their material follows the 8-stage monomyth cycle:
1. Golden Age (golden-age)
2. Calling Star (falling-star)
3. Crater Crossing (impact-crater)
4. Trials of Forge (forge)
5. Quench (quenching)
6. Integration (integration)
7. Draw (drawing)
8. Age of Steel (new-age)

${stageInstruction}

Format: Precede each chapter with a line === stage-id === (using the parenthetical id above, e.g. === golden-age ===). Keep each chapter 200-400 words. Be literary but accessible. Match the tone to the template type.`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { template, stageContent, targetStage } = req.body || {};

  if (!template || !Array.isArray(stageContent) || stageContent.length === 0) {
    return res.status(400).json({ error: 'Template and stageContent are required.' });
  }

  const userContent = stageContent.map(s =>
    `=== ${s.stageId} (${s.label}) ===\n${s.entries.join('\n')}`
  ).join('\n\n');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(template, targetStage) },
        { role: 'user', content: userContent },
      ],
      max_tokens: 4000,
      temperature: 0.8,
    });

    const story = completion.choices[0]?.message?.content || '';
    return res.status(200).json({ story });
  } catch (err) {
    console.error('Forge API error:', err?.message, err?.status);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
