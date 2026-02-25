import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Navaratna — Hindu planetary gemstone correspondences
// Source: Vishnu Purana, Brihat Parashara Hora Shastra, Surya Siddhanta
const GEMSTONE_DATA = {
  Sun:     { name: 'Ruby',            sanskrit: 'Manikya',  color: '#e01030', emissive: '#900818', cut: 'ovalBrilliant', faceted: true },
  Moon:    { name: 'Pearl',           sanskrit: 'Moti',     color: '#f0eee8', emissive: '#c8c0b0', cut: 'cabochon',      faceted: false },
  Mercury: { name: 'Emerald',         sanskrit: 'Panna',    color: '#1ba34a', emissive: '#0d6830', cut: 'emerald',       faceted: true },
  Venus:   { name: 'Diamond',         sanskrit: 'Heera',    color: '#f0f4ff', emissive: '#c0c8e0', cut: 'brilliant',     faceted: true },
  Mars:    { name: 'Red Coral',       sanskrit: 'Moonga',   color: '#e05030', emissive: '#903020', cut: 'ovalCab',       faceted: false },
  Jupiter: { name: 'Yellow Sapphire', sanskrit: 'Pukhraj',  color: '#e8b820', emissive: '#a07810', cut: 'cushion',       faceted: true },
  Saturn:  { name: 'Blue Sapphire',   sanskrit: 'Neelam',   color: '#1838a0', emissive: '#0c1c60', cut: 'ovalBrilliant', faceted: true },
  Earth:   { name: 'Hessonite',       sanskrit: 'Gomed',    color: '#c07030', emissive: '#704018', cut: 'roundMixed',    faceted: true },
};

// ── Geometry helpers ──────────────────────────────────────────────────

// Build non-indexed BufferGeometry from explicit triangles (for clean flat shading)
function buildFacetedGeo(triangles) {
  const positions = [];
  for (const [a, b, c] of triangles) {
    positions.push(...a, ...b, ...c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

// Generate a ring of [x,y,z] points in XZ plane at height y, with optional oval stretch
function ring(n, radius, y, scaleX = 1, scaleZ = 1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.cos(a) * radius * scaleX, y, Math.sin(a) * radius * scaleZ]);
  }
  return pts;
}

// Connect two rings of same length with triangle pairs, return triangles array
function connectRings(upper, lower) {
  const tris = [];
  const n = upper.length;
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    tris.push([upper[i], lower[i], upper[ni]]);
    tris.push([upper[ni], lower[i], lower[ni]]);
  }
  return tris;
}

// Fan from a center point to a ring
function fanFromCenter(center, ringPts, reverse = false) {
  const tris = [];
  const n = ringPts.length;
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    if (reverse) {
      tris.push([center, ringPts[ni], ringPts[i]]);
    } else {
      tris.push([center, ringPts[i], ringPts[ni]]);
    }
  }
  return tris;
}

// ── Oval Brilliant Cut (Ruby, Blue Sapphire) ──────────────────────────
// Classic oval: flat table, 8 crown main facets, 16 upper girdle, girdle,
// 16 lower girdle, 8 pavilion mains, culet point
function OvalBrilliantGeo(size, sx = 1.3, sz = 1.0) {
  const n = 16; // facet count around
  const tableR = size * 0.5;
  const crownR = size * 0.85;
  const girdleR = size;
  const tableY = size * 0.45;
  const crownY = size * 0.25;
  const girdleY = 0;
  const pavilionY = -size * 0.75;

  const tableRing = ring(n, tableR, tableY, sx, sz);
  const crownRing = ring(n, crownR, crownY, sx, sz);
  const girdleRing = ring(n, girdleR, girdleY, sx, sz);
  const tableCenter = [0, tableY, 0];
  const culet = [0, pavilionY, 0];

  const tris = [
    ...fanFromCenter(tableCenter, tableRing),       // table
    ...connectRings(tableRing, crownRing),           // star + bezel facets
    ...connectRings(crownRing, girdleRing),          // upper girdle
    ...fanFromCenter(culet, girdleRing, true),       // pavilion
  ];

  return buildFacetedGeo(tris);
}

