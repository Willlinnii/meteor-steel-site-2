// api/_lib/contentIndex.js
// Flat searchable index of all Mythouse content — built once at cold start.
// Used by teacher.js for syllabus-to-content matching.

// ── Data imports (require for Vercel bundler, matching dataApi.js pattern) ──

// --- Pantheons (78 cultures) ---
const pantheonFiles = [
  require('../../src/data/olympianPantheon.json'),
  require('../../src/data/hinduPantheon.json'),
  require('../../src/data/yorubaPantheon.json'),
  require('../../src/data/maoriPantheon.json'),
  require('../../src/data/incaPantheon.json'),
  require('../../src/data/chinesePantheon.json'),
  require('../../src/data/aztecPantheon.json'),
  require('../../src/data/shintoPantheon.json'),
  require('../../src/data/norsePantheon.json'),
  require('../../src/data/hawaiianPantheon.json'),
  require('../../src/data/sumerianPantheon.json'),
  require('../../src/data/slavicPantheon.json'),
  require('../../src/data/egyptianPantheon.json'),
  require('../../src/data/zoroastrianPantheon.json'),
  require('../../src/data/canaanitePantheon.json'),
  require('../../src/data/celticIrishPantheon.json'),
  require('../../src/data/hopiPantheon.json'),
  require('../../src/data/romanPantheon.json'),
  require('../../src/data/koreanPantheon.json'),
  require('../../src/data/finnishPantheon.json'),
  require('../../src/data/navajoPantheon.json'),
  require('../../src/data/lakotaPantheon.json'),
  require('../../src/data/aboriginalPantheon.json'),
  require('../../src/data/fonPantheon.json'),
  require('../../src/data/armenianPantheon.json'),
  require('../../src/data/mongolianPantheon.json'),
  require('../../src/data/balticPantheon.json'),
  require('../../src/data/mayaPantheon.json'),
  require('../../src/data/akanPantheon.json'),
  require('../../src/data/hittitePantheon.json'),
  require('../../src/data/algonquinPantheon.json'),
  require('../../src/data/mapuchePantheon.json'),
  require('../../src/data/tibetanPantheon.json'),
  require('../../src/data/haidaPantheon.json'),
  require('../../src/data/etruscanPantheon.json'),
  require('../../src/data/berberPantheon.json'),
  require('../../src/data/georgianPantheon.json'),
  require('../../src/data/haudenosauneePantheon.json'),
  require('../../src/data/basquePantheon.json'),
  require('../../src/data/sanPantheon.json'),
  require('../../src/data/tahitianPantheon.json'),
  require('../../src/data/samoanPantheon.json'),
  require('../../src/data/vedicPantheon.json'),
  require('../../src/data/zuluPantheon.json'),
  require('../../src/data/tainoPantheon.json'),
  require('../../src/data/khmerPantheon.json'),
  require('../../src/data/vietnamesePantheon.json'),
  require('../../src/data/inuitPantheon.json'),
  require('../../src/data/celticWelshPantheon.json'),
  require('../../src/data/guaraniPantheon.json'),
  require('../../src/data/igboPantheon.json'),
  require('../../src/data/phoenicianPantheon.json'),
  require('../../src/data/candoblePantheon.json'),
  require('../../src/data/dogonPantheon.json'),
  require('../../src/data/babylonianPantheon.json'),
  require('../../src/data/thaiPantheon.json'),
  require('../../src/data/ainuPantheon.json'),
  require('../../src/data/javanesePantheon.json'),
  require('../../src/data/samiPantheon.json'),
  require('../../src/data/scythianPantheon.json'),
  require('../../src/data/tonganPantheon.json'),
  require('../../src/data/celtiberianPantheon.json'),
  require('../../src/data/bugandaPantheon.json'),
  require('../../src/data/muiscaPantheon.json'),
  require('../../src/data/mandePantheon.json'),
  require('../../src/data/malagasyPantheon.json'),
  require('../../src/data/haitianVodouPantheon.json'),
  require('../../src/data/melanesianPantheon.json'),
  require('../../src/data/arabianPantheon.json'),
  require('../../src/data/angloSaxonPantheon.json'),
  require('../../src/data/cheyennePantheon.json'),
  require('../../src/data/phrygianPantheon.json'),
  require('../../src/data/filipinoPantheon.json'),
  require('../../src/data/minoanPantheon.json'),
  require('../../src/data/zapotecPantheon.json'),
  require('../../src/data/cherokeePantheon.json'),
  require('../../src/data/elamitePantheon.json'),
  require('../../src/data/arthurianPantheon.json'),
];

