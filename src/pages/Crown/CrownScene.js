import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Body, GeoVector, HelioVector, Ecliptic } from 'astronomy-engine';
import StarMap3D from '../../components/chronosphaera/vr/StarMap3D';
import CardinalMarker3D from '../../components/chronosphaera/vr/CardinalMarker3D';
import Gemstone3D from './Gemstone3D';
import BrightConstellations from './BrightConstellations';
import {
  HELIO_ORBITS_3D,
  HELIO_MOON_3D,
  ORBITS_3D,
  ZODIAC_RADIUS,
  CARDINALS,
} from '../../components/chronosphaera/vr/constants3D';

const DEG2RAD = Math.PI / 180;
const LERP_SPEED = 2.0;
const TOP_ANGLE = Math.PI / 2;

const GEM_LIFT = 0.8;
const BAND_HEIGHT = 4;
const ARMBAND_HEIGHT = 8;
const BAND_THICKNESS = 0.6;
const RING_OUTER = ZODIAC_RADIUS + BAND_THICKNESS / 2;
const RING_INNER = ZODIAC_RADIUS - BAND_THICKNESS / 2;

// Gemstone sizes per mode
const HELIO_GEM_SIZES = {
  Sun: 0.7, Mercury: 0.35, Venus: 0.45, Earth: 0.45,
  Mars: 0.4, Jupiter: 0.6, Saturn: 0.55, Moon: 0.35,
};
const GEO_GEM_SIZES = {
  Moon: 0.35, Mercury: 0.35, Venus: 0.45, Sun: 0.6,
  Mars: 0.4, Jupiter: 0.6, Saturn: 0.55,
};

// Navaratna cluster positions — gems at top of ring
const NAVARATNA_HELIO = {
  Mercury: TOP_ANGLE - 30 * DEG2RAD,
  Venus:   TOP_ANGLE - 18 * DEG2RAD,
  Earth:   TOP_ANGLE - 6 * DEG2RAD,
  Mars:    TOP_ANGLE + 6 * DEG2RAD,
  Jupiter: TOP_ANGLE + 18 * DEG2RAD,
  Saturn:  TOP_ANGLE + 30 * DEG2RAD,
  'Moon-helio': TOP_ANGLE - 9 * DEG2RAD,
};
const NAVARATNA_GEO = {
  Moon:    TOP_ANGLE - 30 * DEG2RAD,
  Mercury: TOP_ANGLE - 20 * DEG2RAD,
  Venus:   TOP_ANGLE - 10 * DEG2RAD,
  Sun:     TOP_ANGLE,
  Mars:    TOP_ANGLE + 10 * DEG2RAD,
  Jupiter: TOP_ANGLE + 20 * DEG2RAD,
  Saturn:  TOP_ANGLE + 30 * DEG2RAD,
};

// Crown orbit data: all planets share the zodiac radius
const CROWN_ORBITS = HELIO_ORBITS_3D.map(o => ({ ...o, radius: ZODIAC_RADIUS }));
const CROWN_GEO_ORBITS = ORBITS_3D.map(o => ({ ...o, radius: ZODIAC_RADIUS }));
const GEO_PLANET_KEYS = new Set(ORBITS_3D.map(o => o.planet));

// ── Metal material definitions ────────────────────────────────────────
const METAL_DEFS = {
  gold:        { color: '#c9a961', metalness: 0.85, roughness: 0.18 },
  silver:      { color: '#c0c0c8', metalness: 0.92, roughness: 0.12 },
  meteorSteel: { color: '#6a6e78', metalness: 0.75, roughness: 0.35 },
  bronze:      { color: '#a07840', metalness: 0.80, roughness: 0.28 },
  copper:      { color: '#b56a3a', metalness: 0.82, roughness: 0.25 },
  tin:         { color: '#8e8e8e', metalness: 0.70, roughness: 0.32 },
  lead:        { color: '#5a5a62', metalness: 0.55, roughness: 0.45 },
};

// ── Astronomy helpers ─────────────────────────────────────────────────
const BODY_MAP = {
  Moon: Body.Moon, Mercury: Body.Mercury, Venus: Body.Venus,
  Sun: Body.Sun, Mars: Body.Mars, Jupiter: Body.Jupiter, Saturn: Body.Saturn,
};

function computeBirthdayPositions(date) {
  const geo = {};
  for (const [name, body] of Object.entries(BODY_MAP)) {
    const vec = GeoVector(body, date, true);
    const ecl = Ecliptic(vec);
    geo[name] = -ecl.elon * DEG2RAD;
  }
  const helio = {};
  for (const name of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
    const vec = HelioVector(BODY_MAP[name], date);
    const ecl = Ecliptic(vec);
    helio[name] = -ecl.elon * DEG2RAD;
  }
  const earthVec = HelioVector(Body.Earth, date);
  const earthEcl = Ecliptic(earthVec);
  helio['Earth'] = -earthEcl.elon * DEG2RAD;
  helio['Moon-helio'] = geo['Moon'];
  return { geo, helio };
}

