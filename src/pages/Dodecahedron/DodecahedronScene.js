import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Dodecahedron 3D mesh ─────────────────────────────────────────────
// Faithful regular dodecahedron using Three.js built-in geometry
// with custom materials matching the project's bronze/gold aesthetic

const FACE_COLOR = '#c9a961';
const EDGE_COLOR = '#e8d48b';
const GLOW_COLOR = '#f0c040';

function Dodecahedron3D({ size = 3, selected, onClick }) {
  const meshRef = useRef();
  const edgesRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  const geo = useMemo(() => new THREE.DodecahedronGeometry(size, 0), [size]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.001;
    }
    if (edgesRef.current) {
      edgesRef.current.rotation.y = meshRef.current?.rotation.y || 0;
      edgesRef.current.rotation.x = meshRef.current?.rotation.x || 0;
    }
    if (glowRef.current && selected) {
      const t = state.clock.elapsedTime;
      const scale = 1.08 + 0.04 * Math.sin(t * Math.PI);
      glowRef.current.scale.setScalar(scale);
      glowRef.current.material.opacity = 0.08 + 0.05 * Math.sin(t * Math.PI);
    }
  });

  return (
    <group>
      {/* Selection glow */}
      {selected && (
        <mesh ref={glowRef} geometry={geo}>
          <meshBasicMaterial
            color={GLOW_COLOR}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Invisible hit area */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[size * 1.3, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Solid faces */}
      <mesh ref={meshRef} geometry={geo}>
        <meshPhysicalMaterial
          color={FACE_COLOR}
          emissive={FACE_COLOR}
          emissiveIntensity={selected ? 0.4 : hovered ? 0.25 : 0.12}
          roughness={0.3}
          metalness={0.6}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          transmission={0.15}
          thickness={size * 0.5}
          ior={1.5}
          flatShading
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeo}>
        <lineBasicMaterial
          color={EDGE_COLOR}
          linewidth={1}
          transparent
          opacity={hovered ? 1.0 : 0.8}
        />
      </lineSegments>

      {/* Inner glow */}
      <pointLight
        color={GLOW_COLOR}
        intensity={selected ? 2 : hovered ? 1.2 : 0.6}
        distance={size * 6}
        decay={2}
      />
    </group>
  );
}

export default function DodecahedronScene({ selected, onSelect }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 8, 0]} color="#fff8f0" intensity={2} distance={60} decay={2} />
      <pointLight position={[0, -5, 0]} color="#f0c040" intensity={0.8} distance={40} decay={2} />
      <directionalLight position={[10, 10, 10]} intensity={0.4} />

      {/* Star field background */}
      <DodecStarField />

      {/* The dodecahedron */}
      <Dodecahedron3D
        size={3}
        selected={selected}
        onClick={onSelect}
      />
    </>
  );
}

// Simple star field — self-contained, no dependency on chronosphaera
function DodecStarField() {
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const count = 800;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 80 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.15} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}
