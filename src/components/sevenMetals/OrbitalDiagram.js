import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Body, GeoVector, Ecliptic, MoonPhase } from 'astronomy-engine';
import PlanetNode from './PlanetNode';
import wheelData from '../../data/medicineWheels.json';

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

export default function OrbitalDiagram({ selectedPlanet, onSelectPlanet, selectedSign, onSelectSign, selectedCardinal, onSelectCardinal, selectedEarth, onSelectEarth, showCalendar, onToggleCalendar, selectedMonth, onSelectMonth, showMedicineWheel, onToggleMedicineWheel, selectedWheelItem, onSelectWheelItem, videoUrl, onCloseVideo }) {
  const navigate = useNavigate();
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
  const [hoveredRing, setHoveredRing] = useState(null);
  const hoveredRingRef = useRef(null);
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
    if (aligned || livePositions) {
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
  }, [aligned, livePositions, heliocentric]);

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

  return (
    <div className="orbital-diagram-wrapper">
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
            <g onClick={() => onSelectWheelItem && onSelectWheelItem(selectedWheelItem === 'meta:author' ? null : 'meta:author')} style={{ cursor: 'pointer' }}>
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
              fill="#f0c040" fillOpacity={selectedPlanet === 'Sun' ? 0.9 : 0.7}
              stroke="#f0c040" strokeWidth={selectedPlanet === 'Sun' ? 2 : 1}
              filter={selectedPlanet === 'Sun' ? 'url(#glow-Sun)' : undefined}
            />
            {selectedPlanet === 'Sun' && (
              <circle cx={CX} cy={CY} r="22" fill="none" stroke="#f0c040" strokeWidth="1" opacity="0.4">
                <animate attributeName="r" values="20;24;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <text x={CX} y={CY + 30} textAnchor="middle" fill={selectedPlanet === 'Sun' ? '#f0c040' : '#a8a8b8'}
              fontSize={selectedPlanet === 'Sun' ? '11' : '10'} fontFamily="Cinzel, serif" fontWeight={selectedPlanet === 'Sun' ? '700' : '400'}>
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
              <g style={{ cursor: 'pointer' }} onClick={() => onSelectEarth && onSelectEarth(daySelected ? null : 'day')}>
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
              <g style={{ cursor: 'pointer' }} onClick={() => onSelectEarth && onSelectEarth(nightSelected ? null : 'night')}>
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

        {/* Planet nodes */}
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
                    onClick={() => onSelectPlanet(o.planet)}
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
                onClick={() => onSelectPlanet(o.planet)}
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
        </>)}
      </svg>
      <div className="orbital-btn-row">
        {!showMedicineWheel && (
          <>
            <button
              className="orbital-mode-toggle"
              onClick={cycleOrbitalMode}
              title={aligned ? 'Aligned — click to orbit' : livePositions ? 'Live Positions — click to align' : heliocentric ? 'Heliocentric — click for live positions' : 'Earth Centered — click for heliocentric'}
            >
              {aligned ? '☍' : livePositions ? '◉' : heliocentric ? '☉' : '◎'}
            </button>
            <button
              className="calendar-toggle"
              onClick={() => onToggleCalendar && onToggleCalendar()}
              title={showCalendar ? 'Hide mythic calendar' : 'Show mythic calendar'}
            >
              {showCalendar ? '📅' : '📆'}
            </button>
          </>
        )}
        <button
          className="medicine-wheel-toggle"
          onClick={() => onToggleMedicineWheel && onToggleMedicineWheel()}
          title={showMedicineWheel ? 'Show celestial wheels' : 'Show medicine wheel'}
        >
          {showMedicineWheel ? '\u2726' : '\u2727'}
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
    </div>
  );
}
