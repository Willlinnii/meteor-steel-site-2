import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import starsNorth from '../../data/starsNorth.json';
import starsSouth from '../../data/starsSouth.json';
import constellationsData from '../../data/constellations.json';
import DODECAHEDRON_FACE_MAP from '../../data/dodecahedronFaceMap';
import WaterEffect from './WaterEffect';

// ── Constants ────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180;
const INNER_SIZE = 1.5;
const OUTER_RADIUS = 80;
const STAR_OFFSET = 0.04;
const LINE_OFFSET = 0.02;

// ── Derive face centers from the actual Three.js geometry ───────────

const _geo = (() => {
  const geo = new THREE.DodecahedronGeometry(1, 0); // unit circumradius

  // ── Align: rotate so a vertex points to +Y (celestial north pole) ──
  const alignQuat = (() => {
    const p = geo.attributes.position;
    let bestY = -Infinity;
    const bestDir = new THREE.Vector3();
    const seen = new Set();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (y > bestY) {
        bestY = y;
        bestDir.set(x, y, z).normalize();
      }
    }
    const q = new THREE.Quaternion().setFromUnitVectors(bestDir, new THREE.Vector3(0, 1, 0));
    geo.applyQuaternion(q);
    return q;
  })();

  const pos = geo.attributes.position;

  const triNormals = [];
  for (let i = 0; i < pos.count; i += 3) {
    const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
    const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
    const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    if (nx * ax + ny * ay + nz * az < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    triNormals.push(new THREE.Vector3(nx / len, ny / len, nz / len));
  }

  const centers = [];
  const used = new Set();
  for (let i = 0; i < triNormals.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    for (let j = i + 1; j < triNormals.length; j++) {
      if (used.has(j)) continue;
      if (triNormals[i].dot(triNormals[j]) > 0.99) used.add(j);
    }
    centers.push(triNormals[i].clone());
  }

  const phi = (1 + Math.sqrt(5)) / 2;
  const planeRatio = (1 + phi) / (Math.sqrt(3) * Math.sqrt(1 + phi * phi));

  const geoToMap = centers.map(gc => {
    let best = 0, bestDot = -Infinity;
    DODECAHEDRON_FACE_MAP.forEach((fm, idx) => {
      const dot = gc.x * fm.center.x + gc.y * fm.center.y + gc.z * fm.center.z;
      if (dot > bestDot) { bestDot = dot; best = idx; }
    });
    return best;
  });
  const mapToGeo = Array(12).fill(0);
  geoToMap.forEach((mi, gi) => { mapToGeo[mi] = gi; });

  // Extract 20 unique vertices (unit circumradius)
  const uniqueVerts = [];
  const vertSeen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const kx = Math.round(pos.getX(i) * 10000);
    const ky = Math.round(pos.getY(i) * 10000);
    const kz = Math.round(pos.getZ(i) * 10000);
    const key = `${kx},${ky},${kz}`;
    if (!vertSeen.has(key)) {
      vertSeen.set(key, true);
      uniqueVerts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    }
  }

  // Face pentagon inradius (unit scale)
  const faceCircumR = Math.sqrt(1 - planeRatio * planeRatio);
  const faceInR = faceCircumR * Math.cos(Math.PI / 5);

  // d12 numbering: opposite faces sum to 13
  const faceNumbers = Array(12).fill(0);
  const paired = new Set();
  const numPairs = [[1,12],[2,11],[3,10],[4,9],[5,8],[6,7]];
  let pairIdx = 0;
  for (let i = 0; i < 12; i++) {
    if (paired.has(i)) continue;
    for (let j = i + 1; j < 12; j++) {
      if (paired.has(j)) continue;
      if (centers[i].dot(centers[j]) < -0.9) {
        faceNumbers[i] = numPairs[pairIdx][0];
        faceNumbers[j] = numPairs[pairIdx][1];
        paired.add(i);
        paired.add(j);
        pairIdx++;
        break;
      }
    }
  }

  geo.dispose();
  return { centers, planeRatio, geoToMap, mapToGeo, vertices: uniqueVerts, faceInradius: faceInR, faceNumbers, alignQuat };
})();

const GEO_FACE_CENTERS = _geo.centers;
const FACE_PLANE_DIST = INNER_SIZE * _geo.planeRatio;
export const GEO_TO_MAP = _geo.geoToMap;

// Reverse lookup: d12 face number (1-12) → geometry face index (0-11)
export const NUMBER_TO_GEO = (() => {
  const map = {};
  _geo.faceNumbers.forEach((num, geoIdx) => { map[num] = geoIdx; });
  return map;
})();

// Forward lookup: geometry face index (0-11) → d12 face number (1-12)
export const GEO_TO_NUMBER = _geo.faceNumbers;

// ── Roll animation constants ────────────────────────────────────────
const ROLL_TUMBLE_SPEED = 12;       // rad/s
const ROLL_TUMBLE_DURATION = 1.5;   // seconds
const ROLL_DECEL_DURATION = 1.0;    // seconds
const ROLL_SETTLE_SPEED = 4.0;      // exponential convergence rate
const _rollVec = new THREE.Vector3();
const _rollQuat = new THREE.Quaternion();

