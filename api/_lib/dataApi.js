// api/_lib/dataApi.js
// Coordinate System API — data imports, indexes, handlers, router

// ── Data imports (require for Vercel bundler, matching api/chat.js pattern) ──

// --- Monomyth ---
const monomyth            = require('../../src/data/monomyth.json');
const stageOverviews      = require('../../src/data/stageOverviews.json');
const monomythModelsData  = require('../../src/data/monomythModels.json');
const monomythCyclesData  = require('../../src/data/monomythCycles.json');
const monomythTheorists   = require('../../src/data/monomythTheorists.json');
const monomythMyths       = require('../../src/data/monomythMyths.json');
const monomythFilms       = require('../../src/data/monomythFilms.json');
const monomythPsychles    = require('../../src/data/monomythPsychles.json');
const monomythDepth       = require('../../src/data/monomythDepth.json');

// --- Meteor Steel ---
const figures             = require('../../src/data/figures.json');
const modernFigures       = require('../../src/data/modernFigures.json');
const saviors             = require('../../src/data/saviors.json');
const steelProcess        = require('../../src/data/steelProcess.json');
const synthesis           = require('../../src/data/synthesis.json');
const ufo                 = require('../../src/data/ufo.json');
const normalOtherWorld    = require('../../src/data/normalOtherWorld.json');
const fallenStarlight     = require('../../src/data/fallenStarlight.json');

// --- Chronosphaera ---
const chronosphaera                  = require('../../src/data/chronosphaera.json');
const chronosphaeraDeities           = require('../../src/data/chronosphaeraDeities.json');
const chronosphaeraZodiac            = require('../../src/data/chronosphaeraZodiac.json');
const chronosphaeraElements          = require('../../src/data/chronosphaeraElements.json');
const chronosphaeraCardinals         = require('../../src/data/chronosphaeraCardinals.json');
const chronosphaeraArchetypes        = require('../../src/data/chronosphaeraArchetypes.json');
const chronosphaeraModern            = require('../../src/data/chronosphaeraModern.json');
const chronosphaeraStories           = require('../../src/data/chronosphaeraStories.json');
const chronosphaeraTheology          = require('../../src/data/chronosphaeraTheology.json');
const chronosphaeraPlanetaryCultures = require('../../src/data/chronosphaeraPlanetaryCultures.json');
const chronosphaeraHebrew            = require('../../src/data/chronosphaeraHebrew.json');
const chronosphaeraArtists           = require('../../src/data/chronosphaeraArtists.json');
const chronosphaeraShared            = require('../../src/data/chronosphaeraShared.json');

// --- Cosmic / Cyclical ---
const dayNight              = require('../../src/data/dayNight.json');
const mythicCalendar        = require('../../src/data/mythicCalendar.json');
const medicineWheels        = require('../../src/data/medicineWheels.json');
const medicineWheelContent  = require('../../src/data/medicineWheelContent.json');
const yellowBrickRoad       = require('../../src/data/yellowBrickRoad.json');
const constellationContent  = require('../../src/data/constellationContent.json');
const constellationCultures = require('../../src/data/constellationCultures.json');

// --- Reference ---
const mythicEarthSites   = require('../../src/data/mythicEarthSites.json');
const mythSalonLibrary   = require('../../src/data/mythSalonLibrary.json');

// --- Source Vault (author's original research) ---
const vaultIndex  = require('../../src/vault/_index.json');
const vaultCharts = {};
for (const c of vaultIndex.charts) {
  vaultCharts[c.id] = require('../../src/vault/' + c.file);
}

// ── Constants ──

const PHASES = [
  { id: 'golden-age',    label: 'Golden Age / Surface',      number: 1 },
  { id: 'falling-star',  label: 'Falling Star / Calling',    number: 2 },
  { id: 'impact-crater', label: 'Impact Crater / Crossing',  number: 3 },
  { id: 'forge',         label: 'Forge / Initiation',        number: 4 },
  { id: 'quenching',     label: 'Quenching / Nadir',         number: 5 },
  { id: 'integration',   label: 'Integration / Return',      number: 6 },
  { id: 'drawing',       label: 'Drawing / Resurrection',    number: 7 },
  { id: 'new-age',       label: 'New Age / New World',       number: 8 },
];
const PHASE_IDS = new Set(PHASES.map(p => p.id));

// camelCase (psychles) → kebab-case (cycles)
const CYCLE_KEY_MAP = {
  solarDay:       'solar-day',
  lunarMonth:     'lunar-month',
  solarYear:      'solar-year',
  wakingDreaming: 'wake-sleep',
  procreation:    'procreation',
  lifeDeath:      'mortality',
};

