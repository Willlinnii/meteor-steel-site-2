/**
 * GET /api/admin
 * Admin-only endpoint — supports multiple modes:
 *   ?mode=usage   (default) — billing & usage data from paid services
 *   ?mode=health  — health checks for all external services
 *   ?mode=users   — list all Firebase Auth users
 */
const admin = require('firebase-admin');
const { ensureFirebaseAdmin } = require('./_lib/auth');

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'willlinnii@gmail.com';
const TIMEOUT_MS = 10000;

/** Fetch with a per-request timeout */
function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** ISO date string for N days ago */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Unix timestamp (seconds) for N days ago */
function daysAgoUnix(n) {
  return Math.floor((Date.now() - n * 86400000) / 1000);
}

// --- Individual billing fetchers ---

async function fetchAnthropic() {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) return { available: false, reason: 'ANTHROPIC_ADMIN_KEY not set' };

  const headers = {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  };
  const startDate = daysAgo(30);
  const endDate = daysAgo(0);

  const [costRes, usageRes] = await Promise.all([
    fetchWithTimeout(
      `https://api.anthropic.com/v1/organizations/cost_report?start_date=${startDate}&end_date=${endDate}&bucket_size=1d`,
      { headers }
    ),
    fetchWithTimeout(
      `https://api.anthropic.com/v1/organizations/usage_report/messages?start_date=${startDate}&end_date=${endDate}&group_by=model`,
      { headers }
    ),
  ]);

  if (!costRes.ok) {
    const body = await costRes.text().catch(() => '');
    throw new Error(`Cost report HTTP ${costRes.status}: ${body.slice(0, 200)}`);
  }

  const costData = await costRes.json();

  let cost30d = 0;
  let todayCost = 0;
  const todayStr = endDate;
  const buckets = costData.data || costData.buckets || [];
  for (const bucket of buckets) {
    const amount = bucket.cost_usd || bucket.cost || 0;
    cost30d += amount;
    if (bucket.date === todayStr || bucket.bucket_start_date === todayStr) {
      todayCost += amount;
    }
  }

  let topModels = [];
  if (usageRes.ok) {
    const usageData = await usageRes.json();
    const groups = usageData.data || usageData.groups || [];
    const modelMap = {};
    for (const g of groups) {
      const model = g.model || g.group || 'unknown';
      if (!modelMap[model]) modelMap[model] = { model, tokens: 0, cost: 0 };
      modelMap[model].tokens += (g.input_tokens || 0) + (g.output_tokens || 0);
      modelMap[model].cost += g.cost_usd || g.cost || 0;
    }
    topModels = Object.values(modelMap)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  }

  return {
    available: true,
    cost30d: Math.round(cost30d * 100) / 100,
    todayCost: Math.round(todayCost * 100) / 100,
    topModels,
    error: null,
  };
}

