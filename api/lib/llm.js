/**
 * Shared LLM client factory + BYOK key retrieval.
 * Single point of creation — BYOK keys are injected here.
 */
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const admin = require('firebase-admin');
const { ensureFirebaseAdmin } = require('./auth');

function getAnthropicClient(apiKey) {
  return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
}

function getOpenAIClient(apiKey) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
}

/**
 * Read BYOK keys from Firestore: users/{uid}/meta/secrets
 * Returns { anthropicKey, openaiKey } — null values mean "use platform key".
 * Requires ensureFirebaseAdmin() to have been called first.
 */
async function getUserKeys(uid) {
  if (!uid) return {};
  try {
    ensureFirebaseAdmin();
    const snap = await admin.firestore().doc(`users/${uid}/meta/secrets`).get();
    if (!snap.exists) return {};
    const data = snap.data();
    return {
      anthropicKey: data.anthropicKey || null,
      openaiKey: data.openaiKey || null,
    };
  } catch {
    return {};
  }
}

module.exports = { getAnthropicClient, getOpenAIClient, getUserKeys };
