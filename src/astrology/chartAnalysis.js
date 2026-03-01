/**
 * chartAnalysis.js — Pure analysis helpers for recursive chart readings.
 *
 * Deterministic, template-based. No AI, no React.
 * Consumes the data shapes already produced by recursiveEngine.js.
 */

import { computeShiftAnalysis, getHouseForLongitude } from './recursiveEngine';
import { getSolarCycleRule } from '../data/recursiveRules';
import { getDignity, PLANET_DIGNITIES } from '../data/planetCharacters';

// ── Constants ────────────────────────────────────────────────────────────────

export const SIGN_ELEMENTS = {
  Aries: 'fire', Taurus: 'earth', Gemini: 'air', Cancer: 'water',
  Leo: 'fire', Virgo: 'earth', Libra: 'air', Scorpio: 'water',
  Sagittarius: 'fire', Capricorn: 'earth', Aquarius: 'air', Pisces: 'water',
};

export const SIGN_MODALITIES = {
  Aries: 'cardinal', Taurus: 'fixed', Gemini: 'mutable',
  Cancer: 'cardinal', Leo: 'fixed', Virgo: 'mutable',
  Libra: 'cardinal', Scorpio: 'fixed', Sagittarius: 'mutable',
  Capricorn: 'cardinal', Aquarius: 'fixed', Pisces: 'mutable',
};

const ELEMENT_QUALITIES = {
  fire: 'initiative and expression',
  earth: 'structure and materiality',
  air: 'connection and thought',
  water: 'feeling and intuition',
};

const MODALITY_QUALITIES = {
  cardinal: 'initiation',
  fixed: 'persistence',
  mutable: 'adaptation',
};

// ── analyzePositions ─────────────────────────────────────────────────────────

/**
 * Analyze a set of planetary positions for sign concentration, elements,
 * modalities, stelliums, and clusters.
 *
 * @param {object|Array} positions — { Sun: { sign, ... }, ... } or array of { name, sign }
 * @returns {object}
 */
export function analyzePositions(positions) {
  const rows = Array.isArray(positions)
    ? positions
    : Object.entries(positions).map(([name, d]) => ({ name, ...d }));

  const signCounts = {};
  const signPlanets = {};

  for (const r of rows) {
    if (!r.sign) continue;
    signCounts[r.sign] = (signCounts[r.sign] || 0) + 1;
    if (!signPlanets[r.sign]) signPlanets[r.sign] = [];
    signPlanets[r.sign].push(r.name);
  }

  const stelliums = [];
  const clusters = [];
  for (const [sign, planets] of Object.entries(signPlanets)) {
    if (planets.length >= 3) stelliums.push({ sign, planets });
    if (planets.length >= 2) clusters.push({ sign, planets });
  }

  // Element / modality tallies
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 };

  for (const r of rows) {
    const el = SIGN_ELEMENTS[r.sign];
    const mod = SIGN_MODALITIES[r.sign];
    if (el) elements[el]++;
    if (mod) modalities[mod]++;
  }

  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const dominantModality = Object.entries(modalities).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return { signCounts, stelliums, clusters, elements, dominantElement, modalities, dominantModality };
}

// ── analyzeShifts ────────────────────────────────────────────────────────────

/**
 * Wrap computeShiftAnalysis and add a summary.
 *
 * @param {object} geoPositions — geocentric positions
 * @param {object} helioPositions — heliocentric positions
 * @returns {{ shifts: Array, shiftedCount: number, shiftedNames: string[], summary: string }}
 */
export function analyzeShifts(geoPositions, helioPositions) {
  const shifts = computeShiftAnalysis(geoPositions, helioPositions);
  const shifted = shifts.filter(s => s.shifted);
  const shiftedNames = shifted.map(s => s.planet);

  let summary;
  if (shifted.length === 0) {
    summary = 'All planets hold their signs across both frames.';
  } else if (shifted.length === 1) {
    summary = `${shiftedNames[0]} shifts sign between Earth's view and the Sun's.`;
  } else {
    summary = `${shifted.length} planets shift signs between Earth's view and the Sun's — ${shiftedNames.join(', ')}.`;
  }

  return { shifts, shiftedCount: shifted.length, shiftedNames, summary };
}

