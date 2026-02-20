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

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,20}$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureInit()) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  const { token, handle } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }
  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'Missing handle' });
  }
  if (!HANDLE_RE.test(handle)) {
    return res.status(400).json({ error: 'Handle must be 3-20 characters, alphanumeric/underscore/hyphen only' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const db = admin.firestore();
    const handleLower = handle.toLowerCase();
    const handleRef = db.collection('handles').doc(handleLower);
    const profileRef = db.collection('users').doc(uid).collection('meta').doc('profile');

    // Transaction: atomically claim handle + update profile
    await db.runTransaction(async (tx) => {
      const handleDoc = await tx.get(handleRef);

      if (handleDoc.exists) {
        const existingUid = handleDoc.data().uid;
        if (existingUid === uid) {
          // User is re-registering their own handle (maybe changing casing)
          tx.set(handleRef, {
            uid,
            handle,
            createdAt: handleDoc.data().createdAt,
          });
          tx.set(profileRef, { handle, handleLower, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          return;
        }
        throw new Error('HANDLE_TAKEN');
      }

      // Check if user already has a handle — release old one
      const profileDoc = await tx.get(profileRef);
      if (profileDoc.exists && profileDoc.data().handleLower) {
        const oldHandleLower = profileDoc.data().handleLower;
        if (oldHandleLower !== handleLower) {
          tx.delete(db.collection('handles').doc(oldHandleLower));
        }
      }

      tx.set(handleRef, {
        uid,
        handle,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.set(profileRef, { handle, handleLower, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    return res.status(200).json({ ok: true, handle });
  } catch (err) {
    if (err.message === 'HANDLE_TAKEN') {
      return res.status(409).json({ error: 'Handle is already taken' });
    }
    console.error('register-handle error:', err);
    return res.status(500).json({ error: 'Failed to register handle' });
  }
};