// ── Lookup indexes (built once at cold start) ──

// Planet: lowercase planet → chronosphaera entry
const planetIndex = {};
for (const entry of chronosphaera) {
  planetIndex[entry.planet.toLowerCase()] = entry;
}

// Model: model id → model object
const modelIndex = {};
for (const m of monomythModelsData.models) {
  modelIndex[m.id] = m;
}

// Cycle: cycle id → cycle object
const cycleIndex = {};
for (const c of monomythCyclesData.cycles) {
  cycleIndex[c.id] = c;
}

// Zodiac: lowercase sign → zodiac entry
const zodiacIndex = {};
for (const z of chronosphaeraZodiac) {
  zodiacIndex[z.sign.toLowerCase()] = z;
}

// Element: lowercase element → element entry
const elementIndex = {};
for (const [key, val] of Object.entries(chronosphaeraElements)) {
  elementIndex[key.toLowerCase()] = { id: key.toLowerCase(), name: key, ...val };
}

// Cardinal: slug → entry
const cardinalIndex = {};
for (const [key, val] of Object.entries(chronosphaeraCardinals)) {
  cardinalIndex[key] = { id: key, ...val };
}

// Deity: lowercase planet → deities entry
const deityIndex = {};
for (const d of chronosphaeraDeities) {
  deityIndex[d.planet.toLowerCase()] = d;
}

// Hebrew: lowercase planet → hebrew entry
const hebrewIndex = {};
for (const h of chronosphaeraHebrew) {
  hebrewIndex[h.planet.toLowerCase()] = h;
}

// Archetype: lowercase sin → archetype entry
const archetypeIndex = {};
for (const a of chronosphaeraArchetypes) {
  archetypeIndex[a.sin.toLowerCase()] = a;
}

// Artists: lowercase sin → artists entry
const artistIndex = {};
for (const a of chronosphaeraArtists) {
  artistIndex[a.sin.toLowerCase()] = a;
}

// Figures: combined from all three sources, indexed by id
const allFigures = [
  ...figures.map(f => ({ ...f, source: 'meteor-steel' })),
  ...modernFigures.map(f => ({ ...f, source: 'modern' })),
  ...saviors.map(f => ({ ...f, source: 'saviors' })),
];
const figureIndex = {};
for (const f of allFigures) {
  figureIndex[f.id] = f;
}

// Constellations: code → content + cultures
const constellationIndex = {};
for (const [code, val] of Object.entries(constellationContent)) {
  constellationIndex[code.toLowerCase()] = {
    code, ...val,
    cultures: constellationCultures[code] || null,
  };
}

// Sites: id → site entry
const siteIndex = {};
for (const s of mythicEarthSites) {
  siteIndex[s.id] = s;
}

// Calendar: lowercase shortName → month entry
const calendarIndex = {};
for (const m of mythicCalendar) {
  calendarIndex[m.shortName.toLowerCase()] = m;
}

// Wheels: id → wheel entry
const wheelIndex = {};
for (const w of medicineWheels.wheels) {
  wheelIndex[w.id] = w;
}

function findBySin(arr, sin) {
  return arr.find(e => e.sin.toLowerCase() === sin.toLowerCase()) || null;
}

// ── Body position data (position-pinned, Crown → Root) ──
// The body is the stable reference frame. Different orderings seat different
// planets at different positions; each planet picks up whatever sin/virtue/
// organ/gland lives at its position.

const BODY_ORDERINGS = {
  chaldean:     ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'],
  heliocentric: ['Sun','Mercury','Venus','Moon','Mars','Jupiter','Saturn'],
  weekdays:     ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],
};