// ── findNotableAspects ───────────────────────────────────────────────────────

/**
 * Categorize aspects into tension / flow / fusion and find the tightest.
 *
 * @param {Array} aspects — [{ planet1, planet2, aspect, orb }]
 * @returns {{ tensions: Array, flows: Array, fusions: Array, tightest: object|null }}
 */
export function findNotableAspects(aspects) {
  if (!aspects || !aspects.length) {
    return { tensions: [], flows: [], fusions: [], tightest: null };
  }

  const tensions = [];
  const flows = [];
  const fusions = [];

  for (const a of aspects) {
    if (a.aspect === 'Square' || a.aspect === 'Opposition' || a.aspect === 'Quincunx') tensions.push(a);
    else if (a.aspect === 'Trine' || a.aspect === 'Sextile') flows.push(a);
    else if (a.aspect === 'Conjunction') fusions.push(a);
  }

  const tightest = [...aspects].sort((a, b) => a.orb - b.orb)[0] || null;

  return { tensions, flows, fusions, tightest };
}

// ── aggregateDignities ──────────────────────────────────────────────────────

/**
 * Aggregate essential dignities across all planetary positions.
 *
 * @param {object|Array} positions — { Sun: { sign }, ... } or array
 * @returns {{ domicile, exaltation, detriment, fall, peregrine, dignified, debilitated, summary }}
 */
export function aggregateDignities(positions) {
  const rows = Array.isArray(positions)
    ? positions
    : Object.entries(positions).map(([name, d]) => ({ name, ...d }));

  const buckets = { domicile: [], exaltation: [], detriment: [], fall: [], peregrine: [] };

  for (const r of rows) {
    if (!r.name || !r.sign) continue;
    const state = getDignity(r.name, r.sign);
    if (buckets[state]) {
      buckets[state].push({ planet: r.name, sign: r.sign });
    }
  }

  const dignified = [...buckets.domicile, ...buckets.exaltation];
  const debilitated = [...buckets.detriment, ...buckets.fall];

  const parts = [];
  if (dignified.length > 0) {
    parts.push(`${dignified.length} dignified (${dignified.map(d => `${d.planet} in ${d.sign}`).join(', ')})`);
  }
  if (debilitated.length > 0) {
    parts.push(`${debilitated.length} debilitated (${debilitated.map(d => `${d.planet} in ${d.sign}`).join(', ')})`);
  }
  const summary = parts.join(' · ') || 'All planets peregrine.';

  return { ...buckets, dignified, debilitated, summary };
}

// ── detectAspectPatterns ─────────────────────────────────────────────────────

/**
 * Detect multi-planet aspect patterns: Grand Trine, T-Square, Yod.
 *
 * @param {Array} aspects — [{ planet1, planet2, aspect, orb }]
 * @param {object|Array} positions — for validation (unused currently but available)
 * @returns {{ grandTrines: Array, tSquares: Array, yods: Array }}
 */
