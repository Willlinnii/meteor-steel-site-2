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

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureInit()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Auth check: Bearer token → verify admin email
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

  const { applicationId, action, rejectionReason } = req.body || {};

  if (!applicationId || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'applicationId and action (approve/reject) are required.' });
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

      const mentorTypeMap = {
        scholar: { title: 'Mentor Mythologist', icon: '\uD83C\uDF93' },
        storyteller: { title: 'Mentor Storyteller', icon: '\uD83D\uDCDD' },
        healer: { title: 'Mentor Healer', icon: '\uD83E\uDE7A' },
        mediaVoice: { title: 'Mentor Media Voice', icon: '\uD83C\uDF99' },
        adventurer: { title: 'Mentor Adventurer', icon: '\uD83C\uDF0D' },
      };
      const typeInfo = mentorTypeMap[mentorType] || { title: 'Mentor', icon: '\uD83C\uDF93' };

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