// --- Core data ---
const mythicEarthSites   = require('../../src/data/mythicEarthSites.json');
const mythSalonLibrary   = require('../../src/data/mythSalonLibrary.json');
const monomyth           = require('../../src/data/monomyth.json');
const stageOverviews     = require('../../src/data/stageOverviews.json');
const monomythModels     = require('../../src/data/monomythModels.json');
const monomythTheorists  = require('../../src/data/monomythTheorists.json');
const monomythMyths      = require('../../src/data/monomythMyths.json');
const monomythFilms      = require('../../src/data/monomythFilms.json');
const monomythCycles     = require('../../src/data/monomythCycles.json');
const figures            = require('../../src/data/figures.json');
const modernFigures      = require('../../src/data/modernFigures.json');
const saviors            = require('../../src/data/saviors.json');
const constellationContent = require('../../src/data/constellationContent.json');
const chronosphaera      = require('../../src/data/chronosphaera.json');
const chronosphaeraZodiac = require('../../src/data/chronosphaeraZodiac.json');
const chronosphaeraElements = require('../../src/data/chronosphaeraElements.json');
const chronosphaeraCardinals = require('../../src/data/chronosphaeraCardinals.json');
const chronosphaeraArchetypes = require('../../src/data/chronosphaeraArchetypes.json');
const mythsEpisodes      = require('../../src/data/mythsEpisodes.json');
const medicineWheels     = require('../../src/data/medicineWheels.json');
const fallenStarlight    = require('../../src/data/fallenStarlight.json');
const mythicCalendar     = require('../../src/data/mythicCalendar.json');

// ── Monomyth stage labels ──
const STAGE_LABELS = {
  'golden-age': 'Golden Age / Surface',
  'falling-star': 'Falling Star / Calling',
  'impact-crater': 'Impact Crater / Crossing',
  'forge': 'Forge / Initiation',
  'quenching': 'Quenching / Nadir',
  'integration': 'Integration / Return',
  'drawing': 'Drawing / Resurrection',
  'new-age': 'New Age / New World',
};
const STAGE_IDS = Object.keys(STAGE_LABELS);

// ── Build the content index (once at cold start) ──

const contentIndex = [];

function add(item) {
  contentIndex.push(item);
}

// --- 1. Pantheon deities ---
for (const pantheon of pantheonFiles) {
  const culture = pantheon.name || pantheon.id;
  for (const deity of (pantheon.deities || [])) {
    const kw = [deity.name, culture, pantheon.id];
    if (deity.title) kw.push(deity.title);
    if (deity.group) kw.push(deity.group);
    if (Array.isArray(deity.animals)) kw.push(...deity.animals);
    add({
      id: `pantheon.${pantheon.id}.${deity.id}`,
      category: 'pantheon',
      subcategory: pantheon.id,
      name: `${deity.name} (${culture})`,
      keywords: kw,
      route: '/myths',
      description: deity.title || '',
    });
  }
}

// --- 2. Sacred sites ---
for (const site of mythicEarthSites) {
  const kw = [site.name, site.category || ''];
  if (site.region) kw.push(site.region);
  if (Array.isArray(site.pantheons)) kw.push(...site.pantheons);
  add({
    id: `sacred-site.${site.id}`,
    category: 'sacred-site',
    subcategory: site.category || 'site',
    name: site.name,
    keywords: kw,
    route: '/mythic-earth',
    description: (site.description || '').slice(0, 120),
  });
}

// --- 3. Library books ---
for (const shelf of (mythSalonLibrary.shelves || [])) {
  for (const book of (shelf.books || [])) {
    add({
      id: `library.${shelf.id}.${(book.title || '').replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`,
      category: 'library',
      subcategory: shelf.id,
      name: `${book.title} by ${book.author}`,
      keywords: [book.title, book.author, shelf.name],
      route: '/library',
      description: shelf.name,
    });
  }
}

