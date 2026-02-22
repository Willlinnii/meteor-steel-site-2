import React, { useRef, useCallback } from 'react';

const SIZE = 120;
const KNOB = 40;
const MAX_R = (SIZE - KNOB) / 2;

/**
 * Virtual thumbstick overlay for Phone AR navigation.
 * Updates joystickRef.current = { x, y } where x/y ∈ [-1, 1].
 */
export default function ARJoystick({ joystickRef }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const touchIdRef = useRef(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const updateKnob = useCallback((clientX, clientY) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_R);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clamped;
    const ny = Math.sin(angle) * clamped;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
    joystickRef.current.x = nx / MAX_R;
    joystickRef.current.y = ny / MAX_R;
  }, [joystickRef]);

  const onTouchStart = useCallback((e) => {
    if (touchIdRef.current != null) return;
    const t = e.changedTouches[0];
    touchIdRef.current = t.identifier;
    const rect = baseRef.current.getBoundingClientRect();
    centerRef.current = { x: rect.left + SIZE / 2, y: rect.top + SIZE / 2 };
    updateKnob(t.clientX, t.clientY);
  }, [updateKnob]);

  const onTouchMove = useCallback((e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        e.preventDefault();
        updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        return;
      }
    }
  }, [updateKnob]);

  const onTouchEnd = useCallback((e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
        joystickRef.current.x = 0;
        joystickRef.current.y = 0;
        return;
      }
    }
  }, [joystickRef]);

  return (
    <div
      ref={baseRef}
      className="ar-joystick"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div ref={knobRef} className="ar-joystick-knob" />
    </div>
  );
}
