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

  const { token, matchId } = req.body || {};
  if (!token || !matchId) {
    return res.status(400).json({ error: 'Missing token or matchId' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const db = admin.firestore();

    // Verify the match exists and user is a participant
    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const matchData = matchDoc.data();
    if (!matchData.playerUids.includes(uid)) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    if (matchData.status !== 'completed' && matchData.status !== 'forfeited') {
      return res.status(400).json({ error: 'Match is not completed' });
    }

    // Delete chat subcollection docs
    const chatSnap = await matchRef.collection('chat').get();
    const batch = db.batch();
    chatSnap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return res.status(200).json({ ok: true, deleted: chatSnap.size });
  } catch (err) {
    console.error('cleanup-match error:', err);
    return res.status(500).json({ error: 'Cleanup failed' });
  }
};
