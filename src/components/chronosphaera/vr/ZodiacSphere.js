import React, { useState, useMemo, useCallback } from 'react';
import { Text } from '@react-three/drei';
import { ZODIAC, ZODIAC_RADIUS, WALL_HEIGHT, ZODIAC_CONSTELLATION_MAP } from './constants3D';
import * as THREE from 'three';
import constellationsData from '../../../data/constellations.json';
import zodiacData from '../../../data/chronosphaeraZodiac.json';
import NAMED_STARS from '../../../data/zodiacNamedStars';
import NamedStar3D from './NamedStar3D';

const CULTURE_KEY_MAP = {
  Roman: 'roman', Greek: 'greek', Norse: 'norse',
  Babylonian: 'babylonian', Vedic: 'vedic', Islamic: 'islamic', Medieval: 'medieval',
};

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

// Helper: project equatorial coord onto cylinder wall
function projectToCylinder(lon, lat, R) {
  const { lambda, beta } = equatorialToEcliptic(lon, lat);
  const angle = -lambda;
  const y = R * Math.tan(beta);
  return [R * Math.cos(angle), y, R * Math.sin(angle)];
}

// Build a set of named-star coordinate keys to filter them from the batch dots
const namedStarKeys = new Set(
  NAMED_STARS.map(s => `${s.lonDeg},${s.latDeg}`)
);