function getLahiriAyanamsa(date) {
  const fracYear = date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365.25);
  return 23.853 + (fracYear - 2000) * 0.01397;
}

function lerpAngle(current, target, t) {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return current + diff * Math.min(t, 1);
}

function initAngles() {
  const init = {};
  HELIO_ORBITS_3D.forEach(o => { init[o.planet] = o.angle * DEG2RAD; });
  ORBITS_3D.forEach(o => { if (!(o.planet in init)) init[o.planet] = o.angle * DEG2RAD; });
  init['Moon-helio'] = -90 * DEG2RAD;
  init['Moon'] = -90 * DEG2RAD;
  init['Sun'] = 20 * DEG2RAD;
  return init;
}

function updateAngles(angles, dt, mode, layout, targetAngles) {
  const useHelio = mode === 'heliocentric';
  if (layout === 'navaratna') {
    const targets = useHelio ? NAVARATNA_HELIO : NAVARATNA_GEO;
    for (const key of Object.keys(targets)) {
      if (!useHelio && key === 'Earth') continue;
      angles[key] = lerpAngle(angles[key] || 0, targets[key], LERP_SPEED * dt);
    }
  } else if (targetAngles) {
    const targets = useHelio ? targetAngles.helio : targetAngles.geo;
    for (const key of Object.keys(targets)) {
      if (!useHelio && key === 'Earth') continue;
      angles[key] = lerpAngle(angles[key] || 0, targets[key], LERP_SPEED * dt);
    }
  } else if (!useHelio) {
    ORBITS_3D.forEach(o => {
      angles[o.planet] = (angles[o.planet] || 0) - o.speed * DEG2RAD * dt;
    });
  } else {
    HELIO_ORBITS_3D.forEach(o => {
      angles[o.planet] = (angles[o.planet] || 0) - o.speed * DEG2RAD * dt;
    });
    angles['Moon-helio'] = (angles['Moon-helio'] || 0) - HELIO_MOON_3D.speed * DEG2RAD * dt;
  }
}

// ── Animation hook ────────────────────────────────────────────────────
function useCrownAnimation(birthDate, mode, layout) {
  const anglesRef = useRef(initAngles());

  const targetAngles = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 12, 0, 0);
    return computeBirthdayPositions(d);
  }, [birthDate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    updateAngles(anglesRef.current, dt, mode, layout, targetAngles);
  });

  return anglesRef;
}

