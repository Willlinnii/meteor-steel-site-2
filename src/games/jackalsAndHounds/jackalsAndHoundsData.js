// Jackals & Hounds (58 Holes)
// Two parallel tracks of 29 holes each, with shortcut connections.
// 5 pieces per player race from hole 0 (off-board) to hole 29.

export const TRACK_LENGTH = 29;
export const PIECES_PER_PLAYER = 5;

// Bidirectional shortcuts: landing on either end teleports to the other
export const SHORTCUTS = { 6: 12, 10: 18, 20: 24 };

// Build a reverse lookup for shortcuts (bidirectional)
export const SHORTCUT_MAP = {};
Object.entries(SHORTCUTS).forEach(([from, to]) => {
  SHORTCUT_MAP[Number(from)] = Number(to);
  SHORTCUT_MAP[Number(to)] = Number(from);
});

/**
 * Convert a hole number and player index to SVG coordinates.
 * Player 0's track is on the left column, player 1's track is on the right.
 * Holes are arranged vertically from bottom (hole 1) to top (hole 29).
 *
 * @param {number} hole - Hole number (1-29)
 * @param {number} player - Player index (0 or 1)
 * @param {number} width - SVG width (default 300)
 * @param {number} height - SVG height (default 500)
 * @param {number} padding - Edge padding (default 20)
 * @returns {{ x: number, y: number }}
 */
export function holeToSVG(hole, player, width = 300, height = 500, padding = 20) {
  const usableWidth = width - 2 * padding;
  const usableHeight = height - 2 * padding;

  // Player 0 on left (25% of width), player 1 on right (75% of width)
  const x = padding + (player === 0 ? usableWidth * 0.25 : usableWidth * 0.75);

  // Hole 1 at bottom, hole 29 at top
  const y = padding + usableHeight - ((hole - 1) / (TRACK_LENGTH - 1)) * usableHeight;

  return { x, y };
}
