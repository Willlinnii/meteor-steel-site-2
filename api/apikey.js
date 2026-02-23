const admin = require('firebase-admin');
const crypto = require('crypto');
const { ensureFirebaseAdmin } = require('./_lib/auth');

const VALID_ACTIONS = ['generate', 'regenerate'];

function generateKey() {
  return 'myt_' + crypto.randomBytes(20).toString('hex');
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const { action } = req.body || {};

  if (!action || !VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` });
  }

  // Authenticate user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  let uid;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  try {
    const db = admin.firestore();
    const secretsRef = db.doc(`users/${uid}/meta/secrets`);
    const snap = await secretsRef.get();
    const existing = snap.exists ? snap.data() : {};

    if (action === 'generate') {
      if (existing.mythouseApiKey) {
        return res.status(400).json({ error: 'API key already exists. Use regenerate to replace it.' });
      }
    }

    // If regenerating, delete old reverse lookup entry
    if (action === 'regenerate' && existing.mythouseApiKey) {
      const oldHash = hashKey(existing.mythouseApiKey);
      await db.doc(`api-keys/${oldHash}`).delete();
    }

    const key = generateKey();
    const keyHash = hashKey(key);

    // Write user secret + reverse lookup in parallel
    await Promise.all([
      secretsRef.set({
        mythouseApiKey: key,
        mythouseApiKeyCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }),
      db.doc(`api-keys/${keyHash}`).set({
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requestCount: 0,
      }),
    ]);

    return res.status(200).json({ ok: true, key });
  } catch (err) {
    console.error('API key generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate API key.' });
  }
};
