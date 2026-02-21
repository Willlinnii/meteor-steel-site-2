const admin = require('firebase-admin');
const { getMentorTypeInfo } = require('./lib/mentorTypes');
const { getAnthropicClient, getUserKeys } = require('./lib/llm');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./lib/auth');

// Model config
const MODELS = {
  fast: process.env.LLM_FAST_MODEL || 'claude-haiku-4-5-20251001',
};

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const { action } = req.body || {};

  if (!action || !['approve', 'reject', 'screen'].includes(action)) {
    return res.status(400).json({ error: 'action (approve/reject/screen) is required.' });
  }

  // --- Screen action: user's own token (not admin) ---
  if (action === 'screen') {
    return handleScreen(req, res);
  }

  // --- Approve/Reject: require admin email ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const { applicationId, rejectionReason } = req.body || {};

  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required.' });
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    // Get the application
    const appRef = db.doc(`mentor-applications/${applicationId}`);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const appData = appSnap.data();
    const uid = appData.uid;

    if (action === 'approve') {
      // Update application
      await appRef.update({
        status: 'approved',
        resolvedAt: now,
        resolvedBy: ADMIN_EMAIL,
      });

      // Update user profile — use update() with dot-notation for nested fields
      const profileRef = db.doc(`users/${uid}/meta/profile`);
      await profileRef.update({
        'mentor.status': 'approved',
        'mentor.approvedAt': Date.now(),
        'mentor.adminReviewedBy': ADMIN_EMAIL,
        updatedAt: now,
      });

      // Auto-create directory entry (inactive) so mentor just needs to write bio + publish
      const profileSnap = await profileRef.get();
      const profile = profileSnap.exists ? profileSnap.data() : {};
      const mentorType = profile.mentor?.type || appData.type;

      const typeInfo = getMentorTypeInfo(mentorType);

      const creds = profile.credentials || {};
      const cred = creds[mentorType] || {};
      const credLevel = cred.level || 2;
      const credLevelNames = { 1: 'Initiate', 2: 'Adept', 3: 'Master', 4: 'Grand Master', 5: 'Archon' };

      const dirRef = db.doc(`mentor-directory/${uid}`);
      await dirRef.set({
        uid,
        handle: profile.handle || null,
        displayName: profile.displayName || null,
        mentorType,
        mentorTitle: typeInfo.title,
        mentorIcon: typeInfo.icon,
        credentialLevel: credLevel,
        credentialName: credLevelNames[credLevel] || `Level ${credLevel}`,
        bio: '',
        capacity: 5,
        activeStudents: 0,
        availableSlots: 5,
        active: false,
        createdAt: now,
        updatedAt: now,
      });

      return res.status(200).json({ success: true, status: 'approved' });
    } else {
      // Reject
      const reason = rejectionReason || 'Application did not meet requirements.';

      await appRef.update({
        status: 'rejected',
        resolvedAt: now,
        resolvedBy: ADMIN_EMAIL,
        rejectionReason: reason,
      });

      const profileRef = db.doc(`users/${uid}/meta/profile`);
      await profileRef.update({
        'mentor.status': 'rejected',
        'mentor.rejectedAt': Date.now(),
        'mentor.rejectionReason': reason,
        'mentor.adminReviewedBy': ADMIN_EMAIL,
        updatedAt: now,
      });

      return res.status(200).json({ success: true, status: 'rejected' });
    }
  } catch (err) {
    console.error('Mentor admin error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};

async function handleScreen(req, res) {
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
}
