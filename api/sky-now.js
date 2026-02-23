/**
 * /api/sky-now  —  Live celestial data hub
 *
 * Routes by ?type= query parameter:
 *   (default)       — current sky: planet positions + aspects
 *   ?type=solar-field — real-time solar wind IMF from NOAA SWPC
 */

const { computeNatalChart } = require('./_lib/natalChart');

// ─── Solar field constants ───

const NOAA_MAG_URL =
  'https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json';

// Polar field state — changes on ~11-year timescale.
// Solar Cycle 25: reversal began ~2023, ongoing through 2024-2026.
// Update manually every ~6 months based on WSO Stanford data.
// Last updated: 2026-02-23
const POLAR_FIELD = {
  cycle: 25,
  phase: 'maximum',
  northPole: 'reversing',
  southPole: 'reversing',
  status: 'Polar reversal in progress — the Sun\'s magnetic poles are actively flipping during Solar Cycle 25 maximum.',
  earthComparison: 'Earth\'s magnetic field has been stable for ~780,000 years (since the Brunhes–Matuyama reversal). The Sun flips every ~11 years.',
  lastUpdated: '2026-02-23',
};

function parseSector(bx) {
  if (bx < -1) return 'away';
  if (bx > 1) return 'toward';
  return 'neutral';
}

function parseAlignment(bzAvg) {
  if (bzAvg > 1) return 'aligned';
  if (bzAvg < -1) return 'opposing';
  return 'neutral';
}

// ─── Handlers ───

async function handleSkyNow(req, res) {
  try {
    const now = new Date();
    const chart = computeNatalChart({
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      latitude: 0,
      longitude: 0,
      utcOffset: 0,
    });

    return res.status(200).json({
      planets: chart.planets.map(p => ({
        name: p.name,
        sign: p.sign,
        degree: p.degree,
        longitude: p.longitude,
      })),
      aspects: chart.aspects,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('Sky-now computation error:', err?.message);
    return res.status(500).json({ error: 'Failed to compute current sky.' });
  }
}

async function handleSolarField(req, res) {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=3600'
  );

  try {
    const response = await fetch(NOAA_MAG_URL);
    if (!response.ok) {
      throw new Error(`NOAA returned ${response.status}`);
    }
    const raw = await response.json();

    if (!Array.isArray(raw) || raw.length < 2) {
      throw new Error('Unexpected NOAA data format');
    }

    const headers = raw[0];
    const bxIdx = headers.indexOf('bx_gsm');
    const byIdx = headers.indexOf('by_gsm');
    const bzIdx = headers.indexOf('bz_gsm');
    const btIdx = headers.indexOf('bt');
    const timeIdx = headers.indexOf('time_tag');

    const rows = raw.slice(1);
    let latest = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const bz = parseFloat(rows[i][bzIdx]);
      const bt = parseFloat(rows[i][btIdx]);
      if (!isNaN(bz) && !isNaN(bt)) {
        latest = {
          time: rows[i][timeIdx],
          bx: parseFloat(rows[i][bxIdx]),
          by: parseFloat(rows[i][byIdx]),
          bz,
          bt,
        };
        break;
      }
    }

    if (!latest) {
      throw new Error('No valid readings found in NOAA data');
    }

    // 1-hour average (~60 most recent rows)
    const recentRows = rows.slice(-60);
    let sumBx = 0, sumBy = 0, sumBz = 0, sumBt = 0, count = 0;
    for (const row of recentRows) {
      const bz = parseFloat(row[bzIdx]);
      const bt = parseFloat(row[btIdx]);
      if (!isNaN(bz) && !isNaN(bt)) {
        sumBx += parseFloat(row[bxIdx]) || 0;
        sumBy += parseFloat(row[byIdx]) || 0;
        sumBz += bz;
        sumBt += bt;
        count++;
      }
    }

    const hourAvg = count > 0
      ? {
          bx: +(sumBx / count).toFixed(2),
          by: +(sumBy / count).toFixed(2),
          bz: +(sumBz / count).toFixed(2),
          bt: +(sumBt / count).toFixed(2),
          samples: count,
        }
      : null;

    const alignment = hourAvg ? parseAlignment(hourAvg.bz) : parseAlignment(latest.bz);
    const sector = parseSector(latest.bx);

    return res.status(200).json({
      current: {
        time: latest.time,
        bx: latest.bx,
        by: latest.by,
        bz: latest.bz,
        bt: latest.bt,
        sector,
      },
      hourAvg,
      alignment,
      polarField: POLAR_FIELD,
      meta: {
        source: 'NOAA SWPC Real-Time Solar Wind (mag-1-day)',
        url: NOAA_MAG_URL,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('solar-field error:', err.message);
    return res.status(502).json({
      error: 'Unable to fetch solar wind data',
      detail: err.message,
    });
  }
}

// ─── Router ───

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const type = req.query.type;

  if (type === 'solar-field') {
    return handleSolarField(req, res);
  }

  return handleSkyNow(req, res);
};
