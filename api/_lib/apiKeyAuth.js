/**
 * API key validation for the Coordinate System API.
 * Keys are validated against Firestore reverse-lookup collection: api-keys/{sha256(key)}
 */
const admin = require('firebase-admin');
const crypto = require('crypto');
const { ensureFirebaseAdmin } = require('./auth');
const { getTierConfig } = require('./tierConfig');

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key from the request.
 * Accepts key via:
 *   1. Authorization: Bearer myt_...
 *   2. ?key=myt_...
 *
 * Returns { uid, keyHash, tier, monthlyRequests, monthlyLimit, limitExceeded }
 * if valid, null if invalid/missing.
 * Updates usage tracking (lastUsed, requestCount, monthlyRequests) in the background.
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
    const docRef = admin.firestore().doc(`api-keys/${keyHash}`);
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    const tier = data.tier || 'free';
    const tierConfig = getTierConfig(tier);

    // Check if monthly counter needs resetting
    let monthlyRequests = data.monthlyRequests || 0;
    const monthlyResetAt = data.monthlyResetAt ? data.monthlyResetAt.toDate() : null;
    let needsReset = false;

    if (!monthlyResetAt || new Date() >= monthlyResetAt) {
      monthlyRequests = 0;
      needsReset = true;
    }

    const monthlyLimit = tierConfig.monthlyLimit;
    const limitExceeded = monthlyLimit > 0 && monthlyRequests >= monthlyLimit;

    // Fire-and-forget usage tracking — don't block the response
    const updateData = {
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      requestCount: admin.firestore.FieldValue.increment(1),
    };

    if (needsReset) {
      // Reset monthly counter and set next reset date
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      nextReset.setDate(1);
      nextReset.setHours(0, 0, 0, 0);
      updateData.monthlyRequests = 1;
      updateData.monthlyResetAt = admin.firestore.Timestamp.fromDate(nextReset);
    } else {
      updateData.monthlyRequests = admin.firestore.FieldValue.increment(1);
    }

    docRef.update(updateData).catch(() => {});

    return {
      uid: data.uid,
      keyHash,
      tier,
      monthlyRequests: needsReset ? 0 : monthlyRequests,
      monthlyLimit,
      limitExceeded,
    };
  } catch (err) {
    console.error('API key validation error:', err.message);
    return null;
  }
}

module.exports = { validateApiKey, hashKey };
