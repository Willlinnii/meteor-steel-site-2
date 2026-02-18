const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
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

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('auth-sync error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
