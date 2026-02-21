// Consulting engine: constants and pure functions for consulting system.
// Mirrors mentorPairingEngine.js pattern — no side effects, no Firebase imports.

// --- CONSULTING TYPES ---

export const CONSULTING_TYPES = {
  character: 'Character Consulting',
  narrative: 'Narrative Consulting',
  coaching: 'Mythic Coaching',
  media: 'Media Consulting',
  adventure: 'Adventure Consulting',
};

// --- CONSULTING STATUS ---

export const CONSULTING_STATUS = {
  NOT_QUALIFIED: 'not-qualified',
  ELIGIBLE: 'eligible',
  SETUP_STARTED: 'setup-started',
  ACTIVE: 'active',
};

// --- FUNCTIONS ---

/**
 * Returns true if the mentor is eligible for consulting.
 * Accepts effectiveMentorStatus (computed from mentorData + course completion).
 */
export function isConsultingEligible(effectiveMentorStatus) {
  return effectiveMentorStatus === 'active';
}

/**
 * Returns formatted consulting display info.
 */
export function getConsultingDisplay(consultingData) {
  if (!consultingData) return null;

  const types = (consultingData.consultingTypes || [])
    .map(t => CONSULTING_TYPES[t] || t)
    .filter(Boolean);

  return {
    types,
    projectCount: (consultingData.projects || []).length,
    specialties: consultingData.specialties || [],
    projects: consultingData.projects || [],
  };
}

/**
 * Prevents duplicate pending requests to the same consultant.
 */
export function canRequestConsulting(existingRequests, consultantUid) {
  if (!existingRequests || existingRequests.length === 0) return true;
  return !existingRequests.some(
    r => r.consultantUid === consultantUid && r.status === 'pending'
  );
}

/**
 * Categorizes consulting requests into role-based groups.
 * Returns { incomingPending, outgoingPending, accepted }
 */
export function categorizeConsultingRequests(requests, uid) {
  const result = {
    incomingPending: [],
    outgoingPending: [],
    accepted: [],
  };

  if (!requests || !uid) return result;

  for (const r of requests) {
    if (r.consultantUid === uid && r.status === 'pending') {
      result.incomingPending.push(r);
    } else if (r.requesterUid === uid && r.status === 'pending') {
      result.outgoingPending.push(r);
    } else if (r.status === 'accepted') {
      result.accepted.push(r);
    }
  }

  return result;
}
