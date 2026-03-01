/**
 * recursiveEngine.js — Client-side recursive astrology computation engine.
 *
 * Computes planet-centric positions, aspects, carried experience, and solar
 * cycle phase.  All math uses the astronomy-engine library (already in deps).
 */

import { Body, GeoVector, HelioVector, Ecliptic, MakeTime, SiderealTime } from 'astronomy-engine';
import {
  PLANETARY_PHYSICS,
  FIELD_TYPES,
  ORBITAL_RADII_NORM,
} from '../data/planetaryPhysics';

// ── Constants ────────────────────────────────────────────────────────────────

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Sextile',     angle: 60, orb: 6 },
  { name: 'Square',      angle: 90, orb: 8 },
  { name: 'Trine',       angle: 120, orb: 8 },
  { name: 'Quincunx',    angle: 150, orb: 3 },
  { name: 'Opposition',  angle: 180, orb: 8 },
];

/** Classical planets + luminaries that can be observers or targets. */
const PLANET_BODIES = {
  Sun:     Body.Sun,
  Moon:    Body.Moon,
  Mercury: Body.Mercury,
  Venus:   Body.Venus,
  Mars:    Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn:  Body.Saturn,
};

/** Bodies that orbit the Sun (valid heliocentric observers). */
const HELIO_BODIES = {
  Mercury: Body.Mercury,
  Venus:   Body.Venus,
  Earth:   Body.Earth,
  Mars:    Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn:  Body.Saturn,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ecliptic longitude (degrees) to sign / degree within sign. */
export function lonToSign(lon) {
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = +(normalized % 30).toFixed(1);
  return { longitude: +normalized.toFixed(2), sign: SIGNS[signIndex], degree, signIndex };
}

/** Convert a JS Date to the astronomy-engine time type. */
function toAstroTime(date) {
  return MakeTime(date);
}

/**
 * Lahiri ayanamsa for a given date — sidereal offset.
 * Mirrors OrbitalDiagram.js and api/_lib/natalChart.js.
 */
export function getLahiriAyanamsa(date) {
  const fracYear = date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365.25);
  return 23.853 + (fracYear - 2000) * 0.01397;
}

/**
 * Convert ecliptic longitude to sidereal sign (Vedic).
 * @param {number} lon — tropical ecliptic longitude in degrees
 * @param {Date} date — for ayanamsa computation
 */
export function lonToSiderealSign(lon, date) {
  const ayanamsa = getLahiriAyanamsa(date);
  const siderealLon = ((lon - ayanamsa) % 360 + 360) % 360;
  const signIndex = Math.floor(siderealLon / 30);
  const degree = +(siderealLon % 30).toFixed(1);
  return { longitude: +siderealLon.toFixed(2), sign: SIGNS[signIndex], degree, signIndex };
}

// ── Planet-centric position computation ──────────────────────────────────────

/**
 * Get the heliocentric position vector for a body.
 * Handles Sun (origin), Moon (Earth + geo offset), Earth, and all planets.
 */
function getHelioPosition(bodyKey, t) {
  if (bodyKey === 'Sun') {
    return { x: 0, y: 0, z: 0 };
  }
  if (bodyKey === 'Moon') {
    const earthHelio = HelioVector(Body.Earth, t);
    const moonGeo = GeoVector(Body.Moon, t, true);
    return {
      x: earthHelio.x + moonGeo.x,
      y: earthHelio.y + moonGeo.y,
      z: earthHelio.z + moonGeo.z,
    };
  }
  const body = HELIO_BODIES[bodyKey] || PLANET_BODIES[bodyKey];
  const v = HelioVector(body, t);
  return { x: v.x, y: v.y, z: v.z };
}

/**
 * Compute ecliptic longitude of `targetBody` as seen from `observerBody`.
 */
function planetCentricLongitude(observerBodyKey, targetBodyKey, date) {
  const t = toAstroTime(date);
  const obsVec = getHelioPosition(observerBodyKey, t);
  const tgtVec = getHelioPosition(targetBodyKey, t);
  const dx = tgtVec.x - obsVec.x;
  const dy = tgtVec.y - obsVec.y;
  const dz = tgtVec.z - obsVec.z;
  const ecl = Ecliptic({ x: dx, y: dy, z: dz, t });
  return ecl.elon;
}

/**
 * Compute all visible body positions from a given observer's perspective.
 *
 * @param {string} observerKey — 'Earth', 'Sun', 'Mars', etc.
 * @param {Date} date
 * @returns {{ [name]: { longitude, sign, degree, signIndex } }}
 */
