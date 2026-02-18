import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Html } from '@react-three/drei';

/**
 * 3D info panel that lies flat below the orbital plane.
 * Tap to lock camera and scroll freely, tap unlock bar to release.
 * Supports pinch-to-zoom on the panel content via native touch events.
 */
export default function InfoPanel3D({ visible, children, panelLockedRef }) {
  const [locked, setLocked] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const pinchStartDist = useRef(null);
  const zoomAtStart = useRef(1);

  // Use native touch listeners (passive: false) so we can preventDefault
  // and stop iOS from hijacking pinch gestures for page zoom / app switcher
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        pinchStartDist.current = getTouchDist(e.touches);
        zoomAtStart.current = zoom;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartDist.current != null) {
        e.preventDefault();
        e.stopPropagation();
        const dist = getTouchDist(e.touches);
        const ratio = dist / pinchStartDist.current;
        const newZoom = Math.max(0.5, Math.min(3, zoomAtStart.current * ratio));
        setZoom(newZoom);
      }
    };

    const onTouchEnd = () => {
      pinchStartDist.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [zoom]);

  const handleLock = useCallback(() => {
    if (locked) return;
    setLocked(true);
    if (panelLockedRef) panelLockedRef.current = true;
  }, [locked, panelLockedRef]);

  const handleUnlock = useCallback((e) => {
    e.stopPropagation();
    setLocked(false);
    if (panelLockedRef) panelLockedRef.current = false;
  }, [panelLockedRef]);

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
          overflow: locked ? 'auto' : 'hidden',
          background: 'rgba(12, 10, 16, 0.94)',
          border: `1px solid ${locked ? 'rgba(100, 180, 255, 0.5)' : 'rgba(201, 169, 97, 0.35)'}`,
          borderRadius: '12px',
          padding: '0',
          color: 'rgba(220, 210, 190, 0.9)',
          fontFamily: 'Crimson Pro, serif',
          fontSize: `${13 * zoom}px`,
          lineHeight: '1.5',
          pointerEvents: 'auto',
          touchAction: 'none',
          boxShadow: locked
            ? '0 0 20px rgba(100, 180, 255, 0.15)'
            : '0 0 30px rgba(201, 169, 97, 0.08)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
        occlude={false}
      >
        {/* Unlock bar — only visible when locked */}
        {locked && (
          <div
            onClick={handleUnlock}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'rgba(100, 180, 255, 0.15)',
              borderBottom: '1px solid rgba(100, 180, 255, 0.3)',
              padding: '6px 12px',
              textAlign: 'center',
              fontSize: `${11 * zoom}px`,
              color: 'rgba(140, 200, 255, 0.9)',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '1px',
              cursor: 'pointer',
              borderRadius: '12px 12px 0 0',
            }}
          >
            Tap to unlock
          </div>
        )}

        {/* Hint bar when not locked */}
        {!locked && (
          <div
            style={{
              background: 'rgba(201, 169, 97, 0.1)',
              borderBottom: '1px solid rgba(201, 169, 97, 0.2)',
              padding: '5px 12px',
              textAlign: 'center',
              fontSize: `${10 * zoom}px`,
              color: 'rgba(201, 169, 97, 0.6)',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '1px',
              borderRadius: '12px 12px 0 0',
            }}
          >
            Tap to lock &amp; scroll
          </div>
        )}

        <div
          ref={containerRef}
          onClick={!locked ? handleLock : undefined}
          style={{ padding: '12px 18px', touchAction: 'none' }}
        >
          {children}
        </div>
      </Html>
    </group>
  );
}
