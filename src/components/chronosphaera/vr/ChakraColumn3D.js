import React, { useState, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StarfieldBackground from './StarfieldBackground';
import { CHAKRA_COLORS, CHAKRA_LABELS, CHAKRA_Y_POSITIONS, PLANET_COLORS } from './constants3D';

function ChakraSphere({ index, planetName, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const y = CHAKRA_Y_POSITIONS[index];
  const color = CHAKRA_COLORS[index];
  const planetColor = PLANET_COLORS[planetName] || '#aaa';

  // Subtle pulsing for selected sphere
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (selected) {
      const s = 1 + 0.08 * Math.sin(clock.elapsedTime * 2);
      meshRef.current.scale.setScalar(s);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  const emissiveIntensity = selected ? 0.6 : hovered ? 0.3 : 0.15;

  return (
    <group position={[0, y, 0]}>
      {/* Chakra sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Chakra label (left side) */}
      <Text
        position={[-1.8, 0, 0]}
        fontSize={0.22}
        color={selected ? color : 'rgba(200, 200, 200, 0.6)'}
        anchorX="right"
        anchorY="middle"
        font={undefined}
      >
        {CHAKRA_LABELS[index]}
      </Text>

      {/* Planet label (right side) */}
      <Text
        position={[1.8, 0, 0]}
        fontSize={0.25}
        color={selected ? planetColor : 'rgba(200, 200, 200, 0.5)'}
        anchorX="left"
        anchorY="middle"
        font={undefined}
      >
        {planetName}
      </Text>

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// Thin translucent cylinder connecting all chakras
function EnergyBeam() {
  const yTop = CHAKRA_Y_POSITIONS[0];
  const yBottom = CHAKRA_Y_POSITIONS[CHAKRA_Y_POSITIONS.length - 1];
  const height = yTop - yBottom;
  const midY = (yTop + yBottom) / 2;

  return (
    <mesh position={[0, midY, 0]}>
      <cylinderGeometry args={[0.06, 0.06, height, 16]} />
      <meshBasicMaterial color="#c9a961" transparent opacity={0.08} />
    </mesh>
  );
}

/**
 * 7 glowing chakra spheres arranged vertically with planet labels.
 * Props:
 *   ordering: array of planet names [Crown → Root], e.g. ['Saturn','Jupiter',...]
 *   selectedPlanet: string|null
 *   onSelectPlanet: (planet) => void
 */
export default function ChakraColumn3D({ ordering, selectedPlanet, onSelectPlanet }) {
  const planets = ordering || ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 5]} intensity={0.8} />
      <StarfieldBackground />

      <EnergyBeam />

      {planets.map((planet, i) => (
        <ChakraSphere
          key={`${i}-${planet}`}
          index={i}
          planetName={planet}
          selected={selectedPlanet === planet}
          onClick={() => onSelectPlanet(selectedPlanet === planet ? null : planet)}
        />
      ))}
    </>
  );
}