export function computePlanetCentricPositions(observerKey, date) {
  const result = {};

  // Determine which bodies are visible from this observer
  const allTargets = observerKey === 'Earth'
    ? ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
    : observerKey === 'Sun'
      ? ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Moon']
      : ['Sun', 'Moon', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn'];

  for (const target of allTargets) {
    if (target === observerKey) continue; // can't see yourself
    const lon = planetCentricLongitude(observerKey, target, date);
    result[target] = lonToSign(lon);
  }

  return result;
}

// ── Aspect computation ───────────────────────────────────────────────────────

/**
 * Find aspects between positions.
 * @param {{ [name]: { longitude } }} positions
 * @returns {Array<{ planet1, planet2, aspect, orb }>}
 */
export function computeAspects(positions) {
  const entries = Object.entries(positions).map(([name, data]) => ({
    name,
    longitude: data.longitude,
  }));

  const found = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      let sep = Math.abs(entries[i].longitude - entries[j].longitude);
      if (sep > 180) sep = 360 - sep;

      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          found.push({
            planet1: entries[i].name,
            planet2: entries[j].name,
            aspect: aspect.name,
            orb: +orb.toFixed(1),
          });
          break;
        }
      }
    }
  }
  return found;
}

// ── Carried experience ───────────────────────────────────────────────────────

/**
 * Get a planet's "carried experience" — the chart as seen from its own position.
 *
 * @param {string} planetKey — 'Mars', 'Venus', etc.
 * @param {Date} date
 * @returns {{ positions, aspects }}
 */
export function getCarriedExperience(planetKey, date) {
  const positions = computePlanetCentricPositions(planetKey, date);
  const aspects = computeAspects(positions);
  return { positions, aspects };
}

// ── Shift analysis ───────────────────────────────────────────────────────────

/**
 * Compare two sets of positions and compute what shifted.
 * For each planet present in both sets, reports sign change and degree delta.
 *
 * @param {{ [name]: { longitude, sign, signIndex } }} basePositions — e.g. geocentric
 * @param {{ [name]: { longitude, sign, signIndex } }} comparePositions — e.g. heliocentric
 * @returns {Array<{ planet, fromSign, toSign, shifted, degreeDelta, direction }>}
 */
export function computeShiftAnalysis(basePositions, comparePositions) {
  if (!basePositions || !comparePositions) return [];

  // Normalize: handle both array (natal) and object formats
  const baseMap = Array.isArray(basePositions)
    ? Object.fromEntries(basePositions.map(p => [p.name, p]))
    : basePositions;
  const compMap = Array.isArray(comparePositions)
    ? Object.fromEntries(comparePositions.map(p => [p.name, p]))
    : comparePositions;

  const results = [];
  for (const planet of Object.keys(compMap)) {
    const base = baseMap[planet];
    const comp = compMap[planet];
    if (!base || !comp) continue;

    let delta = comp.longitude - base.longitude;
    // Normalize to -180..180
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    results.push({
      planet,
      fromSign: base.sign,
      toSign: comp.sign,
      shifted: base.sign !== comp.sign,
      degreeDelta: +Math.abs(delta).toFixed(1),
      direction: delta >= 0 ? 'forward' : 'backward',
    });
  }

  return results;
}

// ── Solar cycle ──────────────────────────────────────────────────────────────

/**
 * Historical solar cycle data — observed start dates and polarity reversal dates.
 * Sources: Wilcox Solar Observatory (WSO, systematic since 1976), Babcock (1959),
 * SDO/HMI, GONG magnetograms. Reversal dates are when the dominant dipole
 * completed its flip (both poles same sign → one pole flips → both poles flip).
 *
 * flipStart: when the first pole began reversing
 * flipEnd:   when both poles had reversed (reversal complete)
 * For cycles with only approximate data, flipStart ≈ flipEnd.
 * observed: true if based on direct magnetogram data (WSO/HMI)
 */
const SOLAR_CYCLE_HISTORY = [
  { cycle: 19, start: '1954-04-01', flipStart: '1958-01-01', flipEnd: '1959-01-01', observed: false,
    note: 'First observed reversal (Babcock 1959). Dates approximate from sunspot proxy.' },
  { cycle: 20, start: '1964-10-01', flipStart: '1969-06-01', flipEnd: '1971-06-01', observed: false,
    note: 'Sparse magnetogram data. Estimated from sunspot records and early Wilcox observations.' },
  { cycle: 21, start: '1976-06-01', flipStart: '1979-11-01', flipEnd: '1981-07-01', observed: true,
    note: 'WSO operational from 1975. North pole reversed late 1979, south pole mid-1981.' },
  { cycle: 22, start: '1986-09-01', flipStart: '1989-12-01', flipEnd: '1991-03-01', observed: true,
    note: 'WSO data. Clean reversal — north late 1989, south early 1991.' },
  { cycle: 23, start: '1996-08-01', flipStart: '1999-10-01', flipEnd: '2001-06-01', observed: true,
    note: 'WSO data. Reversal took ~20 months. Well-documented extended process.' },
  { cycle: 24, start: '2008-12-01', flipStart: '2012-06-01', flipEnd: '2014-11-01', observed: true,
    note: 'WSO + SDO/HMI. Extended asymmetric reversal — north flipped mid-2012, south late 2014. Triple reversal in north pole.' },
  { cycle: 25, start: '2019-12-01', flipStart: '2023-05-01', flipEnd: '2025-03-01', observed: true,
    note: 'WSO + GONG + SDO/HMI. Activity exceeded predictions. Reversal completing ~early 2025.' },
];

