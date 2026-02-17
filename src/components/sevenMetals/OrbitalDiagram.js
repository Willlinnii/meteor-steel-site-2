import React, { useState, useMemo } from 'react';
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
  { planet: 'Moon',    metal: 'Silver',  r: 55,  angle: -90 },
  { planet: 'Mercury', metal: 'Mercury', r: 90,  angle: -40 },
  { planet: 'Venus',   metal: 'Copper',  r: 125, angle: -130 },
  { planet: 'Sun',     metal: 'Gold',    r: 160, angle: 20 },
  { planet: 'Mars',    metal: 'Iron',    r: 198, angle: -70 },
  { planet: 'Jupiter', metal: 'Tin',     r: 238, angle: 160 },
  { planet: 'Saturn',  metal: 'Lead',    r: 278, angle: 100 },
];

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
  { idx: 0, innerR: 0, outerR: 55, textR: 38 },
  { idx: 1, innerR: 55, outerR: 110, textR: 82 },
  { idx: 2, innerR: 110, outerR: 165, textR: 138 },
  { idx: 3, innerR: 165, outerR: 220, textR: 192 },
  { idx: 4, innerR: 220, outerR: 280, textR: 250 },
];
const MW_OUTER_R = 290;

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

export default function OrbitalDiagram({ selectedPlanet, onSelectPlanet, selectedSign, onSelectSign, selectedCardinal, onSelectCardinal, selectedEarth, onSelectEarth, showCalendar, onToggleCalendar, selectedMonth, onSelectMonth, showMedicineWheel, onToggleMedicineWheel, selectedWheelItem, onSelectWheelItem }) {
  const [aligned, setAligned] = useState(false);
  const [livePositions, setLivePositions] = useState(false);

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

  const toggleLive = () => {
    if (!livePositions) setAligned(false);
    setLivePositions(!livePositions);
  };

  const toggleAlign = () => {
    if (!aligned) setLivePositions(false);
    setAligned(!aligned);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 700 700" className="orbital-svg" role="img" aria-label={showMedicineWheel ? "Medicine wheel diagram" : "Geocentric orbital diagram with zodiac"}>
        {showMedicineWheel ? (
          <g className="medicine-wheel">
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
              <circle key={ring.idx} cx={CX} cy={CY} r={ring.outerR} fill="none" stroke="rgba(180, 140, 80, 0.25)" strokeWidth="0.8" />
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
              const fontSize = wi <= 2 ? 9.5 : wi === 3 ? 8 : 8.5;
              return (
                <g key={wheel.id}>
                  {wheel.positions.map(pos => {
                    const rad = (pos.angle * Math.PI) / 180;
                    const px = CX + ring.textR * Math.cos(rad);
                    const py = CY + ring.textR * Math.sin(rad);
                    const itemKey = `${wheel.id}:${pos.dir}`;
                    const isSelected = selectedWheelItem === itemKey;
                    const displayLabel = pos.num != null ? String(pos.num) : pos.label;

                    return (
                      <g key={itemKey}
                        className={`mw-position${isSelected ? ' active' : ''}`}
                        onClick={() => onSelectWheelItem && onSelectWheelItem(isSelected ? null : itemKey)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle cx={px} cy={py} r={pos.num != null ? 12 : 18} fill="transparent" />
                        {isSelected && (
                          <circle cx={px} cy={py} r="14" fill="none" stroke="rgba(218, 165, 32, 0.6)" strokeWidth="0.8">
                            <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {pos.num != null && (
                          <circle cx={px} cy={py} r="9"
                            fill={isSelected ? 'rgba(218, 165, 32, 0.15)' : 'rgba(180, 140, 80, 0.08)'}
                            stroke={isSelected ? 'rgba(218, 165, 32, 0.5)' : 'rgba(180, 140, 80, 0.25)'}
                            strokeWidth="0.6"
                          />
                        )}
                        <text x={px} y={py}
                          textAnchor="middle" dominantBaseline="central"
                          fill={isSelected ? '#f0c040' : 'rgba(220, 190, 120, 0.8)'}
                          fontSize={fontSize} fontFamily="Cinzel, serif"
                          fontWeight={isSelected ? '700' : '500'}
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

            {/* Center label */}
            <text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="central"
              fill="rgba(220, 190, 120, 0.9)" fontSize="12" fontFamily="Cinzel, serif" fontWeight="700">
              Self
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="central"
              fill="rgba(220, 190, 120, 0.4)" fontSize="7" fontFamily="Crimson Pro, serif" fontWeight="400" fontStyle="italic">
              Hyemeyohsts Storm
            </text>

            {/* Compass direction labels */}
            <text x={CX} y={CY - MW_OUTER_R - 18} textAnchor="middle"
              fill="rgba(255, 255, 255, 0.8)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">N</text>
            <text x={CX + MW_OUTER_R + 18} y={CY + 1} textAnchor="start" dominantBaseline="central"
              fill="rgba(218, 165, 32, 0.8)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">E</text>
            <text x={CX} y={CY + MW_OUTER_R + 24} textAnchor="middle"
              fill="rgba(178, 34, 34, 0.8)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">S</text>
            <text x={CX - MW_OUTER_R - 18} y={CY + 1} textAnchor="end" dominantBaseline="central"
              fill="rgba(150, 150, 150, 0.8)" fontSize="16" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">W</text>
          </g>
        ) : (<>
        <defs>
          {ORBITS.map(o => (
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

        {/* Zodiac sign labels on curved paths */}
        {ZODIAC.map((z, i) => {
          const isSelected = selectedSign === z.sign;
          // Invisible hit area for click
          const centerAngle = -(i * 30 + 15);
          const rad = (centerAngle * Math.PI) / 180;
          const hx = CX + ZODIAC_TEXT_R * Math.cos(rad);
          const hy = CY + ZODIAC_TEXT_R * Math.sin(rad);

          return (
            <g
              key={z.sign}
              className={`zodiac-sign${isSelected ? ' active' : ''}`}
              onClick={() => onSelectSign && onSelectSign(isSelected ? null : z.sign)}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible wider hit target */}
              <circle cx={hx} cy={hy} r="22" fill="transparent" />
              <text
                fill={isSelected ? '#f0c040' : 'rgba(201, 169, 97, 0.6)'}
                fontSize="13"
                fontFamily="Cinzel, serif"
                fontWeight={isSelected ? '700' : '500'}
                letterSpacing="0.5"
              >
                <textPath
                  href={`#zpath-${z.sign}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {z.symbol} {z.sign}
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
        {ORBITS.map(o => (
          <circle
            key={o.planet}
            cx={CX} cy={CY} r={o.r}
            fill="none"
            stroke="rgba(139, 157, 195, 0.12)"
            strokeWidth="0.8"
            strokeDasharray="4 3"
          />
        ))}

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

        {/* Earth at center */}
        <g
          style={{ cursor: 'pointer' }}
          onClick={() => onSelectEarth && onSelectEarth(!selectedEarth)}
        >
          <circle cx={CX} cy={CY} r="28" fill="url(#earth-glow)" />
          <circle cx={CX} cy={CY} r="12" fill={selectedEarth ? '#5acea0' : '#3a7a6a'} fillOpacity="0.8" stroke={selectedEarth ? '#7aeac0' : '#5aaa9a'} strokeWidth="1.5" />
          {selectedEarth && (
            <circle cx={CX} cy={CY} r="18" fill="none" stroke="#5acea0" strokeWidth="0.8" opacity="0.5">
              <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
          <text x={CX} y={CY + 24} textAnchor="middle" fill={selectedEarth ? '#7aeac0' : '#5aaa9a'} fontSize="10" fontFamily="Cinzel, serif" fontWeight="600">
            Earth
          </text>
        </g>

        {/* Planet nodes */}
        {ORBITS.map(o => {
          const angle = aligned ? ALIGN_ANGLE : liveAngles ? liveAngles[o.planet].svgAngle : o.angle;
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
                moonPhase={o.planet === 'Moon' ? moonPhaseAngle : undefined}
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
      {!showMedicineWheel && (
        <>
          <button
            className="live-toggle"
            onClick={toggleLive}
            title={livePositions ? 'Decorative positions' : 'Live planetary positions'}
          >
            {livePositions ? '◉' : '◎'}
          </button>
          <button
            className="align-toggle"
            onClick={toggleAlign}
            title={aligned ? 'Scatter planets' : 'Align planets'}
          >
            {aligned ? '⊙' : '☍'}
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
        {showMedicineWheel ? '✦' : '✧'}
      </button>
    </div>
  );
}
