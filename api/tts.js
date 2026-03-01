/**
 * Text-to-Speech endpoint using Replicate's Chatterbox Turbo model.
 * Accepts text + optional voiceId, returns audio URL.
 * Voice reference samples live in /public/voices/<voiceId>.mp3
 *
 * Chatterbox Multilingual: ~5s latency, high quality voice cloning.
 * Limit is 300 chars per call, so longer text is split into chunks.
 */

const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');

// In-memory rate limiting (resets on cold start, matches chat.js pattern)
const rateMap = new Map();
const RATE_LIMIT = 5;             // TTS is expensive — tighter than chat
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

// Voice ID → reference sample URL (relative to site root)
const VOICE_SAMPLES = {
  atlas: '/voices/atlas.mp3',
  // Future voices:
  // ouroboros: '/voices/ouroboros.mp3',
  // sun: '/voices/sun.mp3',
  // moon: '/voices/moon.mp3',
};

const MAX_CHARS = 290; // Stay under 300 limit with margin
const CHATTERBOX_VERSION = '9cfba4c265e685f840612be835424f8c33bdee685d7466ece7684b0d9d4c0b1c';

/** Split text into chunks at sentence boundaries, respecting max length. */
function chunkText(text, max) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= max) {
      chunks.push(remaining);
      break;
    }
    let cut = remaining.lastIndexOf('. ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf('! ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf('? ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf(', ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf(' ', max);
    if (cut === -1) cut = max;
    else cut += 1;

    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  return chunks;
}

/** Run a single Chatterbox Turbo prediction and return the audio URL. */
async function generateChunk(text, voiceSampleUrl, apiToken) {
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      version: CHATTERBOX_VERSION,
      input: {
        text: text,
        reference_audio: voiceSampleUrl,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create error: ${err}`);
  }

  let result = await createRes.json();

  // If Prefer: wait didn't resolve it, poll
  let attempts = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollRes = await fetch(result.urls.get, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
    });
    result = await pollRes.json();
    attempts++;
  }

  if (result.status === 'failed') {
    throw new Error(`Prediction failed: ${result.error}`);
  }
  if (result.status !== 'succeeded') {
    throw new Error('Prediction timed out');
  }

  return result.output;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require authenticated user
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Rate limit per user
  if (!checkRateLimit(uid)) {
    return res.status(429).json({ error: 'Too many TTS requests. Please wait a moment.' });
  }

  const { text, voiceId = 'atlas' } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field.' });
  }

  // Strip wiki-link markup [[label|path]] → just the label
  const clean = text.replace(/\[\[([^|]+)\|[^\]]+\]\]/g, '$1').trim();
  if (!clean) {
    return res.status(400).json({ error: 'No speakable text after cleanup.' });
  }

  // Cap total length to control costs (max ~6 chunks ≈ $0.03)
  const capped = clean.slice(0, 1800);

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('REPLICATE_API_TOKEN not set');
    return res.status(500).json({ error: 'TTS service not configured.' });
  }

  // Resolve voice sample URL — must be publicly accessible
  const samplePath = VOICE_SAMPLES[voiceId] || VOICE_SAMPLES.atlas;
  const siteUrl = 'https://meteor-steel-site-2.vercel.app';
  const voiceSampleUrl = `${siteUrl}${samplePath}`;

  try {
    const chunks = chunkText(capped, MAX_CHARS);

    if (chunks.length === 1) {
      const audioUrl = await generateChunk(chunks[0], voiceSampleUrl, apiToken);
      return res.status(200).json({ audioUrl });
    }

    // For multiple chunks, generate in parallel for speed
    const audioUrls = await Promise.all(
      chunks.map(chunk => generateChunk(chunk, voiceSampleUrl, apiToken))
    );

    return res.status(200).json({ audioUrls });

  } catch (err) {
    console.error('TTS error:', err?.message);
    return res.status(500).json({ error: `TTS error: ${err?.message || 'Unknown'}` });
  }
};
