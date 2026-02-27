import React, { useMemo, useEffect, useState } from 'react';
import { Body, GeoVector, Ecliptic, MoonPhase, EclipticLongitude } from 'astronomy-engine';

/* ── Constants (from OrbitalDiagram) ──────────────────────────────── */

const CX = 350;
const CY = 350;
const ZODIAC_INNER_R = 300;
const ZODIAC_OUTER_R = 340;
const ZODIAC_TEXT_R = 320;
const CARDINAL_R = (ZODIAC_INNER_R + ZODIAC_OUTER_R) / 2;
const GEM_ORBIT_R = (ZODIAC_INNER_R + ZODIAC_OUTER_R) / 2; // midpoint of zodiac band (320)

const ZODIAC = [
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

const CARDINALS = [
  { id: 'vernal-equinox',   label: 'Vernal Equinox',   angle: 0 },
  { id: 'summer-solstice',  label: 'Summer Solstice',  angle: -90 },
  { id: 'autumnal-equinox', label: 'Autumnal Equinox', angle: 180 },
  { id: 'winter-solstice',  label: 'Winter Solstice',  angle: 90 },
];

/* Navaratna gem colors and labels per planet */
const NAVARATNA = {
  Sun:     { gem: 'Ruby',            color: '#e03050', glow: '#ff4060', facet: '#c02040' },
  Moon:    { gem: 'Pearl',           color: '#e8e0d0', glow: '#fff8f0', facet: '#d0c8b8' },
  Mars:    { gem: 'Red Coral',       color: '#d05840', glow: '#f07060', facet: '#b04030' },
  Mercury: { gem: 'Emerald',         color: '#30a060', glow: '#40d080', facet: '#208848' },
  Jupiter: { gem: 'Yellow Sapphire', color: '#d0a030', glow: '#f0c040', facet: '#b08820' },
  Venus:   { gem: 'Diamond',         color: '#d0d8e8', glow: '#f0f4ff', facet: '#b0b8c8' },
  Saturn:  { gem: 'Blue Sapphire',   color: '#3060b0', glow: '#4080e0', facet: '#204890' },
};

const HELIO_ORBITS = [
  { planet: 'Mercury' },
  { planet: 'Venus' },
  { planet: 'Earth' },
  { planet: 'Mars' },
  { planet: 'Jupiter' },
  { planet: 'Saturn' },
];

// Geocentric: all 7 classical planets orbit Earth
const GEO_PLANETS = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn'];

const HELIO_MOON_OFFSET = 20;

/* ── Gem SVG renderer ─────────────────────────────────────────────── */

function GemNode({ planet, cx, cy, selected, hovered, onClick, onMouseEnter, onMouseLeave }) {
  const info = NAVARATNA[planet];
  if (!info) return null; // Earth — no Vedic gem
  const highlighted = selected || hovered;
  const r = selected ? 13 : hovered ? 11 : 10;

  // 8-facet brilliant-cut top-down view
  const facets = [];
  for (let i = 0; i < 8; i++) {
    const a1 = (i * 45 * Math.PI) / 180;
    const a2 = ((i + 1) * 45 * Math.PI) / 180;
    const amid = ((i * 45 + 22.5) * Math.PI) / 180;
    const outerR = r;
    const innerR = r * 0.4;
    facets.push(
      <path key={i}
        d={`M0,0 L${outerR * Math.cos(a1)},${outerR * Math.sin(a1)} L${outerR * Math.cos(a2)},${outerR * Math.sin(a2)} Z`}
        fill={i % 2 === 0 ? info.color : info.facet}
        fillOpacity={highlighted ? 0.9 : 0.75}
        stroke={info.glow}
        strokeWidth="0.3"
        strokeOpacity={highlighted ? 0.6 : 0.2}
      />
    );
    // inner star facet
    facets.push(
      <line key={`f${i}`}
        x1={innerR * Math.cos(amid)} y1={innerR * Math.sin(amid)}
        x2={outerR * Math.cos(a1)} y2={outerR * Math.sin(a1)}
        stroke={info.glow} strokeWidth="0.4" strokeOpacity={highlighted ? 0.5 : 0.2} />
    );
  }

  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}>
      {/* Hit target */}
      <circle cx={cx} cy={cy} r={24} fill="transparent" />
      {/* Selection glow */}
      {selected && (
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={info.glow} strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {hovered && !selected && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={info.glow} strokeWidth="1" opacity="0.3" />
      )}
      {/* Gem body */}
      <g transform={`translate(${cx},${cy})`}>
        {/* Subtle radial glow behind */}
        <circle cx={0} cy={0} r={r + 2} fill={info.glow} fillOpacity={highlighted ? 0.2 : 0.08} />
        {/* Facets */}
        {facets}
        {/* Table (center highlight) */}
        <circle cx={0} cy={0} r={r * 0.38}
          fill={info.glow} fillOpacity={highlighted ? 0.4 : 0.2}
          stroke={info.glow} strokeWidth="0.5" strokeOpacity={highlighted ? 0.6 : 0.25} />
      </g>
      {/* Labels */}
      <text x={cx} y={cy + r + 13} textAnchor="middle"
        fill={highlighted ? info.glow : '#a8a8b8'}
        fontSize={highlighted ? '10' : '9'} fontFamily="Cinzel, serif"
        fontWeight={highlighted ? '700' : '400'}>
        {planet}
      </text>
      <text x={cx} y={cy + r + 24} textAnchor="middle"
        fill={highlighted ? info.glow : '#888'}
        fontSize="7" fontFamily="Crimson Pro, serif" opacity="0.7">
        {info.gem}
      </text>
    </g>
  );
}

