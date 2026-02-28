// Partner engine: statuses, constants, and pure computation functions.
// Mirrors mentorEngine.js pattern — no Firebase imports.

// --- PARTNER STATUS ---
export const PARTNER_STATUS = {
  NONE: 'none',
  APPLIED: 'applied',
  PENDING_ADMIN: 'pending-admin',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// --- MEMBERSHIP STATUS ---
export const MEMBERSHIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  ENDED: 'ended',
};

// --- CONSTANTS ---
export const MAX_ENTITY_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_MYTHIC_RELATION_LENGTH = 1000;

// --- FUNCTIONS ---

/**
 * Returns the partner status string from profile partner data.
 */
export function getPartnerStatus(partnerData) {
  if (!partnerData || !partnerData.status) return PARTNER_STATUS.NONE;
  return partnerData.status;
}

/**
 * Returns display info for a partner (entityName, status, statusLabel, description, websiteUrl).
 */
export function getPartnerDisplay(partnerData) {
  if (!partnerData) return null;

  const statusLabels = {
    [PARTNER_STATUS.APPLIED]: 'Application Submitted',
    [PARTNER_STATUS.PENDING_ADMIN]: 'Awaiting Review',
    [PARTNER_STATUS.APPROVED]: 'Approved Partner',
    [PARTNER_STATUS.REJECTED]: 'Application Not Approved',
  };

  return {
    entityName: partnerData.entityName || '',
    status: partnerData.status || PARTNER_STATUS.NONE,
    statusLabel: statusLabels[partnerData.status] || partnerData.status || 'None',
    description: partnerData.description || '',
    websiteUrl: partnerData.websiteUrl || '',
  };
}

/**
 * Categorizes partner memberships into role-based groups.
 * Returns { pendingInvites, pendingRequests, activeReps, myPartnerships, pendingMyInvites, pendingMyRequests }
 *
 * - pendingInvites: invites the partner owner sent that haven't been answered
 * - pendingRequests: join requests others sent to the partner owner
 * - activeReps: accepted memberships where user is the partner owner
 * - myPartnerships: accepted memberships where user is a representative
 * - pendingMyInvites: invites sent TO this user (as representative) awaiting response
 * - pendingMyRequests: join requests this user sent (as representative) awaiting response
 */
export function categorizePartnerMemberships(memberships, uid) {
  const result = {
    pendingInvites: [],
    pendingRequests: [],
    activeReps: [],
    myPartnerships: [],
    pendingMyInvites: [],
    pendingMyRequests: [],
  };

  if (!memberships || !uid) return result;

  for (const m of memberships) {
    const isOwner = m.partnerUid === uid;
    const isRep = m.representativeUid === uid;

    if (m.status === MEMBERSHIP_STATUS.PENDING) {
      if (isOwner && m.direction === 'invited') {
        // Owner invited someone, waiting for them to respond
        result.pendingInvites.push(m);
      } else if (isOwner && m.direction === 'requested') {
        // Someone asked to join, owner needs to respond
        result.pendingRequests.push(m);
      } else if (isRep && m.direction === 'invited') {
        // User was invited, needs to respond
        result.pendingMyInvites.push(m);
      } else if (isRep && m.direction === 'requested') {
        // User requested to join, waiting for partner to respond
        result.pendingMyRequests.push(m);
      }
    } else if (m.status === MEMBERSHIP_STATUS.ACCEPTED) {
      if (isOwner) {
        result.activeReps.push(m);
      }
      if (isRep) {
        result.myPartnerships.push(m);
      }
    }
  }

  return result;
}
