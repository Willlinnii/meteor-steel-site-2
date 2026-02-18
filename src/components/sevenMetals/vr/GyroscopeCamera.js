import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 3; // world units per second at joystick full tilt
const FLY_SPEED = 3;  // lerp speed for fly-to
const FLY_OFFSET = 1.5; // stop this far from target (don't go inside planet)

/**
 * Phone AR camera: gyroscope orientation + joystick movement + fly-to + pinch zoom.
 * Camera sits at Earth (0,0,0) initially and can move freely on the orbital plane.
 */
export default function GyroscopeCamera({ joystickRef, flyToTarget, onFlyComplete, onScaleChange, cameraPosRef, panelLockedRef }) {
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

  // Update fly target when prop changes
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
    }
  }, [flyToTarget]);

  // Pinch zoom
  const pinchStartDist = useRef(null);
  const scaleAtPinchStart = useRef(1);
  const currentScale = useRef(1);

  useEffect(() => {
    const el = gl.domElement;

    const getTouchDist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchStartDist.current = getTouchDist(e.touches);
        scaleAtPinchStart.current = currentScale.current;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchStartDist.current != null) {
        const dist = getTouchDist(e.touches);
        const ratio = dist / pinchStartDist.current;
        currentScale.current = Math.max(0.3, Math.min(3, scaleAtPinchStart.current * ratio));
        if (onScaleChange) onScaleChange(currentScale.current);
      }
    };
    const onTouchEnd = () => {
      pinchStartDist.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl, onScaleChange]);

  // Device orientation
  const requestPermission = useCallback(() => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', onOrientation);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener('deviceorientation', onOrientation);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onOrientation = useCallback((e) => {
    if (e.alpha != null) {
      alpha.current = e.alpha;
      beta.current = e.beta;
      gamma.current = e.gamma;
      hasData.current = true;
    }
  }, []);

  useEffect(() => {
    const onScreen = () => {
      screenOrient.current = window.orientation || 0;
    };

    requestPermission();
    window.addEventListener('orientationchange', onScreen);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', onScreen);
    };
  }, [requestPermission, onOrientation]);

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

      euler.current.set(b, a, -g, 'YXZ');
      quat.current.setFromEuler(euler.current);

      const q1 = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
      quat.current.multiply(q1);

      const q2 = new THREE.Quaternion();
      q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);
      quat.current.multiply(q2);

      camera.quaternion.copy(quat.current);

      // Extract heading (Y rotation) for joystick movement direction
      const e = new THREE.Euler().setFromQuaternion(quat.current, 'YXZ');
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

    // --- Apply position ---
    camera.position.copy(posRef.current);

    // Expose position for mini-map
    if (cameraPosRef) {
      cameraPosRef.current = { x: posRef.current.x, y: posRef.current.y, z: posRef.current.z };
    }
  });

  return null;
}
