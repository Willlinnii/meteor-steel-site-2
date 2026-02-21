/**
 * Shared Firebase Admin initialization and auth helpers.
 * Reusable across all API endpoints.
 */
const admin = require('firebase-admin');

let initialized = false;

function ensureFirebaseAdmin() {
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

/**
 * Extract uid from an Authorization: Bearer <token> header.
 * Returns uid string or null if missing/invalid.
 * Does NOT reject the request — callers decide whether auth is required.
 */
async function getUidFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;
  try {
    if (!ensureFirebaseAdmin()) return null;
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid || null;
  } catch {
    return null;
  }
}

module.exports = { ensureFirebaseAdmin, getUidFromRequest };
