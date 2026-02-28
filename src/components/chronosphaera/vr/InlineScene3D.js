import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ModeAwareScene from './ModeAwareScene';

function SceneFallback() {
  return null;
}

export default function InlineScene3D({ compassHeading, ...sceneProps }) {
  const yRot = compassHeading != null ? -THREE.MathUtils.degToRad(compassHeading) : 0;

  return (
    <div className="chrono-3d-container">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
        style={{ background: '#0a0a14' }}
      >
        <Suspense fallback={<SceneFallback />}>
          <group rotation={[0, yRot, 0]}>
            <ModeAwareScene {...sceneProps} />
          </group>
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI * 0.85}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
