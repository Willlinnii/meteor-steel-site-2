const { getAnthropicClient, getUserKeys } = require('./lib/llm');
const admin = require('firebase-admin');
const { getUidFromRequest } = require('./lib/auth');

// Model config — centralized for easy swapping and future BYOK support
const MODELS = {
  fast: process.env.LLM_FAST_MODEL || 'claude-haiku-4-5-20251001',
};

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

  const { uid, application, credentials } = req.body || {};

  if (!uid || !application) {
    return res.status(400).json({ error: 'uid and application are required.' });
  }

  // Verify Bearer token matches the uid in the request body
  const tokenUid = await getUidFromRequest(req);
  if (!tokenUid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (tokenUid !== uid) {
    return res.status(403).json({ error: 'Token does not match request uid.' });
  }

  // Verify the uid matches by checking the profile doc exists and has a matching mentor application
  try {
    const verifyDb = admin.firestore();
    const profileSnap = await verifyDb.doc(`users/${uid}/meta/profile`).get();
    if (!profileSnap.exists) {
      return res.status(403).json({ error: 'Invalid user.' });
    }
    const profileMentor = profileSnap.data()?.mentor;
    if (!profileMentor || profileMentor.status !== 'applied') {
      return res.status(400).json({ error: 'No pending application found for this user.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Could not verify user.' });
  }

  // BYOK: retrieve user's own API key if stored
  const userKeys = await getUserKeys(tokenUid);
  const anthropic = getAnthropicClient(userKeys.anthropicKey);

  // Build screening prompt
  const credentialSummary = credentials
    ? Object.entries(credentials)
        .filter(([, d]) => d && d.level > 0)
        .map(([cat, d]) => `${cat}: Level ${d.level} — ${d.details || 'no details'}`)
        .join('\n')
    : 'No credentials on file.';

  const screeningPrompt = `You are reviewing a mentor application for the Mythouse community. Evaluate whether this applicant should proceed to admin review.

APPLICANT CREDENTIALS:
${credentialSummary}

MENTOR TYPE APPLIED FOR: ${application.type}
APPLICATION STATEMENT: ${application.summary}
${application.documentName ? `SUPPORTING DOCUMENT: ${application.documentName} (uploaded)` : 'No supporting document uploaded.'}

EVALUATION CRITERIA:
1. Does their credential level (Level 2+) match the mentor role they're applying for?
2. Is their personal statement thoughtful, substantive, and relevant?
3. Do they demonstrate genuine interest in mentoring others?
4. Are there any red flags (incoherent statement, mismatched credentials, concerning language)?

Respond with a JSON object only — no other text:
{"passed": true/false, "notes": "Brief 1-2 sentence assessment explaining your decision."}`;

  try {
    const response = await anthropic.messages.create({
      model: MODELS.fast,
      system: 'You are a screening assistant. Respond only with valid JSON.',
      messages: [{ role: 'user', content: screeningPrompt }],
      max_tokens: 256,
    });

    const text = response.content?.[0]?.text || '';
    let screening;
    try {
      screening = JSON.parse(text);
    } catch {
      screening = { passed: false, notes: 'Could not parse screening response.' };
    }

    const db = admin.firestore();
    const profileRef = db.doc(`users/${uid}/meta/profile`);
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (screening.passed) {
      // Update profile: status → pending-admin (preserve existing mentor fields)
      await profileRef.update({
        'mentor.status': 'pending-admin',
        'mentor.atlasScreeningAt': Date.now(),
        'mentor.atlasScreeningResult': { passed: true, notes: screening.notes },
        updatedAt: now,
      });

      // Get user info for the admin application record
      const profileSnap = await profileRef.get();
      const profileData = profileSnap.data() || {};

      // Fallback to site-users for email/displayName if not on profile
      let email = profileData.email || '';
      let displayName = profileData.displayName || '';
      if (!email) {
        try {
          const siteUserSnap = await db.doc(`site-users/${uid}`).get();
          const siteUser = siteUserSnap.data() || {};
          email = siteUser.email || '';
          displayName = displayName || siteUser.displayName || '';
        } catch { /* ignore */ }
      }

      // Create mentor-applications doc for admin
      await db.collection('mentor-applications').add({
        uid,
        email,
        displayName,
        handle: profileData.handle || '',
        mentorType: application.type,
        credentialLevel: credentials?.[application.type]?.level || 0,
        credentialDetails: credentials?.[application.type]?.details || '',
        applicationSummary: application.summary,
        documentUrl: application.documentUrl || null,
        documentName: application.documentName || null,
        atlasScreening: {
          passed: true,
          notes: screening.notes,
          timestamp: Date.now(),
        },
        status: 'pending-admin',
        createdAt: now,
        resolvedAt: null,
        resolvedBy: null,
        rejectionReason: null,
      });
    } else {
      // Update profile: status → rejected (preserve existing mentor fields)
      await profileRef.update({
        'mentor.status': 'rejected',
        'mentor.atlasScreeningAt': Date.now(),
        'mentor.atlasScreeningResult': { passed: false, notes: screening.notes },
        'mentor.rejectedAt': Date.now(),
        'mentor.rejectionReason': screening.notes,
        updatedAt: now,
      });
    }

    return res.status(200).json({ screening });
  } catch (err) {
    console.error('Mentor review error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
