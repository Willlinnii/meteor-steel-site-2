import JOURNEY_DEFS from './journeyDefs';

const ALL_JOURNEYS = Object.values(JOURNEY_DEFS);
const REQUIRED_FIELDS = ['id', 'label', 'challengeMode', 'levelsPerStop', 'dotRadius', 'title', 'completion', 'completionElement'];

// ════════════════════════════════════════════════════════════════
// Structural validation
// ════════════════════════════════════════════════════════════════
describe('JOURNEY_DEFS structural integrity', () => {
  test('exports a non-empty object', () => {
    expect(typeof JOURNEY_DEFS).toBe('object');
    expect(ALL_JOURNEYS.length).toBeGreaterThan(0);
  });

  test('every key matches the journey id', () => {
    for (const [key, def] of Object.entries(JOURNEY_DEFS)) {
      expect(def.id).toBe(key);
    }
  });

  test('every journey has all required fields', () => {
    for (const def of ALL_JOURNEYS) {
      for (const field of REQUIRED_FIELDS) {
        expect(def).toHaveProperty(field);
      }
    }
  });

  test('every journey has a unique completionElement', () => {
    const elements = ALL_JOURNEYS.map(d => d.completionElement);
    expect(new Set(elements).size).toBe(elements.length);
  });

  test('completionElement follows the journeys.{id}.completed pattern', () => {
    for (const def of ALL_JOURNEYS) {
      expect(def.completionElement).toBe(`journeys.${def.id}.completed`);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// Stages
// ════════════════════════════════════════════════════════════════
describe('journey stages', () => {
  const journeysWithStages = ALL_JOURNEYS.filter(d => d.stages !== null);

  test('journeys with stages have non-empty arrays', () => {
    for (const def of journeysWithStages) {
      expect(Array.isArray(def.stages)).toBe(true);
      expect(def.stages.length).toBeGreaterThan(0);
    }
  });

  test('every stage has id and label', () => {
    for (const def of journeysWithStages) {
      for (const stage of def.stages) {
        expect(stage.id).toBeTruthy();
        expect(stage.label).toBeTruthy();
      }
    }
  });

  test('stage ids are unique within each journey', () => {
    for (const def of journeysWithStages) {
      const ids = def.stages.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('cosmic journey has null stages (loaded at runtime)', () => {
    expect(JOURNEY_DEFS.cosmic.stages).toBeNull();
    expect(JOURNEY_DEFS.cosmic.stagesSource).toBe('yellowBrickRoad');
  });
});

// ════════════════════════════════════════════════════════════════
// Challenge modes
// ════════════════════════════════════════════════════════════════
describe('challenge modes', () => {
  test('challengeMode is either wheel or cosmic', () => {
    for (const def of ALL_JOURNEYS) {
      expect(['wheel', 'cosmic']).toContain(def.challengeMode);
    }
  });

  test('cosmic mode journeys have levelsPerStop = 3', () => {
    const cosmicJourneys = ALL_JOURNEYS.filter(d => d.challengeMode === 'cosmic');
    for (const def of cosmicJourneys) {
      expect(def.levelsPerStop).toBe(3);
    }
  });

  test('wheel mode journeys have levelsPerStop = 1', () => {
    const wheelJourneys = ALL_JOURNEYS.filter(d => d.challengeMode === 'wheel');
    for (const def of wheelJourneys) {
      expect(def.levelsPerStop).toBe(1);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// Intro and completion text
// ════════════════════════════════════════════════════════════════
describe('intro and completion text', () => {
  test('every journey has an intro array with at least one line', () => {
    for (const def of ALL_JOURNEYS) {
      expect(Array.isArray(def.intro)).toBe(true);
      expect(def.intro.length).toBeGreaterThan(0);
      for (const line of def.intro) {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });

  test('every journey has a non-empty completion string', () => {
    for (const def of ALL_JOURNEYS) {
      expect(typeof def.completion).toBe('string');
      expect(def.completion.length).toBeGreaterThan(0);
    }
  });
});
