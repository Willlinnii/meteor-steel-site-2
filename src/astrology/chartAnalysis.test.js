/**
 * chartAnalysis.test.js — Unit tests for chart analysis helpers.
 */

import {
  analyzePositions,
  findNotableAspects,
  analyzeShifts,
  aggregateDignities,
  detectAspectPatterns,
  computeTransitAspects,
  findCrossPerspectiveResonance,
  generateSynopsis,
  analyzeHouses,
  computePartOfFortune,
  detectMutualReceptions,
  computeProgressedAspects,
  detectProgressedIngresses,
  analyzeSynastryAspects,
  findSynastryPatterns,
  SIGN_ELEMENTS,
  SIGN_MODALITIES,
} from './chartAnalysis';
import { computeWholeSignHouses } from './recursiveEngine';

// ── Fixed reference data ──────────────────────────────────────────────────────

const FIRE_HEAVY_POSITIONS = {
  Sun: { sign: 'Aries', longitude: 10 },
  Moon: { sign: 'Leo', longitude: 130 },
  Mars: { sign: 'Sagittarius', longitude: 250 },
  Venus: { sign: 'Aries', longitude: 15 },
  Mercury: { sign: 'Gemini', longitude: 70 },
  Jupiter: { sign: 'Cancer', longitude: 100 },
  Saturn: { sign: 'Capricorn', longitude: 280 },
};

const STELLIUM_POSITIONS = {
  Sun: { sign: 'Aries', longitude: 5 },
  Moon: { sign: 'Aries', longitude: 12 },
  Mars: { sign: 'Aries', longitude: 18 },
  Venus: { sign: 'Taurus', longitude: 40 },
  Mercury: { sign: 'Taurus', longitude: 45 },
  Jupiter: { sign: 'Cancer', longitude: 100 },
  Saturn: { sign: 'Capricorn', longitude: 280 },
};

const ARRAY_FORMAT_POSITIONS = [
  { name: 'Sun', sign: 'Aries', longitude: 10 },
  { name: 'Moon', sign: 'Taurus', longitude: 40 },
  { name: 'Mars', sign: 'Gemini', longitude: 70 },
];

