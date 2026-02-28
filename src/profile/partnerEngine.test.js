import {
  PARTNER_STATUS,
  MEMBERSHIP_STATUS,
  MAX_ENTITY_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_MYTHIC_RELATION_LENGTH,
  getPartnerStatus,
  getPartnerDisplay,
  categorizePartnerMemberships,
} from './partnerEngine';

// --- PARTNER_STATUS ---
describe('PARTNER_STATUS', () => {
  it('has all expected values', () => {
    expect(PARTNER_STATUS.NONE).toBe('none');
    expect(PARTNER_STATUS.APPLIED).toBe('applied');
    expect(PARTNER_STATUS.PENDING_ADMIN).toBe('pending-admin');
    expect(PARTNER_STATUS.APPROVED).toBe('approved');
    expect(PARTNER_STATUS.REJECTED).toBe('rejected');
  });
});

// --- MEMBERSHIP_STATUS ---
describe('MEMBERSHIP_STATUS', () => {
  it('has all expected values', () => {
    expect(MEMBERSHIP_STATUS.PENDING).toBe('pending');
    expect(MEMBERSHIP_STATUS.ACCEPTED).toBe('accepted');
    expect(MEMBERSHIP_STATUS.DECLINED).toBe('declined');
    expect(MEMBERSHIP_STATUS.ENDED).toBe('ended');
  });
});

// --- CONSTANTS ---
describe('Constants', () => {
  it('MAX_ENTITY_NAME_LENGTH is 200', () => {
    expect(MAX_ENTITY_NAME_LENGTH).toBe(200);
  });
  it('MAX_DESCRIPTION_LENGTH is 2000', () => {
    expect(MAX_DESCRIPTION_LENGTH).toBe(2000);
  });
  it('MAX_MYTHIC_RELATION_LENGTH is 1000', () => {
    expect(MAX_MYTHIC_RELATION_LENGTH).toBe(1000);
  });
});

// --- getPartnerStatus ---
describe('getPartnerStatus', () => {
  it('returns NONE for null/undefined', () => {
    expect(getPartnerStatus(null)).toBe('none');
    expect(getPartnerStatus(undefined)).toBe('none');
  });

  it('returns NONE for empty object', () => {
    expect(getPartnerStatus({})).toBe('none');
  });

  it('returns the stored status', () => {
    expect(getPartnerStatus({ status: 'approved' })).toBe('approved');
    expect(getPartnerStatus({ status: 'pending-admin' })).toBe('pending-admin');
    expect(getPartnerStatus({ status: 'rejected' })).toBe('rejected');
  });
});

// --- getPartnerDisplay ---
describe('getPartnerDisplay', () => {
  it('returns null for null/undefined', () => {
    expect(getPartnerDisplay(null)).toBeNull();
    expect(getPartnerDisplay(undefined)).toBeNull();
  });

  it('returns display info for approved partner', () => {
    const result = getPartnerDisplay({
      entityName: 'Acme Corp',
      status: 'approved',
      description: 'A mythic company',
      websiteUrl: 'https://acme.com',
    });
    expect(result).toEqual({
      entityName: 'Acme Corp',
      status: 'approved',
      statusLabel: 'Approved Partner',
      description: 'A mythic company',
      websiteUrl: 'https://acme.com',
    });
  });

  it('returns display info for pending-admin', () => {
    const result = getPartnerDisplay({ status: 'pending-admin', entityName: 'Test' });
    expect(result.statusLabel).toBe('Awaiting Review');
  });

  it('returns display info for rejected', () => {
    const result = getPartnerDisplay({ status: 'rejected' });
    expect(result.statusLabel).toBe('Application Not Approved');
  });

  it('handles missing fields gracefully', () => {
    const result = getPartnerDisplay({ status: 'approved' });
    expect(result.entityName).toBe('');
    expect(result.description).toBe('');
    expect(result.websiteUrl).toBe('');
  });
});