// Parse date strings into Date objects once
const CYCLES = SOLAR_CYCLE_HISTORY.map(c => ({
  ...c,
  startDate: new Date(c.start + 'T00:00:00Z'),
  flipStartDate: new Date(c.flipStart + 'T00:00:00Z'),
  flipEndDate: new Date(c.flipEnd + 'T00:00:00Z'),
}));

/**
 * Find the cycle entry for a given date. Uses historical data when available,
 * extrapolates for dates outside the record using 11-year average.
 */
function findCycleForDate(date) {
  const t = date.getTime();

  // Check if date falls within a known cycle
  for (let i = 0; i < CYCLES.length; i++) {
    const curr = CYCLES[i];
    const nextStart = i < CYCLES.length - 1
      ? CYCLES[i + 1].startDate.getTime()
      : curr.startDate.getTime() + 11 * 365.25 * 24 * 60 * 60 * 1000;

    if (t >= curr.startDate.getTime() && t < nextStart) {
      const cycleLength = nextStart - curr.startDate.getTime();
      return { ...curr, cycleLengthMs: cycleLength, nextStartMs: nextStart };
    }
  }

  // Extrapolate outside historical range
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const avgCycleMs = 11 * msPerYear;
  const oldest = CYCLES[0];
  const newest = CYCLES[CYCLES.length - 1];

  if (t < oldest.startDate.getTime()) {
    // Before cycle 19: extrapolate backward
    const diff = oldest.startDate.getTime() - t;
    const cyclesBack = Math.ceil(diff / avgCycleMs);
    const cycleNum = oldest.cycle - cyclesBack;
    const startMs = oldest.startDate.getTime() - cyclesBack * avgCycleMs;
    return {
      cycle: cycleNum, observed: false,
      startDate: new Date(startMs),
      flipStartDate: new Date(startMs + 5.5 * msPerYear),
      flipEndDate: new Date(startMs + 5.5 * msPerYear),
      cycleLengthMs: avgCycleMs,
      nextStartMs: startMs + avgCycleMs,
      note: 'Extrapolated — no observational data this far back.',
    };
  }

  // After latest cycle: extrapolate forward
  const newestNextStart = newest.startDate.getTime() + 11 * msPerYear;
  const diff = t - newestNextStart;
  const cyclesForward = Math.max(0, Math.floor(diff / avgCycleMs));
  const cycleNum = newest.cycle + 1 + cyclesForward;
  const startMs = newestNextStart + cyclesForward * avgCycleMs;
  return {
    cycle: cycleNum, observed: false,
    startDate: new Date(startMs),
    flipStartDate: new Date(startMs + 5.5 * msPerYear),
    flipEndDate: new Date(startMs + 5.5 * msPerYear),
    cycleLengthMs: avgCycleMs,
    nextStartMs: startMs + avgCycleMs,
    note: 'Predicted — cycle has not yet been observed.',
  };
}

/**
 * Compute solar cycle phase for a given date using historical data.
 * @param {Date} date
 * @returns {{ cycleNumber, phase, ascending, yearsInCycle, approximateFlipDate,
 *             flipStart, flipEnd, observed, inReversal, note }}
 */
export function getSolarCyclePhase(date) {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const info = findCycleForDate(date);
  const cycleLengthMs = info.cycleLengthMs;

  const elapsed = date.getTime() - info.startDate.getTime();
  const phaseYears = elapsed / msPerYear;
  const cycleYears = cycleLengthMs / msPerYear;
  const phase = elapsed / cycleLengthMs; // 0–1

  // Flip midpoint is the average of flipStart and flipEnd
  const flipMidMs = (info.flipStartDate.getTime() + info.flipEndDate.getTime()) / 2;
  const ascending = date.getTime() < flipMidMs;

  // Is the date currently within the reversal window?
  const inReversal = date.getTime() >= info.flipStartDate.getTime()
    && date.getTime() <= info.flipEndDate.getTime();

  return {
    cycleNumber: info.cycle,
    phase: +phase.toFixed(3),
    ascending,
    yearsInCycle: +phaseYears.toFixed(2),
    approximateFlipDate: new Date(flipMidMs),
    flipStart: info.flipStartDate,
    flipEnd: info.flipEndDate,
    observed: info.observed,
    inReversal,
    note: info.note || null,
  };
}

// ── Lunar Phase ──────────────────────────────────────────────────────────────

const LUNAR_PHASES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
];

