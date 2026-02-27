import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import PlaceholderBody from './PlaceholderBody';
import useCameraMode from './useCameraMode';

function SceneContents({ is2D, activeSystem, systemColorMap, selectedPart, onSelectPart }) {
  const { CameraController } = useCameraMode(is2D);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <CameraController />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} />

      {/* Body */}
      <PlaceholderBody
        activeSystem={activeSystem}
        systemColorMap={systemColorMap}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
      />

      {/* OrbitControls only in 3D mode */}
      {!is2D && (
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          target={[0, 2, 0]}
        />
      )}
    </>
  );
}

export default function BodyScene({ is2D, activeSystem, systemColorMap, selectedPart, onSelectPart }) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelectPart(null)}
    >
      <SceneContents
        is2D={is2D}
        activeSystem={activeSystem}
        systemColorMap={systemColorMap}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
      />
    </Canvas>
  );
}
