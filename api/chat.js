const OpenAI = require('openai');

// Import JSON data directly so Vercel's bundler includes them
const figures = require('../src/data/figures.json');
const modernFigures = require('../src/data/modernFigures.json');
const stageOverviews = require('../src/data/stageOverviews.json');
const steelProcess = require('../src/data/steelProcess.json');
const saviors = require('../src/data/saviors.json');
const ufo = require('../src/data/ufo.json');
const monomyth = require('../src/data/monomyth.json');
const synthesis = require('../src/data/synthesis.json');

// In-memory rate limiting (resets when the serverless function cold-starts)
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

function formatArray(label, arr) {
  const sections = [];
  for (const figure of arr) {
    const stageTexts = Object.entries(figure.stages)
      .filter(([, v]) => v && v.trim())
      .map(([stage, text]) => `  [${stage}]: ${text}`)
      .join('\n');
    if (stageTexts) {
      sections.push(`## ${label} — ${figure.name}\n${stageTexts}`);
    }
  }
  return sections.join('\n\n');
}

function formatObject(label, obj) {
  const entries = Object.entries(obj)
    .filter(([, v]) => v && String(v).trim())
    .map(([key, text]) => `  [${key}]: ${text}`)
    .join('\n');
  return entries ? `## ${label}\n${entries}` : '';
}

function loadData() {
  const parts = [
    formatArray('figures', figures),
    formatArray('ironAgeSaviors', saviors),
    formatArray('modernFigures', modernFigures),
    formatObject('stageOverviews', stageOverviews),
    formatObject('steelProcess', steelProcess),
    formatObject('ufo', ufo),
    formatObject('monomyth', monomyth),
    formatObject('synthesis', synthesis),
  ].filter(Boolean);

  return parts.join('\n\n');
}

let cachedContent = null;

function getSystemPrompt() {
  if (!cachedContent) {
    cachedContent = loadData();
  }
  return `You are an expert guide to the Meteor Steel Mythology Archive — a scholarly project exploring how the mythological archetype of the "meteor steel hero" appears across cultures as a metaphor for technological transformation, societal disruption, and personal growth.

The archive covers the 8-stage meteor steel monomyth cycle:
1. Golden Age — the world before disruption
2. Falling Star — the celestial arrival
3. Impact Crater — heaven meets earth
4. Forge — trials by fire
5. Quenching — transformation through cooling
6. Integration — inclusion over purification
7. Drawing — the hero fully emerges
8. New Age — the world transformed

Below is the full content of the archive. Use it to answer questions accurately. Quote or reference specific passages when relevant. If asked about something not covered in the archive, say so honestly.

---
${cachedContent}
---

Keep answers conversational but substantive. When discussing mythological figures, reference their specific stage content from the archive.`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before asking another question.',
    });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Validate: cap at 20 messages, 4000 chars each
  const trimmed = messages.slice(-20).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 4000),
  }));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...trimmed,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI API error:', err?.message, err?.status, err?.code);
    if (err.status === 401) {
      return res.status(500).json({ error: 'API configuration error.' });
    }
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
