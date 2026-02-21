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

  const { action, mentorUid, pairingId, message, declineReason } = req.body || {};

  if (!['request', 'accept', 'decline', 'end'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be request, accept, decline, or end.' });
  }

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  try {
    // --- REQUEST: student requests a mentor ---
    if (action === 'request') {
      if (!mentorUid) {
        return res.status(400).json({ error: 'mentorUid is required.' });
      }
      if (mentorUid === uid) {
        return res.status(400).json({ error: 'Cannot request yourself as mentor.' });
      }

      // Verify mentor exists in directory and has slots
      const dirRef = db.doc(`mentor-directory/${mentorUid}`);
      const dirSnap = await dirRef.get();
      if (!dirSnap.exists || !dirSnap.data().active) {
        return res.status(404).json({ error: 'Mentor not found in directory.' });
      }
      if ((dirSnap.data().availableSlots || 0) <= 0) {
        return res.status(400).json({ error: 'Mentor has no available slots.' });
      }

      // Check for duplicate pending/active pairing
      const existingSnap = await db.collection('mentor-pairings')
        .where('mentorUid', '==', mentorUid)
        .where('studentUid', '==', uid)
        .where('status', 'in', ['pending', 'accepted'])
        .get();
      if (!existingSnap.empty) {
        return res.status(409).json({ error: 'You already have a pending or active pairing with this mentor.' });
      }

      // Get student handle
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

    // --- ACCEPT: mentor accepts a pending request ---
    if (action === 'accept') {
      if (!pairingId) {
        return res.status(400).json({ error: 'pairingId is required.' });
      }

      // Use transaction for race condition safety
      const result = await db.runTransaction(async (tx) => {
        const pairingRef = db.doc(`mentor-pairings/${pairingId}`);
        const pairingSnap = await tx.get(pairingRef);
        if (!pairingSnap.exists) {
          throw new Error('PAIRING_NOT_FOUND');
        }

        const pairing = pairingSnap.data();
        if (pairing.mentorUid !== uid) {
          throw new Error('FORBIDDEN');
        }
        if (pairing.status !== 'pending') {
          throw new Error('NOT_PENDING');
        }

        // Check capacity
        const dirRef = db.doc(`mentor-directory/${uid}`);
        const dirSnap = await tx.get(dirRef);
        if (!dirSnap.exists) {
          throw new Error('DIRECTORY_NOT_FOUND');
        }

        const dirData = dirSnap.data();
        const currentActive = dirData.activeStudents || 0;
        const cap = dirData.capacity || 5;
        if (currentActive >= cap) {
          throw new Error('AT_CAPACITY');
        }

        // Accept the pairing
        tx.update(pairingRef, {
          status: 'accepted',
          respondedAt: now,
        });

        // Update directory counts
        tx.update(dirRef, {
          activeStudents: currentActive + 1,
          availableSlots: Math.max(0, cap - currentActive - 1),
          updatedAt: now,
        });

        return { status: 'accepted' };
      });

      return res.status(200).json({ success: true, ...result });
    }

    // --- DECLINE: mentor declines a pending request ---
    if (action === 'decline') {
      if (!pairingId) {
        return res.status(400).json({ error: 'pairingId is required.' });
      }

      const pairingRef = db.doc(`mentor-pairings/${pairingId}`);
      const pairingSnap = await pairingRef.get();
      if (!pairingSnap.exists) {
        return res.status(404).json({ error: 'Pairing not found.' });
      }

      const pairing = pairingSnap.data();
      if (pairing.mentorUid !== uid) {
        return res.status(403).json({ error: 'Only the mentor can decline.' });
      }
      if (pairing.status !== 'pending') {
        return res.status(400).json({ error: 'Pairing is not pending.' });
      }

      await pairingRef.update({
        status: 'declined',
        respondedAt: now,
        declineReason: (typeof declineReason === 'string' && declineReason.trim()) ? declineReason.trim().slice(0, 500) : null,
      });

      return res.status(200).json({ success: true, status: 'declined' });
    }

    // --- END: either party ends an accepted pairing ---
    if (action === 'end') {
      if (!pairingId) {
        return res.status(400).json({ error: 'pairingId is required.' });
      }

      // Use transaction for race condition safety (mirrors accept logic)
      const result = await db.runTransaction(async (tx) => {
        const pairingRef = db.doc(`mentor-pairings/${pairingId}`);
        const pairingSnap = await tx.get(pairingRef);
        if (!pairingSnap.exists) {
          throw new Error('PAIRING_NOT_FOUND');
        }

        const pairing = pairingSnap.data();
        if (pairing.mentorUid !== uid && pairing.studentUid !== uid) {
          throw new Error('END_FORBIDDEN');
        }
        if (pairing.status !== 'accepted') {
          throw new Error('NOT_ACCEPTED');
        }

        tx.update(pairingRef, {
          status: 'ended',
          endedAt: now,
        });

        // Update directory counts for the mentor
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
    if (mapped) {
      return res.status(mapped[0]).json({ error: mapped[1] });
    }

    console.error('Mentor pairing error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
