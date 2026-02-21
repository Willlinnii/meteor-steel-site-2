import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Google Street View panorama with gyroscope motion tracking.
 * Props: lat, lng, heading, pitch, fov, name
 */
export default function StreetViewPanorama({ lat, lng, heading = 0, pitch = 0, fov = 90, name }) {
  const containerRef = useRef(null);
  const panoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsGyroPermission, setNeedsGyroPermission] = useState(false);

  // Detect iOS requiring explicit gyro permission
  useEffect(() => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedsGyroPermission(true);
    }
  }, []);

  // Create panorama
  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return;

    const zoom = Math.log2(180 / fov);

    panoRef.current = new window.google.maps.StreetViewPanorama(containerRef.current, {
      position: { lat, lng },
      pov: { heading, pitch },
      zoom,
      motionTracking: true,
      motionTrackingControl: true,
      addressControl: false,
      linksControl: true,
      enableCloseButton: false,
      fullscreenControl: false, // we provide our own
    });

    return () => {
      panoRef.current = null;
    };
  }, [lat, lng, heading, pitch, fov]);

  // iOS gyroscope permission request
  const requestGyro = useCallback(async () => {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm === 'granted') {
        setNeedsGyroPermission(false);
        // Recreate panorama so motionTracking picks up the permission
        if (panoRef.current) {
          panoRef.current.setOptions({ motionTracking: true });
        }
      }
    } catch {
      // permission denied or error — do nothing
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const wrap = containerRef.current?.parentElement;
    if (!wrap) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrap.requestFullscreen().catch(() => {});
    }
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <div className="sacred360-pano-wrap">
      <div ref={containerRef} className="sacred360-pano" />

      {needsGyroPermission && (
        <button className="sacred360-gyro-btn" onClick={requestGyro}>
          Enable Gyroscope
        </button>
      )}

      <button
        className="sacred360-fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? '✕' : '⛶'}
      </button>
    </div>
  );
}
