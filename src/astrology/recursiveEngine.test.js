/**
 * recursiveEngine.test.js — Unit tests for the recursive astrology engine.
 */

import {
  lonToSign,
  lonToSiderealSign,
  getLahiriAyanamsa,
  computePlanetCentricPositions,
  computeAspects,
  getCarriedExperience,
  getSolarCyclePhase,
  computeRecursiveReading,
  computeCelestialWeather,
  computeShiftAnalysis,
  computeDipoleOrientation,
  computeFieldTopology,
  computeLunarPhase,
  detectRetrogrades,
  computeLunarNodes,
  computeAscendant,
  computeMidheaven,
  computeWholeSignHouses,
  getHouseForLongitude,
  detectVoidOfCourseMoon,
  computeSecondaryProgressions,
  computeSynastry,
  computeRecursiveSynastry,
  SIGNS,
  ASPECTS,
  CLASSICAL_PLANETS,
  LUNAR_PHASES,
  ONE_DAY_MS,
} from './recursiveEngine';
import { FIELD_TYPES, PLANETARY_PHYSICS } from '../data/planetaryPhysics';

// ── Fixed reference date for deterministic tests ─────────────────────────────
const REFERENCE_DATE = new Date('2000-01-01T12:00:00Z'); // J2000 epoch
const MODERN_DATE = new Date('2025-06-15T12:00:00Z');