// ════════════════════════════════════════════════════════════════
// analyzePositions
// ════════════════════════════════════════════════════════════════
describe('analyzePositions', () => {
  test('tallies elements correctly', () => {
    const r = analyzePositions(FIRE_HEAVY_POSITIONS);
    // Fire: Sun(Aries), Moon(Leo), Mars(Sag), Venus(Aries) = 4
    expect(r.elements.fire).toBe(4);
    // Air: Mercury(Gemini) = 1
    expect(r.elements.air).toBe(1);
    // Water: Jupiter(Cancer) = 1
    expect(r.elements.water).toBe(1);
    // Earth: Saturn(Capricorn) = 1
    expect(r.elements.earth).toBe(1);
  });

  test('tallies modalities correctly', () => {
    const r = analyzePositions(FIRE_HEAVY_POSITIONS);
    // Cardinal: Aries(Sun,Venus), Cancer(Jupiter), Capricorn(Saturn) = 4
    expect(r.modalities.cardinal).toBe(4);
    // Fixed: Leo(Moon) = 1
    expect(r.modalities.fixed).toBe(1);
    // Mutable: Sagittarius(Mars), Gemini(Mercury) = 2
    expect(r.modalities.mutable).toBe(2);
  });

  test('detects dominant element', () => {
    const r = analyzePositions(FIRE_HEAVY_POSITIONS);
    expect(r.dominantElement).toBe('fire');
  });

  test('detects dominant modality', () => {
    const r = analyzePositions(FIRE_HEAVY_POSITIONS);
    expect(r.dominantModality).toBe('cardinal');
  });

  test('detects stelliums (3+ in same sign)', () => {
    const r = analyzePositions(STELLIUM_POSITIONS);
    expect(r.stelliums.length).toBe(1);
    expect(r.stelliums[0].sign).toBe('Aries');
    expect(r.stelliums[0].planets).toEqual(['Sun', 'Moon', 'Mars']);
  });

  test('detects clusters (2+ in same sign)', () => {
    const r = analyzePositions(STELLIUM_POSITIONS);
    // Aries(3), Taurus(2) = 2 clusters
    expect(r.clusters.length).toBe(2);
  });

  test('handles array format positions', () => {
    const r = analyzePositions(ARRAY_FORMAT_POSITIONS);
    expect(r.elements.fire).toBe(1);
    expect(r.elements.earth).toBe(1);
    expect(r.elements.air).toBe(1);
    expect(r.dominantElement).toBeDefined();
  });

  test('handles empty input', () => {
    const r = analyzePositions({});
    expect(r.elements.fire).toBe(0);
    expect(r.elements.earth).toBe(0);
    expect(r.elements.air).toBe(0);
    expect(r.elements.water).toBe(0);
    expect(r.stelliums).toEqual([]);
  });

  test('handles positions with missing sign', () => {
    const r = analyzePositions({ Sun: { longitude: 10 } });
    expect(r.elements.fire).toBe(0);
    expect(r.stelliums).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// findNotableAspects
// ════════════════════════════════════════════════════════════════
describe('findNotableAspects', () => {
  const MIXED_ASPECTS = [
    { planet1: 'Sun', planet2: 'Mars', aspect: 'Square', orb: 3.2 },
    { planet1: 'Moon', planet2: 'Venus', aspect: 'Trine', orb: 1.5 },
    { planet1: 'Mercury', planet2: 'Jupiter', aspect: 'Conjunction', orb: 0.8 },
    { planet1: 'Venus', planet2: 'Saturn', aspect: 'Opposition', orb: 4.1 },
    { planet1: 'Mars', planet2: 'Jupiter', aspect: 'Sextile', orb: 2.3 },
  ];

  test('categorizes tensions correctly', () => {
    const r = findNotableAspects(MIXED_ASPECTS);
    expect(r.tensions).toHaveLength(2);
    expect(r.tensions.map(a => a.aspect)).toContain('Square');
    expect(r.tensions.map(a => a.aspect)).toContain('Opposition');
  });

  test('categorizes flows correctly', () => {
    const r = findNotableAspects(MIXED_ASPECTS);
    expect(r.flows).toHaveLength(2);
    expect(r.flows.map(a => a.aspect)).toContain('Trine');
    expect(r.flows.map(a => a.aspect)).toContain('Sextile');
  });

  test('categorizes fusions correctly', () => {
    const r = findNotableAspects(MIXED_ASPECTS);
    expect(r.fusions).toHaveLength(1);
    expect(r.fusions[0].aspect).toBe('Conjunction');
  });

  test('finds tightest aspect', () => {
    const r = findNotableAspects(MIXED_ASPECTS);
    expect(r.tightest.planet1).toBe('Mercury');
    expect(r.tightest.planet2).toBe('Jupiter');
    expect(r.tightest.orb).toBe(0.8);
  });

  test('handles empty input', () => {
    const r = findNotableAspects([]);
    expect(r.tensions).toEqual([]);
    expect(r.flows).toEqual([]);
    expect(r.fusions).toEqual([]);
    expect(r.tightest).toBeNull();
  });

  test('handles null input', () => {
    const r = findNotableAspects(null);
    expect(r.tightest).toBeNull();
  });

  test('single aspect is categorized and is tightest', () => {
    const r = findNotableAspects([
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Trine', orb: 2.0 },
    ]);
    expect(r.flows).toHaveLength(1);
    expect(r.tightest.orb).toBe(2.0);
  });
});

// ════════════════════════════════════════════════════════════════
// SIGN_ELEMENTS / SIGN_MODALITIES completeness
// ════════════════════════════════════════════════════════════════
describe('Sign mappings', () => {
  test('all 12 signs have elements', () => {
    expect(Object.keys(SIGN_ELEMENTS)).toHaveLength(12);
    const elements = new Set(Object.values(SIGN_ELEMENTS));
    expect(elements.size).toBe(4);
  });

  test('all 12 signs have modalities', () => {
    expect(Object.keys(SIGN_MODALITIES)).toHaveLength(12);
    const modalities = new Set(Object.values(SIGN_MODALITIES));
    expect(modalities.size).toBe(3);
  });

  test('each element has exactly 3 signs', () => {
    const counts = {};
    for (const el of Object.values(SIGN_ELEMENTS)) {
      counts[el] = (counts[el] || 0) + 1;
    }
    expect(counts.fire).toBe(3);
    expect(counts.earth).toBe(3);
    expect(counts.air).toBe(3);
    expect(counts.water).toBe(3);
  });

  test('each modality has exactly 4 signs', () => {
    const counts = {};
    for (const mod of Object.values(SIGN_MODALITIES)) {
      counts[mod] = (counts[mod] || 0) + 1;
    }
    expect(counts.cardinal).toBe(4);
    expect(counts.fixed).toBe(4);
    expect(counts.mutable).toBe(4);
  });
});

// ════════════════════════════════════════════════════════════════
// aggregateDignities
// ════════════════════════════════════════════════════════════════
describe('aggregateDignities', () => {
  test('detects domicile (Sun in Leo)', () => {
    const r = aggregateDignities({ Sun: { sign: 'Leo' } });
    expect(r.domicile).toHaveLength(1);
    expect(r.domicile[0].planet).toBe('Sun');
    expect(r.dignified).toHaveLength(1);
  });

  test('detects exaltation (Sun in Aries)', () => {
    const r = aggregateDignities({ Sun: { sign: 'Aries' } });
    expect(r.exaltation).toHaveLength(1);
    expect(r.dignified).toHaveLength(1);
  });

  test('detects detriment (Saturn in Cancer)', () => {
    const r = aggregateDignities({ Saturn: { sign: 'Cancer' } });
    expect(r.detriment).toHaveLength(1);
    expect(r.debilitated).toHaveLength(1);
  });

  test('detects fall (Mars in Cancer)', () => {
    const r = aggregateDignities({ Mars: { sign: 'Cancer' } });
    expect(r.fall).toHaveLength(1);
    expect(r.debilitated).toHaveLength(1);
  });

  test('detects peregrine (Sun in Gemini)', () => {
    const r = aggregateDignities({ Sun: { sign: 'Gemini' } });
    expect(r.peregrine).toHaveLength(1);
    expect(r.dignified).toHaveLength(0);
    expect(r.debilitated).toHaveLength(0);
  });

  test('aggregates multiple dignities', () => {
    const r = aggregateDignities({
      Sun: { sign: 'Leo' },
      Mars: { sign: 'Aries' },
      Jupiter: { sign: 'Sagittarius' },
      Saturn: { sign: 'Cancer' },
    });
    expect(r.dignified.length).toBe(3);
    expect(r.debilitated.length).toBe(1);
    expect(r.summary).toContain('3 dignified');
    expect(r.summary).toContain('1 debilitated');
  });

  test('handles empty input', () => {
    const r = aggregateDignities({});
    expect(r.dignified).toEqual([]);
    expect(r.debilitated).toEqual([]);
    expect(r.summary).toBe('All planets peregrine.');
  });

  test('handles array format', () => {
    const r = aggregateDignities([
      { name: 'Sun', sign: 'Leo' },
      { name: 'Moon', sign: 'Cancer' },
    ]);
    expect(r.domicile.length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// detectAspectPatterns
// ════════════════════════════════════════════════════════════════
describe('detectAspectPatterns', () => {
  test('detects Grand Trine (3 mutual trines)', () => {
    const aspects = [
      { planet1: 'Sun', planet2: 'Jupiter', aspect: 'Trine', orb: 1 },
      { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Trine', orb: 2 },
      { planet1: 'Sun', planet2: 'Saturn', aspect: 'Trine', orb: 1.5 },
    ];
    const r = detectAspectPatterns(aspects);
    expect(r.grandTrines).toHaveLength(1);
    expect(r.grandTrines[0].planets).toEqual(expect.arrayContaining(['Sun', 'Jupiter', 'Saturn']));
    expect(r.grandTrines[0].aspects).toHaveLength(3);
  });

  test('detects T-Square (2 squares + opposition)', () => {
    const aspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Opposition', orb: 2 },
      { planet1: 'Sun', planet2: 'Mars', aspect: 'Square', orb: 3 },
      { planet1: 'Moon', planet2: 'Mars', aspect: 'Square', orb: 2.5 },
    ];
    const r = detectAspectPatterns(aspects);
    expect(r.tSquares).toHaveLength(1);
    expect(r.tSquares[0].apex).toBe('Mars');
    expect(r.tSquares[0].planets).toEqual(expect.arrayContaining(['Sun', 'Moon', 'Mars']));
  });

  test('detects Yod (2 quincunx + sextile)', () => {
    const aspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Sextile', orb: 1 },
      { planet1: 'Sun', planet2: 'Saturn', aspect: 'Quincunx', orb: 2 },
      { planet1: 'Moon', planet2: 'Saturn', aspect: 'Quincunx', orb: 1.5 },
    ];
    const r = detectAspectPatterns(aspects);
    expect(r.yods).toHaveLength(1);
    expect(r.yods[0].apex).toBe('Saturn');
  });

  test('returns empty arrays when no patterns found', () => {
    const aspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Trine', orb: 2 },
      { planet1: 'Mars', planet2: 'Venus', aspect: 'Square', orb: 3 },
    ];
    const r = detectAspectPatterns(aspects);
    expect(r.grandTrines).toEqual([]);
    expect(r.tSquares).toEqual([]);
    expect(r.yods).toEqual([]);
  });

  test('handles empty/null input', () => {
    expect(detectAspectPatterns([])).toEqual({ grandTrines: [], tSquares: [], yods: [] });
    expect(detectAspectPatterns(null)).toEqual({ grandTrines: [], tSquares: [], yods: [] });
  });

  test('does not produce false positive Grand Trine from only 2 trines', () => {
    const aspects = [
      { planet1: 'Sun', planet2: 'Jupiter', aspect: 'Trine', orb: 1 },
      { planet1: 'Jupiter', planet2: 'Saturn', aspect: 'Trine', orb: 2 },
    ];
    const r = detectAspectPatterns(aspects);
    expect(r.grandTrines).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// computeTransitAspects
// ════════════════════════════════════════════════════════════════
describe('computeTransitAspects', () => {
  test('detects conjunction (same longitude)', () => {
    const transit = { Sun: { longitude: 10 } };
    const natal = { Moon: { longitude: 12 } };
    const r = computeTransitAspects(transit, natal);
    expect(r.length).toBeGreaterThanOrEqual(1);
    const conj = r.find(a => a.aspect === 'Conjunction');
    expect(conj).toBeDefined();
    expect(conj.transitPlanet).toBe('Sun');
    expect(conj.natalPlanet).toBe('Moon');
    expect(conj.orb).toBe(2);
    expect(conj.exact).toBeFalsy();
  });

  test('detects exact aspect (< 1 degree orb)', () => {
    const transit = { Venus: { longitude: 90.3 } };
    const natal = { Mars: { longitude: 0 } };
    const r = computeTransitAspects(transit, natal);
    const sq = r.find(a => a.aspect === 'Square');
    expect(sq).toBeDefined();
    expect(sq.exact).toBe(true);
    expect(sq.orb).toBeLessThan(1);
  });

  test('detects cross-planet aspects', () => {
    const transit = { Jupiter: { longitude: 180 } };
    const natal = { Saturn: { longitude: 0 } };
    const r = computeTransitAspects(transit, natal);
    const opp = r.find(a => a.aspect === 'Opposition');
    expect(opp).toBeDefined();
    expect(opp.transitPlanet).toBe('Jupiter');
    expect(opp.natalPlanet).toBe('Saturn');
  });

  test('handles wrap-around at 360 degrees', () => {
    const transit = { Sun: { longitude: 357 } };
    const natal = { Moon: { longitude: 3 } };
    const r = computeTransitAspects(transit, natal);
    const conj = r.find(a => a.aspect === 'Conjunction');
    expect(conj).toBeDefined();
    expect(conj.orb).toBe(6);
  });

  test('results sorted by orb (tightest first)', () => {
    const transit = {
      Sun: { longitude: 0 },
      Moon: { longitude: 90.5 },
    };
    const natal = { Mars: { longitude: 0.2 } };
    const r = computeTransitAspects(transit, natal);
    expect(r.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < r.length; i++) {
      expect(r[i].orb).toBeGreaterThanOrEqual(r[i - 1].orb);
    }
  });

  test('handles null input', () => {
    expect(computeTransitAspects(null, { Sun: { longitude: 0 } })).toEqual([]);
    expect(computeTransitAspects({ Sun: { longitude: 0 } }, null)).toEqual([]);
  });

  test('handles array format', () => {
    const transit = [{ name: 'Sun', longitude: 120 }];
    const natal = [{ name: 'Moon', longitude: 0 }];
    const r = computeTransitAspects(transit, natal);
    const trine = r.find(a => a.aspect === 'Trine');
    expect(trine).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════
// findCrossPerspectiveResonance
// ════════════════════════════════════════════════════════════════
describe('findCrossPerspectiveResonance', () => {
  test('finds unanimous agreement', () => {
    const perspectives = {
      Mars: { positions: { Jupiter: { sign: 'Sagittarius' }, Venus: { sign: 'Taurus' } } },
      Venus: { positions: { Jupiter: { sign: 'Sagittarius' }, Mars: { sign: 'Aries' } } },
    };
    const r = findCrossPerspectiveResonance(perspectives);
    const jupiterAgree = r.agreements.find(a => a.target === 'Jupiter');
    expect(jupiterAgree).toBeDefined();
    expect(jupiterAgree.sign).toBe('Sagittarius');
    expect(jupiterAgree.observers).toContain('Mars');
    expect(jupiterAgree.observers).toContain('Venus');
  });

  test('finds disagreement', () => {
    const perspectives = {
      Mars: { positions: { Mercury: { sign: 'Gemini' } } },
      Venus: { positions: { Mercury: { sign: 'Cancer' } } },
    };
    const r = findCrossPerspectiveResonance(perspectives);
    const mercuryDisagree = r.disagreements.find(d => d.target === 'Mercury');
    expect(mercuryDisagree).toBeDefined();
    expect(mercuryDisagree.sightings).toHaveLength(2);
  });

  test('handles single observer (no resonance possible)', () => {
    const r = findCrossPerspectiveResonance({
      Mars: { positions: { Jupiter: { sign: 'Aries' } } },
    });
    expect(r.agreements).toEqual([]);
    expect(r.disagreements).toEqual([]);
  });

  test('handles null input', () => {
    const r = findCrossPerspectiveResonance(null);
    expect(r.agreements).toEqual([]);
    expect(r.disagreements).toEqual([]);
  });

  test('handles missing positions in a perspective', () => {
    const perspectives = {
      Mars: { positions: { Jupiter: { sign: 'Aries' } } },
      Venus: {},
    };
    const r = findCrossPerspectiveResonance(perspectives);
    // Only one observer has positions, so no multi-observer targets
    expect(r.agreements).toEqual([]);
    expect(r.disagreements).toEqual([]);
  });

  test('handles array format positions', () => {
    const perspectives = {
      Mars: { positions: [{ name: 'Jupiter', sign: 'Sagittarius' }] },
      Venus: { positions: [{ name: 'Jupiter', sign: 'Sagittarius' }] },
    };
    const r = findCrossPerspectiveResonance(perspectives);
    expect(r.agreements).toHaveLength(1);
    expect(r.agreements[0].target).toBe('Jupiter');
  });
});

// ════════════════════════════════════════════════════════════════
// analyzeHouses
// ════════════════════════════════════════════════════════════════
describe('analyzeHouses', () => {
  const houses = computeWholeSignHouses(0); // Aries rising
  const positions = {
    Sun: { longitude: 15, sign: 'Aries' },     // house 1
    Moon: { longitude: 95, sign: 'Cancer' },    // house 4
    Mars: { longitude: 185, sign: 'Libra' },    // house 7
    Venus: { longitude: 275, sign: 'Capricorn' }, // house 10
    Mercury: { longitude: 20, sign: 'Aries' },  // house 1
    Jupiter: { longitude: 100, sign: 'Cancer' }, // house 4
    Saturn: { longitude: 200, sign: 'Libra' },  // house 7
  };
  const ascendant = { longitude: 0, sign: 'Aries', signIndex: 0 };
  const midheaven = { longitude: 270, sign: 'Capricorn', signIndex: 9 };

  test('returns expected shape', () => {
    const r = analyzeHouses(positions, houses, ascendant, midheaven);
    expect(r).toHaveProperty('occupiedHouses');
    expect(r).toHaveProperty('emptyHouses');
    expect(r).toHaveProperty('angularPlanets');
    expect(r).toHaveProperty('houseConcentration');
    expect(r).toHaveProperty('housePlanets');
  });

  test('identifies occupied and empty houses', () => {
    const r = analyzeHouses(positions, houses, ascendant, midheaven);
    expect(r.occupiedHouses.length).toBeGreaterThan(0);
    expect(r.emptyHouses.length + r.occupiedHouses.length).toBe(12);
  });

  test('identifies angular planets (houses 1, 4, 7, 10)', () => {
    const r = analyzeHouses(positions, houses, ascendant, midheaven);
    expect(r.angularPlanets.length).toBeGreaterThan(0);
    // angularPlanets contains { planet, house } objects
    const angularNames = r.angularPlanets.map(a => a.planet);
    expect(angularNames).toContain('Sun');
    expect(angularNames).toContain('Moon');
    expect(angularNames).toContain('Mars');
    expect(angularNames).toContain('Venus');
  });

  test('handles null houses gracefully', () => {
    const r = analyzeHouses(positions, null, ascendant, midheaven);
    expect(r.occupiedHouses).toEqual([]);
    expect(r.emptyHouses).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// computePartOfFortune
// ════════════════════════════════════════════════════════════════
describe('computePartOfFortune', () => {
  const ascendant = { longitude: 0 };
  const sun = { longitude: 30 };
  const moon = { longitude: 90 };

  test('returns valid structure', () => {
    const r = computePartOfFortune(ascendant, sun, moon);
    expect(r).not.toBeNull();
    expect(r).toHaveProperty('longitude');
    expect(r).toHaveProperty('sign');
    expect(r).toHaveProperty('degree');
    expect(r).toHaveProperty('isDayChart');
  });

  test('day chart formula: ASC + Moon - Sun', () => {
    // ASC=0, Moon=90, Sun=30 → 0 + 90 - 30 = 60
    const r = computePartOfFortune(ascendant, sun, moon);
    if (r.isDayChart) {
      expect(r.longitude).toBeCloseTo(60, 0);
    }
  });

  test('longitude is in 0-360 range', () => {
    const r = computePartOfFortune(ascendant, sun, moon);
    expect(r.longitude).toBeGreaterThanOrEqual(0);
    expect(r.longitude).toBeLessThan(360);
  });

  test('returns null for null inputs', () => {
    expect(computePartOfFortune(null, sun, moon)).toBeNull();
    expect(computePartOfFortune(ascendant, null, moon)).toBeNull();
    expect(computePartOfFortune(ascendant, sun, null)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// detectMutualReceptions
// ════════════════════════════════════════════════════════════════
describe('detectMutualReceptions', () => {
  test('detects Moon in Leo + Sun in Cancer', () => {
    const positions = {
      Sun: { sign: 'Cancer' },
      Moon: { sign: 'Leo' },
    };
    const r = detectMutualReceptions(positions);
    expect(r.length).toBe(1);
    expect(r[0].planet1).toBe('Sun');
    expect(r[0].planet2).toBe('Moon');
  });

  test('detects Mars in Taurus + Venus in Aries', () => {
    const positions = {
      Mars: { sign: 'Taurus' },
      Venus: { sign: 'Aries' },
    };
    const r = detectMutualReceptions(positions);
    expect(r.length).toBe(1);
  });

  test('returns empty when no mutual receptions', () => {
    const positions = {
      Sun: { sign: 'Aries' },
      Moon: { sign: 'Taurus' },
    };
    const r = detectMutualReceptions(positions);
    expect(r).toEqual([]);
  });

  test('handles array format', () => {
    const positions = [
      { name: 'Sun', sign: 'Cancer' },
      { name: 'Moon', sign: 'Leo' },
    ];
    const r = detectMutualReceptions(positions);
    expect(r.length).toBe(1);
  });

  test('handles empty input', () => {
    expect(detectMutualReceptions({})).toEqual([]);
  });

  test('handles null input', () => {
    expect(detectMutualReceptions(null)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// computeProgressedAspects
// ════════════════════════════════════════════════════════════════
describe('computeProgressedAspects', () => {
  test('detects exact conjunction', () => {
    const prog = { Sun: { longitude: 100 } };
    const natal = { Moon: { longitude: 100 } };
    const r = computeProgressedAspects(prog, natal);
    expect(r.length).toBeGreaterThanOrEqual(1);
    const conj = r.find(a => a.aspect === 'Conjunction');
    expect(conj).toBeDefined();
    expect(conj.progressedPlanet).toBe('Sun');
    expect(conj.natalPlanet).toBe('Moon');
    expect(conj.exact).toBe(true);
  });

  test('uses tight 1.5 degree orbs', () => {
    const prog = { Sun: { longitude: 100 } };
    const natal = { Moon: { longitude: 102 } };
    const r = computeProgressedAspects(prog, natal);
    // 2 degrees apart, orb is 1.5 — should NOT be found
    const conj = r.find(a => a.aspect === 'Conjunction' && a.progressedPlanet === 'Sun');
    expect(conj).toBeUndefined();
  });

  test('detects trine within tight orb', () => {
    const prog = { Mars: { longitude: 0 } };
    const natal = { Venus: { longitude: 121 } };
    const r = computeProgressedAspects(prog, natal);
    const trine = r.find(a => a.aspect === 'Trine');
    expect(trine).toBeDefined();
    expect(trine.orb).toBe(1);
  });

  test('results sorted by orb', () => {
    const prog = { Sun: { longitude: 0 }, Moon: { longitude: 90.5 } };
    const natal = { Mars: { longitude: 0.2 }, Venus: { longitude: 90 } };
    const r = computeProgressedAspects(prog, natal);
    for (let i = 1; i < r.length; i++) {
      expect(r[i].orb).toBeGreaterThanOrEqual(r[i - 1].orb);
    }
  });

  test('handles null input', () => {
    expect(computeProgressedAspects(null, { Sun: { longitude: 0 } })).toEqual([]);
    expect(computeProgressedAspects({ Sun: { longitude: 0 } }, null)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// detectProgressedIngresses
// ════════════════════════════════════════════════════════════════
describe('detectProgressedIngresses', () => {
  test('detects sign change', () => {
    const prog = { Sun: { sign: 'Cancer' } };
    const natal = { Sun: { sign: 'Gemini' } };
    const r = detectProgressedIngresses(prog, natal);
    expect(r.length).toBe(1);
    expect(r[0].planet).toBe('Sun');
    expect(r[0].natalSign).toBe('Gemini');
    expect(r[0].progressedSign).toBe('Cancer');
  });

  test('does not report unchanged signs', () => {
    const prog = { Moon: { sign: 'Aries' } };
    const natal = { Moon: { sign: 'Aries' } };
    const r = detectProgressedIngresses(prog, natal);
    expect(r).toEqual([]);
  });

  test('handles multiple ingresses', () => {
    const prog = { Sun: { sign: 'Leo' }, Moon: { sign: 'Capricorn' }, Mars: { sign: 'Aries' } };
    const natal = { Sun: { sign: 'Cancer' }, Moon: { sign: 'Sagittarius' }, Mars: { sign: 'Aries' } };
    const r = detectProgressedIngresses(prog, natal);
    expect(r.length).toBe(2); // Sun and Moon changed, Mars didn't
  });

  test('handles null input', () => {
    expect(detectProgressedIngresses(null, { Sun: { sign: 'Aries' } })).toEqual([]);
    expect(detectProgressedIngresses({ Sun: { sign: 'Aries' } }, null)).toEqual([]);
  });

  test('handles array format', () => {
    const prog = { Sun: { sign: 'Leo' } };
    const natal = [{ name: 'Sun', sign: 'Cancer' }];
    const r = detectProgressedIngresses(prog, natal);
    expect(r.length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// analyzeSynastryAspects
// ════════════════════════════════════════════════════════════════
describe('analyzeSynastryAspects', () => {
  const crossAspects = [
    { planet1: 'Sun', planet2: 'Sun', aspect: 'Opposition', orb: 0, exact: true },
    { planet1: 'Moon', planet2: 'Venus', aspect: 'Trine', orb: 2.5, exact: false },
    { planet1: 'Mars', planet2: 'Saturn', aspect: 'Square', orb: 3.0, exact: false },
    { planet1: 'Venus', planet2: 'Jupiter', aspect: 'Conjunction', orb: 0.5, exact: true },
    { planet1: 'Mercury', planet2: 'Moon', aspect: 'Sextile', orb: 1.5, exact: false },
  ];

  test('returns expected shape', () => {
    const r = analyzeSynastryAspects(crossAspects);
    expect(r).toHaveProperty('byType');
    expect(r).toHaveProperty('tightest');
    expect(r).toHaveProperty('hardCount');
    expect(r).toHaveProperty('softCount');
    expect(r).toHaveProperty('score');
  });

  test('groups aspects by type', () => {
    const r = analyzeSynastryAspects(crossAspects);
    expect(r.byType['Opposition']).toHaveLength(1);
    expect(r.byType['Trine']).toHaveLength(1);
    expect(r.byType['Square']).toHaveLength(1);
    expect(r.byType['Conjunction']).toHaveLength(1);
    expect(r.byType['Sextile']).toHaveLength(1);
  });

  test('counts hard and soft correctly', () => {
    const r = analyzeSynastryAspects(crossAspects);
    expect(r.hardCount).toBe(2); // Opposition + Square
    expect(r.softCount).toBe(2); // Trine + Sextile
  });

  test('tightest is first element (sorted by orb)', () => {
    const r = analyzeSynastryAspects(crossAspects);
    expect(r.tightest.orb).toBe(0);
  });

  test('handles empty input', () => {
    const r = analyzeSynastryAspects([]);
    expect(r.hardCount).toBe(0);
    expect(r.softCount).toBe(0);
    expect(r.tightest).toBeNull();
    expect(r.score).toBe(0);
  });

  test('handles null input', () => {
    const r = analyzeSynastryAspects(null);
    expect(r.tightest).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// findSynastryPatterns
// ════════════════════════════════════════════════════════════════
describe('findSynastryPatterns', () => {
  test('detects double whammy', () => {
    const crossAspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Trine', orb: 2 },
      { planet1: 'Moon', planet2: 'Sun', aspect: 'Trine', orb: 3 },
      { planet1: 'Mars', planet2: 'Venus', aspect: 'Square', orb: 1 },
    ];
    const r = findSynastryPatterns(crossAspects);
    expect(r.length).toBe(1);
    expect(r[0].planet1).toBe('Sun');
    expect(r[0].planet2).toBe('Moon');
  });

  test('does not find double whammy when only one direction', () => {
    const crossAspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Trine', orb: 2 },
      { planet1: 'Mars', planet2: 'Venus', aspect: 'Square', orb: 1 },
    ];
    const r = findSynastryPatterns(crossAspects);
    expect(r.length).toBe(0);
  });

  test('does not duplicate double whammies', () => {
    const crossAspects = [
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Trine', orb: 2 },
      { planet1: 'Moon', planet2: 'Sun', aspect: 'Sextile', orb: 3 },
      { planet1: 'Sun', planet2: 'Moon', aspect: 'Conjunction', orb: 5 },
      { planet1: 'Moon', planet2: 'Sun', aspect: 'Opposition', orb: 4 },
    ];
    const r = findSynastryPatterns(crossAspects);
    // Same pair, so should only appear once
    expect(r.length).toBe(1);
  });

  test('handles empty/null input', () => {
    expect(findSynastryPatterns([])).toEqual([]);
    expect(findSynastryPatterns(null)).toEqual([]);
  });
});
