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
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Auth: Bearer token
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

  const { action, consultantUid, consultingType, message, requestId } = req.body || {};

  if (!['request', 'accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be request, accept, or decline.' });
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    // --- REQUEST: any auth user requests consulting ---
    if (action === 'request') {
      if (!consultantUid) {
        return res.status(400).json({ error: 'consultantUid is required.' });
      }
      if (consultantUid === uid) {
        return res.status(400).json({ error: 'Cannot request consulting from yourself.' });
      }

      // Verify consultant has consulting profile
      const dirRef = db.doc(`mentor-directory/${consultantUid}`);
      const dirSnap = await dirRef.get();
      if (!dirSnap.exists || !dirSnap.data().active) {
        return res.status(404).json({ error: 'Consultant not found in directory.' });
      }
      if (!dirSnap.data().consultingAvailable) {
        return res.status(400).json({ error: 'Consultant is not currently accepting consulting requests.' });
      }

      // Check for duplicate pending request
      const existingSnap = await db.collection('consulting-requests')
        .where('consultantUid', '==', consultantUid)
        .where('requesterUid', '==', uid)
        .where('status', '==', 'pending')
        .get();
      if (!existingSnap.empty) {
        return res.status(409).json({ error: 'You already have a pending consulting request with this mentor.' });
      }

      // Get requester handle
      const requesterProfileSnap = await db.doc(`users/${uid}/meta/profile`).get();
      const requesterHandle = requesterProfileSnap.exists ? requesterProfileSnap.data().handle || null : null;

      const requestData = {
        consultantUid,
        requesterUid: uid,
        requesterHandle,
        consultantHandle: dirSnap.data().handle || null,
        consultingType: consultingType || null,
        message: (typeof message === 'string' && message.trim()) ? message.trim().slice(0, 500) : null,
        status: 'pending',
        createdAt: now,
        respondedAt: null,
      };

      const newRef = await db.collection('consulting-requests').add(requestData);
      return res.status(200).json({ success: true, requestId: newRef.id });
    }

    // --- ACCEPT ---
    if (action === 'accept') {
      if (!requestId) {
        return res.status(400).json({ error: 'requestId is required.' });
      }

      const reqRef = db.doc(`consulting-requests/${requestId}`);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) {
        return res.status(404).json({ error: 'Request not found.' });
      }

      const reqData = reqSnap.data();
      if (reqData.consultantUid !== uid) {
        return res.status(403).json({ error: 'Only the consultant can accept.' });
      }
      if (reqData.status !== 'pending') {
        return res.status(400).json({ error: 'Request is not pending.' });
      }

      await reqRef.update({ status: 'accepted', respondedAt: now });
      return res.status(200).json({ success: true, status: 'accepted' });
    }

    // --- DECLINE ---
    if (action === 'decline') {
      if (!requestId) {
        return res.status(400).json({ error: 'requestId is required.' });
      }

      const reqRef = db.doc(`consulting-requests/${requestId}`);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) {
        return res.status(404).json({ error: 'Request not found.' });
      }

      const reqData = reqSnap.data();
      if (reqData.consultantUid !== uid) {
        return res.status(403).json({ error: 'Only the consultant can decline.' });
      }
      if (reqData.status !== 'pending') {
        return res.status(400).json({ error: 'Request is not pending.' });
      }

      await reqRef.update({ status: 'declined', respondedAt: now });
      return res.status(200).json({ success: true, status: 'declined' });
    }
  } catch (err) {
    console.error('Consulting request error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
