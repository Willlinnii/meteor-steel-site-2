const admin = require('firebase-admin');
const { ensureFirebaseAdmin, getUidFromRequest } = require('./_lib/auth');

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';

// Stage templates by client type
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
  artist: null, // uses storyteller
  creator: null, // uses storyteller
  seeker: [
    { id: 'ordinary-world', label: 'Ordinary World', description: 'Where you are. The known ground.' },
    { id: 'call', label: 'The Call', description: "What's pulling you. The disturbance." },
    { id: 'threshold', label: 'The Threshold', description: 'What you must leave behind to answer.' },
    { id: 'trials', label: 'The Trials', description: 'What you face. The tests that shape you.' },
    { id: 'abyss', label: 'The Abyss', description: 'The deepest point. What dies so something can live.' },
    { id: 'return', label: 'The Return', description: 'What you bring back. The boon.' },
    { id: 'integration', label: 'Integration', description: 'Making it real in daily life.' },
    { id: 'renewal', label: 'Renewal', description: 'The new ordinary world. Who you\'ve become.' },
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
  leader: null, // uses brand
};

function getStagesForClientType(clientType) {
  const key = clientType || 'seeker';
  const template = STAGE_TEMPLATES[key] || STAGE_TEMPLATES[key === 'artist' || key === 'creator' ? 'storyteller' : key === 'leader' ? 'brand' : 'seeker'];
  return (template || STAGE_TEMPLATES.seeker).map((s, i) => ({
    ...s,
    status: i === 0 ? 'active' : 'pending',
  }));
}

