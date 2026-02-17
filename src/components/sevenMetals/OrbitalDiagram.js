import React from 'react';
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

const CX = 300;
const CY = 300;

export default function OrbitalDiagram({ selectedPlanet, onSelectPlanet }) {
  return (
    <svg viewBox="0 0 600 600" className="orbital-svg" role="img" aria-label="Geocentric orbital diagram of seven classical planets">
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
      </defs>

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

      {/* Earth at center */}
      <circle cx={CX} cy={CY} r="28" fill="url(#earth-glow)" />
      <circle cx={CX} cy={CY} r="12" fill="#3a7a6a" fillOpacity="0.8" stroke="#5aaa9a" strokeWidth="1.5" />
      <text x={CX} y={CY + 24} textAnchor="middle" fill="#5aaa9a" fontSize="10" fontFamily="Cinzel, serif" fontWeight="600">
        Earth
      </text>

      {/* Planet nodes */}
      {ORBITS.map(o => {
        const rad = (o.angle * Math.PI) / 180;
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
  );
}