/* ── Astronomy helpers ────────────────────────────────────────────── */

function getHeliocentricLongitude(planet, date) {
  if (planet === 'Earth') {
    const vec = GeoVector(Body.Sun, date, true);
    return (Ecliptic(vec).elon + 180) % 360;
  }
  return EclipticLongitude(Body[planet], date);
}

function getGeocentricLongitude(planet, date) {
  const bodyMap = { Moon: Body.Moon, Mercury: Body.Mercury, Venus: Body.Venus, Sun: Body.Sun, Mars: Body.Mars, Jupiter: Body.Jupiter, Saturn: Body.Saturn };
  const vec = GeoVector(bodyMap[planet], date, true);
  return Ecliptic(vec).elon;
}

function getLahiriAyanamsa(date) {
  const fracYear = date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365.25);
  return 23.853 + (fracYear - 2000) * 0.01397;
}

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

function arcPath(cx, cy, r, startDeg, endDeg, sweep) {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  return `M ${x1},${y1} A ${r},${r} 0 0,${sweep} ${x2},${y2}`;
}

/* ── Component ────────────────────────────────────────────────────── */

export default function RingDiagram2D({
  birthDate,
  mode = 'heliocentric',
  zodiacMode = 'tropical',
  selectedPlanet,
  onSelectPlanet,
  hoveredPlanet,
  onHoverPlanet,
  selectedSign,
  onSelectSign,
  selectedCardinal,
  onSelectCardinal,
}) {
  const heliocentric = mode === 'heliocentric';

  // Live tick counter — increments every 30s to trigger re-render for live positions
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (birthDate) return; // static when birth date set
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [birthDate]);

  const computeDate = birthDate || new Date();

  // Heliocentric planet angles (Sun-centered)
  const helioAngles = useMemo(() => {
    const angles = {};
    HELIO_ORBITS.forEach(o => {
      angles[o.planet] = -getHeliocentricLongitude(o.planet, computeDate);
    });
    // Moon: geocentric longitude relative to Earth's heliocentric position
    const moonGeoLon = getGeocentricLongitude('Moon', computeDate);
    const earthHelioLon = getHeliocentricLongitude('Earth', computeDate);
    angles['Moon-helio'] = -(moonGeoLon - earthHelioLon);
    return angles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate, tick]);

  // Geocentric planet angles (Earth-centered)
  const geoAngles = useMemo(() => {
    const angles = {};
    GEO_PLANETS.forEach(planet => {
      angles[planet] = -getGeocentricLongitude(planet, computeDate);
    });
    return angles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate, tick]);

  const moonPhaseAngle = useMemo(() => MoonPhase(computeDate), [computeDate]);

  // Sidereal rotation for zodiac band
  const zodiacRotationDeg = useMemo(() => {
    return zodiacMode === 'sidereal' ? -getLahiriAyanamsa(computeDate) : 0;
  }, [zodiacMode, computeDate]);

  return (
    <svg viewBox="0 0 700 700" width="700" height="700">
      <defs>
        <radialGradient id="sun-center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e03050" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#c02040" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#a01030" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Zodiac + cardinal group — rotated for sidereal */}
      <g transform={zodiacRotationDeg ? `rotate(${zodiacRotationDeg}, ${CX}, ${CY})` : undefined}>

        {/* Arc paths for zodiac text */}
        {ZODIAC.map((z, i) => {
          const startBoundary = -(i * 30);
          const endBoundary = -(i * 30 + 30);
          const inset = 2;
          const centerAngle = -(i * 30 + 15);
          const effectiveAngle = ((centerAngle + zodiacRotationDeg) % 360 + 360) % 360;
          const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
          if (isUpper) {
            return (
              <path key={`zpath-${z.sign}`} id={`zpath-${z.sign}`}
                d={arcPath(CX, CY, ZODIAC_TEXT_R, endBoundary + inset, startBoundary - inset, 1)}
                fill="none" />
            );
          }
          return (
            <path key={`zpath-${z.sign}`} id={`zpath-${z.sign}`}
              d={arcPath(CX, CY, ZODIAC_TEXT_R, startBoundary - inset, endBoundary + inset, 0)}
              fill="none" />
          );
        })}

        {/* Zodiac band — filled gold annulus */}
        <circle cx={CX} cy={CY} r={(ZODIAC_INNER_R + ZODIAC_OUTER_R) / 2}
          fill="none" stroke="#c9a961" strokeWidth={ZODIAC_OUTER_R - ZODIAC_INNER_R} />
        <circle cx={CX} cy={CY} r={ZODIAC_INNER_R} fill="none" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="0.8" />
        <circle cx={CX} cy={CY} r={ZODIAC_OUTER_R} fill="none" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="0.8" />

        {/* 12 divider lines between signs */}
        {ZODIAC.map((_, i) => {
          const angle = -(i * 30);
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={`div-${i}`}
              x1={CX + ZODIAC_INNER_R * Math.cos(rad)} y1={CY + ZODIAC_INNER_R * Math.sin(rad)}
              x2={CX + ZODIAC_OUTER_R * Math.cos(rad)} y2={CY + ZODIAC_OUTER_R * Math.sin(rad)}
              stroke="#000" strokeWidth="1.5" />
          );
        })}

        {/* Equinox line (horizontal) */}
        <line x1={CX - ZODIAC_OUTER_R - 8} y1={CY} x2={CX + ZODIAC_OUTER_R + 8} y2={CY}
          stroke="rgba(0, 0, 0, 0.18)" strokeWidth="0.6" />
        {/* Solstice line (vertical) */}
        <line x1={CX} y1={CY - ZODIAC_OUTER_R - 8} x2={CX} y2={CY + ZODIAC_OUTER_R + 8}
          stroke="rgba(0, 0, 0, 0.18)" strokeWidth="0.6" />

        {/* Zodiac sign labels with SVG glyph icons */}
        {ZODIAC.map((z, i) => {
          const isSelected = selectedSign === z.sign;
          const centerAngle = -(i * 30 + 15);
          const rad = (centerAngle * Math.PI) / 180;
          const hx = CX + ZODIAC_TEXT_R * Math.cos(rad);
          const hy = CY + ZODIAC_TEXT_R * Math.sin(rad);
          const color = isSelected ? '#000' : 'rgba(0, 0, 0, 0.8)';

          const effectiveAngle = ((centerAngle + zodiacRotationDeg) % 360 + 360) % 360;
          const isUpper = effectiveAngle > 180 || effectiveAngle === 0;
          const glyphAngularOffset = isUpper ? 9 : -9;
          const glyphAngleDeg = centerAngle + glyphAngularOffset;
          const gr = (glyphAngleDeg * Math.PI) / 180;
          const gx = CX + ZODIAC_TEXT_R * Math.cos(gr);
          const gy = CY + ZODIAC_TEXT_R * Math.sin(gr);
          const glyphRot = tangentRotation(glyphAngleDeg);

          return (
            <g key={z.sign}
              className={`zodiac-sign${isSelected ? ' active' : ''}`}
              onClick={() => onSelectSign && onSelectSign(isSelected ? null : z.sign)}
              style={{ cursor: 'pointer' }}>
              <circle cx={hx} cy={hy} r="24" fill="transparent" />
              <g transform={`translate(${gx},${gy}) rotate(${glyphRot}) scale(0.75)`}>
                <path d={ZODIAC_GLYPHS[z.sign]} fill="none" stroke={color}
                  strokeWidth={isSelected ? '2' : '1.6'} strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'stroke 0.3s' }} />
              </g>
              <text fill={color} fontSize="15" fontFamily="Cinzel, serif"
                fontWeight={isSelected ? '700' : '500'} letterSpacing="0.5">
                <textPath href={`#zpath-${z.sign}`} startOffset="50%" textAnchor="middle">
                  {z.sign}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Cardinal points (equinoxes & solstices) — diamond markers only, no text labels */}
        {CARDINALS.map(c => {
          const rad = (c.angle * Math.PI) / 180;
          const cx = CX + CARDINAL_R * Math.cos(rad);
          const cy = CY + CARDINAL_R * Math.sin(rad);
          const isSelected = selectedCardinal === c.id;

          return (
            <g key={c.id}
              className={`cardinal-point${isSelected ? ' active' : ''}`}
              onClick={() => onSelectCardinal && onSelectCardinal(isSelected ? null : c.id)}
              style={{ cursor: 'pointer' }}>
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
              <polygon
                points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
                fill={isSelected ? '#000' : 'rgba(0, 0, 0, 0.75)'}
                stroke={isSelected ? '#000' : 'rgba(0, 0, 0, 0.5)'}
                strokeWidth="0.8"
                style={{ transition: 'fill 0.3s, stroke 0.3s' }} />
              {isSelected && (
                <circle cx={cx} cy={cy} r="10" fill="none" stroke="#000" strokeWidth="0.8" opacity="0.5">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </g>{/* end zodiac rotated group */}

      {/* ── Center body ─────────────────────────────────────────────── */}
      {heliocentric ? (
        /* Heliocentric: Sun/Ruby at center */
        <GemNode planet="Sun" cx={CX} cy={CY}
          selected={selectedPlanet === 'Sun'} hovered={hoveredPlanet === 'Sun'}
          onClick={() => onSelectPlanet && onSelectPlanet('Sun')}
          onMouseEnter={() => onHoverPlanet && onHoverPlanet('Sun')}
          onMouseLeave={() => onHoverPlanet && onHoverPlanet(null)} />
      ) : (
        /* Geocentric: Earth at center (no Vedic gem) */
        <g style={{ cursor: 'pointer' }}
          onClick={() => onSelectPlanet && onSelectPlanet('Earth')}
          onMouseEnter={() => onHoverPlanet && onHoverPlanet('Earth')}
          onMouseLeave={() => onHoverPlanet && onHoverPlanet(null)}>
          <circle cx={CX} cy={CY} r={24} fill="transparent" />
          {selectedPlanet === 'Earth' && (
            <circle cx={CX} cy={CY} r={18} fill="none" stroke="#4a8ab0" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" values="16;20;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={CX} cy={CY} r={12}
            fill="#4a8ab0" fillOpacity={(selectedPlanet === 'Earth' || hoveredPlanet === 'Earth') ? 0.85 : 0.6}
            stroke="#4a8ab0" strokeWidth={(selectedPlanet === 'Earth' || hoveredPlanet === 'Earth') ? 1.5 : 0.8} />
          <text x={CX} y={CY + 24} textAnchor="middle"
            fill={(selectedPlanet === 'Earth' || hoveredPlanet === 'Earth') ? '#4a8ab0' : '#a8a8b8'}
            fontSize="10" fontFamily="Cinzel, serif"
            fontWeight={(selectedPlanet === 'Earth' || hoveredPlanet === 'Earth') ? '700' : '400'}>
            Earth
          </text>
        </g>
      )}

      {/* ── Orbital gems ─────────────────────────────────────────────── */}
      {heliocentric ? (
        /* Heliocentric: 6 planets on ring, Moon orbits Earth */
        HELIO_ORBITS.map(o => {
          const angle = helioAngles[o.planet] || 0;
          const rad = (angle * Math.PI) / 180;
          const px = CX + GEM_ORBIT_R * Math.cos(rad);
          const py = CY + GEM_ORBIT_R * Math.sin(rad);

          // Earth — no Vedic gem, small earth marker + Moon/Pearl orbiting it
          if (o.planet === 'Earth') {
            const earthHighlighted = selectedPlanet === 'Earth' || hoveredPlanet === 'Earth';
            const moonAngle = helioAngles['Moon-helio'] || 0;
            const mRad = (moonAngle * Math.PI) / 180;
            const mx = px + HELIO_MOON_OFFSET * Math.cos(mRad);
            const my = py + HELIO_MOON_OFFSET * Math.sin(mRad);
            return (
              <g key="Earth">
                <g style={{ cursor: 'pointer' }}
                  onClick={() => onSelectPlanet && onSelectPlanet('Earth')}
                  onMouseEnter={() => onHoverPlanet && onHoverPlanet('Earth')}
                  onMouseLeave={() => onHoverPlanet && onHoverPlanet(null)}>
                  <circle cx={px} cy={py} r={24} fill="transparent" />
                  {selectedPlanet === 'Earth' && (
                    <circle cx={px} cy={py} r={14} fill="none" stroke="#4a8ab0" strokeWidth="1" opacity="0.4">
                      <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={px} cy={py} r={earthHighlighted ? 9 : 8}
                    fill="#4a8ab0" fillOpacity={earthHighlighted ? 0.85 : 0.6}
                    stroke="#4a8ab0" strokeWidth={earthHighlighted ? 1.5 : 0.8} />
                  <text x={px} y={py + 20} textAnchor="middle"
                    fill={earthHighlighted ? '#4a8ab0' : '#a8a8b8'}
                    fontSize="9" fontFamily="Cinzel, serif" fontWeight={earthHighlighted ? '700' : '400'}>
                    Earth
                  </text>
                </g>
                <GemNode planet="Moon" cx={mx} cy={my}
                  selected={selectedPlanet === 'Moon'} hovered={hoveredPlanet === 'Moon'}
                  onClick={() => onSelectPlanet && onSelectPlanet('Moon')}
                  onMouseEnter={() => onHoverPlanet && onHoverPlanet('Moon')}
                  onMouseLeave={() => onHoverPlanet && onHoverPlanet(null)} />
              </g>
            );
          }

          return (
            <GemNode key={o.planet} planet={o.planet} cx={px} cy={py}
              selected={selectedPlanet === o.planet} hovered={hoveredPlanet === o.planet}
              onClick={() => onSelectPlanet && onSelectPlanet(o.planet)}
              onMouseEnter={() => onHoverPlanet && onHoverPlanet(o.planet)}
              onMouseLeave={() => onHoverPlanet && onHoverPlanet(null)} />
          );
        })
      ) : (
        /* Geocentric: 7 classical planets on ring (Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn) */
        GEO_PLANETS.map(planet => {
          const angle = geoAngles[planet] || 0;
          const rad = (angle * Math.PI) / 180;
          const px = CX + GEM_ORBIT_R * Math.cos(rad);
          const py = CY + GEM_ORBIT_R * Math.sin(rad);
          return (
            <GemNode key={planet} planet={planet} cx={px} cy={py}
              selected={selectedPlanet === planet} hovered={hoveredPlanet === planet}
              onClick={() => onSelectPlanet && onSelectPlanet(planet)}
              onMouseEnter={() => onHoverPlanet && onHoverPlanet(planet)}
              onMouseLeave={() => onHoverPlanet && onHoverPlanet(null)} />
          );
        })
      )}
    </svg>
  );
}