// ── Round Brilliant Cut (Diamond) ─────────────────────────────────────
function BrilliantCutGeo(size) {
  return OvalBrilliantGeo(size, 1.0, 1.0);
}

// ── Cushion Cut (Yellow Sapphire) ─────────────────────────────────────
// Rounded square: 4 main directions slightly flattened, facets between
function CushionCutGeo(size) {
  const n = 12;
  const tableR = size * 0.5;
  const crownR = size * 0.8;
  const girdleR = size;
  const tableY = size * 0.4;
  const crownY = size * 0.2;
  const girdleY = 0;
  const pavilionY = -size * 0.7;

  // Cushion shape: superellipse-style squarish ring
  function cushionRing(nPts, r, y) {
    const pts = [];
    for (let i = 0; i < nPts; i++) {
      const a = (i / nPts) * Math.PI * 2;
      // Push corners outward for squarish shape
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const power = 0.8; // <1 = more square, >1 = more round
      const rx = Math.sign(cos) * Math.pow(Math.abs(cos), power) * r;
      const rz = Math.sign(sin) * Math.pow(Math.abs(sin), power) * r;
      pts.push([rx, y, rz]);
    }
    return pts;
  }

  const tableRing = cushionRing(n, tableR, tableY);
  const crownRing = cushionRing(n, crownR, crownY);
  const girdleRing = cushionRing(n, girdleR, girdleY);
  const tableCenter = [0, tableY, 0];
  const culet = [0, pavilionY, 0];

  const tris = [
    ...fanFromCenter(tableCenter, tableRing),
    ...connectRings(tableRing, crownRing),
    ...connectRings(crownRing, girdleRing),
    ...fanFromCenter(culet, girdleRing, true),
  ];

  return buildFacetedGeo(tris);
}

// ── Round Mixed Cut (Hessonite) ───────────────────────────────────────
// Brilliant crown + step-cut pavilion (common for garnets)
function RoundMixedGeo(size) {
  const n = 12;
  const tableR = size * 0.45;
  const crownR = size * 0.8;
  const girdleR = size;
  const stepR = size * 0.5;
  const tableY = size * 0.4;
  const crownY = size * 0.2;
  const girdleY = 0;
  const stepY = -size * 0.4;
  const pavilionY = -size * 0.7;

  const tableRing = ring(n, tableR, tableY);
  const crownRing = ring(n, crownR, crownY);
  const girdleRing = ring(n, girdleR, girdleY);
  const stepRing = ring(n, stepR, stepY);
  const tableCenter = [0, tableY, 0];
  const culet = [0, pavilionY, 0];

  const tris = [
    ...fanFromCenter(tableCenter, tableRing),
    ...connectRings(tableRing, crownRing),
    ...connectRings(crownRing, girdleRing),
    ...connectRings(girdleRing, stepRing),       // step pavilion
    ...fanFromCenter(culet, stepRing, true),      // to culet
  ];

  return buildFacetedGeo(tris);
}

// ── Emerald Cut (step-cut rectangle with clipped corners) ─────────────
function EmeraldCutGeo(size) {
  const w = size * 0.85;
  const h = size * 1.15;
  const bev = size * 0.3;
  const tableY = size * 0.35;
  const stepY = size * 0.15;
  const girdleY = 0;
  const lowerY = -size * 0.2;
  const pavilionY = -size * 0.55;

  // Octagonal outline at a given scale + y
  function octoRing(s, y) {
    return [
      [-w * s + bev * s, y, -h * s],
      [ w * s - bev * s, y, -h * s],
      [ w * s,           y, -h * s + bev * s],
      [ w * s,           y,  h * s - bev * s],
      [ w * s - bev * s, y,  h * s],
      [-w * s + bev * s, y,  h * s],
      [-w * s,           y,  h * s - bev * s],
      [-w * s,           y, -h * s + bev * s],
    ];
  }

  const tableRing = octoRing(0.6, tableY);
  const stepRing = octoRing(0.85, stepY);
  const girdleRing = octoRing(1.0, girdleY);
  const lowerRing = octoRing(0.7, lowerY);
  const tableCenter = [0, tableY, 0];
  const culet = [0, pavilionY, 0];

  const tris = [
    ...fanFromCenter(tableCenter, tableRing),
    ...connectRings(tableRing, stepRing),
    ...connectRings(stepRing, girdleRing),
    ...connectRings(girdleRing, lowerRing),
    ...fanFromCenter(culet, lowerRing, true),
  ];

  return buildFacetedGeo(tris);
}