// Project zodiac constellation stars + lines onto the inner cylinder wall
function ZodiacStarDots() {
  const { pointsGeo, linesGeo } = useMemo(() => {
    const zodiacIds = new Set(Object.values(ZODIAC_CONSTELLATION_MAP));
    const uniqueKeys = new Set();
    const starPositions = [];
    const linePositions = [];
    const R = ZODIAC_RADIUS - 0.05;

    for (const constellation of constellationsData) {
      if (!zodiacIds.has(constellation.id)) continue;
      for (const [[lon1, lat1], [lon2, lat2]] of constellation.lines) {
        // Star dots (deduplicated, skip named stars — they render individually)
        for (const [lon, lat] of [[lon1, lat1], [lon2, lat2]]) {
          const key = `${lon},${lat}`;
          if (uniqueKeys.has(key)) continue;
          uniqueKeys.add(key);
          if (namedStarKeys.has(key)) continue;
          starPositions.push(...projectToCylinder(lon, lat, R));
        }
        // Constellation lines
        linePositions.push(...projectToCylinder(lon1, lat1, R));
        linePositions.push(...projectToCylinder(lon2, lat2, R));
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    return { pointsGeo: pGeo, linesGeo: lGeo };
  }, []);

  const sprite = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,240,180,1)');
    grad.addColorStop(0.3, 'rgba(240,210,100,0.8)');
    grad.addColorStop(1, 'rgba(240,192,64,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <group>
      {/* Constellation lines */}
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial color="#c9a961" transparent opacity={0.35} depthWrite={false} />
      </lineSegments>
      {/* Star dots */}
      <points geometry={pointsGeo}>
        <pointsMaterial
          map={sprite}
          color="#f5d060"
          size={0.2}
          transparent
          opacity={1.0}
          depthWrite={false}
          sizeAttenuation
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Build one 30° arc segment as a vertical cylinder wall
function WheelSegment({ index, selected, hovered, onClick, onHover, onUnhover }) {
  const thetaStart = useMemo(() => -((index + 1) * 30) * Math.PI / 180, [index]);

  // Visual wall (open-ended, no caps)
  const wallGeo = useMemo(() => {
    return new THREE.CylinderGeometry(
      ZODIAC_RADIUS, ZODIAC_RADIUS, WALL_HEIGHT, 16, 1, true, thetaStart, Math.PI / 6
    );
  }, [thetaStart]);

  // Invisible hit-area (closed with caps) — much easier to hover/click from any angle
  const hitGeo = useMemo(() => {
    return new THREE.CylinderGeometry(
      ZODIAC_RADIUS, ZODIAC_RADIUS, WALL_HEIGHT, 16, 1, false, thetaStart, Math.PI / 6
    );
  }, [thetaStart]);

  const baseOpacity = 0.35;
  const opacity = selected ? 0.75 : hovered ? 0.7 : baseOpacity;
  const color = selected ? '#ffd700' : hovered ? '#f0c040' : '#c9a961';
  const emissive = selected ? '#ffd700' : hovered ? '#f0c040' : '#c9a961';
  const emissiveIntensity = selected ? 0.6 : hovered ? 0.5 : 0.1;

  return (
    <group>
      {/* Invisible hit-area with caps for reliable hover/click detection */}
      <mesh
        geometry={hitGeo}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onUnhover(); document.body.style.cursor = 'auto'; }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Visible wall */}
      <mesh geometry={wallGeo}>
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

// Horizontal torus rings at top and bottom of the cylinder wall
function WheelEdges() {
  return (
    <group>
      <mesh position={[0, WALL_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ZODIAC_RADIUS, 0.06, 8, 128]} />
        <meshStandardMaterial color="#c9a961" emissive="#c9a961" emissiveIntensity={0.3} transparent opacity={0.6} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -WALL_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ZODIAC_RADIUS, 0.06, 8, 128]} />
        <meshStandardMaterial color="#c9a961" emissive="#c9a961" emissiveIntensity={0.3} transparent opacity={0.6} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Vertical divider planes between segments on the cylinder wall
function ZodiacDivider({ index }) {
  const angleDeg = -(index * 30);
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = ZODIAC_RADIUS * Math.cos(angleRad);
  const z = ZODIAC_RADIUS * Math.sin(angleRad);
  const lookAngle = Math.atan2(z, x);

  return (
    <mesh
      position={[x, 0, z]}
      rotation={[0, -lookAngle, 0]}
    >
      <planeGeometry args={[0.04, WALL_HEIGHT]} />
      <meshBasicMaterial color="#c9a961" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// Labels on the outer face of the cylinder wall
function ZodiacLabel({ sign, symbol, index, selected, hovered, onClick, onHover, onUnhover }) {
  const centerAngleDeg = -(index * 30 + 15);
  const centerAngleRad = (centerAngleDeg * Math.PI) / 180;

  const r = ZODIAC_RADIUS + 0.1;
  const x = r * Math.cos(centerAngleRad);
  const z = r * Math.sin(centerAngleRad);
  const lookAngle = Math.atan2(z, x);

  const color = selected ? '#f0c040' : hovered ? '#c9a961' : 'rgba(201, 169, 97, 0.7)';

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, -lookAngle + Math.PI / 2, 0]}
    >
      {/* Invisible hit-area mesh behind text for reliable click detection */}
      <mesh
        position={[0, 0, -0.01]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onUnhover(); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[1.4, 1.8]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Symbol */}
      <Text
        position={[0, 0.5, 0.01]}
        fontSize={0.75}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {symbol}
      </Text>

      {/* Sign name */}
      <Text
        position={[0, -0.5, 0.01]}
        fontSize={0.32}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {sign}
      </Text>

      {/* Selection glow ring */}
      {selected && (
        <mesh>
          <ringGeometry args={[0.7, 0.85, 24]} />
          <meshBasicMaterial color="#f0c040" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}


// Lahiri ayanamsa: ~24.2° in 2026, precesses ~1.4°/century
function getLahiriAyanamsa() {
  const now = new Date();
  const fracYear = now.getFullYear() + (now.getMonth() / 12) + (now.getDate() / 365.25);
  return 23.853 + (fracYear - 2000) * 0.01397;
}

export default function ZodiacSphere({ selectedSign, onSelectSign, zodiacMode, selectedStar, onSelectStar, activeCulture }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Resolve culture-specific zodiac sign names
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const getZodiacName = useCallback((sign) => {
    if (!cultureKey || activeCulture === 'Atlas') return sign;
    const entry = zodiacData.find(d => d.sign === sign);
    const cultureName = entry?.cultures?.[cultureKey]?.name;
    if (!cultureName) return sign;
    // Strip parenthetical for 3D display (e.g. "Aries (Chrysomallus)" → "Aries")
    return cultureName.split(' (')[0];
  }, [cultureKey, activeCulture]);

  // Resolve culture-specific star names
  const getStarName = useCallback((star) => {
    if (!cultureKey || activeCulture === 'Atlas') return star.name;
    return star.cultures?.[cultureKey]?.name || star.name;
  }, [cultureKey, activeCulture]);

  const handleClick = useCallback((sign) => {
    onSelectSign(selectedSign === sign ? null : sign);
  }, [selectedSign, onSelectSign]);

  // Sidereal mode rotates the zodiac ring by the ayanamsa offset
  const siderealRotation = zodiacMode === 'sidereal'
    ? getLahiriAyanamsa() * (Math.PI / 180)
    : 0;

  return (
    <group>
      {/* Zodiac sign boundaries rotate with sidereal offset */}
      <group rotation={[0, siderealRotation, 0]}>
        {/* Edge torus rings at top and bottom */}
        <WheelEdges />

        {/* 12 vertical cylinder wall segments (clickable, hoverable) */}
        {ZODIAC.map((z, i) => (
          <WheelSegment
            key={`seg-${z.sign}`}
            index={i}
            selected={selectedSign === z.sign}
            hovered={hoveredIndex === i}
            onClick={() => handleClick(z.sign)}
            onHover={() => setHoveredIndex(i)}
            onUnhover={() => setHoveredIndex(null)}
          />
        ))}

        {/* Vertical dividers between segments */}
        {ZODIAC.map((_, i) => (
          <ZodiacDivider key={`div-${i}`} index={i} />
        ))}

        {/* Sign labels on the outer wall face */}
        {ZODIAC.map((z, i) => (
          <ZodiacLabel
            key={z.sign}
            sign={getZodiacName(z.sign)}
            symbol={z.symbol}
            index={i}
            selected={selectedSign === z.sign}
            hovered={hoveredIndex === i}
            onClick={() => handleClick(z.sign)}
            onHover={() => setHoveredIndex(i)}
            onUnhover={() => setHoveredIndex(null)}
          />
        ))}
      </group>

      {/* Constellation stars stay fixed (not affected by sidereal/tropical toggle) */}
      <ZodiacStarDots />

      {/* Named stars — individually rendered with labels and interaction */}
      {NAMED_STARS.map(star => (
        <NamedStar3D
          key={star.name}
          star={star}
          selected={selectedStar === star.name}
          onClick={() => onSelectStar(selectedStar === star.name ? null : star.name)}
          displayName={getStarName(star)}
        />
      ))}

      {/* Cross lines (equinox and solstice) stay fixed */}
      <mesh>
        <planeGeometry args={[(ZODIAC_RADIUS + 2) * 2, WALL_HEIGHT]} />
        <meshBasicMaterial color="#8b9dc3" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[(ZODIAC_RADIUS + 2) * 2, WALL_HEIGHT]} />
        <meshBasicMaterial color="#8b9dc3" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
