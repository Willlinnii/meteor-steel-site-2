import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Planet3D from './Planet3D';
import { HELIO_MOON_3D } from './constants3D';

// Moon that orbits Earth in heliocentric mode
export default function AnimatedMoonHelio({ anglesRef, moonPhaseRef, earthOrbitRadius, selected, onClick }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current || !anglesRef.current) return;
    // Earth position
    const earthAngle = anglesRef.current['Earth'] || 0;
    const ex = Math.cos(earthAngle) * earthOrbitRadius;
    const ez = Math.sin(earthAngle) * earthOrbitRadius;
    // Moon relative to Earth
    const moonAngle = anglesRef.current['Moon-helio'] || 0;
    groupRef.current.position.x = ex + Math.cos(moonAngle) * HELIO_MOON_3D.radius;
    groupRef.current.position.z = ez + Math.sin(moonAngle) * HELIO_MOON_3D.radius;
    groupRef.current.position.y = 0;
  });

  return (
    <group ref={groupRef}>
      <Planet3D
        planet="Moon"
        position={[0, 0, 0]}
        size={0.35}
        selected={selected}
        onClick={onClick}
        moonPhase={moonPhaseRef?.current || 135}
      />
    </group>
  );
}
