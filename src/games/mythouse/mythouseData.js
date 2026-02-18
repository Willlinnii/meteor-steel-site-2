// Mythouse Game: 7-ring spiral mountain

export const RINGS = 7;
export const SPACES_PER_RING = 28;
export const TOTAL_SPACES = RINGS * SPACES_PER_RING; // 196

// Platonic solid dice for each ring
export const RING_DICE = {
  1: { sides: 6, name: 'd6' },
  2: { sides: 8, name: 'd8' },
  3: { sides: 8, name: 'd8' },
  4: { sides: 12, name: 'd12' },
  5: { sides: 12, name: 'd12' },
  6: { sides: 20, name: 'd20' },
  7: { sides: 20, name: 'd20' },
};

// Gemstone values: ring × 28
export const GEMSTONE_VALUES = {};
for (let r = 1; r <= 7; r++) GEMSTONE_VALUES[r] = r * 28;

export const FALLEN_STARLIGHT_VALUE = 588;

// Chutes (down) and ladders (up) between rings
// Format: { fromRing, fromPos, toRing, toPos }
export const LADDERS = [
  { fromRing: 1, fromPos: 7, toRing: 2, toPos: 3 },
  { fromRing: 2, fromPos: 14, toRing: 3, toPos: 7 },
  { fromRing: 3, fromPos: 21, toRing: 4, toPos: 10 },
  { fromRing: 4, fromPos: 7, toRing: 5, toPos: 3 },
  { fromRing: 5, fromPos: 14, toRing: 6, toPos: 7 },
  { fromRing: 6, fromPos: 21, toRing: 7, toPos: 10 },
];

export const CHUTES = [
  { fromRing: 2, fromPos: 21, toRing: 1, toPos: 14 },
  { fromRing: 3, fromPos: 7, toRing: 2, toPos: 21 },
  { fromRing: 4, fromPos: 14, toRing: 3, toPos: 7 },
  { fromRing: 5, fromPos: 21, toRing: 4, toPos: 14 },
  { fromRing: 6, fromPos: 7, toRing: 5, toPos: 21 },
  { fromRing: 7, fromPos: 14, toRing: 6, toPos: 7 },
];

// Ordeal positions: bottom of each ring (position 0) except ring 1
export const ORDEAL_POSITIONS = [2, 3, 4, 5, 6, 7]; // rings that have ordeals

// Piece types (7 chess-inspired pieces per player)
export const PIECE_TYPES = [
  { type: 'checker', symbol: '\u25CF', name: 'Checker' },
  { type: 'pawn', symbol: '\u265F', name: 'Pawn' },
  { type: 'rook', symbol: '\u265C', name: 'Rook' },
  { type: 'bishop', symbol: '\u265D', name: 'Bishop' },
  { type: 'knight', symbol: '\u265E', name: 'Knight' },
  { type: 'queen', symbol: '\u265B', name: 'Queen' },
  { type: 'king', symbol: '\u265A', name: 'King' },
];

// Convert ring + position to SVG coordinates
// Board is rendered as concentric circles
// direction: 1 = clockwise, -1 = counter-clockwise
export function ringPosToSVG(ring, pos, centerX = 280, centerY = 280, direction = 1) {
  const maxRadius = 250;
  const minRadius = 40;
  const ringRadius = maxRadius - ((ring - 1) / (RINGS - 1)) * (maxRadius - minRadius);
  const angle = direction * (pos / SPACES_PER_RING) * 2 * Math.PI - Math.PI / 2; // start at top
  return {
    x: centerX + ringRadius * Math.cos(angle),
    y: centerY + ringRadius * Math.sin(angle),
  };
}

// Roll the appropriate die for a ring
export function rollForRing(ring) {
  const { sides } = RING_DICE[ring] || { sides: 6 };
  return Math.floor(Math.random() * sides) + 1;
}

// Check if a position is a ladder base
export function getLadderAt(ring, pos) {
  return LADDERS.find(l => l.fromRing === ring && l.fromPos === pos);
}

// Check if a position is a chute top
export function getChuteAt(ring, pos) {
  return CHUTES.find(c => c.fromRing === ring && c.fromPos === pos);
}
