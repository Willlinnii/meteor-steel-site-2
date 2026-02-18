import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Replaces OrbitControls when in "phone AR" mode.
 * Uses DeviceOrientation to rotate the camera so the phone
 * acts as a window into the 3D scene around you.
 */
export default function GyroscopeCamera() {
  const { camera } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const quat = useRef(new THREE.Quaternion());
  const screenOrient = useRef(0);
  const alpha = useRef(0);
  const beta = useRef(0);
  const gamma = useRef(0);
  const hasData = useRef(false);

  useEffect(() => {
    const onOrientation = (e) => {
      if (e.alpha != null) {
        alpha.current = e.alpha;
        beta.current = e.beta;
        gamma.current = e.gamma;
        hasData.current = true;
      }
    };
    const onScreen = () => {
      screenOrient.current = window.orientation || 0;
    };

    // iOS 13+ requires permission
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
    window.addEventListener('orientationchange', onScreen);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', onScreen);
    };
  }, []);

  useFrame(() => {
    if (!hasData.current) return;

    const a = THREE.MathUtils.degToRad(alpha.current); // compass
    const b = THREE.MathUtils.degToRad(beta.current);  // tilt front/back
    const g = THREE.MathUtils.degToRad(gamma.current); // tilt left/right
    const orient = THREE.MathUtils.degToRad(screenOrient.current);

    // Standard W3C device orientation → three.js camera mapping
    euler.current.set(b, a, -g, 'YXZ');
    quat.current.setFromEuler(euler.current);

    // Rotate from device frame to camera frame (-90 deg around X)
    const q1 = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
    quat.current.multiply(q1);

    // Apply screen orientation
    const q2 = new THREE.Quaternion();
    q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);
    quat.current.multiply(q2);

    camera.quaternion.copy(quat.current);

    // Position camera at center looking outward
    camera.position.set(0, 2, 0);
  });

  return null;
}
