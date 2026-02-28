import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import Gemstone3D from '../Crown/Gemstone3D';
import StarMap3D from '../../components/chronosphaera/vr/StarMap3D';
import ZodiacSphere from '../../components/chronosphaera/vr/ZodiacSphere';
import Planet3D from '../../components/chronosphaera/vr/Planet3D';
import { ZODIAC_RADIUS, PLANET_COLORS } from '../../components/chronosphaera/vr/constants3D';

// ── Mountain level data (bottom → top): Chaldean order ──────────────
// Metal colors/properties sourced from CrownScene METAL_DEFS
const MOUNTAIN_LEVELS = [
  { planet: 'Saturn',  metal: 'Lead',        color: '#5a5a62', metalness: 0.55, roughness: 0.45 },
  { planet: 'Venus',   metal: 'Copper',      color: '#b56a3a', metalness: 0.82, roughness: 0.25 },
  { planet: 'Jupiter', metal: 'Tin',          color: '#8e8e8e', metalness: 0.70, roughness: 0.32 },
  { planet: 'Mercury', metal: 'Quicksilver',  color: '#6a6e78', metalness: 0.75, roughness: 0.35 },
  { planet: 'Mars',    metal: 'Iron',         color: '#a07840', metalness: 0.80, roughness: 0.28 },
  { planet: 'Moon',    metal: 'Silver',       color: '#e8e8f0', metalness: 0.70, roughness: 0.20 },
  { planet: 'Sun',     metal: 'Gold',         color: '#c9a961', metalness: 0.85, roughness: 0.18 },
];

// Gemstone colors matching Gemstone3D GEMSTONE_DATA (Navaratna correspondences)
const GEM_COLORS = {
  Saturn:  '#1838a0',
  Venus:   '#f0f4ff',
  Jupiter: '#e8b820',
  Mercury: '#1ba34a',
  Mars:    '#e05030',
  Moon:    '#f0eee8',
  Sun:     '#e01030',
};

// ── Ore / mineral definitions per level ─────────────────────────────
// Uncut ores embedded in each metal tier of the mountain
const ORE_DEFS = [
  // Saturn / Lead
  [{ name: 'Galena', color: '#7a7a88', emissive: '#3a3a44', roughness: 0.25, metalness: 0.7, geo: 'box' }],
  // Venus / Copper
  [
    { name: 'Malachite', color: '#1a8a42', emissive: '#0a5528', roughness: 0.5, metalness: 0.15, geo: 'icosa' },
    { name: 'Azurite',   color: '#1838b0', emissive: '#0c1c68', roughness: 0.4, metalness: 0.2,  geo: 'icosa' },
  ],
  // Jupiter / Tin
  [
    { name: 'Diamond',  color: '#e8eeff', emissive: '#c0c8e8', roughness: 0.05, metalness: 0.1, geo: 'octa' },
    { name: 'Cinnabar', color: '#cc2200', emissive: '#881500', roughness: 0.4,  metalness: 0.3, geo: 'icosa' },
  ],
  // Mercury / Quicksilver — cinnabar is THE mercury ore
  [{ name: 'Cinnabar', color: '#cc2200', emissive: '#881500', roughness: 0.4, metalness: 0.3, geo: 'icosa' }],
  // Mars / Iron (meteor steel)
  [
    { name: 'Garnet',   color: '#8b1a1a', emissive: '#4a0d0d', roughness: 0.35, metalness: 0.15, geo: 'dodeca' },
    { name: 'Hematite', color: '#2a2a32', emissive: '#1a1a20', roughness: 0.2,  metalness: 0.75, geo: 'box' },
  ],
  // Moon / Silver
  [{ name: 'Amethyst', color: '#7b2d8e', emissive: '#3d1647', roughness: 0.3, metalness: 0.1, geo: 'icosa' }],
  // Sun / Gold
  [{ name: 'Topaz', color: '#d4a017', emissive: '#8a6810', roughness: 0.2, metalness: 0.25, geo: 'icosa' }],
];

const LEVEL_HEIGHT = 1.6;
const BASE_RADIUS = 4.5;
const TOP_RADIUS = 0.5;
const TOTAL_LEVELS = MOUNTAIN_LEVELS.length;
const GROOVE_SCALE = 0.93; // mountain surface indented ~7% from original cone for spiral groove

// ── Seeded random for stable ore placement ──────────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Ore geometry factory ────────────────────────────────────────────
const geoCache = {};
function makeOreGeo(type) {
  if (!geoCache[type]) {
    switch (type) {
      case 'box':    geoCache[type] = new THREE.BoxGeometry(1, 1, 1); break;
      case 'dodeca': geoCache[type] = new THREE.DodecahedronGeometry(1, 0); break;
      case 'octa':   geoCache[type] = new THREE.OctahedronGeometry(1, 0); break;
      default:       geoCache[type] = new THREE.IcosahedronGeometry(1, 0); break;
    }
  }
  return geoCache[type];
}

// ── Single ore chunk (tagged + hoverable + clickable) ────────────────
function OreChunk({ ore, position, scale, rotation, hoveredOre, onHoverOre, onSelect, levelPlanet, levelMetal }) {
  const geo = useMemo(() => makeOreGeo(ore.geo), [ore.geo]);
  const isLit = hoveredOre === ore.name;

  const handleOver = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    onHoverOre(ore.name);
  }, [ore.name, onHoverOre]);

  const handleOut = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = '';
    onHoverOre(null);
  }, [onHoverOre]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onSelect) onSelect({ type: 'ore', name: ore.name, color: ore.color, planet: levelPlanet, metal: levelMetal });
  }, [ore.name, ore.color, levelPlanet, levelMetal, onSelect]);

  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation}
      geometry={geo}
      userData={{ oreName: ore.name }}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <meshStandardMaterial
        color={ore.color}
        emissive={ore.emissive}
        emissiveIntensity={isLit ? 0.9 : 0.15}
        roughness={isLit ? ore.roughness * 0.6 : ore.roughness}
        metalness={ore.metalness}
      />
    </mesh>
  );
}

// ── Scatter ores around a mountain level ────────────────────────────
function OreScatter({ ores, radius, levelIndex, hoveredOre, onHoverOre, onSelect, levelPlanet, levelMetal }) {
  const placements = useMemo(() => {
    const rng = seededRandom(levelIndex * 777 + 42);
    const items = [];
    const count = ores.length === 1 ? 12 : 8;

    ores.forEach((ore, oi) => {
      for (let j = 0; j < count; j++) {
        const angle = rng() * Math.PI * 2;
        const hFrac = rng() * 0.8 + 0.1;
        const h = hFrac * LEVEL_HEIGHT - LEVEL_HEIGHT / 2;
        const x = Math.cos(angle) * radius * 0.97;
        const z = Math.sin(angle) * radius * 0.97;

        const baseSize = 0.12 + rng() * 0.12;
        const s = baseSize * (0.7 + (radius / 12.0) * 0.3);

        items.push({
          ore,
          key: `${oi}-${j}`,
          position: [x, h, z],
          scale: [s * (0.8 + rng() * 0.4), s * (0.7 + rng() * 0.6), s * (0.8 + rng() * 0.4)],
          rotation: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI],
        });
      }
    });
    return items;
  }, [ores, radius, levelIndex]);

  return (
    <>
      {placements.map((p) => (
        <OreChunk
          key={p.key}
          ore={p.ore}
          position={p.position}
          scale={p.scale}
          rotation={p.rotation}
          hoveredOre={hoveredOre}
          onHoverOre={onHoverOre}
          onSelect={onSelect}
          levelPlanet={levelPlanet}
          levelMetal={levelMetal}
        />
      ))}
    </>
  );
}

// ── Day-of-week order for gem orbits (Sun excluded — sits at peak) ───
const ORBITING_PLANETS = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ── Orbit hook: all gems share one anglesRef ────────────────────────
function useArtBookOrbits(draggingRef) {
  const anglesRef = useRef(null);
  if (anglesRef.current === null) {
    const init = {};
    ORBITING_PLANETS.forEach((planet, i) => {
      init[planet] = (i / ORBITING_PLANETS.length) * Math.PI * 2;
    });
    anglesRef.current = init;
  }

  useFrame((_, delta) => {
    if (draggingRef?.current) return;
    const dt = Math.min(delta, 0.1);
    const speed = 0.05; // rad/s
    for (const planet of ORBITING_PLANETS) {
      anglesRef.current[planet] += speed * dt;
    }
  });

  return anglesRef;
}

