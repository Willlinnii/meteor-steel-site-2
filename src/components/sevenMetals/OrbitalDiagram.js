import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Body, GeoVector, Ecliptic, MoonPhase } from 'astronomy-engine';
import PlanetNode from './PlanetNode';
import wheelData from '../../data/medicineWheels.json';
import starsNorth from '../../data/starsNorth.json';
import starsSouth from '../../data/starsSouth.json';
import constellationsData from '../../data/constellations.json';

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

function lonToSignLabel(lon) {
  const signIndex = Math.floor(lon / 30) % 12;
  const deg = Math.floor(lon % 30);
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
  { label: 'Crown',        x: 350, y: 120, color: '#9b59b6' },
  { label: 'Third Eye',    x: 350, y: 155, color: '#6a5acd' },
  { label: 'Throat',       x: 350, y: 190, color: '#4a9bd9' },
  { label: 'Heart',        x: 350, y: 245, color: '#4caf50' },
  { label: 'Solar Plexus', x: 350, y: 300, color: '#f0c040' },
  { label: 'Sacral',       x: 350, y: 355, color: '#e67e22' },
  { label: 'Root',         x: 350, y: 400, color: '#c04040' },
];

const CHAKRA_ORDERINGS = {
  chaldean:     ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'],
  heliocentric: ['Sun','Mercury','Venus','Moon','Mars','Jupiter','Saturn'],
  weekdays:     ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],
};

const CHAKRA_MODE_LABELS = {
  chaldean: 'Chaldean Order',
  heliocentric: 'Heliocentric Order',
  weekdays: 'Weekday Order',
};

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

