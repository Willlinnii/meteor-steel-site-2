import chronosphaera from '../data/chronosphaera.json';
import mythicCalendar from '../data/mythicCalendar.json';

// Day-of-week → planet index in chronosphaera.json (Sunday=0 → Sun, Monday=1 → Moon, etc.)
const DAY_TO_PLANET = {
  0: 'Sun',     // Sunday
  1: 'Moon',    // Monday
  2: 'Mars',    // Tuesday
  3: 'Mercury', // Wednesday
  4: 'Jupiter', // Thursday
  5: 'Venus',   // Friday
  6: 'Saturn',  // Saturday
};

/**
 * Returns cosmological watermark data for a given date.
 * @param {Date} date
 * @returns {{ planet: string, stone: string, dayLabel: string, monthLabel: string } | null}
 */
export function getWatermark(date) {
  if (!date || !(date instanceof Date)) return null;

  const dayOfWeek = date.getDay();
  const monthIndex = date.getMonth(); // 0-based

  const planetName = DAY_TO_PLANET[dayOfWeek];
  const planetData = chronosphaera.find(p => p.planet === planetName);
  const monthData = mythicCalendar[monthIndex];

  if (!planetData || !monthData) return null;

  return {
    planet: planetData.planet,
    stone: monthData.stone.name,
    dayLabel: `${planetData.planet}'s day`,
    monthLabel: `Month of the ${monthData.stone.name}`,
  };
}