export function detectAspectPatterns(aspects) {
  if (!aspects || !aspects.length) {
    return { grandTrines: [], tSquares: [], yods: [] };
  }

  // Build adjacency: aspect type → set of planet pairs
  const byType = {};
  for (const a of aspects) {
    if (!byType[a.aspect]) byType[a.aspect] = [];
    byType[a.aspect].push(a);
  }

  // Helper: check if two planets share a specific aspect type
  const hasAspect = (type, p1, p2) => {
    const list = byType[type] || [];
    return list.find(a =>
      (a.planet1 === p1 && a.planet2 === p2) ||
      (a.planet1 === p2 && a.planet2 === p1)
    );
  };

  // Collect all unique planet names
  const planets = [...new Set(aspects.flatMap(a => [a.planet1, a.planet2]))];

  const grandTrines = [];
  const tSquares = [];
  const yods = [];

  // Grand Trine: 3 planets mutually in Trine
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      for (let k = j + 1; k < planets.length; k++) {
        const ab = hasAspect('Trine', planets[i], planets[j]);
        const bc = hasAspect('Trine', planets[j], planets[k]);
        const ac = hasAspect('Trine', planets[i], planets[k]);
        if (ab && bc && ac) {
          grandTrines.push({ planets: [planets[i], planets[j], planets[k]], aspects: [ab, bc, ac] });
        }
      }
    }
  }

  // T-Square: 2 squares + 1 opposition
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const opp = hasAspect('Opposition', planets[i], planets[j]);
      if (!opp) continue;
      for (let k = 0; k < planets.length; k++) {
        if (k === i || k === j) continue;
        const sq1 = hasAspect('Square', planets[i], planets[k]);
        const sq2 = hasAspect('Square', planets[j], planets[k]);
        if (sq1 && sq2) {
          // Avoid duplicates
          const key = [planets[i], planets[j], planets[k]].sort().join(',');
          if (!tSquares.find(t => t.planets.sort().join(',') === key)) {
            tSquares.push({ planets: [planets[i], planets[j], planets[k]], apex: planets[k], aspects: [opp, sq1, sq2] });
          }
        }
      }
    }
  }

  // Yod: 2 quincunx + 1 sextile
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const sext = hasAspect('Sextile', planets[i], planets[j]);
      if (!sext) continue;
      for (let k = 0; k < planets.length; k++) {
        if (k === i || k === j) continue;
        const q1 = hasAspect('Quincunx', planets[i], planets[k]);
        const q2 = hasAspect('Quincunx', planets[j], planets[k]);
        if (q1 && q2) {
          const key = [planets[i], planets[j], planets[k]].sort().join(',');
          if (!yods.find(y => y.planets.sort().join(',') === key)) {
            yods.push({ planets: [planets[i], planets[j], planets[k]], apex: planets[k], aspects: [sext, q1, q2] });
          }
        }
      }
    }
  }

  return { grandTrines, tSquares, yods };
}

// ── computeTransitAspects ────────────────────────────────────────────────────

const TRANSIT_ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Sextile',     angle: 60, orb: 4 },
  { name: 'Square',      angle: 90, orb: 6 },
  { name: 'Trine',       angle: 120, orb: 6 },
  { name: 'Quincunx',    angle: 150, orb: 2 },
  { name: 'Opposition',  angle: 180, orb: 6 },
];

/**
 * Compute cross-chart aspects between transit and natal positions.
 *
 * @param {object|Array} transitPositions
 * @param {object|Array} natalPositions
 * @returns {Array<{ transitPlanet, natalPlanet, aspect, orb, exact }>}
 */
export function computeTransitAspects(transitPositions, natalPositions) {
  if (!transitPositions || !natalPositions) return [];

  const transitMap = Array.isArray(transitPositions)
    ? Object.fromEntries(transitPositions.map(p => [p.name, p]))
    : transitPositions;
  const natalMap = Array.isArray(natalPositions)
    ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
    : natalPositions;

  const results = [];

  for (const [tName, tData] of Object.entries(transitMap)) {
    for (const [nName, nData] of Object.entries(natalMap)) {
      let sep = Math.abs(tData.longitude - nData.longitude);
      if (sep > 180) sep = 360 - sep;

      for (const aspect of TRANSIT_ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          results.push({
            transitPlanet: tName,
            natalPlanet: nName,
            aspect: aspect.name,
            orb: +orb.toFixed(1),
            exact: orb < 1,
          });
          break;
        }
      }
    }
  }

  // Sort by orb (tightest first)
  results.sort((a, b) => a.orb - b.orb);
  return results;
}

// ── findCrossPerspectiveResonance ────────────────────────────────────────────

/**
 * Find agreement/disagreement across perspectives for each target body.
 *
 * @param {object} perspectives — { Sun: { positions }, Moon: { positions }, ... }
 * @returns {{ agreements: Array, disagreements: Array }}
 */
