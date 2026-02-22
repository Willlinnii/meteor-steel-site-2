/**
 * Text-to-Speech endpoint using Replicate's Chatterbox model.
 * Accepts text + optional voiceId, returns audio URL.
 * Voice reference samples live in /public/voices/<voiceId>.mp3
 *
 * Chatterbox limit is 300 chars per call, so longer text is split
 * into chunks and generated sequentially, returning multiple audio URLs.
 */

// Voice ID → reference sample URL (relative to site root)
const VOICE_SAMPLES = {
  atlas: '/voices/atlas.mp3',
  // Future voices:
  // ouroboros: '/voices/ouroboros.mp3',
  // sun: '/voices/sun.mp3',
  // moon: '/voices/moon.mp3',
  // mercury: '/voices/mercury.mp3',
  // venus: '/voices/venus.mp3',
  // mars: '/voices/mars.mp3',
  // jupiter: '/voices/jupiter.mp3',
  // saturn: '/voices/saturn.mp3',
};

const MAX_CHARS = 290; // Stay under 300 limit with margin

/** Split text into chunks at sentence boundaries, respecting max length. */
function chunkText(text, max) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= max) {
      chunks.push(remaining);
      break;
    }
    // Find last sentence boundary within limit
    let cut = remaining.lastIndexOf('. ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf('! ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf('? ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf(', ', max);
    if (cut === -1 || cut < max * 0.3) cut = remaining.lastIndexOf(' ', max);
    if (cut === -1) cut = max;
    else cut += 1; // Include the punctuation

    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  return chunks;
}

/** Run a single Chatterbox prediction and return the audio URL. */
async function generateChunk(text, voiceSampleUrl, apiToken) {
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      version: '9cfba4c265e685f840612be835424f8c33bdee685d7466ece7684b0d9d4c0b1c',
      input: {
        text: text,
        reference_audio: voiceSampleUrl,
        exaggeration: 0.4,
        cfg_weight: 0.5,
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

    // For a single chunk, return a single URL
    if (chunks.length === 1) {
      const audioUrl = await generateChunk(chunks[0], voiceSampleUrl, apiToken);
      return res.status(200).json({ audioUrl });
    }

    // For multiple chunks, generate all and return array
    const audioUrls = [];
    for (const chunk of chunks) {
      const url = await generateChunk(chunk, voiceSampleUrl, apiToken);
      audioUrls.push(url);
    }

    return res.status(200).json({ audioUrls });

  } catch (err) {
    console.error('TTS error:', err?.message);
    return res.status(500).json({ error: `TTS error: ${err?.message || 'Unknown'}` });
  }
};
