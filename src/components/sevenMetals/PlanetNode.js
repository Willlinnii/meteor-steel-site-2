import React from 'react';

const PLANET_COLORS = {
  Moon:    '#c8d8e8',
  Mercury: '#a8b8c0',
  Venus:   '#d4956a',
  Sun:     '#f0c040',
  Mars:    '#c04040',
  Jupiter: '#8899cc',
  Saturn:  '#7a7a8a',
};

// Build moon shadow path based on phase angle (0-360°)
// 0=new(dark), 90=first quarter(right lit), 180=full(lit), 270=last quarter(left lit)
function moonShadowPath(r, phase) {
  // terminatorX: +r = shadow on right (waxing, right side lit)
  //              -r = shadow on left (waning, left side lit)
  //               0 = quarter (half lit)
  let terminatorX;
  if (phase <= 180) {
    // Waxing: 0=new(full shadow) → 90=first quarter → 180=full(no shadow)
    terminatorX = r * Math.cos((phase * Math.PI) / 180);
  } else {
    // Waning: 180=full(no shadow) → 270=last quarter → 360=new(full shadow)
    terminatorX = r * Math.cos((phase * Math.PI) / 180);
  }

  // Shadow covers the dark side of the moon
  // For waxing (0-180): shadow is on the left, terminator sweeps right→left
  // For waning (180-360): shadow is on the right, terminator sweeps left→right
  const isWaxing = phase <= 180;

  // The shadow path: one semicircular edge (always on the dark side) + one elliptical terminator edge
  // Shadow side: left for waxing, right for waning
  const shadowSweep = isWaxing ? 1 : 0; // which semicircle is the dark edge
  const termSweep = isWaxing ? (terminatorX > 0 ? 1 : 0) : (terminatorX < 0 ? 0 : 1);

  // Path: top of moon → semicircle on shadow side to bottom → terminator arc back to top
  const shadowEdgeX = isWaxing ? -r : r;

  return `M 0,${-r} A ${r},${r} 0 0,${shadowSweep} 0,${r} A ${Math.abs(terminatorX)},${r} 0 0,${termSweep} 0,${-r}`;
}

