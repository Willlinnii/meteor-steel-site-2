// 3D scene constants — derived from SVG OrbitalDiagram values (SVG px / 20 ≈ world units)

export const PLANET_COLORS = {
  Moon:    '#c8d8e8',
  Mercury: '#a8b8c0',
  Venus:   '#d4956a',
  Sun:     '#f0c040',
  Mars:    '#c04040',
  Jupiter: '#8899cc',
  Saturn:  '#7a7a8a',
  Earth:   '#4a8ab0',
};

// Geocentric orbits (Earth at origin)
export const ORBITS_3D = [
  { planet: 'Moon',    metal: 'Silver',  radius: 2.75, size: 0.35, speed: 6,    angle: -90 },
  { planet: 'Mercury', metal: 'Mercury', radius: 4.5,  size: 0.3,  speed: 2,    angle: -40 },
  { planet: 'Venus',   metal: 'Copper',  radius: 6.25, size: 0.4,  speed: 1,    angle: -130 },
  { planet: 'Sun',     metal: 'Gold',    radius: 8.0,  size: 0.7,  speed: 0.6,  angle: 20 },
  { planet: 'Mars',    metal: 'Iron',    radius: 9.9,  size: 0.35, speed: 0.35, angle: -70 },
  { planet: 'Jupiter', metal: 'Tin',     radius: 11.9, size: 0.65, speed: 0.12, angle: 160 },
  { planet: 'Saturn',  metal: 'Lead',    radius: 13.9, size: 0.55, speed: 0.06, angle: 100 },
];

// Heliocentric orbits (Sun at origin)
export const HELIO_ORBITS_3D = [
  { planet: 'Mercury', radius: 2.75, size: 0.3,  speed: 4.15, angle: -40 },
  { planet: 'Venus',   radius: 4.75, size: 0.4,  speed: 1.62, angle: -130 },
  { planet: 'Earth',   radius: 7.0,  size: 0.4,  speed: 1,    angle: 20 },
  { planet: 'Mars',    radius: 9.25, size: 0.35, speed: 0.53, angle: -70 },
  { planet: 'Jupiter', radius: 11.5, size: 0.65, speed: 0.084, angle: 160 },
  { planet: 'Saturn',  radius: 13.9, size: 0.55, speed: 0.034, angle: 100 },
];

export const HELIO_MOON_3D = { radius: 0.9, speed: 13.37 };

export const ZODIAC_RADIUS = 15.0;
export const EARTH_RADIUS = 0.4;

export const ZODIAC = [
  { sign: 'Aries',       symbol: '\u2648' },
  { sign: 'Taurus',      symbol: '\u2649' },
  { sign: 'Gemini',      symbol: '\u264A' },
  { sign: 'Cancer',      symbol: '\u264B' },
  { sign: 'Leo',         symbol: '\u264C' },
  { sign: 'Virgo',       symbol: '\u264D' },
  { sign: 'Libra',       symbol: '\u264E' },
  { sign: 'Scorpio',     symbol: '\u264F' },
  { sign: 'Sagittarius', symbol: '\u2650' },
  { sign: 'Capricorn',   symbol: '\u2651' },
  { sign: 'Aquarius',    symbol: '\u2652' },
  { sign: 'Pisces',      symbol: '\u2653' },
];

export const CARDINALS = [
  { id: 'vernal-equinox',   label: 'Vernal Equinox',   angle: 0,    symbol: '\u263D' },
  { id: 'summer-solstice',  label: 'Summer Solstice',  angle: -90,  symbol: '\u2600' },
  { id: 'autumnal-equinox', label: 'Autumnal Equinox', angle: 180,  symbol: '\u263D' },
  { id: 'winter-solstice',  label: 'Winter Solstice',  angle: 90,   symbol: '\u2744' },
];

// Orbital mode enum
export const ORBITAL_MODES = {
  GEOCENTRIC: 'geocentric',
  HELIOCENTRIC: 'heliocentric',
  LIVE: 'live',
  ALIGNED: 'aligned',
};

export const ALIGN_ANGLE = -90;

// Mode labels for cycle button
export const MODE_LABELS = {
  [ORBITAL_MODES.GEOCENTRIC]: 'Earth Centered',
  [ORBITAL_MODES.HELIOCENTRIC]: 'Heliocentric',
  [ORBITAL_MODES.LIVE]: 'Live Positions',
  [ORBITAL_MODES.ALIGNED]: 'Aligned',
};

export const MODE_SYMBOLS = {
  [ORBITAL_MODES.GEOCENTRIC]: '\u25CE',
  [ORBITAL_MODES.HELIOCENTRIC]: '\u2609',
  [ORBITAL_MODES.LIVE]: '\u25C9',
  [ORBITAL_MODES.ALIGNED]: '\u260D',
};