export function findCrossPerspectiveResonance(perspectives) {
  if (!perspectives) return { agreements: [], disagreements: [] };

  const observers = Object.keys(perspectives);
  if (observers.length < 2) return { agreements: [], disagreements: [] };

  // Gather: for each target body, what sign does each observer see it in?
  const targetSigns = {};
  for (const observer of observers) {
    const positions = perspectives[observer]?.positions;
    if (!positions) continue;
    const posMap = Array.isArray(positions)
      ? Object.fromEntries(positions.map(p => [p.name, p]))
      : positions;
    for (const [target, data] of Object.entries(posMap)) {
      if (!targetSigns[target]) targetSigns[target] = [];
      targetSigns[target].push({ observer, sign: data.sign });
    }
  }

  const agreements = [];
  const disagreements = [];

  for (const [target, sightings] of Object.entries(targetSigns)) {
    if (sightings.length < 2) continue;
    const signs = new Set(sightings.map(s => s.sign));
    if (signs.size === 1) {
      agreements.push({
        target,
        sign: sightings[0].sign,
        observers: sightings.map(s => s.observer),
      });
    } else {
      disagreements.push({
        target,
        sightings,
      });
    }
  }

  return { agreements, disagreements };
}

// ── analyzeHouses ────────────────────────────────────────────────────────────

const ANGULAR_HOUSES = [1, 4, 7, 10];

/**
 * Analyze house occupancy and angular planets.
 *
 * @param {object|Array} positions — planet positions
 * @param {Array<{ house, sign, startDegree }>} houses — Whole Sign houses
 * @param {object} ascendant — { longitude, sign, degree }
 * @param {object} midheaven — { longitude, sign, degree }
 * @returns {{ occupiedHouses, emptyHouses, angularPlanets, houseConcentration, housePlanets }}
 */
export function analyzeHouses(positions, houses, ascendant, midheaven) {
  if (!positions || !houses) return { occupiedHouses: [], emptyHouses: [], angularPlanets: [], houseConcentration: [], housePlanets: {} };

  const rows = Array.isArray(positions)
    ? positions
    : Object.entries(positions).map(([name, d]) => ({ name, ...d }));

  const housePlanets = {};
  for (let i = 1; i <= 12; i++) housePlanets[i] = [];

  for (const r of rows) {
    if (r.longitude == null) continue;
    const h = r.house || getHouseForLongitude(r.longitude, houses);
    if (h) housePlanets[h].push(r.name);
  }

  const occupiedHouses = Object.entries(housePlanets)
    .filter(([, planets]) => planets.length > 0)
    .map(([h]) => +h);
  const emptyHouses = Object.entries(housePlanets)
    .filter(([, planets]) => planets.length === 0)
    .map(([h]) => +h);

  const angularPlanets = [];
  for (const h of ANGULAR_HOUSES) {
    for (const planet of (housePlanets[h] || [])) {
      angularPlanets.push({ planet, house: h });
    }
  }

  const houseConcentration = Object.entries(housePlanets)
    .filter(([, planets]) => planets.length >= 2)
    .map(([h, planets]) => ({ house: +h, planets, count: planets.length }))
    .sort((a, b) => b.count - a.count);

  return { occupiedHouses, emptyHouses, angularPlanets, houseConcentration, housePlanets };
}

// ── computePartOfFortune ─────────────────────────────────────────────────────

/**
 * Compute the Part of Fortune (Lot of Fortune).
 * Day chart: ASC + Moon − Sun
 * Night chart: ASC + Sun − Moon
 *
 * @param {object} ascendant — { longitude }
 * @param {object} sun — { longitude }
 * @param {object} moon — { longitude }
 * @returns {{ longitude, sign, degree, signIndex }|null}
 */
