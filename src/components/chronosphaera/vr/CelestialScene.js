import React, { Suspense, useRef, useEffect, Component } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, useXR, XROrigin, useXRControllerLocomotion } from '@react-three/xr';
import * as THREE from 'three';
import OrbitalScene from './OrbitalScene';
import GyroscopeCamera from './GyroscopeCamera';
import './CelestialScene.css';

// Error boundary: catches 3D/gyroscope crashes and shows a recovery option
class SceneErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.warn('CelestialScene crashed:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="celestial-scene-error">
          <p>The 3D view encountered a problem.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

// Compass rotation wrapper: rotates scene by device heading, disabled in AR and XR
function CompassGroup({ compassHeading, cameraAR, children }) {
  const isPresenting = useXR((state) => state.session != null);
  const yRot = (!cameraAR && !isPresenting && compassHeading != null)
    ? -THREE.MathUtils.degToRad(compassHeading) : 0;
  return <group rotation={[0, yRot, 0]}>{children}</group>;
}

// VR locomotion wrapper: thumbstick movement in VR, passthrough otherwise
function VRScene({ children }) {
  const originRef = useRef(null);
  const isPresenting = useXR((state) => state.session != null);

  // Left thumbstick = move, right thumbstick = smooth turn (only active in VR)
  useXRControllerLocomotion(
    originRef,
    isPresenting ? { speed: 1 } : false,
    isPresenting ? { type: 'smooth', speed: 1.5, deadZone: 0.15 } : false,
    'left'
  );

  const scale = isPresenting ? 0.08 : 1;
  const y = isPresenting ? -0.5 : 0;

  return (
    <XROrigin ref={originRef} scale={[scale, scale, scale]} position={[0, y, 0]}>
      {children}
    </XROrigin>
  );
}

export default function CelestialScene({
  compassHeading,
  mode,
  selectedPlanet,
  onSelectPlanet,
  selectedSign,
  onSelectSign,
  selectedCardinal,
  onSelectCardinal,
  selectedEarth,
  onSelectEarth,
  selectedStar,
  onSelectStar,
  beyondRings,
  selectedBeyondRing,
  onSelectBeyondRing,
  activePerspective,
  infoPanelContent,
  xrStore,
  cameraAR,
  arPassthrough,
  joystickRef,
  flyToTarget,
  onFlyComplete,
  cameraPosRef,
  anglesRef,
  onPanelLock,
  panelLockedRef: externalPanelLockedRef,
  orientationGranted,
  clockMode,
  zodiacMode,
  showClock,
  activeCulture,
}) {
  const internalCamPosRef = useRef({ x: 0, y: 0, z: 0 });
  const internalPanelLockedRef = useRef(false);
  const panelLockedRef = externalPanelLockedRef || internalPanelLockedRef;

  return (
    <div className={`celestial-scene-container${cameraAR ? ' ar-mode' : ''}`} style={cameraAR ? { background: 'transparent' } : undefined}>
      <SceneErrorBoundary>
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={cameraAR ? { background: 'transparent' } : undefined}
      >
        <ClearColorManager cameraAR={cameraAR} />
        <XR store={xrStore}>
          <Suspense fallback={<SceneFallback />}>
            <VRScene>
              <CompassGroup compassHeading={compassHeading} cameraAR={cameraAR}>
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
                selectedStar={selectedStar}
                onSelectStar={onSelectStar}
                beyondRings={beyondRings}
                selectedBeyondRing={selectedBeyondRing}
                onSelectBeyondRing={onSelectBeyondRing}
                activePerspective={activePerspective}
                infoPanelContent={infoPanelContent}
                cameraAR={cameraAR}
                arPassthrough={arPassthrough}
                anglesRef={anglesRef}
                panelLockedRef={panelLockedRef}
                onPanelLock={onPanelLock}
                clockMode={clockMode}
                zodiacMode={zodiacMode}
                showClock={showClock}
                activeCulture={activeCulture}
              />
              </CompassGroup>
            </VRScene>
            <ConditionalOrbitControls cameraAR={cameraAR} />
            {cameraAR && (
              <GyroscopeCamera
                joystickRef={joystickRef}
                flyToTarget={flyToTarget}
                onFlyComplete={onFlyComplete}
                cameraPosRef={cameraPosRef || internalCamPosRef}
                panelLockedRef={panelLockedRef}
                orientationGranted={orientationGranted}
              />
            )}
          </Suspense>
        </XR>
      </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
