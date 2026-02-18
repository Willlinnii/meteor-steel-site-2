// Pachisi board: cross-shaped with 4 arms
// Each arm has 3 columns of 8 squares (24 per arm)
// Total path: 68 squares per player circuit + home column
// Simplified for 2 players

// Board dimensions
export const CELL = 22;
export const ARM_LENGTH = 8;
export const BOARD_SIZE = 19; // 8 + 3 + 8 cells across

// Castle (safe) squares — path positions
export const CASTLES = new Set([1, 9, 18, 26, 35, 43, 52, 60]);

// Total circuit length before home stretch
export const CIRCUIT_LENGTH = 68;
export const HOME_STRETCH = 7; // 7 squares to reach home

// Player start positions on the circuit (where they enter the board)
export const PLAYER_STARTS = [0, 34]; // player 0 enters at 0, player 1 at 34

// Generate the full path as grid positions for each player
// The cross board has center at (9,9)
// Arms extend: North (rows 0-7, cols 8-10), East (rows 8-10, cols 11-18),
// South (rows 11-18, cols 8-10), West (rows 8-10, cols 0-7)

function buildGridPath() {
  const path = [];
  // Start from South arm, bottom-left column going up
  // South arm, left col (col 8), rows 18→11
  for (let r = 18; r >= 11; r--) path.push({ row: r, col: 8 });
  // West arm, bottom row (row 10), cols 7→0
  for (let c = 7; c >= 0; c--) path.push({ row: 10, col: c });
  // West arm, turn up at (row 9, col 0), then left col going right
  path.push({ row: 9, col: 0 });
  // North side of west arm (row 8), cols 0→7
  for (let c = 0; c <= 7; c++) path.push({ row: 8, col: c });
  // North arm, left col (col 8), rows 7→0
  for (let r = 7; r >= 0; r--) path.push({ row: r, col: 8 });
  // North arm turn right at (row 0, col 9)
  path.push({ row: 0, col: 9 });
  // North arm, right col (col 10), rows 0→7
  for (let r = 0; r <= 7; r++) path.push({ row: r, col: 10 });
  // East arm, top row (row 8), cols 11→18
  for (let c = 11; c <= 18; c++) path.push({ row: 8, col: c });
  // East arm turn down at (row 9, col 18)
  path.push({ row: 9, col: 18 });
  // East arm, bottom row (row 10), cols 18→11
  for (let c = 18; c >= 11; c--) path.push({ row: 10, col: c });
  // South arm, right col (col 10), rows 11→18
  for (let r = 11; r <= 18; r++) path.push({ row: r, col: 10 });
  // South arm turn left at (row 18, col 9)
  path.push({ row: 18, col: 9 });
  // South arm, middle going up to center — this is the home stretch for player 0
  // Actually, the circuit should close. Let me fix this.
  // The circuit continues: (row 18, col 9) then up col 9 rows 17→11 (home stretch for player 0)
  return path;
}

// Simplified approach: define a single counter-clockwise circuit path
// Each player enters at a different point and has their home stretch entering from their arm
const CIRCUIT = buildGridPath();

// Home stretch for each player: 7 squares leading to center
const HOME_STRETCHES = [
  // Player 0: enters center from South, col 9, rows 18→12, then center (9,9)
  [{ row: 17, col: 9 }, { row: 16, col: 9 }, { row: 15, col: 9 }, { row: 14, col: 9 },
   { row: 13, col: 9 }, { row: 12, col: 9 }, { row: 11, col: 9 }],
  // Player 1: enters center from North, col 9, rows 0→6
  [{ row: 1, col: 9 }, { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 },
   { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 9 }],
];

export { CIRCUIT, HOME_STRETCHES };

// Convert grid position to SVG coordinates
export function gridToSVG(row, col) {
  const padding = 10;
  return {
    x: padding + col * CELL + CELL / 2,
    y: padding + row * CELL + CELL / 2,
  };
}

// Get the full path for a player (circuit + home stretch)
export function getPlayerPath(player) {
  const start = PLAYER_STARTS[player];
  const circuit = [];
  for (let i = 0; i < CIRCUIT_LENGTH; i++) {
    circuit.push(CIRCUIT[(start + i) % CIRCUIT.length]);
  }
  return [...circuit, ...HOME_STRETCHES[player]];
}

// Get SVG position for a piece
export function piecePositionToSVG(pathIndex, player) {
  const path = getPlayerPath(player);
  if (pathIndex < 0 || pathIndex >= path.length) return { x: 0, y: 0 };
  return gridToSVG(path[pathIndex].row, path[pathIndex].col);
}

// All active board cells (for drawing the cross)
export function getAllBoardCells() {
  const cells = [];
  // North arm: rows 0-7, cols 8-10
  for (let r = 0; r <= 7; r++)
    for (let c = 8; c <= 10; c++) cells.push({ row: r, col: c });
  // Center row: rows 8-10, cols 0-18
  for (let r = 8; r <= 10; r++)
    for (let c = 0; c <= 18; c++) cells.push({ row: r, col: c });
  // South arm: rows 11-18, cols 8-10
  for (let r = 11; r <= 18; r++)
    for (let c = 8; c <= 10; c++) cells.push({ row: r, col: c });
  // Center square
  cells.push({ row: 9, col: 9 });
  return cells;
}