// ── Single orbiting gem ─────────────────────────────────────────────
function OrbitingGem({ planet, orbitRadius, orbitY, anglesRef, selected, onSelect }) {
  const groupRef = useRef();
  const gemSize = Math.max(0.2, orbitRadius * 0.12);

  useFrame(() => {
    if (!groupRef.current || !anglesRef.current) return;
    const angle = anglesRef.current[planet] || 0;
    groupRef.current.position.x = Math.cos(angle) * orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * orbitRadius;
    groupRef.current.position.y = orbitY;
  });

  const handleClick = useCallback(() => {
    if (onSelect) onSelect({ type: 'gem', planet });
  }, [planet, onSelect]);

  return (
    <group ref={groupRef}>
      <Gemstone3D
        planet={planet}
        position={[0, 0, 0]}
        size={gemSize}
        selected={selected}
        onClick={handleClick}
      />
    </group>
  );
}

// ── Mountain level — smooth cone frustum per metal band ───────────────
function MountainLevel({ level, index, hoveredOre, onHoverOre, onSelect, selectedPlanet }) {
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedPlanet === level.planet;
  // Indent radii so the spiral road ledge protrudes to the original cone surface
  const rBot = (BASE_RADIUS - (index / TOTAL_LEVELS) * (BASE_RADIUS - TOP_RADIUS)) * GROOVE_SCALE;
  const rTop = (BASE_RADIUS - ((index + 1) / TOTAL_LEVELS) * (BASE_RADIUS - TOP_RADIUS)) * GROOVE_SCALE;

  return (
    <group position={[0, (index + 1) * LEVEL_HEIGHT, 0]}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect?.({ type: 'metal', planet: level.planet, metal: level.metal, color: level.color }); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = ''; }}
      >
        <cylinderGeometry args={[rTop, rBot, LEVEL_HEIGHT, 32]} />
        <meshStandardMaterial
          color={level.color}
          metalness={level.metalness}
          roughness={hovered ? level.roughness * 0.7 : level.roughness}
          emissive={level.color}
          emissiveIntensity={isSelected ? 0.25 : hovered ? 0.15 : 0}
        />
      </mesh>
      <OreScatter
        ores={ORE_DEFS[index]}
        radius={(rBot + rTop) / 2}
        levelIndex={index}
        hoveredOre={hoveredOre}
        onHoverOre={onHoverOre}
        onSelect={onSelect}
        levelPlanet={level.planet}
        levelMetal={level.metal}
      />
    </group>
  );
}

// ── Peak gem (Ruby / Sun) — sits above the gold cone tip ────────────
function PeakGem({ selected, onSelect }) {
  const peakY = (TOTAL_LEVELS + 0.5) * LEVEL_HEIGHT + 0.4;

  const handleClick = useCallback(() => {
    if (onSelect) onSelect({ type: 'gem', planet: 'Sun' });
  }, [onSelect]);

  return (
    <Gemstone3D
      planet="Sun"
      position={[0, peakY, 0]}
      size={0.35}
      selected={selected}
      onClick={handleClick}
    />
  );
}

// ── Gold Sun + Zodiac Ring shared constants ──────────────────────────
const GOLD_SUN_CENTER_Y = 0; // orbit center at green disk midplane
const ZODIAC_SCALE = 12 / ZODIAC_RADIUS; // ISLAND_ORBIT_RADIUS(12) / ZODIAC_RADIUS(15) = 0.8

// ── Zodiac Ring — vertical, aligned with gold sun orbit ──────────────
function ArtBookZodiacRing({ onSelectSign, selectedSign }) {
  return (
    <group position={[0, GOLD_SUN_CENTER_Y, 0]}>
      {/* Tilt vertical — world rotation handled by Mountain parent group */}
      <group rotation={[Math.PI / 2, 0, 0]} scale={[ZODIAC_SCALE, ZODIAC_SCALE, ZODIAC_SCALE]}>
        <ZodiacSphere
          selectedSign={selectedSign || null}
          onSelectSign={onSelectSign || (() => {})}
          zodiacMode="tropical"
          selectedStar={null}
          onSelectStar={() => {}}
          activeCulture="Atlas"
          highlightAll={false}
          clipToWall
          hideLabels={false}
        />
      </group>
    </group>
  );
}

// ── Weekday-ordered planetary orbits inside the zodiac ring ──────────
// Sun outermost → Saturn innermost, Earth at center
// Radii are in zodiac local space (wall = ZODIAC_RADIUS = 15)
// Speeds in rad/s — anchored to Sun at 0.05, others scaled by relative orbital period ratios

const WEEKDAY_ORBITS = [
  { planet: 'Sun',     radius: 15,  size: 0.7,  speed: 0.05,   ringColor: '#c9a961' },
  { planet: 'Moon',    radius: 13,  size: 0.35, speed: 0.5,    ringColor: '#9b59b6' },
  { planet: 'Mars',    radius: 11,  size: 0.35, speed: 0.029,  ringColor: '#3498db' },
  { planet: 'Mercury', radius: 9,   size: 0.3,  speed: 0.167,  ringColor: '#2ecc71' },
  { planet: 'Jupiter', radius: 7,   size: 0.65, speed: 0.01,   ringColor: '#f1c40f' },
  { planet: 'Venus',   radius: 5,   size: 0.4,  speed: 0.083,  ringColor: '#e67e22' },
  { planet: 'Saturn',  radius: 3,   size: 0.55, speed: 0.005,  ringColor: '#e74c3c' },
];

