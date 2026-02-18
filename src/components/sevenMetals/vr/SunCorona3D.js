import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SunCorona3D({ radius }) {
  const raysRef = useRef();

  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group>
      {/* Glow sphere */}
      <mesh>
        <sphereGeometry args={[radius * 1.4, 24, 24]} />
        <meshBasicMaterial color="#f0c040" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.2, 24, 24]} />
        <meshBasicMaterial color="#f0a020" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* Corona rays */}
      <group ref={raysRef}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          const inner = radius * 1.05;
          const outer = radius * 1.5;
          const spread = 0.15;

          // Create triangle for each ray
          const shape = new THREE.Shape();
          shape.moveTo(
            inner * Math.cos(angle - spread),
            inner * Math.sin(angle - spread)
          );
          shape.lineTo(
            outer * Math.cos(angle),
            outer * Math.sin(angle)
          );
          shape.lineTo(
            inner * Math.cos(angle + spread),
            inner * Math.sin(angle + spread)
          );
          shape.closePath();

          return (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial
                color="#f0c040"
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
