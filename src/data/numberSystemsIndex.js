/**
 * Number Systems Index
 * Normalizes 6 number traditions into a flat queryable array.
 *
 * Each entry: { tradition, traditionLabel, number, name, summary, detail }
 * where `detail` preserves all tradition-specific fields.
 */

import medicineWheels from './medicineWheels.json';
import medicineWheelContent from './medicineWheelContent.json';
import pythagoreanData from '../vault/planetary-charts/pythagorean.json';
import kabbalahData from '../vault/planetary-charts/kabbalah.json';
import tarotData from '../vault/planetary-charts/tarot.json';
import { TRIGRAMS, HEXAGRAMS } from './ichingData';
import { NUMBER_MEANINGS } from '../profile/numerologyEngine';

/* ─── helpers ─── */

const earthCountWheel = medicineWheels.wheels.find(w => w.id === 'earthCount');

const DIR_TO_NUM = { center: 0 };
if (earthCountWheel) {
  earthCountWheel.positions.forEach(p => { DIR_TO_NUM[p.dir] = p.num; });
}

/* ─── tradition metadata ─── */

export const TRADITIONS = [
  { id: 'earth-count',        label: 'Storm (Earth Count)',  range: [0, 10] },
  { id: 'pythagorean-decad',  label: 'Pythagorean Decad',   range: [1, 10] },
  { id: 'kabbalah',           label: 'Kabbalah (Sephiroth)', range: [1, 10] },
  { id: 'tarot',              label: 'Tarot (Major Arcana)', range: [0, 21] },
  { id: 'iching-trigrams',    label: 'I Ching (Trigrams)',   range: [0, 7]  },
  { id: 'iching-hexagrams',   label: 'I Ching (Hexagrams)',  range: [1, 64] },
  { id: 'numerology',         label: 'Numerology',           range: [1, 33] },
];

/* ─── normalization per tradition ─── */

function normalizeEarthCount() {
  const entries = [];
  // center = 0
  const centerContent = medicineWheelContent['earthCount:center'] || {};
  entries.push({
    tradition: 'earth-count',
    traditionLabel: 'Storm (Earth Count)',
    number: 0,
    name: 'The Sacred Zero — WahKahn & SsKwan',
    summary: centerContent.summary || '',
    detail: { ...centerContent, dir: 'center' },
  });
  // positions 1-10
  if (earthCountWheel) {
    earthCountWheel.positions.forEach(pos => {
      const content = medicineWheelContent[`earthCount:${pos.dir}`] || {};
      entries.push({
        tradition: 'earth-count',
        traditionLabel: 'Storm (Earth Count)',
        number: pos.num,
        name: pos.label,
        summary: content.summary || pos.sublabel || '',
        detail: { ...content, dir: pos.dir, sublabel: pos.sublabel, shortLabel: pos.shortLabel },
      });
    });
  }
  return entries;
}

function normalizePythagorean() {
  return Object.entries(pythagoreanData.correspondences).map(([name, entry]) => ({
    tradition: 'pythagorean-decad',
    traditionLabel: 'Pythagorean Decad',
    number: entry.number,
    name,
    summary: entry.principle,
    detail: { ...entry },
  }));
}

function normalizeKabbalah() {
  return Object.entries(kabbalahData.correspondences).map(([name, entry]) => ({
    tradition: 'kabbalah',
    traditionLabel: 'Kabbalah (Sephiroth)',
    number: entry.number,
    name,
    summary: entry.teaching ? entry.teaching.slice(0, 200) + '…' : '',
    detail: { ...entry },
  }));
}

function normalizeTarot() {
  return Object.entries(tarotData.correspondences).map(([name, entry]) => ({
    tradition: 'tarot',
    traditionLabel: 'Tarot (Major Arcana)',
    number: entry.arcanaNumber,
    name: `${entry.romanNumeral} — ${name}`,
    summary: entry.overview ? entry.overview.split('\n')[0] : '',
    detail: { ...entry, cardName: name },
  }));
}

function normalizeTrigrams() {
  return TRIGRAMS.map(t => ({
    tradition: 'iching-trigrams',
    traditionLabel: 'I Ching (Trigrams)',
    number: t.id,
    name: `${t.symbol} ${t.name} (${t.ch})`,
    summary: `${t.attr} — ${t.family}`,
    detail: { ...t },
  }));
}

function normalizeHexagrams() {
  return HEXAGRAMS.map(h => ({
    tradition: 'iching-hexagrams',
    traditionLabel: 'I Ching (Hexagrams)',
    number: h.n,
    name: `${h.n}. ${h.name} (${h.ch})`,
    summary: h.judgment,
    detail: { ...h },
  }));
}

function normalizeNumerology() {
  return Object.entries(NUMBER_MEANINGS).map(([key, meaning]) => ({
    tradition: 'numerology',
    traditionLabel: 'Numerology',
    number: Number(key),
    name: `Number ${key}`,
    summary: meaning,
    detail: { meaning, number: Number(key) },
  }));
}

/* ─── build flat array ─── */

export const ALL_ENTRIES = [
  ...normalizeEarthCount(),
  ...normalizePythagorean(),
  ...normalizeKabbalah(),
  ...normalizeTarot(),
  ...normalizeTrigrams(),
  ...normalizeHexagrams(),
  ...normalizeNumerology(),
];

/* ─── lookup helpers ─── */

export function entriesForNumber(n) {
  return ALL_ENTRIES.filter(e => e.number === n);
}

export function entriesForTradition(id) {
  return ALL_ENTRIES.filter(e => e.tradition === id);
}

export function entriesInRange(lo, hi) {
  return ALL_ENTRIES.filter(e => e.number >= lo && e.number <= hi);
}
