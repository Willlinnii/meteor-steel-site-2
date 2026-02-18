import React from 'react';
import * as THREE from 'three';

export default function SaturnRings3D({ radius }) {
  return (
    <group rotation={[0.35, 0, 0.15]}>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.3, radius * 1.55, 64]} />
        <meshStandardMaterial
          color="#c8c0a0"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.6, radius * 1.8, 64]} />
        <meshStandardMaterial
          color="#b4a88c"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
