import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, useXR } from '@react-three/xr';
import OrbitalScene from './OrbitalScene';
import './CelestialScene.css';

function SceneFallback() {
  return null;
}

// Hide OrbitControls when in XR session
function ConditionalOrbitControls() {
  const isPresenting = useXR((state) => state.session != null);
  if (isPresenting) return null;
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={50}
      maxPolarAngle={Math.PI * 0.85}
      target={[0, 0, 0]}
    />
  );
}

// Scale down scene in AR so it fits in a room (~1.5m diameter)
function ARScaleWrapper({ children }) {
  const isPresenting = useXR((state) => state.session != null);
  const scale = isPresenting ? 0.08 : 1; // 15 world units * 0.08 = 1.2m radius
  const y = isPresenting ? -0.5 : 0; // lower it a bit in AR
  return (
    <group scale={[scale, scale, scale]} position={[0, y, 0]}>
      {children}
    </group>
  );
}

export default function CelestialScene({
  mode,
  selectedPlanet,
  onSelectPlanet,
  selectedSign,
  onSelectSign,
  selectedCardinal,
  onSelectCardinal,
  selectedEarth,
  onSelectEarth,
  infoPanelContent,
  xrStore,
}) {
  return (
    <div className="celestial-scene-container">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a14', 1);
        }}
      >
        <XR store={xrStore}>
          <Suspense fallback={<SceneFallback />}>
            <ARScaleWrapper>
              <OrbitalScene
                mode={mode}
                selectedPlanet={selectedPlanet}
                onSelectPlanet={onSelectPlanet}
                selectedSign={selectedSign}
                onSelectSign={onSelectSign}
                selectedCardinal={selectedCardinal}
                onSelectCardinal={onSelectCardinal}
                selectedEarth={selectedEarth}
                onSelectEarth={onSelectEarth}
                infoPanelContent={infoPanelContent}
              />
            </ARScaleWrapper>
            <ConditionalOrbitControls />
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
}
