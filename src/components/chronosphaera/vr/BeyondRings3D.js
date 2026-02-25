import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { BEYOND_RINGS } from '../../../data/chronosphaeraBeyondRings';
import { BEYOND_RING_RADII, DODECAHEDRON_RADIUS } from './constants3D';

// Seeded LCG PRNG — matches the 2D OrbitalDiagram implementation
function makePRNG(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// Ring color lookup
const RING_COLORS = {
  worldSoul: new THREE.Color(147 / 255, 112 / 255, 219 / 255),
  nous:      new THREE.Color(218 / 255, 185 / 255, 107 / 255),
  source:    new THREE.Color(1, 1, 1),
};

const RING_COLOR_STRINGS = {
  worldSoul: '#9370db',
  nous:      '#dab96b',
  source:    '#ffffff',
};

const RING_WIDTH = 2.5; // annulus half-width in XZ plane

// ---- Dodecahedron wireframe (The Source / The One) ----

function Dodecahedron3D({ selected, onSelect, label }) {
  const edges = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(DODECAHEDRON_RADIUS, 0);
    const edgeGeo = new THREE.EdgesGeometry(geo);
    geo.dispose();
    return edgeGeo;
  }, []);

  // Invisible icosahedron hit-area (same topology, easier to click than edges)
  const hitGeo = useMemo(() => {
    return new THREE.IcosahedronGeometry(DODECAHEDRON_RADIUS, 1);
  }, []);

  return (
    <group>
      {/* Wireframe edges */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color="white"
          transparent
          opacity={selected ? 0.55 : 0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Label at the top */}
      <Text
        position={[0, DODECAHEDRON_RADIUS * 0.85, 0]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>

      {/* Invisible hit-area */}
      <mesh
        geometry={hitGeo}
        onClick={(e) => { e.stopPropagation(); onSelect('source'); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ---- Scattered particle dots for a ring ----

function RingDots({ radius, dotCount, dotSeed, color, selected }) {
  const geo = useMemo(() => {
    const rand = makePRNG(dotSeed);
    const positions = [];
    for (let i = 0; i < dotCount; i++) {
      const angle = rand() * Math.PI * 2;
      const r = radius - RING_WIDTH + rand() * (RING_WIDTH * 2);
      const y = (rand() - 0.5) * 0.5;
      positions.push(r * Math.cos(angle), y, r * Math.sin(angle));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [radius, dotCount, dotSeed]);

  const sprite = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial
        map={sprite}
        color={color}
        size={selected ? 0.35 : 0.25}
        transparent
        opacity={selected ? 0.9 : 0.4}
        depthWrite={false}
        sizeAttenuation
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ---- Single beyond ring (World Soul, Nous — NOT Source) ----

function BeyondRing3D({ ringDef, radius, selected, onSelect, activePerspective }) {
  const ringId = ringDef.id;
  const color = RING_COLORS[ringId];
  const colorStr = RING_COLOR_STRINGS[ringId];
  const tradData = ringDef.traditions[activePerspective];
  const tradLabel = tradData?.label || '';

  return (
    <group>
      {/* Inner torus border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius - RING_WIDTH, 0.04, 8, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.6 : 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer torus border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + RING_WIDTH, 0.04, 8, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.6 : 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Scattered dots */}
      <RingDots
        radius={radius}
        dotCount={ringDef.dotCount}
        dotSeed={ringDef.dotSeed}
        color={color}
        selected={selected}
      />

      {/* Label at top of ring */}
      <Text
        position={[0, 1.5, -radius]}
        fontSize={0.5}
        color={colorStr}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {tradLabel || ringDef.label}
      </Text>

      {/* Selection glow — brighter middle torus */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, RING_WIDTH * 0.6, 8, 128]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.08}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Invisible hit-area torus for click */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(ringId); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <torusGeometry args={[radius, RING_WIDTH, 8, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---- Main component ----

export default function BeyondRings3D({
  beyondRings,
  selectedBeyondRing,
  onSelectBeyondRing,
  activePerspective,
}) {
  // World Soul and Nous get rings; Source is represented by the dodecahedron
  const ringLayers = useMemo(() => {
    return BEYOND_RINGS.filter(r => r.id !== 'source' && beyondRings.includes(r.id));
  }, [beyondRings]);

  const sourceDef = BEYOND_RINGS.find(r => r.id === 'source');
  const sourceVisible = beyondRings.includes('source');
  const sourceTradData = sourceVisible ? sourceDef?.traditions?.[activePerspective] : null;
  const sourceLabel = sourceTradData?.label || sourceDef?.label || '';

  return (
    <group>
      {ringLayers.map(ringDef => (
        <BeyondRing3D
          key={ringDef.id}
          ringDef={ringDef}
          radius={BEYOND_RING_RADII[ringDef.id]}
          selected={selectedBeyondRing === ringDef.id}
          onSelect={onSelectBeyondRing}
          activePerspective={activePerspective}
        />
      ))}

      {/* The Source — represented solely by the dodecahedron */}
      {sourceVisible && (
        <Dodecahedron3D
          selected={selectedBeyondRing === 'source'}
          onSelect={onSelectBeyondRing}
          label={sourceLabel}
        />
      )}
    </group>
  );
}