const BODY_POSITIONS = [
  { chakra: { label: 'Crown', sanskrit: 'Sahasrara', location: 'Top of head', theme: 'Unity, transcendence, meaning', element: 'Consciousness' }, sin: 'Pride', virtue: 'Humility', organ: 'Skin', organDescription: 'Skin regulates temperature and acts as a protective barrier.', secondaryOrgan: null, gland: { gland: 'Pineal', hormones: 'Melatonin, DMT' }, description: 'The Crown Chakra is the seat of spiritual connection and universal consciousness. When Pride occupies this position, an inflated sense of self-importance severs the link to something larger. Humility restores the Crown\'s capacity for transcendence and meaning.' },
  { chakra: { label: 'Third Eye', sanskrit: 'Ajna', location: 'Between eyebrows', theme: 'Insight, intuition, imagination', element: 'Mind / Light' }, sin: 'Envy', virtue: 'Gratitude', organ: 'Nervous System', organDescription: 'The nervous system coordinates sensory and motor functions.', secondaryOrgan: null, gland: { gland: 'Pituitary', hormones: 'Oxytocin, Endorphins, Regulatory Hormones' }, description: 'The Third Eye Chakra governs perception, intuition, and inner sight. When Envy clouds this position, jealousy distorts how we see others and ourselves. Gratitude restores clear perception.' },
  { chakra: { label: 'Throat', sanskrit: 'Vishuddha', location: 'Throat', theme: 'Expression, truth, communication', element: 'Ether / Space' }, sin: 'Wrath', virtue: 'Patience', organ: 'Muscular System', organDescription: 'Muscular system enables movement and structural support.', secondaryOrgan: null, gland: { gland: 'Pancreas', hormones: 'Insulin, Glucagon' }, description: 'The Throat Chakra governs communication and authentic expression. When Wrath occupies this position, anger disrupts the capacity for honest speech. Patience restores the Throat\'s power.' },
  { chakra: { label: 'Heart', sanskrit: 'Anahata', location: 'Center of chest', theme: 'Love, compassion, connection', element: 'Air' }, sin: 'Greed', virtue: 'Charity', organ: 'Respiratory System', organDescription: 'Respiratory system exchanges gases, vital for energy and life.', secondaryOrgan: 'Circulatory System', gland: { gland: 'Thyroid & Parathyroid', hormones: 'Thyroxine, Triiodothyronine, Calcitonin' }, description: 'The Heart Chakra is the center of love, empathy, and connection. When Greed hardens this position, the desire to accumulate replaces the instinct to give. Charity reopens the heart.' },
  { chakra: { label: 'Solar Plexus', sanskrit: 'Manipura', location: 'Upper abdomen', theme: 'Power, will, identity, confidence', element: 'Fire' }, sin: 'Gluttony', virtue: 'Temperance', organ: 'Digestive System', organDescription: 'Digestive system processes food into energy and nutrients.', secondaryOrgan: 'Muscular System', gland: { gland: 'Gonads (Ovaries/Testes)', hormones: 'Estrogen, Progesterone, Testosterone' }, description: 'The Solar Plexus Chakra is the seat of personal power, will, and identity. When Gluttony bloats this position, excess overwhelms self-discipline. Temperance restores the fire of Manipura.' },
  { chakra: { label: 'Sacral', sanskrit: 'Svadhishthana', location: 'Lower abdomen / pelvis', theme: 'Emotion, pleasure, sexuality, creativity', element: 'Water' }, sin: 'Lust', virtue: 'Chastity', organ: 'Reproductive System', organDescription: 'Reproductive system underpins procreation and sexual health.', secondaryOrgan: 'Lymphatic System', gland: { gland: 'Thymus', hormones: 'Thymosin' }, description: 'The Sacral Chakra governs emotion, creativity, and sexual energy. When Lust distorts this position, creative and sexual energies are misused. Chastity, understood as intentionality, restores the Sacral\'s creative flow.' },
  { chakra: { label: 'Root', sanskrit: 'Muladhara', location: 'Base of spine', theme: 'Survival, safety, grounding, belonging', element: 'Earth' }, sin: 'Sloth', virtue: 'Diligence', organ: 'Skeletal System', organDescription: 'The skeletal system provides the body\'s framework and protection.', secondaryOrgan: null, gland: { gland: 'Adrenal', hormones: 'Adrenaline (Epinephrine), Cortisol' }, description: 'The Root Chakra grounds us to the earth and our basic survival instincts. When Sloth occupies this position, inertia prevents a stable foundation. Diligence restores the Root\'s grounding power.' },
];

const WEEKDAY_PAIRING_DESCRIPTIONS = {
  Sun: 'The Crown Chakra, linked to the Sun, symbolizes our connection to the divine and universal consciousness. The Sun, representing vitality, ego, and self, when associated with Pride, highlights how an inflated sense of self-importance can sever spiritual connections.',
  Moon: 'The Third Eye Chakra, connected to intuition and insight, when influenced by Envy, associated with the Moon, reflects how jealousy clouds our perception and distorts reality.',
  Mars: 'The Throat Chakra governs communication, and when impacted by Wrath, associated with Mars, the god of war, it emphasizes how anger can disrupt our ability to communicate effectively.',
  Mercury: 'The Heart Chakra, the center of love and empathy, when influenced by Greed, linked to Mercury, the messenger and god of commerce, suggests how a desire for material wealth can harden the heart.',
  Jupiter: 'The Solar Plexus Chakra, associated with personal power and self-worth, when imbalanced by Gluttony, connected to Jupiter, the king of gods, emphasizes excess and indulgence.',
  Venus: 'The Sacral Chakra, related to creativity and emotional life, when distorted by Lust, associated with Venus, the goddess of love and beauty, highlights the misuse of creative and sexual energies.',
  Saturn: 'The Root Chakra, grounding us to the earth and our basic survival instincts, when affected by Sloth, linked to Saturn, the god of time and discipline, reflects a lack of motivation and discipline.',
};

