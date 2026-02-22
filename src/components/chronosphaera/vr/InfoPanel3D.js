import React from 'react';
import { Html } from '@react-three/drei';

/**
 * 3D info panel that lies flat below the orbital plane.
 * Tap to open the full-screen reader overlay (managed by parent).
 * Shows a compact preview of content in the 3D scene.
 */
export default function InfoPanel3D({ visible, children, onLock }) {
  if (!visible) return null;

  return (
    <group position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <Html
        center
        transform
        distanceFactor={8}
        style={{
          width: '340px',
          maxHeight: '260px',
          overflow: 'hidden',
          background: 'rgba(12, 10, 16, 0.94)',
          border: '1px solid rgba(201, 169, 97, 0.35)',
          borderRadius: '12px',
          padding: '0',
          color: 'rgba(220, 210, 190, 0.9)',
          fontFamily: 'Crimson Pro, serif',
          fontSize: '13px',
          lineHeight: '1.5',
          pointerEvents: 'auto',
          touchAction: 'none',
          boxShadow: '0 0 30px rgba(201, 169, 97, 0.08)',
        }}
        occlude={false}
      >
        {/* Hint bar */}
        <div
          style={{
            background: 'rgba(201, 169, 97, 0.1)',
            borderBottom: '1px solid rgba(201, 169, 97, 0.2)',
            padding: '5px 12px',
            textAlign: 'center',
            fontSize: '10px',
            color: 'rgba(201, 169, 97, 0.6)',
            fontFamily: 'Cinzel, serif',
            letterSpacing: '1px',
            borderRadius: '12px 12px 0 0',
          }}
        >
          Tap to read
        </div>

        <div
          onClick={onLock}
          style={{ padding: '12px 18px', touchAction: 'none', cursor: 'pointer' }}
        >
          {children}
        </div>
      </Html>
    </group>
  );
}
