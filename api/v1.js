const { route, respond } = require('./_lib/dataApi');
const { validateApiKey } = require('./_lib/apiKeyAuth');
const { DATA_ENDPOINT_TIERS, tierHasAccess } = require('./_lib/tierConfig');

module.exports = async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return respond(res, 405, { error: 'Method not allowed' }, '/v1/');
  }

  // Validate API key
  const auth = await validateApiKey(req);
  if (!auth) {
    return respond(res, 401, {
      error: 'Valid API key required. Pass via "Authorization: Bearer myt_..." header or "?key=myt_..." query parameter.',
    }, '/v1/');
  }

  // Tier check — must be at least 'call' for any v1 endpoint
  if (!tierHasAccess(auth.tier, 'call')) {
    return respond(res, 403, {
      error: 'Your API key is on the free tier. Upgrade to Call or Ambient to access the data API.',
      tier: auth.tier,
    }, '/v1/');
  }

  // Extract path segments from URL: /api/v1/phases/forge → ['phases', 'forge']
  const url = req.url.split('?')[0];
  const prefix = '/api/v1';
  const rest = url.startsWith(prefix) ? url.slice(prefix.length) : '';
  const segments = rest.split('/').filter(Boolean);

  // Per-endpoint tier check
  const endpoint = segments[0] || '';
  const requiredTier = DATA_ENDPOINT_TIERS[endpoint] || 'call';
  if (!tierHasAccess(auth.tier, requiredTier)) {
    return respond(res, 403, {
      error: `The "${endpoint}" endpoint requires the ${requiredTier} tier. Your key is on the ${auth.tier} tier.`,
      requiredTier,
      currentTier: auth.tier,
    }, '/v1/');
  }

  return route(segments, req, res);
};
