const admin = require('firebase-admin');
const { ensureFirebaseAdmin } = require('./lib/auth');

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,20}$/;

module.exports = async (req, res) => {
  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  // POST = register handle, GET = search handles
  if (req.method === 'POST') {
    return handleRegister(req, res);
  } else if (req.method === 'GET') {
    return handleSearch(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

async function handleRegister(req, res) {
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
}

async function handleSearch(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split('Bearer ')[1];
  const query = (req.query.q || '').trim().toLowerCase();

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const db = admin.firestore();

    // Prefix search on handles collection (doc IDs are lowercased handles)
    const end = query.slice(0, -1) + String.fromCharCode(query.charCodeAt(query.length - 1) + 1);
    const snap = await db.collection('handles')
      .where(admin.firestore.FieldPath.documentId(), '>=', query)
      .where(admin.firestore.FieldPath.documentId(), '<', end)
      .limit(11)
      .get();

    const results = [];
    snap.forEach(doc => {
      const data = doc.data();
      if (data.uid !== uid) {
        results.push({ handle: data.handle, uid: data.uid });
      }
    });

    return res.status(200).json({ results: results.slice(0, 10) });
  } catch (err) {
    console.error('search-handles error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}