function WeekdayPlanet({ planet, orbitRadius, size, planetAnglesRef, sunFactorRef, islandAngleRef }) {
  const groupRef = useRef();
  const moonWrapRef = useRef();
  const moonLightRef = useRef();
  const [moonPhase, setMoonPhase] = useState(135);
  const planetColor = PLANET_COLORS[planet] || '#aaa';

  useFrame(() => {
    if (!groupRef.current || !planetAnglesRef.current) return;
    const angle = planetAnglesRef.current[planet] || 0;
    groupRef.current.position.x = Math.cos(angle) * orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * orbitRadius;
    groupRef.current.position.y = 0;

    // Sun drives the day/night cycle: world Y ∝ -sin(angle)
    if (planet === 'Sun' && sunFactorRef) {
      sunFactorRef.current = Math.max(0, -Math.sin(angle));
    }

    // Moon phase: full (180°) at top, new (0°) at bottom
    if (planet === 'Moon') {
      const raw = (((angle + Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const deg = Math.round((raw / (2 * Math.PI)) * 360) % 360;
      setMoonPhase(prev => prev === deg ? prev : deg);

      // Moon brightness tracks illumination: 0 at new, 1/4 sun intensity at full
      // illumination = (1 - cos(phase)) / 2  → 0 at 0°, 1 at 180°
      if (moonLightRef.current) {
        const illum = (1 - Math.cos(deg * Math.PI / 180)) / 2;
        moonLightRef.current.intensity = illum * (35 / 4);
      }

      // Counter-rotate so MoonPhase3D shadow faces the camera correctly
      // Undo parent's Ry(theta) * Rx(PI/2) so Moon's local Y = world Y
      if (moonWrapRef.current && islandAngleRef) {
        moonWrapRef.current.rotation.set(-Math.PI / 2, -islandAngleRef.current, 0);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {planet === 'Moon' ? (
        <group ref={moonWrapRef}>
          <Planet3D planet={planet} position={[0, 0, 0]} size={size} moonPhase={moonPhase} />
        </group>
      ) : (
        <Planet3D planet={planet} position={[0, 0, 0]} size={size} />
      )}
      {/* Glow light on every planet */}
      <pointLight
        ref={planet === 'Moon' ? moonLightRef : undefined}
        color={planet === 'Sun' ? '#fff4d0' : planetColor}
        intensity={planet === 'Sun' ? 35 : 2}
        distance={planet === 'Sun' ? 200 : 15}
        decay={1.5}
      />
    </group>
  );
}

function ArtBookPlanets({ islandAngleRef, draggingRef, sunFactorRef }) {
  const groupRef = useRef();
  const planetAnglesRef = useRef(null);

  if (planetAnglesRef.current === null) {
    const init = {};
    WEEKDAY_ORBITS.forEach((o, i) => {
      // Sun starts at -PI/2 (top of arc, near the ruby); others spaced from there
      init[o.planet] = -Math.PI / 2 + (i / WEEKDAY_ORBITS.length) * Math.PI * 2;
    });
    // Mars & Jupiter are slowest — start them in visible positions
    init['Mars'] = 0;            // right side, immediately visible
    init['Jupiter'] = -Math.PI / 4; // upper-right, close to visible
    planetAnglesRef.current = init;
  }

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Tilt vertical — world rotation handled by Mountain parent group
    groupRef.current.rotation.set(Math.PI / 2, 0, 0);

    if (!draggingRef?.current) {
      const dt = Math.min(delta, 0.1);
      WEEKDAY_ORBITS.forEach(o => {
        planetAnglesRef.current[o.planet] += o.speed * dt;
      });
    }
  });

  return (
    <group position={[0, GOLD_SUN_CENTER_Y, 0]}>
      <group ref={groupRef} scale={[ZODIAC_SCALE, ZODIAC_SCALE, ZODIAC_SCALE]}>
        {/* Earth at center */}
        <Planet3D planet="Earth" position={[0, 0, 0]} size={0.4} />
        <pointLight color="#4a8ab0" intensity={2} distance={15} decay={1.5} />

        {/* Orbit rings + planets */}
        {WEEKDAY_ORBITS.map(o => (
          <React.Fragment key={o.planet}>
            {/* Outer glow ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[o.radius - 0.25, o.radius + 0.25, 128]} />
              <meshBasicMaterial color={o.ringColor} transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            {/* Core ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[o.radius - 0.04, o.radius + 0.04, 128]} />
              <meshBasicMaterial color={o.ringColor} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <WeekdayPlanet planet={o.planet} orbitRadius={o.radius} size={o.size} planetAnglesRef={planetAnglesRef} sunFactorRef={sunFactorRef} islandAngleRef={islandAngleRef} />
          </React.Fragment>
        ))}
      </group>
    </group>
  );
}

// ── Ocean surface + underwater volume ─────────────────────────────────
const OCEAN_Y = 0; // water surface at green disk midplane
const OCEAN_RADIUS = 80; // match cosmic sphere
const OCEAN_SEGMENTS = 96;

const oceanVert = `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying float vWave;
  void main() {
    vec3 pos = position;
    float d = length(pos.xz);
    // Layered sine waves for organic feel
    float wave = sin(pos.x * 0.8 + uTime * 0.7) * 0.12
               + sin(pos.z * 0.6 + uTime * 0.5) * 0.10
               + sin((pos.x + pos.z) * 1.2 + uTime * 1.1) * 0.06;
    // Taper waves near center so mountain base stays clean
    float taper = smoothstep(3.0, 7.0, d);
    pos.y += wave * taper;
    vWave = wave * taper;
    vWorldPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const oceanFrag = `
  uniform float uTime;
  uniform float uSunFactor;
  varying vec3 vWorldPos;
  varying float vWave;
  void main() {
    // Night colors (sun below water)
    vec3 deepN  = vec3(0.01, 0.03, 0.10);
    vec3 midN   = vec3(0.03, 0.08, 0.20);
    vec3 crestN = vec3(0.06, 0.14, 0.30);
    // Day colors (sun above)
    vec3 deepD  = vec3(0.04, 0.12, 0.30);
    vec3 midD   = vec3(0.10, 0.30, 0.55);
    vec3 crestD = vec3(0.25, 0.50, 0.70);

    float s = uSunFactor;
    vec3 deep  = mix(deepN,  deepD,  s);
    vec3 mid   = mix(midN,   midD,   s);
    vec3 crest = mix(crestN, crestD, s);

    float t = smoothstep(-0.12, 0.12, vWave);
    vec3 col = mix(deep, mix(mid, crest, t), 0.6 + 0.4 * t);
    // Shimmer — brighter in daylight
    float shimmer = sin(vWorldPos.x * 3.0 + uTime * 2.0) * sin(vWorldPos.z * 3.0 + uTime * 1.5);
    col += vec3(0.03, 0.06, 0.10) * (1.0 + s * 2.0) * smoothstep(0.5, 1.0, shimmer);
    gl_FragColor = vec4(col, 0.92);
  }
`;

// Underwater depth volume — a hemisphere below the surface
const depthVert = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const depthFrag = `
  varying vec3 vPos;
  void main() {
    // Darker with depth, fade alpha toward the bottom of the hemisphere
    float depth = clamp(-vPos.y / 78.0, 0.0, 1.0);
    vec3 shallow = vec3(0.02, 0.06, 0.18);
    vec3 abyss   = vec3(0.005, 0.01, 0.04);
    vec3 col = mix(shallow, abyss, depth);
    float alpha = mix(0.95, 0.7, depth);
    gl_FragColor = vec4(col, alpha);
  }
`;

function Ocean({ sunFactorRef }) {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(OCEAN_RADIUS, OCEAN_SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSunFactor: { value: 0 } },
    vertexShader: oceanVert,
    fragmentShader: oceanFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  // Lower hemisphere for underwater volume
  const depthGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(OCEAN_RADIUS, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    return g;
  }, []);

  const depthMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: depthVert,
    fragmentShader: depthFrag,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime / 6;
    mat.uniforms.uSunFactor.value = sunFactorRef.current;
  });

  return (
    <group position={[0, OCEAN_Y, 0]}>
      <mesh geometry={geo} material={mat} />
      <mesh geometry={depthGeo} material={depthMat} />
    </group>
  );
}

// ── Cloud Ring — animated mist at the ocean perimeter ─────────────────
// Flat rings with procedural noise for organic, drifting cloud look.
const FOG_INNER = OCEAN_RADIUS - 25;
const FOG_OUTER = OCEAN_RADIUS + 12;

const fogVert = `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vPos = position.xz;
    vec3 pos = position;
    float angle = atan(pos.z, pos.x);
    float n = noise(vec2(angle * 3.0 + uSeed, uTime * 0.3));
    pos.y += n * 1.8;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fogFrag = `
  uniform float uOpacity;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float dist = length(vPos);
    float center = ${OCEAN_RADIUS.toFixed(1)};
    float spread = 15.0;
    float radial = exp(-0.5 * pow((dist - center) / spread, 2.0));
    float angle = atan(vPos.y, vPos.x);
    vec2 noiseCoord = vec2(angle * 4.0 + uSeed, dist * 0.08) + uTime * vec2(0.15, 0.05);
    float cloud = fbm(noiseCoord);
    cloud = smoothstep(0.25, 0.7, cloud);
    float alpha = radial * cloud * uOpacity;
    gl_FragColor = vec4(0.82, 0.85, 0.92, alpha);
  }
`;

function FogRing() {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(FOG_INNER, FOG_OUTER, 256, 4);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const layers = [
    { y: 0.0, opacity: 0.35, seed: 0.0 },
    { y: 1.5, opacity: 0.28, seed: 10.0 },
    { y: 3.0, opacity: 0.22, seed: 20.0 },
    { y: 5.0, opacity: 0.16, seed: 30.0 },
    { y: 7.5, opacity: 0.10, seed: 40.0 },
    { y: 10.0, opacity: 0.05, seed: 50.0 },
  ];

  const mats = useMemo(() => layers.map(l => new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: l.opacity },
      uTime: { value: 0 },
      uSeed: { value: l.seed },
    },
    vertexShader: fogVert,
    fragmentShader: fogFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    mats.forEach(m => { m.uniforms.uTime.value = t; });
  });

  return (
    <group position={[0, OCEAN_Y, 0]}>
      {layers.map((l, i) => (
        <mesh key={i} geometry={geo} material={mats[i]} position={[0, l.y, 0]} />
      ))}
    </group>
  );
}

// ── Pine Forest — replaces the flat green disk with instanced pine trees ──
const LAND_RADIUS = 10; // leaves a water gap before islands at 12
const TREE_COUNT = 520;
const FOREST_INNER = BASE_RADIUS + 0.6; // clear of mountain base
const FOREST_OUTER = LAND_RADIUS - 0.15;

// Seeded PRNG for consistent tree placement
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function PineForest() {
  const { groundGeo, groundMat, trees } = useMemo(() => {
    const rng = mulberry32(42);

    // Thin ground disk (dark forest floor)
    const gGeo = new THREE.CylinderGeometry(LAND_RADIUS, LAND_RADIUS, 0.15, 64);
    const gMat = new THREE.MeshStandardMaterial({
      color: '#1a3a14',
      roughness: 0.95,
      metalness: 0.0,
    });

    // Generate tree placements via Poisson-ish scatter
    const placed = [];
    const minDist = 0.30;
    let attempts = 0;
    while (placed.length < TREE_COUNT && attempts < 6000) {
      attempts++;
      const angle = rng() * Math.PI * 2;
      // Bias distribution toward outer ring for density
      const r = FOREST_INNER + (FOREST_OUTER - FOREST_INNER) * Math.sqrt(rng());
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      // Check minimum distance
      let ok = true;
      for (let j = 0; j < placed.length; j++) {
        const dx = placed[j].x - x;
        const dz = placed[j].z - z;
        if (dx * dx + dz * dz < minDist * minDist) { ok = false; break; }
      }
      if (!ok) continue;

      const height = 0.6 + rng() * 0.9; // 0.6 – 1.5 units tall (half size)
      const width = 0.175 + rng() * 0.175; // canopy radius 0.175 – 0.35 (half size)
      const shade = rng(); // for color variation
      placed.push({ x, z, height, width, shade });
    }
    return { groundGeo: gGeo, groundMat: gMat, trees: placed };
  }, []);

  // Instanced trunks
  const trunkRef = useRef();
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.03, 1, 5), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4a3020', roughness: 0.9, metalness: 0.0,
  }), []);

  // Three tiers of canopy cones (instanced)
  const coneRefs = [useRef(), useRef(), useRef()];
  const coneGeos = useMemo(() => [
    new THREE.ConeGeometry(1, 1, 6),  // bottom tier (widest)
    new THREE.ConeGeometry(0.78, 0.9, 6), // middle tier
    new THREE.ConeGeometry(0.55, 0.8, 6), // top tier
  ], []);
  const coneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a5a20', roughness: 0.85, metalness: 0.05,
  }), []);

  // Set instance transforms on mount
  useEffect(() => {
    if (!trunkRef.current) return;
    const dummy = new THREE.Object3D();
    const diskTop = LEVEL_HEIGHT / 2 + 0.07; // just above ground disk
    const color = new THREE.Color();

    trees.forEach((t, i) => {
      // Tiny stub trunk — mostly hidden by canopy
      const trunkH = t.height * 0.1;
      dummy.position.set(t.x, diskTop + trunkH / 2, t.z);
      dummy.scale.set(1, trunkH, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      // Canopy tiers — sitting right on the disk surface
      const tierOffsets = [0.0, 0.28, 0.52]; // start at disk surface
      const tierScales = [1.0, 0.82, 0.62];
      for (let c = 0; c < 3; c++) {
        const coneY = diskTop + t.height * tierOffsets[c];
        const s = t.width * tierScales[c];
        dummy.position.set(t.x, coneY, t.z);
        dummy.scale.set(s, t.height * 0.45 * tierScales[c], s);
        dummy.rotation.set(0, t.shade * Math.PI * 2, 0); // random rotation
        dummy.updateMatrix();
        coneRefs[c].current.setMatrixAt(i, dummy.matrix);

        // Per-instance green variation
        const g = 0.28 + t.shade * 0.18; // 0.28 – 0.46
        const rb = 0.08 + t.shade * 0.08;
        color.setRGB(rb, g, rb * 0.6);
        coneRefs[c].current.setColorAt(i, color);
      }
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    coneRefs.forEach(ref => {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.instanceColor.needsUpdate = true;
    });
  }, [trees, coneRefs]);

  return (
    <group>
      {/* Dark forest-floor ground disk */}
      <mesh position={[0, 0, 0]} geometry={groundGeo} material={groundMat} />

      {/* Instanced trunks */}
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, trees.length]}
        frustumCulled={false} />

      {/* Three tiers of canopy cones */}
      {coneGeos.map((geo, idx) => (
        <instancedMesh key={idx} ref={coneRefs[idx]} args={[geo, coneMat, trees.length]}
          frustumCulled={false} />
      ))}
    </group>
  );
}

// ── Spiral road — flat ribbon whose outer edge = original cone surface,
//    inner edge = grooved mountain surface (GROOVE_SCALE) ──────────────
function MountainSpiral() {
  const { roadGeo, glowGeo } = useMemo(() => {
    const segments = 500;
    const yBottom = LEVEL_HEIGHT / 2;
    const yTop = (TOTAL_LEVELS + 0.5) * LEVEL_HEIGHT;
    const height = yTop - yBottom;
    const totalAngle = TOTAL_LEVELS * Math.PI * 2;

    const roadPos = [];
    const roadNorm = [];
    const roadIdx = [];
    const glowPos = [];
    const glowNorm = [];
    const glowIdx = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = yBottom + t * height;
      const angle = t * totalAngle;

      // Original cone radius at this height (outer edge of road)
      const rOuter = BASE_RADIUS - t * (BASE_RADIUS - TOP_RADIUS);
      // Grooved mountain surface (inner edge of road)
      const rInner = rOuter * GROOVE_SCALE;
      // Glow extends slightly beyond both edges
      const glowPad = (rOuter - rInner) * 0.4;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Road: outer vert and inner vert, both flat at y
      roadPos.push(cosA * rOuter, y, sinA * rOuter);
      roadPos.push(cosA * rInner, y, sinA * rInner);
      roadNorm.push(0, 1, 0, 0, 1, 0);

      // Glow: slightly wider on both sides
      glowPos.push(cosA * (rOuter + glowPad), y + 0.01, sinA * (rOuter + glowPad));
      glowPos.push(cosA * (rInner - glowPad), y + 0.01, sinA * (rInner - glowPad));
      glowNorm.push(0, 1, 0, 0, 1, 0);

      if (i < segments) {
        const b = i * 2;
        roadIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
        glowIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
      }
    }

    const road = new THREE.BufferGeometry();
    road.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
    road.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorm, 3));
    road.setIndex(roadIdx);

    const glow = new THREE.BufferGeometry();
    glow.setAttribute('position', new THREE.Float32BufferAttribute(glowPos, 3));
    glow.setAttribute('normal', new THREE.Float32BufferAttribute(glowNorm, 3));
    glow.setIndex(glowIdx);

    return { roadGeo: road, glowGeo: glow };
  }, []);

  return (
    <group>
      {/* Soft glow */}
      <mesh geometry={glowGeo}>
        <meshBasicMaterial color="#c9a961" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      {/* Core road surface */}
      <mesh geometry={roadGeo}>
        <meshStandardMaterial color="#c9a961" emissive="#c9a961" emissiveIntensity={0.4} metalness={0.85} roughness={0.18} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Sisyphus pushing a stone ball up the spiral road ──────────────────
function SpiralBall({ draggingRef }) {
  const ballRef = useRef();
  const figRef = useRef();
  const bodyRef = useRef();
  const lHipRef = useRef();
  const rHipRef = useRef();
  const lKneeRef = useRef();
  const rKneeRef = useRef();
  const lShoulderRef = useRef();
  const rShoulderRef = useRef();
  const lElbowRef = useRef();
  const rElbowRef = useRef();
  const tRef = useRef(0);
  const distRef = useRef(0);
  const prevRef = useRef(null);

  const yBottom = LEVEL_HEIGHT / 2;
  const yTop = (TOTAL_LEVELS + 0.5) * LEVEL_HEIGHT;
  const hTotal = yTop - yBottom;
  const totalAngle = TOTAL_LEVELS * Math.PI * 2;
  const ballR = 0.12;
  const speed = 1 / 120; // full climb in ~120s

  const spiralAt = (t) => {
    const y = yBottom + t * hTotal;
    const a = t * totalAngle;
    const rO = BASE_RADIUS - t * (BASE_RADIUS - TOP_RADIUS);
    const rC = (rO + rO * GROOVE_SCALE) / 2;
    return { x: Math.cos(a) * rC, y, z: Math.sin(a) * rC };
  };

  // Figure scale
  const S = 0.22;

  // Procedural boulder texture (color + bump)
  const boulderTex = useMemo(() => {
    const sz = 128;
    const c = document.createElement('canvas');
    c.width = sz; c.height = sz;
    const ctx = c.getContext('2d');
    // Base stone
    ctx.fillStyle = '#7a7568';
    ctx.fillRect(0, 0, sz, sz);
    // Noise patches — light and dark splotches
    const rng = seededRandom(314);
    for (let i = 0; i < 90; i++) {
      const x = rng() * sz, y = rng() * sz, r = 3 + rng() * 14;
      ctx.fillStyle = rng() > 0.5
        ? `rgba(155,145,130,${0.15 + rng() * 0.2})`
        : `rgba(55,50,42,${0.15 + rng() * 0.25})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Crack lines
    for (let i = 0; i < 14; i++) {
      let cx = rng() * sz, cy = rng() * sz;
      ctx.strokeStyle = `rgba(45,40,35,${0.3 + rng() * 0.35})`;
      ctx.lineWidth = 0.5 + rng();
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let j = 0; j < 5; j++) {
        cx += (rng() - 0.5) * 22; cy += (rng() - 0.5) * 22;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    // Pock marks
    for (let i = 0; i < 20; i++) {
      const x = rng() * sz, y = rng() * sz, r = 1 + rng() * 3;
      ctx.fillStyle = `rgba(40,36,30,${0.2 + rng() * 0.15})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (!ballRef.current || !figRef.current) return;
    if (!draggingRef?.current) {
      tRef.current += Math.min(delta, 0.1) * speed;
      if (tRef.current >= 1) tRef.current -= 1;
    }
    const t = tRef.current;
    const bp = spiralAt(t);

    // Ball
    ballRef.current.position.set(bp.x, bp.y + ballR, bp.z);
    ballRef.current.rotation.z -= delta * 1;

    // Figure: slightly behind ball on spiral
    const tF = ((t - 0.001) + 1) % 1;
    const fp = spiralAt(tF);
    const tA = (tF + 0.0006) % 1;
    const ap = spiralAt(tA);

    figRef.current.position.set(fp.x, fp.y, fp.z);
    figRef.current.rotation.y = Math.atan2(ap.x - fp.x, ap.z - fp.z);

    // Accumulate actual distance traveled for walk phase
    if (prevRef.current) {
      const dx = fp.x - prevRef.current.x;
      const dy = fp.y - prevRef.current.y;
      const dz = fp.z - prevRef.current.z;
      distRef.current += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    prevRef.current = { x: fp.x, y: fp.y, z: fp.z };

    // Walk cycle driven by distance — one full cycle ≈ 0.22 units (≈ leg length)
    const phase = (distRef.current / 0.22) * Math.PI * 2;

    // Hips: swing thighs forward/back
    const hipSwing = Math.sin(phase) * 0.4;
    if (lHipRef.current) lHipRef.current.rotation.x = hipSwing;
    if (rHipRef.current) rHipRef.current.rotation.x = -hipSwing;

    // Knees: bend when the leg swings back (lifting foot), extend when planting forward
    const lKneeBend = Math.max(0, -Math.sin(phase)) * 0.7;
    const rKneeBend = Math.max(0, Math.sin(phase)) * 0.7;
    if (lKneeRef.current) lKneeRef.current.rotation.x = lKneeBend;
    if (rKneeRef.current) rKneeRef.current.rotation.x = rKneeBend;

    // Shoulders: arms reach forward into the boulder, slight alternating push
    const armPump = Math.sin(phase) * 0.08;
    if (lShoulderRef.current) lShoulderRef.current.rotation.x = -0.85 + armPump;
    if (rShoulderRef.current) rShoulderRef.current.rotation.x = -0.85 - armPump;

    // Elbows: slight flex pulsing with effort
    const elbowFlex = 0.25 + Math.sin(phase * 2) * 0.08;
    if (lElbowRef.current) lElbowRef.current.rotation.x = elbowFlex;
    if (rElbowRef.current) rElbowRef.current.rotation.x = elbowFlex;

    // Body bob — slight rise at mid-stride
    if (bodyRef.current) {
      bodyRef.current.position.y = S * 0.85 + Math.abs(Math.sin(phase)) * 0.008;
    }
  });

  const skin = '#c4a882';
  const tunic = '#6b5040';
  const pants = '#4a3a2e';
  const sandal = '#3a2e22';

  return (
    <group>
      {/* Boulder */}
      <mesh ref={ballRef}>
        <sphereGeometry args={[ballR, 24, 16]} />
        <meshStandardMaterial
          map={boulderTex}
          bumpMap={boulderTex}
          bumpScale={0.04}
          color="#8a8070"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Sisyphus */}
      <group ref={figRef}>
        {/* Lean FORWARD into the push (+X rotation tilts top toward +Z = forward) */}
        <group ref={bodyRef} rotation={[0.6, 0, 0]} position={[0, S * 0.85, 0]}>

          {/* ── Head ── */}
          <mesh position={[0, S * 0.98, 0]}>
            <sphereGeometry args={[S * 0.17, 16, 12]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, S * 1.06, -S * 0.02]}>
            <sphereGeometry args={[S * 0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#3a3028" roughness={0.9} />
          </mesh>
          {/* Brow ridge */}
          <mesh position={[0, S * 1.02, S * 0.1]}>
            <boxGeometry args={[S * 0.22, S * 0.03, S * 0.06]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>

          {/* ── Neck ── */}
          <mesh position={[0, S * 0.8, 0]}>
            <cylinderGeometry args={[S * 0.06, S * 0.07, S * 0.1, 12]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>

          {/* ── Torso — chest + belly ── */}
          {/* Chest (upper, wider) */}
          <mesh position={[0, S * 0.58, 0]}>
            <cylinderGeometry args={[S * 0.15, S * 0.13, S * 0.3, 12]} />
            <meshStandardMaterial color={tunic} roughness={0.8} />
          </mesh>
          {/* Belly (lower, narrower) */}
          <mesh position={[0, S * 0.32, 0]}>
            <cylinderGeometry args={[S * 0.13, S * 0.1, S * 0.25, 12]} />
            <meshStandardMaterial color={tunic} roughness={0.8} />
          </mesh>

          {/* ── Left arm ── */}
          {/* Shoulder ball */}
          <mesh position={[S * 0.18, S * 0.7, 0]}>
            <sphereGeometry args={[S * 0.055, 10, 8]} />
            <meshStandardMaterial color={tunic} roughness={0.8} />
          </mesh>
          <group ref={lShoulderRef} position={[S * 0.18, S * 0.7, 0]}>
            {/* Upper arm */}
            <mesh position={[0, -S * 0.16, 0]}>
              <cylinderGeometry args={[S * 0.045, S * 0.05, S * 0.28, 10]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
            {/* Elbow joint */}
            <mesh position={[0, -S * 0.3, 0]}>
              <sphereGeometry args={[S * 0.04, 8, 6]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
            <group ref={lElbowRef} position={[0, -S * 0.3, 0]}>
              {/* Forearm */}
              <mesh position={[0, -S * 0.15, 0]}>
                <cylinderGeometry args={[S * 0.035, S * 0.045, S * 0.26, 10]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
              {/* Hand */}
              <mesh position={[0, -S * 0.3, 0]}>
                <sphereGeometry args={[S * 0.05, 10, 8]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
            </group>
          </group>

          {/* ── Right arm ── */}
          <mesh position={[-S * 0.18, S * 0.7, 0]}>
            <sphereGeometry args={[S * 0.055, 10, 8]} />
            <meshStandardMaterial color={tunic} roughness={0.8} />
          </mesh>
          <group ref={rShoulderRef} position={[-S * 0.18, S * 0.7, 0]}>
            <mesh position={[0, -S * 0.16, 0]}>
              <cylinderGeometry args={[S * 0.045, S * 0.05, S * 0.28, 10]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
            <mesh position={[0, -S * 0.3, 0]}>
              <sphereGeometry args={[S * 0.04, 8, 6]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
            <group ref={rElbowRef} position={[0, -S * 0.3, 0]}>
              <mesh position={[0, -S * 0.15, 0]}>
                <cylinderGeometry args={[S * 0.035, S * 0.045, S * 0.26, 10]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
              <mesh position={[0, -S * 0.3, 0]}>
                <sphereGeometry args={[S * 0.05, 10, 8]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
            </group>
          </group>

          {/* ── Left leg ── */}
          <group ref={lHipRef} position={[S * 0.07, S * 0.18, 0]}>
            {/* Thigh */}
            <mesh position={[0, -S * 0.17, 0]}>
              <cylinderGeometry args={[S * 0.055, S * 0.065, S * 0.32, 10]} />
              <meshStandardMaterial color={pants} roughness={0.85} />
            </mesh>
            {/* Knee joint */}
            <mesh position={[0, -S * 0.34, 0]}>
              <sphereGeometry args={[S * 0.05, 8, 6]} />
              <meshStandardMaterial color={pants} roughness={0.85} />
            </mesh>
            <group ref={lKneeRef} position={[0, -S * 0.34, 0]}>
              {/* Shin */}
              <mesh position={[0, -S * 0.16, 0]}>
                <cylinderGeometry args={[S * 0.04, S * 0.05, S * 0.3, 10]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
              {/* Ankle */}
              <mesh position={[0, -S * 0.32, 0]}>
                <sphereGeometry args={[S * 0.035, 8, 6]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
              {/* Foot */}
              <mesh position={[0, -S * 0.35, S * 0.04]}>
                <boxGeometry args={[S * 0.08, S * 0.04, S * 0.14]} />
                <meshStandardMaterial color={sandal} roughness={0.9} />
              </mesh>
            </group>
          </group>

          {/* ── Right leg ── */}
          <group ref={rHipRef} position={[-S * 0.07, S * 0.18, 0]}>
            <mesh position={[0, -S * 0.17, 0]}>
              <cylinderGeometry args={[S * 0.055, S * 0.065, S * 0.32, 10]} />
              <meshStandardMaterial color={pants} roughness={0.85} />
            </mesh>
            <mesh position={[0, -S * 0.34, 0]}>
              <sphereGeometry args={[S * 0.05, 8, 6]} />
              <meshStandardMaterial color={pants} roughness={0.85} />
            </mesh>
            <group ref={rKneeRef} position={[0, -S * 0.34, 0]}>
              <mesh position={[0, -S * 0.16, 0]}>
                <cylinderGeometry args={[S * 0.04, S * 0.05, S * 0.3, 10]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
              <mesh position={[0, -S * 0.32, 0]}>
                <sphereGeometry args={[S * 0.035, 8, 6]} />
                <meshStandardMaterial color={skin} roughness={0.7} />
              </mesh>
              <mesh position={[0, -S * 0.35, S * 0.04]}>
                <boxGeometry args={[S * 0.08, S * 0.04, S * 0.14]} />
                <meshStandardMaterial color={sandal} roughness={0.9} />
              </mesh>
            </group>
          </group>

        </group>
      </group>
    </group>
  );
}

// ── Radial line on green disk — aligned with zodiac/orbital plane ─────
function RadialLine() {
  const lineY = LEVEL_HEIGHT / 2 + 0.02; // just above green disk surface
  const lineLength = LAND_RADIUS - BASE_RADIUS;
  const lineMid = (LAND_RADIUS + BASE_RADIUS) / 2;
  const islandGeo = useMemo(() => new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32), []);

  // No self-rotation — parent Mountain group handles world rotation
  return (
    <group>
      {/* Glow layer */}
      <mesh position={[lineMid, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lineLength, 0.2]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[-lineMid, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lineLength, 0.2]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Core line */}
      <mesh position={[lineMid, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lineLength, 0.05]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[-lineMid, lineY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lineLength, 0.05]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Static islands locked in alignment with lines */}
      <group position={[ISLAND_ORBIT_RADIUS, ISLAND_Y, 0]}>
        <mesh geometry={islandGeo}>
          <meshStandardMaterial color="#c9a961" metalness={0.4} roughness={0.5} />
        </mesh>
        <GoldenAppleTree />
      </group>
      <group position={[-ISLAND_ORBIT_RADIUS, ISLAND_Y, 0]}>
        <mesh geometry={islandGeo}>
          <meshStandardMaterial color="#c9a961" metalness={0.4} roughness={0.5} />
        </mesh>
        <GoldenAppleTree />
      </group>
    </group>
  );
}

// ── Orbiting Islands — shared angle, offset for symmetry ─────────────
const ISLAND_Y = 0; // same plane as green disk center
const ISLAND_ORBIT_RADIUS = 12; // fixed — does not change with zoom

function useIslandOrbit(draggingRef) {
  const angleRef = useRef(Math.PI * 0.5);
  useFrame((_, delta) => {
    if (draggingRef?.current) return;
    angleRef.current += Math.min(delta, 0.1) * 0.04;
  });
  return angleRef;
}

// ── Golden Apple Tree for satellite islands ──────────────────────────
const applePositions = [
  [0.25, 0.15, 0.2], [-0.2, 0.25, -0.15], [0.1, -0.05, -0.25],
  [-0.15, 0.3, 0.1], [0.3, 0.05, -0.1],
];

function GoldenAppleTree() {
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6), []);
  const canopyGeo = useMemo(() => new THREE.SphereGeometry(0.4, 12, 10), []);
  const appleGeo = useMemo(() => new THREE.SphereGeometry(0.06, 8, 6), []);

  // Snake coiled around the trunk
  const snakeGeo = useMemo(() => {
    const pts = [];
    const coils = 2.5;
    const segments = 60;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * coils * Math.PI * 2;
      const r = 0.065 + t * 0.005; // slightly wider than trunk
      const y = t * 0.5 + 0.05; // climb from near trunk base to near canopy
      pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 48, 0.012, 6, false);
  }, []);
  const snakeHeadGeo = useMemo(() => new THREE.SphereGeometry(0.02, 6, 5), []);
  // Head position: top of coil, slightly raised and outward
  const snakeHeadPos = useMemo(() => {
    const endAngle = 2.5 * Math.PI * 2;
    const r = 0.07;
    return [Math.cos(endAngle) * r * 1.3, 0.57, Math.sin(endAngle) * r * 1.3];
  }, []);

  return (
    <group position={[0, 0.075, 0]}>
      {/* Trunk */}
      <mesh geometry={trunkGeo} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Snake coiled around trunk */}
      <mesh geometry={snakeGeo} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2a4a2a" roughness={0.7} metalness={0.15} emissive="#1a3a1a" emissiveIntensity={0.1} />
      </mesh>
      <mesh geometry={snakeHeadGeo} position={snakeHeadPos}>
        <meshStandardMaterial color="#2a4a2a" roughness={0.6} metalness={0.2} emissive="#1a3a1a" emissiveIntensity={0.1} />
      </mesh>
      {/* Canopy */}
      <mesh geometry={canopyGeo} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#2a5a20" roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Golden apples */}
      {applePositions.map((pos, i) => (
        <mesh key={i} geometry={appleGeo} position={[pos[0], 0.75 + pos[1], pos[2]]}>
          <meshStandardMaterial color="#c9a961" metalness={0.6} roughness={0.25} emissive="#c9a961" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitingIsland({ angleRef, offset = 0 }) {
  const groupRef = useRef();
  const geo = useMemo(() => new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const a = angleRef.current + offset;
    groupRef.current.position.x = Math.cos(a) * ISLAND_ORBIT_RADIUS;
    groupRef.current.position.z = Math.sin(a) * ISLAND_ORBIT_RADIUS;
    groupRef.current.position.y = ISLAND_Y;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#c9a961" metalness={0.4} roughness={0.5} />
      </mesh>
      <GoldenAppleTree />
    </group>
  );
}

// ── Precompute orbit radii per planet (gem orbits just outside each level) ──
const ORBIT_RADII = {};
MOUNTAIN_LEVELS.forEach((level, i) => {
  const rBot = BASE_RADIUS - (i / TOTAL_LEVELS) * (BASE_RADIUS - TOP_RADIUS);
  const rTop = BASE_RADIUS - ((i + 1) / TOTAL_LEVELS) * (BASE_RADIUS - TOP_RADIUS);
  ORBIT_RADII[level.planet] = { radius: (rBot + rTop) / 2 + 0.35, y: (i + 1) * LEVEL_HEIGHT };
});

// ── Mountain group with hover bob ───────────────────────────────────
function Mountain({ hoveredOre, onHoverOre, onSelect, selectedPlanet, draggingRef, islandAngleRef, onSelectSign, selectedSign }) {
  const groupRef = useRef();
  const ambientRef = useRef();
  const hemiRef = useRef();
  const anglesRef = useArtBookOrbits(draggingRef);
  const sunFactorRef = useRef(0); // 0 = sun below water, 1 = sun at peak

  // Center the mountain visually: green disk bottom (-LH) to ruby top
  const rubyTop = (TOTAL_LEVELS + 0.5) * LEVEL_HEIGHT + 0.4;
  const yOffset = -(-LEVEL_HEIGHT + rubyTop) / 2;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = yOffset + Math.sin(state.clock.elapsedTime * 0.1) * 0.3;
      // Rotate the entire world as one unit
      groupRef.current.rotation.y = islandAngleRef.current;
    }
    // Drive ambient + hemisphere light from sun position: dim at night, full daylight at peak
    if (ambientRef.current) {
      const s = sunFactorRef.current;
      ambientRef.current.intensity = 0.05 + s * 2.5;
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = sunFactorRef.current * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, yOffset, 0]}>
      {/* Sun-driven ambient + hemisphere light inside the mountain group */}
      <ambientLight ref={ambientRef} intensity={0.05} />
      <hemisphereLight ref={hemiRef} args={['#ffffee', '#445522', 0]} />

      {MOUNTAIN_LEVELS.map((level, i) => (
        <MountainLevel
          key={level.planet}
          level={level}
          index={i}
          hoveredOre={hoveredOre}
          onHoverOre={onHoverOre}
          onSelect={onSelect}
          selectedPlanet={selectedPlanet}
        />
      ))}
      {ORBITING_PLANETS.map(planet => (
        <OrbitingGem
          key={planet}
          planet={planet}
          orbitRadius={ORBIT_RADII[planet].radius}
          orbitY={ORBIT_RADII[planet].y}
          anglesRef={anglesRef}
          selected={selectedPlanet === planet}
          onSelect={onSelect}
        />
      ))}
      <PeakGem selected={selectedPlanet === 'Sun'} onSelect={onSelect} />
      <ArtBookZodiacRing onSelectSign={onSelectSign} selectedSign={selectedSign} />
      <ArtBookPlanets islandAngleRef={islandAngleRef} draggingRef={draggingRef} sunFactorRef={sunFactorRef} />
      <PineForest />
      <MountainSpiral />
      <SpiralBall draggingRef={draggingRef} />
      <RadialLine />
      <Ocean sunFactorRef={sunFactorRef} />
      <FogRing />
    </group>
  );
}

// ── Hex color helpers for metallic gradients ────────────────────────
function parseHex(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function lightenHex(hex, amt) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${clamp(r + amt)}, ${clamp(g + amt)}, ${clamp(b + amt)})`;
}
function darkenHex(hex, amt) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${clamp(r - amt)}, ${clamp(g - amt)}, ${clamp(b - amt)})`;
}

// ── Draw an irregular ore shape on 2D canvas ────────────────────────
function drawOreBlob(ctx, cx, cy, size, color, rng) {
  const points = 6;
  ctx.beginPath();
  for (let k = 0; k < points; k++) {
    const a = (k / points) * Math.PI * 2;
    const r = size * (0.6 + rng() * 0.4);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = lightenHex(color.startsWith('#') ? color : '#888888', 50);
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

// ── Cover texture (Canvas2D) ────────────────────────────────────────
function createCoverTexture() {
  const W = 512, H = 680;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Solid gold background
  ctx.fillStyle = '#b8942e';
  ctx.fillRect(0, 0, W, H);

  // Subtle brushed-metal grain
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const len = Math.random() * 30 + 10;
    ctx.strokeStyle = `rgba(210, 180, 80, ${Math.random() * 0.15})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }

  // Title — dark on gold
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1008';
  ctx.font = '700 22px Cinzel, Georgia, serif';
  ctx.fillText('Revelation of', W / 2, 60);
  ctx.fillText('Fallen Starlight', W / 2, 88);

  // Mountain — 7 flattened trapezoid tiers with metallic shading
  const mtnBottom = H - 100;
  const mtnTop = 200;
  const mtnHeight = mtnBottom - mtnTop;
  const tierH = mtnHeight / TOTAL_LEVELS;
  const baseHalfW = 190;
  const topHalfW = 24;

  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const y0 = mtnBottom - i * tierH;
    const y1 = y0 - tierH;
    const frac0 = i / TOTAL_LEVELS;
    const frac1 = (i + 1) / TOTAL_LEVELS;
    const hw0 = baseHalfW - frac0 * (baseHalfW - topHalfW);
    const hw1 = baseHalfW - frac1 * (baseHalfW - topHalfW);

    // Metallic gradient fill per tier
    const grad = ctx.createLinearGradient(W / 2 - hw0, y0, W / 2 + hw0, y1);
    const baseColor = MOUNTAIN_LEVELS[i].color;
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.4, lightenHex(baseColor, 40));
    grad.addColorStop(0.6, baseColor);
    grad.addColorStop(1, darkenHex(baseColor, 30));

    ctx.beginPath();
    ctx.moveTo(W / 2 - hw0, y0);
    ctx.lineTo(W / 2 + hw0, y0);
    ctx.lineTo(W / 2 + hw1, y1);
    ctx.lineTo(W / 2 - hw1, y1);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Thin highlight edge at top of tier
    ctx.beginPath();
    ctx.moveTo(W / 2 - hw1 + 2, y1);
    ctx.lineTo(W / 2 + hw1 - 2, y1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scatter ore blobs on this tier (doubled)
    const tierOres = ORE_DEFS[i];
    const rng = seededRandom(i * 333 + 7);
    const avgHW = (hw0 + hw1) / 2;
    tierOres.forEach((ore) => {
      const oreCount = 6;
      for (let j = 0; j < oreCount; j++) {
        const ox = W / 2 + (rng() - 0.5) * avgHW * 1.4;
        const oy = y1 + rng() * (y0 - y1);
        if (Math.abs(ox - W / 2) < 18 && Math.abs(oy - (y0 + y1) / 2) < 12) continue;
        drawOreBlob(ctx, ox, oy, 3.5 + rng() * 3, ore.color, rng);
      }
    });

    // Gem dot at center of tier
    const gemY = (y0 + y1) / 2;
    const gemColor = GEM_COLORS[MOUNTAIN_LEVELS[i].planet];
    ctx.beginPath();
    ctx.arc(W / 2, gemY, 7, 0, Math.PI * 2);
    ctx.fillStyle = gemColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W / 2, gemY, 12, 0, Math.PI * 2);
    ctx.fillStyle = gemColor + '40';
    ctx.fill();
  }

  // "Mythouse" at bottom — dark on gold
  ctx.fillStyle = '#1a1008';
  ctx.font = '600 16px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mythouse', W / 2, H - 30);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Book3D component ────────────────────────────────────────────────
const BOOK_TILT = -0.15;          // X tilt: top leans back slightly

// Reusable vectors for per-frame reflection calculations
const _bookWorldPos = new THREE.Vector3();
const _bookCamDir = new THREE.Vector3();

function Book3D({ videoTexRef, videoPlaneRef }) {
  const groupRef = useRef();
  const obsidianRef = useRef();
  const wasReflectingRef = useRef(false);
  const coverTex = useMemo(() => createCoverTexture(), []);

  const bookW = 6, bookH = 8, coverD = 0.15;
  const spineD = 0.6;
  const obsidianR = Math.min(bookW, bookH) * 0.38;

  // CubeCamera renders the scene from the book's position into a cube map
  // that the book's materials use as envMap — giving real reflections
  const cubeRenderTarget = useMemo(() => new THREE.WebGLCubeRenderTarget(512, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  }), []);
  const cubeCamera = useMemo(() => new THREE.CubeCamera(0.1, 100, cubeRenderTarget), [cubeRenderTarget]);

  useEffect(() => () => cubeRenderTarget.dispose(), [cubeRenderTarget]);

  // Standard PBR materials — no emissive hacks, just proper envMap reflection
  const frontGoldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c9a961', metalness: 0.85, roughness: 0.18,
  }), []);

  const frontFaceMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: coverTex, metalness: 0.7, roughness: 0.25,
  }), [coverTex]);

  const frontMats = useMemo(() =>
    [frontGoldMat, frontGoldMat, frontGoldMat, frontGoldMat, frontFaceMat, frontGoldMat],
    [frontGoldMat, frontFaceMat]
  );

  const backGoldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c9a961', metalness: 0.85, roughness: 0.18,
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Bob only — OrbitControls autoRotate handles the orbiting, same as mountain
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.3;

    // ── Real-time reflection via CubeCamera ──
    const vt = videoTexRef?.current || null;
    const vpMesh = videoPlaneRef?.current;

    if (vt && vpMesh) {
      // Get book world position + direction to camera for video plane placement
      groupRef.current.getWorldPosition(_bookWorldPos);
      _bookCamDir.copy(state.camera.position).sub(_bookWorldPos).normalize();
      const camDist = state.camera.position.distanceTo(_bookWorldPos);
      const planeDist = Math.max(10, Math.min(camDist * 0.75, 18));
      vpMesh.position.copy(_bookWorldPos).addScaledVector(_bookCamDir, planeDist);
      vpMesh.lookAt(_bookWorldPos); // front face (+Z) points toward the book

      // Update video texture on the shader material uniform
      if (vpMesh.material.uniforms && vpMesh.material.uniforms.map.value !== vt) {
        vpMesh.material.uniforms.map.value = vt;
      }

      // Render cube map from the book's world position
      // (hide the book so it doesn't reflect itself, show the video plane)
      vpMesh.visible = true;
      groupRef.current.visible = false;
      cubeCamera.position.copy(_bookWorldPos);
      cubeCamera.update(state.gl, state.scene);
      groupRef.current.visible = true;
      vpMesh.visible = false;

      // Assign envMap to book materials (once, on camera-on transition)
      if (!wasReflectingRef.current) {
        const envTex = cubeRenderTarget.texture;
        if (obsidianRef.current) {
          obsidianRef.current.material.envMap = envTex;
          obsidianRef.current.material.envMapIntensity = 5.0;
          obsidianRef.current.material.needsUpdate = true;
        }
        backGoldMat.envMap = envTex;
        backGoldMat.envMapIntensity = 0.5;
        backGoldMat.needsUpdate = true;
        frontGoldMat.envMap = envTex;
        frontGoldMat.envMapIntensity = 0.3;
        frontGoldMat.needsUpdate = true;
        frontFaceMat.envMap = envTex;
        frontFaceMat.envMapIntensity = 0.2;
        frontFaceMat.needsUpdate = true;
        wasReflectingRef.current = true;
      }
    } else if (wasReflectingRef.current) {
      // Camera off — revert to scene environment
      if (vpMesh) vpMesh.visible = false;
      if (obsidianRef.current) {
        obsidianRef.current.material.envMap = null;
        obsidianRef.current.material.envMapIntensity = 2.5;
        obsidianRef.current.material.needsUpdate = true;
      }
      backGoldMat.envMap = null;
      backGoldMat.envMapIntensity = 1.0;
      backGoldMat.needsUpdate = true;
      frontGoldMat.envMap = null;
      frontGoldMat.envMapIntensity = 1.0;
      frontGoldMat.needsUpdate = true;
      frontFaceMat.envMap = null;
      frontFaceMat.envMapIntensity = 1.0;
      frontFaceMat.needsUpdate = true;
      wasReflectingRef.current = false;
    }
  });

  return (
    <group ref={groupRef} rotation={[BOOK_TILT, 0, 0]}>
      {/* Front cover */}
      <mesh position={[0, 0, spineD / 2 + coverD / 2]} material={frontMats}>
        <boxGeometry args={[bookW, bookH, coverD]} />
      </mesh>
      {/* Back cover */}
      <mesh position={[0, 0, -(spineD / 2 + coverD / 2)]} material={backGoldMat}>
        <boxGeometry args={[bookW, bookH, coverD]} />
      </mesh>
      {/* Obsidian mirror on back cover */}
      <mesh ref={obsidianRef} position={[0, 0, -(spineD / 2 + coverD + 0.01)]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[obsidianR, 64]} />
        <meshPhysicalMaterial
          color="#050508"
          metalness={0.95}
          roughness={0.02}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          reflectivity={1.0}
          envMapIntensity={2.5}
          ior={1.9}
        />
      </mesh>
      {/* Spine */}
      <mesh position={[-bookW / 2, 0, 0]}>
        <boxGeometry args={[coverD, bookH - 0.02, spineD]} />
        <meshStandardMaterial color="#a08838" metalness={0.85} roughness={0.22} />
      </mesh>
      {/* Pages */}
      <mesh position={[0.15, 0, 0]}>
        <boxGeometry args={[bookW - 0.6, bookH - 0.4, spineD - 0.04]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.9} metalness={0.0} />
      </mesh>
    </group>
  );
}

// ── Main scene ──────────────────────────────────────────────────────
// Shader material for the video disc — radial alpha fade, sharp center, soft edges
const videoDiscVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const videoDiscFrag = `
  uniform sampler2D map;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(map, vUv);
    float dist = length(vUv - 0.5) * 2.0;          // 0 at center, 1 at edge
    float alpha = 1.0 - smoothstep(0.25, 1.0, dist); // full opacity inner 25%, smooth fade
    // Slight brightness boost in center for extra clarity
    float boost = 1.0 + 0.15 * (1.0 - smoothstep(0.0, 0.5, dist));
    gl_FragColor = vec4(tex.rgb * boost, alpha);
  }
`;

export default function ArtBookScene({ mode = 'mountain', hoveredOre, onHoverOre, onSelect, selectedPlanet, videoTexRef, draggingRef, onSelectSign, selectedSign }) {
  const videoPlaneRef = useRef();
  const starGroupRef = useRef();

  // Hoist island orbit so both StarMap3D and Mountain share the same angle
  const islandAngleRef = useIslandOrbit(draggingRef);

  // Sync star sky rotation with zodiac ring in mountain mode
  useFrame(() => {
    if (!starGroupRef.current) return;
    if (mode === 'mountain') {
      // Tilt vertical + Y rotation to match Mountain parent group
      starGroupRef.current.rotation.set(Math.PI / 2, islandAngleRef.current, 0);
    } else {
      starGroupRef.current.rotation.set(0, 0, 0);
    }
  });

  const videoDiscMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { map: { value: null } },
    vertexShader: videoDiscVert,
    fragmentShader: videoDiscFrag,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  return (
    <>
      <group ref={starGroupRef}>
        <StarMap3D />
      </group>

      {mode === 'mountain' ? (
        <>
          {/* Mountain mode: ambient is driven by GoldSun inside Mountain group */}
          <Environment preset="night" background={false} environmentIntensity={0.3} />
        </>
      ) : (
        <>
          {/* Book mode: full lighting */}
          <ambientLight intensity={1.2} />
          <pointLight position={[0, 12, 0]} intensity={2.0} color="#ffffff" />
          <pointLight position={[0, -6, 0]} intensity={1.0} color="#c9a961" />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 3, -5]} intensity={0.6} />
          <directionalLight position={[0, -4, 8]} intensity={0.5} color="#8090c0" />
          <Environment preset="night" background={false} environmentIntensity={1.8} />
        </>
      )}

      {/* Invisible video disc — radial fade, positioned by Book3D, rendered into CubeCamera */}
      <mesh ref={videoPlaneRef} visible={false} material={videoDiscMat}>
        <circleGeometry args={[3.5, 64]} />
      </mesh>

      {mode === 'mountain'
        ? <Mountain hoveredOre={hoveredOre} onHoverOre={onHoverOre} onSelect={onSelect} selectedPlanet={selectedPlanet} draggingRef={draggingRef} islandAngleRef={islandAngleRef} onSelectSign={onSelectSign} selectedSign={selectedSign} />
        : <Book3D videoTexRef={videoTexRef} draggingRef={draggingRef} videoPlaneRef={videoPlaneRef} />}
    </>
  );
}

export { MOUNTAIN_LEVELS, GEM_COLORS, ORE_DEFS };
