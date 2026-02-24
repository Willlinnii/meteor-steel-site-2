import { useState, useMemo, useCallback } from 'react';

import { BEYOND_RINGS, FIXED_STARS_RING } from '../../data/chronosphaeraBeyondRings';
import vaultIndex from '../../vault/_index.json';
import corpusHermeticum from '../../vault/planetary-charts/corpus-hermeticum.json';
import paracelsus from '../../vault/planetary-charts/paracelsus.json';
import steiner from '../../vault/planetary-charts/steiner.json';
import leadbeater from '../../vault/planetary-charts/leadbeater-theosophy.json';
import besant from '../../vault/planetary-charts/besant-theosophy.json';
import dante from '../../vault/planetary-charts/dante.json';
import goldenDawn from '../../vault/planetary-charts/golden-dawn.json';
import kabbalah from '../../vault/planetary-charts/kabbalah.json';
import kepler from '../../vault/planetary-charts/kepler.json';
import plato from '../../vault/planetary-charts/plato.json';
import tolkien from '../../vault/planetary-charts/tolkien.json';
import manlyPHall from '../../vault/planetary-charts/manly-p-hall.json';
import rosicrucian from '../../vault/planetary-charts/rosicrucian.json';
import vedic from '../../vault/planetary-charts/vedic.json';
import blavatsky from '../../vault/planetary-charts/blavatsky.json';
import johnDee from '../../vault/planetary-charts/john-dee.json';
import pythagorean from '../../vault/planetary-charts/pythagorean.json';
import raLawOfOne from '../../vault/planetary-charts/ra-law-of-one.json';
import perennialPhilosophy from '../../vault/planetary-charts/perennial-philosophy.json';
import neoplatonist from '../../vault/planetary-charts/neoplatonist.json';
import ficino from '../../vault/planetary-charts/ficino.json';
import norse from '../../vault/planetary-charts/norse.json';
import ikhwanAlSafa from '../../vault/planetary-charts/ikhwan-al-safa.json';
import alFarabi from '../../vault/planetary-charts/al-farabi.json';
import tarot from '../../vault/planetary-charts/tarot.json';
import genesis from '../../vault/planetary-charts/genesis.json';
import babylon from '../../vault/planetary-charts/babylon.json';
import sumerian from '../../vault/planetary-charts/sumerian.json';
import assyrian from '../../vault/planetary-charts/assyrian.json';
import phoenician from '../../vault/planetary-charts/phoenician.json';
import ptolemaic from '../../vault/planetary-charts/ptolemaic.json';
import mithraic from '../../vault/planetary-charts/mithraic.json';
import gnostic from '../../vault/planetary-charts/gnostic.json';
import sabians from '../../vault/planetary-charts/sabians.json';
import agrippa from '../../vault/planetary-charts/agrippa.json';

const CHART_MAP = {
  'corpus-hermeticum': corpusHermeticum,
  'paracelsus': paracelsus,
  'steiner': steiner,
  'leadbeater-theosophy': leadbeater,
  'besant-theosophy': besant,
  'dante': dante,
  'golden-dawn': goldenDawn,
  'kabbalah': kabbalah,
  'kepler': kepler,
  'plato': plato,
  'tolkien': tolkien,
  'manly-p-hall': manlyPHall,
  'rosicrucian': rosicrucian,
  'vedic': vedic,
  'blavatsky': blavatsky,
  'john-dee': johnDee,
  'pythagorean': pythagorean,
  'ra-law-of-one': raLawOfOne,
  'perennial-philosophy': perennialPhilosophy,
  'neoplatonist': neoplatonist,
  'ficino': ficino,
  'norse': norse,
  'ikhwan-al-safa': ikhwanAlSafa,
  'al-farabi': alFarabi,
  'tarot': tarot,
  'genesis': genesis,
  'babylon': babylon,
  'sumerian': sumerian,
  'assyrian': assyrian,
  'phoenician': phoenician,
  'ptolemaic': ptolemaic,
  'mithraic': mithraic,
  'gnostic': gnostic,
  'sabians': sabians,
  'agrippa': agrippa,
};

