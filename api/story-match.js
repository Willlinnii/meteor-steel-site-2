/**
 * POST /api/story-match
 * Layer 3: AI-powered story card comparison between two users.
 * Body: { targetUid: string } (also accepts friendUid for backward compat)
 * Returns: { score, summary, highlights, computedAt, expiresAt }
 */
const admin = require('firebase-admin');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { getAnthropicClient, getUserKeys } = require('./_lib/llm');

const CACHE_DAYS = 7;
const MAX_CARDS = 20;
const SUMMARY_CHARS = 150;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const uid = await getUidFromRequest(req);
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // Accept targetUid or friendUid for backward compat
  const targetUid = req.body?.targetUid || req.body?.friendUid;
  if (!targetUid || typeof targetUid !== 'string') {
    return res.status(400).json({ error: 'targetUid is required.' });
  }

  if (targetUid === uid) {
    return res.status(400).json({ error: 'Cannot match with yourself.' });
  }

  const firestore = admin.firestore();

  try {
    // Load both users' match-profiles to determine modes
    const [myProfileSnap, targetProfileSnap] = await Promise.all([
      firestore.doc(`match-profiles/${uid}`).get(),
      firestore.doc(`match-profiles/${targetUid}`).get(),
    ]);

    if (!myProfileSnap.exists) {
      return res.status(403).json({ error: 'You must enable matching first.' });
    }
    if (!targetProfileSnap.exists) {
      return res.status(403).json({ error: 'Target user does not have matching enabled.' });
    }

    const myMode = myProfileSnap.data()?.mode || 'friends';

    // Mode-aware authorization
    if (myMode === 'friends') {
      // Friends mode: require accepted friend-request (check both directions)
      const friendReqs = firestore.collection('friend-requests');
      const [sent, received] = await Promise.all([
        friendReqs
          .where('senderUid', '==', uid)
          .where('recipientUid', '==', targetUid)
          .where('status', '==', 'accepted')
          .limit(1)
          .get(),
        friendReqs
          .where('senderUid', '==', targetUid)
          .where('recipientUid', '==', uid)
          .where('status', '==', 'accepted')
          .limit(1)
          .get(),
      ]);
      if (sent.empty && received.empty) {
        return res.status(403).json({ error: 'Not friends with this user.' });
      }
    } else if (myMode === 'family') {
      // Family mode: verify shared family membership
      const familiesSnap = await firestore.collection('families')
        .where('memberUids', 'array-contains', uid)
        .get();
      let sharedFamily = false;
      familiesSnap.forEach(d => {
        const members = d.data().memberUids || [];
        if (members.includes(targetUid)) sharedFamily = true;
      });
      if (!sharedFamily) {
        return res.status(403).json({ error: 'Not in the same family.' });
      }
    } else if (myMode === 'new-friends') {
      // New Friends mode: both users just need match-profiles (already verified above)
      // No additional check needed
    } else if (myMode === 'romantic') {
      // Romantic mode: target must be in romantic or new-friends mode
      const targetMode = targetProfileSnap.data()?.mode || 'friends';
      if (targetMode !== 'romantic' && targetMode !== 'new-friends') {
        return res.status(403).json({ error: 'Target is not in a compatible mode.' });
      }
      // Verify target is not family
      const familiesSnap = await firestore.collection('families')
        .where('memberUids', 'array-contains', uid)
        .get();
      let isFamily = false;
      familiesSnap.forEach(d => {
        const members = d.data().memberUids || [];
        if (members.includes(targetUid)) isFamily = true;
      });
      if (isFamily) {
        return res.status(403).json({ error: 'Cannot romantically match with family members.' });
      }
    }

    // Check cache
    const cacheRef = firestore.doc(`match-profiles/${uid}/comparisons/${targetUid}`);
    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data();
      const expiresAt = data.expiresAt?.toMillis?.() || 0;
      if (expiresAt > Date.now()) {
        return res.status(200).json(data);
      }
    }

    // Fetch both users' story cards
    const [myCardsSnap, theirCardsSnap] = await Promise.all([
      firestore.collection(`users/${uid}/story-cards`).get(),
      firestore.collection(`users/${targetUid}/story-cards`).get(),
    ]);

    const serialize = (snap) => {
      const cards = [];
      snap.forEach(d => {
        const data = d.data();
        cards.push({
          title: data.title || '',
          category: data.category || '',
          summary: (data.summary || '').substring(0, SUMMARY_CHARS),
        });
      });
      return cards.slice(0, MAX_CARDS);
    };

    const myCards = serialize(myCardsSnap);
    const theirCards = serialize(theirCardsSnap);

    if (myCards.length === 0 || theirCards.length === 0) {
      return res.status(200).json({
        score: 0,
        summary: 'Not enough story cards to compare.',
        highlights: [],
        computedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CACHE_DAYS * 86400000).toISOString(),
      });
    }

    // Call Claude Haiku to compare
    const userKeys = await getUserKeys(uid);
    const anthropic = getAnthropicClient(userKeys.anthropicKey);

    const prompt = `Compare these two users' story card collections and find thematic connections, shared archetypes, and narrative patterns.

User A's cards:
${myCards.map(c => `- [${c.category}] ${c.title}: ${c.summary}`).join('\n')}

User B's cards:
${theirCards.map(c => `- [${c.category}] ${c.title}: ${c.summary}`).join('\n')}

Respond with valid JSON only, no markdown:
{
  "score": <0-100 story resonance score>,
  "summary": "<2-3 sentence narrative about their shared themes>",
  "highlights": [
    { "category": "<theme category>", "label": "<short label>", "detail": "<one sentence>" }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content?.[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { score: 0, summary: 'Could not analyze stories.', highlights: [] };
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CACHE_DAYS * 86400000);

    const result = {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      summary: (parsed.summary || '').substring(0, 500),
      highlights: (parsed.highlights || []).slice(0, 5),
      computedAt: now,
      expiresAt,
    };

    // Cache result
    await cacheRef.set(result);

    // Return with serialized timestamps
    return res.status(200).json({
      ...result,
      computedAt: now.toDate().toISOString(),
      expiresAt: expiresAt.toDate().toISOString(),
    });
  } catch (err) {
    console.error('Story match error:', err);
    return res.status(500).json({ error: 'Failed to compute story match.' });
  }
};