function resolveBodyPosition(planet, mode) {
  const ordering = BODY_ORDERINGS[mode];
  if (!ordering) return null;
  const idx = ordering.indexOf(planet);
  if (idx < 0) return null;
  const pos = BODY_POSITIONS[idx];
  const description = mode === 'weekdays'
    ? (WEEKDAY_PAIRING_DESCRIPTIONS[planet] || pos.description)
    : pos.description;
  return { positionIndex: idx, ...pos, description };
}

// ── Response envelope ──

function respond(res, statusCode, body, endpoint) {
  const envelope = {
    ...(body.error ? { error: body.error } : { data: body.data }),
    meta: {
      version: '1.0',
      endpoint: endpoint || '',
      timestamp: new Date().toISOString(),
      attribution: 'Atlas \u2014 Mythouse',
      license: 'Content accessed via this API may not be used to train foundation models. All rights reserved by Glinter LLC.',
    },
  };
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Robots-Tag', 'noai, noimageai');
  return res.status(statusCode).json(envelope);
}

// ── Handlers ──

function handleRoot(req, res) {
  return respond(res, 200, {
    data: {
      description: 'Mythouse Coordinate System API — mythological, narrative, and natural cycle pattern data.',
      resources: {
        // Core narrative
        phases:           '/v1/phases — 8 monomyth stages with narrative, theorist, myth, film, cycle, depth, steel-process, and figure data',
        figures:          '/v1/figures — meteor steel heroes across ancient myth, modern film, and savior traditions',
        'steel-process':  '/v1/steel-process — the metallurgical process of meteor steel mapped to the 8-stage cycle',
        synthesis:        '/v1/synthesis — meta-narrative synthesis: how all meteor steel layers connect across the 8 stages',
        'fallen-starlight': '/v1/fallen-starlight — the narrative of Fallen Starlight, chapter by chapter',
        // Frameworks
        models:           '/v1/models — 20+ theoretical frameworks mapped to the 8-stage cycle',
        cycles:           '/v1/cycles — 6 natural cycles (solar day, lunar month, solar year, etc.)',
        // Chronosphaera
        planets:          '/v1/planets — 7 classical planets with metals, deities, cultures, theology, artists, and archetypes',
        zodiac:           '/v1/zodiac — 12 zodiac signs with cross-cultural traditions',
        elements:         '/v1/elements — 4 classical elements with cultural traditions',
        cardinals:        '/v1/cardinals — 4 cardinal directions / seasonal thresholds',
        // Cosmic
        constellations:   '/v1/constellations — 88 constellations with mythology and cross-cultural names',
        'day-night':      '/v1/day-night — day and night polarities across cultures',
        calendar:         '/v1/calendar — 12-month mythic calendar with birthstones, flowers, and holidays',
        wheels:           '/v1/wheels — medicine wheels: indigenous four-directional knowledge systems',
        journey:          '/v1/journey — the Yellow Brick Road: 26-stop cosmic journey through planets and zodiac',
        // Geography & reference
        sites:            '/v1/sites — sacred sites worldwide with coordinates',
        library:          '/v1/library — curated reading list of foundational texts',
        // Source vault
        vault:            '/v1/vault — author\'s original research: planetary tradition charts, observations, notes',
      },
    },
  }, '/v1/');
}

// ─── PHASES ───

