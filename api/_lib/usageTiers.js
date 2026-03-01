/**
 * Usage tier definitions and resolution logic.
 * Shared by api/chat.js (server-side enforcement) and
 * mirrored in ProfileContext.js (client-side display).
 */

const USAGE_TIERS = {
  free:      { label: 'Explorer',  monthlyMessages: 30,   storageMB: 50 },
  journeyer: { label: 'Journeyer', monthlyMessages: 500,  storageMB: 500 },
  keeper:    { label: 'Keeper',    monthlyMessages: 3000, storageMB: 5000 },
};

// Content subscriptions that auto-grant Journeyer messaging
const JOURNEYER_SUBS = ['ybr', 'forge', 'coursework', 'monomyth', 'teaching'];

/**
 * Determine user tier from their profile data.
 * Checks in priority order: keeper > journeyer (direct) > journeyer (via content sub) > free
 */
function getUserTier(profileData) {
  const subs = profileData?.subscriptions || {};
  if (subs['tier-keeper']) return 'keeper';
  if (subs['tier-journeyer']) return 'journeyer';
  if (JOURNEYER_SUBS.some(id => subs[id])) return 'journeyer';
  // TODO: Pre-paywall window — default everyone to Journeyer.
  // Change back to 'free' when ready to enforce paid tiers.
  return 'journeyer';
}

/**
 * Get tier config for a given tier ID.
 */
function getTierConfig(tierId) {
  return USAGE_TIERS[tierId] || USAGE_TIERS.free;
}

/**
 * Get the current month key for lazy reset (e.g. '2026-03').
 */
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = { USAGE_TIERS, JOURNEYER_SUBS, getUserTier, getTierConfig, getCurrentMonthKey };
