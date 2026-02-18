// Ladders: bottom → top
export const LADDERS = {
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

// Snakes: head → tail
export const SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 79,
};

// Convert square number (1-100) to grid {row, col} for a boustrophedon layout
// Row 0 is bottom, row 9 is top. Even rows go left-to-right, odd rows right-to-left.
export function squareToGrid(sq) {
  if (sq < 1 || sq > 100) return null;
  const idx = sq - 1;
  const row = Math.floor(idx / 10);
  const colRaw = idx % 10;
  const col = row % 2 === 0 ? colRaw : 9 - colRaw;
  return { row, col };
}

// Grid position to SVG coordinates
export function squareToSVG(sq, cellSize = 50, padding = 5) {
  const grid = squareToGrid(sq);
  if (!grid) return { x: 0, y: 0 };
  const x = padding + grid.col * cellSize + cellSize / 2;
  const y = padding + (9 - grid.row) * cellSize + cellSize / 2;
  return { x, y };
}
