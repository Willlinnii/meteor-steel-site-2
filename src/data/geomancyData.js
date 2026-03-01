/**
 * Geomancy — 16 figures, each a 4-row pattern of single (1) or double (2) dots.
 * Rows ordered top → bottom: Fire, Air, Water, Earth.
 * Names, planetary rulers, elements, and zodiac from Agrippa / standard medieval tradition.
 * ʿilm al-raml → Latin Europe → standard Western geomancy.
 */

export const GEOMANTIC_FIGURES = [
  { dots:[2,2,2,2], name:'Populus',         english:'People',           planet:'Moon',       element:'Water',  zodiac:'Cancer',      favorable:'Gatherings, community, stability',      unfavorable:'Action, movement, individuality' },
  { dots:[1,1,1,1], name:'Via',             english:'Way',              planet:'Moon',       element:'Water',  zodiac:'Cancer',      favorable:'Travel, change, journeys',               unfavorable:'Stability, staying, keeping' },
  { dots:[2,1,2,2], name:'Albus',           english:'White',            planet:'Mercury',    element:'Air',    zodiac:'Gemini',      favorable:'Wisdom, counsel, study, peace',           unfavorable:'War, bold action, haste' },
  { dots:[1,2,1,2], name:'Coniunctio',      english:'Conjunction',      planet:'Mercury',    element:'Earth',  zodiac:'Virgo',       favorable:'Unions, partnerships, recovery',          unfavorable:'Solitude, separation' },
  { dots:[1,2,2,1], name:'Puella',          english:'Girl',             planet:'Venus',      element:'Water',  zodiac:'Libra',       favorable:'Love, beauty, art, pleasure',             unfavorable:'War, conflict, severity' },
  { dots:[2,1,1,2], name:'Amissio',         english:'Loss',             planet:'Venus',      element:'Fire',   zodiac:'Taurus',      favorable:'Love, release, letting go',               unfavorable:'Gain, profit, keeping' },
  { dots:[2,2,1,1], name:'Fortuna Major',   english:'Greater Fortune',  planet:'Sun',        element:'Earth',  zodiac:'Leo',         favorable:'Victory, protection, lasting success',    unfavorable:'Swiftness, haste' },
  { dots:[1,1,2,2], name:'Fortuna Minor',   english:'Lesser Fortune',   planet:'Sun',        element:'Fire',   zodiac:'Leo',         favorable:'Speed, swift success, protection',        unfavorable:'Lasting matters, permanence' },
  { dots:[1,1,2,1], name:'Puer',            english:'Boy',              planet:'Mars',       element:'Fire',   zodiac:'Aries',       favorable:'Conflict, competition, boldness',         unfavorable:'Peace, patience, diplomacy' },
  { dots:[2,2,1,2], name:'Rubeus',          english:'Red',              planet:'Mars',       element:'Air',    zodiac:'Scorpio',     favorable:'Destruction of what must end',             unfavorable:'Nearly all else' },
  { dots:[2,1,2,1], name:'Acquisitio',      english:'Gain',             planet:'Jupiter',    element:'Air',    zodiac:'Sagittarius', favorable:'Profit, obtaining, increase',              unfavorable:'Loss, giving away' },
  { dots:[1,2,2,2], name:'Laetitia',        english:'Joy',              planet:'Jupiter',    element:'Fire',   zodiac:'Pisces',      favorable:'Happiness, health, celebration',           unfavorable:'Sorrow, depression' },
  { dots:[2,1,1,1], name:'Tristitia',       english:'Sorrow',           planet:'Saturn',     element:'Earth',  zodiac:'Aquarius',    favorable:'Solitude, endings, inner work',            unfavorable:'Beginnings, joy, celebration' },
  { dots:[1,2,1,1], name:'Carcer',          english:'Prison',           planet:'Saturn',     element:'Earth',  zodiac:'Capricorn',   favorable:'Binding, holding fast, keeping',           unfavorable:'Freedom, escape, expansion' },
  { dots:[2,2,2,1], name:'Caput Draconis',  english:'Head of the Dragon', planet:'North Node', element:'Earth', zodiac:'Virgo',     favorable:'Beginnings, thresholds, entering',        unfavorable:'Endings, leaving' },
  { dots:[1,1,1,2], name:'Cauda Draconis',  english:'Tail of the Dragon', planet:'South Node', element:'Fire', zodiac:'Sagittarius', favorable:'Endings, departures, completing',        unfavorable:'Beginnings, starting' },
];

/* ── Lookup ──────────────────────────────────────────────────── */

const FIGURE_MAP = {};
GEOMANTIC_FIGURES.forEach(f => { FIGURE_MAP[f.dots.join('')] = f; });

/** Look up a figure by its 4-element dots array (each 1 or 2, top→bottom). */
export function lookupFigure(dots) {
  return FIGURE_MAP[dots.join('')] || null;
}

/** Generate one random geomantic row (1 or 2 dots). */
export function randomRow() {
  return Math.random() < 0.5 ? 1 : 2;
}
