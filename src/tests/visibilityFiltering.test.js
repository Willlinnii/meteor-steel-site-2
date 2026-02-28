import {
  filterFeedItems,
  filterMyVaultPosts,
  filterMyProfilePosts,
} from '../contexts/FellowshipContext';

import {
  deriveFriends,
  deriveFamilyMembers,
  deriveConnectedUids,
} from '../contexts/FriendRequestsContext';

import { hasChanged } from '../storyCards/useStoryCardSync';

// ═══════════════════════════════════════════════════════════════
// Helper factories
// ═══════════════════════════════════════════════════════════════

const ME = 'user-me';
const FRIEND_A = 'user-friend-a';
const FRIEND_B = 'user-friend-b';
const FAMILY_C = 'user-family-c';
const STRANGER = 'user-stranger';

function makePost(overrides = {}) {
  return {
    id: `post-${Math.random().toString(36).slice(2, 8)}`,
    authorUid: ME,
    visibility: 'friends',
    summary: 'Test post',
    ...overrides,
  };
}

function makeFamilyUids(...uids) {
  return new Set(uids);
}

// ═══════════════════════════════════════════════════════════════
// filterFeedItems
// ═══════════════════════════════════════════════════════════════
describe('filterFeedItems', () => {
  test('passes friends-visibility posts through', () => {
    const items = [makePost({ visibility: 'friends' })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(1);
  });

  test('passes public-visibility posts through', () => {
    const items = [makePost({ visibility: 'public', authorUid: STRANGER })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(1);
  });

  test('excludes vault posts from feed', () => {
    const items = [makePost({ visibility: 'vault' })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(0);
  });

  test('excludes vault posts even if author is current user', () => {
    const items = [makePost({ visibility: 'vault', authorUid: ME })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(0);
  });

  test('excludes profile-only posts from feed', () => {
    const items = [makePost({ visibility: 'profile', authorUid: FRIEND_A })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(0);
  });

  test('excludes own profile posts from feed', () => {
    const items = [makePost({ visibility: 'profile', authorUid: ME })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(0);
  });

  test('shows family posts from family members', () => {
    const items = [makePost({ visibility: 'family', authorUid: FAMILY_C })];
    const familyUids = makeFamilyUids(FAMILY_C);
    expect(filterFeedItems(items, ME, familyUids)).toHaveLength(1);
  });

  test('hides family posts from non-family members', () => {
    const items = [makePost({ visibility: 'family', authorUid: FRIEND_A })];
    const familyUids = makeFamilyUids(FAMILY_C);
    expect(filterFeedItems(items, ME, familyUids)).toHaveLength(0);
  });

  test('shows own family posts to self', () => {
    const items = [makePost({ visibility: 'family', authorUid: ME })];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(1);
  });

  test('treats posts without visibility field as friends (backward compat)', () => {
    const items = [{ id: 'old-post', authorUid: FRIEND_A, summary: 'legacy' }];
    expect(filterFeedItems(items, ME, new Set())).toHaveLength(1);
  });

  test('filters mixed batch correctly', () => {
    const items = [
      makePost({ id: '1', visibility: 'public', authorUid: FRIEND_A }),
      makePost({ id: '2', visibility: 'vault', authorUid: ME }),
      makePost({ id: '3', visibility: 'friends', authorUid: FRIEND_B }),
      makePost({ id: '4', visibility: 'family', authorUid: FAMILY_C }),
      makePost({ id: '5', visibility: 'family', authorUid: FRIEND_A }),
      makePost({ id: '6', visibility: 'profile', authorUid: ME }),
    ];
    const familyUids = makeFamilyUids(FAMILY_C);
    const result = filterFeedItems(items, ME, familyUids);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.id)).toEqual(['1', '3', '4']);
  });

  test('returns empty array for empty input', () => {
    expect(filterFeedItems([], ME, new Set())).toEqual([]);
  });

  test('handles null userUid gracefully for family self-check', () => {
    const items = [makePost({ visibility: 'family', authorUid: FRIEND_A })];
    // No user = no family match, should filter out
    expect(filterFeedItems(items, null, new Set())).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// filterMyVaultPosts
// ═══════════════════════════════════════════════════════════════
describe('filterMyVaultPosts', () => {
  test('returns only vault posts by the user', () => {
    const items = [
      makePost({ visibility: 'vault', authorUid: ME }),
      makePost({ visibility: 'vault', authorUid: FRIEND_A }),
      makePost({ visibility: 'friends', authorUid: ME }),
    ];
    const result = filterMyVaultPosts(items, ME);
    expect(result).toHaveLength(1);
    expect(result[0].authorUid).toBe(ME);
    expect(result[0].visibility).toBe('vault');
  });

  test('returns empty for null userUid', () => {
    const items = [makePost({ visibility: 'vault', authorUid: ME })];
    expect(filterMyVaultPosts(items, null)).toEqual([]);
  });

  test('returns empty when no vault posts exist', () => {
    const items = [
      makePost({ visibility: 'friends' }),
      makePost({ visibility: 'public' }),
    ];
    expect(filterMyVaultPosts(items, ME)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// filterMyProfilePosts
// ═══════════════════════════════════════════════════════════════
describe('filterMyProfilePosts', () => {
  test('returns only profile posts by the user', () => {
    const items = [
      makePost({ visibility: 'profile', authorUid: ME }),
      makePost({ visibility: 'profile', authorUid: FRIEND_A }),
      makePost({ visibility: 'vault', authorUid: ME }),
    ];
    const result = filterMyProfilePosts(items, ME);
    expect(result).toHaveLength(1);
    expect(result[0].authorUid).toBe(ME);
    expect(result[0].visibility).toBe('profile');
  });

  test('returns empty for null userUid', () => {
    expect(filterMyProfilePosts([makePost({ visibility: 'profile' })], null)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// deriveFriends (FriendRequestsContext)
// ═══════════════════════════════════════════════════════════════
describe('deriveFriends', () => {
  test('includes accepted sent requests as friends', () => {
    const sent = [{ id: 'r1', status: 'accepted', recipientUid: FRIEND_A, recipientHandle: 'alice', relationship: 'friend' }];
    const result = deriveFriends(sent, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ uid: FRIEND_A, handle: 'alice', requestId: 'r1', relationship: 'friend' });
  });

  test('includes accepted received requests as friends', () => {
    const received = [{ id: 'r2', status: 'accepted', senderUid: FRIEND_B, senderHandle: 'bob', relationship: 'friend' }];
    const result = deriveFriends([], received);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ uid: FRIEND_B, handle: 'bob', requestId: 'r2', relationship: 'friend' });
  });

  test('excludes pending requests', () => {
    const sent = [{ id: 'r1', status: 'pending', recipientUid: FRIEND_A, recipientHandle: 'alice' }];
    const received = [{ id: 'r2', status: 'pending', senderUid: FRIEND_B, senderHandle: 'bob' }];
    expect(deriveFriends(sent, received)).toHaveLength(0);
  });

  test('excludes declined requests', () => {
    const sent = [{ id: 'r1', status: 'declined', recipientUid: FRIEND_A, recipientHandle: 'alice' }];
    expect(deriveFriends(sent, [])).toHaveLength(0);
  });

  test('defaults relationship to friend when not set', () => {
    const sent = [{ id: 'r1', status: 'accepted', recipientUid: FRIEND_A, recipientHandle: 'alice' }];
    const result = deriveFriends(sent, []);
    expect(result[0].relationship).toBe('friend');
  });

  test('preserves family relationship', () => {
    const sent = [{ id: 'r1', status: 'accepted', recipientUid: FAMILY_C, recipientHandle: 'carl', relationship: 'family' }];
    const result = deriveFriends(sent, []);
    expect(result[0].relationship).toBe('family');
  });

  test('combines sent and received accepted requests', () => {
    const sent = [{ id: 'r1', status: 'accepted', recipientUid: FRIEND_A, recipientHandle: 'alice', relationship: 'friend' }];
    const received = [{ id: 'r2', status: 'accepted', senderUid: FAMILY_C, senderHandle: 'carl', relationship: 'family' }];
    const result = deriveFriends(sent, received);
    expect(result).toHaveLength(2);
    expect(result.map(f => f.uid)).toEqual([FRIEND_A, FAMILY_C]);
  });
});

// ═══════════════════════════════════════════════════════════════
// deriveFamilyMembers
// ═══════════════════════════════════════════════════════════════
describe('deriveFamilyMembers', () => {
  test('returns only family relationships', () => {
    const friends = [
      { uid: FRIEND_A, relationship: 'friend' },
      { uid: FAMILY_C, relationship: 'family' },
      { uid: FRIEND_B, relationship: 'friend' },
    ];
    const result = deriveFamilyMembers(friends);
    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe(FAMILY_C);
  });

  test('returns empty when no family members', () => {
    const friends = [
      { uid: FRIEND_A, relationship: 'friend' },
    ];
    expect(deriveFamilyMembers(friends)).toHaveLength(0);
  });

  test('returns empty for empty input', () => {
    expect(deriveFamilyMembers([])).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// deriveConnectedUids
// ═══════════════════════════════════════════════════════════════
describe('deriveConnectedUids', () => {
  test('includes accepted and pending UIDs', () => {
    const sent = [
      { status: 'accepted', recipientUid: FRIEND_A },
      { status: 'pending', recipientUid: FRIEND_B },
    ];
    const result = deriveConnectedUids(sent, []);
    expect(result.has(FRIEND_A)).toBe(true);
    expect(result.has(FRIEND_B)).toBe(true);
  });

  test('excludes declined UIDs', () => {
    const sent = [{ status: 'declined', recipientUid: STRANGER }];
    const result = deriveConnectedUids(sent, []);
    expect(result.has(STRANGER)).toBe(false);
  });

  test('includes both sent and received', () => {
    const sent = [{ status: 'accepted', recipientUid: FRIEND_A }];
    const received = [{ status: 'pending', senderUid: FRIEND_B }];
    const result = deriveConnectedUids(sent, received);
    expect(result.has(FRIEND_A)).toBe(true);
    expect(result.has(FRIEND_B)).toBe(true);
  });

  test('returns empty set for empty input', () => {
    const result = deriveConnectedUids([], []);
    expect(result.size).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// hasChanged (story card sync)
// ═══════════════════════════════════════════════════════════════
describe('hasChanged (story card)', () => {
  const base = {
    title: 'My Journey',
    subtitle: 'A tale',
    summary: 'Once upon a time...',
    category: 'journey',
    visibility: 'public',
  };

  test('returns false for identical cards', () => {
    expect(hasChanged(base, { ...base })).toBe(false);
  });

  test('detects title change', () => {
    expect(hasChanged(base, { ...base, title: 'New Title' })).toBe(true);
  });

  test('detects subtitle change', () => {
    expect(hasChanged(base, { ...base, subtitle: 'New subtitle' })).toBe(true);
  });

  test('detects summary change', () => {
    expect(hasChanged(base, { ...base, summary: 'Updated...' })).toBe(true);
  });

  test('detects category change', () => {
    expect(hasChanged(base, { ...base, category: 'astrology' })).toBe(true);
  });

  test('detects visibility change (public → vault)', () => {
    expect(hasChanged(base, { ...base, visibility: 'vault' })).toBe(true);
  });

  test('detects visibility change (vault → public)', () => {
    const vaultCard = { ...base, visibility: 'vault' };
    expect(hasChanged(vaultCard, { ...base, visibility: 'public' })).toBe(true);
  });

  test('ignores irrelevant field changes', () => {
    const existing = { ...base, createdAt: 'old', icon: 'X' };
    const desired = { ...base, createdAt: 'new', icon: 'Y' };
    expect(hasChanged(existing, desired)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Integration: visibility + relationship pipeline
// ═══════════════════════════════════════════════════════════════
describe('visibility + relationship integration', () => {
  test('full pipeline: derive family → filter feed → correct results', () => {
    // Step 1: Derive friends from request docs
    const sentDocs = [
      { id: 'r1', status: 'accepted', recipientUid: FRIEND_A, recipientHandle: 'alice', relationship: 'friend' },
      { id: 'r2', status: 'accepted', recipientUid: FAMILY_C, recipientHandle: 'carl', relationship: 'family' },
    ];
    const friends = deriveFriends(sentDocs, []);
    const familyMembers = deriveFamilyMembers(friends);
    const familyUids = new Set(familyMembers.map(f => f.uid));

    // Step 2: Build a realistic feed
    const rawItems = [
      makePost({ id: 'p1', visibility: 'public', authorUid: FRIEND_A }),    // alice public → show
      makePost({ id: 'p2', visibility: 'family', authorUid: FAMILY_C }),     // carl family → show (is family)
      makePost({ id: 'p3', visibility: 'family', authorUid: FRIEND_A }),     // alice family → hide (not family)
      makePost({ id: 'p4', visibility: 'vault', authorUid: ME }),            // my vault → hide from feed
      makePost({ id: 'p5', visibility: 'profile', authorUid: ME }),          // my profile → hide from feed
      makePost({ id: 'p6', visibility: 'friends', authorUid: FRIEND_A }),    // alice friends → show
      makePost({ id: 'p7', authorUid: FRIEND_B }),                           // no visibility → friends default → show
    ];

    // Step 3: Filter
    const feed = filterFeedItems(rawItems, ME, familyUids);
    const vault = filterMyVaultPosts(rawItems, ME);
    const profile = filterMyProfilePosts(rawItems, ME);

    // Feed: p1 (public), p2 (family from family member), p6 (friends), p7 (default friends)
    expect(feed.map(r => r.id)).toEqual(['p1', 'p2', 'p6', 'p7']);

    // Vault: p4 only
    expect(vault).toHaveLength(1);
    expect(vault[0].id).toBe('p4');

    // Profile: p5 only
    expect(profile).toHaveLength(1);
    expect(profile[0].id).toBe('p5');
  });

  test('vault + profile posts never appear in feed, even for own posts', () => {
    const rawItems = [
      makePost({ id: 'v1', visibility: 'vault', authorUid: ME }),
      makePost({ id: 'v2', visibility: 'vault', authorUid: ME }),
      makePost({ id: 'p1', visibility: 'profile', authorUid: ME }),
      makePost({ id: 'f1', visibility: 'friends', authorUid: ME }),
    ];

    const feed = filterFeedItems(rawItems, ME, new Set());
    expect(feed).toHaveLength(1);
    expect(feed[0].id).toBe('f1');

    const vault = filterMyVaultPosts(rawItems, ME);
    expect(vault).toHaveLength(2);

    const profile = filterMyProfilePosts(rawItems, ME);
    expect(profile).toHaveLength(1);
  });
});
