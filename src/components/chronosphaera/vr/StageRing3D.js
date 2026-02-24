import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { STAGE_RING_RADIUS } from './constants3D';

function StageLabel({ label, index, total, selected, onClick, color, selectedColor }) {
  const [hovered, setHovered] = useState(false);
  // Distribute evenly around the ring, starting from top (-90 deg)
  const angleDeg = -(index * (360 / total)) - 90;
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = STAGE_RING_RADIUS * Math.cos(angleRad);
  const z = STAGE_RING_RADIUS * Math.sin(angleRad);

  // Face outward from center
  const lookAngle = Math.atan2(z, x);

  const baseColor = color || 'rgba(201, 169, 97, 0.6)';
  const activeColor = selectedColor || '#f0c040';
  const textColor = selected ? activeColor : hovered ? activeColor : baseColor;

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
        <planeGeometry args={[3.5, 1.8]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Label text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.4}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font={undefined}
        maxWidth={3.2}
      >
        {label}
      </Text>

      {/* Hover highlight */}
      {hovered && !selected && (
        <mesh>
          <planeGeometry args={[3.2, 1.4]} />
          <meshBasicMaterial color={activeColor} transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Selection glow */}
      {selected && (
        <mesh>
          <ringGeometry args={[0.5, 0.65, 24]} />
          <meshBasicMaterial color={activeColor} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// Ring border circles
function StageRingBorder({ color }) {
  const c = color || '#c9a961';
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[STAGE_RING_RADIUS - 0.5, STAGE_RING_RADIUS - 0.48, 128]} />
        <meshBasicMaterial color={c} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[STAGE_RING_RADIUS + 0.5, STAGE_RING_RADIUS + 0.52, 128]} />
        <meshBasicMaterial color={c} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * N floating text labels arranged in a ring.
 * Props:
 *   stages: [{ id, label }]
 *   selectedStage: string|null
 *   onSelectStage: (id) => void
 *   color: base ring/text color
 *   selectedColor: highlight color
 */
export default function StageRing3D({ stages, selectedStage, onSelectStage, color, selectedColor }) {
  return (
    <group>
      <StageRingBorder color={color} />
      {stages.map((stage, i) => (
        <StageLabel
          key={stage.id}
          label={stage.label}
          index={i}
          total={stages.length}
          selected={selectedStage === stage.id}
          onClick={() => onSelectStage(selectedStage === stage.id ? null : stage.id)}
          color={color}
          selectedColor={selectedColor}
        />
      ))}
    </group>
  );
}
