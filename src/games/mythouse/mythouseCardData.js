// Mythouse Card System — Standard playing deck + Major Arcana + Minor Arcana utilities
import { CULTURES, ARCANA_POSITIONS, MAJOR_ARCANA } from './majorArcanaData';
import {
  CULTURE_SUITS, MINOR_RANKS,
  buildMinorArcana, getSuitsForCulture, getCourtForCulture,
} from './minorArcanaData';

// === STANDARD 52-CARD PLAYING DECK ===

const SUITS = [
  { key: 'hearts',   symbol: '\u2665', color: '#c44' },
  { key: 'diamonds', symbol: '\u2666', color: '#c44' },
  { key: 'clubs',    symbol: '\u2663', color: '#ddd' },
  { key: 'spades',   symbol: '\u2660', color: '#ddd' },
];

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const VALUES = [1,2,3,4,5,6,7,8,9,10,10,10,10]; // Face cards = 10, Ace = 1

export function buildPlayingDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (let r = 0; r < RANKS.length; r++) {
      cards.push({
        id: `${suit.key}-${RANKS[r]}`,
        suit: suit.key,
        suitSymbol: suit.symbol,
        suitColor: suit.color,
        rank: RANKS[r],
        value: VALUES[r],
        label: `${RANKS[r]}${suit.symbol}`,
      });
    }
  }
  return cards;
}

// === SHUFFLE & DRAW ===

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

// === ORDEAL DECK (shuffled playing cards for game duels) ===

export function buildOrdealDeck() {
  return shuffleDeck(buildPlayingDeck());
}

// === ARCANA UTILITIES ===

export function getArcanaForCulture(cultureKey) {
  return MAJOR_ARCANA.filter(c => c.culture === cultureKey);
}

export function getArcanaPosition(number) {
  return ARCANA_POSITIONS.find(p => p.number === number) || null;
}

export function getCrossReference(number) {
  return MAJOR_ARCANA.filter(c => c.number === number);
}

// === MINOR ARCANA UTILITIES ===

export function getMinorArcanaForCulture(cultureKey) {
  return buildMinorArcana(cultureKey);
}

// === MINOR ARCANA ORDEAL DECKS ===

/** Build a shuffled Minor Arcana deck for a single culture (56 cards). */
export function buildMinorOrdealDeck(culture) {
  return shuffleDeck(buildMinorArcana(culture));
}

/** Build a shuffled Mixed Minor deck from all 8 cultures (448 cards). */
export function buildMixedMinorDeck() {
  const allCultures = ['tarot', ...CULTURES.map(c => c.key)];
  const cards = [];
  for (const culture of allCultures) {
    cards.push(...buildMinorArcana(culture));
  }
  return shuffleDeck(cards);
}

// === MAJOR ARCANA GAME DECKS ===

/** Build a shuffled Major Arcana deck for a single culture (22 cards). */
export function buildMajorArcanaDeck(culture) {
  if (culture === 'tarot') {
    // Tarot uses the standard position names (The Fool, The Magician, etc.)
    const cards = ARCANA_POSITIONS.map(pos => ({
      culture: 'tarot', number: pos.number, name: pos.tarot,
      description: '', correspondence: pos.correspondence, type: pos.type,
    }));
    return shuffleDeck(cards);
  }
  const cards = MAJOR_ARCANA.filter(c => c.culture === culture).map(card => {
    const pos = ARCANA_POSITIONS.find(p => p.number === card.number);
    return { ...card, correspondence: pos?.correspondence || null, type: pos?.type || null };
  });
  return shuffleDeck(cards);
}

/** Build a shuffled Mixed Major deck from all 7 cultures (154 cards). */
export function buildMixedMajorDeck() {
  const cards = MAJOR_ARCANA.map(card => {
    const pos = ARCANA_POSITIONS.find(p => p.number === card.number);
    return { ...card, correspondence: pos?.correspondence || null, type: pos?.type || null };
  });
  return shuffleDeck(cards);
}

// Re-export data
export {
  CULTURES, ARCANA_POSITIONS, MAJOR_ARCANA, SUITS,
  CULTURE_SUITS, MINOR_RANKS,
  buildMinorArcana, getSuitsForCulture, getCourtForCulture,
};
