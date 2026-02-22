import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Planet3D from './Planet3D';

// Wrapper that imperatively positions a Planet3D each frame using shared anglesRef
export default function AnimatedPlanet({ planet, orbitRadius, size, anglesRef, moonPhaseRef, selected, onClick, cameraAR }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current || !anglesRef.current) return;
    const angle = anglesRef.current[planet] || 0;
    groupRef.current.position.x = Math.cos(angle) * orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * orbitRadius;
    groupRef.current.position.y = 0;
  });

  const isMoon = planet === 'Moon';
  const moonPhase = isMoon ? (moonPhaseRef?.current || 135) : undefined;

  return (
    <group ref={groupRef}>
      <Planet3D
        planet={planet}
        position={[0, 0, 0]}
        size={size}
        selected={selected}
        onClick={onClick}
        moonPhase={moonPhase}
        cameraAR={cameraAR}
      />
    </group>
  );
}