async function fetchOpenAI() {
  const key = process.env.OPENAI_ADMIN_KEY;
  if (!key) return { available: false, reason: 'OPENAI_ADMIN_KEY not set' };

  const headers = { Authorization: `Bearer ${key}` };
  const startTime = daysAgoUnix(30);

  const [costRes, usageRes] = await Promise.all([
    fetchWithTimeout(
      `https://api.openai.com/v1/organization/costs?start_time=${startTime}&bucket_width=1d`,
      { headers }
    ),
    fetchWithTimeout(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&group_by=model`,
      { headers }
    ),
  ]);

  if (!costRes.ok) {
    const body = await costRes.text().catch(() => '');
    throw new Error(`Costs HTTP ${costRes.status}: ${body.slice(0, 200)}`);
  }

  const costData = await costRes.json();

  let cost30d = 0;
  let todayCost = 0;
  const todayStart = daysAgoUnix(0);
  const buckets = costData.data || costData.buckets || [];
  for (const bucket of buckets) {
    const amount = (bucket.results || []).reduce((sum, r) => sum + (r.amount?.value || 0), 0) / 100;
    cost30d += amount;
    if (bucket.start_time >= todayStart) {
      todayCost += amount;
    }
  }

  let topModels = [];
  if (usageRes.ok) {
    const usageData = await usageRes.json();
    const modelMap = {};
    for (const bucket of (usageData.data || [])) {
      for (const r of (bucket.results || [])) {
        const model = r.model || r.group || 'unknown';
        if (!modelMap[model]) modelMap[model] = { model, tokens: 0, cost: 0 };
        modelMap[model].tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
      }
    }
    topModels = Object.values(modelMap)
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5);
  }

  return {
    available: true,
    cost30d: Math.round(cost30d * 100) / 100,
    todayCost: Math.round(todayCost * 100) / 100,
    topModels,
    error: null,
  };
}

async function fetchElevenLabs() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { available: false, reason: 'ELEVENLABS_API_KEY not set' };

  const res = await fetchWithTimeout('https://api.elevenlabs.io/v1/user/subscription', {
    headers: { 'xi-api-key': key },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    available: true,
    charactersUsed: data.character_count || 0,
    characterLimit: data.character_limit || 0,
    voiceSlotsUsed: data.voice_count || 0,
    voiceLimit: data.voice_limit || 0,
    tier: data.tier || 'unknown',
    resetsAt: data.next_character_count_reset_unix
      ? new Date(data.next_character_count_reset_unix * 1000).toISOString()
      : null,
    error: null,
  };
}

async function fetchVercel() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { available: false, reason: 'VERCEL_TOKEN not set' };

  const from = new Date(Date.now() - 30 * 86400000).toISOString();
  const to = new Date().toISOString();

  const res = await fetchWithTimeout(
    `https://api.vercel.com/v1/billing/charges?from=${from}&to=${to}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    available: true,
    charges: data.charges || data.data || data || [],
    error: null,
  };
}

// ==========================================================
// Main handler
// ==========================================================

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Admin auth
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  const mode = req.query.mode || 'usage';

  // --- Users mode (merged from list-users.js) ---
  if (mode === 'users') {
    return handleListUsers(req, res);
  }

  // --- Health check mode (merged from health-check.js) ---
  if (mode === 'health') {
    return handleHealthCheck(req, res);
  }

  // --- Billing / usage mode (default) ---
  const fetchers = {
    anthropic: fetchAnthropic,
    openai: fetchOpenAI,
    elevenlabs: fetchElevenLabs,
    vercel: fetchVercel,
  };

  const entries = Object.entries(fetchers);
  const settled = await Promise.allSettled(entries.map(([, fn]) => fn()));

  const results = {};
  entries.forEach(([id], i) => {
    if (settled[i].status === 'fulfilled') {
      results[id] = settled[i].value;
    } else {
      results[id] = {
        available: false,
        error: settled[i].reason?.message || 'Unknown error',
      };
    }
  });

  // Static entries for services without billing APIs
  results.replicate = { available: false, reason: 'No billing API' };
  results.firebase = { available: false, reason: 'Requires GCP Console' };
  results.google_maps = { available: false, reason: 'Requires GCP Console' };

  return res.status(200).json({ timestamp: Date.now(), results });
};

// ==========================================================
// List users (originally api/list-users.js)
// ==========================================================

async function handleListUsers(req, res) {
  try {
    const users = [];
    let nextPageToken;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach(u => {
        users.push({
          uid: u.uid,
          email: u.email || null,
          displayName: u.displayName || null,
          createdAt: u.metadata.creationTime || null,
          lastSignIn: u.metadata.lastSignInTime || null,
        });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    return res.status(200).json({ users });
  } catch (err) {
    console.error('list-users error:', err);
    return res.status(500).json({ error: 'Failed to list users' });
  }
}

// ==========================================================
// Health check logic (originally api/health-check.js)
// ==========================================================

const HEALTH_TIMEOUT_MS = 5000;

function healthFetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function timed(fn) {
  const start = Date.now();
  try {
    await fn();
    return { live: true, latencyMs: Date.now() - start, error: null };
  } catch (err) {
    return { live: false, latencyMs: Date.now() - start, error: err.message || String(err) };
  }
}

const healthChecks = {
  anthropic: () => timed(async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY not set');
    const res = await healthFetchWithTimeout('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  openai: () => timed(async () => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY not set');
    const res = await healthFetchWithTimeout('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  replicate: () => timed(async () => {
    const key = process.env.REPLICATE_API_TOKEN;
    if (!key) throw new Error('REPLICATE_API_TOKEN not set');
    const res = await healthFetchWithTimeout('https://api.replicate.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  elevenlabs: () => timed(async () => {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error('ELEVENLABS_API_KEY not set');
    const res = await healthFetchWithTimeout('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': key },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  firebase: () => timed(async () => {
    if (!ensureFirebaseAdmin()) throw new Error('Service account key missing or invalid');
  }),
  vercel: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://vercel.com/api/www/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  arcgis: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://server.arcgisonline.com/arcgis/rest/info?f=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  wikisource: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://en.wikisource.org/w/api.php?action=query&meta=siteinfo&format=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  youtube: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  soundcloud: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://soundcloud.com/oembed?url=https://soundcloud.com/forss/flickermood&format=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  openlibrary: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://openlibrary.org/api/books?bibkeys=ISBN:0451526538&format=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  worldtimeapi: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://worldtimeapi.org/api/ip');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
  ipwho: () => timed(async () => {
    const res = await healthFetchWithTimeout('https://ipwho.is/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }),
};

const HEALTH_CHECK_TYPES = {
  anthropic: 'api_ping', openai: 'api_ping', replicate: 'api_ping', elevenlabs: 'api_ping',
  firebase: 'admin_init', vercel: 'reachability', arcgis: 'reachability', wikisource: 'reachability',
  youtube: 'reachability', soundcloud: 'reachability', openlibrary: 'reachability',
  worldtimeapi: 'reachability', ipwho: 'reachability',
};

const HEALTH_STATIC_RESULTS = {
  google_maps: { checkType: 'client_env', configured: null, live: null, latencyMs: null, error: null },
  cesium: { checkType: 'client_env', configured: null, live: null, latencyMs: null, error: null },
  google_oauth: { checkType: 'client_env', configured: null, live: null, latencyMs: null, error: null },
  threejs: { checkType: 'static', configured: true, live: true, latencyMs: 0, error: null },
  astronomy_engine: { checkType: 'static', configured: true, live: true, latencyMs: 0, error: null },
  hostinger: { checkType: 'no_api', configured: null, live: null, latencyMs: null, error: null },
};

async function handleHealthCheck(req, res) {
  const entries = Object.entries(healthChecks);
  const settled = await Promise.allSettled(entries.map(([, fn]) => fn()));

  const results = entries.map(([id], i) => {
    const outcome = settled[i].status === 'fulfilled'
      ? settled[i].value
      : { live: false, latencyMs: null, error: settled[i].reason?.message || 'Unknown error' };
    return {
      id,
      checkType: HEALTH_CHECK_TYPES[id],
      configured: !outcome.error?.includes('not set'),
      live: outcome.live,
      latencyMs: outcome.latencyMs,
      error: outcome.error,
    };
  });

  for (const [id, data] of Object.entries(HEALTH_STATIC_RESULTS)) {
    results.push({ id, ...data });
  }

  return res.status(200).json({ timestamp: Date.now(), results });
}