// Meta fields filtered from display
const META_KEYS = new Set(['number', 'emanationLevel', 'arcanaNumber', 'majorArcana']);

// Tabs that appear across many traditions get priority (leftmost, closest to tradition name).
// Keys not listed here appear after, in their natural discovery order.
// '__self__' is a synthetic tab that groups all self-related fields.
const TAB_PRIORITY = ['overview', 'metal', 'planetName', 'classicalPlanet', '__self__'];

// Display-friendly label overrides for camelCase keys
const TAB_LABEL_OVERRIDES = {
  classicalPlanet: 'Planet',
  planetName: 'Planet',
  __self__: 'Self',
};

// Dante realm groupings — collapse many flat keys into three synthetic realm tabs
const DANTE_REALM_KEYS = new Set([
  'paradise', 'paradiseVirtue',
  'purgatory', 'purgatoryTerrace', 'purgatoryVirtue', 'purgatoryNote',
  'hell', 'hellCircle', 'hellNote',
]);

const DANTE_TABS = [
  { id: 'metal', label: 'Metal' },
  { id: '__paradiso__', label: 'Paradiso' },
  { id: '__purgatorio__', label: 'Purgatorio' },
  { id: '__inferno__', label: 'Inferno' },
];

// Fields that describe aspects of the self (body, energy, consciousness, vice/virtue)
// collapse into a single "Self" tab. NOT stages (initiation, alchemical phase, etc.).
const SELF_KEYS = new Set([
  'vice', 'imbalance', 'virtue',
  'organ', 'chakra', 'vehicle', 'plane', 'sense',
  'consciousness', 'humanAspect', 'cosmicAspect', 'seat', 'color',
  'soul', 'descentQuality',
  'energyCenter', 'distortion',
  'functionInDescent', 'temperament',
]);

// Chronological cycle order — after Mythouse (present), starts at oldest and moves
// forward through time back to the present.
const CYCLE_ORDER = [
  'sumerian',               // c. 3500–2000 BCE
  'babylon',                // c. 1800–500 BCE
  'phoenician',             // c. 1500–300 BCE
  'assyrian',               // c. 2000–609 BCE (Neo-Assyrian peak ~700)
  'genesis',                // c. 6th–5th c BCE (oral tradition much older)
  'pythagorean',            // 6th c BCE
  'plato',                  // 4th c BCE
  'vedic',                  // c. 2nd c BCE – 5th c CE (Alexandrian contact)
  'corpus-hermeticum',      // 1st–3rd c CE
  'ptolemaic',              // c. 150 CE (Ptolemy, Tetrabiblos)
  'mithraic',               // 1st–4th c CE
  'gnostic',                // 2nd–4th c CE
  'neoplatonist',           // 3rd–5th c CE
  'kabbalah',               // 2nd–13th c CE (midpoint ~750)
  'al-farabi',              // c. 870–950 CE
  'sabians',                // 9th–11th c CE (documented; traditions much older)
  'ikhwan-al-safa',         // 10th c CE
  'norse',                  // 9th–13th c CE (midpoint ~1100)
  'dante',                  // 1320
  'tarot',                  // c. 1430s–1440s (Visconti-Sforza, Milan)
  'ficino',                 // 1433–1499
  'agrippa',                // 1531 (Three Books of Occult Philosophy)
  'paracelsus',             // 1493–1541
  'john-dee',               // 1582–1589
  'kepler',                 // 1596–1619
  'rosicrucian',            // 1614–17th c
  'blavatsky',              // 1877–1891
  'golden-dawn',            // 1888–1900s
  'besant-theosophy',       // 1893–1933
  'steiner',                // 1904–1925
  'leadbeater-theosophy',   // 1910–1927
  'manly-p-hall',           // 1928
  'perennial-philosophy',   // 1945
  'tolkien',                // 1914–1973
  'ra-law-of-one',          // 1981–1984
];

