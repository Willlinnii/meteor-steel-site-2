import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const POS_3D = new THREE.Vector3(0, 2, 8);
const POS_2D = new THREE.Vector3(0, 0, 40);
const FOV_3D = 50;
const FOV_2D = 10;
const LERP_SPEED = 4;

/**
 * Smoothly lerps the camera between 3D (perspective orbit) and 2D (pseudo-ortho) modes.
 * Returns { cameraRef } to attach to the <PerspectiveCamera>.
 */
export default function useCameraMode(is2D) {
  const targetPos = useRef(new THREE.Vector3());
  const targetFov = useRef(FOV_3D);

  // Update targets when mode changes
  targetPos.current.copy(is2D ? POS_2D : POS_3D);
  targetFov.current = is2D ? FOV_2D : FOV_3D;

  const cameraReady = useRef(false);

  const CameraController = useCallback(
    function CameraControllerInner() {
      useFrame(({ camera }) => {
        if (!cameraReady.current) {
          camera.position.copy(is2D ? POS_2D : POS_3D);
          camera.fov = is2D ? FOV_2D : FOV_3D;
          camera.updateProjectionMatrix();
          cameraReady.current = true;
          return;
        }

        const dt = Math.min(0.05, 1 / 60); // cap to prevent jumps
        const alpha = 1 - Math.exp(-LERP_SPEED * dt);

        camera.position.lerp(targetPos.current, alpha);

        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov.current, alpha);
        camera.updateProjectionMatrix();
      });
      return null;
    },
    [is2D]
  );

  return { CameraController };
}
