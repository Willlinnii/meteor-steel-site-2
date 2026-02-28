import React, { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec3 vNormalView;
  void main() {
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uPhase;
  uniform vec3 uColor;
  uniform float uEmissiveIntensity;

  varying vec3 vNormalView;

  void main() {
    // Sun direction in view space from phase angle
    // 0=new (sun behind moon), 90=first quarter (sun to right),
    // 180=full (sun in front), 270=last quarter (sun to left)
    float phaseRad = uPhase * 3.14159265 / 180.0;
    vec3 sunDir = normalize(vec3(sin(phaseRad), 0.0, -cos(phaseRad)));

    float illum = dot(vNormalView, sunDir);

    // Soft terminator edge
    float terminator = smoothstep(-0.04, 0.04, illum);

    // Discard dark-side fragments so background shows through
    if (terminator < 0.01) discard;

    // Diffuse shading on lit side
    float diffuse = max(illum, 0.0);
    vec3 lit = uColor * (0.3 + 0.7 * diffuse);

    // Emissive glow for hover/selected
    vec3 emissive = uColor * uEmissiveIntensity;

    gl_FragColor = vec4(lit + emissive, terminator);
  }
`;

// Moon crescent shader — discards dark-side fragments for a true crescent silhouette.
// phase: 0-360 (0=new/invisible, 90=first quarter, 180=full, 270=last quarter)
export default function MoonPhase3D({ radius, phase = 135, color = '#e8e8f0', emissiveIntensity = 0.2 }) {
  const uniforms = useMemo(() => ({
    uPhase: { value: phase },
    uColor: { value: new THREE.Color(color) },
    uEmissiveIntensity: { value: emissiveIntensity },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update uniforms reactively without recreating material
  useMemo(() => {
    uniforms.uPhase.value = phase;
    uniforms.uColor.value.set(color);
    uniforms.uEmissiveIntensity.value = emissiveIntensity;
  }, [phase, color, emissiveIntensity, uniforms]);

  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
