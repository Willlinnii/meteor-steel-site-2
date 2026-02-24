import { useState, useRef, useCallback, useEffect } from 'react';

const SMOOTHING = 0.15; // low-pass filter coefficient (0 = no update, 1 = no smoothing)

/**
 * Hook that provides a smoothed compass heading from the device magnetometer.
 * Returns { heading, supported, active, denied, requestCompass, stopCompass }.
 */
export default function useCompass() {
  const [heading, setHeading] = useState(0);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const [denied, setDenied] = useState(false);

  const smoothedRef = useRef(0);
  const hasDataRef = useRef(false);
  const rafRef = useRef(null);
  const listenerAttached = useRef(false);

  // Feature detection on mount
  useEffect(() => {
    const hasOrientation = typeof DeviceOrientationEvent !== 'undefined';
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setSupported(hasOrientation && hasTouch);
  }, []);

  // Orientation event handler — extract compass heading
  const onOrientation = useCallback((e) => {
    let raw;
    if (e.webkitCompassHeading != null) {
      raw = e.webkitCompassHeading;
    } else if (e.alpha != null) {
      raw = (360 - e.alpha) % 360;
    } else {
      return;
    }

    if (!hasDataRef.current) {
      smoothedRef.current = raw;
      hasDataRef.current = true;
    } else {
      let delta = raw - smoothedRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      smoothedRef.current = (smoothedRef.current + SMOOTHING * delta + 360) % 360;
    }
  }, []);

  // RAF loop to push smoothed heading into React state at screen refresh rate
  const startRAF = useCallback(() => {
    const tick = () => {
      if (hasDataRef.current) {
        setHeading(Math.round(smoothedRef.current * 10) / 10);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRAF = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Request permission and start listening (must be called from user gesture)
  const requestCompass = useCallback(async () => {
    // Safety: reset stale state from a previously failed attempt
    if (listenerAttached.current) {
      window.removeEventListener('deviceorientation', onOrientation, true);
      listenerAttached.current = false;
    }

    const attach = () => {
      window.addEventListener('deviceorientation', onOrientation, true);
      listenerAttached.current = true;
      setActive(true);
      setDenied(false);
      startRAF();
    };

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEvent.requestPermission();
        if (state === 'granted') {
          attach();
        } else {
          setDenied(true);
        }
      } catch {
        // Some browsers throw but still allow the listener
        attach();
      }
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      attach();
    }
  }, [onOrientation, startRAF]);

  // Stop listening
  const stopCompass = useCallback(() => {
    window.removeEventListener('deviceorientation', onOrientation, true);
    listenerAttached.current = false;
    hasDataRef.current = false;
    stopRAF();
    setActive(false);
    setHeading(0);
  }, [onOrientation, stopRAF]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', onOrientation, true);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [onOrientation]);

  return { heading, supported, active, denied, requestCompass, stopCompass };
}