// --- 4. Monomyth stages ---
for (const stageId of STAGE_IDS) {
  const label = STAGE_LABELS[stageId];
  const overview = stageOverviews[stageId] || '';
  add({
    id: `monomyth-stage.${stageId}`,
    category: 'monomyth-stage',
    subcategory: stageId,
    name: label,
    keywords: [label, 'monomyth', 'hero journey', 'stage', stageId],
    route: '/monomyth',
    description: (typeof overview === 'string' ? overview : '').slice(0, 120),
  });
}

// --- 5. Monomyth models ---
for (const model of (monomythModels.models || [])) {
  add({
    id: `monomyth-model.${model.id}`,
    category: 'monomyth-model',
    subcategory: model.category || '',
    name: `${model.title} (${model.theorist})`,
    keywords: [model.title, model.theorist, model.source || '', model.category || '', 'model', 'framework'],
    route: '/monomyth',
    description: model.source || '',
  });
}

// --- 6. Theorists ---
for (const stageId of STAGE_IDS) {
  const stageData = monomythTheorists[stageId];
  if (!stageData) continue;
  for (const group of Object.values(stageData)) {
    for (const [key, theorist] of Object.entries(group)) {
      add({
        id: `theorist.${stageId}.${key}`,
        category: 'theorist',
        subcategory: stageId,
        name: theorist.name || key,
        keywords: [theorist.name || key, theorist.concept || '', stageId, 'theorist'],
        route: '/monomyth',
        description: theorist.concept || '',
      });
    }
  }
}

// --- 7. Monomyth myths (savior figures mapped to stages) ---
for (const stageId of STAGE_IDS) {
  const stageMyths = monomythMyths[stageId];
  if (!stageMyths) continue;
  for (const [key, myth] of Object.entries(stageMyths)) {
    add({
      id: `monomyth-myth.${stageId}.${key}`,
      category: 'monomyth-myth',
      subcategory: stageId,
      name: myth.title || key,
      keywords: [myth.title || key, myth.tradition || '', stageId, 'myth'],
      route: '/monomyth',
      description: myth.tradition || '',
    });
  }
}

// --- 8. Monomyth films ---
for (const stageId of STAGE_IDS) {
  const stageFilms = monomythFilms[stageId];
  if (!stageFilms) continue;
  for (const [key, film] of Object.entries(stageFilms)) {
    add({
      id: `monomyth-film.${stageId}.${key}`,
      category: 'monomyth-film',
      subcategory: stageId,
      name: `${film.title} (${film.year || ''})`,
      keywords: [film.title, key, stageId, 'film', 'movie'],
      route: '/monomyth',
      description: `Film mapped to ${STAGE_LABELS[stageId] || stageId}`,
    });
  }
}

// --- 9. Natural cycles ---
for (const cycle of (monomythCycles.cycles || [])) {
  add({
    id: `cycle.${cycle.id}`,
    category: 'cycle',
    subcategory: cycle.category || '',
    name: cycle.title,
    keywords: [cycle.title, cycle.source || '', cycle.category || '', 'cycle', 'natural'],
    route: '/monomyth',
    description: cycle.source || '',
  });
}

// --- 10. Figures (mythological) ---
for (const fig of figures) {
  add({
    id: `figure.${fig.id}`,
    category: 'figure',
    subcategory: 'mythological',
    name: fig.name,
    keywords: [fig.name, 'figure', 'mythological', 'hero'],
    route: '/home',
    description: 'Mythological figure',
  });
}

// --- 11. Modern figures ---
for (const fig of modernFigures) {
  add({
    id: `figure.modern.${fig.id}`,
    category: 'figure',
    subcategory: 'modern',
    name: fig.name,
    keywords: [fig.name, 'figure', 'modern', 'pop culture'],
    route: '/home',
    description: 'Modern figure',
  });
}

// --- 12. Saviors ---
for (const sav of saviors) {
  add({
    id: `savior.${sav.id}`,
    category: 'savior',
    subcategory: '',
    name: sav.name,
    keywords: [sav.name, 'savior', 'religious', 'mythological'],
    route: '/home',
    description: 'Savior figure',
  });
}

// --- 13. Constellations ---
for (const [code, con] of Object.entries(constellationContent)) {
  add({
    id: `constellation.${code}`,
    category: 'constellation',
    subcategory: '',
    name: con.name,
    keywords: [con.name, con.brightestStar || '', 'constellation', 'star', code],
    route: '/chronosphaera',
    description: con.bestSeen ? `Best seen: ${con.bestSeen}` : '',
  });
}