// Era groupings for the perspective picker accordion
export const ERA_GROUPS = [
  {
    id: 'near-east',
    label: 'Ancient Near East',
    period: '3500–300 BCE',
    traditions: ['sumerian', 'babylon', 'assyrian', 'phoenician', 'genesis'],
  },
  {
    id: 'ancient',
    label: 'Classical World',
    period: '6th c BCE – 5th c CE',
    traditions: ['pythagorean', 'plato', 'vedic', 'corpus-hermeticum', 'ptolemaic', 'mithraic', 'gnostic', 'kabbalah', 'neoplatonist'],
  },
  {
    id: 'medieval',
    label: 'Medieval',
    period: '7th – 14th c CE',
    traditions: ['norse', 'al-farabi', 'ikhwan-al-safa', 'sabians', 'dante'],
  },
  {
    id: 'renaissance',
    label: 'Renaissance',
    period: '15th – 17th c',
    traditions: ['tarot', 'ficino', 'agrippa', 'paracelsus', 'john-dee', 'kepler', 'rosicrucian'],
  },
  {
    id: 'modern',
    label: 'Modern Esoteric',
    period: '19th – mid 20th c',
    traditions: ['blavatsky', 'golden-dawn', 'besant-theosophy', 'steiner', 'leadbeater-theosophy', 'manly-p-hall', 'perennial-philosophy'],
  },
  {
    id: 'contemporary',
    label: 'Contemporary',
    period: 'mid 20th c – present',
    traditions: ['tolkien', 'ra-law-of-one'],
  },
];

// Chart orders that map to a clock setting on the orbital diagram.
// '24h'  = geocentric with 24-hour weekday clock face
// '12h'  = heliocentric with 12-hour clock face
// null   = standard geocentric (calendar overlay, no clock face)
const CLOCK_SETTINGS = {
  weekdays: '24h',
  heliocentric: '12h',
  chaldean: null,
  ascending: null,
  descending: null,
  evolutionary: null,
  sephirotic: null,
};

const ORDER_LABELS = {
  chaldean: 'Chaldean Order',
  ascending: 'Ascending Order',
  heliocentric: 'Heliocentric Order',
  weekdays: 'Weekday Order',
  descending: 'Descending Order',
  evolutionary: 'Evolutionary Order',
  sephirotic: 'Sephirotic Order',
};

// Traditions where numbered display should NOT reverse (divine is already at low numbers)
// All other numbered traditions display reversed: earthly at bottom, monad/divine at top
const DISPLAY_KEEP_ORDER = new Set(['genesis', 'norse', 'kepler', 'john-dee', 'tolkien', 'ikhwan-al-safa', 'al-farabi', 'agrippa', 'gnostic', 'sabians']);

// Standard planet orderings (fallback when a chart has no numbered entries)
const STANDARD_ORDERS = {
  chaldean: ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'],
  ascending: ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn'],
  descending: ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'],
  weekdays: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
};

const PLANET_COLORS = {
  Sun: '#e8e8e8', Moon: '#9b59b6', Mars: '#4a90d9',
  Mercury: '#4caf50', Jupiter: '#f0c040', Venus: '#e67e22', Saturn: '#c04040',
};