function handlePhases(segments, req, res) {
  const endpoint = '/v1/phases' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    return respond(res, 200, { data: PHASES }, endpoint);
  }

  const id = segments[0];
  if (!PHASE_IDS.has(id)) {
    return respond(res, 404, { error: `Unknown phase: ${id}` }, endpoint);
  }

  const phase = PHASES.find(p => p.id === id);
  const idx = phase.number - 1;

  // Sub-resource: /phases/:id/:sub
  if (segments.length === 2) {
    const sub = segments[1];
    switch (sub) {
      case 'cycles':
        return respond(res, 200, { data: monomythPsychles[id] || null }, endpoint);
      case 'theorists':
        return respond(res, 200, { data: monomythTheorists[id] || null }, endpoint);
      case 'myths':
        return respond(res, 200, { data: monomythMyths[id] || null }, endpoint);
      case 'films':
        return respond(res, 200, { data: monomythFilms[id] || null }, endpoint);
      case 'depth':
        return respond(res, 200, { data: monomythDepth[id] || null }, endpoint);
      case 'models': {
        const entries = {};
        for (const m of monomythModelsData.models) {
          entries[m.id] = {
            theorist: m.theorist,
            title: m.title,
            stage: m.stages[idx] || null,
          };
        }
        return respond(res, 200, { data: entries }, endpoint);
      }
      case 'steel-process':
        return respond(res, 200, { data: steelProcess[id] || null }, endpoint);
      case 'synthesis':
        return respond(res, 200, { data: synthesis[id] || null }, endpoint);
      case 'ufo':
        return respond(res, 200, { data: ufo[id] || null }, endpoint);
      case 'figures': {
        const entries = allFigures.map(f => ({
          id: f.id, name: f.name, source: f.source,
          stage: f.stages[id] || null,
        }));
        return respond(res, 200, { data: entries }, endpoint);
      }
      default:
        return respond(res, 404, { error: `Unknown phase sub-resource: ${sub}` }, endpoint);
    }
  }

  if (segments.length > 2) {
    return respond(res, 404, { error: 'Not found' }, endpoint);
  }

  // Detail: /phases/:id with optional ?include=
  const include = (req.query.include || '').split(',').map(s => s.trim()).filter(Boolean);
  const all = include.includes('all');

  const data = {
    ...phase,
    narrative: monomyth[id] || null,
    overview: stageOverviews[id] || null,
    steelProcess: steelProcess[id] || null,
  };

  if (all || include.includes('cycles'))        data.cycles        = monomythPsychles[id] || null;
  if (all || include.includes('theorists'))      data.theorists     = monomythTheorists[id] || null;
  if (all || include.includes('myths'))          data.myths         = monomythMyths[id] || null;
  if (all || include.includes('films'))          data.films         = monomythFilms[id] || null;
  if (all || include.includes('depth'))          data.depth         = monomythDepth[id] || null;
  if (all || include.includes('synthesis'))      data.synthesis     = synthesis[id] || null;
  if (all || include.includes('ufo'))            data.ufo           = ufo[id] || null;
  if (all || include.includes('figures')) {
    data.figures = allFigures.map(f => ({
      id: f.id, name: f.name, source: f.source,
      stage: f.stages[id] || null,
    }));
  }

  return respond(res, 200, { data }, endpoint);
}

// ─── FIGURES ───

