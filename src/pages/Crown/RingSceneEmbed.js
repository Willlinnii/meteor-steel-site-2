import React, { Suspense, useState, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CrownScene from './CrownScene';

class SceneErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="crown-error">
        <p>3D view encountered a problem.</p>
        <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
      </div>
    );
    return this.props.children;
  }
}

export default function RingSceneEmbed({ birthDate, selectedPlanet, onSelectPlanet, selectedCardinal, onSelectCardinal, mode, zodiacMode, birthstoneKey, metal, form, layout }) {
  const [autoRotate, setAutoRotate] = useState(true);
  return (
    <SceneErrorBoundary>
      <Canvas camera={{ position: [0, 0, 42], fov: 60, near: 0.1, far: 200 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <CrownScene
            birthDate={birthDate}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={onSelectPlanet}
            selectedCardinal={selectedCardinal}
            onSelectCardinal={onSelectCardinal}
            mode={mode}
            zodiacMode={zodiacMode}
            birthstoneKey={birthstoneKey}
            metal={metal}
            form={form}
            layout={layout}
          />
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            onStart={() => setAutoRotate(false)}
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
