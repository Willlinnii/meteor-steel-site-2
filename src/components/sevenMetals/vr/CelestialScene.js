import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, useXR } from '@react-three/xr';
import OrbitalScene from './OrbitalScene';
import GyroscopeCamera from './GyroscopeCamera';
import './CelestialScene.css';

function SceneFallback() {
  return null;
}

// Dynamically update renderer clear color when AR mode changes
function ClearColorManager({ cameraAR }) {
  const { gl } = useThree();
  useEffect(() => {
    if (cameraAR) {
      gl.setClearColor(0x000000, 0); // fully transparent
    } else {
      gl.setClearColor('#0a0a14', 1); // opaque dark
    }
  }, [cameraAR, gl]);
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

// Scale down scene in AR so it fits in a room, with dynamic pinch zoom
function ARScaleWrapper({ children, cameraAR, arZoom }) {
  const isPresenting = useXR((state) => state.session != null);
  const inAR = isPresenting || cameraAR;
  const baseScale = inAR ? 0.08 : 1;
  const scale = baseScale * (inAR ? (arZoom || 1) : 1);
  const y = isPresenting ? -0.5 : 0;
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
  arZoom,
  joystickRef,
  flyToTarget,
  onFlyComplete,
  onScaleChange,
  cameraPosRef,
  anglesRef,
}) {
  const internalCamPosRef = useRef({ x: 0, y: 0, z: 0 });

  return (
    <div className="celestial-scene-container" style={cameraAR ? { background: 'transparent' } : undefined}>
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        dpr={[1, 2]}
        style={cameraAR ? { background: 'transparent' } : undefined}
      >
        <ClearColorManager cameraAR={cameraAR} />
        <XR store={xrStore}>
          <Suspense fallback={<SceneFallback />}>
            <ARScaleWrapper cameraAR={cameraAR} arZoom={arZoom}>
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
                cameraAR={cameraAR}
                anglesRef={anglesRef}
              />
            </ARScaleWrapper>
            <ConditionalOrbitControls cameraAR={cameraAR} />
            {cameraAR && (
              <GyroscopeCamera
                joystickRef={joystickRef}
                flyToTarget={flyToTarget}
                onFlyComplete={onFlyComplete}
                onScaleChange={onScaleChange}
                cameraPosRef={cameraPosRef || internalCamPosRef}
              />
            )}
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
}
