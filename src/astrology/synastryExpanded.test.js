/**
 * synastryExpanded.test.js — Tests for the expanded synastry panel functions.
 *
 * Verifies that all functions used by SynastryPanel's new sections
 * (elemental balance, dignity, retrogrades, aspect patterns, lunar nodes,
 * EM fields, sidereal) produce valid output when given chart-like data.
 */

import {
  analyzePositions,
  aggregateDignities,
  detectMutualReceptions,
  detectAspectPatterns,
  SIGN_ELEMENTS,
} from './chartAnalysis';
import {
  detectRetrogrades,
  detectVoidOfCourseMoon,
  computeLunarNodes,
  computeFieldTopology,
  lonToSiderealSign,
  computeSynastry,
} from './recursiveEngine';
import {
  narrateMutualReception,
  narrateLunarNodes,
  narrateFieldInfluence,
} from './narrativeBridge';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const DATE_1 = new Date('1990-03-21T12:00:00Z');
const DATE_2 = new Date('1985-07-15T12:00:00Z');

const CHART_1_POSITIONS = {
  Sun: { sign: 'Aries', longitude: 0 },
  Moon: { sign: 'Cancer', longitude: 100 },
  Mercury: { sign: 'Pisces', longitude: 345 },
  Venus: { sign: 'Taurus', longitude: 40 },
  Mars: { sign: 'Aquarius', longitude: 315 },
  Jupiter: { sign: 'Cancer', longitude: 105 },
  Saturn: { sign: 'Capricorn', longitude: 290 },
};

const CHART_2_POSITIONS = {
  Sun: { sign: 'Cancer', longitude: 112 },
  Moon: { sign: 'Scorpio', longitude: 220 },
  Mercury: { sign: 'Leo', longitude: 135 },
  Venus: { sign: 'Gemini', longitude: 75 },
  Mars: { sign: 'Virgo', longitude: 165 },
  Jupiter: { sign: 'Aquarius', longitude: 318 },
  Saturn: { sign: 'Scorpio', longitude: 225 },
};

// ════════════════════════════════════════════════════════════════
// Section a: Elemental & Modality Balance
// ════════════════════════════════════════════════════════════════
describe('Elemental & Modality Balance (synastry)', () => {
  test('analyzePositions returns elements and modalities for both charts', () => {
    const a1 = analyzePositions(CHART_1_POSITIONS);
    const a2 = analyzePositions(CHART_2_POSITIONS);

    expect(a1.elements).toBeDefined();
    expect(a1.modalities).toBeDefined();
    expect(a2.elements).toBeDefined();
    expect(a2.modalities).toBeDefined();
  });

  test('element counts sum to planet count', () => {
    const a = analyzePositions(CHART_1_POSITIONS);
    const totalElements = Object.values(a.elements).reduce((s, v) => s + v, 0);
    expect(totalElements).toBe(Object.keys(CHART_1_POSITIONS).length);
  });

  test('modality counts sum to planet count', () => {
    const a = analyzePositions(CHART_1_POSITIONS);
    const totalMods = Object.values(a.modalities).reduce((s, v) => s + v, 0);
    expect(totalMods).toBe(Object.keys(CHART_1_POSITIONS).length);
  });

  test('dominantElement is a valid element', () => {
    const a = analyzePositions(CHART_1_POSITIONS);
    expect(['fire', 'earth', 'air', 'water']).toContain(a.dominantElement);
  });

  test('dominantModality is a valid modality', () => {
    const a = analyzePositions(CHART_1_POSITIONS);
    expect(['cardinal', 'fixed', 'mutable']).toContain(a.dominantModality);
  });
});

// ════════════════════════════════════════════════════════════════
// Section b: Dignity Comparison
// ════════════════════════════════════════════════════════════════
describe('Dignity Comparison (synastry)', () => {
  test('aggregateDignities returns expected shape', () => {
    const d = aggregateDignities(CHART_1_POSITIONS);
    expect(d).toHaveProperty('dignified');
    expect(d).toHaveProperty('debilitated');
    expect(Array.isArray(d.dignified)).toBe(true);
    expect(Array.isArray(d.debilitated)).toBe(true);
  });

  test('Venus in Taurus is dignified (domicile)', () => {
    const d = aggregateDignities({ Venus: { sign: 'Taurus', longitude: 40 } });
    // dignified may be array of strings or objects with .planet
    const dignifiedNames = d.dignified.map(x => typeof x === 'string' ? x : x.planet);
    expect(dignifiedNames).toContain('Venus');
  });

  test('detectMutualReceptions returns an array', () => {
    const r = detectMutualReceptions(CHART_1_POSITIONS);
    expect(Array.isArray(r)).toBe(true);
  });

  test('mutual reception entries have planet1, planet2, sign1, sign2', () => {
    // Create a forced mutual reception: Sun in Taurus, Venus in Aries
    const positions = {
      Sun: { sign: 'Taurus', longitude: 40 },
      Venus: { sign: 'Aries', longitude: 10 },
    };
    const r = detectMutualReceptions(positions);
    if (r.length > 0) {
      expect(r[0]).toHaveProperty('planet1');
      expect(r[0]).toHaveProperty('planet2');
      expect(r[0]).toHaveProperty('sign1');
      expect(r[0]).toHaveProperty('sign2');
    }
  });

  test('narrateMutualReception returns a string', () => {
    const receptions = [{ planet1: 'Sun', sign1: 'Taurus', planet2: 'Venus', sign2: 'Aries' }];
    const narrative = narrateMutualReception(receptions);
    expect(typeof narrative).toBe('string');
  });

  test('narrateMutualReception handles empty array', () => {
    const narrative = narrateMutualReception([]);
    expect(typeof narrative).toBe('string');
  });
});