function camelToTitle(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

function isPopulated(chart) {
  const corr = chart.correspondences;
  if (!corr) return false;
  return Object.values(corr).some(entry =>
    Object.keys(entry).some(k => !META_KEYS.has(k) && entry[k] != null && entry[k] !== '')
  );
}

// Derive planet navigation order from a chart.
// Only entries with a classicalPlanet mapping are navigable planets;
// non-planetary layers (Material World, Fixed Stars, Kether, etc.) are excluded.
function derivePlanetOrder(chart) {
  const entries = Object.entries(chart.correspondences);
  const hasNumbers = entries.some(([, d]) => d.number != null);

  if (hasNumbers) {
    // Sort by number field; only include entries that map to a classical planet
    const planets = entries
      .filter(([, d]) => d.number != null && d.classicalPlanet)
      .sort((a, b) => a[1].number - b[1].number)
      .map(([, d]) => d.classicalPlanet);
    if (planets.length > 0) return planets;
  }

  // Use the stated order type if we have a standard sequence
  if (chart.order && STANDARD_ORDERS[chart.order]) {
    return STANDARD_ORDERS[chart.order];
  }

  // Fallback: standard chaldean
  return STANDARD_ORDERS.chaldean;
}

// Build reverse lookup: classicalPlanet → epoch key (for Steiner)
function buildClassicalReverse(chart) {
  const map = {};
  for (const [epochKey, data] of Object.entries(chart.correspondences)) {
    if (data.classicalPlanet) {
      map[data.classicalPlanet] = epochKey;
    }
  }
  return map;
}

export default function usePerspective(selectedPlanet) {
  const [activePerspective, setActivePerspective] = useState('mythouse');

  const perspectives = useMemo(() => {
    return vaultIndex.charts.map(entry => {
      const chart = CHART_MAP[entry.id];
      return {
        id: entry.id,
        tradition: entry.tradition,
        populated: chart ? isPopulated(chart) : false,
      };
    });
  }, []);

  const populated = useMemo(() => perspectives.filter(p => p.populated), [perspectives]);
  const activeChart = activePerspective === 'mythouse' ? null : CHART_MAP[activePerspective] || null;

  // Resolve planet data — handles Steiner epoch key reverse lookup
  const resolvePlanetData = useCallback((chart, planet) => {
    if (!chart || !planet) return null;
    const corr = chart.correspondences;
    if (corr[planet]) return { key: planet, data: corr[planet], epochName: null };
    const reverse = buildClassicalReverse(chart);
    const epochKey = reverse[planet];
    if (epochKey) return { key: epochKey, data: corr[epochKey], epochName: epochKey };
    return null;
  }, []);

  const perspectiveData = useMemo(() => {
    if (!activeChart || !selectedPlanet) return null;
    return resolvePlanetData(activeChart, selectedPlanet);
  }, [activeChart, selectedPlanet, resolvePlanetData]);

  // Tab definitions from the active tradition's column keys
  // Priority tabs (metal, planet, self) come first; the rest follow in discovery order.
  // SELF_KEYS collapse into a single "__self__" synthetic tab.
  // Dante gets special three-realm tabs instead of flat keys.
  const perspectiveTabs = useMemo(() => {
    if (!activeChart) return null;
    // Dante: use fixed realm tabs
    if (activePerspective === 'dante') return DANTE_TABS;
    const keySet = new Set();
    let hasSelf = false;
    for (const data of Object.values(activeChart.correspondences)) {
      for (const k of Object.keys(data)) {
        if (META_KEYS.has(k)) continue;
        if (SELF_KEYS.has(k)) { hasSelf = true; continue; }
        keySet.add(k);
      }
    }
    const keys = Array.from(keySet);
    // Inject synthetic __self__ tab if any self-keys exist
    if (hasSelf) keys.push('__self__');
    // Split into priority (in defined order) and the rest (in discovery order)
    const priority = TAB_PRIORITY.filter(k => keys.includes(k));
    const rest = keys.filter(k => !TAB_PRIORITY.includes(k));
    return [...priority, ...rest].map(k => ({
      id: k,
      label: TAB_LABEL_OVERRIDES[k] || camelToTitle(k),
    }));
  }, [activeChart, activePerspective]);

  // Planet navigation order for the active tradition
  const activePlanetOrder = useMemo(() => {
    if (!activeChart) return null;
    const sequence = derivePlanetOrder(activeChart);
    return sequence.map(planet => ({
      planet,
      label: planet.substring(0, 3),
      day: planet,
      color: PLANET_COLORS[planet] || '#888',
    }));
  }, [activeChart]);

  // Get all planets' values for a given column key
  const getColumnSequence = useCallback((columnKey) => {
    if (!activeChart) return [];
    return Object.entries(activeChart.correspondences).map(([key, data]) => ({
      key,
      classicalPlanet: data.classicalPlanet || null,
      value: data[columnKey] ?? null,
    }));
  }, [activeChart]);

  const activeTradition = useMemo(() => {
    if (activePerspective === 'mythouse') return null;
    if (!activeChart) return null;
    const base = {
      tradition: activeChart.tradition,
      sourceText: activeChart.sourceText,
      period: activeChart.period,
      order: activeChart.order,
      note: activeChart.note || null,
    };
    // Dante: pass realm metadata for the three-realm display
    if (activeChart.threeOrders) base.threeOrders = activeChart.threeOrders;
    if (activeChart.authorCommentary) base.authorCommentary = activeChart.authorCommentary;
    return base;
  }, [activePerspective, activeChart]);

  // Cycle through: Mythouse → curated populated traditions → back to Mythouse
  const populatedIds = useMemo(() => new Set(populated.map(p => p.id)), [populated]);
  const cycleNext = useCallback(() => {
    const cycle = ['mythouse', ...CYCLE_ORDER.filter(id => populatedIds.has(id))];
    const idx = cycle.indexOf(activePerspective);
    const next = cycle[(idx + 1) % cycle.length];
    setActivePerspective(next);
  }, [populatedIds, activePerspective]);

  const perspectiveLabel = activePerspective === 'mythouse'
    ? 'Atlas'
    : activePerspective === 'krishnamurti'
    ? 'Krishnamurti'
    : activeChart?.tradition || activePerspective;

  // Current chart's order field and derived clock setting
  // Mythouse defaults to weekday order (Sun Mon Tue … Sat)
  const chartOrder = activePerspective === 'mythouse' ? 'weekdays' : (activeChart?.order || null);
  // Clock mode driven by centerModel: geocentric → 24h live positions, heliocentric → 12h
  const centerModel = activeChart?.centerModel || 'geocentric';
  const clockMode = centerModel === 'heliocentric' ? '12h' : '24h';
  const orderLabel = chartOrder ? (ORDER_LABELS[chartOrder] || chartOrder) : null;

  // Should the popup display be reversed? (earthly at bottom, divine at top)
  // Only for numbered charts that aren't in the keep-order exception set
  const displayReversed = useMemo(() => {
    if (!activeChart || DISPLAY_KEEP_ORDER.has(activePerspective)) return false;
    return Object.values(activeChart.correspondences).some(d => d.number != null);
  }, [activeChart, activePerspective]);

  // Look up a tradition's data for a given beyond ring (worldSoul / nous / source).
  // Handles Dante's special `beyondTheSeven` top-level field.
  const getBeyondData = useCallback((ringId) => {
    if (!activeChart || activePerspective === 'mythouse') return null;
    const ring = ringId === 'fixedStars'
      ? FIXED_STARS_RING
      : BEYOND_RINGS.find(r => r.id === ringId);
    if (!ring) return null;
    const tradMapping = ring.traditions[activePerspective];
    if (!tradMapping) return null;
    const { correspondenceKey, label } = tradMapping;

    // Dante stores beyond-planetary data in a separate top-level field
    if (correspondenceKey.startsWith('beyondTheSeven.')) {
      const subKey = correspondenceKey.split('.')[1];
      const data = activeChart.beyondTheSeven?.[subKey];
      if (!data) return null;
      return { label, ...data };
    }

    // All other traditions store it in correspondences
    const data = activeChart.correspondences[correspondenceKey];
    if (!data) return null;
    return { label, ...data };
  }, [activeChart, activePerspective]);

  return {
    activePerspective,
    setActivePerspective,
    perspectives,
    populated,
    perspectiveData,
    perspectiveTabs,
    activePlanetOrder,
    getColumnSequence,
    activeTradition,
    cycleNext,
    perspectiveLabel,
    camelToTitle,
    chartOrder,
    clockMode,
    centerModel,
    zodiacFrame: activeChart?.zodiacFrame || 'tropical',
    orderLabel,
    displayReversed,
    getBeyondData,
  };
}

export { META_KEYS, SELF_KEYS, DANTE_REALM_KEYS, TAB_LABEL_OVERRIDES, CYCLE_ORDER, camelToTitle };
