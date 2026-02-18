// senetData.js — Senet board data and utilities
// Board: 3 rows x 10 columns, 30 squares, S-shaped (boustrophedon) path
// Row 0 (top):    left-to-right, positions 1–10
// Row 1 (middle): right-to-left, positions 11–20
// Row 2 (bottom): left-to-right, positions 21–30

export const SPECIAL_SQUARES = {
  15: { name: 'House of Rebirth', symbol: '\u2625' },       // ankh-like
  26: { name: 'House of Beauty', symbol: '\u2606' },        // star
  27: { name: 'House of Water', symbol: '\u2248' },         // waves
  28: { name: 'House of Three Truths', symbol: 'III' },
  29: { name: 'House of Re-Atoum', symbol: '\u2609' },      // sun
  30: { name: 'Final Square', symbol: '\u2192' },            // arrow right
};

/**
 * Convert a path position (1-30) to grid {row, col}.
 * Row 0: pos 1-10  -> col 0-9   (left to right)
 * Row 1: pos 11-20 -> col 9-0   (right to left)
 * Row 2: pos 21-30 -> col 0-9   (left to right)
 */
export function pathToGrid(pos) {
  if (pos < 1 || pos > 30) return null;
  if (pos <= 10) {
    return { row: 0, col: pos - 1 };
  } else if (pos <= 20) {
    return { row: 1, col: 20 - pos };
  } else {
    return { row: 2, col: pos - 21 };
  }
}

/**
 * Convert a path position to SVG center coordinates.
 * @param {number} pos       - path position 1-30
 * @param {number} cellW     - cell width  (default 50)
 * @param {number} cellH     - cell height (default 55)
 * @param {number} padding   - board padding (default 5)
 * @returns {{x: number, y: number}} center of that cell in SVG coords
 */
export function pathToSVG(pos, cellW = 50, cellH = 55, padding = 5) {
  const grid = pathToGrid(pos);
  if (!grid) return null;
  return {
    x: padding + grid.col * cellW + cellW / 2,
    y: padding + grid.row * cellH + cellH / 2,
  };
}
