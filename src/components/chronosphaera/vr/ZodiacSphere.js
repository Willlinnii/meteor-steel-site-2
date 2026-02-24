import React, { useState, useMemo, useCallback } from 'react';
import { Text } from '@react-three/drei';
import { ZODIAC, ZODIAC_RADIUS } from './constants3D';
import * as THREE from 'three';

const BAND_WIDTH = 1.8;       // radial width of the wheel band
const BAND_THICKNESS = 0.25;  // vertical thickness
const INNER_R = ZODIAC_RADIUS - BAND_WIDTH / 2;
const OUTER_R = ZODIAC_RADIUS + BAND_WIDTH / 2;

// Build one 30° arc segment as extruded geometry (world-space, rendered at root)
function WheelSegment({ index, selected, hovered, onClick, onHover, onUnhover }) {
  const startDeg = -(index * 30);
  const endDeg = -((index + 1) * 30);

  const geometry = useMemo(() => {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const arcSegs = 16;
    const shape = new THREE.Shape();

    // Trace outer arc
    shape.moveTo(OUTER_R * Math.cos(startRad), OUTER_R * Math.sin(startRad));
    for (let i = 1; i <= arcSegs; i++) {
      const a = startRad + (endRad - startRad) * (i / arcSegs);
      shape.lineTo(OUTER_R * Math.cos(a), OUTER_R * Math.sin(a));
    }
    // Trace inner arc back
    for (let i = arcSegs; i >= 0; i--) {
      const a = startRad + (endRad - startRad) * (i / arcSegs);
      shape.lineTo(INNER_R * Math.cos(a), INNER_R * Math.sin(a));
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: BAND_THICKNESS, bevelEnabled: false });
  }, [startDeg, endDeg]);

  const baseOpacity = 0.14;
  const opacity = selected ? 0.35 : hovered ? 0.22 : baseOpacity;
  const color = selected ? '#f0c040' : '#c9a961';

  return (
    <mesh
      geometry={geometry}
      position={[0, -BAND_THICKNESS / 2, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onUnhover(); document.body.style.cursor = 'auto'; }}
    >
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        metalness={0.4}
        roughness={0.6}
      />
    </mesh>
  );
}

// Floating labels above each segment
function ZodiacLabel({ sign, symbol, index, selected, hovered }) {
  const centerAngleDeg = -(index * 30 + 15);
  const centerAngleRad = (centerAngleDeg * Math.PI) / 180;

  const x = ZODIAC_RADIUS * Math.cos(centerAngleRad);
  const z = ZODIAC_RADIUS * Math.sin(centerAngleRad);
  const lookAngle = Math.atan2(z, x);

  const color = selected ? '#f0c040' : hovered ? '#c9a961' : 'rgba(201, 169, 97, 0.7)';

  return (
    <group
      position={[x, BAND_THICKNESS / 2 + 0.05, z]}
      rotation={[0, -lookAngle + Math.PI / 2, 0]}
    >
      {/* Symbol */}
      <Text
        position={[0, 0.35, 0.01]}
        fontSize={0.75}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {symbol}
      </Text>

      {/* Sign name */}
      <Text
        position={[0, -0.3, 0.01]}
        fontSize={0.32}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {sign}
      </Text>

      {/* Selection glow ring */}
      {selected && (
        <mesh>
          <ringGeometry args={[0.7, 0.85, 24]} />
          <meshBasicMaterial color="#f0c040" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function ZodiacDivider({ index }) {
  const angleDeg = -(index * 30);
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = ZODIAC_RADIUS * Math.cos(angleRad);
  const z = ZODIAC_RADIUS * Math.sin(angleRad);
  const lookAngle = Math.atan2(z, x);

  return (
    <mesh
      position={[x, 0, z]}
      rotation={[0, -lookAngle, Math.PI / 2]}
    >
      <planeGeometry args={[BAND_THICKNESS + 0.04, BAND_WIDTH + 0.1]} />
      <meshBasicMaterial color="#c9a961" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// Visible torus outline edges
function WheelEdges() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[OUTER_R, 0.04, 8, 128]} />
        <meshStandardMaterial color="#c9a961" transparent opacity={0.4} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[INNER_R, 0.04, 8, 128]} />
        <meshStandardMaterial color="#c9a961" transparent opacity={0.4} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

export default function ZodiacSphere({ selectedSign, onSelectSign }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleClick = useCallback((sign) => {
    onSelectSign(selectedSign === sign ? null : sign);
  }, [selectedSign, onSelectSign]);

  return (
    <group>
      {/* Edge torus rings */}
      <WheelEdges />

      {/* 12 solid arc segments (clickable, hoverable) */}
      {ZODIAC.map((z, i) => (
        <WheelSegment
          key={`seg-${z.sign}`}
          index={i}
          selected={selectedSign === z.sign}
          hovered={hoveredIndex === i}
          onClick={() => handleClick(z.sign)}
          onHover={() => setHoveredIndex(i)}
          onUnhover={() => setHoveredIndex(null)}
        />
      ))}

      {/* Radial dividers between segments */}
      {ZODIAC.map((_, i) => (
        <ZodiacDivider key={`div-${i}`} index={i} />
      ))}

      {/* Floating sign labels */}
      {ZODIAC.map((z, i) => (
        <ZodiacLabel
          key={z.sign}
          sign={z.sign}
          symbol={z.symbol}
          index={i}
          selected={selectedSign === z.sign}
          hovered={hoveredIndex === i}
        />
      ))}

      {/* Cross lines (equinox and solstice) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(ZODIAC_RADIUS + 2) * 2, 0.02]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[(ZODIAC_RADIUS + 2) * 2, 0.02]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
