import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, useXR } from '@react-three/xr';
import OrbitalScene from './OrbitalScene';
import GyroscopeCamera from './GyroscopeCamera';
import './CelestialScene.css';

function SceneFallback() {
  return null;
}

// Hide OrbitControls when in XR session or camera AR mode
function ConditionalOrbitControls({ cameraAR }) {
  const isPresenting = useXR((state) => state.session != null);
  if (isPresenting || cameraAR) return null;
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

// Scale down scene in AR so it fits in a room
function ARScaleWrapper({ children, cameraAR }) {
  const isPresenting = useXR((state) => state.session != null);
  const inAR = isPresenting || cameraAR;
  const scale = inAR ? 0.08 : 1;
  const y = inAR ? -0.5 : 0;
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
  cameraAR,
}) {
  return (
    <div className="celestial-scene-container">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={cameraAR ? { background: 'transparent' } : undefined}
        onCreated={({ gl }) => {
          if (cameraAR) {
            gl.setClearColor(0x000000, 0); // transparent
          } else {
            gl.setClearColor('#0a0a14', 1);
          }
        }}
      >
        <XR store={xrStore}>
          <Suspense fallback={<SceneFallback />}>
            <ARScaleWrapper cameraAR={cameraAR}>
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
            <ConditionalOrbitControls cameraAR={cameraAR} />
            {cameraAR && <GyroscopeCamera />}
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
}
