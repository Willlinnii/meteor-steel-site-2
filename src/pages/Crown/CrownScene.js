import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Body, GeoVector, Ecliptic } from 'astronomy-engine';
import * as THREE from 'three';
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
const GEM_LIFT = 0.8; // how far gems protrude outward from the ring
const BAND_HEIGHT = 4;
const BAND_THICKNESS = 0.6; // radial thickness of the ring
const RING_OUTER = ZODIAC_RADIUS + BAND_THICKNESS / 2;
const RING_INNER = ZODIAC_RADIUS - BAND_THICKNESS / 2;

// Crown orbit data: all planets share the zodiac radius
const CROWN_ORBITS = HELIO_ORBITS_3D.map(o => ({
  ...o,
  radius: ZODIAC_RADIUS,
}));

// Geocentric crown orbits: Moon through Saturn at zodiac radius (no Earth)
const CROWN_GEO_ORBITS = ORBITS_3D.map(o => ({
  ...o,
  radius: ZODIAC_RADIUS,
}));

// Gemstone sizes per mode
const HELIO_GEM_SIZES = {
  Sun:     0.7,
  Mercury: 0.35,
  Venus:   0.45,
  Earth:   0.45,
  Mars:    0.4,
  Jupiter: 0.6,
  Saturn:  0.55,
  Moon:    0.35,
};

const GEO_GEM_SIZES = {
  Moon:    0.35,
  Mercury: 0.35,
  Venus:   0.45,
  Sun:     0.6,
  Mars:    0.4,
  Jupiter: 0.6,
  Saturn:  0.55,
};

// ── Birthday position calculator ──────────────────────────────────────
const BODY_MAP = {
  Moon:    Body.Moon,
  Mercury: Body.Mercury,
  Venus:   Body.Venus,
  Sun:     Body.Sun,
  Mars:    Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn:  Body.Saturn,
};

function computeBirthdayPositions(date) {
  const positions = {};

  // Geocentric ecliptic longitudes — traditional zodiac positions
  for (const [name, body] of Object.entries(BODY_MAP)) {
    const vec = GeoVector(body, date, true);
    const ecl = Ecliptic(vec);
    positions[name] = -ecl.elon * DEG2RAD;
  }

  // Earth in heliocentric = opposite the Sun's geocentric position
  positions['Earth'] = positions['Sun'] + Math.PI;

  // Moon-helio: Moon's geocentric ecliptic longitude (direction from Earth)
  positions['Moon-helio'] = positions['Moon'];

  return positions;
}

function lerpAngle(current, target, t) {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return current + diff * Math.min(t, 1);
}

// ── Animation hook ────────────────────────────────────────────────────
function useCrownAnimation(birthDate, mode) {
  const anglesRef = useRef(null);

  const targetAngles = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 12, 0, 0);
    return computeBirthdayPositions(d);
  }, [birthDate]);

  if (anglesRef.current === null) {
    const init = {};
    HELIO_ORBITS_3D.forEach(o => {
      init[o.planet] = o.angle * DEG2RAD;
    });
    ORBITS_3D.forEach(o => {
      if (!(o.planet in init)) init[o.planet] = o.angle * DEG2RAD;
    });
    init['Moon-helio'] = -90 * DEG2RAD;
    init['Moon'] = -90 * DEG2RAD;
    init['Sun'] = 20 * DEG2RAD;
    anglesRef.current = init;
  }

  useFrame((_, delta) => {
    const angles = anglesRef.current;
    const dt = Math.min(delta, 0.1);

    if (targetAngles) {
      for (const key of Object.keys(targetAngles)) {
        if (mode === 'geocentric' && key === 'Earth') continue;
        const current = angles[key] || 0;
        angles[key] = lerpAngle(current, targetAngles[key], LERP_SPEED * dt);
      }
    } else if (mode === 'geocentric') {
      ORBITS_3D.forEach(o => {
        angles[o.planet] = (angles[o.planet] || 0) - o.speed * DEG2RAD * dt;
      });
    } else {
      HELIO_ORBITS_3D.forEach(o => {
        angles[o.planet] = (angles[o.planet] || 0) - o.speed * DEG2RAD * dt;
      });
      angles['Moon-helio'] = (angles['Moon-helio'] || 0) - HELIO_MOON_3D.speed * DEG2RAD * dt;
    }
  });

  return { anglesRef };
}