/**
 * Compute the lunar phase from geocentric positions.
 *
 * @param {{ Sun: { longitude }, Moon: { longitude } }} geoPositions
 * @returns {{ phase, elongation, illumination, waxing }}
 */
export function computeLunarPhase(geoPositions) {
  if (!geoPositions?.Sun || !geoPositions?.Moon) {
    return { phase: 'Unknown', elongation: 0, illumination: 0, waxing: true };
  }

  let elongation = geoPositions.Moon.longitude - geoPositions.Sun.longitude;
  elongation = ((elongation % 360) + 360) % 360;

  const waxing = elongation < 180;
  const illumination = Math.round((1 - Math.cos(elongation * Math.PI / 180)) / 2 * 100);

  const phaseIndex = Math.floor(elongation / 45) % 8;
  const phase = LUNAR_PHASES[phaseIndex];

  return { phase, elongation: +elongation.toFixed(1), illumination, waxing };
}

// ── Retrograde Detection ────────────────────────────────────────────────────

const RETROGRADE_PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Detect retrograde motion for classical planets.
 * Compares geocentric longitude at date-1 and date+1 to determine direction.
 *
 * @param {Date} date
 * @returns {{ [planet]: { retrograde, station, dailyMotion, direction } }}
 */
export function detectRetrogrades(date) {
  const prevDate = new Date(date.getTime() - ONE_DAY_MS);
  const nextDate = new Date(date.getTime() + ONE_DAY_MS);

  const prev = computePlanetCentricPositions('Earth', prevDate);
  const curr = computePlanetCentricPositions('Earth', date);
  const next = computePlanetCentricPositions('Earth', nextDate);

  const result = {};
  for (const planet of RETROGRADE_PLANETS) {
    if (!prev[planet] || !curr[planet] || !next[planet]) continue;

    // Compute daily motion (average of prev→curr and curr→next)
    let delta1 = curr[planet].longitude - prev[planet].longitude;
    if (delta1 > 180) delta1 -= 360;
    if (delta1 < -180) delta1 += 360;

    let delta2 = next[planet].longitude - curr[planet].longitude;
    if (delta2 > 180) delta2 -= 360;
    if (delta2 < -180) delta2 += 360;

    const dailyMotion = +(((delta1 + delta2) / 2)).toFixed(3);
    const retrograde = dailyMotion < 0;
    const station = Math.abs(dailyMotion) < 0.1;
    const direction = retrograde ? 'retrograde' : 'direct';

    result[planet] = { retrograde, station, dailyMotion, direction };
  }

  return result;
}

// ── Lunar Nodes (mean node formula) ──────────────────────────────────────────

/**
 * Compute mean lunar node longitude for a given date.
 * Uses the standard mean-node polynomial:
 *   Omega = 125.0445479 − 1934.1362891·T + 0.0020754·T² + T³/467441 − T⁴/60616000
 * where T = Julian centuries from J2000.0.
 *
 * @param {Date} date
 * @returns {{ northNode: { longitude, sign, degree, signIndex }, southNode: { longitude, sign, degree, signIndex } }}
 */
export function computeLunarNodes(date) {
  const jd = 2451545.0 + (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const T = (jd - 2451545.0) / 36525;
  const omega = 125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T * T
    + (T * T * T) / 467441
    - (T * T * T * T) / 60616000;
  const northLon = ((omega % 360) + 360) % 360;
  const southLon = (northLon + 180) % 360;
  return {
    northNode: lonToSign(northLon),
    southNode: lonToSign(southLon),
  };
}

// ── Client-side Ascendant / MC computation ───────────────────────────────────

/**
 * Compute Ascendant longitude for a given date and geographic location.
 * Mirrors the server-side logic in api/_lib/natalChart.js.
 *
 * @param {Date} date
 * @param {number} latitude — degrees
 * @param {number} longitude — degrees
 * @returns {number} ecliptic longitude in degrees (0-360)
 */
export function computeAscendant(date, latitude, longitude) {
  const gst = SiderealTime(date);
  const lst = ((gst + longitude / 15) % 24 + 24) % 24;
  const lstRad = lst * 15 * Math.PI / 180;
  const obliquity = 23.4393 * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;
  const ascRad = Math.atan2(
    Math.cos(lstRad),
    -(Math.sin(lstRad) * Math.cos(obliquity) + Math.tan(latRad) * Math.sin(obliquity))
  );
  return ((ascRad * 180 / Math.PI) % 360 + 360) % 360;
}

/**
 * Compute Midheaven (MC) longitude for a given date and geographic longitude.
 *
 * @param {Date} date
 * @param {number} longitude — geographic longitude in degrees
 * @returns {number} ecliptic longitude in degrees (0-360)
 */
export function computeMidheaven(date, longitude) {
  const gst = SiderealTime(date);
  const lst = ((gst + longitude / 15) % 24 + 24) % 24;
  const lstRad = lst * 15 * Math.PI / 180;
  const obliquity = 23.4393 * Math.PI / 180;
  const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(obliquity));
  return ((mcRad * 180 / Math.PI) % 360 + 360) % 360;
}