export function computePartOfFortune(ascendant, sun, moon) {
  if (!ascendant || !sun || !moon) return null;
  const ascLon = ascendant.longitude;
  const sunLon = sun.longitude;
  const moonLon = moon.longitude;

  // Day chart: Sun above horizon (Sun longitude roughly in upper half relative to ASC)
  // Simplified: if Sun is between ASC and DSC (going clockwise), it's a day chart
  const dscLon = (ascLon + 180) % 360;
  let sunAbove;
  if (ascLon < dscLon) {
    sunAbove = sunLon >= ascLon && sunLon < dscLon;
  } else {
    sunAbove = sunLon >= ascLon || sunLon < dscLon;
  }

  let pofLon;
  if (sunAbove) {
    // Day chart: ASC + Moon - Sun
    pofLon = ascLon + moonLon - sunLon;
  } else {
    // Night chart: ASC + Sun - Moon
    pofLon = ascLon + sunLon - moonLon;
  }
  pofLon = ((pofLon % 360) + 360) % 360;

  const { sign, degree, signIndex } = lonToSignHelper(pofLon);
  return { longitude: +pofLon.toFixed(2), sign, degree, signIndex, isDayChart: sunAbove };
}

// Helper to avoid importing lonToSign circularly (it's not circular but keeps things clean)
function lonToSignHelper(lon) {
  const SIGN_NAMES = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = +(normalized % 30).toFixed(1);
  return { sign: SIGN_NAMES[signIndex], degree, signIndex };
}

// ── detectMutualReceptions ───────────────────────────────────────────────────

/**
 * Detect mutual receptions — two planets in each other's domicile signs.
 *
 * @param {object|Array} positions — { Sun: { sign }, Moon: { sign }, ... }
 * @returns {Array<{ planet1, sign1, planet2, sign2 }>}
 */
export function detectMutualReceptions(positions) {
  if (!positions) return [];
  const rows = Array.isArray(positions)
    ? positions
    : Object.entries(positions).map(([name, d]) => ({ name, ...d }));

  const receptions = [];
  const checked = new Set();

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      if (!a.name || !a.sign || !b.name || !b.sign) continue;
      if (!PLANET_DIGNITIES[a.name] || !PLANET_DIGNITIES[b.name]) continue;

      const key = [a.name, b.name].sort().join('-');
      if (checked.has(key)) continue;
      checked.add(key);

      // A is in B's domicile sign AND B is in A's domicile sign
      const aInBHome = PLANET_DIGNITIES[b.name].domicile.includes(a.sign);
      const bInAHome = PLANET_DIGNITIES[a.name].domicile.includes(b.sign);

      if (aInBHome && bInAHome) {
        receptions.push({
          planet1: a.name,
          sign1: a.sign,
          planet2: b.name,
          sign2: b.sign,
        });
      }
    }
  }

  return receptions;
}

// ── Tightest-aspect sentence helper ──────────────────────────────────────────

const ASPECT_VERB = {
  Conjunction: 'fuses with',
  Sextile: 'opens toward',
  Square: 'presses against',
  Trine: 'flows with',
  Quincunx: 'adjusts toward',
  Opposition: 'faces',
};

function tightestSentence(tightest) {
  if (!tightest) return '';
  const verb = ASPECT_VERB[tightest.aspect] || 'meets';
  return `${tightest.planet1} ${verb} ${tightest.planet2} (${tightest.aspect}, ${tightest.orb}\u00B0 orb).`;
}

// ── generateSynopsis ─────────────────────────────────────────────────────────

/**
 * Build a 3-5 sentence synopsis from weather data (and optionally personal data).
 * Template-based, no AI.
 *
 * @param {object} weatherData — from computeCelestialWeather
 * @param {object} [personalData] — from computeRecursiveReading (optional)
 * @returns {string}
 */
