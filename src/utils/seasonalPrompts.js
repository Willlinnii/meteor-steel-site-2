import mythicCalendar from '../data/mythicCalendar.json';

// Fixed dates for solstices/equinoxes (approximate)
const SOLAR_EVENTS = [
  { month: 2,  day: 20, title: 'Spring Equinox',  description: 'The threshold of balance — share your crossing story.' },
  { month: 5,  day: 21, title: 'Summer Solstice',  description: 'The longest light — share what you carry at the peak.' },
  { month: 8,  day: 22, title: 'Autumn Equinox',   description: 'The harvest threshold — share what you gathered on the road.' },
  { month: 11, day: 21, title: 'Winter Solstice',   description: 'Share your descent story.' },
];

/**
 * Returns a seasonal community prompt if applicable, or null.
 * Checks for: holidays within ±3 days, solstice/equinox proximity, and month theme.
 * @param {Date} date
 * @returns {{ title: string, description: string } | null}
 */
export function getSeasonalPrompt(date) {
  if (!date || !(date instanceof Date)) return null;

  const month = date.getMonth(); // 0-based
  const day = date.getDate();

  // Check solstice/equinox proximity (±3 days)
  for (const event of SOLAR_EVENTS) {
    if (month === event.month && Math.abs(day - event.day) <= 3) {
      return { title: event.title, description: event.description };
    }
  }

  // Check mythic calendar holidays within ±3 days
  const monthData = mythicCalendar[month];
  if (monthData?.holidays) {
    for (const holiday of monthData.holidays) {
      // Match holiday name keywords to approximate dates
      const name = holiday.name.toLowerCase();

      // New Year's Day
      if (name.includes("new year's day") && month === 0 && day <= 4) {
        return { title: holiday.name, description: 'A new cycle begins — share your intention for the journey ahead.' };
      }
      // Valentine's Day
      if (name.includes("valentine") && month === 1 && Math.abs(day - 14) <= 3) {
        return { title: holiday.name, description: 'Share a story of connection that shaped your path.' };
      }
      // Halloween / Samhain
      if ((name.includes("halloween") || name.includes("samhain")) && month === 9 && day >= 28) {
        return { title: holiday.name, description: 'The veil thins — share a story from the underworld.' };
      }
    }
  }

  // Fallback: month mood prompt (show only on 1st–3rd of month)
  if (day <= 3 && monthData?.mood) {
    return {
      title: `${monthData.month} — ${monthData.stone.name}`,
      description: monthData.mood.split('.').slice(0, 2).join('.') + '.',
    };
  }

  return null;
}
