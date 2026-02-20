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

  // Verify the caller is admin
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
    if (decoded.email !== adminEmail) {
      return res.status(403).json({ error: 'Not admin' });
    }

    // List all Firebase Auth users
    const users = [];
    let nextPageToken;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach(u => {
        users.push({
          uid: u.uid,
          email: u.email || null,
          displayName: u.displayName || null,
          createdAt: u.metadata.creationTime || null,
          lastSignIn: u.metadata.lastSignInTime || null,
        });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    return res.status(200).json({ users });
  } catch (err) {
    console.error('list-users error:', err);
    return res.status(500).json({ error: 'Failed to list users' });
  }
};