// ── Roman dodecahedron features ──────────────────────────────────────
const KNOB_RADIUS = 0.06;
const KNOB_PROTRUSION = 0.04;
const KNOB_SEGS = 10;
const RING_SEGS = 32;
// 12 different ring sizes as fractions of face pentagon inradius
const RING_FRACTIONS = [0.45, 0.68, 0.52, 0.75, 0.38, 0.62, 0.55, 0.70, 0.32, 0.78, 0.42, 0.58];

// 12 evenly-spaced hues
const FACE_COLORS = Array.from({ length: 12 }, (_, i) => {
  const c = new THREE.Color();
  c.setHSL(i / 12, 0.7, 0.6);
  return c;
});

// ── Utilities ────────────────────────────────────────────────────────

function lonLatToXYZ(lon, lat, radius) {
  const raRad = -lon * DEG2RAD;
  const decRad = lat * DEG2RAD;
  return [
    radius * Math.cos(decRad) * Math.cos(raRad),
    radius * Math.sin(decRad),
    radius * Math.cos(decRad) * Math.sin(raRad),
  ];
}

function nearestFace(sx, sy, sz) {
  let best = 0, bestDot = -Infinity;
  for (let f = 0; f < 12; f++) {
    const c = GEO_FACE_CENTERS[f];
    const dot = sx * c.x + sy * c.y + sz * c.z;
    if (dot > bestDot) { bestDot = dot; best = f; }
  }
  return best;
}

/** Gnomonic projection: unit direction → point on face plane + offset */
function projectToFace(sx, sy, sz, faceIdx, offset) {
  const N = GEO_FACE_CENTERS[faceIdx];
  const dotSN = sx * N.x + sy * N.y + sz * N.z;
  if (dotSN < 0.1) {
    const d = FACE_PLANE_DIST + offset;
    return [N.x * d, N.y * d, N.z * d];
  }
  const t = (FACE_PLANE_DIST + offset) / dotSN;
  return [t * sx, t * sy, t * sz];
}

// ── useSurfaceStars (microcosm — face-projected) ────────────────────

function useSurfaceStars() {
  return useMemo(() => {
    const allStars = [...starsNorth, ...starsSouth];
    const count = allStars.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const faceIndices = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const [lon, lat, mag] = allStars[i];
      const [sx, sy, sz] = lonLatToXYZ(lon, lat, 1);
      const face = nearestFace(sx, sy, sz);
      const [px, py, pz] = projectToFace(sx, sy, sz, face, STAR_OFFSET);

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      sizes[i] = Math.max(0.15, 1.2 - mag * 0.18);
      faceIndices[i] = face;
    }

    return { count, positions, sizes, faceIndices };
  }, []);
}

// ── useSphereStars (macrocosm — proper celestial positions) ─────────

function useSphereStars() {
  return useMemo(() => {
    const allStars = [...starsNorth, ...starsSouth];
    const count = allStars.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const faceIndices = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const [lon, lat, mag] = allStars[i];
      const [px, py, pz] = lonLatToXYZ(lon, lat, OUTER_RADIUS);
      const [sx, sy, sz] = lonLatToXYZ(lon, lat, 1);

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      sizes[i] = Math.max(0.15, 1.2 - mag * 0.18);
      faceIndices[i] = nearestFace(sx, sy, sz);
    }

    return { count, positions, sizes, faceIndices };
  }, []);
}

// ── Microcosm star shaders ──────────────────────────────────────────

const microStarVertexShader = `
  attribute float size;
  attribute float faceIdx;
  uniform float selectedFace;
  uniform float dimFactor;
  uniform float time;
  varying float vFaceIdx;
  varying float vOpacity;

  void main() {
    vFaceIdx = faceIdx;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float s = size;
    float opacity = 1.0;

    if (selectedFace >= 0.0) {
      if (abs(faceIdx - selectedFace) < 0.5) {
        s *= 1.6;
        float twinkle = 0.9 + 0.1 * sin(time * 2.0 + position.x * 10.0 + position.y * 7.0);
        opacity = twinkle;
      } else {
        s *= 0.6;
        opacity = dimFactor;
      }
    }

    gl_PointSize = min(s * (28.0 / -mvPosition.z), 12.0);
    gl_Position = projectionMatrix * mvPosition;
    vOpacity = opacity;
  }
`;

// ── Macrocosm star shaders ──────────────────────────────────────────

const macroStarVertexShader = `
  attribute float size;
  attribute float faceIdx;
  uniform float selectedFace;
  uniform float dimFactor;
  uniform float time;
  varying float vFaceIdx;
  varying float vOpacity;

  void main() {
    vFaceIdx = faceIdx;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float s = size;
    float opacity = 1.0;

    if (selectedFace >= 0.0) {
      if (abs(faceIdx - selectedFace) < 0.5) {
        s *= 1.6;
        float twinkle = 0.9 + 0.1 * sin(time * 2.0 + position.x * 10.0 + position.y * 7.0);
        opacity = twinkle;
      } else {
        s *= 0.6;
        opacity = dimFactor;
      }
    }

    gl_PointSize = min(s * (280.0 / -mvPosition.z), 14.0);
    gl_Position = projectionMatrix * mvPosition;
    vOpacity = opacity;
  }
`;

// ── Shared star fragment shader ─────────────────────────────────────

