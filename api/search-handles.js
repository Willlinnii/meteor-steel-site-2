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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureInit()) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

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
};