export default function OrbitalDiagram({ tooltipData, selectedPlanet, onSelectPlanet, hoveredPlanet, selectedSign, onSelectSign, selectedCardinal, onSelectCardinal, selectedEarth, onSelectEarth, showCalendar, onToggleCalendar, selectedMonth, onSelectMonth, showMedicineWheel, onToggleMedicineWheel, selectedWheelItem, onSelectWheelItem, chakraViewMode, onToggleChakraView, videoUrl, onCloseVideo, ybrActive, ybrCurrentStopIndex, ybrStopProgress, ybrJourneySequence, onToggleYBR, ybrAutoStart }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

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
      return (
        <div className="orbital-tooltip-title">{c.name}</div>
      );
    }
    return null;
  }, [tooltip, tooltipData, constellationMap]);

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
  const wheelOpenedRef = useRef(false);

  const playThunder = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
    if (aligned || livePositions || chakraViewMode) {
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

  // When calendar mode is activated, also activate live planet positions
  useEffect(() => {
    if (showCalendar) {
      setLivePositions(true);
      setHeliocentric(false);
      setAligned(false);
    }
  }, [showCalendar]);

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

  const moonPhaseAngle = useMemo(() => MoonPhase(new Date()), []);

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

  // Cycle: earth-centered → heliocentric → live positions → aligned → earth-centered
  const cycleOrbitalMode = () => {
    if (!aligned && !livePositions && !heliocentric) {
      setHeliocentric(true);
    } else if (heliocentric) {
      setHeliocentric(false);
      setLivePositions(true);
    } else if (livePositions) {
      setLivePositions(false);
      setAligned(true);
    } else {
      setAligned(false);
    }
  };

  const cycleStarMap = () => setStarMapMode(p => p === 'none' ? 'north' : p === 'north' ? 'south' : 'none');

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

  return (
    <div className="orbital-diagram-wrapper" ref={wrapperRef}>
      <svg viewBox="0 0 700 700" className="orbital-svg" role="img" aria-label={showMedicineWheel ? "Medicine wheel diagram" : heliocentric ? "Heliocentric orbital diagram" : "Geocentric orbital diagram with zodiac"}>
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
              const fontSize = [11, 9, 9.5, 10, 9, 9, 8.5][wi] || 8.5;
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
                        <text x={px} y={py}
                          textAnchor="middle" dominantBaseline="central"
                          fill={isActive ? '#f0c040' : 'rgba(220, 190, 120, 0.8)'}
                          fontSize={fontSize} fontFamily="Cinzel, serif"
                          fontWeight={isActive ? '700' : '500'}
                          transform={rot ? `rotate(${rot}, ${px}, ${py})` : undefined}
                          style={{ transition: 'fill 0.3s' }}
                        >
                          {displayLabel}
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
                  <circle cx={nx} cy={ny} r="10"
                    fill={isNumActive ? 'rgba(218, 165, 32, 0.15)' : 'rgba(180, 140, 80, 0.06)'}
                    stroke={isNumActive ? 'rgba(218, 165, 32, 0.5)' : 'rgba(180, 140, 80, 0.2)'}
                    strokeWidth="0.6" />
                  {isNumActive && (
                    <circle cx={nx} cy={ny} r="12" fill="none" stroke="rgba(218, 165, 32, 0.5)" strokeWidth="0.6">
                      <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central"
                    fill={isNumActive ? '#f0c040' : 'rgba(220, 190, 120, 0.7)'}
                    fontSize="11" fontFamily="Cinzel, serif" fontWeight={isNumActive ? '700' : '500'}
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

          {/* Arc paths for zodiac text */}
          {ZODIAC.map((z, i) => {
            // Each sign occupies 30°, counter-clockwise from east (0°)
            // In SVG coords, CCW visually = negative angles
            const startBoundary = -(i * 30);       // boundary closer to 0°
            const endBoundary = -(i * 30 + 30);    // boundary further from 0°
            // Inset 2° from dividers so text doesn't touch lines
            const inset = 2;

            // Top half (signs 0–5): text reads along outer arc, CCW
            // Path goes from startBoundary toward endBoundary (sweep=0 = CCW in SVG)
            if (i <= 5) {
              return (
                <path
                  key={`zpath-${z.sign}`}
                  id={`zpath-${z.sign}`}
                  d={arcPath(CX, CY, ZODIAC_TEXT_R, startBoundary - inset, endBoundary + inset, 0)}
                  fill="none"
                />
              );
            }
            // Bottom half (signs 6–11): reverse path direction so text reads right-side up
            // Path goes from endBoundary toward startBoundary (sweep=1 = CW in SVG)
            return (
              <path
                key={`zpath-${z.sign}`}
                id={`zpath-${z.sign}`}
                d={arcPath(CX, CY, ZODIAC_TEXT_R, endBoundary + inset, startBoundary - inset, 1)}
                fill="none"
              />
            );
          })}
          {/* Arc paths for month text */}
          {showCalendar && MONTHS.map((m, i) => {
            const startBoundary = -(i * 30) + MONTH_OFFSET;
            const endBoundary = -(i * 30 + 30) + MONTH_OFFSET;
            const inset = 2;
            // Determine which half needs reversed text (bottom = SVG y positive)
            const midAngle = (startBoundary + endBoundary) / 2;
            const normMid = ((midAngle % 360) + 360) % 360;
            const isBottom = normMid > 0 && normMid < 180;
            if (!isBottom) {
              return (
                <path
                  key={`mpath-${m}`}
                  id={`mpath-${m}`}
                  d={arcPath(CX, CY, MONTH_TEXT_R, startBoundary - inset, endBoundary + inset, 0)}
                  fill="none"
                />
              );
            }
            return (
              <path
                key={`mpath-${m}`}
                id={`mpath-${m}`}
                d={arcPath(CX, CY, MONTH_TEXT_R, endBoundary + inset, startBoundary - inset, 1)}
                fill="none"
              />
            );
          })}
        </defs>

        {/* Month calendar ring (inside zodiac) */}
        {showCalendar && (
          <g className="month-ring" style={{ opacity: 1, transition: 'opacity 0.4s ease' }}>
            <circle cx={CX} cy={CY} r={MONTH_RING_INNER} fill="none" stroke="rgba(139, 195, 170, 0.18)" strokeWidth="0.8" />
            <circle cx={CX} cy={CY} r={MONTH_RING_OUTER} fill="none" stroke="rgba(139, 195, 170, 0.18)" strokeWidth="0.8" />
            {/* 12 divider lines */}
            {MONTHS.map((_, i) => {
              const angle = -(i * 30) + MONTH_OFFSET;
              const rad = (angle * Math.PI) / 180;
              return (
                <line
                  key={`mdiv-${i}`}
                  x1={CX + MONTH_RING_INNER * Math.cos(rad)} y1={CY + MONTH_RING_INNER * Math.sin(rad)}
                  x2={CX + MONTH_RING_OUTER * Math.cos(rad)} y2={CY + MONTH_RING_OUTER * Math.sin(rad)}
                  stroke="rgba(139, 195, 170, 0.2)"
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
                    <circle cx={hx} cy={hy} r="14" fill="none" stroke="rgba(139, 195, 170, 0.5)" strokeWidth="0.8">
                      <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    fill={isSelected ? '#5acea0' : isCurrent ? 'rgba(139, 195, 170, 0.8)' : 'rgba(139, 195, 170, 0.5)'}
                    fontSize="10"
                    fontFamily="Cinzel, serif"
                    fontWeight={isSelected ? '700' : isCurrent ? '600' : '400'}
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
          const color = isSelected ? '#f0c040' : 'rgba(201, 169, 97, 0.6)';

          // Position glyph along the arc, before the sign name in reading direction
          const glyphAngularOffset = i <= 5 ? 9 : -9;
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
                fontSize="15"
                fontFamily="Cinzel, serif"
                fontWeight={isSelected ? '700' : '500'}
                letterSpacing="0.5"
              >
                <textPath
                  href={`#zpath-${z.sign}`}
                  startOffset="60%"
                  textAnchor="middle"
                >
                  {z.sign}
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
                fill={isSelected ? '#f0c040' : 'rgba(201, 169, 97, 0.5)'}
                stroke={isSelected ? '#f0c040' : 'rgba(201, 169, 97, 0.3)'}
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
              {/* Label */}
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={isSelected ? '#f0c040' : 'rgba(201, 169, 97, 0.45)'}
                fontSize="8"
                fontFamily="Cinzel, serif"
                fontWeight={isSelected ? '700' : '400'}
                letterSpacing="0.5"
                style={{ transition: 'fill 0.3s' }}
              >
                {c.label}
              </text>
            </g>
          );
        })}

        {/* Chakra body viewer — Vitruvian figure + planets at chakra positions */}
        {chakraViewMode ? (
          <g className="chakra-body-viewer">
            {/* Vitruvian figure — Da Vinci-style with two overlapping poses */}
            <g className="vitruvian-figure">
              {/* Inscribed circle — centered on navel */}
              <circle cx={350} cy={295} r={240} fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.8" />
              {/* Inscribed square — centered on groin */}
              <rect x={120} y={100} width={460} height={460} fill="none" stroke="rgba(201,169,97,0.10)" strokeWidth="0.8" />

              {/* ══ HEAD ══ */}
              <ellipse cx={350} cy={128} rx={22} ry={28} fill="none" stroke="rgba(201,169,97,0.4)" strokeWidth="1.2" />
              {/* Hair — curly suggestion */}
              <path d="M328,120 C324,108 330,96 342,94 C348,93 352,93 358,94 C370,96 376,108 372,120" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M330,115 C328,105 335,98 345,97" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" />
              <path d="M370,115 C372,105 365,98 355,97" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" />
              {/* Eyes — minimal */}
              <line x1={340} y1={124} x2={346} y2={124} stroke="rgba(201,169,97,0.25)" strokeWidth="0.7" />
              <line x1={354} y1={124} x2={360} y2={124} stroke="rgba(201,169,97,0.25)" strokeWidth="0.7" />
              {/* Nose */}
              <line x1={350} y1={127} x2={350} y2={135} stroke="rgba(201,169,97,0.18)" strokeWidth="0.5" />
              {/* Mouth */}
              <path d="M345,140 C348,142 352,142 355,140" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.5" />

              {/* ══ NECK ══ */}
              <line x1={343} y1={156} x2={343} y2={172} stroke="rgba(201,169,97,0.3)" strokeWidth="0.9" />
              <line x1={357} y1={156} x2={357} y2={172} stroke="rgba(201,169,97,0.3)" strokeWidth="0.9" />

              {/* ══ TORSO ══ */}
              {/* Shoulder / clavicle lines */}
              <path d="M343,172 C335,174 310,180 298,186" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M357,172 C365,174 390,180 402,186" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1.1" strokeLinecap="round" />
              {/* Pectoral contours */}
              <path d="M305,195 C315,208 338,212 350,210" fill="none" stroke="rgba(201,169,97,0.2)" strokeWidth="0.7" />
              <path d="M395,195 C385,208 362,212 350,210" fill="none" stroke="rgba(201,169,97,0.2)" strokeWidth="0.7" />
              {/* Nipple dots */}
              <circle cx={325} cy={205} r="1.5" fill="rgba(201,169,97,0.2)" />
              <circle cx={375} cy={205} r="1.5" fill="rgba(201,169,97,0.2)" />
              {/* Ribcage hints */}
              <path d="M318,222 C332,227 368,227 382,222" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.6" />
              <path d="M322,236 C336,240 364,240 378,236" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.6" />
              {/* Abdominal center line */}
              <line x1={350} y1={212} x2={350} y2={340} stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" />
              {/* Navel */}
              <circle cx={350} cy={295} r={3} fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.6" />
              {/* Torso outline — left */}
              <path d="M298,186 C290,210 288,250 296,290 C302,320 310,340 318,355" fill="none" stroke="rgba(201,169,97,0.35)" strokeWidth="1" strokeLinecap="round" />
              {/* Torso outline — right */}
              <path d="M402,186 C410,210 412,250 404,290 C398,320 390,340 382,355" fill="none" stroke="rgba(201,169,97,0.35)" strokeWidth="1" strokeLinecap="round" />
              {/* Waist indentation */}
              <path d="M302,280 C318,276 340,275 350,275" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.5" />
              <path d="M398,280 C382,276 360,275 350,275" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.5" />
              {/* Hip bones */}
              <path d="M312,340 C325,348 340,352 350,353" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" />
              <path d="M388,340 C375,348 360,352 350,353" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" />

              {/* ══ PRIMARY POSE — LEFT ARM (square pose) ══ */}
              {/* Deltoid cap */}
              <path d="M298,179 C291,175 285,179 284,185 C283,191 287,196 296,198" fill="none" stroke="rgba(201,169,97,0.35)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Anterior contour (top of arm) — shoulder to wrist */}
              <path d="M298,179 C275,182 255,185 237,188 C218,190 195,192 170,194 C152,195 142,196 132,196" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1" strokeLinecap="round" />
              {/* Posterior contour (bottom of arm) — armpit to wrist */}
              <path d="M296,198 C275,201 255,204 237,205 C218,206 195,207 170,206 C152,206 142,205 132,204" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1" strokeLinecap="round" />
              {/* Elbow crease */}
              <path d="M237,188 C236,193 236,200 237,205" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.5" />
              {/* Bicep contour */}
              <path d="M290,184 C275,188 262,191 250,193" fill="none" stroke="rgba(201,169,97,0.1)" strokeWidth="0.5" />
              {/* Left hand — palm outline */}
              <path d="M132,196 C126,195 120,196 118,200 C120,204 126,205 132,204" fill="none" stroke="rgba(201,169,97,0.3)" strokeWidth="0.8" strokeLinecap="round" />
              {/* Fingers */}
              <path d="M118,196 L106,191" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M118,198 L104,196" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M118,200 L103,200" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M118,202 L105,206" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M119,204 L112,210" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.6" strokeLinecap="round" />

              {/* ══ PRIMARY POSE — RIGHT ARM (square pose) ══ */}
              {/* Deltoid cap */}
              <path d="M402,179 C409,175 415,179 416,185 C417,191 413,196 404,198" fill="none" stroke="rgba(201,169,97,0.35)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Anterior contour */}
              <path d="M402,179 C425,182 445,185 463,188 C482,190 505,192 530,194 C548,195 558,196 568,196" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1" strokeLinecap="round" />
              {/* Posterior contour */}
              <path d="M404,198 C425,201 445,204 463,205 C482,206 505,207 530,206 C548,206 558,205 568,204" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1" strokeLinecap="round" />
              {/* Elbow crease */}
              <path d="M463,188 C464,193 464,200 463,205" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.5" />
              {/* Bicep contour */}
              <path d="M410,184 C425,188 438,191 450,193" fill="none" stroke="rgba(201,169,97,0.1)" strokeWidth="0.5" />
              {/* Right hand — palm outline */}
              <path d="M568,196 C574,195 580,196 582,200 C580,204 574,205 568,204" fill="none" stroke="rgba(201,169,97,0.3)" strokeWidth="0.8" strokeLinecap="round" />
              {/* Fingers */}
              <path d="M582,196 L594,191" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M582,198 L596,196" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M582,200 L597,200" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M582,202 L595,206" fill="none" stroke="rgba(201,169,97,0.28)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M581,204 L588,210" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.6" strokeLinecap="round" />

              {/* ══ SECONDARY POSE — LEFT ARM RAISED ══ */}
              {/* Upper contour (above arm) */}
              <path d="M297,176 C272,164 250,154 232,147 C212,140 192,134 172,130 C158,127 148,126 140,125" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Lower contour (below arm) */}
              <path d="M293,190 C270,178 250,168 232,161 C212,154 192,148 172,144 C158,141 148,140 140,139" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Raised palm */}
              <path d="M140,125 C136,124 132,126 131,131 C132,136 136,138 140,139" fill="none" stroke="rgba(201,169,97,0.18)" strokeWidth="0.7" strokeLinecap="round" />
              {/* Raised fingers */}
              <path d="M131,126 L121,120" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M131,128 L119,124" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M131,131 L118,130" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M131,134 L121,137" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />

              {/* ══ SECONDARY POSE — RIGHT ARM RAISED ══ */}
              {/* Upper contour */}
              <path d="M403,176 C428,164 450,154 468,147 C488,140 508,134 528,130 C542,127 552,126 560,125" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Lower contour */}
              <path d="M407,190 C430,178 450,168 468,161 C488,154 508,148 528,144 C542,141 552,140 560,139" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Raised palm */}
              <path d="M560,125 C564,124 568,126 569,131 C568,136 564,138 560,139" fill="none" stroke="rgba(201,169,97,0.18)" strokeWidth="0.7" strokeLinecap="round" />
              {/* Raised fingers */}
              <path d="M569,126 L579,120" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M569,128 L581,124" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M569,131 L582,130" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />
              <path d="M569,134 L579,137" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" strokeLinecap="round" />

              {/* ══ PRIMARY POSE — LEFT LEG (square pose, together) ══ */}
              {/* Lateral (outer) contour — hip to ankle with calf shape */}
              <path d="M318,358 C314,378 312,405 314,435 C316,452 317,464 316,478 C317,492 321,512 326,532 C330,546 332,553 334,558" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1" strokeLinecap="round" />
              {/* Medial (inner) contour */}
              <path d="M340,358 C342,378 344,405 344,435 C344,452 343,464 343,478 C343,492 343,512 343,532 C343,546 343,553 343,558" fill="none" stroke="rgba(201,169,97,0.35)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Kneecap */}
              <path d="M316,470 C318,466 322,464 328,464 C334,464 340,466 343,470" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.5" />
              {/* Calf muscle bulge */}
              <path d="M318,488 C319,498 322,508 326,516" fill="none" stroke="rgba(201,169,97,0.1)" strokeWidth="0.5" />
              {/* Left foot */}
              <path d="M334,558 C330,560 323,562 318,564 C322,566 332,567 341,566 C343,565 344,562 343,558" fill="none" stroke="rgba(201,169,97,0.3)" strokeWidth="0.8" strokeLinecap="round" />

              {/* ══ PRIMARY POSE — RIGHT LEG (square pose, together) ══ */}
              {/* Lateral (outer) contour */}
              <path d="M382,358 C386,378 388,405 386,435 C384,452 383,464 384,478 C383,492 379,512 374,532 C370,546 368,553 366,558" fill="none" stroke="rgba(201,169,97,0.38)" strokeWidth="1" strokeLinecap="round" />
              {/* Medial (inner) contour */}
              <path d="M360,358 C358,378 356,405 356,435 C356,452 357,464 357,478 C357,492 357,512 357,532 C357,546 357,553 357,558" fill="none" stroke="rgba(201,169,97,0.35)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Kneecap */}
              <path d="M384,470 C382,466 378,464 372,464 C366,464 360,466 357,470" fill="none" stroke="rgba(201,169,97,0.12)" strokeWidth="0.5" />
              {/* Calf muscle bulge */}
              <path d="M382,488 C381,498 378,508 374,516" fill="none" stroke="rgba(201,169,97,0.1)" strokeWidth="0.5" />
              {/* Right foot */}
              <path d="M366,558 C370,560 377,562 382,564 C378,566 368,567 359,566 C357,565 356,562 357,558" fill="none" stroke="rgba(201,169,97,0.3)" strokeWidth="0.8" strokeLinecap="round" />

              {/* ══ SECONDARY POSE — LEFT LEG SPREAD ══ */}
              {/* Lateral (outer) contour */}
              <path d="M315,358 C298,392 278,430 260,468 C248,494 240,514 232,534 C228,542 225,548 223,552" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Medial (inner) contour */}
              <path d="M338,362 C322,394 304,430 287,466 C276,490 268,510 261,530 C258,538 255,544 253,548" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Left spread foot */}
              <path d="M223,552 C218,554 212,558 210,561 C215,564 224,564 234,562 C242,559 250,554 253,548" fill="none" stroke="rgba(201,169,97,0.16)" strokeWidth="0.7" strokeLinecap="round" />

              {/* ══ SECONDARY POSE — RIGHT LEG SPREAD ══ */}
              {/* Lateral (outer) contour */}
              <path d="M385,358 C402,392 422,430 440,468 C452,494 460,514 468,534 C472,542 475,548 477,552" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Medial (inner) contour */}
              <path d="M362,362 C378,394 396,430 413,466 C424,490 432,510 439,530 C442,538 445,544 447,548" fill="none" stroke="rgba(201,169,97,0.22)" strokeWidth="0.9" strokeLinecap="round" />
              {/* Right spread foot */}
              <path d="M477,552 C482,554 488,558 490,561 C485,564 476,564 466,562 C458,559 450,554 447,548" fill="none" stroke="rgba(201,169,97,0.16)" strokeWidth="0.7" strokeLinecap="round" />

              {/* Hip / groin area */}
              <path d="M318,358 C330,362 345,363 350,363 C355,363 370,362 382,358" fill="none" stroke="rgba(201,169,97,0.15)" strokeWidth="0.6" />
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

            {/* Mode label */}
            <text x={CX} y={620} textAnchor="middle" fill="rgba(155,89,182,0.6)" fontSize="11" fontFamily="Cinzel, serif" fontWeight="500" letterSpacing="1">
              {CHAKRA_MODE_LABELS[chakraViewMode]}
            </text>
          </g>
        ) : (
          <>
        {/* Orbital rings */}
        {(heliocentric ? HELIO_ORBITS : ORBITS).map(o => (
          <circle
            key={o.planet}
            cx={CX} cy={CY} r={o.r}
            fill="none"
            stroke="rgba(139, 157, 195, 0.12)"
            strokeWidth="0.8"
            strokeDasharray="4 3"
          />
        ))}
        {/* Moon orbit around Earth in heliocentric mode */}
        {heliocentric && (() => {
          const earthAngle = orbitAngles['Earth'] || 0;
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

        {starMapMode === 'south' && (
          <g className="star-layer star-layer-south" opacity={hoveredConstellation ? 0.15 : 1}>
            {starPositionsSouth.map((s, i) => (
              twinkleSouth.has(i)
                ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" className="star-twinkle" style={{ '--star-base-o': s.o, animationDelay: `${(i * 2.3) % 14}s`, animationDuration: `${12 + (i * 1.1) % 5}s` }} />
                : <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" opacity={s.o} />
            ))}
          </g>
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
          const sunAngle = aligned ? ALIGN_ANGLE : liveAngles ? liveAngles['Sun'].svgAngle : orbitAngles['Sun'];
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

        {/* North star layer — rendered before planets so planets receive clicks */}
        {starMapMode === 'north' && (
          <g className="star-layer star-layer-north" opacity={hoveredConstellation ? 0.15 : 1}>
            {starPositionsNorth.map((s, i) => (
              twinkleNorth.has(i)
                ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" className="star-twinkle" style={{ '--star-base-o': s.o, animationDelay: `${(i * 2.3) % 14}s`, animationDuration: `${12 + (i * 1.1) % 5}s` }} />
                : <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8e0d0" opacity={s.o} />
            ))}
          </g>
        )}

        {/* Constellation highlight: lines + bright stars */}
        {hoveredConstellation && starMapMode !== 'none' && constellationMap[hoveredConstellation] && (
          <g className="constellation-highlight">
            {constellationMap[hoveredConstellation].lines
              .filter(l => starMapMode === 'north' ? (l.dec1 >= 0 && l.dec2 >= 0) : (l.dec1 < 0 && l.dec2 < 0))
              .map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="rgba(232, 224, 208, 0.4)" strokeWidth="0.8" />
            ))}
            {(starMapMode === 'north'
              ? constellationMap[hoveredConstellation].northStars.map(i => ({ ...starPositionsNorth[i], i }))
              : constellationMap[hoveredConstellation].southStars.map(i => ({ ...starPositionsSouth[i], i }))
            ).map(s => (
              <circle key={s.i} cx={s.x} cy={s.y} r={s.r * 1.8}
                fill="#e8e0d0" opacity={1} />
            ))}
          </g>
        )}

        {/* Invisible hit targets for constellation star hover */}
        {starMapMode !== 'none' && (
          <g className="constellation-hit-layer"
            onMouseOver={handleConstellationOver}
            onMouseMove={handleTooltipMove}
            onMouseOut={handleConstellationOut}>
            {constellationHits.map(s => (
              <circle key={`${s.cid}-${s.idx}`} cx={s.x} cy={s.y}
                r={Math.max(s.r + 2, 5)} fill="transparent" data-cid={s.cid}
                style={{ cursor: 'pointer' }} />
            ))}
          </g>
        )}

        {/* Planet nodes — rendered last so they're on top for clicks */}
        {heliocentric ? (
          <>
            {HELIO_ORBITS.map(o => {
              const angle = orbitAngles[o.planet] || 0;
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
                    const moonAngle = orbitAngles['Moon-helio'] || 0;
                    const mRad = (moonAngle * Math.PI) / 180;
                    const mx = px + HELIO_MOON.r * Math.cos(mRad);
                    const my = py + HELIO_MOON.r * Math.sin(mRad);
                    return (
                      <g>
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
                <g style={{ transform: `translate(${px}px, ${py}px)`, transition: 'transform 0.8s ease-in-out' }}>
                  <text
                    x={0}
                    y={-18}
                    textAnchor="middle"
                    fill="rgba(201, 169, 97, 0.8)"
                    fontSize="8"
                    fontFamily="Crimson Pro, serif"
                  >
                    {lonToSignLabel(liveAngles[o.planet].lon)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

          </>
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
      <div className="orbital-btn-row">
        {!showMedicineWheel && (
          <>
            {!chakraViewMode && (
              <button
                className="orbital-mode-toggle"
                onClick={cycleOrbitalMode}
                title={aligned ? 'Aligned — click to orbit' : livePositions ? 'Live Positions — click to align' : heliocentric ? 'Heliocentric — click for live positions' : 'Earth Centered — click for heliocentric'}
              >
                {aligned ? '☍' : livePositions ? '◉' : heliocentric ? '☉' : '◎'}
              </button>
            )}
            <button
              className="calendar-toggle"
              onClick={() => onToggleCalendar && onToggleCalendar()}
              title={showCalendar ? 'Hide mythic calendar' : 'Show mythic calendar'}
            >
              {showCalendar ? '📅' : '📆'}
            </button>
            <button
              className="chakra-view-toggle"
              onClick={() => onToggleChakraView && onToggleChakraView()}
              title={
                !chakraViewMode ? 'Show chakra body viewer (Chaldean)' :
                chakraViewMode === 'chaldean' ? 'Chaldean Order — click for Heliocentric' :
                chakraViewMode === 'heliocentric' ? 'Heliocentric Order — click for Weekday' :
                'Weekday Order — click to exit'
              }
            >
              ☸
            </button>
            <button className="star-map-toggle" onClick={cycleStarMap}
              title={starMapMode === 'none' ? 'Show northern star map' :
                     starMapMode === 'north' ? 'Northern — click for southern' :
                     'Southern — click to hide'}>
              {starMapMode === 'none' ? '☆' : starMapMode === 'north' ? '★N' : '★S'}
            </button>
          </>
        )}
        <button
          className="medicine-wheel-toggle"
          onClick={() => {
            if (!showMedicineWheel && !wheelOpenedRef.current) {
              wheelOpenedRef.current = true;
              triggerStormFlash();
            }
            onToggleMedicineWheel && onToggleMedicineWheel();
          }}
          title={showMedicineWheel ? 'Show celestial wheels' : 'Show medicine wheel'}
        >
          {showMedicineWheel ? '\u2726' : '\u2727'}
        </button>
        <button
          className={`ybr-toggle${ybrActive ? ' active' : ''}`}
          onClick={() => {
            if (ybrActive) {
              startYbrIntro();
            } else {
              startYbrIntro();
              onToggleYBR && onToggleYBR();
            }
          }}
          title={ybrActive ? 'Exit Yellow Brick Road' : 'Walk the Yellow Brick Road'}
        >
          <svg viewBox="0 0 20 14" width="18" height="13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M1,4 L7,1 L19,1 L13,4 Z" />
            <path d="M1,4 L1,13 L13,13 L13,4" />
            <path d="M13,4 L19,1 L19,10 L13,13" />
            <line x1="7" y1="4" x2="7" y2="13" />
            <line x1="1" y1="8.5" x2="13" y2="8.5" />
            <line x1="4" y1="8.5" x2="4" y2="13" />
            <line x1="10" y1="4" x2="10" y2="8.5" />
          </svg>
        </button>
        <button
          className="vr-view-toggle"
          onClick={() => navigate('/metals/vr')}
          title="View in 3D"
        >
          3D
        </button>
      </div>
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
      {stormFlash && (
        <>
          <div className="storm-flash-bg" />
          <div className="storm-flash-img-wrap">
            <img src="/storm-shield.png" alt="Storm Shield" className="storm-flash-img" />
          </div>
        </>
      )}
    </div>
  );
}
