import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ModeAwareScene from './ModeAwareScene';

function SceneFallback() {
  return null;
}

export default function InlineScene3D(props) {
  return (
    <div className="chrono-3d-container">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
        style={{ background: '#0a0a14' }}
      >
        <Suspense fallback={<SceneFallback />}>
          <ModeAwareScene {...props} />
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