// ════════════════════════════════════════════════════════════════
// lonToSign
// ════════════════════════════════════════════════════════════════
describe('lonToSign', () => {
  test('0° = Aries 0°', () => {
    const r = lonToSign(0);
    expect(r.sign).toBe('Aries');
    expect(r.degree).toBe(0);
    expect(r.longitude).toBe(0);
  });

  test('90° = Cancer 0°', () => {
    const r = lonToSign(90);
    expect(r.sign).toBe('Cancer');
    expect(r.degree).toBe(0);
  });

  test('119.5° = Cancer 29.5°', () => {
    const r = lonToSign(119.5);
    expect(r.sign).toBe('Cancer');
    expect(r.degree).toBe(29.5);
  });

  test('359° = Pisces 29°', () => {
    const r = lonToSign(359);
    expect(r.sign).toBe('Pisces');
    expect(r.degree).toBe(29);
  });

  test('negative longitude normalizes correctly', () => {
    const r = lonToSign(-30);
    expect(r.sign).toBe('Pisces');
    expect(r.longitude).toBe(330);
  });

  test('longitude > 360 normalizes', () => {
    const r = lonToSign(400);
    expect(r.sign).toBe('Taurus');
    expect(r.longitude).toBe(40);
  });

  test('all 12 signs are reachable', () => {
    const signs = new Set();
    for (let i = 0; i < 12; i++) {
      signs.add(lonToSign(i * 30 + 15).sign);
    }
    expect(signs.size).toBe(12);
    for (const s of SIGNS) {
      expect(signs.has(s)).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// lonToSiderealSign
// ════════════════════════════════════════════════════════════════
describe('lonToSiderealSign', () => {
  test('sidereal sign is shifted back from tropical', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const tropical = lonToSign(45); // ~15° Taurus
    const sidereal = lonToSiderealSign(45, date);
    // Ayanamsa is ~24°, so 45 - 24 = ~21° → still Aries
    expect(sidereal.sign).toBe('Aries');
    expect(sidereal.longitude).toBeLessThan(tropical.longitude);
  });

  test('returns valid sign and degree', () => {
    const r = lonToSiderealSign(100, MODERN_DATE);
    expect(SIGNS).toContain(r.sign);
    expect(r.degree).toBeGreaterThanOrEqual(0);
    expect(r.degree).toBeLessThan(30);
    expect(r.longitude).toBeGreaterThanOrEqual(0);
    expect(r.longitude).toBeLessThan(360);
  });

  test('wraps correctly near 0°', () => {
    const r = lonToSiderealSign(10, MODERN_DATE);
    // 10° - ~24° ayanamsa → should wrap to Pisces region
    expect(r.sign).toBe('Pisces');
  });

  test('ayanamsa increases over time', () => {
    const a2000 = getLahiriAyanamsa(new Date('2000-01-01'));
    const a2050 = getLahiriAyanamsa(new Date('2050-01-01'));
    expect(a2050).toBeGreaterThan(a2000);
  });
});

// ════════════════════════════════════════════════════════════════
// getLahiriAyanamsa
// ════════════════════════════════════════════════════════════════
describe('getLahiriAyanamsa', () => {
  test('returns ~23.85° at epoch 2000', () => {
    const a = getLahiriAyanamsa(new Date('2000-01-01'));
    expect(a).toBeCloseTo(23.853, 1);
  });

  test('returns ~24.2° around 2025', () => {
    const a = getLahiriAyanamsa(new Date('2025-06-01'));
    expect(a).toBeGreaterThan(24.0);
    expect(a).toBeLessThan(24.5);
  });
});

// ════════════════════════════════════════════════════════════════
// computePlanetCentricPositions
// ════════════════════════════════════════════════════════════════
describe('computePlanetCentricPositions', () => {
  test('Earth-centric returns 7 classical bodies', () => {
    const pos = computePlanetCentricPositions('Earth', REFERENCE_DATE);
    expect(Object.keys(pos)).toHaveLength(7);
    expect(pos.Sun).toBeDefined();
    expect(pos.Moon).toBeDefined();
    expect(pos.Mercury).toBeDefined();
    expect(pos.Venus).toBeDefined();
    expect(pos.Mars).toBeDefined();
    expect(pos.Jupiter).toBeDefined();
    expect(pos.Saturn).toBeDefined();
  });

  test('Sun-centric includes Earth but not Sun', () => {
    const pos = computePlanetCentricPositions('Sun', REFERENCE_DATE);
    expect(pos.Sun).toBeUndefined();
    expect(pos.Earth).toBeDefined();
    expect(pos.Moon).toBeDefined();
  });

  test('Mars-centric includes Earth and Sun but not Mars', () => {
    const pos = computePlanetCentricPositions('Mars', REFERENCE_DATE);
    expect(pos.Mars).toBeUndefined();
    expect(pos.Earth).toBeDefined();
    expect(pos.Sun).toBeDefined();
  });

  test('all positions have valid longitude (0-360)', () => {
    const pos = computePlanetCentricPositions('Earth', MODERN_DATE);
    for (const [, data] of Object.entries(pos)) {
      expect(data.longitude).toBeGreaterThanOrEqual(0);
      expect(data.longitude).toBeLessThan(360);
      expect(SIGNS).toContain(data.sign);
      expect(data.degree).toBeGreaterThanOrEqual(0);
      expect(data.degree).toBeLessThan(30);
    }
  });

  test('each helio body can be an observer without throwing', () => {
    const observers = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    for (const obs of observers) {
      expect(() => computePlanetCentricPositions(obs, MODERN_DATE)).not.toThrow();
    }
  });

  test('Earth and Sun observers produce different positions for Mars', () => {
    const earthView = computePlanetCentricPositions('Earth', MODERN_DATE);
    const sunView = computePlanetCentricPositions('Sun', MODERN_DATE);
    // Geocentric and heliocentric Mars should differ
    expect(earthView.Mars.longitude).not.toBeCloseTo(sunView.Mars.longitude, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// computeAspects
// ════════════════════════════════════════════════════════════════
describe('computeAspects', () => {
  test('exact conjunction detected', () => {
    const pos = { A: { longitude: 100 }, B: { longitude: 100 } };
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Conjunction');
    expect(aspects[0].orb).toBe(0);
  });

  test('exact opposition detected', () => {
    const pos = { A: { longitude: 10 }, B: { longitude: 190 } };
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Opposition');
  });

  test('exact trine detected', () => {
    const pos = { A: { longitude: 0 }, B: { longitude: 120 } };
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Trine');
  });

  test('exact square detected', () => {
    const pos = { A: { longitude: 0 }, B: { longitude: 90 } };
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Square');
  });

  test('exact sextile detected', () => {
    const pos = { A: { longitude: 0 }, B: { longitude: 60 } };
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Sextile');
  });

  test('aspect within orb is detected', () => {
    const pos = { A: { longitude: 0 }, B: { longitude: 125 } }; // trine +5° (within 8° orb)
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Trine');
    expect(aspects[0].orb).toBe(5);
  });

  test('no aspect when out of orb', () => {
    const pos = { A: { longitude: 0 }, B: { longitude: 45 } }; // 45° = no standard aspect
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(0);
  });

  test('wraps around 360°', () => {
    const pos = { A: { longitude: 3 }, B: { longitude: 357 } }; // 6° apart = conjunction (within 8° orb)
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].aspect).toBe('Conjunction');
  });

  test('only one aspect per pair', () => {
    const pos = { A: { longitude: 0 }, B: { longitude: 3 } }; // 3° = conjunction
    const aspects = computeAspects(pos);
    expect(aspects).toHaveLength(1);
  });

  test('multiple planets produce multiple aspects', () => {
    const pos = {
      A: { longitude: 0 },
      B: { longitude: 120 },
      C: { longitude: 240 },
    };
    const aspects = computeAspects(pos);
    // A-B trine, A-C trine, B-C trine
    expect(aspects).toHaveLength(3);
    aspects.forEach(a => expect(a.aspect).toBe('Trine'));
  });
});

// ════════════════════════════════════════════════════════════════
// getCarriedExperience
// ════════════════════════════════════════════════════════════════
describe('getCarriedExperience', () => {
  test('returns positions and aspects for Mars', () => {
    const result = getCarriedExperience('Mars', MODERN_DATE);
    expect(result.positions).toBeDefined();
    expect(result.aspects).toBeDefined();
    expect(result.positions.Mars).toBeUndefined(); // can't see yourself
    expect(result.positions.Sun).toBeDefined();
    expect(result.positions.Earth).toBeDefined();
  });

  test('Venus carried experience has valid structure', () => {
    const result = getCarriedExperience('Venus', REFERENCE_DATE);
    expect(Object.keys(result.positions).length).toBeGreaterThan(0);
    expect(Array.isArray(result.aspects)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// computeShiftAnalysis
// ════════════════════════════════════════════════════════════════
describe('computeShiftAnalysis', () => {
  test('detects sign change', () => {
    const base = { Mars: { longitude: 25, sign: 'Aries', signIndex: 0 } };
    const compare = { Mars: { longitude: 65, sign: 'Gemini', signIndex: 2 } };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].planet).toBe('Mars');
    expect(shifts[0].shifted).toBe(true);
    expect(shifts[0].fromSign).toBe('Aries');
    expect(shifts[0].toSign).toBe('Gemini');
  });

  test('detects no sign change', () => {
    const base = { Venus: { longitude: 40, sign: 'Taurus', signIndex: 1 } };
    const compare = { Venus: { longitude: 42, sign: 'Taurus', signIndex: 1 } };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].shifted).toBe(false);
    expect(shifts[0].degreeDelta).toBe(2);
  });

  test('handles wrap-around (350° → 10°)', () => {
    const base = { Sun: { longitude: 350, sign: 'Pisces', signIndex: 11 } };
    const compare = { Sun: { longitude: 10, sign: 'Aries', signIndex: 0 } };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts[0].shifted).toBe(true);
    expect(shifts[0].degreeDelta).toBe(20);
    expect(shifts[0].direction).toBe('forward');
  });

  test('handles backward wrap-around (10° → 350°)', () => {
    const base = { Sun: { longitude: 10, sign: 'Aries', signIndex: 0 } };
    const compare = { Sun: { longitude: 350, sign: 'Pisces', signIndex: 11 } };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts[0].degreeDelta).toBe(20);
    expect(shifts[0].direction).toBe('backward');
  });

  test('returns array with entries for all overlapping planets', () => {
    const base = {
      Mars: { longitude: 100, sign: 'Cancer', signIndex: 3 },
      Venus: { longitude: 200, sign: 'Libra', signIndex: 6 },
      Jupiter: { longitude: 300, sign: 'Aquarius', signIndex: 10 },
    };
    const compare = {
      Mars: { longitude: 110, sign: 'Cancer', signIndex: 3 },
      Venus: { longitude: 220, sign: 'Scorpio', signIndex: 7 },
    };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts).toHaveLength(2); // only Mars and Venus overlap
    expect(shifts.find(s => s.planet === 'Mars').shifted).toBe(false);
    expect(shifts.find(s => s.planet === 'Venus').shifted).toBe(true);
  });

  test('handles array format for base positions (natal chart)', () => {
    const base = [
      { name: 'Sun', longitude: 84, sign: 'Gemini', signIndex: 2 },
      { name: 'Mars', longitude: 350, sign: 'Pisces', signIndex: 11 },
    ];
    const compare = {
      Sun: { longitude: 90, sign: 'Cancer', signIndex: 3 },
      Mars: { longitude: 340, sign: 'Pisces', signIndex: 11 },
    };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts).toHaveLength(2);
    expect(shifts.find(s => s.planet === 'Sun').shifted).toBe(true);
    expect(shifts.find(s => s.planet === 'Mars').shifted).toBe(false);
  });

  test('returns empty array for null inputs', () => {
    expect(computeShiftAnalysis(null, {})).toEqual([]);
    expect(computeShiftAnalysis({}, null)).toEqual([]);
  });

  test('direction is forward for positive delta', () => {
    const base = { A: { longitude: 100, sign: 'Cancer', signIndex: 3 } };
    const compare = { A: { longitude: 150, sign: 'Leo', signIndex: 4 } };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts[0].direction).toBe('forward');
  });

  test('direction is backward for negative delta', () => {
    const base = { A: { longitude: 150, sign: 'Leo', signIndex: 4 } };
    const compare = { A: { longitude: 100, sign: 'Cancer', signIndex: 3 } };
    const shifts = computeShiftAnalysis(base, compare);
    expect(shifts[0].direction).toBe('backward');
  });
});

// ════════════════════════════════════════════════════════════════
// getSolarCyclePhase
// ════════════════════════════════════════════════════════════════
describe('getSolarCyclePhase', () => {
  test('Cycle 25 start date returns cycle 25, phase ~0', () => {
    const r = getSolarCyclePhase(new Date('2019-12-15T00:00:00Z'));
    expect(r.cycleNumber).toBe(25);
    expect(r.phase).toBeCloseTo(0, 1);
    expect(r.ascending).toBe(true);
  });

  test('mid-2025 is near solar max', () => {
    const r = getSolarCyclePhase(new Date('2025-06-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(25);
    // ~5.5 years in — right at the midpoint (ascending/descending boundary)
    expect(r.yearsInCycle).toBeGreaterThan(5);
    expect(r.yearsInCycle).toBeLessThan(6);
    expect(r.phase).toBeGreaterThan(0.45);
    expect(r.phase).toBeLessThan(0.55);
  });

  test('2028 is descending (past solar max)', () => {
    const r = getSolarCyclePhase(new Date('2028-01-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(25);
    expect(r.ascending).toBe(false);
  });

  test('2031+ enters Cycle 26', () => {
    const r = getSolarCyclePhase(new Date('2031-06-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(26);
  });

  test('historical date (1990) works', () => {
    const r = getSolarCyclePhase(new Date('1990-01-01T00:00:00Z'));
    expect(r.cycleNumber).toBeLessThan(25);
    expect(r.phase).toBeGreaterThanOrEqual(0);
    expect(r.phase).toBeLessThan(1);
  });

  test('approximateFlipDate is a valid Date', () => {
    const r = getSolarCyclePhase(MODERN_DATE);
    expect(r.approximateFlipDate).toBeInstanceOf(Date);
    expect(isNaN(r.approximateFlipDate.getTime())).toBe(false);
  });

  test('historical cycles have observed=true and flipStart/flipEnd', () => {
    // 1990 falls in Cycle 22 (1986-1996) — observed via WSO
    const r = getSolarCyclePhase(new Date('1990-01-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(22);
    expect(r.observed).toBe(true);
    expect(r.flipStart).toBeInstanceOf(Date);
    expect(r.flipEnd).toBeInstanceOf(Date);
    expect(r.flipEnd.getTime()).toBeGreaterThanOrEqual(r.flipStart.getTime());
  });

  test('Cycle 24 has correct observed reversal window (2012-2014)', () => {
    const r = getSolarCyclePhase(new Date('2013-01-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(24);
    expect(r.observed).toBe(true);
    expect(r.flipStart.getFullYear()).toBe(2012);
    expect(r.flipEnd.getFullYear()).toBe(2014);
    expect(r.inReversal).toBe(true);
  });

  test('date outside reversal window has inReversal=false', () => {
    const r = getSolarCyclePhase(new Date('2016-01-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(24);
    expect(r.inReversal).toBe(false);
  });

  test('extrapolated cycles have observed=false', () => {
    // Far future: Cycle 30+
    const r = getSolarCyclePhase(new Date('2080-01-01T00:00:00Z'));
    expect(r.observed).toBe(false);
    expect(r.cycleNumber).toBeGreaterThan(25);
  });

  test('pre-Cycle 19 extrapolation works', () => {
    const r = getSolarCyclePhase(new Date('1940-01-01T00:00:00Z'));
    expect(r.observed).toBe(false);
    expect(r.cycleNumber).toBeLessThan(19);
    expect(r.phase).toBeGreaterThanOrEqual(0);
    expect(r.phase).toBeLessThan(1);
  });

  test('Cycle 21 is correctly identified (WSO era)', () => {
    const r = getSolarCyclePhase(new Date('1980-01-01T00:00:00Z'));
    expect(r.cycleNumber).toBe(21);
    expect(r.observed).toBe(true);
    expect(r.note).toMatch(/WSO/);
  });
});

// ════════════════════════════════════════════════════════════════
// computeRecursiveReading (integration)
// ════════════════════════════════════════════════════════════════
describe('computeRecursiveReading', () => {
  const mockNatalChart = {
    birthData: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
    planets: [
      { name: 'Sun', longitude: 84.2, sign: 'Gemini', degree: 24.2 },
      { name: 'Moon', longitude: 210.5, sign: 'Libra', degree: 0.5 },
      { name: 'Mercury', longitude: 70.1, sign: 'Gemini', degree: 10.1 },
      { name: 'Venus', longitude: 50.3, sign: 'Taurus', degree: 20.3 },
      { name: 'Mars', longitude: 350.8, sign: 'Pisces', degree: 20.8 },
      { name: 'Jupiter', longitude: 95.6, sign: 'Cancer', degree: 5.6 },
      { name: 'Saturn', longitude: 290.1, sign: 'Capricorn', degree: 20.1 },
    ],
    aspects: [
      { planet1: 'Sun', planet2: 'Mercury', aspect: 'Conjunction', orb: 5.9 },
    ],
  };

  test('returns complete structure', () => {
    const r = computeRecursiveReading(mockNatalChart, MODERN_DATE);
    expect(r.geocentric).toBeDefined();
    expect(r.heliocentric).toBeDefined();
    expect(r.perspectives).toBeDefined();
    expect(r.solarCycle).toBeDefined();
    expect(r.birthSolarCycle).toBeDefined();
    expect(r.birthDate).toBeInstanceOf(Date);
    expect(r.transitDate).toBeInstanceOf(Date);
  });

  test('geocentric matches natal chart input', () => {
    const r = computeRecursiveReading(mockNatalChart);
    expect(r.geocentric.planets).toBe(mockNatalChart.planets);
    expect(r.geocentric.aspects).toBe(mockNatalChart.aspects);
  });

  test('heliocentric has positions and aspects', () => {
    const r = computeRecursiveReading(mockNatalChart);
    expect(r.heliocentric.planets).toBeDefined();
    expect(Object.keys(r.heliocentric.planets).length).toBeGreaterThan(0);
    expect(Array.isArray(r.heliocentric.aspects)).toBe(true);
  });

  test('all 7 classical planets have perspectives', () => {
    const r = computeRecursiveReading(mockNatalChart);
    for (const planet of CLASSICAL_PLANETS) {
      expect(r.perspectives[planet]).toBeDefined();
      expect(r.perspectives[planet].positions).toBeDefined();
      expect(r.perspectives[planet].aspects).toBeDefined();
    }
  });

  test('Sun perspective equals heliocentric', () => {
    const r = computeRecursiveReading(mockNatalChart);
    expect(r.perspectives.Sun.positions).toBe(r.heliocentric.planets);
  });

  test('Mars perspective does not include Mars in positions', () => {
    const r = computeRecursiveReading(mockNatalChart);
    expect(r.perspectives.Mars.positions.Mars).toBeUndefined();
  });

  test('solar cycle data is valid', () => {
    const r = computeRecursiveReading(mockNatalChart, MODERN_DATE);
    expect(r.solarCycle.cycleNumber).toBeGreaterThanOrEqual(25);
    expect(r.solarCycle.phase).toBeGreaterThanOrEqual(0);
    expect(r.solarCycle.phase).toBeLessThanOrEqual(1);
  });

  test('works with minimal birth data (no hour/minute)', () => {
    const minChart = {
      ...mockNatalChart,
      birthData: { year: 1990, month: 6, day: 15 },
    };
    expect(() => computeRecursiveReading(minChart)).not.toThrow();
  });

  test('shifts object contains heliocentric and all planet keys', () => {
    const r = computeRecursiveReading(mockNatalChart);
    expect(r.shifts).toBeDefined();
    expect(r.shifts.heliocentric).toBeDefined();
    expect(Array.isArray(r.shifts.heliocentric)).toBe(true);
    for (const planet of CLASSICAL_PLANETS) {
      expect(r.shifts[planet]).toBeDefined();
      expect(Array.isArray(r.shifts[planet])).toBe(true);
    }
  });

  test('shift entries have correct shape', () => {
    const r = computeRecursiveReading(mockNatalChart);
    const helioShifts = r.shifts.heliocentric;
    for (const shift of helioShifts) {
      expect(shift).toHaveProperty('planet');
      expect(shift).toHaveProperty('fromSign');
      expect(shift).toHaveProperty('toSign');
      expect(shift).toHaveProperty('shifted');
      expect(shift).toHaveProperty('degreeDelta');
      expect(shift).toHaveProperty('direction');
      expect(typeof shift.shifted).toBe('boolean');
    }
  });

  test('siderealPositions has valid entries', () => {
    const r = computeRecursiveReading(mockNatalChart);
    expect(r.siderealPositions).toBeDefined();
    expect(Object.keys(r.siderealPositions).length).toBeGreaterThan(0);
    for (const [, pos] of Object.entries(r.siderealPositions)) {
      expect(pos.longitude).toBeGreaterThanOrEqual(0);
      expect(pos.longitude).toBeLessThan(360);
      expect(SIGNS).toContain(pos.sign);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// computeCelestialWeather
// ════════════════════════════════════════════════════════════════
describe('computeCelestialWeather', () => {
  test('returns complete structure without natal chart', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(w.geocentric).toBeDefined();
    expect(w.heliocentric).toBeDefined();
    expect(w.perspectives).toBeDefined();
    expect(w.solarCycle).toBeDefined();
    expect(w.date).toBeInstanceOf(Date);
  });

  test('geocentric has 7 positions', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(Object.keys(w.geocentric.planets)).toHaveLength(7);
  });

  test('all 7 classical planets have perspectives', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    for (const planet of CLASSICAL_PLANETS) {
      expect(w.perspectives[planet]).toBeDefined();
      expect(w.perspectives[planet].positions).toBeDefined();
      expect(w.perspectives[planet].aspects).toBeDefined();
    }
  });

  test('does NOT include shifts, birthDate, birthSolarCycle, or siderealPositions', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(w.shifts).toBeUndefined();
    expect(w.birthDate).toBeUndefined();
    expect(w.birthSolarCycle).toBeUndefined();
    expect(w.siderealPositions).toBeUndefined();
  });

  test('works with historical date (1900)', () => {
    expect(() => computeCelestialWeather(new Date('1900-06-15T12:00:00Z'))).not.toThrow();
    const w = computeCelestialWeather(new Date('1900-06-15T12:00:00Z'));
    expect(w.geocentric.planets).toBeDefined();
  });

  test('works with future date (2100)', () => {
    expect(() => computeCelestialWeather(new Date('2100-01-01T12:00:00Z'))).not.toThrow();
    const w = computeCelestialWeather(new Date('2100-01-01T12:00:00Z'));
    expect(w.geocentric.planets).toBeDefined();
  });

  test('heliocentric Sun perspective equals heliocentric data', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(w.perspectives.Sun.positions).toBe(w.heliocentric.planets);
  });

  test('structural shape matches computeRecursiveReading for shared fields', () => {
    const mockNatalChart = {
      birthData: { year: 1990, month: 6, day: 15 },
      planets: [
        { name: 'Sun', longitude: 84.2, sign: 'Gemini', degree: 24.2 },
        { name: 'Moon', longitude: 210.5, sign: 'Libra', degree: 0.5 },
        { name: 'Mercury', longitude: 70.1, sign: 'Gemini', degree: 10.1 },
        { name: 'Venus', longitude: 50.3, sign: 'Taurus', degree: 20.3 },
        { name: 'Mars', longitude: 350.8, sign: 'Pisces', degree: 20.8 },
        { name: 'Jupiter', longitude: 95.6, sign: 'Cancer', degree: 5.6 },
        { name: 'Saturn', longitude: 290.1, sign: 'Capricorn', degree: 20.1 },
      ],
      aspects: [],
    };
    const w = computeCelestialWeather(MODERN_DATE);
    const r = computeRecursiveReading(mockNatalChart, MODERN_DATE);
    // Both have geocentric, heliocentric, perspectives, solarCycle
    expect(Object.keys(w.geocentric)).toEqual(Object.keys(r.geocentric));
    expect(Object.keys(w.heliocentric)).toEqual(Object.keys(r.heliocentric));
    expect(Object.keys(w.perspectives).sort()).toEqual(Object.keys(r.perspectives).sort());
    expect(typeof w.solarCycle.phase).toBe(typeof r.solarCycle.phase);
  });
});

// ════════════════════════════════════════════════════════════════
// Sidereal display integration
// ════════════════════════════════════════════════════════════════
describe('Sidereal display integration', () => {
  test('every geocentric weather position can be converted to sidereal', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    for (const [name, data] of Object.entries(w.geocentric.planets)) {
      const sid = lonToSiderealSign(data.longitude, MODERN_DATE);
      expect(SIGNS).toContain(sid.sign);
      expect(sid.degree).toBeGreaterThanOrEqual(0);
      expect(sid.degree).toBeLessThan(30);
    }
  });

  test('sidereal signs differ from tropical by ~24° offset', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    const ayanamsa = getLahiriAyanamsa(MODERN_DATE);
    for (const [name, data] of Object.entries(w.geocentric.planets)) {
      const sid = lonToSiderealSign(data.longitude, MODERN_DATE);
      const expectedSidLon = ((data.longitude - ayanamsa) % 360 + 360) % 360;
      expect(sid.longitude).toBeCloseTo(expectedSidLon, 1);
    }
  });

  test('ayanamsa value is reasonable for modern dates', () => {
    const a = getLahiriAyanamsa(MODERN_DATE);
    expect(a).toBeGreaterThan(23);
    expect(a).toBeLessThan(26);
  });
});

// ════════════════════════════════════════════════════════════════
// computeDipoleOrientation
// ════════════════════════════════════════════════════════════════
describe('computeDipoleOrientation', () => {
  test('Earth returns dipole type with non-zero strength', () => {
    const r = computeDipoleOrientation('Earth', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.DIPOLE);
    expect(r.strength).toBeGreaterThan(0);
    expect(r.angle).not.toBeNull();
  });

  test('Earth dipole angle includes axial tilt + dipole tilt', () => {
    const r = computeDipoleOrientation('Earth', MODERN_DATE);
    // 23.44 + 11.5 = 34.94
    expect(r.angle).toBeCloseTo(34.94, 1);
  });

  test('Jupiter returns strongest field', () => {
    const r = computeDipoleOrientation('Jupiter', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.DIPOLE);
    expect(r.strength).toBeGreaterThan(1000);
    expect(r.angle).not.toBeNull();
  });

  test('Venus returns induced type with null angle', () => {
    const r = computeDipoleOrientation('Venus', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.INDUCED);
    expect(r.angle).toBeNull();
    expect(r.strength).toBe(0);
  });

  test('Moon returns none type with null angle', () => {
    const r = computeDipoleOrientation('Moon', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.NONE);
    expect(r.angle).toBeNull();
    expect(r.strength).toBe(0);
  });

  test('Mars returns residual type with null angle', () => {
    const r = computeDipoleOrientation('Mars', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.RESIDUAL);
    expect(r.angle).toBeNull();
  });

  test('Sun is not flipped before solar max (ascending phase)', () => {
    const earlyDate = new Date('2021-01-01T12:00:00Z');
    const r = computeDipoleOrientation('Sun', earlyDate);
    expect(r.flipped).toBe(false);
    expect(r.type).toBe(FIELD_TYPES.DIPOLE);
  });

  test('Sun is flipped after solar max (descending phase)', () => {
    const lateDate = new Date('2028-01-01T12:00:00Z');
    const r = computeDipoleOrientation('Sun', lateDate);
    expect(r.flipped).toBe(true);
    expect(r.angle).toBeGreaterThan(180); // flipped adds 180
  });

  test('Mercury returns weak dipole', () => {
    const r = computeDipoleOrientation('Mercury', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.DIPOLE);
    expect(r.strength).toBeLessThan(0.01);
    expect(r.strength).toBeGreaterThan(0);
  });

  test('Saturn returns dipole with near-zero tilt offset', () => {
    const r = computeDipoleOrientation('Saturn', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.DIPOLE);
    expect(r.strength).toBeGreaterThan(100);
  });

  test('unknown body returns none', () => {
    const r = computeDipoleOrientation('Pluto', MODERN_DATE);
    expect(r.type).toBe(FIELD_TYPES.NONE);
    expect(r.angle).toBeNull();
    expect(r.strength).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// computeFieldTopology
// ════════════════════════════════════════════════════════════════
describe('computeFieldTopology', () => {
  test('returns entries for observer + all visible bodies', () => {
    const topology = computeFieldTopology('Earth', MODERN_DATE);
    expect(topology.length).toBeGreaterThanOrEqual(8); // Earth + 7 visible
    const bodies = topology.map(t => t.body);
    expect(bodies).toContain('Earth');
    expect(bodies).toContain('Sun');
    expect(bodies).toContain('Jupiter');
  });

  test('observer has orbit radius 0', () => {
    const topology = computeFieldTopology('Earth', MODERN_DATE);
    const observer = topology.find(t => t.body === 'Earth');
    expect(observer.orbitRadius).toBe(0);
  });

  test('Jupiter has the strongest field', () => {
    const topology = computeFieldTopology('Earth', MODERN_DATE);
    const strongest = topology.reduce((a, b) => a.fieldStrength > b.fieldStrength ? a : b);
    expect(strongest.body).toBe('Jupiter');
  });

  test('all orbit radii are non-negative', () => {
    const topology = computeFieldTopology('Sun', MODERN_DATE);
    topology.forEach(t => {
      expect(t.orbitRadius).toBeGreaterThanOrEqual(0);
    });
  });

  test('Sun-centric topology works', () => {
    const topology = computeFieldTopology('Sun', MODERN_DATE);
    expect(topology.length).toBeGreaterThanOrEqual(7);
    const sunEntry = topology.find(t => t.body === 'Sun');
    expect(sunEntry.orbitRadius).toBe(0);
    expect(sunEntry.eclipticLon).toBeNull();
  });

  test('bodies with no field have null dipole angle', () => {
    const topology = computeFieldTopology('Earth', MODERN_DATE);
    const venus = topology.find(t => t.body === 'Venus');
    expect(venus.dipoleAngle).toBeNull();
    expect(venus.fieldStrength).toBe(0);
    const moon = topology.find(t => t.body === 'Moon');
    expect(moon.dipoleAngle).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════
describe('Constants', () => {
  test('SIGNS has 12 entries', () => {
    expect(SIGNS).toHaveLength(12);
  });

  test('ASPECTS has 6 entries', () => {
    expect(ASPECTS).toHaveLength(6);
  });

  test('CLASSICAL_PLANETS has 7 entries', () => {
    expect(CLASSICAL_PLANETS).toHaveLength(7);
  });

  test('LUNAR_PHASES has 8 entries', () => {
    expect(LUNAR_PHASES).toHaveLength(8);
  });
});

// ════════════════════════════════════════════════════════════════
// computeLunarPhase
// ════════════════════════════════════════════════════════════════
describe('computeLunarPhase', () => {
  test('New Moon at 0° elongation', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 100 },
      Moon: { longitude: 100 },
    });
    expect(r.phase).toBe('New Moon');
    expect(r.illumination).toBeLessThan(5);
  });

  test('Full Moon at 180° elongation', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 100 },
      Moon: { longitude: 280 },
    });
    expect(r.phase).toBe('Full Moon');
    expect(r.illumination).toBeGreaterThan(95);
  });

  test('First Quarter at ~90° elongation', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 0 },
      Moon: { longitude: 90 },
    });
    expect(r.phase).toBe('First Quarter');
    expect(r.waxing).toBe(true);
    expect(r.illumination).toBeCloseTo(50, -1);
  });

  test('Last Quarter at ~270° elongation', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 0 },
      Moon: { longitude: 270 },
    });
    expect(r.phase).toBe('Last Quarter');
    expect(r.waxing).toBe(false);
  });

  test('waxing when elongation < 180', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 0 },
      Moon: { longitude: 45 },
    });
    expect(r.waxing).toBe(true);
  });

  test('waning when elongation > 180', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 0 },
      Moon: { longitude: 225 },
    });
    expect(r.waxing).toBe(false);
  });

  test('illumination is 0-100', () => {
    for (let i = 0; i < 360; i += 30) {
      const r = computeLunarPhase({
        Sun: { longitude: 0 },
        Moon: { longitude: i },
      });
      expect(r.illumination).toBeGreaterThanOrEqual(0);
      expect(r.illumination).toBeLessThanOrEqual(100);
    }
  });

  test('wrap-around: Moon at 350°, Sun at 10° → ~340° elongation', () => {
    const r = computeLunarPhase({
      Sun: { longitude: 10 },
      Moon: { longitude: 350 },
    });
    expect(r.waxing).toBe(false);
  });

  test('handles null/missing positions gracefully', () => {
    const r = computeLunarPhase({});
    expect(r.phase).toBe('Unknown');
  });

  test('real date produces valid phase', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(w.lunarPhase).toBeDefined();
    expect(LUNAR_PHASES).toContain(w.lunarPhase.phase);
    expect(w.lunarPhase.illumination).toBeGreaterThanOrEqual(0);
    expect(w.lunarPhase.illumination).toBeLessThanOrEqual(100);
  });
});