// ════════════════════════════════════════════════════════════════
// Section c: Retrogrades & Void-of-Course
// ════════════════════════════════════════════════════════════════
describe('Retrograde & Void-of-Course (synastry)', () => {
  test('detectRetrogrades returns an object with planet keys', () => {
    const r = detectRetrogrades(DATE_1);
    expect(typeof r).toBe('object');
    expect(r).not.toBeNull();
    // Should have at least some planet keys
    const keys = Object.keys(r);
    expect(keys.length).toBeGreaterThan(0);
  });

  test('each retrograde entry has retrograde boolean', () => {
    const r = detectRetrogrades(DATE_1);
    for (const [, val] of Object.entries(r)) {
      expect(typeof val.retrograde).toBe('boolean');
    }
  });

  test('detectVoidOfCourseMoon returns isVoid boolean', () => {
    const v = detectVoidOfCourseMoon(DATE_1);
    expect(v).toHaveProperty('isVoid');
    expect(typeof v.isVoid).toBe('boolean');
  });

  test('both charts can be checked independently', () => {
    const r1 = detectRetrogrades(DATE_1);
    const r2 = detectRetrogrades(DATE_2);
    // Both should return valid objects (may differ in which planets are retrograde)
    expect(Object.keys(r1).length).toBeGreaterThan(0);
    expect(Object.keys(r2).length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// Section d: Cross-Chart Aspect Patterns
// ════════════════════════════════════════════════════════════════
describe('Cross-Chart Aspect Patterns (synastry)', () => {
  test('detectAspectPatterns returns grandTrines, tSquares, yods', () => {
    const chart1 = { planets: CHART_1_POSITIONS };
    const chart2 = { planets: CHART_2_POSITIONS };
    const synastry = computeSynastry(chart1, chart2);
    const patterns = detectAspectPatterns(synastry.crossAspects);

    expect(patterns).toHaveProperty('grandTrines');
    expect(patterns).toHaveProperty('tSquares');
    expect(patterns).toHaveProperty('yods');
    expect(Array.isArray(patterns.grandTrines)).toBe(true);
    expect(Array.isArray(patterns.tSquares)).toBe(true);
    expect(Array.isArray(patterns.yods)).toBe(true);
  });

  test('works with empty aspects array', () => {
    const patterns = detectAspectPatterns([]);
    expect(patterns.grandTrines).toEqual([]);
    expect(patterns.tSquares).toEqual([]);
    expect(patterns.yods).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// Section e: Lunar Nodes
// ════════════════════════════════════════════════════════════════
describe('Lunar Nodes (synastry)', () => {
  test('computeLunarNodes returns northNode and southNode', () => {
    const n = computeLunarNodes(DATE_1);
    expect(n).toHaveProperty('northNode');
    expect(n).toHaveProperty('southNode');
  });

  test('each node has sign and longitude', () => {
    const n = computeLunarNodes(DATE_1);
    expect(typeof n.northNode.sign).toBe('string');
    expect(typeof n.northNode.longitude).toBe('number');
    expect(typeof n.southNode.sign).toBe('string');
    expect(typeof n.southNode.longitude).toBe('number');
  });

  test('north and south nodes are ~180 degrees apart', () => {
    const n = computeLunarNodes(DATE_1);
    let diff = Math.abs(n.northNode.longitude - n.southNode.longitude);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeCloseTo(180, 0);
  });

  test('narrateLunarNodes returns a string for personal frame', () => {
    const n = computeLunarNodes(DATE_1);
    const narrative = narrateLunarNodes(n, 'personal');
    expect(typeof narrative).toBe('string');
    expect(narrative.length).toBeGreaterThan(0);
  });

  test('different dates produce different node positions', () => {
    const n1 = computeLunarNodes(DATE_1);
    const n2 = computeLunarNodes(DATE_2);
    // 5 years apart — nodes regress ~18.6 year cycle, should differ
    expect(n1.northNode.longitude).not.toBeCloseTo(n2.northNode.longitude, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// Section f: Electromagnetic Field Interaction
// ════════════════════════════════════════════════════════════════
describe('EM Field Interaction (synastry)', () => {
  test('computeFieldTopology returns an array', () => {
    const topo = computeFieldTopology('Earth', DATE_1);
    expect(Array.isArray(topo)).toBe(true);
  });

  test('field topology entries have body, fieldStrength, fieldType', () => {
    const topo = computeFieldTopology('Earth', DATE_1);
    if (topo.length > 0) {
      expect(topo[0]).toHaveProperty('body');
      expect(topo[0]).toHaveProperty('fieldStrength');
      expect(topo[0]).toHaveProperty('fieldType');
    }
  });

  test('narrateFieldInfluence returns a string', () => {
    const topo = computeFieldTopology('Earth', DATE_1);
    if (topo.length > 0) {
      const narrative = narrateFieldInfluence(topo[0].body, topo[0], [], null);
      expect(typeof narrative).toBe('string');
    }
  });
});

// ════════════════════════════════════════════════════════════════
// Section g: Sidereal (Vedic) Perspective
// ════════════════════════════════════════════════════════════════
describe('Sidereal Perspective (synastry)', () => {
  test('lonToSiderealSign returns sign and longitude', () => {
    const s = lonToSiderealSign(0, DATE_1);
    expect(s).toHaveProperty('sign');
    expect(s).toHaveProperty('longitude');
    expect(typeof s.sign).toBe('string');
    expect(typeof s.longitude).toBe('number');
  });

  test('sidereal longitude is shifted from tropical by ~23-24 degrees', () => {
    const s = lonToSiderealSign(0, DATE_1);
    // Ayanamsa is ~23-24 degrees for modern dates
    // Tropical 0° Aries should become ~6-7° Pisces in sidereal
    expect(s.longitude).toBeGreaterThan(330); // shifted back into late Pisces
    expect(s.sign).toBe('Pisces');
  });

  test('all chart positions can be converted to sidereal', () => {
    for (const [name, data] of Object.entries(CHART_1_POSITIONS)) {
      const s = lonToSiderealSign(data.longitude, DATE_1);
      expect(s.sign).toBeDefined();
      expect(typeof s.sign).toBe('string');
      expect(s.sign.length).toBeGreaterThan(0);
    }
  });

  test('sidereal signs sometimes differ from tropical', () => {
    // With ~24° offset, some planets near early degrees will shift signs
    let shiftCount = 0;
    for (const data of Object.values(CHART_1_POSITIONS)) {
      const sid = lonToSiderealSign(data.longitude, DATE_1);
      if (sid.sign !== data.sign) shiftCount++;
    }
    // At least some planets should shift (with 7 planets and 24° offset)
    expect(shiftCount).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// Integration: Full synastry pipeline
// ════════════════════════════════════════════════════════════════
describe('Full synastry pipeline (expanded)', () => {
  const chart1 = { planets: CHART_1_POSITIONS };
  const chart2 = { planets: CHART_2_POSITIONS };

  test('all expanded sections produce valid output for a chart pair', () => {
    // a. Elemental
    const a1 = analyzePositions(CHART_1_POSITIONS);
    const a2 = analyzePositions(CHART_2_POSITIONS);
    expect(a1.dominantElement).toBeDefined();
    expect(a2.dominantElement).toBeDefined();

    // b. Dignity
    const d1 = aggregateDignities(CHART_1_POSITIONS);
    const d2 = aggregateDignities(CHART_2_POSITIONS);
    expect(d1.dignified).toBeDefined();
    expect(d2.dignified).toBeDefined();

    // c. Retrogrades
    const r1 = detectRetrogrades(DATE_1);
    const r2 = detectRetrogrades(DATE_2);
    expect(Object.keys(r1).length).toBeGreaterThan(0);
    expect(Object.keys(r2).length).toBeGreaterThan(0);

    // d. Aspect patterns
    const synastry = computeSynastry(chart1, chart2);
    const patterns = detectAspectPatterns(synastry.crossAspects);
    expect(patterns).toBeDefined();

    // e. Lunar nodes
    const n1 = computeLunarNodes(DATE_1);
    const n2 = computeLunarNodes(DATE_2);
    expect(n1.northNode.sign).toBeDefined();
    expect(n2.northNode.sign).toBeDefined();

    // f. EM field
    const f1 = computeFieldTopology('Earth', DATE_1);
    const f2 = computeFieldTopology('Earth', DATE_2);
    expect(Array.isArray(f1)).toBe(true);
    expect(Array.isArray(f2)).toBe(true);

    // g. Sidereal
    const sid = lonToSiderealSign(CHART_1_POSITIONS.Sun.longitude, DATE_1);
    expect(sid.sign).toBeDefined();
  });
});
