import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ZODIAC_RADIUS } from './constants3D';
import * as THREE from 'three';

export default function CardinalMarker3D({ id, label, angle, symbol, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef();
  const angleRad = (angle * Math.PI) / 180;
  const r = ZODIAC_RADIUS;
  const x = r * Math.cos(angleRad);
  const z = r * Math.sin(angleRad);

  // Label position (just outside zodiac ring)
  const labelR = ZODIAC_RADIUS + 1.2;
  const lx = labelR * Math.cos(angleRad);
  const lz = labelR * Math.sin(angleRad);
  const lookAngle = Math.atan2(z, x);

  const color = selected ? '#f0c040' : hovered ? '#c9a961' : '#c9a961';
  const opacity = selected ? 1 : hovered ? 0.7 : 0.5;

  // Pulse animation for selection
  useFrame((state) => {
    if (glowRef.current && selected) {
      const t = state.clock.elapsedTime;
      const s = 1.0 + 0.3 * Math.sin(t * Math.PI);
      glowRef.current.scale.setScalar(s);
      glowRef.current.material.opacity = 0.3 + 0.15 * Math.sin(t * Math.PI);
    }
  });

  return (
    <group>
      {/* Diamond marker — use two cones pointing up/down */}
      <group position={[x, 0, z]}>
        {/* Top half of diamond */}
        <mesh
          position={[0, 0.15, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <coneGeometry args={[0.2, 0.3, 4]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
        {/* Bottom half of diamond */}
        <mesh
          position={[0, -0.15, 0]}
          rotation={[Math.PI, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <coneGeometry args={[0.2, 0.3, 4]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>

        {/* Glow ring when selected */}
        {selected && (
          <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshBasicMaterial color="#f0c040" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
      </group>

      {/* Label text */}
      <group position={[lx, 0, lz]} rotation={[0, -lookAngle + Math.PI / 2, 0]}>
        {/* Invisible hit-area mesh behind text for reliable click detection */}
        <mesh
          position={[0, 0, -0.01]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <planeGeometry args={[1.8, 0.4]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Text
          fontSize={0.22}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </group>
    </group>
  );
}
