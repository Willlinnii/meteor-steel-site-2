// Mehen - The Serpent Game
// Played on a coiled serpent board with 40 spaces spiraling inward to the center,
// then 40 spaces spiraling back out (80 total).

export const TOTAL_SPACES = 80;
export const CENTER = 40;

/**
 * Convert a board position (1-80) to SVG coordinates on the spiral.
 * Positions 1-40 spiral inward; positions 41-80 spiral back outward.
 * @param {number} pos - Board position (1-80)
 * @param {number} centerX - SVG center X (default 250)
 * @param {number} centerY - SVG center Y (default 250)
 * @returns {{ x: number, y: number }}
 */
export function mehenPositionToSVG(pos, centerX = 250, centerY = 250) {
  const outerRadius = 220;
  const innerRadius = 30;

  let effectivePos;
  let angleOffset;

  if (pos <= 40) {
    // Inward spiral: position 1 (outer) to position 40 (center)
    effectivePos = pos;
    angleOffset = 0;
  } else {
    // Outward spiral: position 41-80 mirrors back out
    // Use (80 - pos) so pos 41 is near center, pos 80 is near outer
    effectivePos = 80 - pos;
    // Small angle offset so outward track doesn't overlap inward track
    angleOffset = Math.PI / 40;
  }

  const angle = effectivePos * (4 * Math.PI / 40);
  const radius = outerRadius - (outerRadius - innerRadius) * (effectivePos / 40);

  const x = centerX + radius * Math.cos(angle + angleOffset);
  const y = centerY + radius * Math.sin(angle + angleOffset);

  return { x, y };
}