// --- 14. Planets ---
for (const planet of chronosphaera) {
  const kw = [planet.planet, planet.metal, planet.day, planet.sin, planet.virtue, 'planet'];
  if (planet.body) {
    if (planet.body.organ) kw.push(planet.body.organ);
    if (planet.body.chakra) kw.push(planet.body.chakra);
  }
  if (planet.deities) {
    for (const d of Object.values(planet.deities)) {
      if (d.name) kw.push(d.name);
    }
  }
  add({
    id: `planet.${planet.planet.toLowerCase()}`,
    category: 'planet',
    subcategory: planet.metal,
    name: `${planet.planet} (${planet.metal})`,
    keywords: kw,
    route: '/chronosphaera',
    description: `Day: ${planet.day}, Metal: ${planet.metal}`,
  });
}

// --- 15. Zodiac ---
for (const sign of chronosphaeraZodiac) {
  add({
    id: `zodiac.${sign.sign.toLowerCase()}`,
    category: 'zodiac',
    subcategory: sign.element,
    name: sign.sign,
    keywords: [sign.sign, sign.element, sign.modality, sign.rulingPlanet, sign.archetype || '', sign.symbol, 'zodiac'],
    route: '/chronosphaera',
    description: `${sign.element} / ${sign.modality} — ${sign.dates}`,
  });
}

// --- 16. Classical elements ---
for (const [name, el] of Object.entries(chronosphaeraElements)) {
  add({
    id: `element.${name.toLowerCase()}`,
    category: 'element',
    subcategory: '',
    name: name,
    keywords: [name, ...(el.signs || []), 'element', 'classical'],
    route: '/chronosphaera',
    description: (el.qualities || '').slice(0, 120),
  });
}

// --- 17. Cardinal directions / seasons ---
for (const [key, card] of Object.entries(chronosphaeraCardinals)) {
  add({
    id: `cardinal.${key}`,
    category: 'cardinal',
    subcategory: card.season || '',
    name: card.label,
    keywords: [card.label, card.season || '', card.direction || '', card.zodiacCusp || '', 'cardinal', 'equinox', 'solstice'],
    route: '/chronosphaera',
    description: `${card.date} — ${card.direction || ''}`,
  });
}

// --- 18. Archetypes ---
for (const arch of chronosphaeraArchetypes) {
  add({
    id: `archetype.${arch.archetype.replace(/\s+/g, '-').toLowerCase()}`,
    category: 'archetype',
    subcategory: arch.metal || '',
    name: arch.archetype,
    keywords: [arch.archetype, arch.sin || '', arch.metal || '', 'archetype'],
    route: '/chronosphaera',
    description: `${arch.metal || ''} — ${arch.sin || ''}`,
  });
}

// --- 19. Games ---
const GAMES = [
  { id: 'senet', name: 'Senet', desc: 'Ancient Egyptian board game' },
  { id: 'ur', name: 'Royal Game of Ur', desc: 'Mesopotamian race game' },
  { id: 'mancala', name: 'Mancala', desc: 'African seed-counting game' },
  { id: 'go', name: 'Go', desc: 'Chinese strategy game' },
  { id: 'chess', name: 'Chess', desc: 'Strategic board game' },
  { id: 'tafl', name: 'Tafl', desc: 'Viking strategy game' },
  { id: 'patolli', name: 'Patolli', desc: 'Aztec board game' },
  { id: 'backgammon', name: 'Backgammon', desc: 'Ancient race game' },
];
for (const game of GAMES) {
  add({
    id: `game.${game.id}`,
    category: 'game',
    subcategory: '',
    name: game.name,
    keywords: [game.name, 'game', 'ancient', 'board game'],
    route: `/games/${game.id}`,
    description: game.desc,
  });
}

// --- 20. TV episodes ---
for (const ep of (mythsEpisodes.episodes || [])) {
  add({
    id: `tv-episode.${ep.id}`,
    category: 'tv-episode',
    subcategory: '',
    name: ep.title,
    keywords: [ep.title, 'episode', 'mythology channel', 'tv', 'video'],
    route: `/mythology-channel/${ep.id}`,
    description: (ep.summary || '').slice(0, 120),
  });
}

