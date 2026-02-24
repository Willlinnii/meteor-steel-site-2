import React, { useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import StarfieldBackground from './StarfieldBackground';

const QUADRANT_COLORS = {
  N: new THREE.Color(1, 1, 1),       // White
  E: new THREE.Color(0.85, 0.65, 0.13), // Gold
  S: new THREE.Color(0.7, 0.13, 0.13),  // Red
  W: new THREE.Color(0.12, 0.12, 0.12), // Black
};

const QUADRANT_ANGLES = [
  { dir: 'E', startDeg: -45, endDeg: 45 },
  { dir: 'N', startDeg: -135, endDeg: -45 },
  { dir: 'W', startDeg: 135, endDeg: 225 },
  { dir: 'S', startDeg: 45, endDeg: 135 },
];

const DISC_RADIUS = 12;
const RING_RADII = [2, 4, 6, 8, 9.5, 10.5, 11.5];

function QuadrantSector({ dir, startDeg, endDeg, color }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const segments = 32;

    s.moveTo(0, 0);
    for (let i = 0; i <= segments; i++) {
      const angle = startRad + (endRad - startRad) * (i / segments);
      s.lineTo(Math.cos(angle) * DISC_RADIUS, Math.sin(angle) * DISC_RADIUS);
    }
    s.lineTo(0, 0);
    return s;
  }, [startDeg, endDeg]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ConcentricRing({ radius }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 128]} />
      <meshBasicMaterial color="#c9a961" transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CrossHairLines() {
  return (
    <group>
      {/* N-S line */}
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[DISC_RADIUS * 2.1, 0.03]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* E-W line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DISC_RADIUS * 2.1, 0.03]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WheelLabel({ label, angleDeg, radius, selected, onClick, isCenter, centerY }) {
  const [hovered, setHovered] = useState(false);

  let x, z;
  if (isCenter) {
    x = 0;
    z = centerY ? (centerY / 20) : 0; // Convert approximate px offset to world units
  } else {
    const angleRad = (angleDeg * Math.PI) / 180;
    x = radius * Math.cos(angleRad);
    z = radius * Math.sin(angleRad);
  }

  const lookAngle = isCenter ? 0 : Math.atan2(z, x);

  const color = selected ? '#f0c040' : hovered ? '#c9a961' : 'rgba(201, 169, 97, 0.55)';

  return (
    <group
      position={[x, 0.05, z]}
      rotation={[0, isCenter ? 0 : -lookAngle + Math.PI / 2, 0]}
    >
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[3.0, 1.2]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <Text
        position={[0, 0, 0.01]}
        fontSize={0.35}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
        maxWidth={2.8}
      >
        {label}
      </Text>

      {hovered && !selected && (
        <mesh>
          <planeGeometry args={[2.6, 0.9]} />
          <meshBasicMaterial color="#c9a961" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {selected && (
        <mesh>
          <ringGeometry args={[0.35, 0.48, 24]} />
          <meshBasicMaterial color="#f0c040" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

/**
 * 3D Medicine Wheel with colored disc quadrants, concentric rings, and floating labels.
 * Props:
 *   wheels: array of wheel objects from medicineWheels.json
 *   selectedWheelItem: string|null (e.g. "humanSelf:N" or "num:1" or "dir:N")
 *   onSelectWheelItem: (itemId) => void
 */
export default function MedicineWheel3D({ wheels, selectedWheelItem, onSelectWheelItem }) {
  // Place labels from all wheels at different ring radii
  const allLabels = useMemo(() => {
    if (!wheels) return [];
    const labels = [];
    wheels.forEach((wheel, wIdx) => {
      const ringR = RING_RADII[wIdx] || RING_RADII[RING_RADII.length - 1];
      wheel.positions.forEach(pos => {
        const itemId = `${wheel.id}:${pos.dir}`;
        labels.push({
          key: itemId,
          label: pos.shortLabel || pos.label,
          angleDeg: pos.angle != null ? pos.angle : 0,
          radius: ringR,
          isCenter: pos.isCenter,
          centerY: pos.centerY,
          itemId,
        });
      });
    });
    return labels;
  }, [wheels]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <StarfieldBackground />

      {/* Colored quadrants */}
      {QUADRANT_ANGLES.map(q => (
        <QuadrantSector
          key={q.dir}
          dir={q.dir}
          startDeg={q.startDeg}
          endDeg={q.endDeg}
          color={QUADRANT_COLORS[q.dir]}
        />
      ))}

      {/* Concentric rings */}
      {RING_RADII.map(r => (
        <ConcentricRing key={r} radius={r} />
      ))}

      {/* Outer border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[DISC_RADIUS - 0.03, DISC_RADIUS + 0.03, 128]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      <CrossHairLines />

      {/* Floating labels */}
      {allLabels.map(lbl => (
        <WheelLabel
          key={lbl.key}
          label={lbl.label}
          angleDeg={lbl.angleDeg}
          radius={lbl.radius}
          isCenter={lbl.isCenter}
          centerY={lbl.centerY}
          selected={selectedWheelItem === lbl.itemId}
          onClick={() => onSelectWheelItem(selectedWheelItem === lbl.itemId ? null : lbl.itemId)}
        />
      ))}
    </>
  );
}
