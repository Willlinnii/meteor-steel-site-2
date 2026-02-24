import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Body, GeoVector, Ecliptic, MoonPhase } from 'astronomy-engine';
import { ORBITS_3D, HELIO_ORBITS_3D, HELIO_MOON_3D, ORBITAL_MODES, ALIGN_ANGLE } from './constants3D';

const BODY_MAP = {
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Sun: Body.Sun,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

function getEclipticLongitude(planet) {
  const vec = GeoVector(BODY_MAP[planet], new Date(), true);
  return Ecliptic(vec).elon;
}

const DEG2RAD = Math.PI / 180;
const LERP_SPEED = 2.0;

function lerpAngle(current, target, t) {
  let diff = target - current;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return current + diff * Math.min(t, 1);
}

// Returns refs that are updated every frame — consumers must read inside useFrame
export default function useOrbitalAnimation(mode, clockMode) {
  const anglesRef = useRef(null);
  const liveAnglesRef = useRef({});
  const moonPhaseRef = useRef(MoonPhase(new Date()));

  // Initialize angles
  if (anglesRef.current === null) {
    const init = {};
    ORBITS_3D.forEach(o => {
      init[o.planet] = o.angle * DEG2RAD;
    });
    HELIO_ORBITS_3D.forEach(o => {
      if (!(o.planet in init)) init[o.planet] = o.angle * DEG2RAD;
    });
    init['Moon-helio'] = -90 * DEG2RAD;
    anglesRef.current = init;
  }

  useFrame((_, delta) => {
    const angles = anglesRef.current;
    const dt = Math.min(delta, 0.1);

    // Clock-driven modes override the orbital mode logic
    if (clockMode === '24h') {
      // 24h geocentric: Sun rides the hour hand, planets at real ecliptic offsets
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      // Sun clock angle: matches ClockHands3D convention
      const sunClockDeg = h * 15 + m * 0.25 + s * (15 / 3600) + 90;
      const sunClockRad = -sunClockDeg * DEG2RAD;
      const sunLon = getEclipticLongitude('Sun');

      for (const planet of Object.keys(BODY_MAP)) {
        const planetLon = getEclipticLongitude(planet);
        const target = sunClockRad + (sunLon - planetLon) * DEG2RAD;
        angles[planet] = lerpAngle(angles[planet], target, LERP_SPEED * dt);
      }
      moonPhaseRef.current = MoonPhase(now);
    } else if (clockMode === '12h') {
      // 12h heliocentric: use heliocentric orbital speeds
      HELIO_ORBITS_3D.forEach(o => {
        angles[o.planet] = (angles[o.planet] || 0) - o.speed * DEG2RAD * dt;
      });
      angles['Moon-helio'] = (angles['Moon-helio'] || 0) - HELIO_MOON_3D.speed * DEG2RAD * dt;
    } else if (mode === ORBITAL_MODES.LIVE) {
      for (const planet of Object.keys(BODY_MAP)) {
        const lon = getEclipticLongitude(planet);
        liveAnglesRef.current[planet] = -lon * DEG2RAD;
      }
      for (const planet of Object.keys(BODY_MAP)) {
        const target = liveAnglesRef.current[planet];
        if (target !== undefined) {
          angles[planet] = lerpAngle(angles[planet], target, LERP_SPEED * dt);
        }
      }
      moonPhaseRef.current = MoonPhase(new Date());
    } else if (mode === ORBITAL_MODES.ALIGNED) {
      const target = ALIGN_ANGLE * DEG2RAD;
      for (const planet of Object.keys(BODY_MAP)) {
        angles[planet] = lerpAngle(angles[planet], target, LERP_SPEED * dt);
      }
    } else if (mode === ORBITAL_MODES.HELIOCENTRIC) {
      HELIO_ORBITS_3D.forEach(o => {
        angles[o.planet] = (angles[o.planet] || 0) - o.speed * DEG2RAD * dt;
      });
      angles['Moon-helio'] = (angles['Moon-helio'] || 0) - HELIO_MOON_3D.speed * DEG2RAD * dt;
    } else {
      // Geocentric
      ORBITS_3D.forEach(o => {
        angles[o.planet] = angles[o.planet] - o.speed * DEG2RAD * dt;
      });
    }
  });

  return { anglesRef, moonPhaseRef };
}
