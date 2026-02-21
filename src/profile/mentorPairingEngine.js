// Mentor pairing engine: constants and pure functions for mentor-student pairing.
// Mirrors mentorEngine.js pattern — no side effects, no Firebase imports.

// --- PAIRING STATUS ---

export const PAIRING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  ENDED: 'ended',
};

// --- CONSTANTS ---

export const DEFAULT_MENTOR_CAPACITY = 5;
export const MAX_MENTOR_BIO_LENGTH = 500;
export const MAX_MENTOR_CAPACITY = 20;

// --- FUNCTIONS ---

/**
 * Returns true if the user can request this mentor (no duplicate pending/active request).
 */
export function canRequestMentor(existingPairings, mentorUid) {
  if (!existingPairings || existingPairings.length === 0) return true;
  return !existingPairings.some(
    p => p.mentorUid === mentorUid &&
      (p.status === PAIRING_STATUS.PENDING || p.status === PAIRING_STATUS.ACCEPTED)
  );
}

/**
 * Returns remaining capacity (available slots).
 */
export function getAvailableSlots(capacity, activeCount) {
  return Math.max(0, (capacity || DEFAULT_MENTOR_CAPACITY) - (activeCount || 0));
}

/**
 * Returns formatted display info for a pairing.
 */
export function getPairingDisplay(pairing, isStudent) {
  const statusLabels = {
    [PAIRING_STATUS.PENDING]: 'Pending',
    [PAIRING_STATUS.ACCEPTED]: 'Active',
    [PAIRING_STATUS.DECLINED]: 'Declined',
    [PAIRING_STATUS.ENDED]: 'Ended',
  };

  return {
    otherHandle: isStudent ? pairing.mentorHandle : pairing.studentHandle,
    otherUid: isStudent ? pairing.mentorUid : pairing.studentUid,
    status: pairing.status,
    statusLabel: statusLabels[pairing.status] || pairing.status,
    mentorType: pairing.mentorType,
    requestMessage: pairing.requestMessage || null,
    declineReason: pairing.declineReason || null,
  };
}

/**
 * Categorizes pairings into groups based on whether the user is mentor or student side.
 * Returns { pendingRequests, activeStudents, myMentors, pendingApplications }
 */
export function categorizePairings(pairings, uid) {
  const result = {
    pendingRequests: [],    // incoming pending requests where user is mentor
    activeStudents: [],     // accepted pairings where user is mentor
    myMentors: [],          // accepted pairings where user is student
    pendingApplications: [], // pending requests where user is student
  };

  if (!pairings || !uid) return result;

  for (const p of pairings) {
    if (p.mentorUid === uid) {
      if (p.status === PAIRING_STATUS.PENDING) {
        result.pendingRequests.push(p);
      } else if (p.status === PAIRING_STATUS.ACCEPTED) {
        result.activeStudents.push(p);
      }
    }
    if (p.studentUid === uid) {
      if (p.status === PAIRING_STATUS.PENDING) {
        result.pendingApplications.push(p);
      } else if (p.status === PAIRING_STATUS.ACCEPTED) {
        result.myMentors.push(p);
      }
    }
  }

  return result;
}
