import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Water surface: horizontal plane with sine-wave vertex displacement ──

const waterSurfaceVertexShader = `
  uniform float uTime;
  uniform float uWaterY;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    vec3 pos = position;

    // 3 octaves of sine-wave displacement
    float wave1 = sin(pos.x * 0.15 + uTime * 1.2) * cos(pos.z * 0.12 + uTime * 0.8) * 0.8;
    float wave2 = sin(pos.x * 0.3 + pos.z * 0.2 + uTime * 2.0) * 0.3;
    float wave3 = sin(pos.x * 0.6 - uTime * 1.5) * sin(pos.z * 0.5 + uTime * 1.8) * 0.12;
    pos.y += wave1 + wave2 + wave3;

    // Approximate normal from wave derivatives
    float dx1 = cos(pos.x * 0.15 + uTime * 1.2) * 0.15 * cos(pos.z * 0.12 + uTime * 0.8) * 0.8;
    float dx2 = cos(pos.x * 0.3 + pos.z * 0.2 + uTime * 2.0) * 0.3 * 0.3;
    float dz1 = sin(pos.x * 0.15 + uTime * 1.2) * (-sin(pos.z * 0.12 + uTime * 0.8)) * 0.12 * 0.8;
    float dz2 = cos(pos.x * 0.3 + pos.z * 0.2 + uTime * 2.0) * 0.3 * 0.2;
    vec3 n = normalize(vec3(-(dx1 + dx2), 1.0, -(dz1 + dz2)));
    vNormal = normalMatrix * n;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterSurfaceFragmentShader = `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  uniform float uTime;

  void main() {
    // Fresnel-like edge brightening
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));
    fresnel = pow(fresnel, 2.0);

    vec3 deepColor = vec3(0.05, 0.15, 0.3);
    vec3 edgeColor = vec3(0.2, 0.4, 0.6);
    vec3 color = mix(deepColor, edgeColor, fresnel);

    // Subtle shimmer
    float shimmer = sin(vWorldPos.x * 0.5 + uTime * 0.7) * sin(vWorldPos.z * 0.4 + uTime * 0.9) * 0.05;

    float alpha = 0.25 + fresnel * 0.25 + shimmer;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Underwater tint: screen-space quad with caustics + depth-graded blue ──

const underwaterTintVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const underwaterTintFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uWaterLevel;

  void main() {
    // Water line in screen space: maps waterLevel 0..1 to bottom..top
    float waterLine = uWaterLevel;

    // Discard above the water line (upper part of screen is clear)
    if (vUv.y > waterLine) discard;

    // Depth factor: 0 at surface, 1 at bottom
    float depth = 1.0 - (vUv.y / max(waterLine, 0.001));

    // Depth-graded blue tint
    vec3 shallow = vec3(0.051, 0.149, 0.302);  // rgba(13,38,77) normalized
    vec3 deep    = vec3(0.020, 0.078, 0.180);   // rgba(5,20,46) normalized
    vec3 tintColor = mix(shallow, deep, depth);
    float tintAlpha = mix(0.08, 0.35, depth);

    // Caustic pattern: two rotated sine grids interfering
    float angle1 = 0.3;
    float angle2 = -0.5;
    vec2 uv1 = vec2(
      vUv.x * cos(angle1) - vUv.y * sin(angle1),
      vUv.x * sin(angle1) + vUv.y * cos(angle1)
    );
    vec2 uv2 = vec2(
      vUv.x * cos(angle2) - vUv.y * sin(angle2),
      vUv.x * sin(angle2) + vUv.y * cos(angle2)
    );

    float scale = 8.0;
    float a1 = sin(uv1.x * scale + uTime * 0.8) * sin(uv1.y * scale + uTime * 0.6);
    float a2 = sin(uv2.x * scale * 1.3 + uTime * 0.5) * sin(uv2.y * scale * 1.1 + uTime * 0.7);

    float caustic = pow(max(a1 + a2, 0.0), 2.0) * 0.5;

    // Caustics brighter near surface, fade with depth
    float causticMask = (1.0 - depth * 0.8);
    caustic *= causticMask;

    vec3 finalColor = tintColor + vec3(caustic * 0.15, caustic * 0.2, caustic * 0.3);
    float finalAlpha = tintAlpha + caustic * 0.08;

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

// ── WaterEffect component ────────────────────────────────────────────────

export default function WaterEffect({ active }) {
  const surfaceRef = useRef();
  const tintRef = useRef();
  const waterLevel = useRef(0);
  const wasActive = useRef(false);

  const surfaceUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaterY: { value: -90 },
  }), []);

  const tintUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaterLevel: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Animate waterLevel: fill (0→1, ~4s ease-out) or drain (1→0, ~3s ease-in)
    if (active) {
      if (waterLevel.current < 1) {
        const speed = 0.25; // 1/4s base
        const easeOut = 1 - waterLevel.current; // slows as it fills
        waterLevel.current = Math.min(1, waterLevel.current + delta * speed * (0.3 + easeOut * 0.7));
      }
    } else {
      if (waterLevel.current > 0) {
        const speed = 0.33; // 1/3s base
        const easeIn = waterLevel.current; // slows near bottom
        waterLevel.current = Math.max(0, waterLevel.current - delta * speed * (0.3 + easeIn * 0.7));
      }
    }

    wasActive.current = active;

    const level = waterLevel.current;
    const visible = level > 0.001;

    // Water surface Y: -90 (offscreen below) → 25 (above dodecahedron center)
    const surfaceY = -90 + level * 115;

    // Update surface
    if (surfaceRef.current) {
      surfaceRef.current.visible = visible;
      surfaceRef.current.position.y = surfaceY;
      surfaceRef.current.material.uniforms.uTime.value = t;
      surfaceRef.current.material.uniforms.uWaterY.value = surfaceY;
    }

    // Update tint
    if (tintRef.current) {
      tintRef.current.visible = visible;
      // Map waterLevel to screen-space fraction (approximate: 0 = bottom, ~0.7 = above center)
      tintRef.current.material.uniforms.uTime.value = t;
      tintRef.current.material.uniforms.uWaterLevel.value = level * 0.75;
    }
  });

  return (
    <>
      {/* Water surface plane */}
      <mesh
        ref={surfaceRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -90, 0]}
        visible={false}
        renderOrder={900}
        raycast={() => {}}
      >
        <planeGeometry args={[200, 200, 64, 64]} />
        <shaderMaterial
          vertexShader={waterSurfaceVertexShader}
          fragmentShader={waterSurfaceFragmentShader}
          uniforms={surfaceUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Underwater tint quad (screen-space) */}
      <mesh
        ref={tintRef}
        frustumCulled={false}
        visible={false}
        renderOrder={999}
        raycast={() => {}}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          vertexShader={underwaterTintVertexShader}
          fragmentShader={underwaterTintFragmentShader}
          uniforms={tintUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
