/**
 * GET /api/service-usage
 * Admin-only endpoint — fetches billing & usage data from paid services.
 * Requires Authorization: Bearer <Firebase ID token> from the admin user.
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

  // Fetch cost report and usage report in parallel
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

  // Sum costs
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

  // Model breakdown from usage report
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

  // Fetch costs and usage in parallel
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

  // Sum costs
  let cost30d = 0;
  let todayCost = 0;
  const todayStart = daysAgoUnix(0);
  const buckets = costData.data || costData.buckets || [];
  for (const bucket of buckets) {
    // OpenAI costs are in cents — convert to dollars
    const amount = (bucket.results || []).reduce((sum, r) => sum + (r.amount?.value || 0), 0) / 100;
    cost30d += amount;
    if (bucket.start_time >= todayStart) {
      todayCost += amount;
    }
  }

  // Model breakdown
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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Admin auth (same pattern as health-check.js) ---
  if (!ensureFirebaseAdmin()) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

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

  // --- Fetch all billing data in parallel ---
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
