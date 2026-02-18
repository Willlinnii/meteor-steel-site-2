import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Planet3D from './Planet3D';
import AnimatedPlanet from './AnimatedPlanet';
import AnimatedMoonHelio from './AnimatedMoonHelio';
import OrbitRing3D from './OrbitRing3D';
import StarfieldBackground from './StarfieldBackground';
import ZodiacSphere from './ZodiacSphere';
import CardinalMarker3D from './CardinalMarker3D';
import EarthDayNight3D from './EarthDayNight3D';
import InfoPanel3D from './InfoPanel3D';
import useOrbitalAnimation from './useOrbitalAnimation';
import {
  ORBITS_3D,
  HELIO_ORBITS_3D,
  HELIO_MOON_3D,
  CARDINALS,
  ORBITAL_MODES,
} from './constants3D';

// Sun point light that tracks animated position
function SunLight({ anglesRef, isHelio, orbitRadius }) {
  const lightRef = useRef();

  useFrame(() => {
    if (!lightRef.current || !anglesRef.current) return;
    if (isHelio) {
      lightRef.current.position.set(0, 0, 0);
    } else {
      const a = anglesRef.current['Sun'] || 0;
      lightRef.current.position.set(
        Math.cos(a) * orbitRadius,
        0,
        Math.sin(a) * orbitRadius
      );
    }
  });

  return <pointLight ref={lightRef} color="#f0c040" intensity={2} distance={40} decay={2} />;
}

// Earth day/night wrapper that reads Sun angle each frame
function AnimatedEarth({ anglesRef, selectedEarth, onSelectEarth }) {
  const sunAngleRef = useRef(0);

  useFrame(() => {
    if (!anglesRef.current) return;
    sunAngleRef.current = ((anglesRef.current['Sun'] || 0) * 180) / Math.PI;
  });

  return (
    <EarthDayNight3D
      sunAngle={sunAngleRef.current}
      selectedEarth={selectedEarth}
      onSelectEarth={onSelectEarth}
    />
  );
}

// Moon orbit ring that follows Earth in heliocentric mode
function HelioMoonOrbit({ anglesRef, earthOrbitRadius }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current || !anglesRef.current) return;
    const a = anglesRef.current['Earth'] || 0;
    groupRef.current.position.x = Math.cos(a) * earthOrbitRadius;
    groupRef.current.position.z = Math.sin(a) * earthOrbitRadius;
  });

  return (
    <group ref={groupRef}>
      <OrbitRing3D radius={HELIO_MOON_3D.radius} opacity={0.08} />
    </group>
  );
}

export default function OrbitalScene({
  mode,
  selectedPlanet,
  onSelectPlanet,
  selectedSign,
  onSelectSign,
  selectedCardinal,
  onSelectCardinal,
  selectedEarth,
  onSelectEarth,
  infoPanelContent,
  cameraAR,
  anglesRef: externalAnglesRef,
  panelLockedRef,
  onPanelLock,
}) {
  const { anglesRef, moonPhaseRef } = useOrbitalAnimation(mode);

  // Expose angles to external ref (for mini-map)
  useFrame(() => {
    if (externalAnglesRef && anglesRef.current) {
      externalAnglesRef.current = anglesRef.current;
    }
  });

  const isHelio = mode === ORBITAL_MODES.HELIOCENTRIC;
  const orbitData = isHelio ? HELIO_ORBITS_3D : ORBITS_3D;
  const sizeScale = cameraAR ? 2.5 : 1; // bigger planets in phone AR

  // Sun orbit radius for the light tracker
  const sunOrbitR = ORBITS_3D.find(o => o.planet === 'Sun')?.radius || 8;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <SunLight anglesRef={anglesRef} isHelio={isHelio} orbitRadius={sunOrbitR} />

      {/* Stars */}
      <StarfieldBackground cameraAR={cameraAR} />

      {/* Zodiac ring */}
      <ZodiacSphere selectedSign={selectedSign} onSelectSign={onSelectSign} />

      {/* Cardinal markers */}
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

      {/* Orbit rings */}
      {orbitData.map(o => (
        <OrbitRing3D key={o.planet} radius={o.radius} />
      ))}

      {/* Moon orbit ring in heliocentric mode */}
      {isHelio && (
        <HelioMoonOrbit
          anglesRef={anglesRef}
          earthOrbitRadius={HELIO_ORBITS_3D.find(o => o.planet === 'Earth')?.radius || 7}
        />
      )}

      {/* Center body */}
      {isHelio ? (
        <Planet3D
          planet="Sun"
          position={[0, 0, 0]}
          size={0.7 * sizeScale}
          selected={selectedPlanet === 'Sun'}
          onClick={() => onSelectPlanet('Sun')}
        />
      ) : (
        <AnimatedEarth
          anglesRef={anglesRef}
          selectedEarth={selectedEarth}
          onSelectEarth={onSelectEarth}
        />
      )}

      {/* Orbiting planets — each imperatively positions itself via useFrame */}
      {orbitData.map(o => (
        <AnimatedPlanet
          key={o.planet}
          planet={o.planet}
          orbitRadius={o.radius}
          size={o.size * sizeScale}
          anglesRef={anglesRef}
          moonPhaseRef={moonPhaseRef}
          selected={selectedPlanet === o.planet}
          onClick={() => onSelectPlanet(o.planet)}
        />
      ))}

      {/* Moon orbiting Earth in heliocentric mode */}
      {isHelio && (
        <AnimatedMoonHelio
          anglesRef={anglesRef}
          moonPhaseRef={moonPhaseRef}
          earthOrbitRadius={HELIO_ORBITS_3D.find(o => o.planet === 'Earth')?.radius || 7}
          selected={selectedPlanet === 'Moon'}
          onClick={() => onSelectPlanet('Moon')}
        />
      )}

      {/* Alignment line */}
      {mode === ORBITAL_MODES.ALIGNED && (
        <mesh position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 14]} />
          <meshBasicMaterial color="#c9a961" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Info panel — lies flat below orbital plane in AR, look down to read */}
      {cameraAR && (
        <InfoPanel3D visible={!!infoPanelContent} onLock={onPanelLock}>
          {infoPanelContent}
        </InfoPanel3D>
      )}
    </>
  );
}