const CLIENT_ACTIONS = ['create-engagement', 'get-engagement', 'list-engagements'];
const MUTATION_ACTIONS = ['update-engagement-status', 'save-session', 'get-sessions'];
const PRACTITIONER_ACTIONS = ['assign-practitioner', 'list-practitioner-engagements', 'list-practitioners'];
const ALL_ACTIONS = [...CLIENT_ACTIONS, ...MUTATION_ACTIONS, ...PRACTITIONER_ACTIONS];

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

  // Auth required for all actions
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  let decoded;
  try {
    const token = authHeader.split('Bearer ')[1];
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const uid = decoded.uid;
  const isAdmin = decoded.email === ADMIN_EMAIL;
  const db = admin.firestore();

  try {
    // --- Create engagement ---
    if (action === 'create-engagement') {
      const { clientType, title, archetype, journeyStage, intakeNotes, natalData } = req.body;

      // Load client profile for display name
      let clientName = decoded.name || decoded.email || uid;
      let clientHandle = '';
      try {
        const profileSnap = await db.doc(`users/${uid}/meta/profile`).get();
        if (profileSnap.exists) {
          const p = profileSnap.data();
          clientHandle = p.handle || '';
          clientName = p.displayName || clientName;
        }
      } catch { /* use defaults */ }

      const stages = getStagesForClientType(clientType);

      const engagementData = {
        clientUid: uid,
        clientHandle,
        clientName,
        practitionerUid: null,
        title: title || 'Mythic Narrative Engagement',
        archetype: archetype || '',
        journeyStage: journeyStage || '',
        clientType: clientType || 'seeker',
        status: 'intake',
        stages,
        intakeNotes: intakeNotes || '',
        natalData: natalData || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null,
        stripePaymentIds: [],
      };

      const ref = await db.collection('consulting-engagements').add(engagementData);
      return res.status(200).json({ success: true, engagementId: ref.id, stages });
    }

    // --- Get engagement ---
    if (action === 'get-engagement') {
      const { engagementId } = req.body;
      if (!engagementId) return res.status(400).json({ error: 'engagementId is required.' });

      const snap = await db.doc(`consulting-engagements/${engagementId}`).get();
      if (!snap.exists) return res.status(404).json({ error: 'Engagement not found.' });

      const data = snap.data();
      if (data.clientUid !== uid && data.practitionerUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      return res.status(200).json({ success: true, engagement: { id: snap.id, ...data } });
    }

    // --- List engagements ---
    if (action === 'list-engagements') {
      let q;
      if (isAdmin) {
        q = db.collection('consulting-engagements').orderBy('createdAt', 'desc');
      } else {
        // Client sees their own engagements
        q = db.collection('consulting-engagements')
          .where('clientUid', '==', uid)
          .orderBy('createdAt', 'desc');
      }

      const snap = await q.get();
      const engagements = [];
      snap.forEach(doc => engagements.push({ id: doc.id, ...doc.data() }));

      // Also check practitioner engagements if not admin
      if (!isAdmin) {
        const practSnap = await db.collection('consulting-engagements')
          .where('practitionerUid', '==', uid)
          .orderBy('createdAt', 'desc')
          .get();
        const practIds = new Set(engagements.map(e => e.id));
        practSnap.forEach(doc => {
          if (!practIds.has(doc.id)) engagements.push({ id: doc.id, ...doc.data() });
        });
      }

      return res.status(200).json({ success: true, engagements });
    }

    // --- Update engagement status ---
    if (action === 'update-engagement-status') {
      const { engagementId, status, stageId, stageStatus } = req.body;
      if (!engagementId) return res.status(400).json({ error: 'engagementId is required.' });

      const ref = db.doc(`consulting-engagements/${engagementId}`);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'Engagement not found.' });

      const data = snap.data();
      if (data.clientUid !== uid && data.practitionerUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

      // Update overall status
      if (status) {
        updates.status = status;
        if (status === 'completed') {
          updates.completedAt = admin.firestore.FieldValue.serverTimestamp();
        }
      }

      // Update a specific stage status
      if (stageId && stageStatus) {
        const stages = data.stages || [];
        const updatedStages = stages.map(s => {
          if (s.id === stageId) return { ...s, status: stageStatus };
          return s;
        });

        // If completing a stage, activate the next pending stage
        if (stageStatus === 'completed') {
          const completedIdx = updatedStages.findIndex(s => s.id === stageId);
          if (completedIdx >= 0 && completedIdx < updatedStages.length - 1) {
            const next = updatedStages[completedIdx + 1];
            if (next.status === 'pending') {
              updatedStages[completedIdx + 1] = { ...next, status: 'active' };
            }
          }

          // Check if all stages completed
          const allDone = updatedStages.every(s => s.status === 'completed');
          if (allDone) {
            updates.status = 'completing';
          }
        }

        updates.stages = updatedStages;
      }

      await ref.update(updates);
      return res.status(200).json({ success: true });
    }

    // --- Save session ---
    if (action === 'save-session') {
      const { engagementId, stageId, messages, atlasTranscript, notes, artifacts, actionItems, duration } = req.body;
      if (!engagementId) return res.status(400).json({ error: 'engagementId is required.' });

      const engRef = db.doc(`consulting-engagements/${engagementId}`);
      const engSnap = await engRef.get();
      if (!engSnap.exists) return res.status(404).json({ error: 'Engagement not found.' });

      const engData = engSnap.data();
      if (engData.clientUid !== uid && engData.practitionerUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      const sessionData = {
        stageId: stageId || '',
        practitionerUid: engData.practitionerUid || null,
        clientUid: engData.clientUid,
        messages: messages || [],
        atlasTranscript: atlasTranscript || [],
        notes: notes || '',
        artifacts: artifacts || [],
        actionItems: actionItems || [],
        duration: duration || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const sessionRef = await db.collection(`consulting-engagements/${engagementId}/sessions`).add(sessionData);

      // Update engagement timestamp
      await engRef.update({ updatedAt: admin.firestore.FieldValue.serverTimestamp() });

      return res.status(200).json({ success: true, sessionId: sessionRef.id });
    }

    // --- Get sessions ---
    if (action === 'get-sessions') {
      const { engagementId } = req.body;
      if (!engagementId) return res.status(400).json({ error: 'engagementId is required.' });

      const engSnap = await db.doc(`consulting-engagements/${engagementId}`).get();
      if (!engSnap.exists) return res.status(404).json({ error: 'Engagement not found.' });

      const engData = engSnap.data();
      if (engData.clientUid !== uid && engData.practitionerUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      const sessionsSnap = await db.collection(`consulting-engagements/${engagementId}/sessions`)
        .orderBy('createdAt', 'desc')
        .get();
      const sessions = [];
      sessionsSnap.forEach(doc => sessions.push({ id: doc.id, ...doc.data() }));

      return res.status(200).json({ success: true, sessions });
    }

    // --- Assign practitioner to engagement ---
    if (action === 'assign-practitioner') {
      const { engagementId, practitionerUid } = req.body;
      if (!engagementId || !practitionerUid) {
        return res.status(400).json({ error: 'engagementId and practitionerUid are required.' });
      }

      const ref = db.doc(`consulting-engagements/${engagementId}`);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'Engagement not found.' });

      const data = snap.data();
      // Only the client or admin can assign a practitioner
      if (data.clientUid !== uid && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden.' });
      }

      // Verify practitioner exists and has consultant credential
      const practProfileSnap = await db.doc(`users/${practitionerUid}/meta/profile`).get();
      if (!practProfileSnap.exists) {
        return res.status(404).json({ error: 'Practitioner not found.' });
      }
      const practProfile = practProfileSnap.data();
      const consultantLevel = practProfile?.credentials?.consultant?.level || 0;
      if (consultantLevel < 2 && !isAdmin) {
        return res.status(400).json({ error: 'Practitioner must have Consultant level 2+ credential.' });
      }

      await ref.update({
        practitionerUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ success: true });
    }

    // --- List practitioner's engagements ---
    if (action === 'list-practitioner-engagements') {
      const q = db.collection('consulting-engagements')
        .where('practitionerUid', '==', uid)
        .orderBy('createdAt', 'desc');

      const snap = await q.get();
      const engagements = [];
      snap.forEach(doc => engagements.push({ id: doc.id, ...doc.data() }));

      return res.status(200).json({ success: true, engagements });
    }

    // --- List available practitioners ---
    if (action === 'list-practitioners') {
      // Query guild directory for consulting-available guild members
      const dirSnap = await db.collection('guild-directory')
        .where('consultingAvailable', '==', true)
        .get();

      const practitioners = [];
      for (const doc of dirSnap.docs) {
        const memberData = doc.data();
        // Verify consultant credential level
        const profileSnap = await db.doc(`users/${doc.id}/meta/profile`).get();
        const profile = profileSnap.exists ? profileSnap.data() : {};
        const consultantLevel = profile?.credentials?.consultant?.level || 0;
        if (consultantLevel >= 2) {
          practitioners.push({
            uid: doc.id,
            displayName: memberData.displayName || '',
            handle: memberData.handle || '',
            bio: memberData.bio || '',
            specialties: memberData.specialties || [],
            consultantLevel,
          });
        }
      }

      return res.status(200).json({ success: true, practitioners });
    }

    return res.status(400).json({ error: 'Unhandled action.' });
  } catch (err) {
    console.error('Consulting API error:', err?.message);
    return res.status(500).json({ error: `Something went wrong: ${err?.message || 'Unknown error'}` });
  }
};