// ── Ring band ─────────────────────────────────────────────────────────
function CrownBand({ metal, bandHeight = BAND_HEIGHT }) {
  const geo = useMemo(() => {
    const halfH = bandHeight / 2;
    const shape = [
      new THREE.Vector2(RING_INNER, -halfH),
      new THREE.Vector2(RING_OUTER, -halfH),
      new THREE.Vector2(RING_OUTER,  halfH),
      new THREE.Vector2(RING_INNER,  halfH),
    ];
    return new THREE.LatheGeometry(shape, 128);
  }, [bandHeight]);

  const m = METAL_DEFS[metal] || METAL_DEFS.gold;

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={m.color} metalness={m.metalness} roughness={m.roughness} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Animated gemstone ─────────────────────────────────────────────────
function CrownGem({ planet, anglesRef, selected, onClick, gemSizes }) {
  const groupRef = useRef();
  const sizes = gemSizes || HELIO_GEM_SIZES;
  const gemR = ZODIAC_RADIUS + GEM_LIFT;

  useFrame(() => {
    if (!groupRef.current || !anglesRef.current) return;
    const angle = anglesRef.current[planet] || 0;
    groupRef.current.position.x = Math.cos(angle) * gemR;
    groupRef.current.position.z = Math.sin(angle) * gemR;
    groupRef.current.position.y = 0;
    groupRef.current.rotation.set(0, -angle, -Math.PI / 2);
  });

  return (
    <group ref={groupRef}>
      <Gemstone3D planet={planet} position={[0, 0, 0]} size={sizes[planet] || 0.4} selected={selected} onClick={onClick} />
    </group>
  );
}

// ── Moon gem ──────────────────────────────────────────────────────────
function CrownMoonGem({ anglesRef, selected, onClick }) {
  const groupRef = useRef();
  const gemR = ZODIAC_RADIUS + GEM_LIFT;

  useFrame(() => {
    if (!groupRef.current || !anglesRef.current) return;
    const earthAngle = anglesRef.current['Earth'] || 0;
    const ex = Math.cos(earthAngle) * gemR;
    const ez = Math.sin(earthAngle) * gemR;
    const moonAngle = anglesRef.current['Moon-helio'] || 0;
    groupRef.current.position.x = ex + Math.cos(moonAngle) * HELIO_MOON_3D.radius;
    groupRef.current.position.z = ez + Math.sin(moonAngle) * HELIO_MOON_3D.radius;
    groupRef.current.position.y = 0;
    const mx = groupRef.current.position.x;
    const mz = groupRef.current.position.z;
    const moonRadialAngle = Math.atan2(mz, mx);
    groupRef.current.rotation.set(0, -moonRadialAngle, -Math.PI / 2);
  });

  return (
    <group ref={groupRef}>
      <Gemstone3D planet="Moon" position={[0, 0, 0]} size={HELIO_GEM_SIZES.Moon} selected={selected} onClick={onClick} />
    </group>
  );
}

// ── Main scene ────────────────────────────────────────────────────────
export default function CrownScene({ birthDate, selectedPlanet, onSelectPlanet, selectedCardinal, onSelectCardinal, mode, zodiacMode = 'tropical', birthstoneKey, metal, form, layout }) {
  const anglesRef = useCrownAnimation(birthDate, mode, layout);

  const isHelio = mode === 'heliocentric';

  // Sidereal rotation: rotate zodiac reference frame by ayanamsa
  const siderealRotY = useMemo(() => {
    if (zodiacMode !== 'sidereal') return 0;
    const d = birthDate || new Date();
    return -getLahiriAyanamsa(d) * DEG2RAD;
  }, [zodiacMode, birthDate]);
  const orbits = isHelio ? CROWN_ORBITS : CROWN_GEO_ORBITS;
  const gemSizes = isHelio ? HELIO_GEM_SIZES : GEO_GEM_SIZES;

  const bandHeight = form === 'armband' ? ARMBAND_HEIGHT : BAND_HEIGHT;
  const embedded = form === 'bracelet' || form === 'belt' || form === 'armband';
  const featuredSize = embedded ? 1.2 : 1.8;
  const featuredZ = embedded
    ? RING_OUTER + featuredSize * 0.3
    : ZODIAC_RADIUS + GEM_LIFT + 1.8 * 0.75;

  return (
    <>
      <ambientLight intensity={1.2} />
      <pointLight position={[0, 5, 0]} color="#fff8f0" intensity={5} distance={80} decay={2} />
      <pointLight position={[0, -3, 0]} color="#f0c040" intensity={2} distance={60} decay={2} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} />
      <directionalLight position={[-8, -4, 8]} color="#e0e8ff" intensity={0.8} />
      <directionalLight position={[0, 0, -12]} color="#fff0e0" intensity={0.6} />

      <group rotation={[Math.PI / 2, Math.PI, 0]}>
        <CrownBand metal={metal} bandHeight={bandHeight} />

        {/* Zodiac reference frame — rotated for sidereal mode */}
        <group rotation={[0, siderealRotY, 0]}>
          <StarMap3D />
          <BrightConstellations radius={RING_OUTER + 0.04} wallHeight={bandHeight} />
          <BrightConstellations radius={RING_INNER - 0.04} wallHeight={bandHeight} />

          {CARDINALS.map(c => (
            <CardinalMarker3D
              key={c.id} id={c.id} label={c.label} angle={c.angle} symbol={c.symbol}
              selected={selectedCardinal === c.id}
              onClick={() => onSelectCardinal(selectedCardinal === c.id ? null : c.id)}
            />
          ))}
        </group>

        {isHelio && (
          <group position={[0, 0, featuredZ]} rotation={[Math.PI / 2, 0, 0]}>
            <Gemstone3D planet="Sun" position={[0, 0, 0]} size={featuredSize}
              selected={selectedPlanet === 'Sun'} onClick={() => onSelectPlanet('Sun')} />
          </group>
        )}

        {mode === 'birthstone' && birthstoneKey && (
          <group position={[0, 0, featuredZ]} rotation={[Math.PI / 2, 0, 0]}>
            <Gemstone3D planet={birthstoneKey} position={[0, 0, 0]} size={featuredSize}
              selected={selectedPlanet === birthstoneKey} onClick={() => onSelectPlanet(birthstoneKey)} />
          </group>
        )}

        {orbits.map(o => (
          <CrownGem key={o.planet} planet={o.planet} anglesRef={anglesRef}
            gemSizes={gemSizes} selected={selectedPlanet === o.planet}
            onClick={() => onSelectPlanet(o.planet)} />
        ))}

        {mode === 'birthstone' && birthstoneKey && !GEO_PLANET_KEYS.has(birthstoneKey) && (
          <group
            position={[Math.cos(TOP_ANGLE) * (ZODIAC_RADIUS + GEM_LIFT), 0, Math.sin(TOP_ANGLE) * (ZODIAC_RADIUS + GEM_LIFT)]}
            rotation={[0, -TOP_ANGLE, -Math.PI / 2]}
          >
            <Gemstone3D planet={birthstoneKey} position={[0, 0, 0]} size={0.55}
              selected={selectedPlanet === birthstoneKey} onClick={() => onSelectPlanet(birthstoneKey)} />
          </group>
        )}

        {isHelio && (
          <CrownMoonGem anglesRef={anglesRef}
            selected={selectedPlanet === 'Moon'} onClick={() => onSelectPlanet('Moon')} />
        )}
      </group>
    </>
  );
}