/**
 * Compute Whole Sign houses from the Ascendant sign index.
 *
 * @param {number} ascSignIndex — 0-11 (Aries=0)
 * @returns {Array<{ house, sign, startDegree }>}
 */
export function computeWholeSignHouses(ascSignIndex) {
  return Array.from({ length: 12 }, (_, i) => {
    const houseSignIndex = (ascSignIndex + i) % 12;
    return {
      house: i + 1,
      sign: SIGNS[houseSignIndex],
      startDegree: houseSignIndex * 30,
    };
  });
}

/**
 * Find which house a given longitude falls in.
 *
 * @param {number} lon — ecliptic longitude in degrees
 * @param {Array<{ house, startDegree }>} houses
 * @returns {number} house number (1-12)
 */
export function getHouseForLongitude(lon, houses) {
  if (!houses) return null;
  const normalized = ((lon % 360) + 360) % 360;
  for (const h of houses) {
    const start = h.startDegree;
    const end = (start + 30) % 360;
    if (start < end) {
      if (normalized >= start && normalized < end) return h.house;
    } else {
      if (normalized >= start || normalized < end) return h.house;
    }
  }
  return 1;
}

// ── Void-of-Course Moon ──────────────────────────────────────────────────────

const VOC_ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Sextile', angle: 60, orb: 6 },
  { name: 'Square', angle: 90, orb: 8 },
  { name: 'Trine', angle: 120, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
];

/**
 * Detect Void-of-Course Moon.
 * Steps forward in 2-hour increments from current date until Moon changes sign.
 * At each step, checks if Moon forms any new exact aspects to other planets.
 *
 * @param {Date} date
 * @returns {{ isVoid, lastAspect, signExitDate, hoursRemaining }}
 */
export function detectVoidOfCourseMoon(date) {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const currentPos = computePlanetCentricPositions('Earth', date);
  if (!currentPos.Moon) return { isVoid: false, lastAspect: null, signExitDate: null, hoursRemaining: null };

  const currentMoonSign = currentPos.Moon.sign;
  let lastAspect = null;
  let signExitDate = null;

  // Check current aspects first
  for (const [pName, pData] of Object.entries(currentPos)) {
    if (pName === 'Moon') continue;
    let sep = Math.abs(currentPos.Moon.longitude - pData.longitude);
    if (sep > 180) sep = 360 - sep;
    for (const asp of VOC_ASPECTS) {
      if (Math.abs(sep - asp.angle) <= asp.orb) {
        lastAspect = { planet: pName, aspect: asp.name, orb: +(Math.abs(sep - asp.angle)).toFixed(1) };
        break;
      }
    }
  }

  // Step forward to find sign change and any new exact aspects
  let foundNewAspect = false;
  for (let i = 1; i <= 36; i++) { // max ~72 hours (3 days, well past any sign transit)
    const futureDate = new Date(date.getTime() + i * TWO_HOURS_MS);
    const futurePos = computePlanetCentricPositions('Earth', futureDate);
    if (!futurePos.Moon) break;

    // Check if Moon has changed sign
    if (futurePos.Moon.sign !== currentMoonSign) {
      signExitDate = futureDate;
      break;
    }

    // Check for new exact aspects (orb < 1°)
    for (const [pName, pData] of Object.entries(futurePos)) {
      if (pName === 'Moon') continue;
      let sep = Math.abs(futurePos.Moon.longitude - pData.longitude);
      if (sep > 180) sep = 360 - sep;
      for (const asp of VOC_ASPECTS) {
        if (Math.abs(sep - asp.angle) < 1) {
          foundNewAspect = true;
          break;
        }
      }
      if (foundNewAspect) break;
    }
    if (foundNewAspect) break;
  }

  const isVoid = !foundNewAspect && signExitDate !== null;
  const hoursRemaining = signExitDate
    ? +((signExitDate.getTime() - date.getTime()) / (60 * 60 * 1000)).toFixed(1)
    : null;

  return { isVoid, lastAspect, signExitDate, hoursRemaining };
}

// ── Celestial Weather (date-only, no birth data) ─────────────────────────────

const CLASSICAL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/**
 * Compute the celestial weather for a given date — no birth data needed.
 * Returns the same structural shape as computeRecursiveReading for
 * geocentric, heliocentric, and perspectives fields.
 *
 * @param {Date} date
 * @returns {object} Weather data
 */