function renderPlanetDetails(planet, r, moonPhase) {
  switch (planet) {
    case 'Moon': {
      // Real-time moon phase shadow
      const phase = moonPhase != null ? moonPhase : 135; // fallback to waxing gibbous
      return (
        <path
          d={moonShadowPath(r * 0.95, phase)}
          fill="#0a0a18"
          fillOpacity="0.85"
        />
      );
    }

    case 'Mercury':
      // Small craters
      return (
        <g opacity="0.5">
          <circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.15} fill="#8a9aa0" />
          <circle cx={r * 0.25} cy={r * 0.15} r={r * 0.12} fill="#8a9aa0" />
          <circle cx={-r * 0.05} cy={r * 0.35} r={r * 0.1} fill="#8a9aa0" />
        </g>
      );

    case 'Venus':
      // Cloud swirl bands
      return (
        <g opacity="0.35">
          <ellipse cx={0} cy={-r * 0.3} rx={r * 0.7} ry={r * 0.12} fill="#f0d0a0" />
          <ellipse cx={r * 0.1} cy={r * 0.15} rx={r * 0.6} ry={r * 0.1} fill="#f0d0a0" />
          <ellipse cx={-r * 0.1} cy={r * 0.45} rx={r * 0.5} ry={r * 0.08} fill="#f0d0a0" />
        </g>
      );

    case 'Sun': {
      // Corona rays
      const rays = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45 * Math.PI) / 180;
        const inner = r * 1.05;
        const outer = r * 1.4;
        const spread = 0.15;
        const x1 = inner * Math.cos(angle - spread);
        const y1 = inner * Math.sin(angle - spread);
        const x2 = outer * Math.cos(angle);
        const y2 = outer * Math.sin(angle);
        const x3 = inner * Math.cos(angle + spread);
        const y3 = inner * Math.sin(angle + spread);
        rays.push(
          <polygon
            key={i}
            points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
            fill="#f0c040"
            opacity="0.6"
          />
        );
      }
      return <g>{rays}</g>;
    }

    case 'Mars':
      // Polar ice cap + surface feature
      return (
        <g>
          {/* White polar cap at top */}
          <path
            d={`M ${-r * 0.45},${-r * 0.65} A ${r},${r} 0 0,1 ${r * 0.45},${-r * 0.65} A ${r * 0.6},${r * 0.3} 0 0,1 ${-r * 0.45},${-r * 0.65}`}
            fill="rgba(255,255,255,0.5)"
          />
          {/* Dark surface marking */}
          <ellipse cx={r * 0.1} cy={r * 0.15} rx={r * 0.35} ry={r * 0.15} fill="rgba(80,20,20,0.3)" />
        </g>
      );

    case 'Jupiter':
      // Horizontal bands + Great Red Spot
      return (
        <g>
          <clipPath id="jupiter-clip">
            <circle cx={0} cy={0} r={r * 0.95} />
          </clipPath>
          <g clipPath="url(#jupiter-clip)">
            <rect x={-r} y={-r * 0.7} width={r * 2} height={r * 0.25} fill="rgba(160,140,110,0.35)" />
            <rect x={-r} y={-r * 0.15} width={r * 2} height={r * 0.3} fill="rgba(120,100,80,0.3)" />
            <rect x={-r} y={r * 0.45} width={r * 2} height={r * 0.25} fill="rgba(160,140,110,0.35)" />
            {/* Great Red Spot */}
            <ellipse cx={r * 0.3} cy={r * 0.25} rx={r * 0.25} ry={r * 0.15} fill="rgba(200,100,60,0.6)" />
          </g>
        </g>
      );

    case 'Saturn':
      // Ring ellipse
      return (
        <g>
          {/* Back ring (behind planet) */}
          <ellipse
            cx={0} cy={0}
            rx={r * 1.7} ry={r * 0.45}
            fill="none"
            stroke="rgba(180,170,140,0.3)"
            strokeWidth={r * 0.2}
            transform="rotate(-20)"
            strokeDasharray={`0 ${r * 1.7 * Math.PI * 0.52} ${r * 1.7 * Math.PI * 0.48}`}
          />
          {/* Planet body is rendered by the base circle */}
          {/* Front ring (in front of planet) */}
          <ellipse
            cx={0} cy={0}
            rx={r * 1.7} ry={r * 0.45}
            fill="none"
            stroke="rgba(200,190,160,0.5)"
            strokeWidth={r * 0.2}
            transform="rotate(-20)"
            strokeDasharray={`${r * 1.7 * Math.PI * 0.52} ${r * 1.7 * Math.PI * 0.48}`}
          />
        </g>
      );

    default:
      return null;
  }
}

export default function PlanetNode({ planet, metal, cx, cy, selected, onClick, moonPhase }) {
  const color = PLANET_COLORS[planet] || '#aaa';
  const r = selected ? 14 : 11;

  return (
    <g
      className="planet-node"
      onClick={onClick}
      style={{ cursor: 'pointer', transform: `translate(${cx}px, ${cy}px)`, transition: 'transform 0.8s ease-in-out' }}
    >
      {selected && (
        <circle cx={0} cy={0} r={r + 6} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values={`${r + 4};${r + 8};${r + 4}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Sun rays render behind the base circle */}
      {planet === 'Sun' && renderPlanetDetails('Sun', r)}
      <circle
        cx={0} cy={0} r={r}
        fill={color}
        fillOpacity={selected ? 0.9 : 0.7}
        stroke={color}
        strokeWidth={selected ? 2 : 1}
        filter={selected ? `url(#glow-${planet})` : undefined}
      />
      {/* Planet surface details render on top */}
      {planet !== 'Sun' && renderPlanetDetails(planet, r, moonPhase)}
      <text
        x={0} y={r + 14}
        textAnchor="middle"
        fill={selected ? color : '#a8a8b8'}
        fontSize={selected ? '11' : '10'}
        fontFamily="Cinzel, serif"
        fontWeight={selected ? '700' : '400'}
      >
        {planet}
      </text>
      <text
        x={0} y={r + 26}
        textAnchor="middle"
        fill={selected ? color : '#888'}
        fontSize="8"
        fontFamily="Crimson Pro, serif"
        opacity="0.7"
      >
        {metal}
      </text>
    </g>
  );
}