// --- 21. Medicine wheels ---
for (const wheel of (medicineWheels.wheels || [])) {
  const posLabels = (wheel.positions || []).map(p => p.label);
  add({
    id: `medicine-wheel.${wheel.id}`,
    category: 'medicine-wheel',
    subcategory: '',
    name: wheel.title,
    keywords: [wheel.title, wheel.center || '', ...posLabels, 'medicine wheel', 'indigenous', 'four directions'],
    route: '/chronosphaera',
    description: `Center: ${wheel.center || ''}`,
  });
}

// --- 22. Journeys (hardcoded since journeyDefs.js uses ES modules) ---
const JOURNEYS = [
  { id: 'monomyth', name: 'Monomyth Journey', desc: 'Hero\'s journey through 8 stages' },
  { id: 'meteor-steel', name: 'Meteor Steel Journey', desc: 'Metallurgical transformation cycle' },
  { id: 'planetary', name: 'Planetary Journey', desc: '7 classical planets ascending & descending' },
  { id: 'zodiac', name: 'Zodiac Journey', desc: '12 zodiac signs' },
  { id: 'consulting-storyteller', name: 'Storyteller Journey', desc: 'Creative consulting path' },
  { id: 'consulting-seeker', name: 'Seeker Journey', desc: 'Personal transformation path' },
  { id: 'consulting-brand', name: 'Brand Journey', desc: 'Brand mythology path' },
];
for (const j of JOURNEYS) {
  add({
    id: `journey.${j.id}`,
    category: 'journey',
    subcategory: '',
    name: j.name,
    keywords: [j.name, j.id, 'journey', 'ouroboros'],
    route: `/journey/${j.id}`,
    description: j.desc,
  });
}

// --- 23. Fallen Starlight chapters ---
for (const stageId of STAGE_IDS) {
  const title = (fallenStarlight.titles || {})[stageId];
  if (!title) continue;
  add({
    id: `fallen-starlight.${stageId}`,
    category: 'fallen-starlight',
    subcategory: stageId,
    name: title,
    keywords: [title, 'fallen starlight', 'story', 'chapter', stageId],
    route: '/fallen-starlight',
    description: 'Fallen Starlight chapter',
  });
}

// --- 24. Mythic calendar months ---
for (const month of mythicCalendar) {
  const kw = [month.month, month.shortName, 'calendar', 'month'];
  if (month.stone) kw.push(month.stone.name);
  if (month.flower) kw.push(month.flower.name);
  for (const h of (month.holidays || [])) {
    kw.push(h.name);
  }
  add({
    id: `calendar.${month.shortName.toLowerCase()}`,
    category: 'calendar',
    subcategory: '',
    name: `${month.month} — Mythic Calendar`,
    keywords: kw,
    route: '/chronosphaera',
    description: month.mood ? month.mood.slice(0, 120) : '',
  });
}

// ── Search function ──

function searchContent(searchTerms) {
  if (!searchTerms || !searchTerms.length) return [];

  const termsLower = searchTerms.map(t => t.toLowerCase().trim()).filter(Boolean);
  if (!termsLower.length) return [];

  const scored = [];

  for (const item of contentIndex) {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const kwLower = item.keywords.map(k => (k || '').toLowerCase());

    for (const term of termsLower) {
      // Exact name match (highest)
      if (nameLower === term) {
        score += 10;
      } else if (nameLower.includes(term)) {
        score += 5;
      }

      // Keyword exact match
      for (const kw of kwLower) {
        if (kw === term) {
          score += 5;
        } else if (kw.includes(term)) {
          score += 2;
        }
      }

      // Description substring
      if (item.description && item.description.toLowerCase().includes(term)) {
        score += 1;
      }

      // Category match
      if (item.category.toLowerCase() === term || item.subcategory.toLowerCase() === term) {
        score += 3;
      }
    }

    if (score > 0) {
      scored.push({ ...item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}

// ── Catalog summary (for client-side autocomplete) ──

function getContentCatalog() {
  return contentIndex.map(item => ({
    id: item.id,
    category: item.category,
    name: item.name,
    route: item.route,
  }));
}

// ── Exports ──

module.exports = { contentIndex, searchContent, getContentCatalog };
