import React, { useMemo, useState } from 'react';
import PlanetNode from '../../components/chronosphaera/PlanetNode';
import {
  PLANET_GLYPHS,
  PLANET_COLORS,
  ASPECT_COLORS,
  ZODIAC_GLYPHS,
  PERSPECTIVE_THEMES,
} from '../../data/recursiveRules';
import {
  PLANETARY_PHYSICS,
  ORBITAL_RADII_NORM,
  getDipoleDisplayLength,
} from '../../data/planetaryPhysics';
import { SIGNS, lonToSiderealSign } from '../../astrology/recursiveEngine';

const SIZE = 700;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Zodiac annulus radii (unchanged from original)
const OUTER_R = 310;
const ANNULUS_MID = 285;
const ANNULUS_W = 40;
const INNER_R = ANNULUS_MID - ANNULUS_W / 2;
const SIGN_R = ANNULUS_MID;

// Metals lookup for PlanetNode
const BODY_METALS = {};
Object.entries(PLANETARY_PHYSICS).forEach(([k, v]) => { BODY_METALS[k] = v.metal; });

/** Convert ecliptic longitude to SVG x,y at a given radius. 0 Aries = top. */
function lonToXY(lon, radius) {
  const angle = ((lon - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

/** Resolve the observer body key from the perspective string. */
function getObserverKey(perspective) {
  if (perspective === 'geocentric' || perspective === 'reading') return 'Earth';
  if (perspective === 'heliocentric') return 'Sun';
  if (perspective === 'Moon') return 'Earth'; // Moon orbits Earth
  return perspective;
}

/** SVG defs: glow filters per planet, EM gradients, clip paths. */
function ChartDefs() {
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Earth'];
  return (
    <defs>
      {planets.map(p => (
        <filter key={p} id={`rc-glow-${p}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
      {/* Reuse glow filters for PlanetNode (it expects id="glow-{planet}") */}
      {planets.map(p => (
        <filter key={`pn-${p}`} id={`glow-${p}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
      <radialGradient id="rc-center-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f0c040" stopOpacity="0.15" />
        <stop offset="60%" stopColor="#f0a020" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#f08000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="rc-observer-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#c9a961" stopOpacity="0.25" />
        <stop offset="60%" stopColor="#c9a961" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#c9a961" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Gold annulus band with zodiac sign glyphs and 30 dividers. */
function ZodiacAnnulus() {
  const elements = [];

  elements.push(
    <circle key="annulus" cx={CX} cy={CY} r={ANNULUS_MID}
      fill="none" stroke="#c9a961" strokeWidth={ANNULUS_W} strokeOpacity="0.12"
    />
  );
  elements.push(
    <circle key="annulus-inner" cx={CX} cy={CY} r={INNER_R}
      fill="none" stroke="rgba(201,169,97,0.3)" strokeWidth="0.8" />
  );
  elements.push(
    <circle key="annulus-outer" cx={CX} cy={CY} r={OUTER_R}
      fill="none" stroke="rgba(201,169,97,0.3)" strokeWidth="0.8" />
  );

  for (let i = 0; i < 12; i++) {
    const startAngle = (i * 30 - 90) * (Math.PI / 180);
    const ix = CX + INNER_R * Math.cos(startAngle);
    const iy = CY + INNER_R * Math.sin(startAngle);
    const ox = CX + OUTER_R * Math.cos(startAngle);
    const oy = CY + OUTER_R * Math.sin(startAngle);

    elements.push(
      <line key={`div-${i}`}
        x1={ix} y1={iy} x2={ox} y2={oy}
        stroke="rgba(201,169,97,0.25)" strokeWidth="0.8"
      />
    );

    const midAngle = ((i * 30 + 15 - 90) * Math.PI) / 180;
    const gx = CX + SIGN_R * Math.cos(midAngle);
    const gy = CY + SIGN_R * Math.sin(midAngle);
    const glyphRot = i * 30 + 15;
    const sign = SIGNS[i];
    const pathData = ZODIAC_GLYPHS[sign];

    if (pathData) {
      elements.push(
        <g key={`glyph-${i}`}
          transform={`translate(${gx},${gy}) rotate(${glyphRot}) scale(0.75)`}
        >
          <path d={pathData}
            fill="none" stroke="rgba(201,169,97,0.55)"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
        </g>
      );
    }
  }

  return <>{elements}</>;
}

/** Dashed orbital path circles for each orbit radius tier. */
function OrbitalPaths({ visibleBodies, observerKey }) {
  const drawnRadii = new Set();
  return (
    <>
      {visibleBodies.map(name => {
        if (name === observerKey) return null;
        const r = ORBITAL_RADII_NORM[name] || 120;
        if (drawnRadii.has(r)) return null;
        drawnRadii.add(r);
        return (
          <circle
            key={`orbit-${name}`}
            className="rc-orbital-path"
            cx={CX} cy={CY} r={r}
            fill="none"
            stroke="rgba(139,157,195,0.1)"
            strokeWidth="0.5"
            strokeDasharray="4 6"
          />
        );
      })}
    </>
  );
}

/** Parker spiral — subtle Archimedean spiral from center. */
function ParkerSpiral() {
  const points = [];
  const turns = 2.5;
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * 2 * Math.PI;
    const r = t * 250;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <path
      className="rc-parker-spiral"
      d={points.join(' ')}
      fill="none"
      stroke="rgba(240,192,64,0.06)"
      strokeWidth="1"
      strokeDasharray="3 5"
    />
  );
}

/** Dipole field lines from a magnetized body (Sun and Jupiter only for visual clarity). */
function FieldLines({ bodyX, bodyY, dipoleAngle, color, strength }) {
  if (!dipoleAngle && dipoleAngle !== 0) return null;
  if (strength <= 0) return null;

  const lines = [];
  const numLines = 6;
  const angleRad = (dipoleAngle - 90) * Math.PI / 180;
  const maxReach = Math.min(30 + Math.log10(strength + 1) * 15, 80);

  for (let i = 0; i < numLines; i++) {
    const spread = ((i - (numLines - 1) / 2) / (numLines - 1)) * 1.2;
    const opacity = 0.15 - Math.abs(spread) * 0.05;

    // North pole field lines
    const nAngle = angleRad + spread;
    const nx1 = bodyX;
    const ny1 = bodyY;
    const ncx1 = bodyX + maxReach * 0.4 * Math.cos(nAngle - 0.3);
    const ncy1 = bodyY + maxReach * 0.4 * Math.sin(nAngle - 0.3);
    const ncx2 = bodyX + maxReach * 0.8 * Math.cos(nAngle);
    const ncy2 = bodyY + maxReach * 0.8 * Math.sin(nAngle);
    const nx2 = bodyX + maxReach * Math.cos(nAngle + 0.2);
    const ny2 = bodyY + maxReach * Math.sin(nAngle + 0.2);

    lines.push(
      <path
        key={`fn-${i}`}
        className="rc-field-line"
        d={`M${nx1},${ny1} C${ncx1},${ncy1} ${ncx2},${ncy2} ${nx2},${ny2}`}
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        strokeOpacity={opacity}
        strokeLinecap="round"
      />
    );

    // South pole field lines (opposite direction)
    const sAngle = angleRad + Math.PI + spread;
    const scx1 = bodyX + maxReach * 0.4 * Math.cos(sAngle + 0.3);
    const scy1 = bodyY + maxReach * 0.4 * Math.sin(sAngle + 0.3);
    const scx2 = bodyX + maxReach * 0.8 * Math.cos(sAngle);
    const scy2 = bodyY + maxReach * 0.8 * Math.sin(sAngle);
    const sx2 = bodyX + maxReach * Math.cos(sAngle - 0.2);
    const sy2 = bodyY + maxReach * Math.sin(sAngle - 0.2);

    lines.push(
      <path
        key={`fs-${i}`}
        className="rc-field-line"
        d={`M${nx1},${ny1} C${scx1},${scy1} ${scx2},${scy2} ${sx2},${sy2}`}
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        strokeOpacity={opacity}
        strokeLinecap="round"
      />
    );
  }

  return <g>{lines}</g>;
}

/** Dipole arrow rendered at a planet's position. */
function DipoleArrow({ cx, cy, dipoleAngle, strength, color }) {
  if (dipoleAngle === null || dipoleAngle === undefined) return null;
  if (strength <= 0) return null;

  const len = getDipoleDisplayLength(strength);
  if (len < 2) return null;

  const halfLen = len / 2;
  const angleRad = (dipoleAngle - 90) * Math.PI / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // Arrow line endpoints
  const x1 = cx - halfLen * dx;
  const y1 = cy - halfLen * dy;
  const x2 = cx + halfLen * dx;
  const y2 = cy + halfLen * dy;

  // Arrowhead at north end (x2, y2)
  const headLen = 4;
  const headAngle = 0.5;
  const hx1 = x2 - headLen * Math.cos(angleRad - headAngle);
  const hy1 = y2 - headLen * Math.sin(angleRad - headAngle);
  const hx2 = x2 - headLen * Math.cos(angleRad + headAngle);
  const hy2 = y2 - headLen * Math.sin(angleRad + headAngle);

  return (
    <g className="rc-dipole-arrow">
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.2" strokeOpacity="0.7"
      />
      <polygon
        points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`}
        fill={color} fillOpacity="0.7"
      />
      {/* N/S labels */}
      <text x={x2 + 5 * dx} y={y2 + 5 * dy}
        textAnchor="middle" dominantBaseline="central"
        fill={color} fillOpacity="0.6" fontSize="7" fontFamily="Cinzel, serif"
      >
        N
      </text>
      <text x={x1 - 5 * dx} y={y1 - 5 * dy}
        textAnchor="middle" dominantBaseline="central"
        fill={color} fillOpacity="0.6" fontSize="7" fontFamily="Cinzel, serif"
      >
        S
      </text>
    </g>
  );
}

/** House line overlay — 12 radiating lines from center to zodiac ring (geocentric only). */
function HouseOverlay({ houses, ascendant, midheaven }) {
  if (!houses) return null;
  const elements = [];

  // Draw house cusp lines (in Whole Sign, each house starts at a sign boundary)
  for (const h of houses) {
    const angle = ((h.startDegree - 90) * Math.PI) / 180;
    const x1 = CX + 45 * Math.cos(angle);
    const y1 = CY + 45 * Math.sin(angle);
    const x2 = CX + INNER_R * Math.cos(angle);
    const y2 = CY + INNER_R * Math.sin(angle);
    const isAngular = [1, 4, 7, 10].includes(h.house);
    elements.push(
      <line key={`house-${h.house}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isAngular ? 'rgba(201,169,97,0.35)' : 'rgba(201,169,97,0.15)'}
        strokeWidth={isAngular ? '1.2' : '0.6'}
        strokeDasharray={isAngular ? undefined : '3 4'}
      />
    );
  }

  // ASC marker on zodiac ring
  if (ascendant) {
    const ascPos = lonToXY(ascendant.longitude, OUTER_R + 12);
    elements.push(
      <text key="asc-marker" x={ascPos.x} y={ascPos.y}
        textAnchor="middle" dominantBaseline="central"
        fill="#c9a961" fillOpacity="0.8" fontSize="9" fontFamily="Cinzel, serif"
        fontWeight="bold"
      >
        ASC
      </text>
    );
  }

  // MC marker on zodiac ring
  if (midheaven) {
    const mcPos = lonToXY(midheaven.longitude, OUTER_R + 12);
    elements.push(
      <text key="mc-marker" x={mcPos.x} y={mcPos.y}
        textAnchor="middle" dominantBaseline="central"
        fill="#c9a961" fillOpacity="0.8" fontSize="9" fontFamily="Cinzel, serif"
        fontWeight="bold"
      >
        MC
      </text>
    );
  }

  return <g className="rc-house-overlay">{elements}</g>;
}

/** Lunar node markers — axis line through the diagram. */
function NodeMarkers({ lunarNodes }) {
  if (!lunarNodes) return null;

  const nnPos = lonToXY(lunarNodes.northNode.longitude, INNER_R - 15);
  const snPos = lonToXY(lunarNodes.southNode.longitude, INNER_R - 15);

  return (
    <g className="rc-node-markers">
      {/* Axis line connecting the nodes */}
      <line
        x1={nnPos.x} y1={nnPos.y} x2={snPos.x} y2={snPos.y}
        stroke="rgba(180,160,120,0.2)" strokeWidth="0.8" strokeDasharray="4 4"
      />
      {/* North Node marker */}
      <text x={nnPos.x} y={nnPos.y}
        textAnchor="middle" dominantBaseline="central"
        fill="#c9a961" fillOpacity="0.7" fontSize="11"
      >
        ☊
      </text>
      {/* South Node marker */}
      <text x={snPos.x} y={snPos.y}
        textAnchor="middle" dominantBaseline="central"
        fill="#908070" fillOpacity="0.7" fontSize="11"
      >
        ☋
      </text>
    </g>
  );
}

export default function RecursiveChartDiagram({
  positions, aspects, perspective,
  selectedPlanet, onSelectPlanet,
  hoveredPlanet, onHoverPlanet,
  emFieldVisible, fieldData, showOrbitalPaths,
  mode, natalPositions, zodiacFrame, date,
  houses, ascendant, midheaven, lunarNodes,
}) {
  const [tooltipData, setTooltipData] = useState(null);
  const observerKey = getObserverKey(perspective);

  // Normalize positions to array for plotting
  const plotData = useMemo(() => {
    if (!positions) return [];
    if (Array.isArray(positions)) {
      return positions.map(p => ({
        name: p.name,
        longitude: p.longitude,
        sign: p.sign,
        degree: p.degree,
      }));
    }
    return Object.entries(positions).map(([name, data]) => ({
      name,
      longitude: data.longitude,
      sign: data.sign,
      degree: data.degree,
    }));
  }, [positions]);

  // Build field data lookup for quick access
  const fieldMap = useMemo(() => {
    if (!fieldData) return {};
    const map = {};
    fieldData.forEach(f => { map[f.body] = f; });
    return map;
  }, [fieldData]);

  // Center label
  const centerLabel = useMemo(() => {
    if (perspective === 'geocentric') return 'Geocentric';
    if (perspective === 'heliocentric') return 'Heliocentric';
    if (perspective === 'reading') return 'Full Reading';
    const theme = PERSPECTIVE_THEMES[perspective];
    return theme ? `${perspective}-Centric` : perspective;
  }, [perspective]);

  // Compute orrery positions: each planet at (ecliptic lon angle, orbital radius)
  const orreryPositions = useMemo(() => {
    const result = {};
    plotData.forEach(p => {
      const name = p.name;
      const orbitR = ORBITAL_RADII_NORM[name] || 120;
      const { x, y } = lonToXY(p.longitude, orbitR);
      result[name] = { x, y, lon: p.longitude, orbitR };
    });
    return result;
  }, [plotData]);

  // Natal ghost marker positions (personal mode only)
  const natalOrreryPositions = useMemo(() => {
    if (mode !== 'personal' || !natalPositions) return {};
    const result = {};
    const entries = Array.isArray(natalPositions)
      ? natalPositions.map(p => [p.name, p])
      : Object.entries(natalPositions);
    entries.forEach(([name, data]) => {
      const orbitR = ORBITAL_RADII_NORM[name] || 120;
      const { x, y } = lonToXY(data.longitude, orbitR);
      result[name] = { x, y, lon: data.longitude, orbitR };
    });
    return result;
  }, [mode, natalPositions]);

  // Aspect lines connecting bodies at their orrery positions
  const aspectLines = useMemo(() => {
    if (!aspects || !plotData.length) return [];

    return aspects
      .filter(a => orreryPositions[a.planet1] && orreryPositions[a.planet2])
      .map((a, i) => {
        const p1 = orreryPositions[a.planet1];
        const p2 = orreryPositions[a.planet2];
        const color = ASPECT_COLORS[a.aspect] || 'rgba(139,157,195,0.3)';
        const maxOrb = 8;
        const opacity = 0.15 + 0.55 * (1 - Math.min(a.orb, maxOrb) / maxOrb);
        const isHighlighted = selectedPlanet && (a.planet1 === selectedPlanet || a.planet2 === selectedPlanet);
        return (
          <line
            key={`aspect-${i}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke={color}
            strokeWidth={isHighlighted ? '1.5' : '1'}
            strokeOpacity={isHighlighted ? Math.min(opacity + 0.2, 0.9) : opacity}
          />
        );
      });
  }, [aspects, plotData, selectedPlanet, orreryPositions]);

  // List of all visible body names (for orbital paths)
  const visibleBodies = useMemo(() => plotData.map(p => p.name), [plotData]);

  // Hover handler
  const handleHover = (name) => {
    onHoverPlanet(name);
    if (name) {
      const pos = orreryPositions[name];
      const p = plotData.find(d => d.name === name);
      if (pos && p) {
        let displaySign = p.sign;
        let displayDegree = p.degree;
        if (zodiacFrame === 'sidereal' && date && p.longitude != null) {
          const sid = lonToSiderealSign(p.longitude, date);
          displaySign = sid.sign;
          displayDegree = sid.degree;
        }
        setTooltipData({ name, sign: displaySign, degree: displayDegree, x: pos.x, y: pos.y });
      }
    } else {
      setTooltipData(null);
    }
  };

  // Observer body color
  const observerColor = PLANET_COLORS[observerKey] || '#c9a961';

  return (
    <div className="recursive-diagram">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}
        onClick={() => { onSelectPlanet(null); }}
      >
        <ChartDefs />

        {/* Center glow — enhanced for observer */}
        <circle cx={CX} cy={CY} r={80} fill="url(#rc-center-glow)" />
        <circle cx={CX} cy={CY} r={40} fill="url(#rc-observer-halo)" />

        {/* Gold annulus with zodiac — fixed reference frame */}
        <ZodiacAnnulus />

        {/* House lines — geocentric only, personal mode with birth time */}
        {(perspective === 'geocentric' || perspective === 'reading') && houses && (
          <HouseOverlay houses={houses} ascendant={ascendant} midheaven={midheaven} />
        )}

        {/* Lunar node markers */}
        {lunarNodes && <NodeMarkers lunarNodes={lunarNodes} />}

        {/* Dashed orbital path circles */}
        {showOrbitalPaths !== false && (
          <OrbitalPaths visibleBodies={visibleBodies} observerKey={observerKey} />
        )}

        {/* Parker spiral (when EM on) */}
        {emFieldVisible && <ParkerSpiral />}

        {/* Aspect lines at orbital positions */}
        {aspectLines}

        {/* EM field lines (when EM on) — Sun and Jupiter only */}
        {emFieldVisible && fieldData && fieldData
          .filter(f => f.fieldStrength > 0)
          .map(f => {
            const pos = f.body === observerKey
              ? { x: CX, y: CY }
              : orreryPositions[f.body];
            if (!pos) return null;
            return (
              <FieldLines
                key={`fl-${f.body}`}
                bodyX={pos.x}
                bodyY={pos.y}
                dipoleAngle={f.dipoleAngle}
                color={PLANET_COLORS[f.body] || '#888'}
                strength={f.fieldStrength}
              />
            );
          })}

        {/* Orbiting planets — PlanetNode at orrery positions */}
        {plotData.map(p => {
          const pos = orreryPositions[p.name];
          if (!pos) return null;
          return (
            <g
              key={p.name}
              className="rc-planet-group"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            >
              <PlanetNode
                planet={p.name}
                metal={BODY_METALS[p.name] || ''}
                cx={0}
                cy={0}
                selected={selectedPlanet === p.name}
                hovered={hoveredPlanet === p.name}
                onClick={(e) => { e?.stopPropagation?.(); onSelectPlanet(p.name); }}
                onMouseEnter={() => handleHover(p.name)}
                onMouseLeave={() => handleHover(null)}
              />
              {/* Dipole arrow on this body (when EM on) */}
              {emFieldVisible && fieldMap[p.name] && (
                <DipoleArrow
                  cx={0}
                  cy={0}
                  dipoleAngle={fieldMap[p.name].dipoleAngle}
                  strength={fieldMap[p.name].fieldStrength}
                  color={PLANET_COLORS[p.name] || '#888'}
                />
              )}
            </g>
          );
        })}

        {/* Natal ghost markers — connector lines from natal to transit position */}
        {mode === 'personal' && natalPositions && plotData.map(p => {
          const natalPos = natalOrreryPositions[p.name];
          const transitPos = orreryPositions[p.name];
          if (!natalPos || !transitPos) return null;
          return (
            <line
              key={`natal-conn-${p.name}`}
              className="rc-natal-connector"
              x1={natalPos.x} y1={natalPos.y}
              x2={transitPos.x} y2={transitPos.y}
              stroke={PLANET_COLORS[p.name] || '#888'}
              strokeWidth="0.8"
              strokeOpacity="0.2"
              strokeDasharray="2 4"
            />
          );
        })}

        {/* Natal ghost markers — smaller, dimmer circles at natal positions */}
        {mode === 'personal' && natalPositions && Object.entries(natalOrreryPositions).map(([name, pos]) => {
          const color = PLANET_COLORS[name] || '#888';
          return (
            <g key={`natal-ghost-${name}`} className="rc-natal-ghost">
              <circle
                cx={pos.x} cy={pos.y} r={5}
                fill={color} fillOpacity="0.15"
                stroke={color} strokeOpacity="0.3"
                strokeWidth="0.8" strokeDasharray="2 2"
              />
              <text
                x={pos.x} y={pos.y + 0.5}
                textAnchor="middle" dominantBaseline="central"
                fill={color} fillOpacity="0.4"
                fontSize="6" fontFamily="Cinzel, serif"
              >
                {PLANET_GLYPHS[name] || name[0]}
              </text>
            </g>
          );
        })}

        {/* Observer body at center (larger, with glow) */}
        <g className="rc-observer-group">
          <PlanetNode
            planet={observerKey}
            metal={BODY_METALS[observerKey] || ''}
            cx={CX}
            cy={CY}
            selected={selectedPlanet === observerKey}
            hovered={hoveredPlanet === observerKey}
            onClick={(e) => { e?.stopPropagation?.(); onSelectPlanet(observerKey); }}
            onMouseEnter={() => handleHover(observerKey)}
            onMouseLeave={() => handleHover(null)}
          />
          {/* Dipole arrow on observer body (when EM on) */}
          {emFieldVisible && fieldMap[observerKey] && (
            <DipoleArrow
              cx={CX}
              cy={CY}
              dipoleAngle={fieldMap[observerKey].dipoleAngle}
              strength={fieldMap[observerKey].fieldStrength}
              color={observerColor}
            />
          )}
        </g>

        {/* Center label */}
        <text className="recursive-center-label" x={CX} y={CY + 32}>
          {centerLabel}
        </text>
      </svg>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="rc-tooltip"
          style={{
            left: `${(tooltipData.x / SIZE) * 100}%`,
            top: `${(tooltipData.y / SIZE) * 100 - 8}%`,
          }}
        >
          <span className="rc-tooltip-name">{tooltipData.name}</span>
          <span className="rc-tooltip-pos">
            {tooltipData.degree?.toFixed(1)}&deg; {tooltipData.sign}
          </span>
        </div>
      )}
    </div>
  );
}
