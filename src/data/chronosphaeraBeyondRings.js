/**
 * Beyond Rings — the Sphere of Fixed Stars + 3 cosmological layers beyond it.
 *
 * Each ring maps tradition IDs → correspondence keys in the vault chart data.
 * Dante uses a special `beyondTheSeven` top-level field; all others use
 * keys inside `correspondences`.
 *
 * `fixedStars` is included for data lookup only — OrbitalDiagram renders the
 * star sphere with its own dedicated code (not from this array).
 */

// Data-only entry for the star sphere (no visual params — rendered separately)
export const FIXED_STARS_RING = {
  id: 'fixedStars',
  label: 'Sphere of Fixed Stars',
  subtitle: 'The Eighth Sphere',
  traditions: {
    'dante':        { correspondenceKey: 'beyondTheSeven.fixedStars', label: 'Fixed Stars' },
    'kepler':       { correspondenceKey: 'Stars',                     label: 'Stars' },
    'plato':        { correspondenceKey: 'Fixed Stars',               label: 'Fixed Stars' },
    'neoplatonist': { correspondenceKey: 'Nous — Fixed Stars',        label: 'Nous — Fixed Stars' },
    'al-farabi':    { correspondenceKey: 'Second Intellect — Stars',  label: 'Second Intellect — Stars' },
  },
};

export const BEYOND_RINGS = [
  {
    id: 'worldSoul',
    label: 'World Soul',
    subtitle: 'Primum Mobile',
    tooltipLabel: 'World Soul',
    // Visual params for OrbitalDiagram
    inner: 356, outer: 368, mid: 362, width: 12,
    dotCount: 50,
    dotSeed: 137,
    color: { r: 147, g: 112, b: 219 },
    traditions: {
      'dante':          { correspondenceKey: 'beyondTheSeven.primumMobile', label: 'Primum Mobile' },
      'plato':          { correspondenceKey: 'World Soul',                  label: 'World Soul' },
      'ficino':         { correspondenceKey: 'Anima Mundi',                 label: 'Anima Mundi' },
      'ikhwan-al-safa': { correspondenceKey: 'Universal Soul',              label: 'Universal Soul' },
      'norse':          { correspondenceKey: 'Muspelheim',                   label: 'Muspelheim' },
    },
  },
  {
    id: 'nous',
    label: 'Nous',
    subtitle: 'Divine Mind',
    tooltipLabel: 'Nous',
    inner: 370, outer: 382, mid: 376, width: 12,
    dotCount: 40,
    dotSeed: 271,
    color: { r: 218, g: 185, b: 107 },
    traditions: {
      'plato':          { correspondenceKey: 'Forms / Nous',         label: 'Forms / Nous' },
      'ficino':         { correspondenceKey: 'Nous',                 label: 'Nous' },
      'ikhwan-al-safa': { correspondenceKey: 'Universal Intellect',  label: 'Universal Intellect' },
      'al-farabi':      { correspondenceKey: 'First Intellect',      label: 'First Intellect' },
      'kabbalah':       { correspondenceKey: 'Chokmah — Wisdom',     label: 'Chokmah — Wisdom' },
      'norse':          { correspondenceKey: 'Niflheim',             label: 'Niflheim' },
    },
  },
  {
    id: 'source',
    label: 'The Source',
    subtitle: 'The One',
    tooltipLabel: 'The Source',
    inner: 384, outer: 396, mid: 390, width: 12,
    dotCount: 25,
    dotSeed: 401,
    color: { r: 255, g: 255, b: 255 },
    traditions: {
      'dante':          { correspondenceKey: 'beyondTheSeven.empyrean',  label: 'Empyrean' },
      'plato':          { correspondenceKey: 'The One / The Good',       label: 'The One / The Good' },
      'ficino':         { correspondenceKey: 'The One',                  label: 'The One' },
      'neoplatonist':   { correspondenceKey: 'Source — Primum Mobile',   label: 'Source — Primum Mobile' },
      'al-farabi':      { correspondenceKey: 'God',                      label: 'God' },
      'ikhwan-al-safa': { correspondenceKey: 'God the Creator',          label: 'God the Creator' },
      'kabbalah':       { correspondenceKey: 'Kether — Crown',           label: 'Kether — Crown' },
      'norse':          { correspondenceKey: 'Ginnungagap',              label: 'Ginnungagap' },
    },
  },
];

// Convenience sets
export const WORLD_SOUL_TRADITIONS = new Set(Object.keys(BEYOND_RINGS[0].traditions));
export const NOUS_TRADITIONS = new Set(Object.keys(BEYOND_RINGS[1].traditions));
export const SOURCE_TRADITIONS = new Set(Object.keys(BEYOND_RINGS[2].traditions));

// All traditions that have at least one beyond ring
export const BEYOND_TRADITIONS = new Set([
  ...WORLD_SOUL_TRADITIONS, ...NOUS_TRADITIONS, ...SOURCE_TRADITIONS,
]);
