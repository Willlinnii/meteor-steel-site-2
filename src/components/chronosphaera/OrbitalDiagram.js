import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Body, GeoVector, Ecliptic, MoonPhase, EclipticLongitude, SearchRiseSet, Observer } from 'astronomy-engine';
import { useProfile } from '../../profile/ProfileContext';
import PlanetNode from './PlanetNode';
import wheelData from '../../data/medicineWheels.json';
import psychlesData from '../../data/monomythPsychles.json';
import starsNorth from '../../data/starsNorth.json';
import starsSouth from '../../data/starsSouth.json';
import constellationsData from '../../data/constellations.json';
import zodiacCultureData from '../../data/chronosphaeraZodiac.json';
import constellationCultures from '../../data/constellationCultures.json';
import { CHAKRA_ORDERINGS, CHAKRA_MODE_LABELS } from '../../data/chronosphaeraBodyPositions';

const BODY_MAP = {
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Sun: Body.Sun,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

const SIGN_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

function getEclipticLongitude(planet) {
  const vec = GeoVector(BODY_MAP[planet], new Date(), true);
  return Ecliptic(vec).elon;
}

function getHeliocentricLongitude(planet) {
  if (planet === 'Earth') {
    // Earth's heliocentric longitude = Sun's geocentric longitude + 180°
    const vec = GeoVector(Body.Sun, new Date(), true);
    return (Ecliptic(vec).elon + 180) % 360;
  }
  return EclipticLongitude(Body[planet], new Date());
}

function getLahiriAyanamsa() {
  const now = new Date();
  const fracYear = now.getFullYear() + (now.getMonth() / 12) + (now.getDate() / 365.25);
  return 23.853 + (fracYear - 2000) * 0.01397; // ~24.2° in 2026
}

function lonToSignLabel(lon, siderealOffset = 0) {
  const adjLon = ((lon - siderealOffset) % 360 + 360) % 360;
  const signIndex = Math.floor(adjLon / 30) % 12;
  const deg = Math.floor(adjLon % 30);
  return `${deg}° ${SIGN_SYMBOLS[signIndex]}`;
}

const ORBITS = [
  { planet: 'Moon',    metal: 'Silver',  r: 55,  angle: -90,  speed: 6 },
  { planet: 'Mercury', metal: 'Mercury', r: 90,  angle: -40,  speed: 2 },
  { planet: 'Venus',   metal: 'Copper',  r: 125, angle: -130, speed: 1 },
  { planet: 'Sun',     metal: 'Gold',    r: 160, angle: 20,   speed: 0.6 },
  { planet: 'Mars',    metal: 'Iron',    r: 198, angle: -70,  speed: 0.35 },
  { planet: 'Jupiter', metal: 'Tin',     r: 238, angle: 160,  speed: 0.12 },
  { planet: 'Saturn',  metal: 'Lead',    r: 278, angle: 100,  speed: 0.06 },
];

const HELIO_ORBITS = [
  { planet: 'Mercury', r: 55,  angle: -40,  speed: 4.15 },
  { planet: 'Venus',   r: 95,  angle: -130, speed: 1.62 },
  { planet: 'Earth',   r: 140, angle: 20,   speed: 1 },
  { planet: 'Mars',    r: 185, angle: -70,  speed: 0.53 },
  { planet: 'Jupiter', r: 230, angle: 160,  speed: 0.084 },
  { planet: 'Saturn',  r: 278, angle: 100,  speed: 0.034 },
];
const HELIO_MOON = { r: 18, speed: 13.37 };

const CHAKRA_POSITIONS = [
  { label: 'Crown',        x: 350, y: 72,  color: '#9b59b6' },
  { label: 'Third Eye',    x: 350, y: 112, color: '#6a5acd' },
  { label: 'Throat',       x: 350, y: 152, color: '#4a9bd9' },
  { label: 'Heart',        x: 350, y: 190, color: '#4caf50' },
  { label: 'Solar Plexus', x: 350, y: 225, color: '#f0c040' },
  { label: 'Sacral',       x: 350, y: 260, color: '#e67e22' },
  { label: 'Root',         x: 350, y: 295, color: '#c04040' },
];

// CHAKRA_ORDERINGS and CHAKRA_MODE_LABELS imported from chronosphaeraBodyPositions.js

// SVG path glyphs for zodiac signs (drawn in a ~16x16 viewBox, centered at 0,0)
const ZODIAC_GLYPHS = {
  Aries: 'M-5,6 C-5,-2 -1,-7 0,-7 C1,-7 5,-2 5,6 M0,-7 L0,7',
  Taurus: 'M-6,-4 C-6,-8 6,-8 6,-4 M0,-4 C-4,-4 -6,0 -6,3 C-6,6 -3,7 0,7 C3,7 6,6 6,3 C6,0 4,-4 0,-4',
  Gemini: 'M-6,-7 C-2,-5 2,-5 6,-7 M-6,7 C-2,5 2,5 6,7 M-3,-6 L-3,6 M3,-6 L3,6',
  Cancer: 'M-6,-1 C-6,-5 0,-5 3,-3 M6,1 C6,5 0,5 -3,3 M-4,-1 A2,2 0 1,1 -4,-1.01 M4,1 A2,2 0 1,1 4,1.01',
  Leo: 'M-5,5 C-5,1 -2,-2 0,-2 C2,-2 4,0 4,3 C4,5 3,6 2,6 M0,-2 C-2,-2 -4,-5 -2,-7 C0,-8 3,-7 4,-5',
  Virgo: 'M-6,6 L-6,-4 C-6,-6 -4,-6 -3,-4 L-3,4 C-3,6 -1,6 0,4 L0,-4 C0,-6 2,-6 3,-4 L3,4 C3,6 5,4 6,2 M3,4 C4,6 6,7 7,5',
  Libra: 'M-7,3 L7,3 M-5,0 C-5,-4 5,-4 5,0 M-7,6 L7,6',
  Scorpio: 'M-6,6 L-6,-4 C-6,-6 -4,-6 -3,-4 L-3,4 C-3,6 -1,6 0,4 L0,-4 C0,-6 2,-6 3,-4 L3,6 L5,4 M3,6 L5,8',
  Sagittarius: 'M-5,7 L6,-6 M6,-6 L1,-6 M6,-6 L6,-1 M-3,2 L3,-4',
  Capricorn: 'M-7,2 C-7,-4 -3,-7 0,-4 L0,4 C0,7 3,8 5,6 C7,4 6,1 4,1 C2,1 1,3 2,5',
  Aquarius: 'M-7,-2 L-4,-5 L-1,-2 L2,-5 L5,-2 M-7,2 L-4,-1 L-1,2 L2,-1 L5,2',
  Pisces: 'M-6,0 L6,0 M-3,-7 C-6,-4 -6,4 -3,7 M3,-7 C6,-4 6,4 3,7',
};

const ZODIAC = [
  { sign: 'Aries',       symbol: '♈' },
  { sign: 'Taurus',      symbol: '♉' },
  { sign: 'Gemini',      symbol: '♊' },
  { sign: 'Cancer',      symbol: '♋' },
  { sign: 'Leo',         symbol: '♌' },
  { sign: 'Virgo',       symbol: '♍' },
  { sign: 'Libra',       symbol: '♎' },
  { sign: 'Scorpio',     symbol: '♏' },
  { sign: 'Sagittarius', symbol: '♐' },
  { sign: 'Capricorn',   symbol: '♑' },
  { sign: 'Aquarius',    symbol: '♒' },
  { sign: 'Pisces',      symbol: '♓' },
];

const ZODIAC_TAROT = {
  Aries: 'The Emperor', Taurus: 'The Hierophant', Gemini: 'The Lovers',
  Cancer: 'The Chariot', Leo: 'Strength', Virgo: 'The Hermit',
  Libra: 'Justice', Scorpio: 'Death', Sagittarius: 'Temperance',
  Capricorn: 'The Devil', Aquarius: 'The Star', Pisces: 'The Moon',
};

const CARDINALS = [
  { id: 'vernal-equinox',   label: 'Vernal Equinox',   angle: 0,    symbol: '☽' },
  { id: 'summer-solstice',  label: 'Summer Solstice',  angle: -90,  symbol: '☀' },
  { id: 'autumnal-equinox', label: 'Autumnal Equinox', angle: 180,  symbol: '☽' },
  { id: 'winter-solstice',  label: 'Winter Solstice',  angle: 90,   symbol: '❄' },
];

const CX = 350;
const CY = 350;
const ALIGN_ANGLE = -90;
const ZODIAC_INNER_R = 300;
const ZODIAC_OUTER_R = 340;
const ZODIAC_TEXT_R = 320;
const CARDINAL_R = (ZODIAC_INNER_R + ZODIAC_OUTER_R) / 2; // midpoint of band
const MAX_STAR_R = 295; // just inside zodiac inner ring
const STAR_SPHERE_INNER = ZODIAC_OUTER_R + 1; // just outside zodiac band
const STAR_SPHERE_OUTER = ZODIAC_OUTER_R + 1 + Math.round((ZODIAC_OUTER_R - ZODIAC_INNER_R) / 3);
const STAR_SPHERE_MID = (STAR_SPHERE_INNER + STAR_SPHERE_OUTER) / 2;
const STAR_SPHERE_WIDTH = STAR_SPHERE_OUTER - STAR_SPHERE_INNER;

// Build an SVG arc path for text to follow
function arcPath(cx, cy, r, startDeg, endDeg, sweep) {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  return `M ${x1},${y1} A ${r},${r} 0 0,${sweep} ${x2},${y2}`;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_RING_INNER = 260;
const MONTH_RING_OUTER = 295;
const MONTH_TEXT_R = 278;
// Offset so months align astronomically with zodiac:
// Jan 1 Sun ≈ 280° ecliptic → SVG angle = -280° = 80°
const MONTH_OFFSET = 80;

const WHEEL_RINGS = [
  { idx: 0, innerR: 0, outerR: 40, textR: 26 },
  { idx: 1, innerR: 40, outerR: 78, textR: 59 },
  { idx: 2, innerR: 78, outerR: 114, textR: 96 },
  { idx: 3, innerR: 114, outerR: 150, textR: 132 },
  { idx: 4, innerR: 150, outerR: 192, textR: 171 },
  { idx: 5, innerR: 192, outerR: 236, textR: 214 },
  { idx: 6, innerR: 236, outerR: 280, textR: 258 },
];
const MW_OUTER_R = 300;
const NUM_RING_R = 290;
const NUM_TO_DIR = { 1: 'E', 2: 'W', 3: 'S', 4: 'N', 5: 'C5', 6: 'SE', 7: 'SW', 8: 'NW', 9: 'NE', 10: 'C10' };
const NUM_ANGLES = [
  { num: 1, angle: 0 },
  { num: 2, angle: 180 },
  { num: 3, angle: 90 },
  { num: 4, angle: -90 },
  { num: 6, angle: 45 },
  { num: 7, angle: 135 },
  { num: 8, angle: -135 },
  { num: 9, angle: -45 },
];

/* Rotate text so it follows the circle tangent, always right-side up */
function tangentRotation(angleDeg) {
  if (angleDeg == null) return 0;
  let rot = angleDeg + 90;
  while (rot > 180) rot -= 360;
  while (rot < -180) rot += 360;
  if (rot > 90 || rot < -90) rot += 180;
  while (rot > 180) rot -= 360;
  while (rot < -180) rot += 360;
  return rot;
}

function starToSvg(ra, dec) {
  const angleRad = (-ra * Math.PI) / 180;
  const r = MAX_STAR_R * (1 - Math.abs(dec) / 90);
  return { x: CX + r * Math.cos(angleRad), y: CY + r * Math.sin(angleRad) };
}
function starRadius(mag) { return 0.4 + (6 - mag) * 0.35; }
function starOpacity(mag) { return 0.3 + (6 - mag) * 0.1; }

const MW_QUADRANTS = [
  { dir: 'N', startDeg: -135, endDeg: -45 },
  { dir: 'E', startDeg: -45, endDeg: 45 },
  { dir: 'S', startDeg: 45, endDeg: 135 },
  { dir: 'W', startDeg: 135, endDeg: 225 },
];

const CYCLE_RINGS = [
  { key: 'wakingDreaming', label: 'Wake & Sleep', cycleName: 'Wake & Sleep', innerR: 30, outerR: 70, textR: 50, fontSize: 5.5 },
  { key: 'procreation', label: 'Procreation', cycleName: 'Procreation', innerR: 75, outerR: 115, textR: 95, fontSize: 6.5 },
  { key: 'lifeDeath', label: 'Life & Death', cycleName: 'Mortality', innerR: 120, outerR: 160, textR: 140, fontSize: 7.5 },
  { key: 'solarDay', label: 'Solar Day', cycleName: 'Solar Day', innerR: 165, outerR: 205, textR: 185, fontSize: 8.5 },
  { key: 'lunarMonth', label: 'Lunar Month', cycleName: 'Lunar Month', innerR: 210, outerR: 250, textR: 230, fontSize: 9 },
  { key: 'solarYear', label: 'Solar Year', cycleName: 'Solar Year', innerR: 255, outerR: 295, textR: 275, fontSize: 10 },
];

const PLANET_COLORS = {
  Moon: '#c8d8e8', Mercury: '#b8b8c8', Venus: '#e8b060',
  Sun: '#f0c040', Mars: '#d06040', Jupiter: '#a0b8c0', Saturn: '#908070',
};

function quadrantArc(cx, cy, r, startDeg, endDeg) {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  return `M ${cx},${cy} L ${cx + r * Math.cos(s)},${cy + r * Math.sin(s)} A ${r},${r} 0 0,1 ${cx + r * Math.cos(e)},${cy + r * Math.sin(e)} Z`;
}

// Load YouTube IFrame API once (shared with CircleNav)
let ytApiReady = false;
let ytApiCallbacks = [];
function ensureYTApi() {
  if (ytApiReady || window.YT?.Player) { ytApiReady = true; return Promise.resolve(); }
  return new Promise(resolve => {
    ytApiCallbacks.push(resolve);
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        if (prev) prev();
        ytApiCallbacks.forEach(cb => cb());
        ytApiCallbacks = [];
      };
    }
  });
}

