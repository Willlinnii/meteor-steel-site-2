import React, { useState } from 'react';
import PlanetNode from './PlanetNode';

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

export default function OrbitalDiagram({ selectedPlanet, onSelectPlanet, selectedSign, onSelectSign, selectedCardinal, onSelectCardinal, selectedEarth, onSelectEarth }) {
  const [aligned, setAligned] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 700 700" className="orbital-svg" role="img" aria-label="Geocentric orbital diagram with zodiac">
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
        </defs>

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
          const angle = aligned ? ALIGN_ANGLE : o.angle;
          const rad = (angle * Math.PI) / 180;
          const px = CX + o.r * Math.cos(rad);
          const py = CY + o.r * Math.sin(rad);
          return (
            <PlanetNode
              key={o.planet}
              planet={o.planet}
              metal={o.metal}
              cx={px}
              cy={py}
              selected={selectedPlanet === o.planet}
              onClick={() => onSelectPlanet(o.planet)}
            />
          );
        })}
      </svg>
      <button
        className="align-toggle"
        onClick={() => setAligned(!aligned)}
        title={aligned ? 'Scatter planets' : 'Align planets'}
      >
        {aligned ? '⊙' : '☍'}
      </button>
    </div>
  );
}