export function generateSynopsis(weatherData, personalData) {
  if (!weatherData) return '';

  const geoPositions = weatherData.geocentric?.planets;
  const helioPositions = weatherData.heliocentric?.planets;
  const geoAspects = weatherData.geocentric?.aspects;

  const sentences = [];

  // 1. Sign concentration / element emphasis
  if (geoPositions) {
    const analysis = analyzePositions(geoPositions);

    if (analysis.stelliums.length > 0) {
      const st = analysis.stelliums[0];
      const el = SIGN_ELEMENTS[st.sign];
      const quality = el ? ELEMENT_QUALITIES[el] : '';
      sentences.push(
        `The sky gathers around ${st.sign} — ${st.planets.join(', ')} cluster there${quality ? `, carrying ${quality}` : ''}.`
      );
    } else if (analysis.clusters.length > 0) {
      const topClusters = analysis.clusters.slice(0, 2);
      const signs = topClusters.map(c => c.sign).join(' and ');
      const el = analysis.dominantElement;
      const quality = el ? ELEMENT_QUALITIES[el] : '';
      sentences.push(
        `The emphasis falls on ${signs}${quality ? ` — ${el} energy, ${quality}` : ''}.`
      );
    } else if (analysis.dominantElement) {
      const quality = ELEMENT_QUALITIES[analysis.dominantElement];
      sentences.push(
        `${analysis.dominantElement.charAt(0).toUpperCase() + analysis.dominantElement.slice(1)} energy carries the emphasis today — ${quality}.`
      );
    }
  }

  // 2. Shift analysis
  if (geoPositions && helioPositions) {
    const { summary } = analyzeShifts(geoPositions, helioPositions);
    sentences.push(summary);
  }

  // 3. Tightest aspect
  if (geoAspects && geoAspects.length > 0) {
    const { tightest } = findNotableAspects(geoAspects);
    const ts = tightestSentence(tightest);
    if (ts) sentences.push(ts);
  }

  // 4. Solar cycle (if notable)
  if (weatherData.solarCycle) {
    const sc = weatherData.solarCycle;
    const rule = getSolarCycleRule(sc.phase, sc.ascending);
    if (rule === getSolarCycleRule(0.5, true) || rule === getSolarCycleRule(0, true)) {
      // Only mention at max or min — skip ascending/descending to keep it brief
      sentences.push(`Solar cycle ${sc.cycleNumber} is at ${rule.phase.toLowerCase()}.`);
    }
  }

  // 5. Personal transit connections (if personal data provided)
  if (personalData && geoPositions) {
    const natalPositions = personalData.geocentric?.planets;
    if (natalPositions) {
      const natalMap = Array.isArray(natalPositions)
        ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
        : natalPositions;
      const geoMap = Array.isArray(geoPositions)
        ? Object.fromEntries(geoPositions.map(p => [p.name, p]))
        : geoPositions;

      const activations = [];
      for (const [planet, transit] of Object.entries(geoMap)) {
        const natal = natalMap[planet];
        if (natal && natal.sign === transit.sign) {
          activations.push(planet);
        }
      }
      if (activations.length > 0) {
        const list = activations.slice(0, 3).join(', ');
        sentences.push(`Transit ${list} now ${activations.length === 1 ? 'activates' : 'activate'} natal territory.`);
      }
    }
  }

  return sentences.join(' ');
}

// ── Phase 4: Progression analysis ────────────────────────────────────────────

/**
 * Compute aspects between progressed positions and natal positions.
 * Progressed Moon to natal planets is the most important.
 *
 * @param {object} progressedPositions — { Sun: { longitude }, Moon: { longitude }, ... }
 * @param {object|Array} natalPositions — natal chart positions
 * @returns {Array<{ progressedPlanet, natalPlanet, aspect, orb, exact }>}
 */
export function computeProgressedAspects(progressedPositions, natalPositions) {
  if (!progressedPositions || !natalPositions) return [];

  const progMap = Array.isArray(progressedPositions)
    ? Object.fromEntries(progressedPositions.map(p => [p.name, p]))
    : progressedPositions;
  const natalMap = Array.isArray(natalPositions)
    ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
    : natalPositions;

  const PROG_ASPECTS = [
    { name: 'Conjunction', angle: 0, orb: 1.5 },
    { name: 'Sextile', angle: 60, orb: 1.5 },
    { name: 'Square', angle: 90, orb: 1.5 },
    { name: 'Trine', angle: 120, orb: 1.5 },
    { name: 'Opposition', angle: 180, orb: 1.5 },
  ];

  const results = [];

  for (const [pName, pData] of Object.entries(progMap)) {
    for (const [nName, nData] of Object.entries(natalMap)) {
      let sep = Math.abs(pData.longitude - nData.longitude);
      if (sep > 180) sep = 360 - sep;

      for (const aspect of PROG_ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          results.push({
            progressedPlanet: pName,
            natalPlanet: nName,
            aspect: aspect.name,
            orb: +orb.toFixed(2),
            exact: orb < 0.5,
          });
          break;
        }
      }
    }
  }

  results.sort((a, b) => a.orb - b.orb);
  return results;
}