export default function OrbitalDiagram({ tooltipData, selectedPlanet, onSelectPlanet, hoveredPlanet, selectedSign, onSelectSign, selectedCardinal, onSelectCardinal, selectedEarth, onSelectEarth, showCalendar, onToggleCalendar, selectedMonth, onSelectMonth, showMedicineWheel, onToggleMedicineWheel, selectedWheelItem, onSelectWheelItem, chakraViewMode, onToggleChakraView, onClickOrderLabel, videoUrl, onCloseVideo, ybrActive, ybrCurrentStopIndex, ybrStopProgress, ybrJourneySequence, onToggleYBR, ybrAutoStart, clockMode, onToggleClock, showMonomyth, showMeteorSteel, monomythStages, selectedMonomythStage, onSelectMonomythStage, onToggleMonomyth, monomythModel, showCycles, onSelectCycleSegment, activeCulture, showFallenStarlight, showStoryOfStories, onToggleStarlight, starlightStages, selectedStarlightStage, onSelectStarlightStage, selectedConstellation, onSelectConstellation, zodiacMode, onSelectStarSphere, starSphereActive }) {
  const wrapperRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const { hasPurchase } = useProfile();
  const navigate = useNavigate();
  const [starSphereHover, setStarSphereHover] = useState(false);

  // Pre-generate star positions for the star sphere ring (narrow band outside zodiac)
  const starBeltDots = useMemo(() => {
    const dots = [];
    let seed = 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 80; i++) {
      const angle = rand() * Math.PI * 2;
      const r = STAR_SPHERE_INNER + rand() * STAR_SPHERE_WIDTH;
      dots.push({
        x: CX + r * Math.cos(angle),
        y: CY + r * Math.sin(angle),
        r: 0.3 + rand() * 0.9,
        a: 0.3 + rand() * 0.7,
      });
    }
    return dots;
  }, []);
  const [starlightGateId, setStarlightGateId] = useState(null); // null, 'fallen-starlight', or 'story-of-stories'
  const [medicineWheelGateId, setMedicineWheelGateId] = useState(null);
  const hasFallenStarlight = hasPurchase('fallen-starlight');
  const hasStoryOfStories = hasPurchase('story-of-stories');
  const hasMedicineWheel = hasPurchase('medicine-wheel');

  // --- Analog clock state & effects ---
  const showClock = !!clockMode;
  const [clockTime, setClockTime] = useState({ h: 0, m: 0, s: 0 });
  const clockTzRef = useRef(null);

  const [geoLocation, setGeoLocation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('https://worldtimeapi.org/api/ip')
      .then(r => r.json())
      .then(data => { if (!cancelled && data.timezone) clockTzRef.current = data.timezone; })
      .catch(() => {});
    fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.latitude != null && data.longitude != null) {
          setGeoLocation({ lat: data.latitude, lon: data.longitude });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Sunrise/sunset times for the 24h clock
  const sunriseSunset = useMemo(() => {
    if (clockMode !== '24h' || !geoLocation) return null;
    try {
      const obs = new Observer(geoLocation.lat, geoLocation.lon, 0);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const rise = SearchRiseSet(Body.Sun, obs, 1, startOfDay, 1);
      const set = SearchRiseSet(Body.Sun, obs, -1, startOfDay, 1);
      if (!rise || !set) return null;
      const toLocalHours = (astroTime) => {
        const d = astroTime.date;
        const tz = clockTzRef.current;
        if (tz) {
          const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false });
          const parts = fmt.formatToParts(d);
          const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
          const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
          return h + m / 60;
        }
        return d.getHours() + d.getMinutes() / 60;
      };
      const riseH = toLocalHours(rise);
      const setH = toLocalHours(set);
      const fmtTime = (h) => {
        const hr = Math.floor(h);
        const mn = Math.round((h - hr) * 60);
        return `${hr}:${mn.toString().padStart(2, '0')}`;
      };
      return { riseHours: riseH, setHours: setH, riseLabel: fmtTime(riseH), setLabel: fmtTime(setH) };
    } catch (e) { console.warn('sunrise/sunset calc failed:', e); return null; }
  }, [clockMode, geoLocation]);

  useEffect(() => {
    if (!showClock) return;
    const tick = () => {
      const now = new Date();
      const tz = clockTzRef.current;
      if (tz) {
        const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
        const parts = fmt.formatToParts(now);
        const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
        setClockTime({ h: get('hour'), m: get('minute'), s: get('second') });
      } else {
        setClockTime({ h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [showClock]);

  const handleTooltipEnter = useCallback((type, key, e) => {
    if (showMedicineWheel || chakraViewMode) return;
    setTooltip({ type, key, x: e.clientX, y: e.clientY });
  }, [showMedicineWheel, chakraViewMode]);

  const handleTooltipMove = useCallback((e) => {
    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Pre-compute constellation projected lines and star-to-constellation lookups
  // (must be above renderTooltipContent which references constellationMap)
  const { constellationMap, northStarToCid, southStarToCid } = useMemo(() => {
    const cMap = {};
    const n2c = {}; // northStarIndex → constellation id
    const s2c = {}; // southStarIndex → constellation id
    for (const c of constellationsData) {
      cMap[c.id] = {
        name: c.name,
        lines: c.lines.map(([[ra1, dec1], [ra2, dec2]]) => {
          const p1 = starToSvg(ra1, dec1);
          const p2 = starToSvg(ra2, dec2);
          return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, dec1, dec2 };
        }),
        northStars: c.ns,
        southStars: c.ss,
      };
      for (const idx of c.ns) n2c[idx] = c.id;
      for (const idx of c.ss) s2c[idx] = c.id;
    }
    return { constellationMap: cMap, northStarToCid: n2c, southStarToCid: s2c };
  }, []);

  const renderTooltipContent = useCallback(() => {
    if (!tooltip || !tooltipData) return null;
    const { type, key } = tooltip;
    if (type === 'planet') {
      const d = tooltipData.planets[key];
      if (!d) return null;
      return (
        <>
          <div className="orbital-tooltip-title">{key} — {d.metal}</div>
          <div className="orbital-tooltip-row">{d.day} · {d.chakra}</div>
          <div className="orbital-tooltip-row">{d.sin} / {d.virtue}</div>
          <div className="orbital-tooltip-desc">{d.astrology}</div>
        </>
      );
    }
    if (type === 'zodiac') {
      const d = tooltipData.zodiac[key];
      if (!d) return null;
      return (
        <>
          <div className="orbital-tooltip-title">{d.symbol} {key} — {d.archetype}</div>
          <div className="orbital-tooltip-row">{d.element} · {d.modality} · {d.ruler}</div>
          <div className="orbital-tooltip-row">{d.dates}</div>
        </>
      );
    }
    if (type === 'cardinal') {
      const d = tooltipData.cardinals[key];
      if (!d) return null;
      return (
        <>
          <div className="orbital-tooltip-title">{d.label}</div>
          <div className="orbital-tooltip-row">{d.date} · {d.season} · {d.direction}</div>
          <div className="orbital-tooltip-row">{d.zodiacCusp}</div>
        </>
      );
    }
    if (type === 'month') {
      const d = tooltipData.months[key];
      if (!d) return null;
      return (
        <>
          <div className="orbital-tooltip-title">{key}</div>
          <div className="orbital-tooltip-row">{d.stone} · {d.flower}</div>
          {d.mood && <div className="orbital-tooltip-desc">{d.mood}</div>}
        </>
      );
    }
    if (type === 'daynight') {
      const d = tooltipData.dayNight[key];
      if (!d) return null;
      return (
        <>
          <div className="orbital-tooltip-title">{d.label}</div>
          <div className="orbital-tooltip-row">{d.element} · {d.polarity}</div>
          <div className="orbital-tooltip-desc">{d.qualities}</div>
        </>
      );
    }
    if (type === 'constellation') {
      const c = constellationMap[key];
      if (!c) return null;
      const cultureKey = activeCulture ? activeCulture.toLowerCase() : null;
      const cultureName = cultureKey && constellationCultures[key]?.[cultureKey];
      return (
        <>
          <div className="orbital-tooltip-title">{cultureName || c.name}</div>
          {cultureName && cultureName !== c.name && <div className="orbital-tooltip-row">{c.name}</div>}
        </>
      );
    }
    return null;
  }, [tooltip, tooltipData, constellationMap, activeCulture]);

  const [aligned, setAligned] = useState(false);
  const [livePositions, setLivePositions] = useState(false);
  const [heliocentric, setHeliocentric] = useState(false);
  const [orbitAngles, setOrbitAngles] = useState(() => {
    const init = {};
    ORBITS.forEach(o => { init[o.planet] = o.angle; });
    HELIO_ORBITS.forEach(o => { if (!(o.planet in init)) init[o.planet] = o.angle; });
    init['Moon-helio'] = -90;
    return init;
  });
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const [starMapMode, setStarMapMode] = useState('north'); // 'none' | 'north' | 'south'
  const [hoveredConstellation, setHoveredConstellation] = useState(null);
  const [hoveredRing, setHoveredRing] = useState(null);
  const hoveredRingRef = useRef(null);
  const [stormFlash, setStormFlash] = useState(false);
  const [meteorShower, setMeteorShower] = useState(false);
  const [fallingStarAnim, setFallingStarAnim] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(!isMobile);
  const prevMeteorSteelRef = useRef(false);
  const prevFallenStarlightRef = useRef(false);
  const wheelOpenedRef = useRef(false); // eslint-disable-line no-unused-vars

  // --- Pinch-to-zoom state & handlers ---
  const [pinchTransform, setPinchTransform] = useState({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef(null);
  const pinchTransformRef = useRef(pinchTransform);
  pinchTransformRef.current = pinchTransform;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const pt = pinchTransformRef.current;
        pinchRef.current = {
          startDist: dist,
          startCx: (t0.clientX + t1.clientX) / 2,
          startCy: (t0.clientY + t1.clientY) / 2,
          startScale: pt.scale,
          startX: pt.x,
          startY: pt.y,
        };
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const cx = (t0.clientX + t1.clientX) / 2;
        const cy = (t0.clientY + t1.clientY) / 2;
        const p = pinchRef.current;
        const newScale = Math.min(Math.max(p.startScale * (dist / p.startDist), 1), 4);
        // Clamp pan so diagram stays mostly in view (allow up to 40% of size off-screen)
        const maxPan = 280 * (newScale - 1) * 0.4;
        const rawX = p.startX + (cx - p.startCx);
        const rawY = p.startY + (cy - p.startCy);
        setPinchTransform({
          scale: newScale,
          x: Math.min(Math.max(rawX, -maxPan), maxPan),
          y: Math.min(Math.max(rawY, -maxPan), maxPan),
        });
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
        setPinchTransform(prev => prev.scale < 1.2 ? { scale: 1, x: 0, y: 0 } : prev);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pinchStyle = pinchTransform.scale > 1 ? {
    transform: `translate(${pinchTransform.x}px, ${pinchTransform.y}px) scale(${pinchTransform.scale})`,
    transformOrigin: 'center center',
  } : undefined;

  const playThunder = useCallback(async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      const duration = 5.0;
      const sampleRate = ctx.sampleRate;
      const len = sampleRate * duration;
      const buffer = ctx.createBuffer(1, len, sampleRate);
      const d = buffer.getChannelData(0);
      // Layer 1: initial crack
      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const crack = Math.exp(-t * 8) * (t < 0.03 ? t / 0.03 : 1);
        d[i] = (Math.random() * 2 - 1) * crack * 0.7;
      }
      // Layer 2: deep rolling rumble with multiple echo peaks
      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const rumble = Math.exp(-t * 0.6)
          * (0.4 + 0.25 * Math.sin(t * 8) + 0.2 * Math.sin(t * 3.5) + 0.15 * Math.sin(t * 14))
          * (1 + 0.6 * Math.exp(-Math.pow(t - 0.8, 2) * 8))  // echo at 0.8s
          * (1 + 0.4 * Math.exp(-Math.pow(t - 1.6, 2) * 6))  // echo at 1.6s
          * (1 + 0.25 * Math.exp(-Math.pow(t - 2.5, 2) * 5)); // echo at 2.5s
        d[i] += (Math.random() * 2 - 1) * rumble * 0.5;
      }
      // Heavy low-pass for deep bass rumble (multiple passes)
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 1; i < len; i++) {
          d[i] = d[i] * 0.08 + d[i - 1] * 0.92;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 1.0;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      source.onended = () => ctx.close();
    } catch (e) { /* audio not available */ }
  }, []);

  // Trigger meteor shower animation when entering meteor steel mode
  useEffect(() => {
    if (showMeteorSteel && !prevMeteorSteelRef.current) {
      setMeteorShower(true);
      const t = setTimeout(() => setMeteorShower(false), 3000);
      return () => clearTimeout(t);
    }
    prevMeteorSteelRef.current = showMeteorSteel;
  }, [showMeteorSteel]);

  // Trigger falling star animation when entering fallen starlight mode
  useEffect(() => {
    if (showFallenStarlight && !prevFallenStarlightRef.current) {
      setFallingStarAnim(true);
      const t = setTimeout(() => setFallingStarAnim(false), 2500);
      return () => clearTimeout(t);
    }
    prevFallenStarlightRef.current = showFallenStarlight;
  }, [showFallenStarlight]);

  const triggerStormFlash = useCallback(() => {
    if (stormFlash) return;
    setStormFlash(true);
    playThunder();
    setTimeout(() => setStormFlash(false), 3500);
  }, [stormFlash, playThunder]);

  // Yellow Brick Road intro animation
  const [ybrIntroStep, setYbrIntroStep] = useState(-1);

  const YBR_INTRO_SEQ = useMemo(() => {
    const seq = [];
    // Planets in Chaldean order (inner to outer)
    ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn'].forEach(planet => {
      const orbit = ORBITS.find(o => o.planet === planet);
      if (orbit) {
        const rad = (ALIGN_ANGLE * Math.PI) / 180;
        seq.push({ x: CX + orbit.r * Math.cos(rad), y: CY + orbit.r * Math.sin(rad), type: 'planet', r: orbit.r < 100 ? 14 : 16 });
      }
    });
    // Zodiac CCW from Cancer: Cancer, Leo, Virgo, Libra, Scorpio, Sag, Cap, Aquarius, Pisces, Aries, Taurus, Gemini
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2].forEach(i => {
      const angle = -(i * 30 + 15);
      const rad = (angle * Math.PI) / 180;
      seq.push({ x: CX + ZODIAC_TEXT_R * Math.cos(rad), y: CY + ZODIAC_TEXT_R * Math.sin(rad), type: 'zodiac', r: 18 });
    });
    return seq;
  }, []);

  useEffect(() => {
    if (ybrIntroStep < 0) return;
    if (ybrIntroStep >= YBR_INTRO_SEQ.length) {
      const t = setTimeout(() => setYbrIntroStep(-1), 1200);
      return () => clearTimeout(t);
    }
    // Planets light up faster, zodiac slightly slower
    const delay = ybrIntroStep < 7 ? 220 : 180;
    const t = setTimeout(() => setYbrIntroStep(s => s + 1), delay);
    return () => clearTimeout(t);
  }, [ybrIntroStep, YBR_INTRO_SEQ.length]);

  const startYbrIntro = useCallback(() => {
    setYbrIntroStep(0);
  }, []);

  // Auto-start YBR animation when requested (e.g., from Games page navigation)
  // First activate YBR (which triggers planet alignment at 0.8s transition),
  // then wait for alignment to finish before starting the yellow circle animation
  useEffect(() => {
    if (ybrAutoStart && !ybrActive && ybrIntroStep < 0) {
      onToggleYBR && onToggleYBR();
      const t = setTimeout(() => startYbrIntro(), 1000);
      return () => clearTimeout(t);
    }
  }, [ybrAutoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWheelMove = (e) => {
    const svg = e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 700;
    const svgY = ((e.clientY - rect.top) / rect.height) * 700;
    const dist = Math.sqrt((svgX - CX) ** 2 + (svgY - CY) ** 2);
    let idx = null;
    for (let i = 0; i < WHEEL_RINGS.length; i++) {
      if (dist >= WHEEL_RINGS[i].innerR && dist < WHEEL_RINGS[i].outerR) { idx = i; break; }
    }
    if (idx !== hoveredRingRef.current) {
      hoveredRingRef.current = idx;
      setHoveredRing(idx);
    }
  };

  useEffect(() => {
    if (aligned || livePositions || heliocentric || chakraViewMode) {
      lastTimeRef.current = null;
      return;
    }
    const tick = (timestamp) => {
      if (lastTimeRef.current != null) {
        const dt = (timestamp - lastTimeRef.current) / 1000;
        setOrbitAngles(prev => {
          const next = { ...prev };
          if (heliocentric) {
            HELIO_ORBITS.forEach(o => {
              next[o.planet] = (prev[o.planet] || 0) - o.speed * dt;
            });
            next['Moon-helio'] = (prev['Moon-helio'] || 0) - HELIO_MOON.speed * dt;
          } else {
            ORBITS.forEach(o => {
              next[o.planet] = prev[o.planet] - o.speed * dt;
            });
          }
          return next;
        });
      }
      lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [aligned, livePositions, heliocentric, chakraViewMode]);

  // When calendar/clock mode is activated, switch view mode
  useEffect(() => {
    if (showCalendar || showClock) {
      setHeliocentric(clockMode !== '24h');
      setLivePositions(false);
      setAligned(false);
    }
  }, [showCalendar, showClock, clockMode]);

  // Auto-align when Yellow Brick Road activates
  useEffect(() => {
    if (ybrActive) {
      setAligned(true);
      setLivePositions(false);
      setHeliocentric(false);
    }
  }, [ybrActive]);

  const liveAngles = useMemo(() => {
    if (!livePositions) return null;
    const angles = {};
    for (const planet of Object.keys(BODY_MAP)) {
      const lon = getEclipticLongitude(planet);
      angles[planet] = { svgAngle: -lon, lon };
    }
    return angles;
  }, [livePositions]);

  const helioLiveAngles = useMemo(() => {
    if (!heliocentric) return null;
    const angles = {};
    HELIO_ORBITS.forEach(o => {
      angles[o.planet] = -getHeliocentricLongitude(o.planet);
    });
    const moonGeoLon = getEclipticLongitude('Moon');
    const earthHelioLon = getHeliocentricLongitude('Earth');
    angles['Moon-helio'] = -(moonGeoLon - earthHelioLon);
    return angles;
  }, [heliocentric, clockTime]);

  const moonPhaseAngle = useMemo(() => MoonPhase(new Date()), []);

  // Live geocentric planet angles for 24h clock mode
  // Each planet orbits once per 24h (like the sun), offset by its real ecliptic longitude difference from the sun
  const geoClockAngles = useMemo(() => {
    if (clockMode !== '24h') return null;
    const sunLon = getEclipticLongitude('Sun');
    const sunClockDeg = clockTime.h * 15 + clockTime.m * 0.25 + 90; // sun's clock angle (matches hour hand)
    const angles = {};
    for (const planet of Object.keys(BODY_MAP)) {
      if (planet === 'Sun') continue; // Sun rides the hour hand
      const lon = getEclipticLongitude(planet);
      angles[planet] = sunClockDeg + (lon - sunLon); // same daily rotation, real angular offset
    }
    return angles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockMode, clockTime]); // recompute each second when clock ticks

  // Ecliptic longitudes for cycle rings (Solar Year ring + Lunar Month ring)
  const eclipticAngles = useMemo(() => {
    if (!showCycles) return null;
    const angles = {};
    for (const planet of Object.keys(BODY_MAP)) {
      angles[planet] = -getEclipticLongitude(planet);
    }
    return angles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCycles, clockTime]);

  // Rotation for zodiac/month rings in 24h mode so Sun's sign aligns with hour hand
  const zodiacRotationDeg = useMemo(() => {
    const siderealOffset = zodiacMode === 'sidereal' ? -getLahiriAyanamsa() : 0;
    if (chakraViewMode || showMonomyth) return siderealOffset;
    if (clockMode !== '24h') return siderealOffset;
    const sunLon = getEclipticLongitude('Sun');
    const hDeg24 = clockTime.h * 15 + clockTime.m * 0.25 + 90;
    return hDeg24 + sunLon + siderealOffset;
  }, [clockMode, clockTime, chakraViewMode, showMonomyth, zodiacMode]);

  const starPositionsNorth = useMemo(() =>
    starsNorth.map(([ra, dec, mag]) => ({ ...starToSvg(ra, dec), r: starRadius(mag), o: starOpacity(mag) })), []
  );
  const starPositionsSouth = useMemo(() =>
    starsSouth.map(([ra, dec, mag]) => ({ ...starToSvg(ra, dec), r: starRadius(mag), o: starOpacity(mag) })), []
  );

  // Pre-select ~30 stars from each hemisphere to twinkle, with staggered delays
  const twinkleNorth = useMemo(() => {
    const set = new Set();
    for (let i = 7; i < starsNorth.length; i += Math.floor(starsNorth.length / 30)) set.add(i);
    return set;
  }, []);
  const twinkleSouth = useMemo(() => {
    const set = new Set();
    for (let i = 5; i < starsSouth.length; i += Math.floor(starsSouth.length / 30)) set.add(i);
    return set;
  }, []);

  // Hit targets for constellation stars (only for current hemisphere)
  const constellationHits = useMemo(() => {
    if (starMapMode === 'none') return [];
    const isNorth = starMapMode === 'north';
    const positions = isNorth ? starPositionsNorth : starPositionsSouth;
    const lookup = isNorth ? northStarToCid : southStarToCid;
    const hits = [];
    for (const idx in lookup) {
      const i = Number(idx);
      const s = positions[i];
      if (s) hits.push({ x: s.x, y: s.y, r: s.r, cid: lookup[idx], idx: i });
    }
    return hits;
  }, [starMapMode, starPositionsNorth, starPositionsSouth, northStarToCid, southStarToCid]);

  // YouTube video player in center
  const videoPlayerRef = useRef(null);
  const videoPlayerDivRef = useRef(null);
  const videoListId = videoUrl ? (() => { try { return new URL(videoUrl).searchParams.get('list'); } catch { return null; } })() : null;

  useEffect(() => {
    if (!videoListId) {
      if (videoPlayerRef.current) { videoPlayerRef.current.destroy(); videoPlayerRef.current = null; }
      return;
    }
    let cancelled = false;
    ensureYTApi().then(() => {
      if (cancelled || !videoPlayerDivRef.current) return;
      if (videoPlayerRef.current) { videoPlayerRef.current.destroy(); videoPlayerRef.current = null; }
      videoPlayerRef.current = new window.YT.Player(videoPlayerDivRef.current, {
        playerVars: { listType: 'playlist', list: videoListId, autoplay: 1, controls: 0, modestbranding: 1, rel: 0, fs: 0, playsinline: 1 },
        events: { onReady: (e) => e.target.playVideo() },
      });
    });
    return () => { cancelled = true; if (videoPlayerRef.current) { videoPlayerRef.current.destroy(); videoPlayerRef.current = null; } };
  }, [videoListId]);

  const handleVideoPrev = useCallback(() => { if (videoPlayerRef.current?.previousVideo) videoPlayerRef.current.previousVideo(); }, []);
  const handleVideoNext = useCallback(() => { if (videoPlayerRef.current?.nextVideo) videoPlayerRef.current.nextVideo(); }, []);


  const handleConstellationOver = useCallback((e) => {
    const cid = e.target.dataset.cid;
    if (cid) {
      setHoveredConstellation(cid);
      setTooltip({ type: 'constellation', key: cid, x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleConstellationOut = useCallback((e) => {
    if (e.target.dataset.cid) {
      setHoveredConstellation(null);
      setTooltip(null);
    }
  }, []);

  const handleConstellationClick = useCallback((e) => {
    const cid = e.target.dataset.cid;
    if (cid && onSelectConstellation) {
      onSelectConstellation(cid);
    }
  }, [onSelectConstellation]);

  return (
    <>
    <div
      className={`orbital-diagram-wrapper${pinchTransform.scale > 1 ? ' pinch-zoomed' : ''}`}
      ref={wrapperRef}
      style={pinchStyle}
    >
      <svg viewBox={(showMonomyth || showFallenStarlight) ? '-50 -50 800 800' : '0 0 700 700'} preserveAspectRatio="xMidYMid meet" className="orbital-svg" role="img" aria-label={showMedicineWheel ? "Medicine wheel diagram" : showMonomyth ? "Celestial clock with monomyth ring" : showFallenStarlight ? "Celestial clock with starlight ring" : heliocentric ? "Heliocentric orbital diagram" : "Geocentric orbital diagram with zodiac"}>
        {showMedicineWheel ? (
          <g className="medicine-wheel" onMouseMove={handleWheelMove} onMouseLeave={() => { hoveredRingRef.current = null; setHoveredRing(null); }}>
            {/* Quadrant background sectors */}
            {MW_QUADRANTS.map(q => (
              <path key={q.dir} d={quadrantArc(CX, CY, MW_OUTER_R, q.startDeg, q.endDeg)} fill={wheelData.quadrantColors[q.dir]} />
            ))}

            {/* Cross-hair lines (N-S and E-W axes) */}
            <line x1={CX} y1={CY - MW_OUTER_R - 12} x2={CX} y2={CY + MW_OUTER_R + 12} stroke="rgba(180, 140, 80, 0.2)" strokeWidth="0.8" />
            <line x1={CX - MW_OUTER_R - 12} y1={CY} x2={CX + MW_OUTER_R + 12} y2={CY} stroke="rgba(180, 140, 80, 0.2)" strokeWidth="0.8" />

            {/* Subtle diagonal lines */}
            {[45, -45].map(deg => {
              const rd = (deg * Math.PI) / 180;
              return (
                <line key={deg}
                  x1={CX - MW_OUTER_R * Math.cos(rd)} y1={CY - MW_OUTER_R * Math.sin(rd)}
                  x2={CX + MW_OUTER_R * Math.cos(rd)} y2={CY + MW_OUTER_R * Math.sin(rd)}
                  stroke="rgba(180, 140, 80, 0.08)" strokeWidth="0.5"
                />
              );
            })}

            {/* Concentric ring circles */}
            {WHEEL_RINGS.map(ring => ring.outerR > 0 && (
              <circle key={ring.idx} cx={CX} cy={CY} r={ring.outerR} fill="none"
                stroke={hoveredRing === ring.idx ? "rgba(218, 165, 32, 0.45)" : "rgba(180, 140, 80, 0.25)"}
                strokeWidth={hoveredRing === ring.idx ? "1.5" : "0.8"}
                style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }} />
            ))}
            <circle cx={CX} cy={CY} r={MW_OUTER_R} fill="none" stroke="rgba(180, 140, 80, 0.35)" strokeWidth="1.2" />

            {/* Ring title labels (faint, along top of each ring) */}
            {wheelData.wheels.map((wheel, wi) => {
              const ring = WHEEL_RINGS[wi];
              const titleR = ring.outerR - 6;
              return (
                <text key={`title-${wheel.id}`}
                  x={CX + titleR * Math.cos(-1.2)} y={CY + titleR * Math.sin(-1.2)}
                  textAnchor="middle" dominantBaseline="central"
                  fill="rgba(180, 140, 80, 0.18)" fontSize="6" fontFamily="Cinzel, serif"
                  fontWeight="400" letterSpacing="0.5"
                  transform={`rotate(${-1.2 * 180 / Math.PI}, ${CX + titleR * Math.cos(-1.2)}, ${CY + titleR * Math.sin(-1.2)})`}
                >
                  {wheel.id === 'humanSelf' ? '' : wheel.title.replace('The Medicine Wheel of ', '').replace('The ', '')}
                </text>
              );
            })}

            {/* Position labels and hit targets */}
            {wheelData.wheels.map((wheel, wi) => {
              const ring = WHEEL_RINGS[wi];
              const fontSize = [10, 11, 12, 13, 11, 11, 11][wi] || 10;
              return (
                <g key={wheel.id}>
                  {wheel.positions.filter(p => !p.isCenter).map(pos => {
                    const rad = (pos.angle * Math.PI) / 180;
                    const px = CX + ring.textR * Math.cos(rad);
                    const py = CY + ring.textR * Math.sin(rad);
                    const itemKey = `${wheel.id}:${pos.dir}`;
                    const isSelected = selectedWheelItem === itemKey;
                    const isHighlighted = !isSelected && selectedWheelItem && (
                      (selectedWheelItem.startsWith('num:') && NUM_TO_DIR[parseInt(selectedWheelItem.split(':')[1])] === pos.dir) ||
                      (selectedWheelItem.startsWith('dir:') && selectedWheelItem.split(':')[1] === pos.dir)
                    );
                    const isActive = isSelected || isHighlighted;
                    const displayLabel = pos.shortLabel || pos.label;
                    const rot = pos.isCenter ? 0 : tangentRotation(pos.angle);

                    // Split long labels into two stacked lines
                    const words = displayLabel.split(' ');
                    const needsSplit = words.length >= 2 && displayLabel.length > 10;
                    const splitMid = Math.ceil(words.length / 2);
                    const lines = needsSplit
                      ? [words.slice(0, splitMid).join(' '), words.slice(splitMid).join(' ')]
                      : [displayLabel];
                    const lineSpacing = fontSize * 1.15;

                    // Nudge multi-line labels inward so they center in the ring
                    const effectiveR = needsSplit ? ring.textR - 4 : ring.textR;
                    const tx = CX + effectiveR * Math.cos(rad);
                    const ty = CY + effectiveR * Math.sin(rad);

                    return (
                      <g key={itemKey}
                        className={`mw-position${isActive ? ' active' : ''}`}
                        onClick={() => onSelectWheelItem && onSelectWheelItem(isSelected ? null : itemKey)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle cx={px} cy={py} r={16} fill="transparent" />
                        {isActive && (
                          <circle cx={px} cy={py} r="13" fill="none" stroke="rgba(218, 165, 32, 0.6)" strokeWidth="0.8">
                            <animate attributeName="r" values="11;15;11" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x={tx} y={ty}
                          textAnchor="middle" dominantBaseline="central"
                          fill={isActive ? '#f0c040' : 'rgb(225, 195, 120)'}
                          fontSize={fontSize} fontFamily="Cinzel, serif"
                          fontWeight={isActive ? '700' : '600'}
                          transform={rot ? `rotate(${rot}, ${tx}, ${ty})` : undefined}
                          style={{ transition: 'fill 0.3s' }}
                        >
                          {lines.length === 1 ? displayLabel : (
                            <>
                              <tspan x={tx} dy={-lineSpacing / 2}>{lines[0]}</tspan>
                              <tspan x={tx} dy={lineSpacing}>{lines[1]}</tspan>
                            </>
                          )}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Outer number ring */}
            <circle cx={CX} cy={CY} r={NUM_RING_R} fill="none" stroke="rgba(180, 140, 80, 0.2)" strokeWidth="0.6" strokeDasharray="3 2" />
            {NUM_ANGLES.map(({ num, angle }) => {
              const rad = (angle * Math.PI) / 180;
              const nx = CX + NUM_RING_R * Math.cos(rad);
              const ny = CY + NUM_RING_R * Math.sin(rad);
              const numKey = `num:${num}`;
              const isNumSelected = selectedWheelItem === numKey;
              const isNumActive = isNumSelected || (selectedWheelItem?.startsWith('dir:') && selectedWheelItem.split(':')[1] === NUM_TO_DIR[num]);
              return (
                <g key={numKey}
                  className={`mw-position${isNumActive ? ' active' : ''}`}
                  onClick={() => onSelectWheelItem && onSelectWheelItem(isNumSelected ? null : numKey)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={nx} cy={ny} r="16"
                    fill={isNumActive ? 'rgba(218, 165, 32, 0.15)' : 'rgba(180, 140, 80, 0.06)'}
                    stroke={isNumActive ? 'rgba(218, 165, 32, 0.5)' : 'rgba(180, 140, 80, 0.2)'}
                    strokeWidth="0.8" />
                  {isNumActive && (
                    <circle cx={nx} cy={ny} r="18" fill="none" stroke="rgba(218, 165, 32, 0.5)" strokeWidth="0.6">
                      <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central"
                    fill={isNumActive ? '#f0c040' : 'rgb(225, 195, 120)'}
                    fontSize="16" fontFamily="Cinzel, serif" fontWeight={isNumActive ? '700' : '600'}
                    style={{ transition: 'fill 0.3s' }}>
                    {num}
                  </text>
                </g>
              );
            })}

            {/* Dynamic center content — changes on ring hover */}
            {(() => {
              let items;
              if (hoveredRing == null) {
                items = [{ text: 'Self', size: 15, bold: true }];
              } else if (hoveredRing === 0) {
                items = [
                  { text: 'Self', size: 10, bold: true, key: 'humanSelf:center' },
                  { text: 'Perspective', size: 7.5, key: 'perspective:center' },
                  { text: 'Beauty', size: 7.5, key: 'elements:center' },
                  { text: 'Fifth Element', size: 7, key: 'sacredElements:center' },
                  { text: 'WahKahn · SsKwan', size: 7, key: 'mathematics:center' },
                  { text: 'Humans · Voice', size: 7, key: 'num:5' },
                  { text: 'Intellect · Higher Self', size: 7, key: 'num:10' },
                ];
              } else {
                const wheel = wheelData.wheels[hoveredRing];
                items = [];
                if (wheel?.center) {
                  wheel.center.split('\n').filter(l => l.trim()).forEach((line, i) => {
                    items.push({ text: line, size: i === 0 ? 11 : 9, bold: i === 0, key: `${wheel.id}:center` });
                  });
                }
                if (wheel) {
                  wheel.positions.filter(p => p.isCenter).forEach(p => {
                    items.push({ text: p.shortLabel || p.label, size: 9, key: `${wheel.id}:${p.dir}` });
                  });
                }
                if (items.length === 0) items = [{ text: 'Self', size: 11, bold: true }];
              }
              const lh = hoveredRing === 0 ? 10 : 13;
              const totalH = items.length * lh;
              const startY = CY - totalH / 2 + lh / 2;
              const backR = hoveredRing != null ? Math.max(78, totalH / 2 + 8) : 78;
              return (
                <g>
                  <circle cx={CX} cy={CY} r={backR} fill="rgba(18, 16, 14, 0.92)"
                    stroke={hoveredRing != null ? 'rgba(180, 140, 80, 0.2)' : 'none'} strokeWidth="0.6"
                    opacity={hoveredRing != null ? 1 : 0}
                    style={{ transition: 'r 0.3s, opacity 0.3s' }} />
                  {items.map((item, i) => {
                    const isSel = item.key && selectedWheelItem === item.key;
                    return (
                      <text key={i} x={CX} y={startY + i * lh}
                        textAnchor="middle" dominantBaseline="central"
                        fill={isSel ? '#f0c040' : 'rgba(220, 190, 120, 0.9)'}
                        fontSize={item.size} fontFamily="Cinzel, serif"
                        fontWeight={item.bold ? '700' : '500'}
                        style={{ cursor: item.key ? 'pointer' : 'default' }}
                        onClick={item.key ? (e) => { e.stopPropagation(); onSelectWheelItem && onSelectWheelItem(isSel ? null : item.key); } : undefined}>
                        {item.text}
                      </text>
                    );
                  })}
                </g>
              );
            })()}

            {/* Storm attribution — bottom right, clickable */}
            <g onClick={() => { triggerStormFlash(); onSelectWheelItem && onSelectWheelItem(selectedWheelItem === 'meta:author' ? null : 'meta:author'); }} style={{ cursor: 'pointer' }}>
              <text x={CX + MW_OUTER_R + 10} y={CY + MW_OUTER_R + 22} textAnchor="end"
                fill={selectedWheelItem === 'meta:author' ? '#f0c040' : 'rgba(220, 190, 120, 0.45)'} fontSize="11" fontFamily="Crimson Pro, serif" fontWeight="400" fontStyle="italic"
                style={{ transition: 'fill 0.3s' }}>
                Hyemeyohsts Storm
              </text>
            </g>

            {/* Clickable compass direction labels */}
            {[
              { dir: 'N', x: CX, y: CY - MW_OUTER_R - 18, anchor: 'middle', baseDom: undefined, baseFill: 'rgba(255, 255, 255, 0.8)' },
              { dir: 'E', x: CX + MW_OUTER_R + 18, y: CY + 1, anchor: 'start', baseDom: 'central', baseFill: 'rgba(218, 165, 32, 0.8)' },
              { dir: 'S', x: CX, y: CY + MW_OUTER_R + 24, anchor: 'middle', baseDom: undefined, baseFill: 'rgba(178, 34, 34, 0.8)' },
              { dir: 'W', x: CX - MW_OUTER_R - 18, y: CY + 1, anchor: 'end', baseDom: 'central', baseFill: 'rgba(150, 150, 150, 0.8)' },
            ].map(c => {
              const dirKey = `dir:${c.dir}`;
              const isDirActive = selectedWheelItem === dirKey || (selectedWheelItem?.startsWith('num:') && NUM_TO_DIR[parseInt(selectedWheelItem.split(':')[1])] === c.dir);
              return (
                <g key={c.dir} onClick={() => onSelectWheelItem && onSelectWheelItem(selectedWheelItem === dirKey ? null : dirKey)} style={{ cursor: 'pointer' }}>
                  <circle cx={c.x} cy={c.y} r="14" fill="transparent" />
                  <text x={c.x} y={c.y} textAnchor={c.anchor} dominantBaseline={c.baseDom}
                    fill={isDirActive ? '#f0c040' : c.baseFill}
                    fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                    style={{ transition: 'fill 0.3s' }}>
                    {c.dir}
                  </text>
                </g>
              );
            })}
          </g>
        ) : (<>
        <defs>
          {[...ORBITS, { planet: 'Earth' }].map(o => (
            <filter key={o.planet} id={`glow-${o.planet}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <radialGradient id="earth-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a8a7a" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#2a5a5a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a3a3a" stopOpacity="0" />
          </radialGradient>

        </defs>

        {/* Zodiac + month rings — rotated in 24h mode so Sun's sign aligns with hour hand */}
        <g transform={zodiacRotationDeg ? `rotate(${zodiacRotationDeg}, ${CX}, ${CY})` : undefined}>
          {/* Arc paths for zodiac text (inside rotated group so textPath follows rotation) */}
          {ZODIAC.map((z, i) => {
            const startBoundary = -(i * 30);
            const endBoundary = -(i * 30 + 30);
            const inset = 2;
            // Determine if sign is in upper or lower half after rotation
            const centerAngle = -(i * 30 + 15);
            const effectiveAngle = ((centerAngle + zodiacRotationDeg) % 360 + 360) % 360;
            // Upper half (text reads CW): effectiveAngle 181-360 (sin < 0 in SVG)
            // Lower half (text reads CCW): effectiveAngle 1-180 (sin > 0 in SVG)
            const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
            if (isUpper) {
              return (
                <path
                  key={`zpath-${z.sign}`}
                  id={`zpath-${z.sign}`}
                  d={arcPath(CX, CY, ZODIAC_TEXT_R, endBoundary + inset, startBoundary - inset, 1)}
                  fill="none"
                />
              );
            }
            return (
              <path
                key={`zpath-${z.sign}`}
                id={`zpath-${z.sign}`}
                d={arcPath(CX, CY, ZODIAC_TEXT_R, startBoundary - inset, endBoundary + inset, 0)}
                fill="none"
              />
            );
          })}
          {/* Arc paths for month text */}
          {(showCalendar || showClock) && !chakraViewMode && !showCycles && MONTHS.map((m, i) => {
            const startBoundary = -(i * 30) + MONTH_OFFSET;
            const endBoundary = -(i * 30 + 30) + MONTH_OFFSET;
            const inset = 2;
            // Determine if month is in upper or lower half after rotation
            const centerAngle = (startBoundary + endBoundary) / 2;
            const effectiveAngle = ((centerAngle + zodiacRotationDeg) % 360 + 360) % 360;
            const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
            if (isUpper) {
              return (
                <path
                  key={`mpath-${m}`}
                  id={`mpath-${m}`}
                  d={arcPath(CX, CY, MONTH_TEXT_R, endBoundary + inset, startBoundary - inset, 1)}
                  fill="none"
                />
              );
            }
            return (
              <path
                key={`mpath-${m}`}
                id={`mpath-${m}`}
                d={arcPath(CX, CY, MONTH_TEXT_R, startBoundary - inset, endBoundary + inset, 0)}
                fill="none"
              />
            );
          })}

        {/* Month calendar ring (inside zodiac) */}
        {(showCalendar || showClock) && !chakraViewMode && !showCycles && (
          <g className="month-ring" style={{ opacity: 1, transition: 'opacity 0.4s ease' }}>
            <circle cx={CX} cy={CY} r={MONTH_RING_INNER} fill="none" stroke="rgba(100, 180, 220, 0.22)" strokeWidth="0.8" />
            <circle cx={CX} cy={CY} r={MONTH_RING_OUTER} fill="none" stroke="rgba(100, 180, 220, 0.22)" strokeWidth="0.8" />
            {/* 12 divider lines */}
            {MONTHS.map((_, i) => {
              const angle = -(i * 30) + MONTH_OFFSET;
              const rad = (angle * Math.PI) / 180;
              return (
                <line
                  key={`mdiv-${i}`}
                  x1={CX + MONTH_RING_INNER * Math.cos(rad)} y1={CY + MONTH_RING_INNER * Math.sin(rad)}
                  x2={CX + MONTH_RING_OUTER * Math.cos(rad)} y2={CY + MONTH_RING_OUTER * Math.sin(rad)}
                  stroke="rgba(100, 180, 220, 0.25)"
                  strokeWidth="0.6"
                />
              );
            })}
            {/* Month labels on curved paths */}
            {MONTHS.map((m, i) => {
              const isSelected = selectedMonth === m;
              const centerAngle = -(i * 30 + 15) + MONTH_OFFSET;
              const rad = (centerAngle * Math.PI) / 180;
              const hx = CX + MONTH_TEXT_R * Math.cos(rad);
              const hy = CY + MONTH_TEXT_R * Math.sin(rad);
              // Highlight current month
              const now = new Date();
              const isCurrent = now.getMonth() === i;

              return (
                <g
                  key={m}
                  className={`month-segment${isSelected ? ' active' : ''}`}
                  onClick={() => onSelectMonth && onSelectMonth(isSelected ? null : m)}
                  onMouseEnter={(e) => handleTooltipEnter('month', m, e)}
                  onMouseMove={handleTooltipMove}
                  onMouseLeave={handleTooltipLeave}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={hx} cy={hy} r="18" fill="transparent" />
                  {isSelected && (
                    <circle cx={hx} cy={hy} r="14" fill="none" stroke="rgba(100, 180, 220, 0.5)" strokeWidth="0.8">
                      <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    fill={isSelected ? '#60d8f0' : isCurrent ? 'rgba(120, 200, 235, 0.95)' : 'rgba(120, 200, 235, 0.8)'}
                    fontSize="12"
                    fontFamily="Cinzel, serif"
                    fontWeight={isSelected ? '700' : isCurrent ? '600' : '500'}
                    letterSpacing="0.5"
                  >
                    <textPath
                      href={`#mpath-${m}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {m}
                    </textPath>
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Zodiac band — two concentric circles */}
        <circle cx={CX} cy={CY} r={ZODIAC_INNER_R} fill="none" stroke="rgba(201, 169, 97, 0.18)" strokeWidth="0.8" />
        <circle cx={CX} cy={CY} r={ZODIAC_OUTER_R} fill="none" stroke="rgba(201, 169, 97, 0.18)" strokeWidth="0.8" />


        {/* 12 divider lines between signs (every 30°, aligned with equinox/solstice) */}
        {ZODIAC.map((_, i) => {
          const angle = -(i * 30);
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={`div-${i}`}
              x1={CX + ZODIAC_INNER_R * Math.cos(rad)} y1={CY + ZODIAC_INNER_R * Math.sin(rad)}
              x2={CX + ZODIAC_OUTER_R * Math.cos(rad)} y2={CY + ZODIAC_OUTER_R * Math.sin(rad)}
              stroke="rgba(201, 169, 97, 0.2)"
              strokeWidth="0.6"
            />
          );
        })}

        {/* Equinox line (horizontal — east/west, through full diagram) */}
        <line
          x1={CX - ZODIAC_OUTER_R - 8} y1={CY}
          x2={CX + ZODIAC_OUTER_R + 8} y2={CY}
          stroke="rgba(201, 169, 97, 0.14)"
          strokeWidth="0.6"
        />
        {/* Solstice line (vertical — north/south, through full diagram) */}
        <line
          x1={CX} y1={CY - ZODIAC_OUTER_R - 8}
          x2={CX} y2={CY + ZODIAC_OUTER_R + 8}
          stroke="rgba(201, 169, 97, 0.14)"
          strokeWidth="0.6"
        />

        {/* Zodiac sign labels on curved paths with SVG glyph icons */}
        {ZODIAC.map((z, i) => {
          const isSelected = selectedSign === z.sign;
          const centerAngle = -(i * 30 + 15);
          const rad = (centerAngle * Math.PI) / 180;
          const hx = CX + ZODIAC_TEXT_R * Math.cos(rad);
          const hy = CY + ZODIAC_TEXT_R * Math.sin(rad);
          const color = isSelected ? '#f5d050' : showMonomyth ? 'rgba(230, 200, 90, 0.5)' : 'rgba(230, 200, 90, 0.75)';

          // Culture-specific display name (strip parenthetical suffixes; use tarot card names for Tarot)
          const cultureKey = activeCulture ? activeCulture.toLowerCase() : null;
          const rawName = cultureKey === 'tarot'
            ? (ZODIAC_TAROT[z.sign] || z.sign)
            : (zodiacCultureData.find(d => d.sign === z.sign)?.cultures?.[cultureKey]?.name || z.sign);
          const displayName = rawName.replace(/\s*\(.*\)/, '').trim();
          const labelSize = displayName.length > 14 ? 12 : 15;

          // Position glyph along the arc, before the sign name in reading direction
          const effectiveAngle = ((centerAngle + zodiacRotationDeg) % 360 + 360) % 360;
          const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
          const glyphAngularOffset = isUpper ? 9 : -9;
          const glyphAngleDeg = centerAngle + glyphAngularOffset;
          const gr = (glyphAngleDeg * Math.PI) / 180;
          const gx = CX + ZODIAC_TEXT_R * Math.cos(gr);
          const gy = CY + ZODIAC_TEXT_R * Math.sin(gr);
          const glyphRot = tangentRotation(glyphAngleDeg);

          return (
            <g
              key={z.sign}
              className={`zodiac-sign${isSelected ? ' active' : ''}`}
              onClick={() => onSelectSign && onSelectSign(isSelected ? null : z.sign)}
              onMouseEnter={(e) => handleTooltipEnter('zodiac', z.sign, e)}
              onMouseMove={handleTooltipMove}
              onMouseLeave={handleTooltipLeave}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={hx} cy={hy} r="24" fill="transparent" />
              <g transform={`translate(${gx},${gy}) rotate(${glyphRot}) scale(0.75)`}>
                <path d={ZODIAC_GLYPHS[z.sign]} fill="none" stroke={color}
                  strokeWidth={isSelected ? '2' : '1.6'} strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'stroke 0.3s' }} />
              </g>
              <text
                fill={color}
                fontSize={labelSize}
                fontFamily="Cinzel, serif"
                fontWeight={isSelected ? '700' : '500'}
                letterSpacing="0.5"
              >
                <textPath
                  href={`#zpath-${z.sign}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {displayName}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Cardinal points (equinoxes & solstices) */}
        {CARDINALS.map(c => {
          const rad = (c.angle * Math.PI) / 180;
          const cx = CX + CARDINAL_R * Math.cos(rad);
          const cy = CY + CARDINAL_R * Math.sin(rad);
          const isSelected = selectedCardinal === c.id;
          // Label offset: push text outward from the point
          const lx = CX + (ZODIAC_OUTER_R + 18) * Math.cos(rad);
          const ly = CY + (ZODIAC_OUTER_R + 18) * Math.sin(rad);
          // Text anchor based on position
          const anchor = c.angle === 0 ? 'start' : c.angle === 180 ? 'end' : 'middle';

          return (
            <g
              key={c.id}
              className={`cardinal-point${isSelected ? ' active' : ''}`}
              onClick={() => onSelectCardinal && onSelectCardinal(isSelected ? null : c.id)}
              onMouseEnter={(e) => handleTooltipEnter('cardinal', c.id, e)}
              onMouseMove={handleTooltipMove}
              onMouseLeave={handleTooltipLeave}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit target */}
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
              {/* Marker diamond */}
              <polygon
                points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
                fill={isSelected ? '#f5d050' : 'rgba(230, 200, 90, 0.65)'}
                stroke={isSelected ? '#f5d050' : 'rgba(230, 200, 90, 0.4)'}
                strokeWidth="0.8"
                style={{ transition: 'fill 0.3s, stroke 0.3s' }}
              />
              {/* Glow ring when selected */}
              {isSelected && (
                <circle cx={cx} cy={cy} r="10" fill="none" stroke="#f0c040" strokeWidth="0.8" opacity="0.5">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Label — hidden when monomyth/starlight ring is active (ring covers that space) */}
              {!showMonomyth && !showFallenStarlight && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fill={isSelected ? '#f5d050' : 'rgba(230, 200, 90, 0.6)'}
                  fontSize="8"
                  fontFamily="Cinzel, serif"
                  fontWeight={isSelected ? '700' : '400'}
                  letterSpacing="0.5"
                  style={{ transition: 'fill 0.3s' }}
                >
                  {c.label}
                </text>
              )}
            </g>
          );
        })}

        </g>{/* end zodiac/month rotated group */}

        {/* Star sphere — narrow ring just outside the zodiac band */}
        {onSelectStarSphere && (
          <g>
            {/* Border circles for the star sphere ring */}
            <circle cx={CX} cy={CY} r={STAR_SPHERE_INNER} fill="none"
              stroke={(starSphereHover || starSphereActive) ? 'rgba(255, 255, 240, 0.35)' : 'rgba(255, 255, 240, 0.08)'}
              strokeWidth="0.6" style={{ transition: 'stroke 0.3s' }} />
            <circle cx={CX} cy={CY} r={STAR_SPHERE_OUTER} fill="none"
              stroke={(starSphereHover || starSphereActive) ? 'rgba(255, 255, 240, 0.35)' : 'rgba(255, 255, 240, 0.08)'}
              strokeWidth="0.6" style={{ transition: 'stroke 0.3s' }} />
            {/* Star dots — always faintly visible, brighten on hover */}
            {starBeltDots.map((s, i) => (
              <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r}
                fill={`rgba(255, 255, 240, ${(starSphereHover || starSphereActive) ? s.a : s.a * 0.25})`}
                style={{ transition: 'fill 0.3s', pointerEvents: 'none' }} />
            ))}
            {/* Clickable hit target */}
            <circle
              cx={CX} cy={CY}
              r={STAR_SPHERE_MID}
              fill="none"
              stroke="rgba(255, 255, 240, 0.01)"
              strokeWidth={STAR_SPHERE_WIDTH}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onSelectStarSphere(); }}
              onMouseEnter={(e) => { setStarSphereHover(true); handleTooltipEnter('starSphere', 'Sphere of Fixed Stars', e); }}
              onMouseMove={handleTooltipMove}
              onMouseLeave={() => { setStarSphereHover(false); handleTooltipLeave(); }}
            />
          </g>
        )}

        {/* Monomyth outer ring — 8 stages counter-clockwise, Surface at noon (top), Nadir at midnight (bottom) */}
        {showMonomyth && monomythStages && (() => {
          const MONO_INNER_R = 348;
          const MONO_OUTER_R = 388;
          const MONO_TEXT_R = 368;
          const SLICE_DEG = 360 / monomythStages.length; // 45°

          // Counter-clockwise: stage i centered at -90 - i*45
          // Surface(0)=-90° (top/noon), Calling(1)=-135°, Crossing(2)=-180°,
          // Initiating(3)=-225°, Nadir(4)=-270°/90° (bottom/midnight),
          // Return(5)=-315°, Arrival(6)=0° (right), Renewal(7)=-45° (upper-right)
          const stageCenter = (i) => -90 - i * SLICE_DEG;
          // Dividers sit at segment boundaries (offset half a slice from centers)
          const dividerAngle = (i) => -90 + SLICE_DEG / 2 - i * SLICE_DEG;

          return (
            <g className="monomyth-ring">
              {/* Ring circles */}
              <circle cx={CX} cy={CY} r={MONO_INNER_R} fill="none" stroke="rgba(232, 192, 128, 0.22)" strokeWidth="0.8" />
              <circle cx={CX} cy={CY} r={MONO_OUTER_R} fill="none" stroke="rgba(232, 192, 128, 0.22)" strokeWidth="0.8" />

              {/* 8 divider lines at segment boundaries */}
              {monomythStages.map((_, i) => {
                const angle = dividerAngle(i);
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={`mono-div-${i}`}
                    x1={CX + MONO_INNER_R * Math.cos(rad)} y1={CY + MONO_INNER_R * Math.sin(rad)}
                    x2={CX + MONO_OUTER_R * Math.cos(rad)} y2={CY + MONO_OUTER_R * Math.sin(rad)}
                    stroke="rgba(232, 192, 128, 0.25)"
                    strokeWidth="0.6"
                  />
                );
              })}

              {/* Arc paths for text + clickable labels (counter-clockwise) */}
              {monomythStages.map((stage, i) => {
                const center = stageCenter(i);
                const cwEdge = center + SLICE_DEG / 2;   // clockwise boundary (higher angle)
                const ccwEdge = center - SLICE_DEG / 2;  // counter-clockwise boundary (lower angle)
                const isSelected = selectedMonomythStage === stage.id;

                // Determine text direction: upper half → CW arc, lower half → CCW arc
                const effectiveAngle = ((center % 360) + 360) % 360;
                const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
                const inset = 2;

                const pathId = `monopath-${stage.id}`;
                // Upper half: path from ccwEdge to cwEdge (sweep=1 = CW), text reads L→R
                // Lower half: path from cwEdge to ccwEdge (sweep=0 = CCW), text reads L→R upside-up
                const pathD = isUpper
                  ? arcPath(CX, CY, MONO_TEXT_R, ccwEdge + inset, cwEdge - inset, 1)
                  : arcPath(CX, CY, MONO_TEXT_R, cwEdge - inset, ccwEdge + inset, 0);

                // Hit target center
                const cRad = (center * Math.PI) / 180;
                const hx = CX + MONO_TEXT_R * Math.cos(cRad);
                const hy = CY + MONO_TEXT_R * Math.sin(cRad);

                // Selected highlight: segment arc (inner CCW to outer CW back)
                const cwRad = (cwEdge * Math.PI) / 180;
                const ccwRad = (ccwEdge * Math.PI) / 180;

                return (
                  <g
                    key={stage.id}
                    className={`monomyth-stage${isSelected ? ' active' : ''}`}
                    onClick={() => onSelectMonomythStage && onSelectMonomythStage(isSelected ? null : stage.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Segment highlight background */}
                    {isSelected && (
                      <path
                        d={`M ${CX + MONO_INNER_R * Math.cos(cwRad)},${CY + MONO_INNER_R * Math.sin(cwRad)} A ${MONO_INNER_R},${MONO_INNER_R} 0 0,0 ${CX + MONO_INNER_R * Math.cos(ccwRad)},${CY + MONO_INNER_R * Math.sin(ccwRad)} L ${CX + MONO_OUTER_R * Math.cos(ccwRad)},${CY + MONO_OUTER_R * Math.sin(ccwRad)} A ${MONO_OUTER_R},${MONO_OUTER_R} 0 0,1 ${CX + MONO_OUTER_R * Math.cos(cwRad)},${CY + MONO_OUTER_R * Math.sin(cwRad)} Z`}
                        fill="rgba(232, 192, 128, 0.12)"
                      />
                    )}
                    {/* Hit target */}
                    <circle cx={hx} cy={hy} r="20" fill="transparent" />
                    {/* Text arc path */}
                    <path id={pathId} d={pathD} fill="none" />
                    {/* Pulse ring on selected */}
                    {isSelected && (
                      <circle cx={hx} cy={hy} r="14" fill="none" stroke="rgba(232, 192, 128, 0.5)" strokeWidth="0.8">
                        <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Label */}
                    <text
                      fill={isSelected ? '#f0d090' : 'rgba(232, 192, 128, 0.95)'}
                      fontSize="15"
                      fontFamily="Cinzel, serif"
                      fontWeight={isSelected ? '700' : '600'}
                      letterSpacing="0.5"
                    >
                      <textPath
                        href={`#${pathId}`}
                        startOffset="50%"
                        textAnchor="middle"
                      >
                        {stage.label}
                      </textPath>
                    </text>
                  </g>
                );
              })}

              {/* Model overlay dots on ring (if a theorist model is selected) */}
              {monomythModel && monomythModel.stages && monomythStages.map((stage, i) => {
                const modelStage = monomythModel.stages.find(s => s.id === stage.id);
                if (!modelStage) return null;
                const angle = stageCenter(i);
                const rad = (angle * Math.PI) / 180;
                const dotR = MONO_OUTER_R + 8;
                const dx = CX + dotR * Math.cos(rad);
                const dy = CY + dotR * Math.sin(rad);
                return (
                  <g key={`model-dot-${stage.id}`}>
                    <circle cx={dx} cy={dy} r="4" fill="rgba(232, 192, 128, 0.7)" stroke="rgba(232, 192, 128, 0.4)" strokeWidth="0.5" />
                    <title>{modelStage.label || modelStage.name}</title>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* Starlight outer ring — Fallen Starlight / Story of Stories */}
        {showFallenStarlight && starlightStages && (() => {
          const SL_INNER_R = 348;
          const SL_OUTER_R = 388;
          const SL_TEXT_R = 368;
          const SLICE_DEG = 360 / starlightStages.length; // 45°
          const stageCenter = (i) => -90 - i * SLICE_DEG;
          const dividerAngle = (i) => -90 + SLICE_DEG / 2 - i * SLICE_DEG;

          return (
            <g className="starlight-ring">
              {/* Ring circles */}
              <circle cx={CX} cy={CY} r={SL_INNER_R} fill="none" stroke="rgba(196, 113, 58, 0.22)" strokeWidth="0.8" />
              <circle cx={CX} cy={CY} r={SL_OUTER_R} fill="none" stroke="rgba(196, 113, 58, 0.22)" strokeWidth="0.8" />

              {/* 8 divider lines at segment boundaries */}
              {starlightStages.map((_, i) => {
                const angle = dividerAngle(i);
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={`sl-div-${i}`}
                    x1={CX + SL_INNER_R * Math.cos(rad)} y1={CY + SL_INNER_R * Math.sin(rad)}
                    x2={CX + SL_OUTER_R * Math.cos(rad)} y2={CY + SL_OUTER_R * Math.sin(rad)}
                    stroke="rgba(196, 113, 58, 0.25)"
                    strokeWidth="0.6"
                  />
                );
              })}

              {/* Arc paths for text + clickable labels */}
              {starlightStages.map((stage, i) => {
                const center = stageCenter(i);
                const cwEdge = center + SLICE_DEG / 2;
                const ccwEdge = center - SLICE_DEG / 2;
                const isSelected = selectedStarlightStage === stage.id;

                const effectiveAngle = ((center % 360) + 360) % 360;
                const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
                const inset = 2;

                const pathId = `slpath-${stage.id}`;
                const pathD = isUpper
                  ? arcPath(CX, CY, SL_TEXT_R, ccwEdge + inset, cwEdge - inset, 1)
                  : arcPath(CX, CY, SL_TEXT_R, cwEdge - inset, ccwEdge + inset, 0);

                const cRad = (center * Math.PI) / 180;
                const hx = CX + SL_TEXT_R * Math.cos(cRad);
                const hy = CY + SL_TEXT_R * Math.sin(cRad);

                const cwRad = (cwEdge * Math.PI) / 180;
                const ccwRad = (ccwEdge * Math.PI) / 180;

                return (
                  <g
                    key={stage.id}
                    className={`starlight-stage${isSelected ? ' active' : ''}`}
                    onClick={() => onSelectStarlightStage && onSelectStarlightStage(isSelected ? null : stage.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Segment highlight background */}
                    {isSelected && (
                      <path
                        d={`M ${CX + SL_INNER_R * Math.cos(cwRad)},${CY + SL_INNER_R * Math.sin(cwRad)} A ${SL_INNER_R},${SL_INNER_R} 0 0,0 ${CX + SL_INNER_R * Math.cos(ccwRad)},${CY + SL_INNER_R * Math.sin(ccwRad)} L ${CX + SL_OUTER_R * Math.cos(ccwRad)},${CY + SL_OUTER_R * Math.sin(ccwRad)} A ${SL_OUTER_R},${SL_OUTER_R} 0 0,1 ${CX + SL_OUTER_R * Math.cos(cwRad)},${CY + SL_OUTER_R * Math.sin(cwRad)} Z`}
                        fill="rgba(196, 113, 58, 0.12)"
                      />
                    )}
                    {/* Hit target */}
                    <circle cx={hx} cy={hy} r="20" fill="transparent" />
                    {/* Text arc path */}
                    <path id={pathId} d={pathD} fill="none" />
                    {/* Pulse ring on selected */}
                    {isSelected && (
                      <circle cx={hx} cy={hy} r="14" fill="none" stroke="rgba(196, 113, 58, 0.5)" strokeWidth="0.8">
                        <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Label */}
                    <text
                      fill={isSelected ? '#e0a060' : 'rgba(196, 113, 58, 0.95)'}
                      fontSize="15"
                      fontFamily="Cinzel, serif"
                      fontWeight={isSelected ? '700' : '600'}
                      letterSpacing="0.5"
                    >
                      <textPath
                        href={`#${pathId}`}
                        startOffset="50%"
                        textAnchor="middle"
                      >
                        {stage.label}
                      </textPath>
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* Cycle rings — 6 concentric rings inside zodiac, each divided into 8 monomyth-synchronized segments */}
        {showCycles && monomythStages && (() => {
          const SLICE_DEG = 45;
          const stageCenter = (i) => -90 - i * SLICE_DEG;
          const dividerAngle = (i) => -90 + SLICE_DEG / 2 - i * SLICE_DEG;

          return (
            <g className="cycle-rings">
              {CYCLE_RINGS.map((ring, ri) => {
                // Color palette: inner 3 mystical/purple, outer 3 astronomical/blue
                const ringColor = ri < 3
                  ? 'rgba(180, 160, 200, ALPHA)'
                  : 'rgba(100, 180, 220, ALPHA)';
                const circleStroke = ringColor.replace('ALPHA', '0.18');
                const dividerStroke = ringColor.replace('ALPHA', '0.22');
                const textFill = ringColor.replace('ALPHA', '0.6');
                const textFillActive = ringColor.replace('ALPHA', '0.95');
                const titleFill = ringColor.replace('ALPHA', '0.15');

                return (
                  <g key={ring.key}>
                    {/* Ring circles */}
                    <circle cx={CX} cy={CY} r={ring.innerR} fill="none" stroke={circleStroke} strokeWidth="0.6" />
                    <circle cx={CX} cy={CY} r={ring.outerR} fill="none" stroke={circleStroke} strokeWidth="0.6" />

                    {/* Ring title label (faint, at upper-right) */}
                    {(() => {
                      const titleAngle = -60;
                      const titleR = ring.outerR - 4;
                      const tRad = (titleAngle * Math.PI) / 180;
                      const tx = CX + titleR * Math.cos(tRad);
                      const ty = CY + titleR * Math.sin(tRad);
                      return (
                        <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
                          fill={titleFill} fontSize={Math.max(5, ring.fontSize - 2)}
                          fontFamily="Cinzel, serif" fontWeight="400" letterSpacing="0.3"
                          transform={`rotate(${tangentRotation(titleAngle)}, ${tx}, ${ty})`}>
                          {ring.label}
                        </text>
                      );
                    })()}

                    {/* 8 divider lines at segment boundaries */}
                    {monomythStages.map((_, i) => {
                      const angle = dividerAngle(i);
                      const rad = (angle * Math.PI) / 180;
                      return (
                        <line key={`cdiv-${ring.key}-${i}`}
                          x1={CX + ring.innerR * Math.cos(rad)} y1={CY + ring.innerR * Math.sin(rad)}
                          x2={CX + ring.outerR * Math.cos(rad)} y2={CY + ring.outerR * Math.sin(rad)}
                          stroke={dividerStroke} strokeWidth="0.4" />
                      );
                    })}

                    {/* Phase labels on arc paths */}
                    {monomythStages.map((stage, i) => {
                      const phase = psychlesData[stage.id]?.cycles[ring.key]?.phase;
                      if (!phase) return null;
                      const center = stageCenter(i);
                      const cwEdge = center + SLICE_DEG / 2;
                      const ccwEdge = center - SLICE_DEG / 2;
                      const effectiveAngle = ((center % 360) + 360) % 360;
                      const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
                      const inset = 1.5;
                      const pathId = `cpath-${ring.key}-${stage.id}`;
                      const pathD = isUpper
                        ? arcPath(CX, CY, ring.textR, ccwEdge + inset, cwEdge - inset, 1)
                        : arcPath(CX, CY, ring.textR, cwEdge - inset, ccwEdge + inset, 0);
                      const isSelected = selectedMonomythStage === stage.id;

                      // Hit target center
                      const cRad = (center * Math.PI) / 180;
                      const hx = CX + ring.textR * Math.cos(cRad);
                      const hy = CY + ring.textR * Math.sin(cRad);

                      return (
                        <g key={`clabel-${ring.key}-${stage.id}`}
                          onClick={() => onSelectCycleSegment && onSelectCycleSegment(stage.id, ring.cycleName)}
                          style={{ cursor: 'pointer' }}>
                          {/* Segment highlight when stage selected */}
                          {isSelected && (() => {
                            const cwRad = (cwEdge * Math.PI) / 180;
                            const ccwRad = (ccwEdge * Math.PI) / 180;
                            return (
                              <path
                                d={`M ${CX + ring.innerR * Math.cos(cwRad)},${CY + ring.innerR * Math.sin(cwRad)} A ${ring.innerR},${ring.innerR} 0 0,0 ${CX + ring.innerR * Math.cos(ccwRad)},${CY + ring.innerR * Math.sin(ccwRad)} L ${CX + ring.outerR * Math.cos(ccwRad)},${CY + ring.outerR * Math.sin(ccwRad)} A ${ring.outerR},${ring.outerR} 0 0,1 ${CX + ring.outerR * Math.cos(cwRad)},${CY + ring.outerR * Math.sin(cwRad)} Z`}
                                fill={ri < 3 ? 'rgba(180, 160, 200, 0.08)' : 'rgba(100, 180, 220, 0.08)'}
                              />
                            );
                          })()}
                          <circle cx={hx} cy={hy} r={Math.max(12, ring.textR * 0.12)} fill="transparent" />
                          <path id={pathId} d={pathD} fill="none" />
                          <text fill={isSelected ? textFillActive : textFill}
                            fontSize={ring.fontSize} fontFamily="Cinzel, serif"
                            fontWeight={isSelected ? '600' : '400'} letterSpacing="0.3">
                            <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                              {phase}
                            </textPath>
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Planet dots on Solar Day ring (hour angles) */}
              {geoClockAngles && (() => {
                const dayRing = CYCLE_RINGS[3]; // solarDay
                const sunDeg = clockTime.h * 15 + clockTime.m * 0.25 + 90;
                const allDayPlanets = [
                  { planet: 'Sun', angle: sunDeg },
                  ...Object.entries(geoClockAngles).map(([planet, angle]) => ({ planet, angle })),
                ];
                return allDayPlanets.map(({ planet, angle }) => {
                  const rad = (angle * Math.PI) / 180;
                  const px = CX + dayRing.textR * Math.cos(rad);
                  const py = CY + dayRing.textR * Math.sin(rad);
                  const isSel = selectedPlanet === planet;
                  const r = planet === 'Sun' ? 5 : 4;
                  return (
                    <g key={`day-${planet}`} style={{ cursor: 'pointer' }}
                      onClick={() => onSelectPlanet && onSelectPlanet(planet)}>
                      <circle cx={px} cy={py} r="10" fill="transparent" />
                      {isSel && (
                        <circle cx={px} cy={py} r={r + 4} fill="none"
                          stroke={PLANET_COLORS[planet]} strokeWidth="0.8" opacity="0.6">
                          <animate attributeName="r" values={`${r + 2};${r + 6};${r + 2}`} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={px} cy={py} r={r}
                        fill={PLANET_COLORS[planet]} fillOpacity={isSel ? 1 : 0.85}
                        stroke={isSel ? '#fff' : PLANET_COLORS[planet]} strokeWidth={isSel ? 1 : 0.5} />
                      <title>{planet}</title>
                    </g>
                  );
                });
              })()}

              {/* Planet dots on Solar Year ring (ecliptic longitudes) */}
              {eclipticAngles && Object.entries(eclipticAngles).map(([planet, angle]) => {
                const yearRing = CYCLE_RINGS[5]; // solarYear
                const rad = (angle * Math.PI) / 180;
                const px = CX + yearRing.textR * Math.cos(rad);
                const py = CY + yearRing.textR * Math.sin(rad);
                const isSel = selectedPlanet === planet;
                return (
                  <g key={`year-${planet}`} style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPlanet && onSelectPlanet(planet)}>
                    <circle cx={px} cy={py} r="10" fill="transparent" />
                    {isSel && (
                      <circle cx={px} cy={py} r="8" fill="none"
                        stroke={PLANET_COLORS[planet]} strokeWidth="0.8" opacity="0.6">
                        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={px} cy={py} r="4"
                      fill={PLANET_COLORS[planet]} fillOpacity={isSel ? 1 : 0.8}
                      stroke={isSel ? '#fff' : PLANET_COLORS[planet]} strokeWidth={isSel ? 1 : 0.3} />
                    <title>{planet}</title>
                  </g>
                );
              })}

              {/* Moon on Lunar Month ring (ecliptic position) */}
              {eclipticAngles && (() => {
                const monthRing = CYCLE_RINGS[4]; // lunarMonth
                const moonAngle = eclipticAngles['Moon'];
                const rad = (moonAngle * Math.PI) / 180;
                const px = CX + monthRing.textR * Math.cos(rad);
                const py = CY + monthRing.textR * Math.sin(rad);
                const isSel = selectedPlanet === 'Moon';
                return (
                  <g style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPlanet && onSelectPlanet('Moon')}>
                    <circle cx={px} cy={py} r="10" fill="transparent" />
                    {isSel && (
                      <circle cx={px} cy={py} r="9" fill="none"
                        stroke={PLANET_COLORS.Moon} strokeWidth="0.8" opacity="0.6">
                        <animate attributeName="r" values="7;11;7" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={px} cy={py} r="5"
                      fill={PLANET_COLORS.Moon} fillOpacity={isSel ? 1 : 0.85}
                      stroke={isSel ? '#fff' : PLANET_COLORS.Moon} strokeWidth={isSel ? 1 : 0.5} />
                    <title>Moon</title>
                  </g>
                );
              })()}
            </g>
          );
        })()}

        {/* Cardinal click targets on top of cycle rings (when monomyth active, cycle ring hit areas overlap the diamonds in the zodiac group) */}
        {showMonomyth && CARDINALS.map(c => {
          const rad = (c.angle * Math.PI) / 180;
          const cx = CX + CARDINAL_R * Math.cos(rad);
          const cy = CY + CARDINAL_R * Math.sin(rad);
          return (
            <circle
              key={`card-top-${c.id}`}
              cx={cx} cy={cy} r="16" fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectCardinal && onSelectCardinal(selectedCardinal === c.id ? null : c.id)}
            />
          );
        })}

        {/* Analog clock overlay — 12h or 24h mode (outside rotated group) */}
        {showClock && clockMode === '12h' && !chakraViewMode && (() => {
          const CLOCK_NUM_R = 240;
          const hourAngles = Array.from({ length: 12 }, (_, i) => {
            const num = i === 0 ? 12 : i;
            const deg = i * 30 - 90; // 12 at top
            const rad = (deg * Math.PI) / 180;
            return { num, x: CX + CLOCK_NUM_R * Math.cos(rad), y: CY + CLOCK_NUM_R * Math.sin(rad) };
          });
          const sDeg = clockTime.s * 6 - 90;
          const mDeg = clockTime.m * 6 + clockTime.s * 0.1 - 90;
          const hDeg = (clockTime.h % 12) * 30 + clockTime.m * 0.5 - 90;
          const hand = (deg, len, width, color) => {
            const rad = (deg * Math.PI) / 180;
            return <line x1={CX} y1={CY} x2={CX + len * Math.cos(rad)} y2={CY + len * Math.sin(rad)} stroke={color} strokeWidth={width} strokeLinecap="round" />;
          };
          return (
            <g className="clock-overlay">
              {hourAngles.map(({ num, x, y }) => (
                <text key={`clk-${num}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fill="rgba(139, 195, 170, 0.95)" fontSize="14" fontFamily="Cinzel, serif" fontWeight="600">
                  {num}
                </text>
              ))}
              {hand(hDeg, 140, 3.5, 'rgba(201, 169, 97, 0.95)')}
              {hand(mDeg, 200, 2.5, 'rgba(201, 169, 97, 0.95)')}
              {hand(sDeg, 230, 1, 'rgba(220, 130, 65, 0.95)')}

              {/* Compass directions — map convention: N top, S bottom, E right, W left (Cancer/N, Aries/E, Capricorn/S, Libra/W) */}
              <text x={CX} y={2} textAnchor="middle" dominantBaseline="hanging"
                fill={starMapMode === 'north' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
                fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                style={{ cursor: 'pointer' }}
                onClick={() => setStarMapMode(p => p === 'north' ? 'none' : 'north')}>N</text>
              <text x={CX} y={698} textAnchor="middle" dominantBaseline="auto"
                fill={starMapMode === 'south' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
                fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                style={{ cursor: 'pointer' }}
                onClick={() => setStarMapMode(p => p === 'south' ? 'none' : 'south')}>S</text>
              <text x={698} y={CY} textAnchor="end" dominantBaseline="central"
                fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">E</text>
              <text x={2} y={CY} textAnchor="start" dominantBaseline="central"
                fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">W</text>

              <circle cx={CX} cy={CY} r={5} fill="rgba(201, 169, 97, 0.95)" />
            </g>
          );
        })()}

        {/* 24-hour geocentric astronomical clock (hands, numbers, sun — planets rendered in planet layer below) */}
        {showClock && clockMode === '24h' && !chakraViewMode && (() => {
          const CLOCK_NUM_R = 240;
          const SUN_R = 160; // same orbital radius as geocentric Sun orbit
          const hourAngles24 = Array.from({ length: 24 }, (_, i) => {
            const deg = i * 15 + 90; // 0 at bottom (midnight), 12 at top (noon)
            const rad = (deg * Math.PI) / 180;
            return { num: i, x: CX + CLOCK_NUM_R * Math.cos(rad), y: CY + CLOCK_NUM_R * Math.sin(rad) };
          });
          const hDeg24 = clockTime.h * 15 + clockTime.m * 0.25 + 90;
          const hRad24 = (hDeg24 * Math.PI) / 180;
          const sunTipX = CX + SUN_R * Math.cos(hRad24);
          const sunTipY = CY + SUN_R * Math.sin(hRad24);
          const mDeg24 = clockTime.m * 6 + clockTime.s * 0.1 + 90;
          const sDeg24 = clockTime.s * 6 + 90;
          const hand24 = (deg, len, width, color) => {
            const rad = (deg * Math.PI) / 180;
            return <line x1={CX} y1={CY} x2={CX + len * Math.cos(rad)} y2={CY + len * Math.sin(rad)} stroke={color} strokeWidth={width} strokeLinecap="round" />;
          };

          return (
            <g className="clock-overlay clock-24h">
              {/* 24 hour numbers */}
              {!showCycles && hourAngles24.map(({ num, x, y }) => (
                <text key={`clk24-${num}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fill={num % 6 === 0 ? 'rgba(139, 195, 170, 0.95)' : 'rgba(139, 195, 170, 0.6)'}
                  fontSize={num % 6 === 0 ? '13' : '10'} fontFamily="Cinzel, serif"
                  fontWeight={num % 6 === 0 ? '600' : '400'}>
                  {num}
                </text>
              ))}

              {/* Sun at its orbital radius — conceptually the hour hand tip (hidden when cycles active) */}
              {!showCycles && (<g
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectPlanet('Sun')}
                onMouseEnter={(e) => handleTooltipEnter('planet', 'Sun', e)}
                onMouseMove={handleTooltipMove}
                onMouseLeave={handleTooltipLeave}
              >
              <radialGradient id="sun-clock-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f0c040" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f0a020" stopOpacity="0" />
              </radialGradient>
              <circle cx={sunTipX} cy={sunTipY} r={32} fill="url(#sun-clock-glow)" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * 45 * Math.PI) / 180;
                const inner = 15;
                const outer = 25;
                const spread = 0.18;
                return (
                  <polygon key={`sun-ray-${i}`}
                    points={`${sunTipX + inner * Math.cos(a - spread)},${sunTipY + inner * Math.sin(a - spread)} ${sunTipX + outer * Math.cos(a)},${sunTipY + outer * Math.sin(a)} ${sunTipX + inner * Math.cos(a + spread)},${sunTipY + inner * Math.sin(a + spread)}`}
                    fill="#f0c040" opacity="0.55" />
                );
              })}
              <circle cx={sunTipX} cy={sunTipY} r={16} fill="#f0c040"
                fillOpacity={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? 0.95 : 0.85}
                stroke="#f0c040" strokeWidth={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? 2 : 0.8}
                filter={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? 'url(#glow-Sun)' : undefined} />
              {selectedPlanet === 'Sun' && (
                <circle cx={sunTipX} cy={sunTipY} r="22" fill="none" stroke="#f0c040" strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" values="20;24;20" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <text x={sunTipX} y={sunTipY + 28} textAnchor="middle"
                fill={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? '#f0c040' : '#a8a8b8'}
                fontSize={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? '11' : '10'}
                fontFamily="Cinzel, serif"
                fontWeight={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? '700' : '400'}>
                Sun
              </text>
              </g>)}

              {/* Horizon line from sunrise to sunset */}
              {sunriseSunset && (() => {
                const HR = 278;
                const riseDeg = sunriseSunset.riseHours * 15 + 90;
                const setDeg = sunriseSunset.setHours * 15 + 90;
                const riseRad = (riseDeg * Math.PI) / 180;
                const setRad = (setDeg * Math.PI) / 180;
                return (
                  <line
                    x1={CX + HR * Math.cos(riseRad)} y1={CY + HR * Math.sin(riseRad)}
                    x2={CX + HR * Math.cos(setRad)} y2={CY + HR * Math.sin(setRad)}
                    stroke="rgba(100, 180, 220, 0.35)" strokeWidth="1" />
                );
              })()}

              {/* Compass directions — when monomyth active: map convention (N top); otherwise sky convention (S top) */}
              {showMonomyth ? (
                <>
                  <text x={CX} y={2} textAnchor="middle" dominantBaseline="hanging"
                    fill={starMapMode === 'north' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
                    fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setStarMapMode(p => p === 'north' ? 'none' : 'north')}>N</text>
                  <text x={CX} y={698} textAnchor="middle" dominantBaseline="auto"
                    fill={starMapMode === 'south' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
                    fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setStarMapMode(p => p === 'south' ? 'none' : 'south')}>S</text>
                  <text x={698} y={CY} textAnchor="end" dominantBaseline="central"
                    fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">E</text>
                  <text x={2} y={CY} textAnchor="start" dominantBaseline="central"
                    fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">W</text>
                </>
              ) : (
                <>
                  <text x={CX} y={2} textAnchor="middle" dominantBaseline="hanging"
                    fill={starMapMode === 'south' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
                    fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setStarMapMode(p => p === 'south' ? 'none' : 'south')}>S</text>
                  <text x={CX} y={698} textAnchor="middle" dominantBaseline="auto"
                    fill={starMapMode === 'north' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
                    fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setStarMapMode(p => p === 'north' ? 'none' : 'north')}>N</text>
                  <text x={698} y={CY} textAnchor="end" dominantBaseline="central"
                    fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">W</text>
                  <text x={2} y={CY} textAnchor="start" dominantBaseline="central"
                    fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">E</text>
                </>
              )}

              {/* Clock hands — hour, minute, second */}
              {hand24(hDeg24, 140, 3.5, 'rgba(201, 169, 97, 0.95)')}
              {hand24(mDeg24, 200, 2.5, 'rgba(201, 169, 97, 0.95)')}
              {hand24(sDeg24, 230, 1, 'rgba(220, 130, 65, 0.95)')}

              {/* Center dot */}
              <circle cx={CX} cy={CY} r={5} fill="rgba(201, 169, 97, 0.95)" />
            </g>
          );
        })()}

        {/* Chakra body viewer — Vitruvian figure + planets at chakra positions */}
        {chakraViewMode ? (
          <g className="chakra-body-viewer">
            {/* Compass directions — map convention: N top, E right, S bottom, W left */}
            <text x={CX} y={2} textAnchor="middle" dominantBaseline="hanging"
              fill={starMapMode === 'north' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
              fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
              style={{ cursor: 'pointer' }}
              onClick={() => setStarMapMode(p => p === 'north' ? 'none' : 'north')}>N</text>
            <text x={CX} y={698} textAnchor="middle" dominantBaseline="auto"
              fill={starMapMode === 'south' ? 'rgba(180, 220, 255, 0.95)' : 'rgba(201, 169, 97, 0.7)'}
              fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2"
              style={{ cursor: 'pointer' }}
              onClick={() => setStarMapMode(p => p === 'south' ? 'none' : 'south')}>S</text>
            <text x={698} y={CY} textAnchor="end" dominantBaseline="central"
              fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">E</text>
            <text x={2} y={CY} textAnchor="start" dominantBaseline="central"
              fill="rgba(201, 169, 97, 0.7)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">W</text>
            {/* Vitruvian figure — wheel-bound marble statue */}
            <g className="vitruvian-figure">
              <defs>
                <clipPath id="wheel-clip">
                  <circle cx={CX} cy={CY} r={ZODIAC_OUTER_R} />
                </clipPath>
                <filter id="golden-tint">
                  <feColorMatrix type="matrix" values="0.6 0.3 0.1 0 0  0.5 0.4 0.1 0 0  0.2 0.15 0.1 0 0  0 0 0 1 0" />
                </filter>
              </defs>
              <image
                href="/images/wheel-figure.png"
                x={-25} y={-19} width={751} height={739}
                opacity={0.18}
                clipPath="url(#wheel-clip)"
                filter="url(#golden-tint)"
                style={{ mixBlendMode: 'screen' }}
              />
            </g>

            {/* Chakra color dots */}
            {CHAKRA_POSITIONS.map((pos, i) => (
              <circle key={`dot-${pos.label}`} className="chakra-dot" cx={pos.x} cy={pos.y} r="18" fill={pos.color} opacity="0.12" />
            ))}

            {/* Chakra labels */}
            {CHAKRA_POSITIONS.map((pos) => (
              <text key={`label-${pos.label}`} className="chakra-label"
                x={pos.x + 28} y={pos.y + 1}
                textAnchor="start" dominantBaseline="central"
                fill="rgba(201,169,97,0.35)" fontSize="8" fontFamily="Cinzel, serif" fontWeight="400"
              >
                {pos.label}
              </text>
            ))}

            {/* Planet nodes at chakra positions */}
            {CHAKRA_ORDERINGS[chakraViewMode].map((planet, i) => {
              const pos = CHAKRA_POSITIONS[i];
              const orbit = ORBITS.find(o => o.planet === planet);
              return (
                <PlanetNode
                  key={planet}
                  planet={planet}
                  metal={orbit?.metal || ''}
                  cx={pos.x}
                  cy={pos.y}
                  selected={selectedPlanet === planet}
                  hovered={hoveredPlanet === planet}
                  onClick={() => onSelectPlanet(planet)}
                  onMouseEnter={(e) => handleTooltipEnter('planet', planet, e)}
                  onMouseLeave={handleTooltipLeave}
                  smooth={true}
                />
              );
            })}

            {/* Mode label — above the month ring (clickable) */}
            <g style={{ cursor: 'pointer' }} onClick={onClickOrderLabel}>
              <text x={CX} y={585} textAnchor="middle" fill="rgba(201,169,97,0.9)" fontSize="18" fontFamily="Cinzel, serif" fontWeight="600" letterSpacing="2"
                style={{ textDecoration: 'underline', textDecorationColor: 'rgba(201,169,97,0.35)', textUnderlineOffset: '4px' }}>
                {CHAKRA_MODE_LABELS[chakraViewMode]}
              </text>
              <text x={CX + (CHAKRA_MODE_LABELS[chakraViewMode].length * 5.5) + 12} y={585} textAnchor="middle" fill="rgba(201,169,97,0.5)" fontSize="12" fontFamily="sans-serif">
                ▾
              </text>
            </g>
          </g>
        ) : (
          <>
        {/* Orbital rings (hidden when cycles active) */}
        {!showCycles && (clockMode === '24h'
          ? ORBITS.filter(o => o.planet !== 'Sun')
          : heliocentric ? HELIO_ORBITS : ORBITS
        ).map(o => (
          <circle
            key={o.planet}
            cx={CX} cy={CY} r={o.r}
            fill="none"
            stroke={clockMode === '24h' ? 'rgba(139, 157, 195, 0.10)' : 'rgba(139, 157, 195, 0.12)'}
            strokeWidth={clockMode === '24h' ? '0.6' : '0.8'}
            strokeDasharray="4 3"
          />
        ))}
        {/* Moon orbit around Earth in heliocentric mode */}
        {heliocentric && (() => {
          const earthAngle = helioLiveAngles ? helioLiveAngles['Earth'] : (orbitAngles['Earth'] || 0);
          const earthRad = (earthAngle * Math.PI) / 180;
          const ex = CX + 140 * Math.cos(earthRad);
          const ey = CY + 140 * Math.sin(earthRad);
          return <circle cx={ex} cy={ey} r={HELIO_MOON.r} fill="none" stroke="rgba(200, 216, 232, 0.15)" strokeWidth="0.5" strokeDasharray="2 2" />;
        })()}

        {/* Alignment line when active */}
        {aligned && (
          <line
            x1={CX} y1={CY - 30}
            x2={CX} y2={CY - ORBITS[ORBITS.length - 1].r - 20}
            stroke="rgba(201, 169, 97, 0.2)"
            strokeWidth="1"
            strokeDasharray="6 4"
          />
        )}

        {/* Center body: Sun (heliocentric) or Earth (geocentric) */}
        {heliocentric ? (
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectPlanet('Sun')}
          >
            {/* Sun glow */}
            <radialGradient id="sun-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f0c040" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#f0a020" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f08000" stopOpacity="0" />
            </radialGradient>
            <circle cx={CX} cy={CY} r="32" fill="url(#sun-center-glow)" />
            {/* Corona rays */}
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const inner = 16 * 1.05;
              const outer = 16 * 1.5;
              const spread = 0.15;
              return (
                <polygon key={i}
                  points={`${CX + inner * Math.cos(angle - spread)},${CY + inner * Math.sin(angle - spread)} ${CX + outer * Math.cos(angle)},${CY + outer * Math.sin(angle)} ${CX + inner * Math.cos(angle + spread)},${CY + inner * Math.sin(angle + spread)}`}
                  fill="#f0c040" opacity="0.5"
                />
              );
            })}
            <circle cx={CX} cy={CY} r="16"
              fill="#f0c040" fillOpacity={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? 0.9 : 0.7}
              stroke="#f0c040" strokeWidth={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? 2 : 1}
              filter={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? 'url(#glow-Sun)' : undefined}
            />
            {selectedPlanet === 'Sun' && (
              <circle cx={CX} cy={CY} r="22" fill="none" stroke="#f0c040" strokeWidth="1" opacity="0.4">
                <animate attributeName="r" values="20;24;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {hoveredPlanet === 'Sun' && selectedPlanet !== 'Sun' && (
              <circle cx={CX} cy={CY} r="21" fill="none" stroke="#f0c040" strokeWidth="1" opacity="0.3" />
            )}
            <text x={CX} y={CY + 30} textAnchor="middle" fill={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? '#f0c040' : '#a8a8b8'}
              fontSize={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? '11' : '10'} fontFamily="Cinzel, serif" fontWeight={selectedPlanet === 'Sun' || hoveredPlanet === 'Sun' ? '700' : '400'}>
              Sun
            </text>
          </g>
        ) : (() => {
          const sunAngle = clockMode === '24h'
            ? (clockTime.h * 15 + clockTime.m * 0.25 + 90)
            : aligned ? ALIGN_ANGLE : liveAngles ? liveAngles['Sun'].svgAngle : orbitAngles['Sun'];
          const er = 14;
          const daySelected = selectedEarth === 'day';
          const nightSelected = selectedEarth === 'night';
          const sunRad = (sunAngle * Math.PI) / 180;
          const dayLabelX = CX + (er + 14) * Math.cos(sunRad);
          const dayLabelY = CY + (er + 14) * Math.sin(sunRad);
          const nightLabelX = CX - (er + 14) * Math.cos(sunRad);
          const nightLabelY = CY - (er + 14) * Math.sin(sunRad);
          return (
            <g>
              <circle cx={CX} cy={CY} r="28" fill="url(#earth-glow)" />
              <g style={{ cursor: 'pointer' }} onClick={() => onSelectEarth && onSelectEarth(daySelected ? null : 'day')}
                onMouseEnter={(e) => handleTooltipEnter('daynight', 'day', e)}
                onMouseMove={handleTooltipMove}
                onMouseLeave={handleTooltipLeave}>
                <path d={`M 0,${-er} A ${er},${er} 0 0,1 0,${er} L 0,0 Z`}
                  fill={daySelected ? '#6aded0' : '#4a9a8a'} fillOpacity="0.9"
                  stroke={daySelected ? '#7aeac0' : 'none'} strokeWidth="1.5"
                  transform={`translate(${CX},${CY}) rotate(${sunAngle})`} />
                {daySelected && (
                  <circle cx={CX} cy={CY} r={er + 5} fill="none" stroke="#7aeac0" strokeWidth="0.8" opacity="0.5">
                    <animate attributeName="r" values={`${er + 3};${er + 7};${er + 3}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={dayLabelX} y={dayLabelY} textAnchor="middle" dominantBaseline="central"
                  fill={daySelected ? '#7aeac0' : 'rgba(90, 170, 154, 0.6)'} fontSize="7" fontFamily="Cinzel, serif" fontWeight={daySelected ? '700' : '400'}>
                  Day
                </text>
              </g>
              <g style={{ cursor: 'pointer' }} onClick={() => onSelectEarth && onSelectEarth(nightSelected ? null : 'night')}
                onMouseEnter={(e) => handleTooltipEnter('daynight', 'night', e)}
                onMouseMove={handleTooltipMove}
                onMouseLeave={handleTooltipLeave}>
                <path d={`M 0,${-er} A ${er},${er} 0 0,0 0,${er} L 0,0 Z`}
                  fill={nightSelected ? '#2a4a4a' : '#152525'} fillOpacity="0.9"
                  stroke={nightSelected ? '#5a8a8a' : 'none'} strokeWidth="1.5"
                  transform={`translate(${CX},${CY}) rotate(${sunAngle})`} />
                {nightSelected && (
                  <circle cx={CX} cy={CY} r={er + 5} fill="none" stroke="#5a8a8a" strokeWidth="0.8" opacity="0.5">
                    <animate attributeName="r" values={`${er + 3};${er + 7};${er + 3}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={nightLabelX} y={nightLabelY} textAnchor="middle" dominantBaseline="central"
                  fill={nightSelected ? '#8ababa' : 'rgba(90, 130, 130, 0.5)'} fontSize="7" fontFamily="Cinzel, serif" fontWeight={nightSelected ? '700' : '400'}>
                  Night
                </text>
              </g>
              <line x1={CX} y1={CY - er} x2={CX} y2={CY + er}
                stroke="rgba(180, 220, 210, 0.3)" strokeWidth="0.8"
                transform={`rotate(${sunAngle}, ${CX}, ${CY})`} />
              <circle cx={CX} cy={CY} r={er} fill="none" stroke="rgba(90, 170, 154, 0.5)" strokeWidth="1" />
            </g>
          );
        })()}

        {/* Planet nodes — rendered last so they're on top for clicks (hidden when cycles active) */}
        {!showCycles && (clockMode === '24h' ? (
          /* 24h mode: planets at real geocentric positions (no Sun — it's on the hour hand) */
          geoClockAngles && ORBITS.filter(o => o.planet !== 'Sun').map(o => {
            const angle = geoClockAngles[o.planet];
            if (angle == null) return null;
            const rad = (angle * Math.PI) / 180;
            const px = CX + o.r * Math.cos(rad);
            const py = CY + o.r * Math.sin(rad);
            return (
              <PlanetNode
                key={`geo24-${o.planet}`}
                planet={o.planet}
                metal={o.metal}
                cx={px}
                cy={py}
                selected={selectedPlanet === o.planet}
                hovered={hoveredPlanet === o.planet}
                onClick={() => onSelectPlanet(o.planet)}
                onMouseEnter={(e) => handleTooltipEnter('planet', o.planet, e)}
                onMouseLeave={handleTooltipLeave}
                moonPhase={o.planet === 'Moon' ? moonPhaseAngle : undefined}
                smooth={true}
              />
            );
          })
        ) : heliocentric ? (
          <>
            {HELIO_ORBITS.map(o => {
              const angle = helioLiveAngles ? helioLiveAngles[o.planet] : (orbitAngles[o.planet] || 0);
              const rad = (angle * Math.PI) / 180;
              const px = CX + o.r * Math.cos(rad);
              const py = CY + o.r * Math.sin(rad);
              return (
                <g key={o.planet}>
                  <PlanetNode
                    planet={o.planet}
                    metal={o.planet === 'Earth' ? '' : ORBITS.find(x => x.planet === o.planet)?.metal || ''}
                    cx={px}
                    cy={py}
                    selected={selectedPlanet === o.planet}
                    hovered={hoveredPlanet === o.planet}
                    onClick={() => onSelectPlanet(o.planet)}
                    onMouseEnter={(e) => handleTooltipEnter('planet', o.planet, e)}
                    onMouseLeave={handleTooltipLeave}
                    smooth={false}
                  />
                  {/* Moon orbiting Earth */}
                  {o.planet === 'Earth' && (() => {
                    const moonAngle = helioLiveAngles ? helioLiveAngles['Moon-helio'] : (orbitAngles['Moon-helio'] || 0);
                    const mRad = (moonAngle * Math.PI) / 180;
                    const mx = px + HELIO_MOON.r * Math.cos(mRad);
                    const my = py + HELIO_MOON.r * Math.sin(mRad);
                    return (
                      <g
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSelectPlanet('Moon')}
                        onMouseEnter={(e) => handleTooltipEnter('planet', 'Moon', e)}
                        onMouseMove={handleTooltipMove}
                        onMouseLeave={handleTooltipLeave}
                      >
                        <circle cx={mx} cy={my} r="8" fill="transparent" />
                        <circle cx={mx} cy={my} r="4"
                          fill="#c8d8e8" fillOpacity="0.7"
                          stroke="#c8d8e8" strokeWidth="0.5" />
                        <text x={mx} y={my + 10} textAnchor="middle" fill="rgba(200,216,232,0.5)" fontSize="6" fontFamily="Cinzel, serif">
                          Moon
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </>
        ) : ORBITS.map(o => {
          const angle = aligned ? ALIGN_ANGLE : liveAngles ? liveAngles[o.planet].svgAngle : orbitAngles[o.planet];
          const rad = (angle * Math.PI) / 180;
          const px = CX + o.r * Math.cos(rad);
          const py = CY + o.r * Math.sin(rad);
          return (
            <g key={o.planet}>
              <PlanetNode
                planet={o.planet}
                metal={o.metal}
                cx={px}
                cy={py}
                selected={selectedPlanet === o.planet}
                hovered={hoveredPlanet === o.planet}
                onClick={() => onSelectPlanet(o.planet)}
                onMouseEnter={(e) => handleTooltipEnter('planet', o.planet, e)}
                onMouseLeave={handleTooltipLeave}
                moonPhase={o.planet === 'Moon' ? (
                  !aligned && !livePositions
                    ? ((90 - orbitAngles['Moon']) % 360 + 360) % 360
                    : moonPhaseAngle
                ) : undefined}
                smooth={aligned || livePositions}
              />
              {liveAngles && (
                <g className="planet-smooth" transform={`translate(${px}, ${py})`}>
                  <text
                    x={0}
                    y={-18}
                    textAnchor="middle"
                    fill="rgba(201, 169, 97, 0.8)"
                    fontSize="8"
                    fontFamily="Crimson Pro, serif"
                  >
                    {lonToSignLabel(liveAngles[o.planet].lon, zodiacMode === 'sidereal' ? getLahiriAyanamsa() : 0)}
                  </text>
                </g>
              )}
            </g>
          );
        }))}

          </>
        )}

        {/* Star layers — outside chakra/normal ternary so they render in both modes (hidden in cycles mode) */}
        {starMapMode === 'south' && !showCycles && (
          <g className="star-layer star-layer-south" opacity={hoveredConstellation ? 0.15 : 1}>
            {starPositionsSouth.map((s, i) => (
              twinkleSouth.has(i)
                ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" className="star-twinkle" style={{ '--star-base-o': s.o, animationDelay: `${(i * 2.3) % 14}s`, animationDuration: `${12 + (i * 1.1) % 5}s` }} />
                : <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" opacity={s.o} />
            ))}
          </g>
        )}

        {starMapMode === 'north' && !showCycles && (
          <g className="star-layer star-layer-north" opacity={hoveredConstellation ? 0.15 : 1}>
            {starPositionsNorth.map((s, i) => (
              twinkleNorth.has(i)
                ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" className="star-twinkle" style={{ '--star-base-o': s.o, animationDelay: `${(i * 2.3) % 14}s`, animationDuration: `${12 + (i * 1.1) % 5}s` }} />
                : <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" opacity={s.o} />
            ))}
          </g>
        )}

        {/* Constellation highlight: lines + bright stars (hover or selected) */}
        {(hoveredConstellation || selectedConstellation) && !showCycles && starMapMode !== 'none' && (() => {
          const activeCid = hoveredConstellation || selectedConstellation;
          const cData = constellationMap[activeCid];
          if (!cData) return null;
          const isSelected = selectedConstellation === activeCid && !hoveredConstellation;
          return (
            <g className="constellation-highlight">
              {cData.lines
                .filter(l => starMapMode === 'north' ? (l.dec1 >= 0 && l.dec2 >= 0) : (l.dec1 < 0 && l.dec2 < 0))
                .map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke={isSelected ? "rgba(201, 169, 97, 0.6)" : "rgba(232, 224, 208, 0.4)"} strokeWidth={isSelected ? "1.2" : "0.8"} />
              ))}
              {(starMapMode === 'north'
                ? cData.northStars.map(i => ({ ...starPositionsNorth[i], i }))
                : cData.southStars.map(i => ({ ...starPositionsSouth[i], i }))
              ).map(s => (
                <circle key={s.i} cx={s.x} cy={s.y} r={s.r * 1.8}
                  fill={isSelected ? "#c9a961" : "#e8e0d0"} opacity={1} />
              ))}
            </g>
          );
        })()}

        {/* Invisible hit targets for constellation star hover + click */}
        {starMapMode !== 'none' && !showCycles && (
          <g className="constellation-hit-layer"
            onMouseOver={handleConstellationOver}
            onMouseMove={handleTooltipMove}
            onMouseOut={handleConstellationOut}
            onClick={handleConstellationClick}>
            {constellationHits.map(s => (
              <circle key={`${s.cid}-${s.idx}`} cx={s.x} cy={s.y}
                r={Math.max(s.r + 2, 5)} fill="transparent" data-cid={s.cid}
                style={{ cursor: 'pointer' }} />
            ))}
          </g>
        )}

        {/* Yellow Brick Road overlay */}
        {ybrActive && !chakraViewMode && (() => {
          const seq = ybrJourneySequence || [];
          const positions = seq.map(stop => {
            if (stop.type === 'planet') {
              const orbit = ORBITS.find(o => o.planet === stop.entity);
              if (!orbit) return { x: CX, y: CY };
              const rad = (ALIGN_ANGLE * Math.PI) / 180;
              return { x: CX + orbit.r * Math.cos(rad), y: CY + orbit.r * Math.sin(rad) };
            }
            const signIdx = ZODIAC.findIndex(z => z.sign === stop.entity);
            if (signIdx < 0) return { x: CX, y: CY };
            const angle = -(signIdx * 30 + 15);
            const rad = (angle * Math.PI) / 180;
            return { x: CX + ZODIAC_TEXT_R * Math.cos(rad), y: CY + ZODIAC_TEXT_R * Math.sin(rad) };
          });

          // Full path: Earth center → all stops → Earth center
          const allPts = [{ x: CX, y: CY }, ...positions, { x: CX, y: CY }];
          const fullD = allPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

          // Visited path up to current stop
          const vi = ybrCurrentStopIndex >= 0 ? Math.min(ybrCurrentStopIndex, positions.length - 1) : -1;
          const visitedPts = vi >= 0 ? [{ x: CX, y: CY }, ...positions.slice(0, vi + 1)] : [];
          const visitedD = visitedPts.length > 1
            ? visitedPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
            : '';

          return (
            <g className="ybr-overlay" style={{ pointerEvents: 'none' }}>
              <path d={fullD} fill="none" stroke="rgba(218,165,32,0.15)" strokeWidth="1.5" strokeDasharray="6 4" />
              {visitedD && <path d={visitedD} fill="none" stroke="rgba(218,165,32,0.6)" strokeWidth="2" />}
              {positions.map((pos, i) => {
                const isCurrent = i === ybrCurrentStopIndex;
                const isPast = i < ybrCurrentStopIndex;
                const stopId = seq[i]?.id;
                const isComplete = stopId && ybrStopProgress?.[stopId]?.passed?.every(p => p);
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y}
                      r={isCurrent ? 5 : 3}
                      fill={isPast && isComplete ? 'rgba(218,165,32,0.5)' : isPast ? 'rgba(218,165,32,0.3)' : isCurrent ? '#daa520' : 'none'}
                      stroke={isCurrent ? '#daa520' : isPast ? 'rgba(218,165,32,0.3)' : 'rgba(218,165,32,0.15)'}
                      strokeWidth={isCurrent ? 1.5 : 0.8}
                    />
                    {isCurrent && (
                      <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke="#daa520" strokeWidth="1" opacity="0.6">
                        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* YBR intro lighting sequence */}
        {ybrIntroStep >= 0 && (() => {
          const maxIdx = Math.min(ybrIntroStep, YBR_INTRO_SEQ.length - 1);
          const fading = ybrIntroStep >= YBR_INTRO_SEQ.length;
          return (
            <g className="ybr-intro-overlay" style={{ pointerEvents: 'none', opacity: fading ? 0 : 1, transition: 'opacity 1s ease-out' }}>
              {YBR_INTRO_SEQ.slice(0, maxIdx + 1).map((pos, i) => {
                const isCurrent = i === maxIdx && !fading;
                const age = maxIdx - i;
                const dimOpacity = Math.max(0.2, 0.6 - age * 0.03);
                return (
                  <g key={i}>
                    {/* Soft glow fill */}
                    <circle cx={pos.x} cy={pos.y}
                      r={isCurrent ? pos.r * 1.2 : pos.r * 0.9}
                      fill={isCurrent ? 'rgba(218,165,32,0.15)' : 'rgba(218,165,32,0.06)'}
                      stroke="none"
                    />
                    {/* Ring */}
                    <circle cx={pos.x} cy={pos.y}
                      r={isCurrent ? pos.r : pos.r * 0.8}
                      fill="none"
                      stroke={isCurrent ? '#f0c040' : 'rgba(218,165,32,0.6)'}
                      strokeWidth={isCurrent ? 2.5 : 1.2}
                      opacity={isCurrent ? 1 : dimOpacity}
                    />
                    {/* Pulse on current */}
                    {isCurrent && (
                      <circle cx={pos.x} cy={pos.y} r={pos.r} fill="none" stroke="#f0c040" strokeWidth="2" opacity="0.7">
                        <animate attributeName="r" values={`${pos.r * 0.7};${pos.r * 1.5};${pos.r * 0.7}`} dur="0.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0.15;0.7" dur="0.6s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })()}
        </>)}
      </svg>
      {stormFlash && (
        <div className="storm-shield-overlay">
          <img src="/storm-shield.png" alt="" className="storm-shield-img" />
        </div>
      )}
      {meteorShower && (
        <div className="meteor-shower-overlay" aria-hidden="true">
          <svg viewBox="0 0 700 700" className="meteor-shower-svg">
            <line className="meteor-streak m1"  x1="180" y1="-20" x2="130" y2="80"  />
            <line className="meteor-streak m2"  x1="350" y1="-30" x2="300" y2="70"  />
            <line className="meteor-streak m3"  x1="520" y1="-10" x2="470" y2="90"  />
            <line className="meteor-streak m4"  x1="100" y1="30"  x2="50"  y2="130" />
            <line className="meteor-streak m5"  x1="430" y1="-40" x2="380" y2="60"  />
            <line className="meteor-streak m6"  x1="600" y1="10"  x2="550" y2="110" />
            <line className="meteor-streak m7"  x1="250" y1="50"  x2="200" y2="150" />
            <line className="meteor-streak m8"  x1="480" y1="40"  x2="430" y2="140" />
            <line className="meteor-streak m9"  x1="150" y1="100" x2="100" y2="200" />
            <line className="meteor-streak m10" x1="560" y1="80"  x2="510" y2="180" />
            <line className="meteor-streak m11" x1="320" y1="20"  x2="270" y2="120" />
            <line className="meteor-streak m12" x1="650" y1="-15" x2="600" y2="85"  />
            <circle className="meteor-impact" cx="350" cy="350" r="0" />
          </svg>
        </div>
      )}
      {fallingStarAnim && (
        <div className="falling-star-overlay" aria-hidden="true">
          <div className="falling-star-body">
            <div className="falling-star-trail" />
            <div className="falling-star-head" />
          </div>
        </div>
      )}
      {videoListId && (
        <div className="orbital-video-container">
          <div ref={videoPlayerDivRef} className="orbital-video-player" />
          <button className="orbital-video-close" onClick={onCloseVideo} title="Close video">{'\u2715'}</button>
          <div className="orbital-video-controls">
            <button className="orbital-video-btn" onClick={handleVideoPrev} title="Previous">{'\u25C0'}</button>
            <button className="orbital-video-btn" onClick={handleVideoNext} title="Next">{'\u25B6'}</button>
          </div>
        </div>
      )}
      {tooltip && wrapperRef.current && (() => {
        const rect = wrapperRef.current.getBoundingClientRect();
        const relX = tooltip.x - rect.left;
        const relY = tooltip.y - rect.top;
        const nearTop = relY < 80;
        return (
          <div
            className="orbital-tooltip"
            style={{
              left: relX,
              top: nearTop ? relY + 16 : relY - 12,
              transform: nearTop ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
            }}
          >
            {renderTooltipContent()}
          </div>
        );
      })()}
      </div>
      <div className="orbital-btn-row" data-expanded={mobileMenuOpen || undefined}>
        <button
          className="mobile-mode-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          title={mobileMenuOpen ? 'Collapse buttons' : 'Show mode buttons'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
              </>
            )}
          </svg>
        </button>
        <button
          className="clock-toggle"
          onClick={() => { onToggleClock && onToggleClock(); }}
          title={!clockMode ? 'Show 12-hour heliocentric clock' : clockMode === '12h' ? '12-hour heliocentric — click for 24-hour geocentric' : '24-hour geocentric — click for 12-hour heliocentric'}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6 L12 12 L16 14" />
            {clockMode && <circle cx="12" cy="12" r="2.5" fill={clockMode === '12h' ? '#f0c040' : '#4a9bd9'} stroke="none" />}
          </svg>
        </button>
        <button
          className="chakra-view-toggle"
          onClick={() => { onToggleChakraView && onToggleChakraView(); }}
          title={
            !chakraViewMode ? 'Show chakra body viewer (Chaldean)' :
            chakraViewMode === 'chaldean' ? 'Chaldean Order — click for Heliocentric' :
            chakraViewMode === 'heliocentric' ? 'Heliocentric Order — click for Weekday' :
            chakraViewMode === 'weekdays' ? 'Weekday Order — click for Evolutionary' :
            'Evolutionary Order — click for Chaldean'
          }
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none">
            <circle cx="12" cy="4" r="2.5" />
            <path d="M12 8 C9 8 7 10 7 12 L7 16 L9.5 16 L9.5 23 L14.5 23 L14.5 16 L17 16 L17 12 C17 10 15 8 12 8Z" />
          </svg>
        </button>
        <button
          className={`monomyth-toggle${showMonomyth ? ' active' : ''}${showCycles ? ' cycles' : ''}${showMeteorSteel ? ' steel' : ''}`}
          onClick={() => { onToggleMonomyth && onToggleMonomyth(); }}
          title={showMeteorSteel ? 'Meteor steel — click for monomyth' : showMonomyth ? 'Monomyth — click for meteor steel' : 'Show monomyth journey ring'}
          style={showCycles && !showMeteorSteel ? { color: '#6ecf8a' } : undefined}
        >
          {showMeteorSteel ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none">
              {/* Main flame tongue */}
              <path d="M1 1 L10 12 L6.5 10.5 Z" opacity="0.55" />
              {/* Second flame tongue */}
              <path d="M4.5 0 L11 11 L8.5 12.5 Z" opacity="0.75" />
              {/* Meteor body */}
              <circle cx="15" cy="15" r="5.5" />
              {/* Swoosh arc around body */}
              <path d="M9.5 19 C11.5 22.5 18.5 22.5 21.5 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3 L14 6 L10 6 Z" fill="currentColor" stroke="none" />
            </svg>
          )}
        </button>

        <button
          className={`starlight-toggle${showFallenStarlight ? ' active' : ''}${showStoryOfStories ? ' stories' : ''}${!hasFallenStarlight && !hasStoryOfStories ? ' disabled' : ''}`}
          onClick={() => {
            if (!showFallenStarlight && !showStoryOfStories) {
              // Entering starlight mode — gate on fallen-starlight
              if (!hasFallenStarlight) { setStarlightGateId('fallen-starlight'); return; }
            } else if (showFallenStarlight) {
              // In Fallen Starlight — switching to Story of Stories
              if (!hasStoryOfStories) { setStarlightGateId('story-of-stories'); return; }
            }
            // In Story of Stories — going back to Fallen Starlight (already purchased), or purchases satisfied
            onToggleStarlight && onToggleStarlight();
          }}
          title={!hasFallenStarlight && !hasStoryOfStories ? 'Unlock Fallen Starlight' : showStoryOfStories ? 'Story of Stories \u2014 click for Fallen Starlight' : showFallenStarlight ? 'Fallen Starlight \u2014 click for Story of Stories' : 'Show Fallen Starlight'}
        >
          {showStoryOfStories ? (
            /* Open book with golden circle on cover */
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {/* Open book shape — left page */}
              <path d="M2 3 C2 3 5 2 12 4 L12 21 C5 19 2 20 2 20 Z" />
              {/* Open book shape — right page */}
              <path d="M22 3 C22 3 19 2 12 4 L12 21 C19 19 22 20 22 20 Z" />
              {/* Golden circle on left page */}
              <circle cx="7" cy="11" r="3.5" stroke="rgba(232, 192, 128, 0.9)" strokeWidth="1.8" fill="none" />
            </svg>
          ) : showFallenStarlight ? (
            /* Open book with star on cover */
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {/* Open book shape — left page */}
              <path d="M2 3 C2 3 5 2 12 4 L12 21 C5 19 2 20 2 20 Z" />
              {/* Open book shape — right page */}
              <path d="M22 3 C22 3 19 2 12 4 L12 21 C19 19 22 20 22 20 Z" />
              {/* Star on left page */}
              <path d="M7 7 L6.2 9.4 L3.7 9.4 L5.7 11 L5 13.4 L7 12 L9 13.4 L8.3 11 L10.3 9.4 L7.8 9.4 Z" fill="currentColor" stroke="none" />
            </svg>
          ) : (
            /* Closed book with star on cover */
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {/* Book body */}
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              {/* Star on cover */}
              <path d="M12 6 L10.8 9.2 L7.5 9.2 L10.1 11.3 L9.1 14.5 L12 12.5 L14.9 14.5 L13.9 11.3 L16.5 9.2 L13.2 9.2 Z" fill="currentColor" stroke="none" />
            </svg>
          )}
        </button>

        <span style={{ position: 'relative' }}>
          <button
            className={`medicine-wheel-toggle${showMedicineWheel ? ' active' : ''}${!hasMedicineWheel ? ' disabled' : ''}`}
            onClick={() => {
              if (!hasMedicineWheel) { setMedicineWheelGateId('medicine-wheel'); return; }
              triggerStormFlash();
              onToggleMedicineWheel && onToggleMedicineWheel();
            }}
            title={!hasMedicineWheel ? 'Unlock Medicine Wheel' : showMedicineWheel ? 'Show celestial wheels' : 'Show medicine wheel'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 L5 14 L11 14 L11 22 L19 10 L13 10 Z" />
            </svg>
          </button>
          {stormFlash && (
            <>
              <div className="storm-flash-btn-bg" />
              <img src="/storm-shield.png" alt="" className="storm-flash-btn-img" />
            </>
          )}
        </span>
      </div>
      {starlightGateId && (
        <div className="subscription-gate-overlay" onClick={() => setStarlightGateId(null)}>
          <div className="subscription-gate-popup" onClick={e => e.stopPropagation()}>
            <h3 className="subscription-gate-title">{starlightGateId === 'story-of-stories' ? 'Story of Stories' : 'Fallen Starlight'}</h3>
            <p className="subscription-gate-desc">{starlightGateId === 'story-of-stories'
              ? 'The meta-narrative \u2014 the stories that emerged from the fall of light into matter, told through the Chronosphaera.'
              : 'The original revelation \u2014 tracing the descent of celestial fire through the seven planetary metals on the Chronosphaera.'}</p>
            <div className="subscription-gate-actions">
              <button className="subscription-gate-primary" onClick={() => { navigate('/profile#purchases'); setStarlightGateId(null); }}>
                Manage Membership
              </button>
              <button className="subscription-gate-secondary" onClick={() => setStarlightGateId(null)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
      {medicineWheelGateId && (
        <div className="subscription-gate-overlay" onClick={() => setMedicineWheelGateId(null)}>
          <div className="subscription-gate-popup" onClick={e => e.stopPropagation()}>
            <h3 className="subscription-gate-title">Medicine Wheel</h3>
            <p className="subscription-gate-desc">The medicine wheel — Hyemeyohsts Storm's teachings on the sacred hoop and the four directions, overlaid on the Chronosphaera.</p>
            <div className="subscription-gate-actions">
              <button className="subscription-gate-primary" onClick={() => { navigate('/profile#purchases'); setMedicineWheelGateId(null); }}>
                Manage Membership
              </button>
              <button className="subscription-gate-secondary" onClick={() => setMedicineWheelGateId(null)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
