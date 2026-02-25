import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 3; // world units per second at joystick full tilt
const FLY_SPEED = 3;  // lerp speed for fly-to
const FLY_OFFSET = 1.5; // stop this far from target (don't go inside planet)
const ZOOM_SENSITIVITY = 0.02; // world units per pixel of pinch delta
const ZOOM_MIN = -5;   // max zoom out (backward along look direction)
const ZOOM_MAX = 20;   // max zoom in (forward along look direction)

/**
 * Phone AR camera: gyroscope orientation + joystick movement + fly-to + pinch zoom.
 * Camera sits at Earth (0,0,0) initially and can move freely on the orbital plane.
 * Pinch zoom moves the camera forward/backward along its look direction.
 */
export default function GyroscopeCamera({ joystickRef, flyToTarget, onFlyComplete, cameraPosRef, panelLockedRef, orientationGranted }) {
  const { camera, gl } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const quat = useRef(new THREE.Quaternion());
  const screenOrient = useRef(0);
  const alpha = useRef(0);
  const beta = useRef(0);
  const gamma = useRef(0);
  const hasData = useRef(false);
  const posRef = useRef(new THREE.Vector3(0, 0, 0));
  const headingRef = useRef(0); // Y rotation extracted from gyro for joystick direction

  // Fly-to state
  const flyTargetRef = useRef(null);
  const flyCompleteRef = useRef(onFlyComplete);
  flyCompleteRef.current = onFlyComplete;

  // Update fly target when prop changes — also reset zoom offset
  useEffect(() => {
    if (flyToTarget) {
      const target = new THREE.Vector3(flyToTarget.x, 0, flyToTarget.z);
      // Offset: stop a bit before the target so you're looking at it, not inside it
      const dir = target.clone().sub(posRef.current);
      const dist = dir.length();
      if (dist > FLY_OFFSET) {
        dir.normalize().multiplyScalar(dist - FLY_OFFSET);
        flyTargetRef.current = posRef.current.clone().add(dir);
      } else {
        flyTargetRef.current = target;
      }
      // Reset zoom on fly-to so you start fresh at the destination
      zoomOffset.current = 0;
    }
  }, [flyToTarget]);

  // Pinch zoom — moves camera forward/backward along look direction
  const pinchStartDist = useRef(null);
  const zoomAtPinchStart = useRef(0);
  const zoomOffset = useRef(0);
  const forward = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;

    const getTouchDist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartDist.current = getTouchDist(e.touches);
        zoomAtPinchStart.current = zoomOffset.current;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartDist.current != null) {
        e.preventDefault();
        const dist = getTouchDist(e.touches);
        const delta = dist - pinchStartDist.current;
        zoomOffset.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomAtPinchStart.current + delta * ZOOM_SENSITIVITY));
      }
    };
    const onTouchEnd = () => {
      pinchStartDist.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl]);

  // Device orientation — guard against null, NaN, and non-finite values
  const onOrientation = useCallback((e) => {
    const a = e.alpha, b = e.beta, g = e.gamma;
    if (a == null || b == null || g == null) return;
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(g)) return;
    alpha.current = a;
    beta.current = b;
    gamma.current = g;
    hasData.current = true;
  }, []);

  useEffect(() => {
    const onScreen = () => {
      screenOrient.current = window.orientation || 0;
    };

    // If parent already obtained permission (user gesture context), just attach listener.
    // Otherwise try requesting — but this may silently fail outside a gesture on iOS.
    if (orientationGranted) {
      window.addEventListener('deviceorientation', onOrientation);
    } else if (typeof DeviceOrientationEvent !== 'undefined' &&
               typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', onOrientation);
          }
        })
        .catch(() => {
          // Permission failed — fall back to non-gyro (OrbitControls will handle)
          console.warn('Gyroscope permission denied or unavailable');
        });
    } else {
      // Non-iOS: no permission API, just attach
      window.addEventListener('deviceorientation', onOrientation);
    }

    window.addEventListener('orientationchange', onScreen);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', onScreen);
    };
  }, [orientationGranted, onOrientation]);

  useFrame((_, delta) => {
    // --- Freeze everything when panel is locked ---
    if (panelLockedRef && panelLockedRef.current) {
      // Still expose position for mini-map but don't move or rotate
      if (cameraPosRef) {
        cameraPosRef.current = { x: posRef.current.x, y: posRef.current.y, z: posRef.current.z };
      }
      return;
    }

    // --- Gyroscope orientation ---
    if (hasData.current) {
      const a = THREE.MathUtils.degToRad(alpha.current);
      const b = THREE.MathUtils.degToRad(beta.current);
      const g = THREE.MathUtils.degToRad(gamma.current);
      const orient = THREE.MathUtils.degToRad(screenOrient.current);

      // Skip frame if any value went bad (e.g. sensor glitch)
      if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(g)) return;

      euler.current.set(b, a, -g, 'YXZ');
      quat.current.setFromEuler(euler.current);

      const q1 = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      quat.current.multiply(q1);

      const q2 = new THREE.Quaternion();
      q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);
      quat.current.multiply(q2);

      // Final NaN guard — don't apply a corrupt quaternion to the camera
      if (Number.isFinite(quat.current.x)) {
        camera.quaternion.copy(quat.current);
      }

      // Extract heading (Y rotation) for joystick movement direction
      const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      headingRef.current = e.y;
    }

    // --- Fly-to ---
    if (flyTargetRef.current) {
      posRef.current.lerp(flyTargetRef.current, FLY_SPEED * delta);
      const dist = posRef.current.distanceTo(flyTargetRef.current);
      if (dist < 0.05) {
        posRef.current.copy(flyTargetRef.current);
        flyTargetRef.current = null;
        if (flyCompleteRef.current) flyCompleteRef.current();
      }
    }

    // --- Joystick movement ---
    if (joystickRef?.current) {
      const jx = joystickRef.current.x;
      const jy = joystickRef.current.y;
      if (Math.abs(jx) > 0.05 || Math.abs(jy) > 0.05) {
        // Cancel fly-to if user starts joysticking
        flyTargetRef.current = null;

        const heading = headingRef.current;
        // Forward is -Z in camera space, map joystick Y to forward/back
        const moveX = jx * Math.cos(heading) - jy * Math.sin(heading);
        const moveZ = jx * Math.sin(heading) + jy * Math.cos(heading);
        posRef.current.x += moveX * MOVE_SPEED * delta;
        posRef.current.z += moveZ * MOVE_SPEED * delta;
        posRef.current.y = 0; // stay on orbital plane
      }
    }

    // --- Apply position + zoom offset along camera forward ---
    camera.position.copy(posRef.current);
    if (zoomOffset.current !== 0) {
      camera.getWorldDirection(forward.current);
      // Project forward onto the XZ plane (keep camera on orbital plane)
      forward.current.y = 0;
      forward.current.normalize();
      camera.position.addScaledVector(forward.current, zoomOffset.current);
    }

    // Expose position for mini-map
    if (cameraPosRef) {
      cameraPosRef.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    }
  });

  return null;
}
