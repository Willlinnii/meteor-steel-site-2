import React, { useMemo } from 'react';
import * as THREE from 'three';
import constellationsData from '../../data/constellations.json';
import { ZODIAC_RADIUS, ZODIAC_CONSTELLATION_MAP, WALL_HEIGHT } from '../../components/chronosphaera/vr/constants3D';

const HALF_WALL = WALL_HEIGHT / 2;

const DEG2RAD = Math.PI / 180;
const OBLIQUITY = 23.4393 * DEG2RAD;
const COS_OBL = Math.cos(OBLIQUITY);
const SIN_OBL = Math.sin(OBLIQUITY);

function equatorialToEcliptic(lonDeg, latDeg) {
  const alpha = lonDeg * DEG2RAD;
  const delta = latDeg * DEG2RAD;
  const sinBeta = Math.sin(delta) * COS_OBL - Math.cos(delta) * SIN_OBL * Math.sin(alpha);
  const beta = Math.asin(Math.max(-1, Math.min(1, sinBeta)));
  const lambda = Math.atan2(
    Math.sin(alpha) * COS_OBL + Math.tan(delta) * SIN_OBL,
    Math.cos(alpha)
  );
  return { lambda, beta };
}

function toEcliptic(lon, lat) {
  const { lambda, beta } = equatorialToEcliptic(lon, lat);
  return { angle: -lambda, beta };
}

function eclipticToXYZ(angle, beta, R) {
  const y = R * Math.tan(beta);
  return [R * Math.cos(angle), y, R * Math.sin(angle)];
}

function projectToCylinder(lon, lat, R) {
  const { angle, beta } = toEcliptic(lon, lat);
  return eclipticToXYZ(angle, beta, R);
}

// Shortest angular difference
function shortAngle(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// Subdivide a line segment along the cylinder surface
const ARC_STEP = 3 * DEG2RAD; // max ~3° per sub-segment

function arcSegments(lon1, lat1, lon2, lat2, R) {
  const e1 = toEcliptic(lon1, lat1);
  const e2 = toEcliptic(lon2, lat2);
  const dAngle = shortAngle(e1.angle, e2.angle);
  const steps = Math.max(1, Math.ceil(Math.abs(dAngle) / ARC_STEP));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = e1.angle + dAngle * t;
    const b = e1.beta + (e2.beta - e1.beta) * t;
    pts.push(eclipticToXYZ(a, b, R));
  }
  return pts;
}

export default function BrightConstellations({ radius }) {
  const R = radius || (ZODIAC_RADIUS - 0.05);

  const { pointsGeo, linesGeo } = useMemo(() => {
    const zodiacIds = new Set(Object.values(ZODIAC_CONSTELLATION_MAP));
    const uniqueKeys = new Set();
    const starPositions = [];
    const linePositions = [];

    for (const constellation of constellationsData) {
      if (!zodiacIds.has(constellation.id)) continue;
      for (const [[lon1, lat1], [lon2, lat2]] of constellation.lines) {
        const p1 = projectToCylinder(lon1, lat1, R);
        const p2 = projectToCylinder(lon2, lat2, R);
        if (Math.abs(p1[1]) > HALF_WALL || Math.abs(p2[1]) > HALF_WALL) continue;
        for (const [pos, lon, lat] of [[p1, lon1, lat1], [p2, lon2, lat2]]) {
          const key = `${lon},${lat}`;
          if (uniqueKeys.has(key)) continue;
          uniqueKeys.add(key);
          starPositions.push(...pos);
        }
        // Subdivide into arc segments that follow the cylinder
        const arc = arcSegments(lon1, lat1, lon2, lat2, R);
        for (let i = 0; i < arc.length - 1; i++) {
          linePositions.push(...arc[i]);
          linePositions.push(...arc[i + 1]);
        }
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    return { pointsGeo: pGeo, linesGeo: lGeo };
  }, [R]);

  // Bright core star sprite
  const sprite = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,240,1)');
    grad.addColorStop(0.15, 'rgba(255,240,180,0.95)');
    grad.addColorStop(0.4, 'rgba(240,200,80,0.5)');
    grad.addColorStop(1, 'rgba(240,192,64,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Soft wide glow sprite for halo layer
  const glowSprite = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,230,160,0.6)');
    grad.addColorStop(0.3, 'rgba(240,200,80,0.3)');
    grad.addColorStop(0.6, 'rgba(201,169,97,0.1)');
    grad.addColorStop(1, 'rgba(201,169,97,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group>
      {/* Glow halo behind constellation lines */}
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial
          color="#f0d870"
          transparent
          opacity={0.35}
          linewidth={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Bright constellation lines */}
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial
          color="#fff8e0"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Soft star glow halo (large, diffuse) */}
      <points geometry={pointsGeo}>
        <pointsMaterial
          map={glowSprite}
          color="#f0d070"
          size={1.2}
          transparent
          opacity={0.7}
          depthWrite={false}
          sizeAttenuation
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Bright star cores */}
      <points geometry={pointsGeo}>
        <pointsMaterial
          map={sprite}
          color="#fffff0"
          size={0.5}
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
