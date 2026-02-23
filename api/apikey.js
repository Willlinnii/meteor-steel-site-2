const admin = require('firebase-admin');
const crypto = require('crypto');
const { ensureFirebaseAdmin } = require('./_lib/auth');

const VALID_ACTIONS = ['generate', 'regenerate'];

function generateKey() {
  return 'myt_' + crypto.randomBytes(20).toString('hex');
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
    const secretsRef = admin.firestore().doc(`users/${uid}/meta/secrets`);

    if (action === 'generate') {
      // Check if key already exists
      const snap = await secretsRef.get();
      if (snap.exists && snap.data().mythouseApiKey) {
        return res.status(400).json({ error: 'API key already exists. Use regenerate to replace it.' });
      }
    }

    const key = generateKey();
    await secretsRef.set({
      mythouseApiKey: key,
      mythouseApiKeyCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.status(200).json({ ok: true, key });
  } catch (err) {
    console.error('API key generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate API key.' });
  }
};
