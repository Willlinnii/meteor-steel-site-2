import { useState, useEffect } from 'react';

/**
 * Tropical zodiac date ranges as [startMonth, startDay, endMonth, endDay].
 * Months are 0-indexed (Jan=0).
 */
const ZODIAC_DATES = [
  { sign: 'Aries',       start: [2, 21], end: [3, 19] },
  { sign: 'Taurus',      start: [3, 20], end: [4, 20] },
  { sign: 'Gemini',      start: [4, 21], end: [5, 20] },
  { sign: 'Cancer',      start: [5, 21], end: [6, 22] },
  { sign: 'Leo',         start: [6, 23], end: [7, 22] },
  { sign: 'Virgo',       start: [7, 23], end: [8, 22] },
  { sign: 'Libra',       start: [8, 23], end: [9, 22] },
  { sign: 'Scorpio',     start: [9, 23], end: [10, 21] },
  { sign: 'Sagittarius', start: [10, 22], end: [11, 21] },
  { sign: 'Capricorn',   start: [11, 22], end: [0, 19] },
  { sign: 'Aquarius',    start: [0, 20], end: [1, 18] },
  { sign: 'Pisces',      start: [1, 19], end: [2, 20] },
];

/**
 * Monomyth stages mapped to the Wheel of the Year.
 * 8 stages between the 8 sabbats (solstices, equinoxes, cross-quarter days).
 * Dates as [month, day] (0-indexed months).
 */
const STAGE_DATES = [
  { start: [11, 21], end: [1, 2] },   // 0 Golden Age       (Winter Solstice → Imbolc)
  { start: [1, 3],   end: [2, 19] },  // 1 Calling Star      (Imbolc → Spring Equinox)
  { start: [2, 20],  end: [4, 0] },   // 2 Crater Crossing   (Spring Equinox → Beltane)
  { start: [4, 1],   end: [5, 20] },  // 3 Trials of Forge   (Beltane → Summer Solstice)
  { start: [5, 21],  end: [7, 1] },   // 4 Quench            (Summer Solstice → Lughnasadh)
  { start: [7, 2],   end: [8, 21] },  // 5 Integration       (Lughnasadh → Autumn Equinox)
  { start: [8, 22],  end: [9, 31] },  // 6 Draw              (Autumn Equinox → Samhain)
  { start: [10, 1],  end: [11, 20] }, // 7 Age of Steel      (Samhain → Winter Solstice)
];

function dayOfYear(month, day) {
  // Approximate day-of-year for comparison (non-leap)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let d = 0;
  for (let i = 0; i < month; i++) d += daysInMonth[i];
  return d + day;
}

function inRange(doy, startMonth, startDay, endMonth, endDay) {
  const s = dayOfYear(startMonth, startDay);
  const e = dayOfYear(endMonth, endDay);
  if (s <= e) return doy >= s && doy <= e;
  // Wraps around year boundary (e.g. Capricorn: Dec 22 → Jan 19)
  return doy >= s || doy <= e;
}

function compute() {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const doy = dayOfYear(month, day);

  // Current zodiac sign
  const zodiac = ZODIAC_DATES.find(z => inRange(doy, ...z.start, ...z.end));
  const currentSign = zodiac ? zodiac.sign : null;

  // Current monomyth stage index
  let currentStageIndex = null;
  for (let i = 0; i < STAGE_DATES.length; i++) {
    const s = STAGE_DATES[i];
    if (inRange(doy, ...s.start, ...s.end)) {
      currentStageIndex = i;
      break;
    }
  }

  return { currentSign, currentMonth: month, currentStageIndex };
}

/**
 * Hook that returns the current seasonal position.
 * Updates once per day (checks on mount and every hour).
 *
 * Returns { currentSign, currentMonth, currentStageIndex }.
 */
export default function useSeason() {
  const [season, setSeason] = useState(compute);

  useEffect(() => {
    const timer = setInterval(() => setSeason(compute()), 3600000); // hourly
    return () => clearInterval(timer);
  }, []);

  return season;
}