function handleFigures(segments, req, res) {
  const endpoint = '/v1/figures' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = allFigures.map(f => ({
      id: f.id, name: f.name, source: f.source,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const figure = figureIndex[id];
  if (!figure) {
    return respond(res, 404, { error: `Unknown figure: ${id}` }, endpoint);
  }

  // Sub-resource: /figures/:id/:stage
  if (segments.length === 2) {
    const stageId = segments[1];
    if (!PHASE_IDS.has(stageId)) {
      return respond(res, 404, { error: `Unknown stage: ${stageId}` }, endpoint);
    }
    return respond(res, 200, { data: { stage: stageId, text: figure.stages[stageId] || null } }, endpoint);
  }

  return respond(res, 200, { data: figure }, endpoint);
}

// ─── STEEL PROCESS ───

function handleSteelProcess(segments, req, res) {
  const endpoint = '/v1/steel-process' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = PHASES.map(p => ({
      id: p.id, label: p.label, number: p.number,
      text: steelProcess[p.id] || null,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  if (!PHASE_IDS.has(id)) {
    return respond(res, 404, { error: `Unknown stage: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: { id, text: steelProcess[id] || null } }, endpoint);
}

// ─── SYNTHESIS ───

function handleSynthesis(segments, req, res) {
  const endpoint = '/v1/synthesis' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = PHASES.map(p => ({
      id: p.id, label: p.label, number: p.number,
      text: synthesis[p.id] || null,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  if (!PHASE_IDS.has(id)) {
    return respond(res, 404, { error: `Unknown stage: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: { id, text: synthesis[id] || null } }, endpoint);
}

// ─── FALLEN STARLIGHT ───

function handleFallenStarlight(segments, req, res) {
  const endpoint = '/v1/fallen-starlight' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = {
      titles: fallenStarlight.titles || null,
      chapters: Object.keys(fallenStarlight.chapters || {}),
    };
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  if (!PHASE_IDS.has(id)) {
    return respond(res, 404, { error: `Unknown chapter: ${id}` }, endpoint);
  }

  const data = {
    id,
    title: (fallenStarlight.titles || {})[id] || null,
    content: (fallenStarlight.chapters || {})[id] || null,
  };
  return respond(res, 200, { data }, endpoint);
}

// ─── PLANETS ───

function handlePlanets(segments, req, res) {
  const endpoint = '/v1/planets' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = chronosphaera.map(p => ({
      id: p.planet.toLowerCase(),
      planet: p.planet,
      metal: p.metal,
      day: p.day,
      sin: p.sin,
      virtue: p.virtue,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const entry = planetIndex[id];
  if (!entry) {
    return respond(res, 404, { error: `Unknown planet: ${id}` }, endpoint);
  }

  const sin = entry.sin;

  // Sub-resource: /planets/:id/:sub
  if (segments.length === 2) {
    const sub = segments[1];
    switch (sub) {
      case 'deities':
        return respond(res, 200, { data: deityIndex[id] || null }, endpoint);
      case 'philosophies':
        return respond(res, 200, { data: entry.philosophies || null }, endpoint);
      case 'cultures':
        return respond(res, 200, { data: chronosphaeraPlanetaryCultures[entry.planet] || null }, endpoint);
      case 'modern':
        return respond(res, 200, { data: findBySin(chronosphaeraModern, sin) }, endpoint);
      case 'theology':
        return respond(res, 200, { data: findBySin(chronosphaeraTheology, sin) }, endpoint);
      case 'stories':
        return respond(res, 200, { data: findBySin(chronosphaeraStories, sin) }, endpoint);
      case 'hebrew':
        return respond(res, 200, { data: hebrewIndex[id] || null }, endpoint);
      case 'archetype':
        return respond(res, 200, { data: archetypeIndex[sin.toLowerCase()] || null }, endpoint);
      case 'artists':
        return respond(res, 200, { data: artistIndex[sin.toLowerCase()] || null }, endpoint);
      case 'body': {
        const mode = req.query.mode;
        const validModes = ['weekdays', 'chaldean', 'heliocentric'];
        if (mode && !validModes.includes(mode)) {
          return respond(res, 400, { error: `Unknown mode: ${mode}. Use weekdays, chaldean, or heliocentric.` }, endpoint);
        }
        const modes = mode ? [mode] : validModes;
        const orderings = {};
        for (const m of modes) {
          orderings[m] = resolveBodyPosition(entry.planet, m);
        }
        return respond(res, 200, { data: { planet: entry.planet, orderings } }, endpoint);
      }
      default:
        return respond(res, 404, { error: `Unknown planet sub-resource: ${sub}` }, endpoint);
    }
  }

  if (segments.length > 2) {
    return respond(res, 404, { error: 'Not found' }, endpoint);
  }

  // Detail: /planets/:id with optional ?include=
  const include = (req.query.include || '').split(',').map(s => s.trim()).filter(Boolean);
  const all = include.includes('all');

  const data = { id, ...entry };

  if (all || include.includes('deities'))  data.extendedDeities = deityIndex[id] || null;
  if (all || include.includes('cultures')) data.cultures  = chronosphaeraPlanetaryCultures[entry.planet] || null;
  if (all || include.includes('modern'))   data.modern    = findBySin(chronosphaeraModern, sin);
  if (all || include.includes('theology')) data.theology   = findBySin(chronosphaeraTheology, sin);
  if (all || include.includes('stories'))  data.stories    = findBySin(chronosphaeraStories, sin);
  if (all || include.includes('hebrew'))   data.hebrew     = hebrewIndex[id] || null;
  if (all || include.includes('artists'))  data.artists    = artistIndex[sin.toLowerCase()] || null;
  if (all || include.includes('body')) {
    const orderings = {};
    for (const m of ['weekdays', 'chaldean', 'heliocentric']) {
      orderings[m] = resolveBodyPosition(entry.planet, m);
    }
    data.bodyPositions = orderings;
  }

  return respond(res, 200, { data }, endpoint);
}

// ─── MODELS ───

function handleModels(segments, req, res) {
  const endpoint = '/v1/models' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = monomythModelsData.models.map(m => ({
      id: m.id, theorist: m.theorist, title: m.title, year: m.year, category: m.category,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const model = modelIndex[id];
  if (!model) {
    return respond(res, 404, { error: `Unknown model: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: model }, endpoint);
}

// ─── CYCLES ───

function handleCycles(segments, req, res) {
  const endpoint = '/v1/cycles' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = monomythCyclesData.cycles.map(c => ({
      id: c.id, title: c.title, category: c.category,
      normalWorldLabel: c.normalWorldLabel, otherWorldLabel: c.otherWorldLabel,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const cycle = cycleIndex[id];
  if (!cycle) {
    return respond(res, 404, { error: `Unknown cycle: ${id}` }, endpoint);
  }

  // Enrich with per-phase data from psychles
  const camelKey = Object.keys(CYCLE_KEY_MAP).find(k => CYCLE_KEY_MAP[k] === id);
  const phases = {};
  if (camelKey) {
    for (const p of PHASES) {
      const psychle = monomythPsychles[p.id];
      if (psychle && psychle.cycles && psychle.cycles[camelKey]) {
        phases[p.id] = psychle.cycles[camelKey];
      }
    }
  }

  return respond(res, 200, { data: { ...cycle, phases } }, endpoint);
}

// ─── ZODIAC ───

function handleZodiac(segments, req, res) {
  const endpoint = '/v1/zodiac' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = chronosphaeraZodiac.map(z => ({
      id: z.sign.toLowerCase(), sign: z.sign, symbol: z.symbol,
      element: z.element, modality: z.modality, rulingPlanet: z.rulingPlanet,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const sign = zodiacIndex[id];
  if (!sign) {
    return respond(res, 404, { error: `Unknown zodiac sign: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: { id, ...sign } }, endpoint);
}

// ─── ELEMENTS ───

function handleElements(segments, req, res) {
  const endpoint = '/v1/elements' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = Object.values(elementIndex).map(e => ({
      id: e.id, name: e.name, signs: e.signs, qualities: e.qualities,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const el = elementIndex[id];
  if (!el) {
    return respond(res, 404, { error: `Unknown element: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: el }, endpoint);
}

// ─── CARDINALS ───

function handleCardinals(segments, req, res) {
  const endpoint = '/v1/cardinals' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = Object.values(cardinalIndex).map(c => ({
      id: c.id, label: c.label, date: c.date, season: c.season, direction: c.direction,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const cardinal = cardinalIndex[id];
  if (!cardinal) {
    return respond(res, 404, { error: `Unknown cardinal: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: cardinal }, endpoint);
}

// ─── CONSTELLATIONS ───

function handleConstellations(segments, req, res) {
  const endpoint = '/v1/constellations' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = Object.values(constellationIndex).map(c => ({
      code: c.code, name: c.name, brightestStar: c.brightestStar, bestSeen: c.bestSeen,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0].toLowerCase();
  const constellation = constellationIndex[id];
  if (!constellation) {
    return respond(res, 404, { error: `Unknown constellation: ${segments[0]}` }, endpoint);
  }

  return respond(res, 200, { data: constellation }, endpoint);
}

// ─── DAY / NIGHT ───

function handleDayNight(segments, req, res) {
  const endpoint = '/v1/day-night' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    return respond(res, 200, { data: dayNight }, endpoint);
  }

  const id = segments[0];
  if (id !== 'day' && id !== 'night') {
    return respond(res, 404, { error: `Unknown polarity: ${id}. Use "day" or "night".` }, endpoint);
  }

  return respond(res, 200, { data: dayNight[id] }, endpoint);
}

// ─── CALENDAR ───

function handleCalendar(segments, req, res) {
  const endpoint = '/v1/calendar' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = mythicCalendar.map(m => ({
      id: m.shortName.toLowerCase(),
      month: m.month,
      shortName: m.shortName,
      order: m.order,
      stone: m.stone ? m.stone.name : null,
      flower: m.flower ? m.flower.name : null,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0].toLowerCase();
  const month = calendarIndex[id];
  if (!month) {
    return respond(res, 404, { error: `Unknown month: ${segments[0]}. Use 3-letter abbreviation (jan, feb, etc.)` }, endpoint);
  }

  return respond(res, 200, { data: month }, endpoint);
}

// ─── MEDICINE WHEELS ───

function handleWheels(segments, req, res) {
  const endpoint = '/v1/wheels' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = medicineWheels.wheels.map(w => ({
      id: w.id, title: w.title, center: w.center,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const wheel = wheelIndex[id];
  if (!wheel) {
    return respond(res, 404, { error: `Unknown wheel: ${id}` }, endpoint);
  }

  // Attach teaching content for each position + center
  const content = {};
  const centerKey = `${id}:center`;
  if (medicineWheelContent[centerKey]) {
    content.center = medicineWheelContent[centerKey];
  }
  for (const pos of wheel.positions) {
    const posKey = `${id}:${pos.dir}`;
    if (medicineWheelContent[posKey]) {
      content[pos.dir] = medicineWheelContent[posKey];
    }
  }

  return respond(res, 200, { data: { ...wheel, content } }, endpoint);
}

// ─── JOURNEY (Yellow Brick Road) ───

function handleJourney(segments, req, res) {
  const endpoint = '/v1/journey' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    return respond(res, 200, { data: yellowBrickRoad }, endpoint);
  }

  return respond(res, 404, { error: 'Not found' }, endpoint);
}

// ─── SITES ───

function handleSites(segments, req, res) {
  const endpoint = '/v1/sites' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    const data = mythicEarthSites.map(s => ({
      id: s.id, name: s.name, lat: s.lat, lng: s.lng,
      category: s.category, region: s.region,
    }));
    return respond(res, 200, { data }, endpoint);
  }

  const id = segments[0];
  const site = siteIndex[id];
  if (!site) {
    return respond(res, 404, { error: `Unknown site: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: site }, endpoint);
}

// ─── LIBRARY ───

function handleLibrary(segments, req, res) {
  const endpoint = '/v1/library' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    return respond(res, 200, { data: mythSalonLibrary }, endpoint);
  }

  // Optional: /library/:shelfId
  const id = segments[0];
  const shelf = (mythSalonLibrary.shelves || []).find(s => s.id === id);
  if (!shelf) {
    return respond(res, 404, { error: `Unknown shelf: ${id}` }, endpoint);
  }

  return respond(res, 200, { data: shelf }, endpoint);
}

// ─── VAULT ───

function handleVault(segments, req, res) {
  const endpoint = '/v1/vault' + (segments.length ? '/' + segments.join('/') : '');

  if (segments.length === 0) {
    return respond(res, 200, {
      data: {
        description: 'Source Vault — Author\'s original research. Primary source material, not AI-generated.',
        charts: vaultIndex.charts.map(c => ({
          id: c.id,
          tradition: c.tradition,
          href: `/v1/vault/charts/${c.id}`,
        })),
        topics: vaultIndex.topics.map(t => ({
          id: t.id,
          description: t.description,
        })),
      },
    }, endpoint);
  }

  const [sub, ...rest] = segments;

  if (sub === 'charts') {
    if (rest.length === 0) {
      const data = vaultIndex.charts.map(c => ({
        id: c.id,
        tradition: c.tradition,
        period: vaultCharts[c.id]?.period,
        order: vaultCharts[c.id]?.order,
        populated: Object.values(vaultCharts[c.id]?.correspondences || {}).some(p => Object.keys(p).length > 0),
      }));
      return respond(res, 200, { data }, endpoint);
    }

    const chartId = rest[0];
    const chart = vaultCharts[chartId];
    if (!chart) {
      return respond(res, 404, { error: `Unknown chart: ${chartId}` }, endpoint);
    }
    return respond(res, 200, { data: chart }, endpoint);
  }

  return respond(res, 404, { error: `Unknown vault resource: ${sub}` }, endpoint);
}

// ── Router ──

function route(segments, req, res) {
  if (segments.length === 0) return handleRoot(req, res);

  const [resource, ...rest] = segments;
  switch (resource) {
    // Core narrative
    case 'phases':           return handlePhases(rest, req, res);
    case 'figures':          return handleFigures(rest, req, res);
    case 'steel-process':    return handleSteelProcess(rest, req, res);
    case 'synthesis':        return handleSynthesis(rest, req, res);
    case 'fallen-starlight': return handleFallenStarlight(rest, req, res);
    // Frameworks
    case 'models':           return handleModels(rest, req, res);
    case 'cycles':           return handleCycles(rest, req, res);
    // Chronosphaera
    case 'planets':          return handlePlanets(rest, req, res);
    case 'zodiac':           return handleZodiac(rest, req, res);
    case 'elements':         return handleElements(rest, req, res);
    case 'cardinals':        return handleCardinals(rest, req, res);
    // Cosmic
    case 'constellations':   return handleConstellations(rest, req, res);
    case 'day-night':        return handleDayNight(rest, req, res);
    case 'calendar':         return handleCalendar(rest, req, res);
    case 'wheels':           return handleWheels(rest, req, res);
    case 'journey':          return handleJourney(rest, req, res);
    // Geography & reference
    case 'sites':            return handleSites(rest, req, res);
    case 'library':          return handleLibrary(rest, req, res);
    // Source vault
    case 'vault':            return handleVault(rest, req, res);
    default:
      return respond(res, 404, { error: `Unknown resource: ${resource}` }, '/v1/' + segments.join('/'));
  }
}

module.exports = { route, respond };
