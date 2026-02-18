import React from 'react';
import { Html } from '@react-three/drei';

export default function InfoPanel3D({ position, visible, children }) {
  if (!visible) return null;

  return (
    <group position={position || [0, 3, 0]}>
      <Html
        center
        distanceFactor={12}
        style={{
          width: '320px',
          maxHeight: '400px',
          overflow: 'auto',
          background: 'rgba(12, 10, 16, 0.92)',
          border: '1px solid rgba(201, 169, 97, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          color: 'rgba(220, 210, 190, 0.9)',
          fontFamily: 'Crimson Pro, serif',
          fontSize: '14px',
          lineHeight: '1.5',
          pointerEvents: 'auto',
          backdropFilter: 'blur(8px)',
        }}
        occlude={false}
      >
        {children}
      </Html>
    </group>
  );
}
