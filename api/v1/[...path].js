const { route, respond } = require('../_lib/dataApi');

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

  const segments = req.query.path || [];
  return route(segments, req, res);
};
