const admin = require('firebase-admin');
const { getMentorTypeInfo } = require('./lib/mentorTypes');

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

const DEFAULT_CAPACITY = 5;
const MAX_CAPACITY = 20;
const MAX_BIO_LENGTH = 500;

// Valid consulting types (mirrors consultingEngine.js CONSULTING_TYPES)
const VALID_CONSULTING_TYPES = new Set(['character', 'narrative', 'coaching', 'media', 'adventure']);

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

  let uid;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const { action, bio, capacity } = req.body || {};

  if (!['update-bio', 'update-capacity', 'publish', 'unpublish', 'update-consulting-availability'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action.' });
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const profileRef = db.doc(`users/${uid}/meta/profile`);

  try {
    // Verify mentor status is approved/active
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    const profile = profileSnap.data();
    const mentorStatus = profile.mentor?.status;
    if (mentorStatus !== 'approved') {
      return res.status(403).json({ error: 'Mentor status must be approved.' });
    }

    // Courses are a client-side gate to "active" status. Server trusts approved status
    // for directory operations since admin already validated the application.

    if (action === 'update-bio') {
      if (typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string.' });
      }
      if (bio.length > MAX_BIO_LENGTH) {
        return res.status(400).json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` });
      }

      const batch = db.batch();
      batch.update(profileRef, {
        'mentor.bio': bio,
        updatedAt: now,
      });

      // Update directory doc if it exists
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
      batch.update(profileRef, {
        'mentor.capacity': cap,
        updatedAt: now,
      });

      // Update directory doc if it exists — recalculate availableSlots
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

      // Get credential info
      const creds = profile.credentials || {};
      const cred = creds[mentorType] || {};
      const credLevel = cred.level || 2;

      // Credential level names (simplified — matches profileEngine)
      const credLevelNames = {
        1: 'Initiate', 2: 'Adept', 3: 'Master', 4: 'Grand Master', 5: 'Archon',
      };

      const cap = profile.mentor?.capacity || DEFAULT_CAPACITY;

      // Count current active pairings
      const pairingsSnap = await db.collection('mentor-pairings')
        .where('mentorUid', '==', uid)
        .where('status', '==', 'accepted')
        .get();
      const activeStudents = pairingsSnap.size;

      // Consulting fields from profile (validate types against known enum)
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

      // Update profile to track listing status
      await profileRef.update({
        'mentor.directoryListed': true,
        updatedAt: now,
      });

      return res.status(200).json({ success: true, status: 'published' });
    }

    if (action === 'unpublish') {
      const dirRef = db.doc(`mentor-directory/${uid}`);
      const dirSnap = await dirRef.get();
      if (dirSnap.exists) {
        await dirRef.update({ active: false, updatedAt: now });
      }

      await profileRef.update({
        'mentor.directoryListed': false,
        updatedAt: now,
      });

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
};