export function computeCelestialWeather(date) {
  const geoPositions = computePlanetCentricPositions('Earth', date);
  const geoAspects = computeAspects(geoPositions);
  const helioPositions = computePlanetCentricPositions('Sun', date);
  const helioAspects = computeAspects(helioPositions);

  const perspectives = {};
  for (const planet of CLASSICAL_PLANETS) {
    if (planet === 'Moon') {
      perspectives.Moon = { positions: geoPositions, aspects: geoAspects };
    } else if (planet === 'Sun') {
      perspectives.Sun = { positions: helioPositions, aspects: helioAspects };
    } else {
      const { positions, aspects } = getCarriedExperience(planet, date);
      perspectives[planet] = { positions, aspects };
    }
  }

  return {
    geocentric: { planets: geoPositions, aspects: geoAspects },
    heliocentric: { planets: helioPositions, aspects: helioAspects },
    perspectives,
    solarCycle: getSolarCyclePhase(date),
    lunarPhase: computeLunarPhase(geoPositions),
    retrogrades: detectRetrogrades(date),
    lunarNodes: computeLunarNodes(date),
    date,
  };
}

// ── Master function ──────────────────────────────────────────────────────────

/**
 * Compute the full recursive reading.
 *
 * @param {{ birthData: { year, month, day, hour?, minute? }, planets, aspects }} natalChart
 * @param {Date} [transitDate=new Date()]
 * @returns {object} Full recursive structure
 */
export function computeRecursiveReading(natalChart, transitDate = new Date()) {
  const { birthData, ascendant, midheaven, houses, timeMissing } = natalChart;
  const birthDate = new Date(
    birthData.year,
    birthData.month - 1,
    birthData.day,
    birthData.hour || 12,
    birthData.minute || 0,
  );

  // Geocentric: reuse the natal chart data directly (already computed server-side)
  const geocentric = {
    planets: natalChart.planets,
    aspects: natalChart.aspects,
  };

  // Heliocentric: compute Sun-centric positions at birth
  const helioPositions = computePlanetCentricPositions('Sun', birthDate);
  const helioAspects = computeAspects(helioPositions);
  const heliocentric = { planets: helioPositions, aspects: helioAspects };

  // Each planet's carried experience at birth
  const perspectives = {};
  for (const planet of CLASSICAL_PLANETS) {
    if (planet === 'Moon') {
      // Moon perspective = geocentric but focused on Moon's relationships
      const moonPositions = computePlanetCentricPositions('Earth', birthDate);
      const moonAspects = computeAspects(moonPositions);
      perspectives.Moon = { positions: moonPositions, aspects: moonAspects };
    } else if (planet === 'Sun') {
      // Sun perspective = heliocentric (already computed)
      perspectives.Sun = { positions: helioPositions, aspects: helioAspects };
    } else {
      const { positions, aspects } = getCarriedExperience(planet, birthDate);
      perspectives[planet] = { positions, aspects };
    }
  }

  // Shift analysis: what changes between geocentric and each perspective
  const shifts = {};
  for (const planet of CLASSICAL_PLANETS) {
    const persp = perspectives[planet];
    if (persp) {
      shifts[planet] = computeShiftAnalysis(geocentric.planets, persp.positions);
    }
  }
  shifts.heliocentric = computeShiftAnalysis(geocentric.planets, helioPositions);

  // Sidereal positions (heliocentric in sidereal frame)
  const siderealPositions = {};
  for (const [name, data] of Object.entries(helioPositions)) {
    siderealPositions[name] = lonToSiderealSign(data.longitude, birthDate);
  }

  // Solar cycle at birth and at transit date
  const solarCycle = getSolarCyclePhase(transitDate);
  const birthSolarCycle = getSolarCyclePhase(birthDate);

  // Lunar phase at birth
  const birthGeoPositions = computePlanetCentricPositions('Earth', birthDate);
  const lunarPhase = computeLunarPhase(birthGeoPositions);

  // Lunar nodes at birth and transit
  const birthLunarNodes = computeLunarNodes(birthDate);
  const transitLunarNodes = computeLunarNodes(transitDate);

  // Transit houses (if we have birth location for reference latitude/longitude)
  let transitAscendant = null;
  let transitMidheaven = null;
  let transitHouses = null;
  if (birthData.latitude != null && birthData.longitude != null) {
    const transitAscDeg = computeAscendant(transitDate, birthData.latitude, birthData.longitude);
    transitAscendant = lonToSign(transitAscDeg);
    const transitMcDeg = computeMidheaven(transitDate, birthData.longitude);
    transitMidheaven = lonToSign(transitMcDeg);
    transitHouses = computeWholeSignHouses(transitAscendant.signIndex);
  }

  return {
    geocentric,
    heliocentric,
    perspectives,
    shifts,
    siderealPositions,
    solarCycle,
    birthSolarCycle,
    lunarPhase,
    birthDate,
    transitDate,
    // House data (passed through from natal chart)
    ascendant: ascendant || null,
    midheaven: midheaven || null,
    houses: houses || null,
    timeMissing: timeMissing || false,
    // Lunar nodes
    birthLunarNodes,
    transitLunarNodes,
    // Transit houses
    transitAscendant,
    transitMidheaven,
    transitHouses,
  };
}

