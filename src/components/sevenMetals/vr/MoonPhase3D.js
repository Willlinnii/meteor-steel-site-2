import React, { useMemo } from 'react';
import * as THREE from 'three';

// Moon phase shadow — renders a dark hemisphere rotated by phase angle
// phase: 0-360 (0=new/dark, 90=first quarter, 180=full, 270=last quarter)
export default function MoonPhase3D({ radius, phase = 135 }) {
  const rotY = useMemo(() => {
    // 0=new (shadow facing camera), 180=full (shadow away)
    return ((phase - 180) * Math.PI) / 180;
  }, [phase]);

  return (
    <mesh rotation={[0, rotY, 0]}>
      <sphereGeometry args={[radius * 1.005, 32, 32, 0, Math.PI]} />
      <meshBasicMaterial color="#0a0a18" transparent opacity={0.85} side={THREE.FrontSide} />
    </mesh>
  );
}