// ── Cabochon (Pearl) — smooth dome ────────────────────────────────────
function CabochonGeo(size) {
  return new THREE.SphereGeometry(size, 32, 32);
}

// ── Oval Cabochon (Red Coral) — smooth elongated dome ─────────────────
function OvalCabochonGeo(size) {
  const points = [];
  const segs = 20;
  const rx = size;
  const ry = size * 0.7;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI;
    const y = Math.cos(t) * ry;
    const r = Math.sin(t) * rx;
    points.push(new THREE.Vector2(r, y));
  }
  return new THREE.LatheGeometry(points, 24);
}

// ── Geometry selector ─────────────────────────────────────────────────
function useGemGeo(cut, size) {
  return useMemo(() => {
    switch (cut) {
      case 'ovalBrilliant': return OvalBrilliantGeo(size, 1.3, 1.0);
      case 'brilliant':     return BrilliantCutGeo(size);
      case 'cushion':       return CushionCutGeo(size);
      case 'roundMixed':    return RoundMixedGeo(size);
      case 'emerald':       return EmeraldCutGeo(size);
      case 'cabochon':      return CabochonGeo(size);
      case 'ovalCab':       return OvalCabochonGeo(size);
      default:              return new THREE.SphereGeometry(size, 32, 32);
    }
  }, [cut, size]);
}

// ── Main Component ────────────────────────────────────────────────────

export default function Gemstone3D({ planet, position, size, selected, onClick }) {
  const data = GEMSTONE_DATA[planet] || GEMSTONE_DATA['Sun'];
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const geo = useGemGeo(data.cut, size);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
    if (glowRef.current && selected) {
      const t = state.clock.elapsedTime;
      const scale = 1.3 + 0.15 * Math.sin(t * Math.PI);
      glowRef.current.scale.setScalar(scale);
      glowRef.current.material.opacity = 0.15 + 0.1 * Math.sin(t * Math.PI);
    }
  });

  if (!GEMSTONE_DATA[planet]) return null;

  const isPearl = data.cut === 'cabochon';
  const isDiamond = data.cut === 'brilliant';

  return (
    <group position={position}>
      {/* Selection glow ring */}
      {selected && (
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.6, 32]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Invisible hit area */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[size * 2.2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Gemstone mesh */}
      <mesh ref={meshRef} geometry={geo}>
        {isPearl ? (
          <meshPhysicalMaterial
            color={data.color}
            emissive={data.emissive}
            emissiveIntensity={selected ? 0.4 : hovered ? 0.25 : 0.15}
            roughness={0.2}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            sheen={1.0}
            sheenColor={new THREE.Color('#f8f0e0')}
          />
        ) : isDiamond ? (
          <meshPhysicalMaterial
            color={data.color}
            emissive="#a0a8c0"
            emissiveIntensity={selected ? 0.6 : hovered ? 0.4 : 0.25}
            roughness={0.0}
            metalness={0.1}
            transmission={0.6}
            thickness={size}
            ior={2.42}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            flatShading
          />
        ) : data.faceted ? (
          <meshPhysicalMaterial
            color={data.color}
            emissive={data.emissive}
            emissiveIntensity={selected ? 0.5 : hovered ? 0.35 : 0.2}
            roughness={0.1}
            metalness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            transmission={0.3}
            thickness={size * 0.5}
            ior={1.77}
            flatShading
          />
        ) : (
          <meshPhysicalMaterial
            color={data.color}
            emissive={data.emissive}
            emissiveIntensity={selected ? 0.5 : hovered ? 0.35 : 0.2}
            roughness={0.15}
            metalness={0.05}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            transmission={data.cut === 'ovalCab' ? 0 : 0.3}
            thickness={size * 0.5}
            ior={1.77}
          />
        )}
      </mesh>

      {/* Inner glow light */}
      <pointLight color={data.color} intensity={selected ? 1.5 : hovered ? 0.8 : 0.4} distance={size * 8} decay={2} />
    </group>
  );
}

export { GEMSTONE_DATA };