// ── Electromagnetic field computation ─────────────────────────────────────────

/**
 * Compute dipole orientation for a body in the ecliptic frame.
 *
 * @param {string} bodyKey — 'Sun', 'Earth', 'Jupiter', etc.
 * @param {Date} date — for solar cycle phase (Sun polarity flip)
 * @returns {{ angle: number|null, strength: number, type: string, flipped: boolean }}
 */
export function computeDipoleOrientation(bodyKey, date) {
  const physics = PLANETARY_PHYSICS[bodyKey];
  if (!physics) return { angle: null, strength: 0, type: FIELD_TYPES.NONE, flipped: false };

  const { magneticField, axialTilt } = physics;

  if (magneticField.type === FIELD_TYPES.NONE ||
      magneticField.type === FIELD_TYPES.RESIDUAL ||
      magneticField.type === FIELD_TYPES.INDUCED) {
    return {
      angle: null,
      strength: 0,
      type: magneticField.type,
      flipped: false,
    };
  }

  // Dipole angle in ecliptic frame = axialTilt + dipoleTilt offset
  const dipoleTilt = magneticField.dipoleTilt || 0;
  let angle = axialTilt + dipoleTilt;

  // For the Sun: check if we're past solar maximum (polarity flip)
  // Uses historical reversal dates when available
  let flipped = false;
  if (bodyKey === 'Sun') {
    const cycle = getSolarCyclePhase(date);
    // Flipped = past the midpoint of the observed reversal window
    const flipMid = (cycle.flipStart.getTime() + cycle.flipEnd.getTime()) / 2;
    if (date.getTime() > flipMid) {
      flipped = true;
      angle = angle + 180; // reversed polarity
    }
  }

  return {
    angle: angle % 360,
    strength: magneticField.surfaceStrength,
    type: magneticField.type,
    flipped,
  };
}

/**
 * Compute EM field topology for all visible bodies from an observer's perspective.
 *
 * @param {string} observerKey — 'Earth', 'Sun', 'Mars', etc.
 * @param {Date} date
 * @returns {Array<{ body, dipoleAngle, fieldStrength, fieldType, orbitRadius, eclipticLon }>}
 */
export function computeFieldTopology(observerKey, date) {
  const positions = computePlanetCentricPositions(observerKey, date);
  const allBodies = [observerKey, ...Object.keys(positions)];
  const results = [];

  for (const body of allBodies) {
    const dipole = computeDipoleOrientation(body, date);
    const orbitRadius = body === observerKey ? 0 : (ORBITAL_RADII_NORM[body] || 120);
    const eclipticLon = body === observerKey ? null : positions[body]?.longitude ?? null;

    results.push({
      body,
      dipoleAngle: dipole.angle,
      fieldStrength: dipole.strength,
      fieldType: dipole.type,
      orbitRadius,
      eclipticLon,
      flipped: dipole.flipped,
    });
  }

  return results;
}

// ── Secondary Progressions ───────────────────────────────────────────────────

/**
 * Compute secondary progressions.
 * Progressed date = birth date + (age in years) days.
 * Each day after birth corresponds to one year of life.
 *
 * @param {{ birthData: { year, month, day, hour?, minute? }, ascendant? }} natalChart
 * @param {Date} targetDate — the date to compute progressions for
 * @returns {{ progressedDate, age, positions, aspects, lunarPhase, nodes, progressedAscendant }}
 */
export function computeSecondaryProgressions(natalChart, targetDate) {
  const { birthData, ascendant } = natalChart;
  const birthDate = new Date(
    birthData.year,
    birthData.month - 1,
    birthData.day,
    birthData.hour || 12,
    birthData.minute || 0,
  );

  // Age in fractional years
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const age = (targetDate.getTime() - birthDate.getTime()) / msPerYear;
  if (age < 0) return null;

  // Progressed date: birth date + age days (day-for-a-year)
  const progressedDate = new Date(birthDate.getTime() + age * ONE_DAY_MS);

  // Compute geocentric positions at the progressed date
  const positions = computePlanetCentricPositions('Earth', progressedDate);
  const aspects = computeAspects(positions);
  const lunarPhase = computeLunarPhase(positions);
  const nodes = computeLunarNodes(progressedDate);

  // Solar Arc Ascendant: natal ASC + (progressed Sun - natal Sun)
  let progressedAscendant = null;
  if (ascendant && positions.Sun) {
    // Get natal Sun position
    const natalGeo = computePlanetCentricPositions('Earth', birthDate);
    const natalSunLon = natalGeo.Sun?.longitude || 0;
    const progressedSunLon = positions.Sun.longitude;
    let solarArc = progressedSunLon - natalSunLon;
    if (solarArc < 0) solarArc += 360;
    const progressedAscLon = ((ascendant.longitude + solarArc) % 360 + 360) % 360;
    progressedAscendant = lonToSign(progressedAscLon);
  }

  return {
    progressedDate,
    age: +age.toFixed(2),
    positions,
    aspects,
    lunarPhase,
    nodes,
    progressedAscendant,
  };
}

