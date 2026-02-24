import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EARTH_RADIUS } from './constants3D';
import * as THREE from 'three';

export default function EarthDayNight3D({ sunAngle = 0, selectedEarth, onSelectEarth, cameraAR }) {
  const groupRef = useRef();
  const glowRef = useRef();
  const r = EARTH_RADIUS;

  // Tap detection for AR: distinguish taps from pinch gestures
  const tapStartDay = useRef(null);
  const tapStartNight = useRef(null);

  // Pulsing glow
  useFrame((state) => {
    if (glowRef.current && selectedEarth) {
      const t = state.clock.elapsedTime;
      glowRef.current.material.opacity = 0.15 + 0.1 * Math.sin(t * Math.PI);
    }
  });

  // Day hemisphere faces the sun direction, night faces away
  const sunRad = (sunAngle * Math.PI) / 180;

  const handleTap = (tapRef, side) => ({
    onPointerDown: cameraAR ? (e) => {
      e.stopPropagation();
      tapRef.current = { time: Date.now(), x: e.clientX ?? 0, y: e.clientY ?? 0 };
    } : undefined,
    onPointerUp: cameraAR ? (e) => {
      e.stopPropagation();
      if (!tapRef.current) return;
      const dt = Date.now() - tapRef.current.time;
      const dx = (e.clientX ?? 0) - tapRef.current.x;
      const dy = (e.clientY ?? 0) - tapRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      tapRef.current = null;
      if (dt < 300 && dist < 10) {
        onSelectEarth && onSelectEarth(selectedEarth === side ? null : side);
      }
    } : undefined,
    onClick: cameraAR ? undefined : (e) => { e.stopPropagation(); onSelectEarth && onSelectEarth(selectedEarth === side ? null : side); },
  });

  const dayHandlers = handleTap(tapStartDay, 'day');
  const nightHandlers = handleTap(tapStartNight, 'night');

  return (
    <group ref={groupRef}>
      {/* Selection glow */}
      {selectedEarth && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[r * 1.6, 24, 24]} />
          <meshBasicMaterial
            color={selectedEarth === 'day' ? '#7aeac0' : '#5a8a8a'}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Earth glow */}
      <mesh>
        <sphereGeometry args={[r * 1.3, 24, 24]} />
        <meshBasicMaterial color="#4a8a7a" transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {/* Day hemisphere (facing sun) */}
      <mesh
        rotation={[0, -sunRad + Math.PI / 2, 0]}
        {...dayHandlers}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[r, 24, 24, 0, Math.PI]} />
        <meshStandardMaterial
          color={selectedEarth === 'day' ? '#6aded0' : '#4a9a8a'}
          emissive={selectedEarth === 'day' ? '#3a8a6a' : '#000000'}
          emissiveIntensity={selectedEarth === 'day' ? 0.2 : 0}
          roughness={0.7}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Night hemisphere (away from sun) */}
      <mesh
        rotation={[0, -sunRad - Math.PI / 2, 0]}
        {...nightHandlers}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[r, 24, 24, 0, Math.PI]} />
        <meshStandardMaterial
          color={selectedEarth === 'night' ? '#2a4a4a' : '#152525'}
          emissive={selectedEarth === 'night' ? '#1a3a3a' : '#000000'}
          emissiveIntensity={selectedEarth === 'night' ? 0.15 : 0}
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Terminator line */}
      <mesh rotation={[0, -sunRad, Math.PI / 2]}>
        <torusGeometry args={[r * 1.001, 0.01, 8, 32]} />
        <meshBasicMaterial color="#b4dcd2" transparent opacity={0.3} />
      </mesh>

      {/* Equator outline */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.008, 8, 32]} />
        <meshBasicMaterial color="#5aaa9a" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
