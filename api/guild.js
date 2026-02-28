const admin = require('firebase-admin');
const { getGuildTypeInfo } = require('./_lib/guildTypes');

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

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 10000;
const MAX_IMAGES = 4;

// Required courses before a guild member is considered "active" (mirrors guildEngine.js)
const REQUIRED_GUILD_COURSES = [
  'monomyth-explorer',
  'celestial-clocks-explorer',
  'atlas-conversationalist',
];

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

  let uid, email;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const { action } = req.body || {};
  const validActions = ['create-post', 'create-reply', 'vote', 'delete-post', 'delete-reply', 'pin-post', 'cleanup-match'];

  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const isAdmin = email === ADMIN_EMAIL;

  // --- CLEANUP MATCH (chat subcollection) ---
  if (action === 'cleanup-match') {
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required.' });
    }
    try {
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
      const chatSnap = await matchRef.collection('chat').get();
      const batch = db.batch();
      chatSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return res.status(200).json({ ok: true, deleted: chatSnap.size });
    } catch (err) {
      console.error('cleanup-match error:', err);
      return res.status(500).json({ error: 'Cleanup failed' });
    }
  }

  // Helper: verify user is an active guild member (approved + required courses complete)
  async function verifyGuildMember() {
    const profileSnap = await db.doc(`users/${uid}/meta/profile`).get();
    if (!profileSnap.exists) return null;
    const profile = profileSnap.data();
    if ((profile.guild?.status || profile.mentor?.status) !== 'approved') return null;

    // Check required guild courses from certificates
    const certSnap = await db.doc(`users/${uid}/meta/certificates`).get();
    const completed = certSnap.exists ? certSnap.data()?.completed || {} : {};
    const coursesComplete = REQUIRED_GUILD_COURSES.every(id => !!completed[id]);
    if (!coursesComplete) return null;

    return profile;
  }

  try {
    // --- CREATE POST ---
    if (action === 'create-post') {
      const profile = await verifyGuildMember();
      if (!profile) {
        return res.status(403).json({ error: 'Only active guild members can post.' });
      }

      const { title, body, imageUrls } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required.' });
      }
      if (title.length > MAX_TITLE_LENGTH) {
        return res.status(400).json({ error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` });
      }
      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        return res.status(400).json({ error: 'Body is required.' });
      }
      if (body.length > MAX_BODY_LENGTH) {
        return res.status(400).json({ error: `Body must be ${MAX_BODY_LENGTH} characters or fewer.` });
      }
      const images = Array.isArray(imageUrls) ? imageUrls.slice(0, MAX_IMAGES) : [];

      const typeInfo = getGuildTypeInfo(profile.guild?.type || profile.mentor?.type);

      const postData = {
        authorUid: uid,
        authorHandle: profile.handle || null,
        authorGuildType: profile.guild?.type || profile.mentor?.type || null,
        authorGuildIcon: typeInfo.icon,
        title: title.trim(),
        body: body.trim(),
        imageUrls: images,
        score: 0,
        replyCount: 0,
        pinned: false,
        deleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const postRef = await db.collection('guild-posts').add(postData);
      return res.status(200).json({ success: true, postId: postRef.id });
    }

    // --- CREATE REPLY ---
    if (action === 'create-reply') {
      const profile = await verifyGuildMember();
      if (!profile) {
        return res.status(403).json({ error: 'Only active guild members can reply.' });
      }

      const { postId, body, parentReplyId } = req.body;
      if (!postId) {
        return res.status(400).json({ error: 'postId is required.' });
      }
      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        return res.status(400).json({ error: 'Body is required.' });
      }
      if (body.length > MAX_BODY_LENGTH) {
        return res.status(400).json({ error: `Body must be ${MAX_BODY_LENGTH} characters or fewer.` });
      }

      const postRef = db.doc(`guild-posts/${postId}`);
      const postSnap = await postRef.get();
      if (!postSnap.exists || postSnap.data().deleted) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      const typeInfo = getGuildTypeInfo(profile.guild?.type || profile.mentor?.type);

      const replyData = {
        authorUid: uid,
        authorHandle: profile.handle || null,
        authorGuildType: profile.guild?.type || profile.mentor?.type || null,
        authorGuildIcon: typeInfo.icon,
        body: body.trim(),
        parentReplyId: parentReplyId || null,
        score: 0,
        deleted: false,
        createdAt: now,
      };

      const batch = db.batch();
      const replyRef = db.collection(`guild-posts/${postId}/replies`).doc();
      batch.set(replyRef, replyData);
      batch.update(postRef, {
        replyCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });
      await batch.commit();

      return res.status(200).json({ success: true, replyId: replyRef.id });
    }

    // --- VOTE ---
    if (action === 'vote') {
      const profile = await verifyGuildMember();
      if (!profile) {
        return res.status(403).json({ error: 'Only active guild members can vote.' });
      }

      const { targetId, targetType, postId, value } = req.body;
      if (!targetId || !['post', 'reply'].includes(targetType)) {
        return res.status(400).json({ error: 'targetId and targetType (post|reply) are required.' });
      }
      if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: 'Value must be 1 or -1.' });
      }

      const voteDocId = `${targetId}_${uid}`;
      const voteRef = db.doc(`guild-votes/${voteDocId}`);

      // Use transaction to handle vote flipping
      const result = await db.runTransaction(async (tx) => {
        const voteSnap = await tx.get(voteRef);
        const targetRef = targetType === 'post'
          ? db.doc(`guild-posts/${targetId}`)
          : db.doc(`guild-posts/${postId}/replies/${targetId}`);

        if (voteSnap.exists) {
          const oldValue = voteSnap.data().value;
          if (oldValue === value) {
            // Remove vote (toggle off)
            tx.delete(voteRef);
            tx.update(targetRef, { score: admin.firestore.FieldValue.increment(-value) });
            return { action: 'removed' };
          } else {
            // Flip vote
            tx.update(voteRef, { value, updatedAt: now });
            tx.update(targetRef, { score: admin.firestore.FieldValue.increment(value * 2) });
            return { action: 'flipped', value };
          }
        } else {
          // New vote
          tx.set(voteRef, {
            targetId,
            targetType,
            postId: postId || targetId,
            voterUid: uid,
            value,
            createdAt: now,
          });
          tx.update(targetRef, { score: admin.firestore.FieldValue.increment(value) });
          return { action: 'created', value };
        }
      });

      return res.status(200).json({ success: true, ...result });
    }

    // --- DELETE POST ---
    if (action === 'delete-post') {
      const { postId } = req.body;
      if (!postId) {
        return res.status(400).json({ error: 'postId is required.' });
      }

      const postRef = db.doc(`guild-posts/${postId}`);
      const postSnap = await postRef.get();
      if (!postSnap.exists) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      const post = postSnap.data();
      if (post.authorUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Only the author or admin can delete.' });
      }

      await postRef.update({ deleted: true, updatedAt: now });
      return res.status(200).json({ success: true });
    }

    // --- DELETE REPLY ---
    if (action === 'delete-reply') {
      const { postId, replyId } = req.body;
      if (!postId || !replyId) {
        return res.status(400).json({ error: 'postId and replyId are required.' });
      }

      const replyRef = db.doc(`guild-posts/${postId}/replies/${replyId}`);
      const replySnap = await replyRef.get();
      if (!replySnap.exists) {
        return res.status(404).json({ error: 'Reply not found.' });
      }

      const reply = replySnap.data();
      if (reply.authorUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Only the author or admin can delete.' });
      }

      await replyRef.update({ deleted: true });
      return res.status(200).json({ success: true });
    }

    // --- PIN POST ---
    if (action === 'pin-post') {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only admin can pin posts.' });
      }

      const { postId } = req.body;
      if (!postId) {
        return res.status(400).json({ error: 'postId is required.' });
      }

      const postRef = db.doc(`guild-posts/${postId}`);
      const postSnap = await postRef.get();
      if (!postSnap.exists) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      const currentPinned = postSnap.data().pinned || false;
      await postRef.update({ pinned: !currentPinned, updatedAt: now });
      return res.status(200).json({ success: true, pinned: !currentPinned });
    }
  } catch (err) {
    console.error('Guild API error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