/**
 * Detect progressed planets that have changed signs since birth.
 *
 * @param {object} progressedPositions
 * @param {object|Array} natalPositions
 * @returns {Array<{ planet, natalSign, progressedSign }>}
 */
export function detectProgressedIngresses(progressedPositions, natalPositions) {
  if (!progressedPositions || !natalPositions) return [];

  const progMap = Array.isArray(progressedPositions)
    ? Object.fromEntries(progressedPositions.map(p => [p.name, p]))
    : progressedPositions;
  const natalMap = Array.isArray(natalPositions)
    ? Object.fromEntries(natalPositions.map(p => [p.name, p]))
    : natalPositions;

  const ingresses = [];
  for (const [planet, pData] of Object.entries(progMap)) {
    const natal = natalMap[planet];
    if (!natal) continue;
    if (pData.sign !== natal.sign) {
      ingresses.push({ planet, natalSign: natal.sign, progressedSign: pData.sign });
    }
  }
  return ingresses;
}

// ── Synastry analysis ─────────────────────────────────────────────────────────

/**
 * Analyze synastry cross-aspects: group by type, find tightest, and score.
 *
 * @param {Array} crossAspects — from computeSynastry
 * @returns {{ byType, tightest, hardCount, softCount, score }}
 */
export function analyzeSynastryAspects(crossAspects) {
  if (!crossAspects || !crossAspects.length) return { byType: {}, tightest: null, hardCount: 0, softCount: 0, score: 0 };

  const HARD = ['Square', 'Opposition', 'Quincunx'];
  const SOFT = ['Trine', 'Sextile'];

  const byType = {};
  let hardCount = 0;
  let softCount = 0;

  for (const a of crossAspects) {
    if (!byType[a.aspect]) byType[a.aspect] = [];
    byType[a.aspect].push(a);
    if (HARD.includes(a.aspect)) hardCount++;
    if (SOFT.includes(a.aspect)) softCount++;
  }

  const conjunctions = byType['Conjunction']?.length || 0;
  // Score: soft + conjunction bonuses, hard penalties, tightness bonuses
  const score = softCount * 2 + conjunctions * 3 - hardCount * 1.5 +
    crossAspects.filter(a => a.exact).length * 2;

  return {
    byType,
    tightest: crossAspects[0] || null,
    hardCount,
    softCount,
    score: +score.toFixed(1),
  };
}

/**
 * Find "double whammies" — when planet A aspects planet B AND planet B aspects planet A.
 * These are the strongest synastry signatures.
 *
 * @param {Array} crossAspects — from computeSynastry
 * @returns {Array<{ planet1, planet2, aspect1, aspect2, orb1, orb2 }>}
 */
export function findSynastryPatterns(crossAspects) {
  if (!crossAspects || !crossAspects.length) return [];

  const doubleWhammies = [];
  const seen = new Set();

  for (let i = 0; i < crossAspects.length; i++) {
    for (let j = i + 1; j < crossAspects.length; j++) {
      const a = crossAspects[i];
      const b = crossAspects[j];

      // Double whammy: A's planet1 = B's planet2, A's planet2 = B's planet1
      if (a.planet1 === b.planet2 && a.planet2 === b.planet1) {
        const key = [a.planet1, a.planet2].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          doubleWhammies.push({
            planet1: a.planet1,
            planet2: a.planet2,
            aspect1: a.aspect,
            aspect2: b.aspect,
            orb1: a.orb,
            orb2: b.orb,
          });
        }
      }
    }
  }

  return doubleWhammies;
}
