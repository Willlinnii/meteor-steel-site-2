import React, { useState, useRef, useCallback } from 'react';
import { Html } from '@react-three/drei';

/**
 * 3D info panel that lies flat below the orbital plane.
 * In Phone AR, look down to read selected planet/zodiac/cardinal info.
 * Supports pinch-to-zoom on the panel content.
 */
export default function InfoPanel3D({ visible, children }) {
  const [zoom, setZoom] = useState(1);
  const pinchStartDist = useRef(null);
  const zoomAtStart = useRef(1);

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      pinchStartDist.current = getTouchDist(e.touches);
      zoomAtStart.current = zoom;
    }
  }, [zoom]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStartDist.current != null) {
      e.stopPropagation();
      const dist = getTouchDist(e.touches);
      const ratio = dist / pinchStartDist.current;
      setZoom(Math.max(0.5, Math.min(3, zoomAtStart.current * ratio)));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    pinchStartDist.current = null;
  }, []);

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
          fontSize: `${13 * zoom}px`,
          lineHeight: '1.5',
          pointerEvents: 'auto',
          touchAction: 'pan-y',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(201, 169, 97, 0.08)',
        }}
        occlude={false}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          {children}
        </div>
      </Html>
    </group>
  );
}
