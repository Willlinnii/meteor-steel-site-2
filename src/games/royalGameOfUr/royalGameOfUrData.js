// Royal Game of Ur - Board Data and Layout
//
// Board layout (3 rows x 8 cols, only marked cells are active):
//   Row 0: [X][X][X][X][ ][ ][X][X]
//   Row 1: [X][X][X][X][X][X][X][X]  (shared war zone)
//   Row 2: [X][X][X][X][ ][ ][X][X]
//
// Each player has a 14-square path through the board.
// Path positions 1-14 are on the board; 0 = unplaced, 15 = borne off.

const CELL_SIZE = 50;
const PADDING = 5;

// All 20 active cells on the board
export const BOARD_CELLS = [
  // Row 0 (Player 0's private section + exit)
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
  { row: 0, col: 6 }, { row: 0, col: 7 },
  // Row 1 (shared war zone - full row)
  { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
  { row: 1, col: 4 }, { row: 1, col: 5 }, { row: 1, col: 6 }, { row: 1, col: 7 },
  // Row 2 (Player 1's private section + exit)
  { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
  { row: 2, col: 6 }, { row: 2, col: 7 },
];

// Player paths: array index 0 = path position 1, index 13 = path position 14
// Player 0: enters at (0,3), goes (0,3)→(0,2)→(0,1)→(0,0)→(1,0)→...→(1,7)→(0,7)→(0,6)→off
const PLAYER_0_PATH = [
  { row: 0, col: 3 }, // path pos 1
  { row: 0, col: 2 }, // path pos 2
  { row: 0, col: 1 }, // path pos 3
  { row: 0, col: 0 }, // path pos 4 (ROSETTE)
  { row: 1, col: 0 }, // path pos 5
  { row: 1, col: 1 }, // path pos 6
  { row: 1, col: 2 }, // path pos 7
  { row: 1, col: 3 }, // path pos 8 (ROSETTE)
  { row: 1, col: 4 }, // path pos 9
  { row: 1, col: 5 }, // path pos 10
  { row: 1, col: 6 }, // path pos 11
  { row: 1, col: 7 }, // path pos 12
  { row: 0, col: 7 }, // path pos 13
  { row: 0, col: 6 }, // path pos 14 (ROSETTE)
];

// Player 1: enters at (2,3), goes (2,3)→(2,2)→(2,1)→(2,0)→(1,0)→...→(1,7)→(2,7)→(2,6)→off
const PLAYER_1_PATH = [
  { row: 2, col: 3 }, // path pos 1
  { row: 2, col: 2 }, // path pos 2
  { row: 2, col: 1 }, // path pos 3
  { row: 2, col: 0 }, // path pos 4 (ROSETTE)
  { row: 1, col: 0 }, // path pos 5
  { row: 1, col: 1 }, // path pos 6
  { row: 1, col: 2 }, // path pos 7
  { row: 1, col: 3 }, // path pos 8 (ROSETTE)
  { row: 1, col: 4 }, // path pos 9
  { row: 1, col: 5 }, // path pos 10
  { row: 1, col: 6 }, // path pos 11
  { row: 1, col: 7 }, // path pos 12
  { row: 2, col: 7 }, // path pos 13
  { row: 2, col: 6 }, // path pos 14 (ROSETTE)
];

export const PLAYER_PATHS = [PLAYER_0_PATH, PLAYER_1_PATH];

// Rosette positions (path indices) - grant extra turn and are safe from capture
export const ROSETTE_POSITIONS = new Set([4, 8, 14]);

/**
 * Convert board grid coordinates to SVG pixel coordinates (center of cell).
 * @param {number} row - Board row (0-2)
 * @param {number} col - Board column (0-7)
 * @param {number} cellSize - Size of each cell in pixels
 * @param {number} padding - Padding around the board
 * @returns {{x: number, y: number}} Center coordinates in SVG space
 */
export function cellToSVG(row, col, cellSize = CELL_SIZE, padding = PADDING) {
  return {
    x: padding + col * cellSize + cellSize / 2,
    y: padding + row * cellSize + cellSize / 2,
  };
}

/**
 * Convert a path position for a given player to SVG coordinates.
 * @param {number} pathIdx - Path position (1-14)
 * @param {number} player - Player index (0 or 1)
 * @param {number} cellSize - Size of each cell in pixels
 * @param {number} padding - Padding around the board
 * @returns {{x: number, y: number}|null} Center coordinates, or null if off-board
 */
export function pathToSVG(pathIdx, player, cellSize = CELL_SIZE, padding = PADDING) {
  if (pathIdx < 1 || pathIdx > 14) return null;
  const cell = PLAYER_PATHS[player][pathIdx - 1];
  return cellToSVG(cell.row, cell.col, cellSize, padding);
}

/**
 * Check if a board cell is a rosette for display purposes.
 * Rosette cells: (0,0), (0,6), (1,3), (2,0), (2,6)
 */
export function isCellRosette(row, col) {
  return (
    (row === 0 && col === 0) ||
    (row === 0 && col === 6) ||
    (row === 1 && col === 3) ||
    (row === 2 && col === 0) ||
    (row === 2 && col === 6)
  );
}
