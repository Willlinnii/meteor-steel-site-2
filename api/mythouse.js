/**
 * /api/mythouse — The Mythouse Conversational Engine Endpoint
 *
 * External API that lets users send messages through the mythology engine.
 * Requires a valid API key with 'call' or 'ambient' tier.
 *
 * POST /api/mythouse
 * Headers: Authorization: Bearer myt_...
 * Body: { messages: [{ role: 'user', content: '...' }], area?, persona? }
 *
 * - Call tier:    core prompt (~4K tokens) — Atlas personality + area summaries
 * - Ambient tier: full system prompt — deep area knowledge (~10-20K tokens) + personas
 */
const { getAnthropicClient } = require('./_lib/llm');
const { validateApiKey } = require('./_lib/apiKeyAuth');
const { getTierConfig, tierHasAccess } = require('./_lib/tierConfig');
const {
  getCorePrompt,
  getSystemPrompt,
  getPersonaPrompt,
  detectAreaFromMessage,
  VALID_AREAS,
} = require('./_lib/engine');

// In-memory rate limiting per key hash (resets on cold start)
const rateMap = new Map();

function checkRateLimit(keyHash, maxPerMinute) {
  const now = Date.now();
  const entry = rateMap.get(keyHash);
  if (!entry || now - entry.windowStart > 60000) {
    rateMap.set(keyHash, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

const MODEL = process.env.LLM_FAST_MODEL || 'claude-haiku-4-5-20251001';

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Validate API key
  const auth = await validateApiKey(req);
  if (!auth) {
    return res.status(401).json({
      error: 'Valid API key required. Pass via "Authorization: Bearer myt_..." header.',
    });
  }

  // Tier check — must be at least 'call'
  if (!tierHasAccess(auth.tier, 'call')) {
    return res.status(403).json({
      error: 'Your API key is on the free tier. Upgrade to Call or Ambient to use this endpoint.',
      tier: auth.tier,
    });
  }

  // Monthly limit check
  if (auth.limitExceeded) {
    return res.status(429).json({
      error: 'Monthly request limit reached.',
      tier: auth.tier,
      monthlyRequests: auth.monthlyRequests,
      monthlyLimit: auth.monthlyLimit,
    });
  }

  // Per-minute rate limit
  const tierConfig = getTierConfig(auth.tier);
  if (!checkRateLimit(auth.keyHash, tierConfig.ratePerMinute)) {
    return res.status(429).json({
      error: `Rate limit exceeded. ${auth.tier} tier allows ${tierConfig.ratePerMinute} requests per minute.`,
    });
  }

  // Parse request body
  const { messages, area, persona } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Request body must include a "messages" array with at least one message.',
      example: { messages: [{ role: 'user', content: 'What stage of the journey is this?' }] },
    });
  }

  // Sanitize messages — keep last 30, enforce role/content structure
  const sanitized = messages.slice(-30).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 8000),
  }));

  // Merge consecutive same-role messages and ensure first is user
  const trimmed = [];
  for (const msg of sanitized) {
    if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === msg.role) {
      trimmed[trimmed.length - 1].content += '\n' + msg.content;
    } else {
      trimmed.push({ ...msg });
    }
  }
  if (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift();

  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'No valid user messages found.' });
  }

  // Detect area from latest user message if not explicitly provided
  const lastUserMsg = trimmed[trimmed.length - 1]?.content || '';
  const detectedArea = area && VALID_AREAS.includes(area) ? area : detectAreaFromMessage(lastUserMsg);

  // Build system prompt based on tier
  let systemPrompt;

  if (auth.tier === 'ambient') {
    // Full deep context — area knowledge, personas
    if (persona && tierConfig.hasPersonas) {
      const personaPrompt = getPersonaPrompt(persona);
      systemPrompt = personaPrompt || getSystemPrompt(detectedArea);
    } else {
      systemPrompt = getSystemPrompt(detectedArea);
    }
  } else {
    // Call tier — core prompt only (Atlas personality + area summaries)
    systemPrompt = getCorePrompt();
  }

  // API-mode framing — omit site navigation, focus on content
  systemPrompt += `\n\nAPI MODE: You are responding to an external API request, not a site visitor. Do NOT include internal site links like [[Link Text|/path]], navigation suggestions, or references to the Mythouse website interface. Focus purely on content — mythological insight, narrative architecture, and archetypal depth. Be direct and substantive.`;

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: MODEL,
      system: systemPrompt,
      messages: trimmed,
      max_tokens: 1024,
    });

    const reply = response.content?.find(c => c.type === 'text')?.text
      || response.content?.[0]?.text
      || 'No response generated.';

    return res.status(200).json({
      reply,
      usage: {
        tier: auth.tier,
        monthlyRequests: auth.monthlyRequests + 1,
        monthlyLimit: auth.monthlyLimit,
      },
    });
  } catch (err) {
    console.error('Mythouse API error:', err?.message, err?.status);
    return res.status(500).json({ error: 'Engine error. Please try again.' });
  }
};