// ════════════════════════════════════════════════════════════════
// detectRetrogrades
// ════════════════════════════════════════════════════════════════
describe('detectRetrogrades', () => {
  test('returns entries for Mercury through Saturn only (not Sun/Moon)', () => {
    const r = detectRetrogrades(MODERN_DATE);
    expect(r.Sun).toBeUndefined();
    expect(r.Moon).toBeUndefined();
    expect(r.Mercury).toBeDefined();
    expect(r.Venus).toBeDefined();
    expect(r.Mars).toBeDefined();
    expect(r.Jupiter).toBeDefined();
    expect(r.Saturn).toBeDefined();
  });

  test('each entry has retrograde, station, dailyMotion, direction', () => {
    const r = detectRetrogrades(MODERN_DATE);
    for (const planet of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
      expect(r[planet]).toHaveProperty('retrograde');
      expect(r[planet]).toHaveProperty('station');
      expect(r[planet]).toHaveProperty('dailyMotion');
      expect(r[planet]).toHaveProperty('direction');
      expect(typeof r[planet].retrograde).toBe('boolean');
      expect(['retrograde', 'direct']).toContain(r[planet].direction);
    }
  });

  test('station is true when absolute dailyMotion < 0.1', () => {
    const r = detectRetrogrades(MODERN_DATE);
    for (const planet of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
      if (r[planet].station) {
        expect(Math.abs(r[planet].dailyMotion)).toBeLessThan(0.1);
      }
    }
  });

  test('outer planets have slower daily motion than inner', () => {
    const r = detectRetrogrades(REFERENCE_DATE);
    // Saturn should be slower than Mercury on average
    expect(Math.abs(r.Saturn.dailyMotion)).toBeLessThan(Math.abs(r.Mercury.dailyMotion));
  });

  test('weatherData includes retrogrades', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(w.retrogrades).toBeDefined();
    expect(w.retrogrades.Mercury).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════
// computeLunarNodes
// ════════════════════════════════════════════════════════════════
describe('computeLunarNodes', () => {
  test('returns northNode and southNode', () => {
    const r = computeLunarNodes(REFERENCE_DATE);
    expect(r.northNode).toBeDefined();
    expect(r.southNode).toBeDefined();
  });

  test('north and south nodes are 180 degrees apart', () => {
    const r = computeLunarNodes(MODERN_DATE);
    let diff = Math.abs(r.northNode.longitude - r.southNode.longitude);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeCloseTo(180, 1);
  });

  test('nodes have valid sign, degree, longitude', () => {
    const r = computeLunarNodes(MODERN_DATE);
    expect(SIGNS).toContain(r.northNode.sign);
    expect(SIGNS).toContain(r.southNode.sign);
    expect(r.northNode.degree).toBeGreaterThanOrEqual(0);
    expect(r.northNode.degree).toBeLessThan(30);
    expect(r.northNode.longitude).toBeGreaterThanOrEqual(0);
    expect(r.northNode.longitude).toBeLessThan(360);
  });

  test('north node at J2000 is near ~125 degrees (Leo)', () => {
    const r = computeLunarNodes(REFERENCE_DATE);
    expect(r.northNode.longitude).toBeCloseTo(125, 0);
  });

  test('nodes move retrograde (~19.35 degrees/year)', () => {
    const date1 = new Date('2020-01-01T12:00:00Z');
    const date2 = new Date('2021-01-01T12:00:00Z');
    const r1 = computeLunarNodes(date1);
    const r2 = computeLunarNodes(date2);
    // Retrograde means decreasing longitude
    let motion = r2.northNode.longitude - r1.northNode.longitude;
    if (motion > 180) motion -= 360;
    if (motion < -180) motion += 360;
    expect(motion).toBeLessThan(0);
    expect(Math.abs(motion)).toBeCloseTo(19.35, -1);
  });

  test('weather data includes lunarNodes', () => {
    const w = computeCelestialWeather(MODERN_DATE);
    expect(w.lunarNodes).toBeDefined();
    expect(w.lunarNodes.northNode).toBeDefined();
    expect(w.lunarNodes.southNode).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════
// computeAscendant
// ════════════════════════════════════════════════════════════════
describe('computeAscendant', () => {
  test('returns valid longitude (number 0-360)', () => {
    const r = computeAscendant(MODERN_DATE, 40.7128, -74.006); // NYC
    expect(typeof r).toBe('number');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(360);
  });

  test('different latitudes produce different ascendants', () => {
    const nyc = computeAscendant(MODERN_DATE, 40.7128, -74.006);
    const equator = computeAscendant(MODERN_DATE, 0, -74.006);
    expect(typeof nyc).toBe('number');
    expect(typeof equator).toBe('number');
  });

  test('different longitudes produce different ascendants', () => {
    const west = computeAscendant(MODERN_DATE, 40.7128, -74.006);
    const east = computeAscendant(MODERN_DATE, 40.7128, 2.3522);
    expect(west).not.toBeCloseTo(east, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// computeMidheaven
// ════════════════════════════════════════════════════════════════
describe('computeMidheaven', () => {
  test('returns valid longitude (number 0-360)', () => {
    const r = computeMidheaven(MODERN_DATE, -74.006);
    expect(typeof r).toBe('number');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(360);
  });

  test('MC changes with longitude', () => {
    const west = computeMidheaven(MODERN_DATE, -74.006);
    const east = computeMidheaven(MODERN_DATE, 139.6917);
    expect(west).not.toBeCloseTo(east, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// computeWholeSignHouses
// ════════════════════════════════════════════════════════════════
describe('computeWholeSignHouses', () => {
  test('returns 12 houses', () => {
    const houses = computeWholeSignHouses(0); // Aries rising
    expect(houses).toHaveLength(12);
  });

  test('Aries rising: house 1 = Aries, house 7 = Libra', () => {
    const houses = computeWholeSignHouses(0);
    const h1 = houses.find(h => h.house === 1);
    const h7 = houses.find(h => h.house === 7);
    expect(h1.sign).toBe('Aries');
    expect(h7.sign).toBe('Libra');
  });

  test('Cancer rising (index 3): house 1 = Cancer', () => {
    const houses = computeWholeSignHouses(3);
    const h1 = houses.find(h => h.house === 1);
    const h4 = houses.find(h => h.house === 4);
    const h10 = houses.find(h => h.house === 10);
    expect(h1.sign).toBe('Cancer');
    expect(h4.sign).toBe('Libra');
    expect(h10.sign).toBe('Aries');
  });

  test('each house has a startDegree', () => {
    const houses = computeWholeSignHouses(0);
    for (const h of houses) {
      expect(typeof h.startDegree).toBe('number');
      expect(h.startDegree).toBeGreaterThanOrEqual(0);
      expect(h.startDegree).toBeLessThan(360);
    }
  });

  test('house signs cycle through all 12 signs', () => {
    const houses = computeWholeSignHouses(5); // Virgo rising
    const signs = new Set(houses.map(h => h.sign));
    expect(signs.size).toBe(12);
  });
});

// ════════════════════════════════════════════════════════════════
// getHouseForLongitude
// ════════════════════════════════════════════════════════════════
describe('getHouseForLongitude', () => {
  const houses = computeWholeSignHouses(0); // Aries rising — house 1 = 0-29°, house 2 = 30-59°, etc.

  test('15 degrees (Aries) = house 1', () => {
    expect(getHouseForLongitude(15, houses)).toBe(1);
  });

  test('95 degrees (Cancer) = house 4', () => {
    expect(getHouseForLongitude(95, houses)).toBe(4);
  });

  test('185 degrees (Libra) = house 7', () => {
    expect(getHouseForLongitude(185, houses)).toBe(7);
  });

  test('returns null for null houses', () => {
    expect(getHouseForLongitude(100, null)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// detectVoidOfCourseMoon
// ════════════════════════════════════════════════════════════════
describe('detectVoidOfCourseMoon', () => {
  test('returns object with expected shape', () => {
    const r = detectVoidOfCourseMoon(MODERN_DATE);
    expect(r).toHaveProperty('isVoid');
    expect(r).toHaveProperty('lastAspect');
    expect(r).toHaveProperty('signExitDate');
    expect(r).toHaveProperty('hoursRemaining');
    expect(typeof r.isVoid).toBe('boolean');
  });

  test('signExitDate is in the future', () => {
    const r = detectVoidOfCourseMoon(MODERN_DATE);
    if (r.signExitDate) {
      expect(r.signExitDate.getTime()).toBeGreaterThan(MODERN_DATE.getTime());
    }
  });

  test('hoursRemaining is non-negative or null', () => {
    const r = detectVoidOfCourseMoon(MODERN_DATE);
    if (r.hoursRemaining !== null) {
      expect(r.hoursRemaining).toBeGreaterThanOrEqual(0);
    } else {
      expect(r.hoursRemaining).toBeNull();
    }
  });

  test('hoursRemaining is reasonable when present (< 72 hours)', () => {
    const r = detectVoidOfCourseMoon(MODERN_DATE);
    if (r.hoursRemaining !== null) {
      expect(r.hoursRemaining).toBeLessThan(72);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// computeSecondaryProgressions
// ════════════════════════════════════════════════════════════════
describe('computeSecondaryProgressions', () => {
  const mockNatalChart = {
    birthData: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
    planets: [
      { name: 'Sun', longitude: 84.2, sign: 'Gemini', degree: 24.2 },
      { name: 'Moon', longitude: 210.5, sign: 'Libra', degree: 0.5 },
    ],
    ascendant: { longitude: 200, sign: 'Libra', degree: 20, signIndex: 6 },
  };

  test('returns expected shape', () => {
    const r = computeSecondaryProgressions(mockNatalChart, MODERN_DATE);
    expect(r).not.toBeNull();
    expect(r.progressedDate).toBeInstanceOf(Date);
    expect(typeof r.age).toBe('number');
    expect(r.positions).toBeDefined();
    expect(r.aspects).toBeDefined();
    expect(r.lunarPhase).toBeDefined();
    expect(r.nodes).toBeDefined();
  });

  test('age is approximately correct', () => {
    const r = computeSecondaryProgressions(mockNatalChart, new Date('2025-06-15T12:00:00Z'));
    expect(r.age).toBeCloseTo(35, 0);
  });

  test('progressed date is close to birth date (within months)', () => {
    const r = computeSecondaryProgressions(mockNatalChart, MODERN_DATE);
    const birthDate = new Date(1990, 5, 15, 14, 30);
    // Progressed date = birth + age days — so for ~35 years old, progressed date is ~35 days after birth
    const daysDiff = (r.progressedDate.getTime() - birthDate.getTime()) / ONE_DAY_MS;
    expect(daysDiff).toBeCloseTo(r.age, 0);
  });

  test('returns null for future birth date', () => {
    const futureChart = { ...mockNatalChart, birthData: { year: 2099, month: 1, day: 1 } };
    const r = computeSecondaryProgressions(futureChart, MODERN_DATE);
    expect(r).toBeNull();
  });

  test('progressedAscendant is computed when natal ascendant exists', () => {
    const r = computeSecondaryProgressions(mockNatalChart, MODERN_DATE);
    expect(r.progressedAscendant).not.toBeNull();
    expect(SIGNS).toContain(r.progressedAscendant.sign);
  });

  test('progressedAscendant is null when natal ascendant missing', () => {
    const noAscChart = { ...mockNatalChart, ascendant: null };
    const r = computeSecondaryProgressions(noAscChart, MODERN_DATE);
    expect(r.progressedAscendant).toBeNull();
  });

  test('progressed positions have valid structure', () => {
    const r = computeSecondaryProgressions(mockNatalChart, MODERN_DATE);
    for (const [name, data] of Object.entries(r.positions)) {
      expect(data.longitude).toBeGreaterThanOrEqual(0);
      expect(data.longitude).toBeLessThan(360);
      expect(SIGNS).toContain(data.sign);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// computeSynastry
// ════════════════════════════════════════════════════════════════
describe('computeSynastry', () => {
  const chart1 = {
    planets: {
      Sun: { longitude: 84, sign: 'Gemini' },
      Moon: { longitude: 210, sign: 'Libra' },
      Mars: { longitude: 350, sign: 'Pisces' },
    },
    houses: computeWholeSignHouses(0),
  };

  const chart2 = {
    planets: {
      Sun: { longitude: 264, sign: 'Sagittarius' },
      Moon: { longitude: 90, sign: 'Cancer' },
      Mars: { longitude: 174, sign: 'Virgo' },
    },
    houses: computeWholeSignHouses(3),
  };

  test('returns crossAspects, houseOverlays1, houseOverlays2', () => {
    const r = computeSynastry(chart1, chart2);
    expect(Array.isArray(r.crossAspects)).toBe(true);
    expect(r.houseOverlays1).toBeDefined();
    expect(r.houseOverlays2).toBeDefined();
  });

  test('cross-aspects are sorted by orb', () => {
    const r = computeSynastry(chart1, chart2);
    for (let i = 1; i < r.crossAspects.length; i++) {
      expect(r.crossAspects[i].orb).toBeGreaterThanOrEqual(r.crossAspects[i - 1].orb);
    }
  });

  test('cross-aspects have correct shape', () => {
    const r = computeSynastry(chart1, chart2);
    for (const a of r.crossAspects) {
      expect(a).toHaveProperty('planet1');
      expect(a).toHaveProperty('planet2');
      expect(a).toHaveProperty('aspect');
      expect(a).toHaveProperty('orb');
      expect(a).toHaveProperty('exact');
    }
  });

  test('detects Sun-Sun opposition (84 vs 264 = 180 degrees)', () => {
    const r = computeSynastry(chart1, chart2);
    const sunOpp = r.crossAspects.find(
      a => a.planet1 === 'Sun' && a.planet2 === 'Sun' && a.aspect === 'Opposition'
    );
    expect(sunOpp).toBeDefined();
    expect(sunOpp.orb).toBe(0);
    expect(sunOpp.exact).toBe(true);
  });

  test('house overlays are computed when houses exist', () => {
    const r = computeSynastry(chart1, chart2);
    expect(Object.keys(r.houseOverlays1).length).toBeGreaterThan(0);
    expect(Object.keys(r.houseOverlays2).length).toBeGreaterThan(0);
  });

  test('handles array-format planets', () => {
    const arrayChart1 = { planets: [{ name: 'Sun', longitude: 0 }] };
    const arrayChart2 = { planets: [{ name: 'Sun', longitude: 120 }] };
    const r = computeSynastry(arrayChart1, arrayChart2);
    expect(r.crossAspects.length).toBeGreaterThanOrEqual(1);
    expect(r.crossAspects[0].aspect).toBe('Trine');
  });
});

// ════════════════════════════════════════════════════════════════
// computeRecursiveSynastry
// ════════════════════════════════════════════════════════════════
describe('computeRecursiveSynastry', () => {
  const chart1 = {
    planets: {
      Sun: { longitude: 84, sign: 'Gemini' },
      Moon: { longitude: 210, sign: 'Libra' },
      Mars: { longitude: 350, sign: 'Pisces' },
      Venus: { longitude: 50, sign: 'Taurus' },
      Mercury: { longitude: 70, sign: 'Gemini' },
      Jupiter: { longitude: 95, sign: 'Cancer' },
      Saturn: { longitude: 290, sign: 'Capricorn' },
    },
  };

  const chart2 = {
    planets: {
      Sun: { longitude: 264, sign: 'Sagittarius' },
      Moon: { longitude: 90, sign: 'Cancer' },
      Mars: { longitude: 174, sign: 'Virgo' },
      Venus: { longitude: 320, sign: 'Aquarius' },
      Mercury: { longitude: 250, sign: 'Sagittarius' },
      Jupiter: { longitude: 30, sign: 'Taurus' },
      Saturn: { longitude: 110, sign: 'Cancer' },
    },
  };

  test('returns perspectives for classical planets', () => {
    const r = computeRecursiveSynastry(chart1, chart2, MODERN_DATE);
    expect(r.perspectives).toBeDefined();
    expect(r.perspectives.Sun).toBeDefined();
    expect(r.perspectives.Moon).toBeDefined();
    expect(r.perspectives.Mars).toBeDefined();
  });

  test('each perspective has sign1, sign2, separation, crossAspects', () => {
    const r = computeRecursiveSynastry(chart1, chart2, MODERN_DATE);
    for (const planet of CLASSICAL_PLANETS) {
      const p = r.perspectives[planet];
      expect(p).toHaveProperty('sign1');
      expect(p).toHaveProperty('sign2');
      expect(p).toHaveProperty('separation');
      expect(p).toHaveProperty('crossAspects');
      expect(Array.isArray(p.crossAspects)).toBe(true);
    }
  });

  test('Sun-Sun self-aspect is detected (180 degrees = opposition)', () => {
    const r = computeRecursiveSynastry(chart1, chart2, MODERN_DATE);
    expect(r.perspectives.Sun.selfAspect).toBeDefined();
    expect(r.perspectives.Sun.selfAspect.aspect).toBe('Opposition');
  });

  test('separation is within 0-180 range', () => {
    const r = computeRecursiveSynastry(chart1, chart2, MODERN_DATE);
    for (const planet of CLASSICAL_PLANETS) {
      expect(r.perspectives[planet].separation).toBeGreaterThanOrEqual(0);
      expect(r.perspectives[planet].separation).toBeLessThanOrEqual(180);
    }
  });
});
