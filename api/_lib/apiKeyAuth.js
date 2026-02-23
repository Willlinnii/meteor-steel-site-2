/**
 * API key validation for the Coordinate System API.
 * Keys are validated against Firestore reverse-lookup collection: api-keys/{sha256(key)}
 */
const admin = require('firebase-admin');
const crypto = require('crypto');
const { ensureFirebaseAdmin } = require('./auth');

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key from the request.
 * Accepts key via:
 *   1. Authorization: Bearer myt_...
 *   2. ?key=myt_...
 *
 * Returns { uid, keyHash } if valid, null if invalid/missing.
 * Updates usage tracking (lastUsed, requestCount) in the background.
 */
async function validateApiKey(req) {
  let key = null;

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader.startsWith('Bearer myt_')) {
    key = authHeader.split('Bearer ')[1];
  }

  if (!key && req.query && req.query.key) {
    key = req.query.key;
  }

  if (!key || !key.startsWith('myt_')) {
    return null;
  }

  if (!ensureFirebaseAdmin()) {
    return null;
  }

  const keyHash = hashKey(key);

  try {
    const doc = await admin.firestore().doc(`api-keys/${keyHash}`).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Fire-and-forget usage tracking — don't block the response
    admin.firestore().doc(`api-keys/${keyHash}`).update({
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      requestCount: admin.firestore.FieldValue.increment(1),
    }).catch(() => {});

    return { uid: data.uid, keyHash };
  } catch (err) {
    console.error('API key validation error:', err.message);
    return null;
  }
}

module.exports = { validateApiKey, hashKey };
