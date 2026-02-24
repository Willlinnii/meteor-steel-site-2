import React, { useState, useMemo, useCallback } from 'react';
import { Text } from '@react-three/drei';
import { ZODIAC, ZODIAC_RADIUS, WALL_HEIGHT, ZODIAC_CONSTELLATION_MAP } from './constants3D';
import * as THREE from 'three';
import constellationsData from '../../../data/constellations.json';

// Build one 30° arc segment as a vertical cylinder wall
function WheelSegment({ index, selected, hovered, onClick, onHover, onUnhover }) {
  const geometry = useMemo(() => {
    const thetaStart = -((index + 1) * 30) * Math.PI / 180;
    return new THREE.CylinderGeometry(
      ZODIAC_RADIUS, ZODIAC_RADIUS, // radiusTop, radiusBottom (same = cylinder)
      16,                             // radial segments per 30° arc
      1,                              // height segments
      true,                           // openEnded (no caps)
      thetaStart,                     // thetaStart
      Math.PI / 6                     // thetaLength (30°)
    );
  }, [index]);

  const baseOpacity = 0.35;
  const opacity = selected ? 0.55 : hovered ? 0.45 : baseOpacity;
  const color = selected ? '#f0c040' : '#c9a961';
  const emissive = selected ? '#f0c040' : hovered ? '#c9a961' : '#c9a961';
  const emissiveIntensity = selected ? 0.4 : hovered ? 0.2 : 0.1;

  return (
    <mesh
      geometry={geometry}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onUnhover(); document.body.style.cursor = 'auto'; }}
    >
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

// Horizontal torus rings at top and bottom of the cylinder wall
function WheelEdges() {
  return (
    <group>
      <mesh position={[0, WALL_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ZODIAC_RADIUS, 0.06, 8, 128]} />
        <meshStandardMaterial color="#c9a961" emissive="#c9a961" emissiveIntensity={0.3} transparent opacity={0.6} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -WALL_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ZODIAC_RADIUS, 0.06, 8, 128]} />
        <meshStandardMaterial color="#c9a961" emissive="#c9a961" emissiveIntensity={0.3} transparent opacity={0.6} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Vertical divider planes between segments on the cylinder wall
function ZodiacDivider({ index }) {
  const angleDeg = -(index * 30);
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = ZODIAC_RADIUS * Math.cos(angleRad);
  const z = ZODIAC_RADIUS * Math.sin(angleRad);
  const lookAngle = Math.atan2(z, x);

  return (
    <mesh
      position={[x, 0, z]}
      rotation={[0, -lookAngle, 0]}
    >
      <planeGeometry args={[0.04, WALL_HEIGHT]} />
      <meshBasicMaterial color="#c9a961" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// Labels on the outer face of the cylinder wall
function ZodiacLabel({ sign, symbol, index, selected, hovered }) {
  const centerAngleDeg = -(index * 30 + 15);
  const centerAngleRad = (centerAngleDeg * Math.PI) / 180;

  const r = ZODIAC_RADIUS + 0.1;
  const x = r * Math.cos(centerAngleRad);
  const z = r * Math.sin(centerAngleRad);
  const lookAngle = Math.atan2(z, x);

  const color = selected ? '#f0c040' : hovered ? '#c9a961' : 'rgba(201, 169, 97, 0.7)';

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, -lookAngle + Math.PI / 2, 0]}
    >
      {/* Symbol */}
      <Text
        position={[0, 0.5, 0.01]}
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
        position={[0, -0.5, 0.01]}
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

// Constellation line patterns projected onto the cylinder wall
function ZodiacConstellation({ index, sign }) {
  const constellationId = ZODIAC_CONSTELLATION_MAP[sign];

  const geometry = useMemo(() => {
    if (!constellationId) return null;
    const constellation = constellationsData.find(c => c.id === constellationId);
    if (!constellation || !constellation.lines.length) return null;

    // Find bounding box of constellation coordinates
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [[lon1, lat1], [lon2, lat2]] of constellation.lines) {
      minLon = Math.min(minLon, lon1, lon2);
      maxLon = Math.max(maxLon, lon1, lon2);
      minLat = Math.min(minLat, lat1, lat2);
      maxLat = Math.max(maxLat, lat1, lat2);
    }

    const lonRange = maxLon - minLon || 1;
    const latRange = maxLat - minLat || 1;

    // Map into the 30° segment arc on the cylinder
    const segStartRad = -((index + 1) * 30) * Math.PI / 180;
    const segArc = Math.PI / 6; // 30°
    const R = ZODIAC_RADIUS - 0.05; // slightly inside wall to avoid z-fight

    // Use 80% of arc and height, centered with 10% padding each side
    const arcPad = segArc * 0.1;
    const usableArc = segArc * 0.8;
    const hPad = WALL_HEIGHT * 0.1;
    const usableH = WALL_HEIGHT * 0.8;

    const positions = [];
    for (const [[lon1, lat1], [lon2, lat2]] of constellation.lines) {
      const t1 = (lon1 - minLon) / lonRange;
      const t2 = (lon2 - minLon) / lonRange;
      const u1 = (lat1 - minLat) / latRange;
      const u2 = (lat2 - minLat) / latRange;

      const a1 = segStartRad + arcPad + t1 * usableArc;
      const a2 = segStartRad + arcPad + t2 * usableArc;
      const y1 = -WALL_HEIGHT / 2 + hPad + u1 * usableH;
      const y2 = -WALL_HEIGHT / 2 + hPad + u2 * usableH;

      positions.push(R * Math.cos(a1), y1, R * Math.sin(a1));
      positions.push(R * Math.cos(a2), y2, R * Math.sin(a2));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [index, sign, constellationId]);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#c9a961" transparent opacity={0.25} depthWrite={false} />
    </lineSegments>
  );
}

export default function ZodiacSphere({ selectedSign, onSelectSign }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleClick = useCallback((sign) => {
    onSelectSign(selectedSign === sign ? null : sign);
  }, [selectedSign, onSelectSign]);

  return (
    <group>
      {/* Edge torus rings at top and bottom */}
      <WheelEdges />

      {/* 12 vertical cylinder wall segments (clickable, hoverable) */}
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

      {/* Vertical dividers between segments */}
      {ZODIAC.map((_, i) => (
        <ZodiacDivider key={`div-${i}`} index={i} />
      ))}

      {/* Sign labels on the outer wall face */}
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

      {/* Constellation patterns on each segment */}
      {ZODIAC.map((z, i) => (
        <ZodiacConstellation key={`const-${z.sign}`} index={i} sign={z.sign} />
      ))}

      {/* Cross lines (equinox and solstice) — vertical planes */}
      <mesh>
        <planeGeometry args={[(ZODIAC_RADIUS + 2) * 2, WALL_HEIGHT]} />
        <meshBasicMaterial color="#8b9dc3" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[(ZODIAC_RADIUS + 2) * 2, WALL_HEIGHT]} />
        <meshBasicMaterial color="#8b9dc3" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
