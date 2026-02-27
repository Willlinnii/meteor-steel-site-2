/**
 * Runtime validation of canonical data files (development mode only).
 *
 * Import this file once from App.js. In dev mode it loads canonical JSON
 * and validates each against its declared schema, logging console warnings
 * for any violations. In production builds the entire module is a no-op
 * because the guard exits before any imports execute.
 *
 * No data files are modified — this is read-only validation.
 */

if (process.env.NODE_ENV === 'development') {
  // Dynamic require inside the dev guard ensures tree-shaking can
  // eliminate this entire block in production builds.
  const { validateOnLoad } = require('./devValidation');
  const {
    planetsSchema,
    zodiacSchema,
    monomythSchema,
    elementsSchema,
    cardinalsSchema,
    figuresSchema,
    steelProcessSchema,
    synthesisSchema,
    stageOverviewsSchema,
    psychlesSchema,
    fallenStarlightSchema,
    cyclesSchema,
    modelsSchema,
  } = require('./dataSchemas');

  // Canonical data imports
  const planets = require('../data/chronosphaera.json');
  const zodiac = require('../data/chronosphaeraZodiac.json');
  const monomyth = require('../data/monomyth.json');
  const elements = require('../data/chronosphaeraElements.json');
  const cardinals = require('../data/chronosphaeraCardinals.json');
  const figures = require('../data/figures.json');
  const steelProcess = require('../data/steelProcess.json');
  const synthesis = require('../data/synthesis.json');
  const stageOverviews = require('../data/stageOverviews.json');
  const psychles = require('../data/monomythPsychles.json');
  const fallenStarlight = require('../data/fallenStarlight.json');
  const cycles = require('../data/monomythCycles.json');
  const models = require('../data/monomythModels.json');

  // Run all validations
  validateOnLoad('planets (chronosphaera.json)', planets, planetsSchema);
  validateOnLoad('zodiac (chronosphaeraZodiac.json)', zodiac, zodiacSchema);
  validateOnLoad('monomyth (monomyth.json)', monomyth, monomythSchema);
  validateOnLoad('elements (chronosphaeraElements.json)', elements, elementsSchema);
  validateOnLoad('cardinals (chronosphaeraCardinals.json)', cardinals, cardinalsSchema);
  validateOnLoad('figures (figures.json)', figures, figuresSchema);
  validateOnLoad('steelProcess (steelProcess.json)', steelProcess, steelProcessSchema);
  validateOnLoad('synthesis (synthesis.json)', synthesis, synthesisSchema);
  validateOnLoad('stageOverviews (stageOverviews.json)', stageOverviews, stageOverviewsSchema);
  validateOnLoad('psychles (monomythPsychles.json)', psychles, psychlesSchema);
  validateOnLoad('fallenStarlight (fallenStarlight.json)', fallenStarlight, fallenStarlightSchema);
  validateOnLoad('cycles (monomythCycles.json)', cycles, cyclesSchema);
  validateOnLoad('models (monomythModels.json)', models, modelsSchema);

  // eslint-disable-next-line no-console
  console.log(
    '%c Canonical data validated ',
    'background: #28a745; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;'
  );
}