// ── Synastry ──────────────────────────────────────────────────────────────────

/**
 * Compute synastry between two natal charts.
 * Cross-aspects between chart1 and chart2 positions.
 *
 * @param {object} chart1 — natalChart object (with planets, houses, ascendant, etc.)
 * @param {object} chart2 — natalChart object
 * @returns {{ crossAspects, houseOverlays1, houseOverlays2 }}
 */
export function computeSynastry(chart1, chart2) {
  // Extract geocentric positions
  const pos1 = chart1.planets || {};
  const pos2 = chart2.planets || {};

  const map1 = Array.isArray(pos1)
    ? Object.fromEntries(pos1.map(p => [p.name, p]))
    : pos1;
  const map2 = Array.isArray(pos2)
    ? Object.fromEntries(pos2.map(p => [p.name, p]))
    : pos2;

  // Cross-aspects: every planet in chart1 vs every planet in chart2
  const crossAspects = [];
  for (const [name1, data1] of Object.entries(map1)) {
    for (const [name2, data2] of Object.entries(map2)) {
      let sep = Math.abs(data1.longitude - data2.longitude);
      if (sep > 180) sep = 360 - sep;

      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          crossAspects.push({
            planet1: name1,
            chart1Label: 'Person 1',
            planet2: name2,
            chart2Label: 'Person 2',
            aspect: aspect.name,
            orb: +orb.toFixed(1),
            exact: orb < 1,
          });
          break;
        }
      }
    }
  }

  crossAspects.sort((a, b) => a.orb - b.orb);

  // House overlays: where do chart2's planets fall in chart1's houses, and vice versa
  const houseOverlays1 = {}; // chart2 planets in chart1 houses
  const houseOverlays2 = {}; // chart1 planets in chart2 houses

  if (chart1.houses) {
    for (const [name, data] of Object.entries(map2)) {
      const house = getHouseForLongitude(data.longitude, chart1.houses);
      if (house) houseOverlays1[name] = house;
    }
  }
  if (chart2.houses) {
    for (const [name, data] of Object.entries(map1)) {
      const house = getHouseForLongitude(data.longitude, chart2.houses);
      if (house) houseOverlays2[name] = house;
    }
  }

  return { crossAspects, houseOverlays1, houseOverlays2 };
}

/**
 * Compute recursive synastry — how each planet sees the relationship
 * between two charts at a given date.
 *
 * @param {object} chart1 — natalChart object
 * @param {object} chart2 — natalChart object
 * @param {Date} date — current date for transit context
 * @returns {{ perspectives }}
 */
export function computeRecursiveSynastry(chart1, chart2, date) {
  const pos1 = chart1.planets || {};
  const pos2 = chart2.planets || {};

  const map1 = Array.isArray(pos1)
    ? Object.fromEntries(pos1.map(p => [p.name, p]))
    : pos1;
  const map2 = Array.isArray(pos2)
    ? Object.fromEntries(pos2.map(p => [p.name, p]))
    : pos2;

  const perspectives = {};

  for (const planet of CLASSICAL_PLANETS) {
    const p1 = map1[planet];
    const p2 = map2[planet];
    if (!p1 || !p2) continue;

    // How far apart is the same planet in two charts?
    let sep = Math.abs(p1.longitude - p2.longitude);
    if (sep > 180) sep = 360 - sep;

    // What aspect does the same planet form with itself?
    let selfAspect = null;
    for (const aspect of ASPECTS) {
      const orb = Math.abs(sep - aspect.angle);
      if (orb <= aspect.orb) {
        selfAspect = { aspect: aspect.name, orb: +orb.toFixed(1) };
        break;
      }
    }

    // Cross-aspects from this planet in chart1 to all planets in chart2
    const crossFromP1 = [];
    for (const [name2, data2] of Object.entries(map2)) {
      let s = Math.abs(p1.longitude - data2.longitude);
      if (s > 180) s = 360 - s;
      for (const asp of ASPECTS) {
        const o = Math.abs(s - asp.angle);
        if (o <= asp.orb) {
          crossFromP1.push({ target: name2, aspect: asp.name, orb: +o.toFixed(1) });
          break;
        }
      }
    }

    perspectives[planet] = {
      sign1: p1.sign,
      sign2: p2.sign,
      separation: +sep.toFixed(1),
      selfAspect,
      crossAspects: crossFromP1.sort((a, b) => a.orb - b.orb),
    };
  }

  return { perspectives };
}

export { SIGNS, ASPECTS, CLASSICAL_PLANETS, PLANET_BODIES, HELIO_BODIES, LUNAR_PHASES, ONE_DAY_MS };
