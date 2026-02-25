import React, { Suspense, useState, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DodecahedronScene from './DodecahedronScene';
import './DodecahedronPage.css';

class SceneErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dodecahedron-error">
          <p>The 3D view encountered a problem.</p>
          <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DodecahedronPage() {
  const [selected, setSelected] = useState(false);

  return (
    <div className="dodecahedron-page">
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 4, 10], fov: 60, near: 0.1, far: 200 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <DodecahedronScene
              selected={selected}
              onSelect={() => setSelected(prev => !prev)}
            />
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={3}
              maxDistance={30}
              maxPolarAngle={Math.PI * 0.85}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
