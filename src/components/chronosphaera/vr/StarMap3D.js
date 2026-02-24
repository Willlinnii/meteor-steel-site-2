import React, { useMemo } from 'react';
import * as THREE from 'three';
import starsNorth from '../../../data/starsNorth.json';
import starsSouth from '../../../data/starsSouth.json';
import constellations from '../../../data/constellations.json';
import { STAR_SPHERE_RADIUS } from './constants3D';

const DEG2RAD = Math.PI / 180;

function lonLatToXYZ(lon, lat, radius) {
  const raRad = -lon * DEG2RAD;
  const decRad = lat * DEG2RAD;
  return [
    radius * Math.cos(decRad) * Math.cos(raRad),
    radius * Math.sin(decRad),
    radius * Math.cos(decRad) * Math.sin(raRad),
  ];
}

export default function StarMap3D({ cameraAR }) {
  const { starGeometry, lineGeometry } = useMemo(() => {
    // --- Stars ---
    const allStars = starsNorth.concat(starsSouth);
    const count = allStars.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const [lon, lat, mag] = allStars[i];
      const [x, y, z] = lonLatToXYZ(lon, lat, STAR_SPHERE_RADIUS);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      // Brighter stars (lower mag) get larger points
      sizes[i] = Math.max(0.15, 0.3 + (6 - mag) * 0.25);
    }

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // --- Constellation lines ---
    const lineVerts = [];
    const lineR = STAR_SPHERE_RADIUS - 0.5;

    for (const c of constellations) {
      for (const seg of c.lines) {
        const [lon1, lat1] = seg[0];
        const [lon2, lat2] = seg[1];
        lineVerts.push(...lonLatToXYZ(lon1, lat1, lineR));
        lineVerts.push(...lonLatToXYZ(lon2, lat2, lineR));
      }
    }

    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(lineVerts), 3)
    );

    return { starGeometry: sGeo, lineGeometry: lGeo };
  }, []);

  // Custom shader for variable-size star points
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#e8e0d0') },
        opacity: { value: 0.85 },
        scale: { value: cameraAR ? 0.6 : 1.0 },
      },
      vertexShader: `
        attribute float size;
        uniform float scale;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * scale * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        void main() {
          // Soft circular point
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = opacity * smoothstep(0.5, 0.15, d);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [cameraAR]);

  return (
    <group>
      {/* Star points */}
      <points geometry={starGeometry} material={starMaterial} />

      {/* Constellation stick figures */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color="#e8e0d0"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
