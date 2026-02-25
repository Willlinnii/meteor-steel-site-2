import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import './PanoViewer.css';

/* ─── Drag controls (mouse + touch) ─── */
function DragControls() {
  const { camera, gl } = useThree();
  const lon = useRef(0);
  const lat = useRef(0);
  const dragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const down = (x, y) => { dragging.current = true; prev.current = { x, y }; };
    const move = (x, y) => {
      if (!dragging.current) return;
      lon.current -= (x - prev.current.x) * 0.15;
      lat.current += (y - prev.current.y) * 0.15;
      lat.current = Math.max(-85, Math.min(85, lat.current));
      prev.current = { x, y };
    };
    const up = () => { dragging.current = false; };

    const onMouseDown = (e) => down(e.clientX, e.clientY);
    const onMouseMove = (e) => move(e.clientX, e.clientY);
    const onTouchStart = (e) => { if (e.touches.length === 1) down(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchMove = (e) => { if (e.touches.length === 1) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); } };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', up);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', up, { passive: true });

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', up);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', up);
    };
  }, [gl]);

  useFrame(() => {
    const phi = THREE.MathUtils.degToRad(90 - lat.current);
    const theta = THREE.MathUtils.degToRad(lon.current);
    const target = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    );
    camera.lookAt(target);
  });

  return null;
}

/* ─── Gyro controls (mobile device orientation) ─── */
function GyroControls() {
  const { camera } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const quat = useRef(new THREE.Quaternion());
  const screenOrient = useRef(0);
  const alpha = useRef(0);
  const beta = useRef(0);
  const gamma = useRef(0);
  const hasData = useRef(false);

  const onOrientation = useCallback((e) => {
    if (e.alpha != null) {
      alpha.current = e.alpha;
      beta.current = e.beta;
      gamma.current = e.gamma;
      hasData.current = true;
    }
  }, []);

  useEffect(() => {
    const onScreen = () => { screenOrient.current = window.orientation || 0; };

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(s => { if (s === 'granted') window.addEventListener('deviceorientation', onOrientation); })
        .catch(() => {});
    } else {
      window.addEventListener('deviceorientation', onOrientation);
    }
    window.addEventListener('orientationchange', onScreen);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', onScreen);
    };
  }, [onOrientation]);

  useFrame(() => {
    if (!hasData.current) return;
    const a = THREE.MathUtils.degToRad(alpha.current);
    const b = THREE.MathUtils.degToRad(beta.current);
    const g = THREE.MathUtils.degToRad(gamma.current);
    const orient = THREE.MathUtils.degToRad(screenOrient.current);

    euler.current.set(b, a, -g, 'YXZ');
    quat.current.setFromEuler(euler.current);
    quat.current.multiply(new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2));
    const q2 = new THREE.Quaternion();
    q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient);
    quat.current.multiply(q2);
    camera.quaternion.copy(quat.current);
  });

  return null;
}

/* ─── Equirectangular image sphere ─── */
function ImageSphere({ src }) {
  const texture = useLoader(THREE.TextureLoader, src);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

/* ─── Equirectangular video sphere ─── */
function VideoSphere({ src }) {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    setTexture(tex);

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
    };
  }, [src]);

  if (!texture) return null;
  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

/* ─── Loading fallback ─── */
function LoadingIndicator() {
  return (
    <mesh>
      <sphereGeometry args={[50, 16, 8]} />
      <meshBasicMaterial color="#1a1a2e" side={THREE.BackSide} wireframe />
    </mesh>
  );
}

/* ─── Main PanoViewer ─── */
export default function PanoViewer({ src, type = 'image' }) {
  const containerRef = useRef(null);
  const [useGyro, setUseGyro] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  // Detect iOS gyro permission requirement
  useEffect(() => {
    const isIOS = typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function';
    setNeedsPermission(isIOS);
  }, []);

  const handleGyroToggle = useCallback(() => {
    if (needsPermission && !useGyro) {
      DeviceOrientationEvent.requestPermission()
        .then(s => { if (s === 'granted') setUseGyro(true); })
        .catch(() => {
          console.warn('Gyro permission denied in PanoViewer');
        });
    } else {
      setUseGyro(g => !g);
    }
  }, [needsPermission, useGyro]);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  return (
    <div className="pano-viewer" ref={containerRef}>
      <Canvas camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 0] }} dpr={[1, 2]}>
        {useGyro ? <GyroControls /> : <DragControls />}
        <Suspense fallback={<LoadingIndicator />}>
          {type === 'video'
            ? <VideoSphere src={src} />
            : <ImageSphere src={src} />}
        </Suspense>
      </Canvas>

      <div className="pano-controls">
        <button className="pano-btn" onClick={handleGyroToggle} title={useGyro ? 'Drag mode' : 'Gyroscope mode'}>
          {useGyro ? '\u270B' : '\u{1F4F1}'}
        </button>
        <button className="pano-btn" onClick={handleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {isFullscreen ? '\u2716' : '\u26F6'}
        </button>
      </div>
    </div>
  );
}
