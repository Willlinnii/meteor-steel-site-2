import monomythModels from './monomythModels.json';
import monomythCycles from './monomythCycles.json';
import monomythMyths from './monomythMyths.json';
import monomythFilms from './monomythFilms.json';
import monomythTheorists from './monomythTheorists.json';

export const MONOMYTH_STAGES = [
  { id: 'golden-age', label: 'Surface', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpduuWlv1HDEoVMtrhOhXF_' },
  { id: 'falling-star', label: 'Calling', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jto4aGkJe3hvMfHAvBO6XSxt' },
  { id: 'impact-crater', label: 'Crossing', flipLabel: true, playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtp43zjmPLi4xXkmC3N3yn8p' },
  { id: 'forge', label: 'Initiating', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtoxHSSqRRdiOhinC8Gua8mm' },
  { id: 'quenching', label: 'Nadir', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpw9cTgM3Kj5okUQr2zFK3v' },
  { id: 'integration', label: 'Return', playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtpSnXrPdWpxjvcrzzJ9dPJ7' },
  { id: 'drawing', label: 'Arrival', flipLabel: true, playlist: 'https://www.youtube.com/playlist?list=PLX31T_KS3jtp6RIa4-lI5UyDHjv0PJHfB' },
  { id: 'new-age', label: 'Renewal', playlist: 'https://youtube.com/playlist?list=PLX31T_KS3jtqspHndrqJQ-LK1kBWklQU0' },
];

export const THEORIST_TO_MODEL = {
  campbell: 'campbell', jung: 'jung', nietzsche: 'nietzsche',
  frobenius: 'frobenius', eliade: 'eliade', plato: 'plato',
  vogler: 'vogler', snyder: 'snyder', aristotle: 'aristotle',
  mckee: 'mckee-field', field: 'mckee-field',
  freud: 'dream', gennep: 'vangennep', murdoch: 'murdock',
  tolkien: 'tolkien', fraser: 'frazer', marks: 'marks',
  propp: 'propp', murdock: 'murdock', vangennep: 'vangennep',
  frazer: 'frazer',
};

export const CYCLE_TO_MODEL = {
  'Solar Day': 'solar-day',
  'Lunar Month': 'lunar-month',
  'Solar Year': 'solar-year',
  'Wake & Sleep': 'wake-sleep',
  'Procreation': 'procreation',
  'Mortality': 'mortality',
};

export function getModelById(id) {
  return monomythModels.models.find(m => m.id === id) || null;
}

export function getCycleById(id) {
  return monomythCycles.cycles.find(c => c.id === id) || null;
}

// --- Inner Ring Sets ---

const MYTH_COLORS = {
  osiris: '#c8a840',
  buddha: '#d4a030',
  persephone: '#8a6ab0',
  inanna: '#6a9a8a',
  christ: '#aa5a5a',
};

const FILM_COLORS = {
  starWars: '#4a8acc',
  matrix: '#4aaa6a',
  harryPotter: '#9a6a3a',
};

const MODEL_LABEL_OVERRIDES = { 'mckee-field': 'McKee/Field' };

const STAGE_KEYS = MONOMYTH_STAGES.map(s => s.id);
const MIN_STAGES = 5;

function buildTheoristRing(group) {
  const counts = {};
  for (const stageId of STAGE_KEYS) {
    const groupData = monomythTheorists[stageId]?.[group];
    if (!groupData) continue;
    for (const key of Object.keys(groupData)) counts[key] = (counts[key] || 0) + 1;
  }
  const seen = new Set();
  const items = [];
  for (const [key, count] of Object.entries(counts)) {
    if (count < MIN_STAGES) continue;
    const modelId = THEORIST_TO_MODEL[key];
    if (!modelId || seen.has(modelId)) continue;
    const model = monomythModels.models.find(m => m.id === modelId);
    if (!model || model.stages.filter(Boolean).length < MIN_STAGES) continue;
    seen.add(modelId);
    const lastName = (model.theorist || modelId).split(' ').pop();
    items.push({ id: modelId, label: MODEL_LABEL_OVERRIDES[modelId] || lastName, color: model.color });
  }
  return items;
}

function buildDataRing(data, colorMap, labelFn) {
  const counts = {};
  for (const stageId of STAGE_KEYS) {
    const stageData = data[stageId];
    if (!stageData) continue;
    for (const key of Object.keys(stageData)) counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count >= MIN_STAGES)
    .map(([key]) => ({ id: key, label: labelFn(key), color: colorMap[key] || '#aaa' }));
}

export const INNER_RING_SETS = {
  cycles: monomythCycles.cycles.map(c => ({ id: c.id, label: c.title, color: c.color })),
  mythological: buildTheoristRing('mythological'),
  screenplay: buildTheoristRing('screenplay'),
  experts: [
    { id: 'vogler', label: 'Vogler', color: '#4a8a5a' },
    { id: 'mckee-field', label: 'McKee/Field', color: '#5a7aaa' },
    { id: 'snyder', label: 'Snyder', color: '#8a6ab0' },
    { id: 'marks', label: 'Marks', color: '#6a6a9a' },
  ],
  myths: buildDataRing(monomythMyths, MYTH_COLORS, key => {
    const firstEntry = STAGE_KEYS.reduce((acc, sid) => acc || monomythMyths[sid]?.[key], null);
    return (firstEntry?.title || key).split(' \u2014 ')[0];
  }),
  films: buildDataRing(monomythFilms, FILM_COLORS, key => {
    const firstEntry = STAGE_KEYS.reduce((acc, sid) => acc || monomythFilms[sid]?.[key], null);
    return firstEntry?.title || key;
  }),
};

export function buildMythModel(mythKey) {
  const stages = STAGE_KEYS.map(sid => {
    const entry = monomythMyths[sid]?.[mythKey];
    return entry?.title || null;
  });
  const firstEntry = STAGE_KEYS.reduce((acc, sid) => acc || monomythMyths[sid]?.[mythKey], null);
  return {
    id: `myth-${mythKey}`,
    theorist: firstEntry?.tradition || mythKey,
    title: (firstEntry?.title || mythKey).split(' \u2014 ')[0],
    color: MYTH_COLORS[mythKey] || '#aaa',
    stages,
    normalWorldLabel: 'Known',
    otherWorldLabel: 'Unknown',
  };
}

export function buildFilmModel(filmKey) {
  const stages = STAGE_KEYS.map(sid => {
    const entry = monomythFilms[sid]?.[filmKey];
    return entry?.title || null;
  });
  const firstEntry = STAGE_KEYS.reduce((acc, sid) => acc || monomythFilms[sid]?.[filmKey], null);
  return {
    id: `film-${filmKey}`,
    theorist: firstEntry?.year ? String(firstEntry.year) : filmKey,
    title: firstEntry?.title || filmKey,
    color: FILM_COLORS[filmKey] || '#aaa',
    stages,
    normalWorldLabel: 'Act 1',
    otherWorldLabel: 'Act 2',
  };
}

export function getInnerRingModel(tab, itemId) {
  switch (tab) {
    case 'cycles': return getCycleById(itemId);
    case 'theorists': return getModelById(itemId);
    case 'experts': return getModelById(itemId);
    case 'myths': return buildMythModel(itemId);
    case 'films': return buildFilmModel(itemId);
    default: return null;
  }
}