// --- categorizePartnerMemberships ---
describe('categorizePartnerMemberships', () => {
  const uid = 'user1';

  it('returns empty arrays for null/undefined', () => {
    const result = categorizePartnerMemberships(null, uid);
    expect(result.pendingInvites).toEqual([]);
    expect(result.pendingRequests).toEqual([]);
    expect(result.activeReps).toEqual([]);
    expect(result.myPartnerships).toEqual([]);
    expect(result.pendingMyInvites).toEqual([]);
    expect(result.pendingMyRequests).toEqual([]);
  });

  it('returns empty arrays for empty memberships', () => {
    const result = categorizePartnerMemberships([], uid);
    expect(result.activeReps).toEqual([]);
  });

  it('returns empty arrays when uid is null', () => {
    const result = categorizePartnerMemberships([{ partnerUid: uid }], null);
    expect(result.activeReps).toEqual([]);
  });

  it('categorizes pending invite sent by partner owner', () => {
    const m = { partnerUid: uid, representativeUid: 'rep1', status: 'pending', direction: 'invited' };
    const result = categorizePartnerMemberships([m], uid);
    expect(result.pendingInvites).toEqual([m]);
    expect(result.pendingMyInvites).toEqual([]);
  });

  it('categorizes pending request received by partner owner', () => {
    const m = { partnerUid: uid, representativeUid: 'rep1', status: 'pending', direction: 'requested' };
    const result = categorizePartnerMemberships([m], uid);
    expect(result.pendingRequests).toEqual([m]);
  });

  it('categorizes pending invite received by representative', () => {
    const m = { partnerUid: 'owner1', representativeUid: uid, status: 'pending', direction: 'invited' };
    const result = categorizePartnerMemberships([m], uid);
    expect(result.pendingMyInvites).toEqual([m]);
    expect(result.pendingInvites).toEqual([]);
  });

  it('categorizes pending request sent by representative', () => {
    const m = { partnerUid: 'owner1', representativeUid: uid, status: 'pending', direction: 'requested' };
    const result = categorizePartnerMemberships([m], uid);
    expect(result.pendingMyRequests).toEqual([m]);
  });

  it('categorizes accepted membership for partner owner', () => {
    const m = { partnerUid: uid, representativeUid: 'rep1', status: 'accepted', direction: 'invited' };
    const result = categorizePartnerMemberships([m], uid);
    expect(result.activeReps).toEqual([m]);
    expect(result.myPartnerships).toEqual([]);
  });

  it('categorizes accepted membership for representative', () => {
    const m = { partnerUid: 'owner1', representativeUid: uid, status: 'accepted', direction: 'requested' };
    const result = categorizePartnerMemberships([m], uid);
    expect(result.myPartnerships).toEqual([m]);
    expect(result.activeReps).toEqual([]);
  });

  it('ignores declined and ended memberships', () => {
    const memberships = [
      { partnerUid: uid, representativeUid: 'rep1', status: 'declined', direction: 'invited' },
      { partnerUid: uid, representativeUid: 'rep2', status: 'ended', direction: 'invited' },
    ];
    const result = categorizePartnerMemberships(memberships, uid);
    expect(result.pendingInvites).toEqual([]);
    expect(result.activeReps).toEqual([]);
  });

  it('handles mixed memberships correctly', () => {
    const memberships = [
      { id: '1', partnerUid: uid, representativeUid: 'rep1', status: 'pending', direction: 'invited' },
      { id: '2', partnerUid: uid, representativeUid: 'rep2', status: 'accepted', direction: 'requested' },
      { id: '3', partnerUid: 'other', representativeUid: uid, status: 'pending', direction: 'invited' },
      { id: '4', partnerUid: 'other2', representativeUid: uid, status: 'accepted', direction: 'requested' },
    ];
    const result = categorizePartnerMemberships(memberships, uid);
    expect(result.pendingInvites).toHaveLength(1);
    expect(result.activeReps).toHaveLength(1);
    expect(result.pendingMyInvites).toHaveLength(1);
    expect(result.myPartnerships).toHaveLength(1);
  });
});
