// Mythouse Card System — 44 cards across 4 decks
import figures from '../../data/figures.json';
import modernFigures from '../../data/modernFigures.json';
import archetypes from '../../data/sevenMetalsArchetypes.json';
import zodiac from '../../data/sevenMetalsZodiac.json';
import synthesis from '../../data/synthesis.json';
import deities from '../../data/sevenMetalsDeities.json';

// === DECK INFO ===
export const DECK_INFO = {
  figures: { label: 'The Heroes', count: 17, color: '#c9a961' },
  metals:  { label: 'The Metals', count: 7,  color: '#c4713a' },
  stars:   { label: 'The Stars',  count: 12, color: '#8b9dc3' },
  journey: { label: 'The Journey', count: 8,  color: '#8bc3aa' },
};

const STAGES = [
  'golden-age', 'falling-star', 'impact-crater', 'forge',
  'quenching', 'integration', 'drawing', 'new-age',
];

// Ring -> zodiac sign indices (from MythouseGame.js RING_ZODIAC)
const RING_ZODIAC = {
  1: [3],       // Moon -> Cancer
  2: [2, 5],    // Mercury -> Gemini, Virgo
  3: [1, 6],    // Venus -> Taurus, Libra
  4: [4],       // Sun -> Leo
  5: [0, 7],    // Mars -> Aries, Scorpio
  6: [8, 11],   // Jupiter -> Sagittarius, Pisces
  7: [9, 10],   // Saturn -> Capricorn, Aquarius
};

// Invert RING_ZODIAC: zodiac index -> ring
const ZODIAC_TO_RING = {};
for (const [ring, indices] of Object.entries(RING_ZODIAC)) {
  for (const idx of indices) ZODIAC_TO_RING[idx] = Number(ring);
}

// === HEROES DECK (17 cards) ===
function buildHeroes() {
  const allFigures = [...figures, ...modernFigures];
  return allFigures.map(fig => {
    const filledStages = STAGES.filter(s => fig.stages[s] && fig.stages[s].trim().length > 0);
    const power = Math.max(1, Math.min(10, Math.round((filledStages.length / 8) * 10)));

    // Ring affinity: find the stage with the longest text, map to ring
    let richestStage = 0;
    let maxLen = 0;
    STAGES.forEach((s, i) => {
      const len = (fig.stages[s] || '').length;
      if (len > maxLen) { maxLen = len; richestStage = i; }
    });
    const ringMap = [1, 1, 2, 3, 4, 5, 6, 7];
    const affinity = ringMap[richestStage] || 4;

    // Build brief from first non-empty stage text
    const firstText = filledStages.length > 0 ? fig.stages[filledStages[0]] : '';
    const brief = firstText.substring(0, 120).replace(/\n/g, ' ').trim() +
      (firstText.length > 120 ? '...' : '');

    return {
      id: `figure-${fig.id}`,
      name: fig.name,
      deck: 'figures',
      deckLabel: 'The Heroes',
      power,
      brief,
      detail: fig.stages,
      ringAffinity: [affinity],
    };
  });
}

// === METALS DECK (7 cards) ===
const METAL_POWER = { Gold: 10, Silver: 8, Iron: 7, Mercury: 6, Tin: 5, Copper: 4, Lead: 3 };
const METAL_RING = { Gold: 4, Silver: 1, Iron: 5, Mercury: 2, Tin: 6, Copper: 3, Lead: 7 };

function buildMetals() {
  return archetypes.map(arch => {
    const metal = arch.metal;
    const deityEntry = deities.find(d => d.metal === metal);
    const deityList = deityEntry ? deityEntry.deities : [];

    const brief = `${arch.archetype} (${metal}/${arch.sin}). ${arch.light.substring(0, 80)}...`;

    return {
      id: `metal-${metal.toLowerCase()}`,
      name: `${arch.archetype}`,
      deck: 'metals',
      deckLabel: 'The Metals',
      power: METAL_POWER[metal] || 5,
      brief,
      detail: {
        metal, sin: arch.sin, archetype: arch.archetype,
        shadow: arch.shadow, light: arch.light,
        deities: deityList,
      },
      ringAffinity: [METAL_RING[metal] || 4],
    };
  });
}

// === STARS DECK (12 cards) ===
const ZODIAC_POWER = {
  Aries: 8, Taurus: 6, Gemini: 5, Cancer: 7, Leo: 9, Virgo: 5,
  Libra: 6, Scorpio: 8, Sagittarius: 7, Capricorn: 10, Aquarius: 7, Pisces: 6,
};

function buildStars() {
  return zodiac.map((z, i) => {
    const ring = ZODIAC_TO_RING[i] || 4;
    const brief = `${z.symbol} ${z.archetype} (${z.element}). ${z.description.substring(0, 80)}...`;

    return {
      id: `star-${z.sign.toLowerCase()}`,
      name: z.sign,
      deck: 'stars',
      deckLabel: 'The Stars',
      power: ZODIAC_POWER[z.sign] || 5,
      brief,
      detail: {
        symbol: z.symbol, element: z.element, modality: z.modality,
        rulingPlanet: z.rulingPlanet, dates: z.dates, archetype: z.archetype,
        stageOfExperience: z.stageOfExperience, description: z.description,
        cultures: z.cultures,
      },
      ringAffinity: [ring],
    };
  });
}

// === JOURNEY DECK (8 cards) ===
const JOURNEY_KEYS = [
  'golden-age', 'falling-star', 'impact-crater', 'forge',
  'quenching', 'integration', 'drawing', 'new-age',
];
const JOURNEY_NAMES = [
  'Golden Age', 'Falling Star', 'Impact Crater', 'Forge',
  'Quenching', 'Integration', 'Drawing', 'New Age',
];
const JOURNEY_POWER = [3, 4, 5, 6, 7, 8, 9, 10];
const JOURNEY_RING = [1, 2, 3, 4, 5, 6, 6, 7];

function buildJourney() {
  return JOURNEY_KEYS.map((key, i) => {
    const essay = synthesis[key] || '';
    const brief = essay.substring(0, 150).replace(/\n/g, ' ').trim() +
      (essay.length > 150 ? '...' : '');

    return {
      id: `journey-${key}`,
      name: JOURNEY_NAMES[i],
      deck: 'journey',
      deckLabel: 'The Journey',
      power: JOURNEY_POWER[i],
      brief,
      detail: { stageKey: key, essay },
      ringAffinity: [JOURNEY_RING[i]],
    };
  });
}

// === EXPORTED FUNCTIONS ===

export function buildAllCards() {
  return [...buildHeroes(), ...buildMetals(), ...buildStars(), ...buildJourney()];
}

export function buildDeck(deckKey) {
  switch (deckKey) {
    case 'figures': return buildHeroes();
    case 'metals': return buildMetals();
    case 'stars': return buildStars();
    case 'journey': return buildJourney();
    default: return [];
  }
}

export function shuffleDeck(cards) {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawCard(deck) {
  if (deck.length === 0) return { card: null, remaining: [] };
  const [card, ...remaining] = deck;
  return { card, remaining };
}

export function drawContextualCard(deck, ring) {
  if (deck.length === 0) return { card: null, remaining: [] };
  if (ring != null) {
    const idx = deck.findIndex(c => c.ringAffinity.includes(ring));
    if (idx !== -1) {
      const card = deck[idx];
      const remaining = [...deck.slice(0, idx), ...deck.slice(idx + 1)];
      return { card, remaining };
    }
  }
  return drawCard(deck);
}
