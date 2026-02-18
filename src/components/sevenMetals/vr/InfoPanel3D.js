import React from 'react';
import { Html } from '@react-three/drei';

/**
 * 3D info panel that lies flat below the orbital plane.
 * In Phone AR, look down to read selected planet/zodiac/cardinal info.
 */
export default function InfoPanel3D({ visible, children }) {
  if (!visible) return null;

  return (
    <group position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <Html
        center
        transform
        distanceFactor={8}
        style={{
          width: '340px',
          maxHeight: '500px',
          overflow: 'auto',
          background: 'rgba(12, 10, 16, 0.94)',
          border: '1px solid rgba(201, 169, 97, 0.35)',
          borderRadius: '12px',
          padding: '16px 18px',
          color: 'rgba(220, 210, 190, 0.9)',
          fontFamily: 'Crimson Pro, serif',
          fontSize: '13px',
          lineHeight: '1.5',
          pointerEvents: 'auto',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(201, 169, 97, 0.08)',
        }}
        occlude={false}
      >
        {children}
      </Html>
    </group>
  );
}
