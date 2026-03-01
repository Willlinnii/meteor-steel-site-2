/**
 * Data Integrity Tests
 *
 * Validates the structure of key data files in src/data/ to ensure they
 * have not been corrupted, truncated, or had required fields removed.
 * These are pure JSON import checks — no rendering, no network calls.
 *
 * Derived from: src/data/ (2026-02-27)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Direct JSON imports (CRA / Jest supports this out of the box)
// ---------------------------------------------------------------------------
const planets = require('../data/chronosphaera.json');
const zodiac = require('../data/chronosphaeraZodiac.json');
const elements = require('../data/chronosphaeraElements.json');
const cardinals = require('../data/chronosphaeraCardinals.json');
const monomyth = require('../data/monomyth.json');
const figures = require('../data/figures.json');
const yellowBrickRoad = require('../data/yellowBrickRoad.json');
const constellations = require('../data/constellations.json');
const mythicEarthSites = require('../data/mythicEarthSites.json');
const mythSalonLibrary = require('../data/mythSalonLibrary.json');
const mythicCalendar = require('../data/mythicCalendar.json');
const medicineWheels = require('../data/medicineWheels.json');
const wheelTraditions = require('../data/wheelTraditions.json');

// Octave pattern files (8-sequences)
const steelProcess = require('../data/steelProcess.json');
const synthesis = require('../data/synthesis.json');
const stageOverviews = require('../data/stageOverviews.json');
const monomythPsychles = require('../data/monomythPsychles.json');
const fallenStarlight = require('../data/fallenStarlight.json');
const monomythCycles = require('../data/monomythCycles.json');
const monomythModels = require('../data/monomythModels.json');

// Journey definitions (JS module)
const JOURNEY_DEFS = require('../data/journeyDefs.js').default || require('../data/journeyDefs.js');

// ---------------------------------------------------------------------------
// 1. Canonical entity counts
// ---------------------------------------------------------------------------
describe('Canonical entity counts', () => {
  test('7 planets', () => {
    expect(planets).toHaveLength(7);
  });

  test('12 zodiac signs', () => {
    expect(zodiac).toHaveLength(12);
  });

  test('4 elements', () => {
    expect(Object.keys(elements)).toHaveLength(4);
  });

  test('4 cardinal directions', () => {
    expect(Object.keys(cardinals)).toHaveLength(4);
  });

  test('8 monomyth stages', () => {
    expect(Object.keys(monomyth)).toHaveLength(8);
  });

  test('88 unique constellation names across 89 entries (Serpens is split)', () => {
    expect(constellations.length).toBe(89);
    const uniqueNames = new Set(constellations.map(c => c.name));
    expect(uniqueNames.size).toBe(88);
  });

  test('26 yellow brick road stops', () => {
    expect(yellowBrickRoad.journeySequence).toHaveLength(26);
  });

  test('12 calendar months', () => {
    expect(mythicCalendar).toHaveLength(12);
  });

  test('library has libraries array with valid entries', () => {
    expect(Array.isArray(mythSalonLibrary.libraries)).toBe(true);
    expect(mythSalonLibrary.libraries.length).toBeGreaterThan(0);
    mythSalonLibrary.libraries.forEach(lib => {
      expect(lib.id).toBeTruthy();
      expect(lib.name).toBeTruthy();
      expect(typeof lib.lat).toBe('number');
      expect(typeof lib.lng).toBe('number');
      expect(Array.isArray(lib.shelves)).toBe(true);
      expect(lib.shelves.length).toBeGreaterThan(0);
    });
  });

  test('medicine wheels has wheels array', () => {
    expect(Array.isArray(medicineWheels.wheels)).toBe(true);
    expect(medicineWheels.wheels.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Planet data integrity
// ---------------------------------------------------------------------------
describe('Planet data integrity', () => {
  const requiredFields = ['number', 'metal', 'planet', 'day'];

  test.each(requiredFields)('every planet has required field "%s"', (field) => {
    planets.forEach((p, i) => {
      expect(p).toHaveProperty(field);
      expect(p[field]).toBeTruthy();
    });
  });

  test('planet names match the expected set', () => {
    const expectedPlanets = new Set([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
    ]);
    const actualPlanets = new Set(planets.map(p => p.planet));
    expect(actualPlanets).toEqual(expectedPlanets);
  });

  test('metal names are unique', () => {
    const metals = planets.map(p => p.metal);
    expect(new Set(metals).size).toBe(metals.length);
  });
});

// ---------------------------------------------------------------------------
// 3. Zodiac data integrity
// ---------------------------------------------------------------------------
describe('Zodiac data integrity', () => {
  test('each sign has "sign" and "element"', () => {
    zodiac.forEach((z) => {
      expect(z).toHaveProperty('sign');
      expect(z).toHaveProperty('element');
      expect(typeof z.sign).toBe('string');
      expect(typeof z.element).toBe('string');
    });
  });

  test('all 12 standard zodiac names present', () => {
    const expectedSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer',
      'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];
    const actualSigns = zodiac.map(z => z.sign);
    expect(actualSigns).toEqual(expect.arrayContaining(expectedSigns));
    expect(expectedSigns).toEqual(expect.arrayContaining(actualSigns));
  });
});

// ---------------------------------------------------------------------------
// 4. Monomyth data integrity
// ---------------------------------------------------------------------------
describe('Monomyth data integrity', () => {
  const expectedStageIds = [
    'golden-age', 'falling-star', 'impact-crater', 'forge',
    'quenching', 'integration', 'drawing', 'new-age',
  ];

  test('stage IDs match expected set', () => {
    const actualIds = Object.keys(monomyth);
    expect(actualIds).toEqual(expect.arrayContaining(expectedStageIds));
    expect(expectedStageIds).toEqual(expect.arrayContaining(actualIds));
  });

  test('each stage value is a string', () => {
    expectedStageIds.forEach((id) => {
      expect(typeof monomyth[id]).toBe('string');
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Sacred sites data integrity
// ---------------------------------------------------------------------------
describe('Sacred sites data integrity', () => {
  test('array with 200+ entries', () => {
    expect(Array.isArray(mythicEarthSites)).toBe(true);
    expect(mythicEarthSites.length).toBeGreaterThan(200);
  });

  test('each site has name and coordinates (lat/lng)', () => {
    mythicEarthSites.forEach((site, i) => {
      expect(site).toHaveProperty('name');
      expect(typeof site.name).toBe('string');
      expect(site).toHaveProperty('lat');
      expect(site).toHaveProperty('lng');
      expect(typeof site.lat).toBe('number');
      expect(typeof site.lng).toBe('number');
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Pantheon files integrity
// ---------------------------------------------------------------------------
describe('Pantheon files integrity', () => {
  const dataDir = path.resolve(__dirname, '..', 'data');
  const pantheonFiles = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('Pantheon.json'));

  test('all 79 pantheon files are discovered', () => {
    expect(pantheonFiles).toHaveLength(79);
  });

  test.each(pantheonFiles)('%s is valid JSON with a deities array', (filename) => {
    const filePath = path.join(dataDir, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    let data;
    expect(() => { data = JSON.parse(raw); }).not.toThrow();
    expect(data).toHaveProperty('deities');
    expect(Array.isArray(data.deities)).toBe(true);
  });

  test.each(pantheonFiles)('%s has at least 3 deities', (filename) => {
    const filePath = path.join(dataDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(data.deities.length).toBeGreaterThanOrEqual(3);
  });

  test.each(pantheonFiles)('%s — every deity has a name field', (filename) => {
    const filePath = path.join(dataDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.deities.forEach((deity, i) => {
      expect(deity).toHaveProperty('name');
      expect(typeof deity.name).toBe('string');
      expect(deity.name.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 7. Figures data integrity
// ---------------------------------------------------------------------------
describe('Figures data integrity', () => {
  test('array with at least 10 figures', () => {
    expect(Array.isArray(figures)).toBe(true);
    expect(figures.length).toBeGreaterThanOrEqual(10);
  });

  test('each figure has a name', () => {
    figures.forEach((fig) => {
      expect(fig).toHaveProperty('name');
      expect(typeof fig.name).toBe('string');
      expect(fig.name.length).toBeGreaterThan(0);
    });
  });

  test('each figure has an id', () => {
    figures.forEach((fig) => {
      expect(fig).toHaveProperty('id');
      expect(typeof fig.id).toBe('string');
    });
  });

  test('each figure has stages object with 8 stage keys', () => {
    const expectedStageIds = [
      'golden-age', 'falling-star', 'impact-crater', 'forge',
      'quenching', 'integration', 'drawing', 'new-age',
    ];
    figures.forEach((fig) => {
      expect(fig).toHaveProperty('stages');
      const stageKeys = Object.keys(fig.stages);
      expect(stageKeys).toEqual(expect.arrayContaining(expectedStageIds));
    });
  });
});

// ---------------------------------------------------------------------------
// 8. Octave pattern integrity (8-sequences)
// ---------------------------------------------------------------------------
describe('Octave pattern integrity (8-sequences)', () => {
  const STAGE_IDS = [
    'golden-age', 'falling-star', 'impact-crater', 'forge',
    'quenching', 'integration', 'drawing', 'new-age',
  ];

  test('steelProcess.json has 8 keys matching stage IDs', () => {
    const keys = Object.keys(steelProcess);
    expect(keys).toHaveLength(8);
    expect(keys).toEqual(expect.arrayContaining(STAGE_IDS));
    expect(STAGE_IDS).toEqual(expect.arrayContaining(keys));
  });

  test('synthesis.json has 8 keys matching stage IDs', () => {
    const keys = Object.keys(synthesis);
    expect(keys).toHaveLength(8);
    expect(keys).toEqual(expect.arrayContaining(STAGE_IDS));
    expect(STAGE_IDS).toEqual(expect.arrayContaining(keys));
  });

  test('stageOverviews.json has 8 stage keys plus overview', () => {
    const keys = Object.keys(stageOverviews);
    expect(keys).toHaveLength(9);
    expect(keys).toEqual(expect.arrayContaining([...STAGE_IDS, 'overview']));
  });

  test('monomythPsychles.json has 8 keys matching stage IDs', () => {
    const keys = Object.keys(monomythPsychles);
    expect(keys).toHaveLength(8);
    expect(keys).toEqual(expect.arrayContaining(STAGE_IDS));
    expect(STAGE_IDS).toEqual(expect.arrayContaining(keys));
  });

  test('fallenStarlight.json titles has 8 keys matching stage IDs', () => {
    const keys = Object.keys(fallenStarlight.titles);
    expect(keys).toHaveLength(8);
    expect(keys).toEqual(expect.arrayContaining(STAGE_IDS));
    expect(STAGE_IDS).toEqual(expect.arrayContaining(keys));
  });

  test('fallenStarlight.json chapters has 8 keys matching stage IDs', () => {
    const keys = Object.keys(fallenStarlight.chapters);
    expect(keys).toHaveLength(8);
    expect(keys).toEqual(expect.arrayContaining(STAGE_IDS));
    expect(STAGE_IDS).toEqual(expect.arrayContaining(keys));
  });

  test('monomythCycles.json has exactly 6 cycles', () => {
    expect(monomythCycles.cycles).toHaveLength(6);
  });

  test('each cycle has 8 stages', () => {
    monomythCycles.cycles.forEach((cycle) => {
      expect(cycle.stages).toHaveLength(8);
    });
  });

  test('each cycle has required fields (id, title, stages)', () => {
    monomythCycles.cycles.forEach((cycle) => {
      expect(cycle).toHaveProperty('id');
      expect(cycle).toHaveProperty('title');
      expect(cycle).toHaveProperty('stages');
      expect(typeof cycle.id).toBe('string');
      expect(typeof cycle.title).toBe('string');
      expect(Array.isArray(cycle.stages)).toBe(true);
    });
  });

  test('monomythModels.json has 20+ models', () => {
    expect(monomythModels.models.length).toBeGreaterThanOrEqual(20);
  });

  test('each model has 8 stages', () => {
    monomythModels.models.forEach((model) => {
      expect(model.stages).toHaveLength(8);
    });
  });

  test('each model has required fields (id, theorist, stages)', () => {
    monomythModels.models.forEach((model) => {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('theorist');
      expect(model).toHaveProperty('stages');
      expect(typeof model.id).toBe('string');
      expect(typeof model.theorist).toBe('string');
      expect(Array.isArray(model.stages)).toBe(true);
    });
  });

  test('each model stage is a non-empty string or null (intentional gap)', () => {
    monomythModels.models.forEach((model) => {
      model.stages.forEach((stage) => {
        if (stage !== null) {
          expect(typeof stage).toBe('string');
          expect(stage.length).toBeGreaterThan(0);
        }
      });
    });
  });

  test('each cycle stage is a non-empty string', () => {
    monomythCycles.cycles.forEach((cycle) => {
      cycle.stages.forEach((stage) => {
        expect(typeof stage).toBe('string');
        expect(stage.length).toBeGreaterThan(0);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// 9. Heptad pattern integrity (7-correspondences)
// ---------------------------------------------------------------------------
describe('Heptad pattern integrity (7-correspondences)', () => {
  test('7 unique metals across planets', () => {
    const metals = planets.map(p => p.metal);
    expect(metals).toHaveLength(7);
    expect(new Set(metals).size).toBe(7);
  });

  test('7 unique days across planets', () => {
    const days = planets.map(p => p.day);
    expect(days).toHaveLength(7);
    expect(new Set(days).size).toBe(7);
  });

  test('7 unique sins across planets', () => {
    const sins = planets.map(p => p.sin);
    expect(sins).toHaveLength(7);
    expect(new Set(sins).size).toBe(7);
  });

  test('7 unique virtues across planets', () => {
    const virtues = planets.map(p => p.virtue);
    expect(virtues).toHaveLength(7);
    expect(new Set(virtues).size).toBe(7);
  });

  test('every planet has body.chakra and body.organ', () => {
    planets.forEach((p) => {
      expect(p).toHaveProperty('body');
      expect(p.body).toHaveProperty('chakra');
      expect(p.body).toHaveProperty('organ');
      expect(typeof p.body.chakra).toBe('string');
      expect(typeof p.body.organ).toBe('string');
    });
  });

  test('7 unique chakras across planets', () => {
    const chakras = planets.map(p => p.body.chakra);
    expect(new Set(chakras).size).toBe(7);
  });

  test('7 unique organs across planets', () => {
    const organs = planets.map(p => p.body.organ);
    expect(new Set(organs).size).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// 10. Journey pattern integrity
// ---------------------------------------------------------------------------
describe('Journey pattern integrity', () => {
  const eightStopJourneys = ['monomyth', 'meteor-steel', 'fused', 'consulting-storyteller', 'consulting-seeker', 'consulting-brand'];

  test.each(eightStopJourneys)('%s journey has exactly 8 stops', (journeyId) => {
    const journey = JOURNEY_DEFS[journeyId];
    expect(journey).toBeDefined();
    expect(journey.stages).toHaveLength(8);
  });

  test('planetary journey has exactly 7 stops', () => {
    expect(JOURNEY_DEFS.planetary).toBeDefined();
    expect(JOURNEY_DEFS.planetary.stages).toHaveLength(7);
  });

  test('zodiac journey has exactly 12 stops', () => {
    expect(JOURNEY_DEFS.zodiac).toBeDefined();
    expect(JOURNEY_DEFS.zodiac.stages).toHaveLength(12);
  });

  test('cosmic journey uses yellowBrickRoad (26 stops)', () => {
    expect(JOURNEY_DEFS.cosmic).toBeDefined();
    expect(JOURNEY_DEFS.cosmic.stagesSource).toBe('yellowBrickRoad');
    // stages is null at definition time — loaded at runtime from yellowBrickRoad.json
    expect(yellowBrickRoad.journeySequence).toHaveLength(26);
  });

  test('10 total journey definitions', () => {
    expect(Object.keys(JOURNEY_DEFS)).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// 11. Wheel traditions integrity
// ---------------------------------------------------------------------------
describe('Wheel traditions integrity', () => {
  const EXPECTED_IDS = [
    'lakota', 'cherokee', 'ojibwe', 'navajo', 'zuni',
    'mikmaq', 'hopi', 'cree', 'apache',
  ];

  const ASSOCIATION_KEYS = [
    'animal', 'plant', 'element', 'season', 'lifeStage', 'timeOfDay',
    'virtue', 'celestialBody', 'humanAspect', 'sacredMountain', 'gemstone', 'clan',
  ];

  const CARDINAL_ANGLES = { N: -90, E: 0, S: 90, W: 180 };

  test('schema version is 1.0', () => {
    expect(wheelTraditions._schema).toBeDefined();
    expect(wheelTraditions._schema.version).toBe('1.0');
  });

  test('exactly 9 traditions', () => {
    expect(wheelTraditions.traditions).toHaveLength(9);
  });

  test('tradition IDs match the expected set', () => {
    const actualIds = wheelTraditions.traditions.map(t => t.id);
    expect(actualIds).toEqual(expect.arrayContaining(EXPECTED_IDS));
    expect(EXPECTED_IDS).toEqual(expect.arrayContaining(actualIds));
  });

  test('tradition IDs are unique', () => {
    const ids = wheelTraditions.traditions.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('each tradition has required top-level fields', () => {
    const requiredFields = ['id', 'name', 'region', 'source', 'directionCount', 'center', 'quadrantColors', 'directions'];
    wheelTraditions.traditions.forEach((t) => {
      requiredFields.forEach((f) => {
        expect(t).toHaveProperty(f);
      });
    });
  });

  test('quadrantColors has exactly N, E, S, W with rgba format', () => {
    const rgbaPattern = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;
    wheelTraditions.traditions.forEach((t) => {
      const keys = Object.keys(t.quadrantColors);
      expect(keys).toHaveLength(4);
      expect(keys).toEqual(expect.arrayContaining(['N', 'E', 'S', 'W']));
      keys.forEach((k) => {
        expect(t.quadrantColors[k]).toMatch(rgbaPattern);
      });
    });
  });

  test('each direction has required fields', () => {
    const requiredFields = ['dir', 'label', 'color', 'meaning', 'associations', 'description'];
    wheelTraditions.traditions.forEach((t) => {
      t.directions.forEach((d) => {
        requiredFields.forEach((f) => {
          expect(d).toHaveProperty(f);
        });
      });
    });
  });

  test('every direction has all 12 association keys (no extras, no missing)', () => {
    wheelTraditions.traditions.forEach((t) => {
      t.directions.forEach((d) => {
        const keys = Object.keys(d.associations);
        expect(keys).toHaveLength(12);
        expect(keys).toEqual(expect.arrayContaining(ASSOCIATION_KEYS));
        expect(ASSOCIATION_KEYS).toEqual(expect.arrayContaining(keys));
      });
    });
  });

  test('cardinal directions use correct angles (N=-90, E=0, S=90, W=180)', () => {
    wheelTraditions.traditions.forEach((t) => {
      t.directions.forEach((d) => {
        if (CARDINAL_ANGLES[d.dir] !== undefined) {
          expect(d.angle).toBe(CARDINAL_ANGLES[d.dir]);
        }
      });
    });
  });

  test('non-cardinal directions (Above, Below) have null angles', () => {
    wheelTraditions.traditions.forEach((t) => {
      t.directions.forEach((d) => {
        if (['Above', 'Below'].includes(d.dir)) {
          expect(d.angle).toBeNull();
        }
      });
    });
  });

  test('direction color objects have name, hex, and rgba', () => {
    wheelTraditions.traditions.forEach((t) => {
      t.directions.forEach((d) => {
        expect(d.color).toHaveProperty('name');
        expect(d.color).toHaveProperty('hex');
        expect(d.color).toHaveProperty('rgba');
        expect(typeof d.color.name).toBe('string');
        expect(d.color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  test('each tradition has at least 4 directions', () => {
    wheelTraditions.traditions.forEach((t) => {
      expect(t.directions.length).toBeGreaterThanOrEqual(4);
    });
  });

  test('6-direction traditions (zuni, hopi) have Above and Below in directions', () => {
    ['zuni', 'hopi'].forEach((id) => {
      const tradition = wheelTraditions.traditions.find(t => t.id === id);
      expect(tradition).toBeDefined();
      expect(tradition.directions).toHaveLength(6);
      const dirs = tradition.directions.map(d => d.dir);
      expect(dirs).toContain('Above');
      expect(dirs).toContain('Below');
    });
  });

  test('each direction description is 2+ sentences', () => {
    wheelTraditions.traditions.forEach((t) => {
      t.directions.forEach((d) => {
        expect(typeof d.description).toBe('string');
        // At least 2 sentences (look for at least one period followed by a space or end)
        const sentenceEnds = d.description.match(/[.!?]\s|[.!?]$/g);
        expect(sentenceEnds.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
