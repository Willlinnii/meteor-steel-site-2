// Guild pairing engine: constants and pure functions for guild member-student pairing.
// Mirrors guildEngine.js pattern — no side effects, no Firebase imports.

import { DEFAULT_GUILD_CAPACITY, MAX_GUILD_BIO_LENGTH, MAX_GUILD_CAPACITY } from './guildEngine';

// --- PAIRING STATUS ---

export const PAIRING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  ENDED: 'ended',
};

// --- CONSTANTS (re-exported from guildEngine for backwards compat) ---
export { DEFAULT_GUILD_CAPACITY, MAX_GUILD_BIO_LENGTH, MAX_GUILD_CAPACITY };

// --- FUNCTIONS ---

/**
 * Returns true if the user can request this guild member (no duplicate pending/active request).
 */
export function canRequestGuildMember(existingPairings, guildMemberUid) {
  if (!existingPairings || existingPairings.length === 0) return true;
  return !existingPairings.some(
    p => p.guildMemberUid === guildMemberUid &&
      (p.status === PAIRING_STATUS.PENDING || p.status === PAIRING_STATUS.ACCEPTED)
  );
}

/**
 * Returns remaining capacity (available slots).
 */
export function getAvailableSlots(capacity, activeCount) {
  return Math.max(0, (capacity || DEFAULT_GUILD_CAPACITY) - (activeCount || 0));
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
    otherHandle: isStudent ? pairing.guildMemberHandle : pairing.studentHandle,
    otherUid: isStudent ? pairing.guildMemberUid : pairing.studentUid,
    status: pairing.status,
    statusLabel: statusLabels[pairing.status] || pairing.status,
    guildType: pairing.guildType,
    requestMessage: pairing.requestMessage || null,
    declineReason: pairing.declineReason || null,
  };
}

/**
 * Categorizes pairings into groups based on whether the user is guild member or student side.
 * Returns { pendingRequests, activeStudents, myGuildMembers, pendingApplications }
 */
export function categorizePairings(pairings, uid) {
  const result = {
    pendingRequests: [],    // incoming pending requests where user is guild member
    activeStudents: [],     // accepted pairings where user is guild member
    myGuildMembers: [],     // accepted pairings where user is student
    pendingApplications: [], // pending requests where user is student
  };

  if (!pairings || !uid) return result;

  for (const p of pairings) {
    if ((p.guildMemberUid || p.mentorUid) === uid) {
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
        result.myGuildMembers.push(p);
      }
    }
  }

  return result;
}
