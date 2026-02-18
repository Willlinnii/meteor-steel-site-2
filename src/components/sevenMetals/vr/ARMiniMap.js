import React from 'react';
import { ORBITS_3D, PLANET_COLORS } from './constants3D';

const MAP_SIZE = 130;
const MAP_R = MAP_SIZE / 2 - 8;
const CX = MAP_SIZE / 2;
const CY = MAP_SIZE / 2;
const MAX_ORBIT = ORBITS_3D[ORBITS_3D.length - 1].radius; // Saturn

/**
 * Mini overhead map for Phone AR — shows planet positions and camera dot.
 * Tap a planet to fly there.
 */
export default function ARMiniMap({ anglesRef, cameraPos, onFlyTo }) {
  const angles = anglesRef?.current || {};

  return (
    <div className="ar-minimap">
      <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
        {/* Background */}
        <circle cx={CX} cy={CY} r={MAP_R + 4} fill="rgba(10, 10, 20, 0.75)" stroke="rgba(201, 169, 97, 0.3)" strokeWidth="0.5" />

        {/* Orbit rings */}
        {ORBITS_3D.map(o => {
          const r = (o.radius / MAX_ORBIT) * MAP_R;
          return (
            <circle key={`ring-${o.planet}`} cx={CX} cy={CY} r={r}
              fill="none" stroke="rgba(139, 157, 195, 0.15)" strokeWidth="0.5" />
          );
        })}

        {/* Earth at center */}
        <circle cx={CX} cy={CY} r={3} fill={PLANET_COLORS.Earth} opacity={0.8}
          style={{ cursor: 'pointer' }}
          onClick={() => onFlyTo && onFlyTo({ x: 0, y: 0, z: 0 })}
        />

        {/* Planets */}
        {ORBITS_3D.map(o => {
          const angle = angles[o.planet] || 0;
          const r = (o.radius / MAX_ORBIT) * MAP_R;
          const px = CX + Math.cos(angle) * r;
          const py = CY + Math.sin(angle) * r;
          const color = PLANET_COLORS[o.planet] || '#aaa';

          // Compute world position for fly-to
          const worldX = Math.cos(angle) * o.radius;
          const worldZ = Math.sin(angle) * o.radius;

          return (
            <circle
              key={o.planet}
              cx={px} cy={py}
              r={o.planet === 'Sun' ? 4.5 : 3}
              fill={color}
              opacity={0.9}
              style={{ cursor: 'pointer' }}
              onClick={() => onFlyTo && onFlyTo({ x: worldX, y: 0, z: worldZ })}
            >
              <title>{o.planet}</title>
            </circle>
          );
        })}

        {/* Camera position */}
        {cameraPos && (() => {
          const cx = CX + (cameraPos.x / MAX_ORBIT) * MAP_R;
          const cy = CY + (cameraPos.z / MAX_ORBIT) * MAP_R;
          return (
            <>
              <circle cx={cx} cy={cy} r={2.5} fill="white" opacity={0.9} />
              <circle cx={cx} cy={cy} r={4} fill="none" stroke="white" strokeWidth="0.5" opacity={0.5}>
                <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </>
          );
        })()}

        {/* "MAP" label */}
        <text x={CX} y={MAP_SIZE - 4} textAnchor="middle" fill="rgba(201, 169, 97, 0.4)"
          fontSize="7" fontFamily="Cinzel, serif" letterSpacing="1">
          MAP
        </text>
      </svg>
    </div>
  );
}
