import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PLANET_COLORS } from './constants3D';
import SunCorona3D from './SunCorona3D';
import MoonPhase3D from './MoonPhase3D';
import SaturnRings3D from './SaturnRings3D';
import * as THREE from 'three';

// Surface detail meshes per planet
function PlanetSurface({ planet, radius }) {
  switch (planet) {
    case 'Mercury':
      return (
        <group>
          {/* Craters */}
          <mesh position={[-radius * 0.3, radius * 0.3, radius * 0.7]} rotation={[0.3, 0, 0]}>
            <circleGeometry args={[radius * 0.12, 12]} />
            <meshBasicMaterial color="#8a9aa0" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[radius * 0.4, -radius * 0.2, radius * 0.6]} rotation={[-0.2, 0.3, 0]}>
            <circleGeometry args={[radius * 0.1, 12]} />
            <meshBasicMaterial color="#8a9aa0" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );

    case 'Venus':
      return (
        <group>
          {/* Cloud bands */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, radius * 0.15, 0]}>
            <torusGeometry args={[radius * 0.85, radius * 0.06, 8, 24]} />
            <meshBasicMaterial color="#f0d0a0" transparent opacity={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -radius * 0.2, 0]}>
            <torusGeometry args={[radius * 0.78, radius * 0.05, 8, 24]} />
            <meshBasicMaterial color="#f0d0a0" transparent opacity={0.25} />
          </mesh>
        </group>
      );

    case 'Mars':
      return (
        <group>
          {/* Polar ice cap */}
          <mesh position={[0, radius * 0.88, 0]}>
            <sphereGeometry args={[radius * 0.35, 12, 6, 0, Math.PI * 2, 0, Math.PI / 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
          {/* Dark surface marking */}
          <mesh position={[radius * 0.1, -radius * 0.1, radius * 0.7]}>
            <circleGeometry args={[radius * 0.25, 12]} />
            <meshBasicMaterial color="#501414" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );

    case 'Jupiter':
      return (
        <group>
          {/* Horizontal bands as torus rings */}
          {[-0.4, 0, 0.35].map((y, i) => (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, radius * y, 0]}>
              <torusGeometry args={[radius * (0.9 - Math.abs(y) * 0.2), radius * 0.08, 8, 24]} />
              <meshBasicMaterial color={i === 1 ? '#786450' : '#a08c6e'} transparent opacity={0.35} />
            </mesh>
          ))}
          {/* Great Red Spot */}
          <mesh position={[radius * 0.5, -radius * 0.15, radius * 0.6]} rotation={[0, 0.5, 0]}>
            <circleGeometry args={[radius * 0.18, 12]} />
            <meshBasicMaterial color="#c8643c" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}

export default function Planet3D({ planet, position, size, selected, onClick, moonPhase }) {
  const color = PLANET_COLORS[planet] || '#aaa';
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Pulsing glow for selected
  useFrame((state) => {
    if (glowRef.current && selected) {
      const t = state.clock.elapsedTime;
      const scale = 1.3 + 0.15 * Math.sin(t * Math.PI);
      glowRef.current.scale.setScalar(scale);
      glowRef.current.material.opacity = 0.15 + 0.1 * Math.sin(t * Math.PI);
    }
  });

  const isSun = planet === 'Sun';
  const isMoon = planet === 'Moon';
  const isSaturn = planet === 'Saturn';

  return (
    <group position={position}>
      {/* Selection glow ring */}
      {selected && (
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.6, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Sun corona renders behind sphere */}
      {isSun && <SunCorona3D radius={size} />}

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        {isSun ? (
          <meshBasicMaterial color={color} />
        ) : (
          <meshStandardMaterial
            color={color}
            emissive={hovered || selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.3 : hovered ? 0.15 : 0}
            roughness={0.8}
            metalness={0.2}
          />
        )}
      </mesh>

      {/* Planet surface details */}
      {!isSun && !isMoon && !isSaturn && <PlanetSurface planet={planet} radius={size} />}

      {/* Moon phase shadow */}
      {isMoon && <MoonPhase3D radius={size} phase={moonPhase} />}

      {/* Saturn rings */}
      {isSaturn && <SaturnRings3D radius={size} />}
    </group>
  );
}
