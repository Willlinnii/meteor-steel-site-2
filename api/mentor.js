const admin = require('firebase-admin');
const { getMentorTypeInfo } = require('./_lib/mentorTypes');
const { getAnthropicClient, getUserKeys } = require('./_lib/llm');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');
const { getContentCatalog, searchContent } = require('./_lib/contentIndex');

// Model config
const MODELS = {
  fast: process.env.LLM_FAST_MODEL || 'claude-haiku-4-5-20251001',
};

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';

const DEFAULT_CAPACITY = 5;
const MAX_CAPACITY = 20;
const MAX_BIO_LENGTH = 500;

// Valid consulting types (mirrors consultingEngine.js CONSULTING_TYPES)
const VALID_CONSULTING_TYPES = new Set(['character', 'narrative', 'coaching', 'media', 'adventure']);

// ── Guild constants ──
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 10000;
const MAX_IMAGES = 4;
const REQUIRED_MENTOR_COURSES = ['monomyth-explorer', 'celestial-clocks-explorer', 'atlas-conversationalist'];

// ── Consulting engagement stage templates ──
const STAGE_TEMPLATES = {
  storyteller: [
    { id: 'seed', label: 'The Seed', description: 'What wants to be born? The raw impulse.' },
    { id: 'call', label: 'The Call', description: 'The vision clarifies. What story is asking to be told?' },
    { id: 'descent', label: 'The Descent', description: 'Into material. Research, gathering, immersion.' },
    { id: 'forge', label: 'The Forge', description: 'Active creation. Heat and hammer.' },
    { id: 'quench', label: 'The Quench', description: 'Stepping back. Letting it cool. First reflection.' },
    { id: 'polish', label: 'The Polish', description: 'Refinement. Craft applied to raw creation.' },
    { id: 'offering', label: 'The Offering', description: 'Preparation for the world. Framing, context, courage.' },
    { id: 'release', label: 'The Release', description: 'Letting it go. The work enters the world.' },
  ],
  artist: null,
  creator: null,
  seeker: [
    { id: 'ordinary-world', label: 'Ordinary World', description: 'Where you are. The known ground.' },
    { id: 'call', label: 'The Call', description: "What's pulling you. The disturbance." },
    { id: 'threshold', label: 'The Threshold', description: 'What you must leave behind to answer.' },
    { id: 'trials', label: 'The Trials', description: 'What you face. The tests that shape you.' },
    { id: 'abyss', label: 'The Abyss', description: 'The deepest point. What dies so something can live.' },
    { id: 'return', label: 'The Return', description: 'What you bring back. The boon.' },
    { id: 'integration', label: 'Integration', description: 'Making it real in daily life.' },
    { id: 'renewal', label: 'Renewal', description: "The new ordinary world. Who you've become." },
  ],
  brand: [
    { id: 'origin', label: 'Origin', description: 'Where you came from. The founding myth.' },
    { id: 'identity', label: 'Identity', description: 'Who you are. The archetypal core.' },
    { id: 'shadow', label: 'Shadow', description: 'What you avoid. The unspoken story.' },
    { id: 'transformation', label: 'Transformation', description: "What's changing. The threshold you're crossing." },
    { id: 'voice', label: 'Voice', description: 'How you speak. The narrative language.' },
    { id: 'story', label: 'Story', description: 'The story you tell. The myth you carry.' },
    { id: 'culture', label: 'Culture', description: 'How the story lives in your people.' },
    { id: 'legacy', label: 'Legacy', description: 'What you leave behind. The myth that outlasts you.' },
  ],
  leader: null,
};

function getStagesForClientType(clientType) {
  const key = clientType || 'seeker';
  const template = STAGE_TEMPLATES[key] || STAGE_TEMPLATES[key === 'artist' || key === 'creator' ? 'storyteller' : key === 'leader' ? 'brand' : 'seeker'];
  return (template || STAGE_TEMPLATES.seeker).map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' }));
}

