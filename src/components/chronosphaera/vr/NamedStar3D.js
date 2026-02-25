import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ZODIAC_RADIUS } from './constants3D';
import * as THREE from 'three';

// Equatorial → ecliptic coordinate conversion (J2000 obliquity)
const OBLIQUITY = 23.4393 * Math.PI / 180;
const COS_OBL = Math.cos(OBLIQUITY);
const SIN_OBL = Math.sin(OBLIQUITY);

function equatorialToEcliptic(lonDeg, latDeg) {
  const alpha = lonDeg * Math.PI / 180;
  const delta = latDeg * Math.PI / 180;
  const sinBeta = Math.sin(delta) * COS_OBL - Math.cos(delta) * SIN_OBL * Math.sin(alpha);
  const beta = Math.asin(Math.max(-1, Math.min(1, sinBeta)));
  const lambda = Math.atan2(
    Math.sin(alpha) * COS_OBL + Math.tan(delta) * SIN_OBL,
    Math.cos(alpha)
  );
  return { lambda, beta };
}

function projectToCylinder(lon, lat, R) {
  const { lambda, beta } = equatorialToEcliptic(lon, lat);
  const angle = -lambda;
  const y = R * Math.tan(beta);
  return [R * Math.cos(angle), y, R * Math.sin(angle)];
}

export default function NamedStar3D({ star, selected, onClick, displayName }) {
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef();

  const R = ZODIAC_RADIUS - 0.05;
  const pos = useMemo(() => projectToCylinder(star.lonDeg, star.latDeg, R), [star.lonDeg, star.latDeg, R]);

  // Label offset: slightly above the star
  const labelPos = useMemo(() => {
    const [x, y, z] = pos;
    // Push label outward from cylinder centre and slightly up
    const len = Math.sqrt(x * x + z * z);
    const nx = x / len;
    const nz = z / len;
    return [x + nx * 0.25, y + 0.25, z + nz * 0.25];
  }, [pos]);

  // Billboard rotation for label: face outward from cylinder
  const labelRotation = useMemo(() => {
    const [x, , z] = pos;
    const lookAngle = Math.atan2(z, x);
    return [0, -lookAngle + Math.PI / 2, 0];
  }, [pos]);

  const label = displayName || star.name;
  const baseColor = star.color || '#f5d060';
  const emissiveIntensity = selected ? 1.5 : hovered ? 1.0 : 0.6;
  const starRadius = star.isCluster ? 0.14 : 0.1;
  const labelOpacity = selected ? 1.0 : hovered ? 0.9 : 0.55;

  // Pulse animation for selection glow
  useFrame((state) => {
    if (glowRef.current && selected) {
      const t = state.clock.elapsedTime;
      const s = 1.0 + 0.3 * Math.sin(t * Math.PI);
      glowRef.current.scale.setScalar(s);
      glowRef.current.material.opacity = 0.3 + 0.15 * Math.sin(t * Math.PI);
    }
  });

  return (
    <group>
      {/* Star sphere */}
      <mesh position={pos}>
        <sphereGeometry args={[starRadius, 12, 12]} />
        <meshBasicMaterial
          color={baseColor}
          toneMapped={false}
        />
      </mesh>

      {/* Glow halo — additive blended ring around star */}
      <mesh position={pos} rotation={labelRotation}>
        <ringGeometry args={[starRadius * 1.1, starRadius * 2.5, 24]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={selected ? 0.5 : hovered ? 0.35 : 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Selection pulsing glow ring */}
      {selected && (
        <mesh ref={glowRef} position={pos} rotation={labelRotation}>
          <ringGeometry args={[starRadius * 2.0, starRadius * 3.5, 24]} />
          <meshBasicMaterial
            color="#f0c040"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Invisible hit-area sphere for reliable click/hover */}
      <mesh
        position={pos}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Star name label */}
      <group position={labelPos} rotation={labelRotation}>
        {/* Invisible hit-area behind label text */}
        <mesh
          position={[0, 0, -0.01]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <planeGeometry args={[label.length * 0.14, 0.3]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Text
          fontSize={0.18}
          color={baseColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={labelOpacity}
        >
          {label}
        </Text>
      </group>
    </group>
  );
}
