/**
 * Tier definitions for the Mythouse API.
 * Three tiers: free (site only), call (per-request API), ambient (full deep context).
 */

const TIERS = {
  free: {
    label: 'Experience',
    description: 'Site access only — no external API.',
    monthlyLimit: 0,
    ratePerMinute: 0,
    hasApiAccess: false,
    hasDeepContext: false,
    hasPersonas: false,
  },
  call: {
    label: 'Call',
    description: 'Per-request API with core prompt context.',
    monthlyLimit: 500,
    ratePerMinute: 10,
    hasApiAccess: true,
    hasDeepContext: false,
    hasPersonas: false,
  },
  ambient: {
    label: 'Ambient',
    description: 'Full deep context, all personas and areas.',
    monthlyLimit: 5000,
    ratePerMinute: 30,
    hasApiAccess: true,
    hasDeepContext: true,
    hasPersonas: true,
  },
};

/**
 * Per-endpoint tier requirements for the v1 data API.
 * Endpoints not listed here default to 'call' (any API-tier key works).
 */
const DATA_ENDPOINT_TIERS = {
  // Most endpoints require 'call' (the default)
  journey:        'ambient',
  library:        'ambient',
  constellations: 'ambient',
  wheels:         'ambient',
};

function getTierConfig(tierName) {
  return TIERS[tierName] || TIERS.free;
}

/**
 * Check if a tier has access at or above the required level.
 * Tier hierarchy: free < call < ambient
 */
function tierHasAccess(userTier, requiredTier) {
  const hierarchy = ['free', 'call', 'ambient'];
  const userLevel = hierarchy.indexOf(userTier || 'free');
  const requiredLevel = hierarchy.indexOf(requiredTier || 'free');
  return userLevel >= requiredLevel;
}

module.exports = { TIERS, DATA_ENDPOINT_TIERS, getTierConfig, tierHasAccess };
