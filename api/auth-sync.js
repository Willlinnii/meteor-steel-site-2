const admin = require('firebase-admin');

let initialized = false;

function ensureInit() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return true;
  }
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw || raw === '{}') return false;
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    return true;
  } catch (err) {
    console.error('Firebase Admin init failed:', err.message);
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureInit()) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const db = admin.firestore();
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name, firebase } = decoded;
    const provider = firebase?.sign_in_provider || 'unknown';
    const docRef = db.collection('site-users').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({
        email: email || null,
        displayName: name || null,
        provider,
        tags: ['site-login'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Ensure user profile document exists (for multiplayer, handles, etc.)
    const profileRef = db.collection('users').doc(uid).collection('meta').doc('profile');
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      await profileRef.set({
        email: email || null,
        displayName: name || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('auth-sync error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
