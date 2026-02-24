import { useState, useEffect, useCallback } from 'react';

const LUX_THRESHOLD = 50;

/** Time-based fallback: solar 6am–6pm, lunar otherwise. */
function getTimeMode() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'solar' : 'lunar';
}

/**
 * Hook that adapts the UI to ambient light conditions.
 *
 * Primary:  AmbientLightSensor API (Chrome Android 62+)
 * Fallback: local time of day
 *
 * Returns { mode, lux, source, isManual, toggle }.
 *   mode   — 'solar' | 'lunar'
 *   lux    — sensor illuminance or null
 *   source — 'sensor' | 'time' | 'manual'
 *   toggle — cycle: auto → force-opposite → back to auto
 */
export default function useAmbientLight() {
  const [autoMode, setAutoMode] = useState(getTimeMode);
  const [lux, setLux] = useState(null);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [override, setOverride] = useState(null);

  // Auto-detection: AmbientLightSensor → time-of-day fallback
  useEffect(() => {
    let sensor = null;
    let timer = null;

    const startTimeFallback = () => {
      setAutoMode(getTimeMode());
      timer = setInterval(() => setAutoMode(getTimeMode()), 60000);
    };

    if ('AmbientLightSensor' in window) {
      try {
        sensor = new window.AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setLux(sensor.illuminance);
          setSensorAvailable(true);
          setAutoMode(sensor.illuminance > LUX_THRESHOLD ? 'solar' : 'lunar');
        });
        sensor.addEventListener('error', () => {
          startTimeFallback();
        });
        sensor.start();
      } catch {
        startTimeFallback();
      }
    } else {
      startTimeFallback();
    }

    return () => {
      if (sensor) try { sensor.stop(); } catch {}
      if (timer) clearInterval(timer);
    };
  }, []);

  const toggle = useCallback(() => {
    setOverride(prev => {
      if (prev === null) return autoMode === 'solar' ? 'lunar' : 'solar';
      return null; // back to auto
    });
  }, [autoMode]);

  const mode = override ?? autoMode;
  const source = override ? 'manual' : (sensorAvailable ? 'sensor' : 'time');

  return { mode, lux, source, isManual: override !== null, toggle };
}
