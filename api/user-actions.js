/**
 * /api/user-actions — Consolidated user account actions
 *
 * Routes by ?route= query parameter:
 *   auth-sync       — POST: sync Firebase Auth user to Firestore
 *   handle          — POST: register handle, GET: search handles
 *   apikey          — POST: generate/regenerate API key
 */
const admin = require('firebase-admin');
const crypto = require('crypto');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { getTierConfig } = require('./_lib/tierConfig');

// ─── Handle registration ───

const HANDLE_RE = /^[a-zA-Z0-9_-]{3,20}$/;

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

    await db.runTransaction(async (tx) => {
      const handleDoc = await tx.get(handleRef);

      if (handleDoc.exists) {
        const existingUid = handleDoc.data().uid;
        if (existingUid === uid) {
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

    const resultsMap = new Map();

    const end = query.slice(0, -1) + String.fromCharCode(query.charCodeAt(query.length - 1) + 1);
    const handleSnap = await db.collection('handles')
      .where(admin.firestore.FieldPath.documentId(), '>=', query)
      .where(admin.firestore.FieldPath.documentId(), '<', end)
      .limit(11)
      .get();

    handleSnap.forEach(doc => {
      const data = doc.data();
      if (data.uid !== uid) {
        resultsMap.set(data.uid, { handle: data.handle, uid: data.uid });
      }
    });

    const siteSnap = await db.collection('site-users').get();
    const profileLookups = [];
    siteSnap.forEach(doc => {
      if (doc.id === uid || resultsMap.has(doc.id)) return;
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      const name = (data.displayName || '').toLowerCase();
      if (email.includes(query) || name.includes(query)) {
        profileLookups.push(
          db.doc(`users/${doc.id}/meta/profile`).get().then(profileSnap => {
            const handle = profileSnap.exists && profileSnap.data().handle;
            resultsMap.set(doc.id, {
              handle: handle || data.displayName || data.email,
              uid: doc.id,
              email: data.email,
            });
          })
        );
      }
    });
    await Promise.all(profileLookups);

    const results = Array.from(resultsMap.values()).slice(0, 10);
    return res.status(200).json({ results });
  } catch (err) {
    console.error('search-handles error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
}

// ─── Auth sync ───

async function handleAuthSync(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const db = admin.firestore();
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, firebase } = decoded;
    const provider = firebase?.sign_in_provider || 'unknown';

    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email || decoded.email || null;
    const displayName = userRecord.displayName || decoded.name || null;

    const docRef = db.collection('site-users').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({
        email,
        displayName,
        provider,
        tags: ['site-login'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        displayName,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const profileRef = db.collection('users').doc(uid).collection('meta').doc('profile');
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      await profileRef.set({
        email,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (!profileDoc.data().displayName && displayName) {
      await profileRef.update({ displayName, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('auth-sync error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── API key ───

function generateKey() {
  return 'myt_' + crypto.randomBytes(20).toString('hex');
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

const VALID_KEY_ACTIONS = ['generate', 'regenerate'];

async function handleApiKey(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body || {};
  if (!action || !VALID_KEY_ACTIONS.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${VALID_KEY_ACTIONS.join(', ')}` });
  }

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

  try {
    const db = admin.firestore();
    const secretsRef = db.doc(`users/${uid}/meta/secrets`);
    const snap = await secretsRef.get();
    const existing = snap.exists ? snap.data() : {};

    if (action === 'generate') {
      if (existing.mythouseApiKey) {
        return res.status(400).json({ error: 'API key already exists. Use regenerate to replace it.' });
      }
    }

    if (action === 'regenerate' && existing.mythouseApiKey) {
      const oldHash = hashKey(existing.mythouseApiKey);
      await db.doc(`api-keys/${oldHash}`).delete();
    }

    const key = generateKey();
    const keyHash = hashKey(key);
    const defaultTier = 'call';
    const tierConfig = getTierConfig(defaultTier);

    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);

    await Promise.all([
      secretsRef.set({
        mythouseApiKey: key,
        mythouseApiKeyCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }),
      db.doc(`api-keys/${keyHash}`).set({
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requestCount: 0,
        tier: defaultTier,
        monthlyRequests: 0,
        monthlyLimit: tierConfig.monthlyLimit,
        monthlyResetAt: admin.firestore.Timestamp.fromDate(nextReset),
      }),
    ]);

    return res.status(200).json({ ok: true, key });
  } catch (err) {
    console.error('API key generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate API key.' });
  }
}

// ─── Router ───

module.exports = async function handler(req, res) {
  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  const route = req.query.route;

  switch (route) {
    case 'auth-sync':
      return handleAuthSync(req, res);
    case 'handle':
      if (req.method === 'POST') return handleRegister(req, res);
      if (req.method === 'GET') return handleSearch(req, res);
      return res.status(405).json({ error: 'Method not allowed' });
    case 'apikey':
      return handleApiKey(req, res);
    default:
      return res.status(400).json({ error: 'Missing or invalid route parameter' });
  }
};
