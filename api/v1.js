const { route, respond } = require('./_lib/dataApi');

module.exports = (req, res) => {
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

  // Extract path segments from URL: /api/v1/phases/forge → ['phases', 'forge']
  const url = req.url.split('?')[0];
  const prefix = '/api/v1';
  const rest = url.startsWith(prefix) ? url.slice(prefix.length) : '';
  const segments = rest.split('/').filter(Boolean);

  return route(segments, req, res);
};