// ── Gold ring band (lathe geometry for solid cross-section) ───────────
function CrownBand() {
  const geo = useMemo(() => {
    const halfH = BAND_HEIGHT / 2;
    // Rectangular cross-section in the XY plane, revolved around Y axis
    const shape = [
      new THREE.Vector2(RING_INNER, -halfH),
      new THREE.Vector2(RING_OUTER, -halfH),
      new THREE.Vector2(RING_OUTER,  halfH),
      new THREE.Vector2(RING_INNER,  halfH),
    ];
    return new THREE.LatheGeometry(shape, 128);
  }, []);

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#c9a961" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
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
      <Gemstone3D
        planet={planet}
        position={[0, 0, 0]}
        size={sizes[planet] || 0.4}
        selected={selected}
        onClick={onClick}
      />
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
      <Gemstone3D
        planet="Moon"
        position={[0, 0, 0]}
        size={HELIO_GEM_SIZES.Moon}
        selected={selected}
        onClick={onClick}
      />
    </group>
  );
}

// ── Main scene ────────────────────────────────────────────────────────
export default function CrownScene({ selectedPlanet, onSelectPlanet, selectedCardinal, onSelectCardinal, birthDate, mode }) {
  const { anglesRef } = useCrownAnimation(birthDate, mode);

  const isHelio = mode !== 'geocentric';
  const orbits = isHelio ? CROWN_ORBITS : CROWN_GEO_ORBITS;
  const gemSizes = isHelio ? HELIO_GEM_SIZES : GEO_GEM_SIZES;

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 5, 0]} color="#fff8f0" intensity={3} distance={60} decay={2} />
      <pointLight position={[0, -3, 0]} color="#f0c040" intensity={1} distance={40} decay={2} />
      <directionalLight position={[10, 10, 10]} intensity={0.5} />

      {/* Rotate the whole crown so the ring stands vertical with Ruby (winter solstice) on top */}
      <group rotation={[Math.PI / 2, Math.PI, 0]}>
        <StarMap3D />
        {/* Constellations imprinted on outside and inside of the crown band */}
        <BrightConstellations radius={RING_OUTER + 0.04} />
        <BrightConstellations radius={RING_INNER - 0.04} />

        {/* Solid gold ring band */}
        <CrownBand />

        {/* Cardinal markers — gold diamonds with labels at solstices/equinoxes */}
        {CARDINALS.map(c => (
          <CardinalMarker3D
            key={c.id}
            id={c.id}
            label={c.label}
            angle={c.angle}
            symbol={c.symbol}
            selected={selectedCardinal === c.id}
            onClick={() => onSelectCardinal(selectedCardinal === c.id ? null : c.id)}
          />
        ))}

        {/* Ruby — featured gem of the crown, fixed over the winter solstice (helio only) */}
        {isHelio && (
          <group
            position={[0, 0, ZODIAC_RADIUS + GEM_LIFT + 1.8 * 0.75]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Gemstone3D
              planet="Sun"
              position={[0, 0, 0]}
              size={1.8}
              selected={selectedPlanet === 'Sun'}
              onClick={() => onSelectPlanet('Sun')}
            />
          </group>
        )}

        {orbits.map(o => (
          <CrownGem
            key={o.planet}
            planet={o.planet}
            anglesRef={anglesRef}
            gemSizes={gemSizes}
            selected={selectedPlanet === o.planet}
            onClick={() => onSelectPlanet(o.planet)}
          />
        ))}

        {/* Moon orbits Earth in helio mode; in geo mode it's already in the orbit list */}
        {isHelio && (
          <CrownMoonGem
            anglesRef={anglesRef}
            selected={selectedPlanet === 'Moon'}
            onClick={() => onSelectPlanet('Moon')}
          />
        )}
      </group>
    </>
  );
}
