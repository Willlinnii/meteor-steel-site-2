import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ModeAwareScene from './ModeAwareScene';

function SceneFallback() {
  return null;
}

const CAMERA_DEFAULT = [0, 8, 20];
const CAMERA_MOBILE  = [0, 10, 28];
const CAMERA_MOBILE_CLOCK = [0, 12, 44];
const TARGET_DEFAULT = [0, 0, 0];
const TARGET_MOBILE_CLOCK = [0, -4, 0];
const MOBILE_BREAKPOINT = 600;

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

function CameraSetup({ clockMode }) {
  const { camera } = useThree();
  useEffect(() => {
    const mobile = isMobile();
    const pos = mobile && clockMode ? CAMERA_MOBILE_CLOCK : mobile ? CAMERA_MOBILE : CAMERA_DEFAULT;
    const tgt = mobile && clockMode ? TARGET_MOBILE_CLOCK : TARGET_DEFAULT;
    camera.position.set(...pos);
    camera.lookAt(...tgt);
    camera.updateProjectionMatrix();
  }, [camera, clockMode]);
  return null;
}

export default function InlineScene3D({ compassHeading, clockMode, ...sceneProps }) {
  const yRot = compassHeading != null ? -THREE.MathUtils.degToRad(compassHeading) : 0;
  const mobile = isMobile();
  const initialPos = mobile && clockMode ? CAMERA_MOBILE_CLOCK : mobile ? CAMERA_MOBILE : CAMERA_DEFAULT;
  const target = mobile && clockMode ? TARGET_MOBILE_CLOCK : TARGET_DEFAULT;

  return (
    <div className="chrono-3d-container">
      <Canvas
        camera={{ position: initialPos, fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
        style={{ background: '#0a0a14' }}
      >
        <CameraSetup clockMode={clockMode} />
        <Suspense fallback={<SceneFallback />}>
          <group rotation={[0, yRot, 0]}>
            <ModeAwareScene clockMode={clockMode} {...sceneProps} />
          </group>
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI * 0.85}
            target={target}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
