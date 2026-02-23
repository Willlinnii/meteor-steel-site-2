const admin = require('firebase-admin');
const { ensureFirebaseAdmin } = require('./_lib/auth');

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';

module.exports = async (req, res) => {
  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Verify admin token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  let decoded;
  try {
    const token = authHeader.split('Bearer ')[1];
    decoded = await admin.auth().verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const db = admin.firestore();
  const col = db.collection('admin-contacts');

  try {
    // GET — fetch all admin contacts
    if (req.method === 'GET') {
      const snap = await col.orderBy('createdAt', 'desc').get();
      const contacts = [];
      snap.forEach(doc => contacts.push({ id: doc.id, ...doc.data() }));
      return res.json({ contacts });
    }

    // POST — add one or more contacts
    if (req.method === 'POST') {
      const { contacts } = req.body || {};
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: 'contacts array is required.' });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const ids = [];

      // Chunk into batches of 450 (under Firestore 500 limit)
      for (let i = 0; i < contacts.length; i += 450) {
        const chunk = contacts.slice(i, i + 450);
        const batch = db.batch();
        for (const c of chunk) {
          const ref = col.doc();
          batch.set(ref, {
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            emails: c.emails || [],
            phones: c.phones || [],
            company: c.company || '',
            jobTitle: c.jobTitle || '',
            notes: c.notes || '',
            source: 'manual',
            importBatch: c.importBatch || null,
            createdAt: now,
            updatedAt: now,
          });
          ids.push(ref.id);
        }
        await batch.commit();
      }

      return res.json({ success: true, count: contacts.length, ids });
    }

    // DELETE — remove a single contact
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'id is required.' });
      }
      await col.doc(id).delete();
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('admin-contacts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