// All valid actions across admin, directory, pairing, consulting, guild, and engagements
const ADMIN_ACTIONS = ['approve', 'reject', 'screen'];
const DIRECTORY_ACTIONS = ['update-bio', 'update-capacity', 'publish', 'unpublish', 'update-consulting-availability'];
const PAIRING_ACTIONS = ['pairing-request', 'pairing-accept', 'pairing-decline', 'pairing-end'];
const CONSULTING_ACTIONS = ['consulting-request', 'consulting-accept', 'consulting-decline'];
const GUILD_ACTIONS = ['create-post', 'create-reply', 'vote', 'delete-post', 'delete-reply', 'pin-post', 'cleanup-match'];
const ENGAGEMENT_ACTIONS = ['create-engagement', 'get-engagement', 'list-engagements', 'update-engagement-status', 'save-session', 'get-sessions', 'assign-practitioner', 'list-practitioner-engagements', 'list-practitioners'];
const TEACHER_ACTIONS = ['get-catalog', 'parse-syllabus'];
const ALL_ACTIONS = [...ADMIN_ACTIONS, ...DIRECTORY_ACTIONS, ...PAIRING_ACTIONS, ...CONSULTING_ACTIONS, ...GUILD_ACTIONS, ...ENGAGEMENT_ACTIONS, ...TEACHER_ACTIONS];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const { action } = req.body || {};

  if (!action || !ALL_ACTIONS.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${ALL_ACTIONS.join(', ')}` });
  }

  // --- Admin actions ---
  if (ADMIN_ACTIONS.includes(action)) {
    // Screen action: user's own token (not admin)
    if (action === 'screen') {
      return handleScreen(req, res);
    }

    // Approve/Reject: require admin email
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

    return handleAdminAction(req, res);
  }

  // --- Directory / Pairing / Consulting actions: require authenticated user ---
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

  if (DIRECTORY_ACTIONS.includes(action)) {
    return handleDirectory(req, res, uid);
  } else if (PAIRING_ACTIONS.includes(action)) {
    return handlePairing(req, res, uid);
  } else if (TEACHER_ACTIONS.includes(action)) {
    return handleTeacher(req, res, uid);
  } else {
    return handleConsulting(req, res, uid);
  }
};

// ============================================================
// ADMIN: approve, reject
// ============================================================

async function handleAdminAction(req, res) {
  const { action, applicationId, rejectionReason } = req.body || {};

  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required.' });
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    const appRef = db.doc(`mentor-applications/${applicationId}`);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const appData = appSnap.data();
    const uid = appData.uid;

    if (action === 'approve') {
      await appRef.update({
        status: 'approved',
        resolvedAt: now,
        resolvedBy: ADMIN_EMAIL,
      });

      const profileRef = db.doc(`users/${uid}/meta/profile`);
      await profileRef.update({
        'mentor.status': 'approved',
        'mentor.approvedAt': Date.now(),
        'mentor.adminReviewedBy': ADMIN_EMAIL,
        updatedAt: now,
      });

      // Auto-create directory entry (inactive)
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
}

// ============================================================
// SCREEN: AI screening of mentor application (user's own token)
// ============================================================

async function handleScreen(req, res) {
  const { uid, application, credentials } = req.body || {};

  if (!uid || !application) {
    return res.status(400).json({ error: 'uid and application are required.' });
  }

  const tokenUid = await getUidFromRequest(req);
  if (!tokenUid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (tokenUid !== uid) {
    return res.status(403).json({ error: 'Token does not match request uid.' });
  }

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

  const userKeys = await getUserKeys(tokenUid);
  const anthropic = getAnthropicClient(userKeys.anthropicKey);

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
      await profileRef.update({
        'mentor.status': 'pending-admin',
        'mentor.atlasScreeningAt': Date.now(),
        'mentor.atlasScreeningResult': { passed: true, notes: screening.notes },
        updatedAt: now,
      });

      const profileSnap = await profileRef.get();
      const profileData = profileSnap.data() || {};

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

// ============================================================
// DIRECTORY: update-bio, update-capacity, publish, unpublish, update-consulting-availability
// ============================================================

async function handleDirectory(req, res, uid) {
  const { action, bio, capacity } = req.body || {};
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const profileRef = db.doc(`users/${uid}/meta/profile`);

  try {
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    const profile = profileSnap.data();
    const mentorStatus = profile.mentor?.status;
    if (mentorStatus !== 'approved') {
      return res.status(403).json({ error: 'Mentor status must be approved.' });
    }

    if (action === 'update-bio') {
      if (typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string.' });
      }
      if (bio.length > MAX_BIO_LENGTH) {
        return res.status(400).json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` });
      }

      const batch = db.batch();
      batch.update(profileRef, { 'mentor.bio': bio, updatedAt: now });

      const dirRef = db.doc(`mentor-directory/${uid}`);
      const dirSnap = await dirRef.get();
      if (dirSnap.exists) {
        batch.update(dirRef, { bio, updatedAt: now });
      }

      await batch.commit();
      return res.status(200).json({ success: true, bio });
    }

    if (action === 'update-capacity') {
      const cap = parseInt(capacity, 10);
      if (isNaN(cap) || cap < 1 || cap > MAX_CAPACITY) {
        return res.status(400).json({ error: `Capacity must be between 1 and ${MAX_CAPACITY}.` });
      }

      const batch = db.batch();
      batch.update(profileRef, { 'mentor.capacity': cap, updatedAt: now });

      const dirRef = db.doc(`mentor-directory/${uid}`);
      const dirSnap = await dirRef.get();
      if (dirSnap.exists) {
        const activeStudents = dirSnap.data().activeStudents || 0;
        batch.update(dirRef, {
          capacity: cap,
          availableSlots: Math.max(0, cap - activeStudents),
          updatedAt: now,
        });
      }

      await batch.commit();
      return res.status(200).json({ success: true, capacity: cap });
    }

    if (action === 'publish') {
      const mentorType = profile.mentor?.type;
      const typeInfo = getMentorTypeInfo(mentorType);

      const creds = profile.credentials || {};
      const cred = creds[mentorType] || {};
      const credLevel = cred.level || 2;
      const credLevelNames = {
        1: 'Initiate', 2: 'Adept', 3: 'Master', 4: 'Grand Master', 5: 'Archon',
      };

      const cap = profile.mentor?.capacity || DEFAULT_CAPACITY;

      const pairingsSnap = await db.collection('mentor-pairings')
        .where('mentorUid', '==', uid)
        .where('status', '==', 'accepted')
        .get();
      const activeStudents = pairingsSnap.size;

      const consulting = profile.consulting || {};
      const consultingTypes = (consulting.consultingTypes || []).filter(t => VALID_CONSULTING_TYPES.has(t));
      const consultingProjectCount = (consulting.projects || []).length;
      const consultingAvailable = consultingProjectCount >= 3;

      const dirRef = db.doc(`mentor-directory/${uid}`);
      const dirData = {
        uid,
        handle: profile.handle || null,
        displayName: profile.displayName || null,
        mentorType,
        mentorTitle: typeInfo.title,
        mentorIcon: typeInfo.icon,
        credentialLevel: credLevel,
        credentialName: credLevelNames[credLevel] || `Level ${credLevel}`,
        bio: profile.mentor?.bio || '',
        capacity: cap,
        activeStudents,
        availableSlots: Math.max(0, cap - activeStudents),
        active: true,
        photoURL: profile.photoURL || null,
        consultingAvailable,
        consultingTypes,
        consultingProjectCount,
        updatedAt: now,
      };

      const dirSnap = await dirRef.get();
      if (dirSnap.exists) {
        await dirRef.update({ ...dirData, createdAt: dirSnap.data().createdAt });
      } else {
        await dirRef.set({ ...dirData, createdAt: now });
      }

      await profileRef.update({ 'mentor.directoryListed': true, updatedAt: now });
      return res.status(200).json({ success: true, status: 'published' });
    }

    if (action === 'unpublish') {
      const dirRef = db.doc(`mentor-directory/${uid}`);
      const dirSnap = await dirRef.get();
      if (dirSnap.exists) {
        await dirRef.update({ active: false, updatedAt: now });
      }

      await profileRef.update({ 'mentor.directoryListed': false, updatedAt: now });
      return res.status(200).json({ success: true, status: 'unpublished' });
    }

    if (action === 'update-consulting-availability') {
      const dirRef = db.doc(`mentor-directory/${uid}`);
      const dirSnap = await dirRef.get();
      if (!dirSnap.exists) {
        return res.status(404).json({ error: 'Directory entry not found. Publish first.' });
      }
      const current = dirSnap.data().consultingAvailable || false;
      await dirRef.update({ consultingAvailable: !current, updatedAt: now });
      return res.status(200).json({ success: true, consultingAvailable: !current });
    }
  } catch (err) {
    console.error('Mentor directory error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
}

// ============================================================
// PAIRING: pairing-request, pairing-accept, pairing-decline, pairing-end
// ============================================================

async function handlePairing(req, res, uid) {
  const { action, mentorUid, pairingId, message, declineReason } = req.body || {};
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    if (action === 'pairing-request') {
      if (!mentorUid) {
        return res.status(400).json({ error: 'mentorUid is required.' });
      }
      if (mentorUid === uid) {
        return res.status(400).json({ error: 'Cannot request yourself as mentor.' });
      }

      const dirRef = db.doc(`mentor-directory/${mentorUid}`);
      const dirSnap = await dirRef.get();
      if (!dirSnap.exists || !dirSnap.data().active) {
        return res.status(404).json({ error: 'Mentor not found in directory.' });
      }
      if ((dirSnap.data().availableSlots || 0) <= 0) {
        return res.status(400).json({ error: 'Mentor has no available slots.' });
      }

      const existingSnap = await db.collection('mentor-pairings')
        .where('mentorUid', '==', mentorUid)
        .where('studentUid', '==', uid)
        .where('status', 'in', ['pending', 'accepted'])
        .get();
      if (!existingSnap.empty) {
        return res.status(409).json({ error: 'You already have a pending or active pairing with this mentor.' });
      }

      const studentProfileSnap = await db.doc(`users/${uid}/meta/profile`).get();
      const studentHandle = studentProfileSnap.exists ? studentProfileSnap.data().handle || null : null;

      const pairingData = {
        mentorUid,
        studentUid: uid,
        mentorHandle: dirSnap.data().handle || null,
        studentHandle,
        mentorType: dirSnap.data().mentorType,
        status: 'pending',
        requestedAt: now,
        respondedAt: null,
        endedAt: null,
        requestMessage: (typeof message === 'string' && message.trim()) ? message.trim().slice(0, 500) : null,
        declineReason: null,
      };

      const newRef = await db.collection('mentor-pairings').add(pairingData);
      return res.status(200).json({ success: true, pairingId: newRef.id });
    }

    if (action === 'pairing-accept') {
      if (!pairingId) {
        return res.status(400).json({ error: 'pairingId is required.' });
      }

      const result = await db.runTransaction(async (tx) => {
        const pairingRef = db.doc(`mentor-pairings/${pairingId}`);
        const pairingSnap = await tx.get(pairingRef);
        if (!pairingSnap.exists) throw new Error('PAIRING_NOT_FOUND');

        const pairing = pairingSnap.data();
        if (pairing.mentorUid !== uid) throw new Error('FORBIDDEN');
        if (pairing.status !== 'pending') throw new Error('NOT_PENDING');

        const dirRef = db.doc(`mentor-directory/${uid}`);
        const dirSnap = await tx.get(dirRef);
        if (!dirSnap.exists) throw new Error('DIRECTORY_NOT_FOUND');

        const dirData = dirSnap.data();
        const currentActive = dirData.activeStudents || 0;
        const cap = dirData.capacity || 5;
        if (currentActive >= cap) throw new Error('AT_CAPACITY');

        tx.update(pairingRef, { status: 'accepted', respondedAt: now });
        tx.update(dirRef, {
          activeStudents: currentActive + 1,
          availableSlots: Math.max(0, cap - currentActive - 1),
          updatedAt: now,
        });

        return { status: 'accepted' };
      });

      return res.status(200).json({ success: true, ...result });
    }

    if (action === 'pairing-decline') {
      if (!pairingId) {
        return res.status(400).json({ error: 'pairingId is required.' });
      }

      const pairingRef = db.doc(`mentor-pairings/${pairingId}`);
      const pairingSnap = await pairingRef.get();
      if (!pairingSnap.exists) return res.status(404).json({ error: 'Pairing not found.' });

      const pairing = pairingSnap.data();
      if (pairing.mentorUid !== uid) return res.status(403).json({ error: 'Only the mentor can decline.' });
      if (pairing.status !== 'pending') return res.status(400).json({ error: 'Pairing is not pending.' });

      await pairingRef.update({
        status: 'declined',
        respondedAt: now,
        declineReason: (typeof declineReason === 'string' && declineReason.trim()) ? declineReason.trim().slice(0, 500) : null,
      });

      return res.status(200).json({ success: true, status: 'declined' });
    }

    if (action === 'pairing-end') {
      if (!pairingId) {
        return res.status(400).json({ error: 'pairingId is required.' });
      }

      const result = await db.runTransaction(async (tx) => {
        const pairingRef = db.doc(`mentor-pairings/${pairingId}`);
        const pairingSnap = await tx.get(pairingRef);
        if (!pairingSnap.exists) throw new Error('PAIRING_NOT_FOUND');

        const pairing = pairingSnap.data();
        if (pairing.mentorUid !== uid && pairing.studentUid !== uid) throw new Error('END_FORBIDDEN');
        if (pairing.status !== 'accepted') throw new Error('NOT_ACCEPTED');

        tx.update(pairingRef, { status: 'ended', endedAt: now });

        const dirRef = db.doc(`mentor-directory/${pairing.mentorUid}`);
        const dirSnap = await tx.get(dirRef);
        if (dirSnap.exists) {
          const dirData = dirSnap.data();
          const newActive = Math.max(0, (dirData.activeStudents || 1) - 1);
          tx.update(dirRef, {
            activeStudents: newActive,
            availableSlots: Math.max(0, (dirData.capacity || 5) - newActive),
            updatedAt: now,
          });
        }

        return { status: 'ended' };
      });

      return res.status(200).json({ success: true, ...result });
    }
  } catch (err) {
    const errorMap = {
      PAIRING_NOT_FOUND: [404, 'Pairing not found.'],
      FORBIDDEN: [403, 'Only the mentor can accept.'],
      NOT_PENDING: [400, 'Pairing is not pending.'],
      DIRECTORY_NOT_FOUND: [404, 'Mentor directory entry not found.'],
      AT_CAPACITY: [400, 'Mentor is at capacity.'],
      END_FORBIDDEN: [403, 'Only the mentor or student can end this pairing.'],
      NOT_ACCEPTED: [400, 'Only accepted pairings can be ended.'],
    };

    const mapped = errorMap[err.message];
    if (mapped) return res.status(mapped[0]).json({ error: mapped[1] });

    console.error('Mentor pairing error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
}

// ============================================================
// CONSULTING: consulting-request, consulting-accept, consulting-decline
// ============================================================

async function handleConsulting(req, res, uid) {
  const { action, consultantUid, consultingType, message, requestId } = req.body || {};
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    if (action === 'consulting-request') {
      if (!consultantUid) {
        return res.status(400).json({ error: 'consultantUid is required.' });
      }
      if (consultantUid === uid) {
        return res.status(400).json({ error: 'Cannot request consulting from yourself.' });
      }

      const dirRef = db.doc(`mentor-directory/${consultantUid}`);
      const dirSnap = await dirRef.get();
      if (!dirSnap.exists || !dirSnap.data().active) {
        return res.status(404).json({ error: 'Consultant not found in directory.' });
      }
      if (!dirSnap.data().consultingAvailable) {
        return res.status(400).json({ error: 'Consultant is not currently accepting consulting requests.' });
      }

      const existingSnap = await db.collection('consulting-requests')
        .where('consultantUid', '==', consultantUid)
        .where('requesterUid', '==', uid)
        .where('status', '==', 'pending')
        .get();
      if (!existingSnap.empty) {
        return res.status(409).json({ error: 'You already have a pending consulting request with this mentor.' });
      }

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

    if (action === 'consulting-accept') {
      if (!requestId) {
        return res.status(400).json({ error: 'requestId is required.' });
      }

      const reqRef = db.doc(`consulting-requests/${requestId}`);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) return res.status(404).json({ error: 'Request not found.' });

      const reqData = reqSnap.data();
      if (reqData.consultantUid !== uid) return res.status(403).json({ error: 'Only the consultant can accept.' });
      if (reqData.status !== 'pending') return res.status(400).json({ error: 'Request is not pending.' });

      await reqRef.update({ status: 'accepted', respondedAt: now });
      return res.status(200).json({ success: true, status: 'accepted' });
    }

    if (action === 'consulting-decline') {
      if (!requestId) {
        return res.status(400).json({ error: 'requestId is required.' });
      }

      const reqRef = db.doc(`consulting-requests/${requestId}`);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) return res.status(404).json({ error: 'Request not found.' });

      const reqData = reqSnap.data();
      if (reqData.consultantUid !== uid) return res.status(403).json({ error: 'Only the consultant can decline.' });
      if (reqData.status !== 'pending') return res.status(400).json({ error: 'Request is not pending.' });

      await reqRef.update({ status: 'declined', respondedAt: now });
      return res.status(200).json({ success: true, status: 'declined' });
    }
  } catch (err) {
    console.error('Consulting request error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
}

// ============================================================
// TEACHER: get-catalog, parse-syllabus
// ============================================================

async function handleTeacher(req, res, uid) {
  const { action } = req.body || {};

  try {
    // ── get-catalog ──
    if (action === 'get-catalog') {
      const catalog = getContentCatalog();
      return res.status(200).json({ catalog });
    }

    // ── parse-syllabus ──
    if (action === 'parse-syllabus') {
      const { syllabusText } = req.body;
      if (!syllabusText || syllabusText.length < 50) {
        return res.status(400).json({ error: 'Syllabus text must be at least 50 characters.' });
      }

      // Phase A — LLM entity extraction
      const { anthropicKey } = await getUserKeys(uid);
      const client = getAnthropicClient(anthropicKey);

      const extraction = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: `You are a syllabus parser for a mythology education platform. Extract every mythological figure, deity, sacred place, book title, author, hero's journey concept, culture/civilization, astronomical term (planet, zodiac sign, constellation), ancient game, film, theorist, archetype, or related concept from the syllabus text.

Return a JSON array of objects. Each object has:
- "text": the entity as it appears in the syllabus
- "type": one of "deity", "place", "book", "author", "concept", "culture", "planet", "zodiac", "constellation", "game", "film", "theorist", "archetype", "stage", "other"
- "searchTerms": array of 1-3 search strings to find this in a content database (include the main name plus any alternate names or related terms)

Return ONLY the JSON array, no other text. If no entities found, return [].`,
        messages: [
          { role: 'user', content: syllabusText.slice(0, 12000) },
        ],
      });

      let parsedItems = [];
      try {
        const raw = (extraction.content[0]?.text || '').trim();
        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        parsedItems = JSON.parse(cleaned);
        if (!Array.isArray(parsedItems)) parsedItems = [];
      } catch {
        return res.status(200).json({
          parsedItems: [],
          matchedItems: [],
          unmatchedItems: [{ text: 'LLM response could not be parsed', reason: 'Invalid JSON from extraction' }],
        });
      }

      // Phase B — Content matching
      const matchedItems = [];
      const unmatchedItems = [];
      const seenContentIds = new Set();

      for (const entity of parsedItems) {
        const terms = entity.searchTerms || [entity.text];
        const results = searchContent(terms);

        // Take the top result if score >= 5
        const top = results.find(r => r.score >= 5 && !seenContentIds.has(r.id));

        if (top) {
          seenContentIds.add(top.id);
          matchedItems.push({
            contentId: top.id,
            category: top.category,
            name: top.name,
            route: top.route,
            score: top.score,
            matchedFrom: entity.text,
          });
        } else {
          unmatchedItems.push({
            text: entity.text,
            type: entity.type,
            reason: results.length > 0 ? 'Low confidence match' : 'No content found',
          });
        }
      }

      return res.status(200).json({ parsedItems, matchedItems, unmatchedItems });
    }

    return res.status(400).json({ error: 'Unhandled action.' });
  } catch (err) {
    console.error('Teacher API error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
}
