/**
 * Declarative schemas for canonical data entities.
 *
 * Derived from: architecture/ontology_spec_v1.md
 * Validated by: src/tests/dataIntegrity.test.js (static tests)
 *
 * These schemas are consumed by validateCanonicalData.js at runtime (dev only)
 * to catch data corruption or accidental field changes before they cause
 * downstream rendering errors.
 */

// ---- Monomyth stage IDs (ontology invariant #1) ----
const STAGE_IDS = [
  'golden-age', 'falling-star', 'impact-crater', 'forge',
  'quenching', 'integration', 'drawing', 'new-age',
];

// ---- Schemas ----

/**
 * 7 classical planets — chronosphaera.json
 * Each entry: { number, metal, planet, day, sin, deities, body, ... }
 */
export const planetsSchema = {
  type: 'array',
  exactLength: 7,
  itemShape: {
    number: 'number',
    metal: 'string',
    planet: 'string',
    day: 'string',
  },
};

/**
 * 12 zodiac signs — chronosphaeraZodiac.json
 * Each entry: { sign, symbol, element, modality, rulingPlanet, ... }
 */
export const zodiacSchema = {
  type: 'array',
  exactLength: 12,
  itemShape: {
    sign: 'string',
    symbol: 'string',
    element: 'string',
    modality: 'string',
  },
};

/**
 * 8 monomyth stages — monomyth.json
 * Object keyed by stage ID, each value is a long-form string.
 */
export const monomythSchema = {
  type: 'object',
  exactKeys: STAGE_IDS,
  valueType: 'string',
};

/**
 * 4 classical elements — chronosphaeraElements.json
 * Object keyed by element name (Fire, Earth, Air, Water).
 * Each value: { signs: [...], qualities: "...", cultures: { ... } }
 */
export const elementsSchema = {
  type: 'object',
  exactKeys: ['Fire', 'Earth', 'Air', 'Water'],
  valueShape: {
    signs: 'array',
    qualities: 'string',
  },
};

/**
 * 4 cardinal directions — chronosphaeraCardinals.json
 * Object keyed by cardinal ID.
 * Each value: { label, date, season, direction, ... }
 */
export const cardinalsSchema = {
  type: 'object',
  exactKeys: ['vernal-equinox', 'summer-solstice', 'autumnal-equinox', 'winter-solstice'],
  valueShape: {
    label: 'string',
    season: 'string',
  },
};

/**
 * Mythic figures — figures.json
 * Array of 100+ figures, each with id, name, and a stages object
 * that maps all 8 monomyth stage IDs to narrative strings.
 */
export const figuresSchema = {
  type: 'array',
  minLength: 10,
  itemShape: {
    id: 'string',
    name: 'string',
    stages: 'object',
  },
};

// ---- Octave pattern schemas (8-sequences) ----

/**
 * 8 steel process stages — steelProcess.json
 * Object keyed by stage ID, each value is a long-form string.
 */
export const steelProcessSchema = {
  type: 'object',
  exactKeys: STAGE_IDS,
  valueType: 'string',
};

/**
 * 8 synthesis entries — synthesis.json
 * Object keyed by stage ID, each value is a long-form string.
 */
export const synthesisSchema = {
  type: 'object',
  exactKeys: STAGE_IDS,
  valueType: 'string',
};

/**
 * 8+1 stage overviews — stageOverviews.json
 * Object keyed by 8 stage IDs plus 'overview'.
 */
export const stageOverviewsSchema = {
  type: 'object',
  requiredKeys: [...STAGE_IDS, 'overview'],
  valueType: 'string',
};

/**
 * 8 psychosomatic correspondences — monomythPsychles.json
 * Object keyed by stage ID.
 */
export const psychlesSchema = {
  type: 'object',
  exactKeys: STAGE_IDS,
};

/**
 * 8 chapters of Fallen Starlight — fallenStarlight.json
 * Object with `titles` and `chapters`, each keyed by 8 stage IDs.
 */
export const fallenStarlightSchema = {
  type: 'object',
  requiredKeys: ['titles', 'chapters'],
  childSchemas: {
    titles: { type: 'object', exactKeys: STAGE_IDS, valueType: 'string' },
    chapters: { type: 'object', exactKeys: STAGE_IDS, valueType: 'string' },
  },
};

/**
 * 6 natural cycles — monomythCycles.json
 * Object with `cycles` array, each cycle has id, title, and 8-item stages array.
 */
export const cyclesSchema = {
  type: 'object',
  requiredKeys: ['cycles'],
  childSchemas: {
    cycles: {
      type: 'array',
      exactLength: 6,
      itemShape: { id: 'string', title: 'string', stages: 'array' },
    },
  },
};

/**
 * 20+ theoretical models — monomythModels.json
 * Object with `models` array, each model has id, theorist, and 8-item stages array.
 */
export const modelsSchema = {
  type: 'object',
  requiredKeys: ['models'],
  childSchemas: {
    models: {
      type: 'array',
      minLength: 20,
      itemShape: { id: 'string', theorist: 'string', stages: 'array' },
    },
  },
};

// ---- Exports for convenience ----

export const ALL_SCHEMAS = {
  planets: planetsSchema,
  zodiac: zodiacSchema,
  monomyth: monomythSchema,
  elements: elementsSchema,
  cardinals: cardinalsSchema,
  figures: figuresSchema,
  steelProcess: steelProcessSchema,
  synthesis: synthesisSchema,
  stageOverviews: stageOverviewsSchema,
  psychles: psychlesSchema,
  fallenStarlight: fallenStarlightSchema,
  cycles: cyclesSchema,
  models: modelsSchema,
};
