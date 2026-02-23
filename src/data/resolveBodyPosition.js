import { BODY_POSITIONS, CHAKRA_ORDERINGS, WEEKDAY_PAIRING_DESCRIPTIONS } from './chronosphaeraBodyPositions';

/**
 * Given a planet name and a chakra view mode, returns the position-pinned data
 * for where that planet sits in that ordering.
 *
 * Returns null if the planet is not found in the ordering.
 */
export default function resolveBodyPosition(planet, mode) {
  const ordering = CHAKRA_ORDERINGS[mode];
  if (!ordering) return null;

  const posIndex = ordering.indexOf(planet);
  if (posIndex < 0) return null;

  const pos = BODY_POSITIONS[posIndex];

  // Weekday mode uses the rich planet-specific description.
  // Other modes use the generic position description.
  const description = mode === 'weekdays'
    ? (WEEKDAY_PAIRING_DESCRIPTIONS[planet] || pos.description)
    : pos.description;

  return {
    ...pos,
    positionIndex: posIndex,
    description,
  };
}
