import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { MONTH_RING_RADIUS } from './constants3D';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function MonthLabel({ month, index, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  // 12 months, starting from top (-90 deg), going clockwise
  const angleDeg = -(index * 30 + 15) ;
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = MONTH_RING_RADIUS * Math.cos(angleRad);
  const z = MONTH_RING_RADIUS * Math.sin(angleRad);

  const lookAngle = Math.atan2(z, x);

  const color = selected ? '#8bc4e8' : hovered ? '#6aa8d0' : 'rgba(139, 196, 232, 0.5)';

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, -lookAngle + Math.PI / 2, 0]}
    >
      {/* Hit target */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[2.8, 1.4]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Month name */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.32}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {month}
      </Text>

      {/* Hover highlight */}
      {hovered && !selected && (
        <mesh>
          <planeGeometry args={[2.4, 1.0]} />
          <meshBasicMaterial color="#8bc4e8" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Selection glow */}
      {selected && (
        <mesh>
          <ringGeometry args={[0.4, 0.52, 24]} />
          <meshBasicMaterial color="#8bc4e8" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/**
 * 12 floating month labels in a ring just inside the zodiac.
 * Props:
 *   selectedMonth: string|null
 *   onSelectMonth: (month) => void
 */
export default function CalendarRing3D({ selectedMonth, onSelectMonth }) {
  return (
    <group>
      {/* Inner and outer ring borders */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[MONTH_RING_RADIUS - 0.4, MONTH_RING_RADIUS - 0.38, 128]} />
        <meshBasicMaterial color="#8bc4e8" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[MONTH_RING_RADIUS + 0.4, MONTH_RING_RADIUS + 0.42, 128]} />
        <meshBasicMaterial color="#8bc4e8" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Month labels */}
      {MONTHS.map((month, i) => (
        <MonthLabel
          key={month}
          month={month}
          index={i}
          selected={selectedMonth === month}
          onClick={() => onSelectMonth(selectedMonth === month ? null : month)}
        />
      ))}
    </group>
  );
}
