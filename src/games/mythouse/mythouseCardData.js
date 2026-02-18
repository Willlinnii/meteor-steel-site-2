// Mythouse Card System — Standard playing deck + Major Arcana utilities
import { CULTURES, ARCANA_POSITIONS, MAJOR_ARCANA } from './majorArcanaData';

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

// Re-export data
export { CULTURES, ARCANA_POSITIONS, MAJOR_ARCANA, SUITS };