const starFragmentShader = `
  uniform vec3 baseColor;
  uniform vec3 faceColors[12];
  uniform float selectedFace;
  varying float vFaceIdx;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float alpha = smoothstep(0.5, 0.0, d) * vOpacity;

    vec3 color = baseColor;
    if (selectedFace >= 0.0 && abs(vFaceIdx - selectedFace) < 0.5) {
      int idx = int(vFaceIdx + 0.5);
      for (int i = 0; i < 12; i++) {
        if (i == idx) color = faceColors[i];
      }
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── MicrocosmStars ──────────────────────────────────────────────────

function MicrocosmStars({ selectedFace }) {
  const pointsRef = useRef();
  const { count, positions, sizes, faceIndices } = useSurfaceStars();

  const uniforms = useMemo(() => ({
    selectedFace: { value: -1.0 },
    faceColors: { value: FACE_COLORS },
    baseColor: { value: new THREE.Color('#fff4e0') },
    dimFactor: { value: 0.22 },
    time: { value: 0 },
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.time.value = state.clock.elapsedTime;
      pointsRef.current.material.uniforms.selectedFace.value =
        selectedFace !== null ? selectedFace : -1;
    }
  });

  return (
    <points ref={pointsRef} renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={count} itemSize={1} />
        <bufferAttribute attach="attributes-faceIdx" array={faceIndices} count={count} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={microStarVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── MacrocosmStars ──────────────────────────────────────────────────

function MacrocosmStars({ selectedFace }) {
  const pointsRef = useRef();
  const { count, positions, sizes, faceIndices } = useSphereStars();

  const uniforms = useMemo(() => ({
    selectedFace: { value: -1.0 },
    faceColors: { value: FACE_COLORS },
    baseColor: { value: new THREE.Color('#fff4e0') },
    dimFactor: { value: 0.22 },
    time: { value: 0 },
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.time.value = state.clock.elapsedTime;
      pointsRef.current.material.uniforms.selectedFace.value =
        selectedFace !== null ? selectedFace : -1;
    }
  });

  return (
    <points ref={pointsRef} renderOrder={6}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={count} itemSize={1} />
        <bufferAttribute attach="attributes-faceIdx" array={faceIndices} count={count} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={macroStarVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── useMicrocosmConstellations (face-projected) ─────────────────────

function useMicrocosmConstellations() {
  return useMemo(() => {
    const { mapToGeo } = _geo;

    const constFace = new Map();
    DODECAHEDRON_FACE_MAP.forEach((f, mapIdx) => {
      const geoIdx = mapToGeo[mapIdx];
      f.constellationIds.forEach(id => constFace.set(id, geoIdx));
    });

    const all = [];
    const perFace = Array.from({ length: GEO_FACE_CENTERS.length }, () => []);

    constellationsData.forEach(c => {
      const face = constFace.get(c.id);
      c.lines.forEach(([p1, p2]) => {
        const [s1x, s1y, s1z] = lonLatToXYZ(p1[0], p1[1], 1);
        const [s2x, s2y, s2z] = lonLatToXYZ(p2[0], p2[1], 1);

        const f1 = face !== undefined ? face : nearestFace(s1x, s1y, s1z);
        const f2 = face !== undefined ? face : nearestFace(s2x, s2y, s2z);

        const [x1, y1, z1] = projectToFace(s1x, s1y, s1z, f1, LINE_OFFSET);
        const [x2, y2, z2] = projectToFace(s2x, s2y, s2z, f2, LINE_OFFSET);

        all.push(x1, y1, z1, x2, y2, z2);
        if (face !== undefined && face < perFace.length) {
          perFace[face].push(x1, y1, z1, x2, y2, z2);
        }
      });
    });

    return {
      allPositions: new Float32Array(all),
      perFacePositions: perFace.map(a => a.length > 0 ? new Float32Array(a) : null),
    };
  }, []);
}

// ── useMacrocosmConstellations (proper sphere positions) ────────────

function useMacrocosmConstellations() {
  return useMemo(() => {
    const { mapToGeo } = _geo;

    const constFace = new Map();
    DODECAHEDRON_FACE_MAP.forEach((f, mapIdx) => {
      const geoIdx = mapToGeo[mapIdx];
      f.constellationIds.forEach(id => constFace.set(id, geoIdx));
    });

    const all = [];
    const perFace = Array.from({ length: GEO_FACE_CENTERS.length }, () => []);

    constellationsData.forEach(c => {
      const face = constFace.get(c.id);
      c.lines.forEach(([p1, p2]) => {
        const [x1, y1, z1] = lonLatToXYZ(p1[0], p1[1], OUTER_RADIUS);
        const [x2, y2, z2] = lonLatToXYZ(p2[0], p2[1], OUTER_RADIUS);

        all.push(x1, y1, z1, x2, y2, z2);

        if (face !== undefined && face < perFace.length) {
          perFace[face].push(x1, y1, z1, x2, y2, z2);
        }
      });
    });

    return {
      allPositions: new Float32Array(all),
      perFacePositions: perFace.map(a => a.length > 0 ? new Float32Array(a) : null),
    };
  }, []);
}

// ── MicrocosmLines ──────────────────────────────────────────────────

function MicrocosmLines({ selectedFace }) {
  const { allPositions, perFacePositions } = useMicrocosmConstellations();
  const overlayPositions = selectedFace !== null ? perFacePositions[selectedFace] : null;
  const baselineOpacity = selectedFace !== null ? 0.03 : 0.1;

  return (
    <group>
      <lineSegments renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={allPositions}
            count={allPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4a4a6a" transparent opacity={baselineOpacity} depthWrite={false} />
      </lineSegments>

      {overlayPositions && (
        <lineSegments key={selectedFace} renderOrder={3}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={overlayPositions}
              count={overlayPositions.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={FACE_COLORS[selectedFace]}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

// ── MacrocosmLines ──────────────────────────────────────────────────

function MacrocosmLines({ selectedFace }) {
  const { allPositions, perFacePositions } = useMacrocosmConstellations();
  const overlayPositions = selectedFace !== null ? perFacePositions[selectedFace] : null;
  const baselineOpacity = selectedFace !== null ? 0.03 : 0.08;

  return (
    <group>
      <lineSegments renderOrder={5}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={allPositions}
            count={allPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4a4a6a" transparent opacity={baselineOpacity} depthWrite={false} />
      </lineSegments>

      {overlayPositions && (
        <lineSegments key={selectedFace} renderOrder={7}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={overlayPositions}
              count={overlayPositions.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={FACE_COLORS[selectedFace]}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

// ── Roman Dodecahedron Features ─────────────────────────────────────

/** Generate line-segment pairs for a circle in 3D */
function circleSegments(cx, cy, cz, nx, ny, nz, radius, segs) {
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  const nnx = nx / len, nny = ny / len, nnz = nz / len;
  // Orthonormal basis in the circle plane
  const refX = Math.abs(nny) < 0.9 ? 0 : 1;
  const refY = Math.abs(nny) < 0.9 ? 1 : 0;
  const refZ = 0;
  let ux = nny * refZ - nnz * refY;
  let uy = nnz * refX - nnx * refZ;
  let uz = nnx * refY - nny * refX;
  const ulen = Math.sqrt(ux * ux + uy * uy + uz * uz);
  ux /= ulen; uy /= ulen; uz /= ulen;
  const vx = nny * uz - nnz * uy;
  const vy = nnz * ux - nnx * uz;
  const vz = nnx * uy - nny * ux;

  const out = [];
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2;
    const a2 = ((i + 1) / segs) * Math.PI * 2;
    const c1 = Math.cos(a1), s1 = Math.sin(a1);
    const c2 = Math.cos(a2), s2 = Math.sin(a2);
    out.push(
      cx + radius * (c1 * ux + s1 * vx),
      cy + radius * (c1 * uy + s1 * vy),
      cz + radius * (c1 * uz + s1 * vz),
      cx + radius * (c2 * ux + s2 * vx),
      cy + radius * (c2 * uy + s2 * vy),
      cz + radius * (c2 * uz + s2 * vz),
    );
  }
  return out;
}

function useRomanGeometry() {
  return useMemo(() => {
    const { vertices, faceInradius } = _geo;
    const knobSegs = [];
    const allRingSegs = [];
    const perFaceRingSegs = Array.from({ length: 12 }, () => []);

    // ── Knobs: 3 orthogonal circles at each of the 20 vertices ──
    for (let vi = 0; vi < vertices.length; vi++) {
      const v = vertices[vi];
      const vLen = v.length();
      const nx = v.x / vLen, ny = v.y / vLen, nz = v.z / vLen;
      // Knob center: vertex pushed outward
      const cx = nx * (INNER_SIZE + KNOB_PROTRUSION);
      const cy = ny * (INNER_SIZE + KNOB_PROTRUSION);
      const cz = nz * (INNER_SIZE + KNOB_PROTRUSION);
      const r = KNOB_RADIUS;

      // Circle 1: perpendicular to vertex normal (equatorial)
      knobSegs.push(...circleSegments(cx, cy, cz, nx, ny, nz, r, KNOB_SEGS));

      // Build tangent vectors for the other two circles
      const refX = Math.abs(ny) < 0.9 ? 0 : 1;
      const refY = Math.abs(ny) < 0.9 ? 1 : 0;
      let ux = ny * 0 - nz * refY, uy = nz * refX - nx * 0, uz = nx * refY - ny * refX;
      const ulen = Math.sqrt(ux * ux + uy * uy + uz * uz);
      ux /= ulen; uy /= ulen; uz /= ulen;
      const wx = ny * uz - nz * uy, wy = nz * ux - nx * uz, wz = nx * uy - ny * ux;

      // Circle 2: perpendicular to u (meridional)
      knobSegs.push(...circleSegments(cx, cy, cz, ux, uy, uz, r, KNOB_SEGS));
      // Circle 3: perpendicular to w (meridional)
      knobSegs.push(...circleSegments(cx, cy, cz, wx, wy, wz, r, KNOB_SEGS));
    }

    // ── Face rings: one circle per face, different sizes ──
    for (let fi = 0; fi < 12; fi++) {
      const fc = GEO_FACE_CENTERS[fi];
      const ringRadius = faceInradius * INNER_SIZE * RING_FRACTIONS[fi];
      // Ring center on face surface (slightly above to avoid z-fight)
      const offset = FACE_PLANE_DIST + 0.01;
      const cx = fc.x * offset, cy = fc.y * offset, cz = fc.z * offset;

      const segs = circleSegments(cx, cy, cz, fc.x, fc.y, fc.z, ringRadius, RING_SEGS);
      allRingSegs.push(...segs);
      perFaceRingSegs[fi].push(...segs);
    }

    return {
      knobPositions: new Float32Array(knobSegs),
      allRingPositions: new Float32Array(allRingSegs),
      perFaceRingPositions: perFaceRingSegs.map(a => a.length > 0 ? new Float32Array(a) : null),
    };
  }, []);
}

// Precompute solid knob positions (20 vertices pushed outward)
const _solidKnobData = _geo.vertices.map(v => {
  const len = v.length();
  const nx = v.x / len, ny = v.y / len, nz = v.z / len;
  return [
    nx * (INNER_SIZE + KNOB_PROTRUSION),
    ny * (INNER_SIZE + KNOB_PROTRUSION),
    nz * (INNER_SIZE + KNOB_PROTRUSION),
  ];
});

// ── Roman panel + ripple constants ────────────────────────────────────
const PANEL_DEPTH = 0.04;            // wall thickness
const RIPPLE_WAVES = 4;              // number of concentric wave crests
const RIPPLE_AMP = 0.012;            // max wave height (Z displacement)
const RIPPLE_AMP_TAPER = 0.7;        // amplitude decay from inner to outer wave
const RIPPLE_MARGIN = 0.08;          // keep ripples inside panel edge
const RIPPLE_RADIAL_SEGS = 48;       // segments around circumference
const RIPPLE_RING_SEGS = 24;         // segments from hole edge to panel edge

// Precompute gold pentagon panels with circular cutouts + ripple rings
const _romanPanelData = (() => {
  const { vertices, faceInradius, planeRatio } = _geo;
  const _up = new THREE.Vector3(0, 0, 1);

  return GEO_FACE_CENTERS.map((center, fi) => {
    const normal = center.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(_up, normal);
    const invQuat = quat.clone().invert();

    // Face center on the surface
    const faceCenter3D = normal.clone().multiplyScalar(FACE_PLANE_DIST);

    // Find the 5 vertices belonging to this face
    const localVerts = [];
    for (const v of vertices) {
      const vNorm = v.clone().normalize();
      if (Math.abs(vNorm.dot(normal) - planeRatio) < 0.02) {
        const v3d = v.clone().multiplyScalar(INNER_SIZE).sub(faceCenter3D);
        v3d.applyQuaternion(invQuat);
        localVerts.push({ x: v3d.x, y: v3d.y });
      }
    }

    // Sort by angle for proper CCW winding
    localVerts.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

    // Ring radius for circular cutout
    const ringRadius = faceInradius * INNER_SIZE * RING_FRACTIONS[fi];

    // Pentagon shape
    const shape = new THREE.Shape();
    if (localVerts.length >= 5) {
      shape.moveTo(localVerts[0].x, localVerts[0].y);
      for (let i = 1; i < localVerts.length; i++) {
        shape.lineTo(localVerts[i].x, localVerts[i].y);
      }
      shape.closePath();
    }

    // Circular hole
    const holePath = new THREE.Path();
    const holeSegs = 32;
    holePath.moveTo(ringRadius, 0);
    for (let i = 1; i <= holeSegs; i++) {
      const a = (i / holeSegs) * Math.PI * 2;
      holePath.lineTo(ringRadius * Math.cos(a), ringRadius * Math.sin(a));
    }
    shape.holes.push(holePath);

    // Flat panel — no side walls, seamless joins between faces
    const geometry = new THREE.ShapeGeometry(shape);

    // Tube inside the hole for wall thickness visible through the opening
    const holeWall = new THREE.CylinderGeometry(ringRadius, ringRadius, PANEL_DEPTH, 32, 1, true);
    holeWall.rotateX(Math.PI / 2); // align with face normal (Z)

    // Panel position on face surface
    const pos = normal.clone().multiplyScalar(FACE_PLANE_DIST);

    // Build a single ripple disc: annulus from hole edge to near panel edge
    // with sinusoidal Z displacement — smooth concentric water waves
    const panelInR = faceInradius * INNER_SIZE;
    const gap = panelInR - ringRadius;
    const usableGap = gap * (1 - RIPPLE_MARGIN);
    const outerZ = PANEL_DEPTH / 2;
    const innerR = ringRadius;
    const outerR = ringRadius + usableGap;

    const rippleGeo = new THREE.BufferGeometry();
    const rVerts = [];
    const rNorms = [];
    const rIdxs = [];

    for (let ri = 0; ri <= RIPPLE_RING_SEGS; ri++) {
      const t = ri / RIPPLE_RING_SEGS; // 0 (hole edge) → 1 (panel edge)
      const r = innerR + t * (outerR - innerR);
      // Sinusoidal wave: peaks decay outward
      const amp = RIPPLE_AMP * (1 - t * RIPPLE_AMP_TAPER);
      const wave = Math.sin(t * RIPPLE_WAVES * Math.PI * 2) * amp;

      for (let ai = 0; ai <= RIPPLE_RADIAL_SEGS; ai++) {
        const angle = (ai / RIPPLE_RADIAL_SEGS) * Math.PI * 2;
        rVerts.push(Math.cos(angle) * r, Math.sin(angle) * r, outerZ + wave);
        rNorms.push(0, 0, 1);
      }
    }

    for (let ri = 0; ri < RIPPLE_RING_SEGS; ri++) {
      for (let ai = 0; ai < RIPPLE_RADIAL_SEGS; ai++) {
        const a = ri * (RIPPLE_RADIAL_SEGS + 1) + ai;
        const b = a + 1;
        const c = a + (RIPPLE_RADIAL_SEGS + 1);
        const d = c + 1;
        rIdxs.push(a, c, b, b, c, d);
      }
    }

    rippleGeo.setAttribute('position', new THREE.Float32BufferAttribute(rVerts, 3));
    rippleGeo.setAttribute('normal', new THREE.Float32BufferAttribute(rNorms, 3));
    rippleGeo.setIndex(rIdxs);
    rippleGeo.computeVertexNormals();

    return {
      geometry,
      holeWall,
      position: [pos.x, pos.y, pos.z],
      quaternion: [quat.x, quat.y, quat.z, quat.w],
      rippleGeo,
    };
  });
})();

function RomanFeatures({ selectedFace, isRoman = false }) {
  const { knobPositions, allRingPositions, perFaceRingPositions } = useRomanGeometry();
  const overlayRing = selectedFace !== null ? perFaceRingPositions[selectedFace] : null;
  const baseOpacity = selectedFace !== null ? 0.25 : 0.4;

  const knobSphereGeo = useMemo(() => new THREE.SphereGeometry(KNOB_RADIUS, 12, 8), []);

  return (
    <group>
      {/* Vertex knobs — solid spheres in roman mode, wireframe circles otherwise */}
      {isRoman ? (
        _solidKnobData.map((pos, i) => (
          <mesh key={i} geometry={knobSphereGeo} position={pos} renderOrder={4}>
            <meshStandardMaterial
              color="#b08d57"
              emissive="#6b5630"
              emissiveIntensity={0.3}
              metalness={0.6}
              roughness={0.35}
            />
          </mesh>
        ))
      ) : (
        <lineSegments renderOrder={4}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={knobPositions}
              count={knobPositions.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#b08d57" transparent opacity={baseOpacity} depthWrite={false} />
        </lineSegments>
      )}

      {/* All face rings baseline — always wireframe */}
      <lineSegments renderOrder={4}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={allRingPositions}
            count={allRingPositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#b08d57" transparent opacity={baseOpacity} depthWrite={false} />
      </lineSegments>

      {/* Selected face ring highlight */}
      {overlayRing && (
        <lineSegments key={selectedFace} renderOrder={5}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={overlayRing}
              count={overlayRing.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={FACE_COLORS[selectedFace]}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </lineSegments>
      )}

      {/* Gold pentagonal panels with ripple rings — roman mode only */}
      {isRoman && _romanPanelData.map((panel, i) => (
        <group key={`panel-${i}`} position={panel.position} quaternion={panel.quaternion}>
          {/* Flat panel — seamless joins between faces */}
          <mesh geometry={panel.geometry} renderOrder={3}>
            <meshStandardMaterial
              color="#b08d57"
              emissive="#6b5630"
              emissiveIntensity={0.2}
              metalness={0.6}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Tube inside hole — wall thickness visible through opening */}
          <mesh geometry={panel.holeWall} renderOrder={3}>
            <meshStandardMaterial
              color="#8a7040"
              emissive="#4a3a20"
              emissiveIntensity={0.15}
              metalness={0.6}
              roughness={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Ripple disc — smooth sinusoidal water waves radiating from hole */}
          <mesh geometry={panel.rippleGeo} renderOrder={4}>
            <meshStandardMaterial
              color="#b08d57"
              emissive="#6b5630"
              emissiveIntensity={0.15}
              metalness={0.6}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── FaceNumbers (die mode) ───────────────────────────────────────────

const _faceNumberData = (() => {
  const { faceNumbers, faceInradius } = _geo;
  const _up = new THREE.Vector3(0, 0, 1);
  return GEO_FACE_CENTERS.map((center, i) => {
    // Canvas texture with the number
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(faceNumbers[i]), 64, 66);

    const texture = new THREE.CanvasTexture(canvas);

    // Position on face surface
    const pos = center.clone().multiplyScalar(FACE_PLANE_DIST + 0.02);

    // Quaternion to rotate from +Z to face normal direction
    const quat = new THREE.Quaternion().setFromUnitVectors(_up, center.clone().normalize());

    const ringRadius = faceInradius * INNER_SIZE * RING_FRACTIONS[i];
    const size = Math.max(ringRadius * 0.9, 0.25);

    return { texture, position: [pos.x, pos.y, pos.z], quaternion: [quat.x, quat.y, quat.z, quat.w], size };
  });
})();

function FaceNumbers() {
  const planeGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  return (
    <group>
      {_faceNumberData.map((f, i) => (
        <mesh
          key={i}
          geometry={planeGeo}
          position={f.position}
          quaternion={f.quaternion}
          scale={[f.size, f.size, 1]}
          renderOrder={5}
        >
          <meshBasicMaterial
            map={f.texture}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── MicrocosmShell ──────────────────────────────────────────────────

function MicrocosmShell({ selectedFace, onFaceClick, isDie = false, isRoman = false, groupRef }) {
  const [hovered, setHovered] = useState(false);

  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(INNER_SIZE, 0);
    g.applyQuaternion(_geo.alignQuat);
    return g;
  }, []);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  const faceColor = selectedFace !== null ? FACE_COLORS[selectedFace] : null;

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const point = e.point.clone();
    // Transform from world space to group's local space when group is rotated
    if (groupRef?.current) {
      const invQuat = groupRef.current.quaternion.clone().invert();
      point.applyQuaternion(invQuat);
    }
    point.normalize();
    onFaceClick(nearestFace(point.x, point.y, point.z));
  }, [onFaceClick, groupRef]);

  return (
    <group>
      <mesh
        geometry={geo}
        renderOrder={0}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {isDie ? (
          <meshStandardMaterial
            color="#1a1a2e"
            emissive={faceColor || '#0a0a14'}
            emissiveIntensity={faceColor ? 0.3 : 0.08}
            metalness={0.05}
            roughness={0.45}
            flatShading
          />
        ) : (
          /* Stars & roman: invisible shell, click-target only */
          <meshBasicMaterial visible={false} />
        )}
      </mesh>

      {!isRoman && !isDie && (
        <lineSegments geometry={edgesGeo} renderOrder={4}>
          <lineBasicMaterial color="#b08d57" transparent opacity={hovered ? 0.8 : 0.5} depthWrite={false} />
        </lineSegments>
      )}

      <pointLight
        color={faceColor ? faceColor : '#fff8f0'}
        intensity={selectedFace !== null ? 1.5 : 0.4}
        distance={INNER_SIZE * 6}
        decay={2}
      />
    </group>
  );
}

// ── MacrocosmShell ──────────────────────────────────────────────────

function MacrocosmShell({ selectedFace }) {
  const edgesGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(OUTER_RADIUS, 0);
    geo.applyQuaternion(_geo.alignQuat);
    const edges = new THREE.EdgesGeometry(geo);
    geo.dispose();
    return edges;
  }, []);

  const opacity = selectedFace !== null ? 0.35 : 0.15;

  return (
    <lineSegments geometry={edgesGeo} renderOrder={8}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// ── Coin inside dodecahedron ─────────────────────────────────────────

// Precompute the 3 bottom face indices (most negative Y normals — faces adjacent to bottom vertex)
const _bottomFaceIndices = GEO_FACE_CENTERS
  .map((c, i) => ({ idx: i, ny: c.y }))
  .sort((a, b) => a.ny - b.ny)
  .slice(0, 3)
  .map(f => f.idx);

// Coin texture cache — side-by-side images split into obverse/reverse, or single-face images
const _coinTexCache = {};
const _texLoader = new THREE.TextureLoader();

const _coinTexDefs = {
  gold:   { src: '/coins/aureus.jpeg',    split: true },
  silver: { src: '/coins/denarius.png',   split: true },
  copper: { src: '/coins/sestertius.jpg', split: false },
};

function _loadCoinTextures(coinId) {
  if (_coinTexCache[coinId]) return _coinTexCache[coinId];
  const def = _coinTexDefs[coinId];
  if (!def) { _coinTexCache[coinId] = null; return null; }

  const makeTex = (repeatX, offsetX) => {
    const tex = _texLoader.load(def.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(repeatX, 1);
    tex.offset.set(offsetX, 0);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  };

  let result;
  if (def.split) {
    // Side-by-side: left half = obverse, right half = reverse
    result = { obverse: makeTex(0.5, 0), reverse: makeTex(0.5, 0.5) };
  } else {
    // Single face image — same texture for both caps
    result = { obverse: makeTex(1, 0), reverse: makeTex(1, 0) };
  }
  _coinTexCache[coinId] = result;
  return result;
}

function CoinMesh({ coin, dodecRealRadius }) {
  const { coinRadius, coinHeight, restY } = useMemo(() => {
    const realR = dodecRealRadius;
    const cR = (coin.diameter / 2 / realR) * INNER_SIZE;

    const vol_cm3 = coin.weight / coin.density;
    const radius_cm = coin.diameter / 20;
    const h_mm = (vol_cm3 / (Math.PI * radius_cm * radius_cm)) * 10;
    const cH = (h_mm / realR) * INNER_SIZE;

    let y = -Infinity;
    for (const fi of _bottomFaceIndices) {
      const n = GEO_FACE_CENTERS[fi];
      const horiz = Math.sqrt(n.x * n.x + n.z * n.z);
      const fy = (FACE_PLANE_DIST - horiz * cR) / n.y;
      if (fy > y) y = fy;
    }

    return { coinRadius: cR, coinHeight: cH, restY: y + cH / 2 };
  }, [coin.diameter, coin.weight, coin.density, dodecRealRadius]);

  // Build materials: [side, top cap (obverse), bottom cap (reverse)]
  const materials = useMemo(() => {
    const textures = _loadCoinTextures(coin.id);
    const side = new THREE.MeshStandardMaterial({
      color: coin.color,
      metalness: 0.85,
      roughness: 0.2,
      emissive: new THREE.Color(coin.color),
      emissiveIntensity: 0.08,
    });

    if (!textures) {
      // Copper / no texture — same material for all faces
      return [side, side, side];
    }

    const capProps = {
      metalness: 0.5,
      roughness: 0.35,
      emissive: new THREE.Color(coin.color),
      emissiveIntensity: 0.05,
    };
    const top = new THREE.MeshStandardMaterial({ map: textures.obverse, ...capProps });
    const bottom = new THREE.MeshStandardMaterial({ map: textures.reverse, ...capProps });
    return [side, top, bottom];
  }, [coin.id, coin.color]);

  return (
    <mesh position={[0, restY, 0]} material={materials}>
      <cylinderGeometry args={[coinRadius, coinRadius, coinHeight, 32]} />
    </mesh>
  );
}

// ── Main Scene ──────────────────────────────────────────────────────

export default function DodecahedronScene({ selectedFace, onFaceClick, lit = true, mode = 'stars', rollState, onRollComplete, waterActive = false, coinData = null, dodecRealRadius = 34 }) {
  const isDie = mode === 'die';
  const isRoman = mode === 'roman';
  const starsOn = lit;
  const faceHighlight = starsOn ? selectedFace : null;

  const groupRef = useRef();
  const { camera } = useThree();

  // Roll animation state
  const rollAnim = useRef({
    phase: 'idle',
    elapsed: 0,
    axis: new THREE.Vector3(),
    wobbleAxis: new THREE.Vector3(),
    targetQuat: new THREE.Quaternion(),
  });

  // Initialize roll animation when rollState changes
  useEffect(() => {
    if (rollState?.rolling && rollState.targetGeoIdx != null) {
      const cameraDir = camera.position.clone().normalize();
      const faceNormal = GEO_FACE_CENTERS[rollState.targetGeoIdx].clone().normalize();
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(faceNormal, cameraDir);

      const anim = rollAnim.current;
      anim.phase = 'tumble';
      anim.elapsed = 0;
      anim.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      anim.wobbleAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      anim.targetQuat.copy(targetQuat);
    }
  }, [rollState?.rolling, rollState?.targetGeoIdx, camera]);

  // 3-phase roll animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const anim = rollAnim.current;
    if (anim.phase === 'idle') return;

    anim.elapsed += delta;

    if (anim.phase === 'tumble') {
      if (anim.elapsed >= ROLL_TUMBLE_DURATION) {
        anim.phase = 'decelerate';
        anim.elapsed = 0;
      }
      // Chaotic spin: wobble between two random axes
      const wobble = Math.sin(anim.elapsed * Math.PI * 4) * 0.5;
      _rollVec.copy(anim.axis).lerp(anim.wobbleAxis, Math.abs(wobble)).normalize();
      _rollQuat.setFromAxisAngle(_rollVec, ROLL_TUMBLE_SPEED * delta);
      groupRef.current.quaternion.premultiply(_rollQuat);
    } else if (anim.phase === 'decelerate') {
      if (anim.elapsed >= ROLL_DECEL_DURATION) {
        anim.phase = 'settle';
        anim.elapsed = 0;
        return;
      }
      // Quadratic ease-out
      const t = anim.elapsed / ROLL_DECEL_DURATION;
      const speed = ROLL_TUMBLE_SPEED * (1 - t) * (1 - t);
      _rollQuat.setFromAxisAngle(anim.axis, speed * delta);
      groupRef.current.quaternion.premultiply(_rollQuat);
    } else if (anim.phase === 'settle') {
      // Exponential slerp toward target
      const alpha = 1 - Math.exp(-ROLL_SETTLE_SPEED * delta);
      groupRef.current.quaternion.slerp(anim.targetQuat, alpha);

      const dot = Math.abs(groupRef.current.quaternion.dot(anim.targetQuat));
      if (dot > 0.9999) {
        groupRef.current.quaternion.copy(anim.targetQuat);
        anim.phase = 'idle';
        if (onRollComplete) onRollComplete();
      }
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <ambientLight intensity={starsOn ? 0.2 : 0.06} />
        <directionalLight position={[8, 8, 8]} intensity={starsOn ? 0.75 : 0.2} />
        <directionalLight position={[-5, -3, 6]} intensity={starsOn ? 0.4 : 0.1} />
        <directionalLight position={[2, -6, -4]} intensity={starsOn ? 0.2 : 0.05} />

        <MicrocosmShell selectedFace={faceHighlight} onFaceClick={onFaceClick} isDie={isDie} isRoman={isRoman} groupRef={groupRef} />
        {!isDie && <RomanFeatures selectedFace={faceHighlight} isRoman={isRoman} />}
        {isRoman && coinData && <CoinMesh key={coinData._nonce} coin={coinData} dodecRealRadius={dodecRealRadius} />}
        {isDie && <FaceNumbers />}
        {starsOn && <MicrocosmLines selectedFace={selectedFace} />}
        {starsOn && <MicrocosmStars selectedFace={selectedFace} />}
        {starsOn && <MacrocosmLines selectedFace={selectedFace} />}
        {starsOn && <MacrocosmStars selectedFace={selectedFace} />}
        {starsOn && <MacrocosmShell selectedFace={selectedFace} />}
      </group>
      <WaterEffect active={waterActive && isRoman} />
    </>
  );
}
