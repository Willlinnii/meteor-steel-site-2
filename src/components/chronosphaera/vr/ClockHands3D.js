import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  CLOCK_HAND_HOUR,
  CLOCK_HAND_MINUTE,
  CLOCK_HAND_SECOND,
  CLOCK_MARKER_RADIUS,
} from './constants3D';

const DEG2RAD = Math.PI / 180;

// Thin flat box lying in XZ plane, pivoted at one end
function ClockHand({ length, width, color, angleRef }) {
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current || angleRef.current == null) return;
    meshRef.current.rotation.y = -angleRef.current * DEG2RAD;
  });

  return (
    <group ref={meshRef}>
      {/* Offset so pivot is at origin, hand extends outward along +X */}
      <mesh position={[length / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, width]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

export default function ClockHands3D({ clockMode, showClock = true }) {
  const hourAngleRef = useRef(0);
  const minuteAngleRef = useRef(0);
  const secondAngleRef = useRef(0);

  const is24h = clockMode === '24h';

  // Update hand angles every frame from real time
  useFrame(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;

    if (is24h) {
      // 24h: 0 at top (negative Z), clockwise = positive angle
      // Full circle = 24h, so 15° per hour
      hourAngleRef.current = h * 15 + m * 0.25 + 90;
      minuteAngleRef.current = m * 6 + s * 0.1 + 90;
      secondAngleRef.current = s * 6 + 90;
    } else {
      // 12h: standard clock, 30° per hour
      hourAngleRef.current = (h % 12) * 30 + m * 0.5 - 90;
      minuteAngleRef.current = m * 6 + s * 0.1 - 90;
      secondAngleRef.current = s * 6 - 90;
    }
  });

  // Hour marker positions (pre-computed)
  const markers = useMemo(() => {
    const arr = [];
    const count = is24h ? 24 : 12;
    for (let i = 0; i < count; i++) {
      const label = is24h ? String(i) : String(i === 0 ? 12 : i);
      // Angle: start at top (-Z direction) and go clockwise
      const angleDeg = is24h
        ? i * 15 + 90    // 24h: 0h at top
        : i * 30 - 90;   // 12h: 12 at top
      const angleRad = -angleDeg * DEG2RAD;
      const x = Math.cos(angleRad) * CLOCK_MARKER_RADIUS;
      const z = Math.sin(angleRad) * CLOCK_MARKER_RADIUS;
      const highlight = is24h
        ? (i % 6 === 0)   // highlight 0, 6, 12, 18
        : (i % 3 === 0);  // highlight 12, 3, 6, 9
      arr.push({ label, x, z, highlight });
    }
    return arr;
  }, [is24h]);

  return (
    <group>
      {/* Hour markers */}
      {markers.map((m, i) => (
        <Text
          key={i}
          position={[m.x, 0.03, m.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={m.highlight ? 0.6 : 0.4}
          color={m.highlight ? '#c9a961' : '#8a7d5a'}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {m.label}
        </Text>
      ))}

      {/* Clock hands + hub — hidden when showClock is false */}
      {showClock && (
        <>
          <ClockHand
            length={CLOCK_HAND_HOUR.length}
            width={CLOCK_HAND_HOUR.width}
            color={CLOCK_HAND_HOUR.color}
            angleRef={hourAngleRef}
          />
          <ClockHand
            length={CLOCK_HAND_MINUTE.length}
            width={CLOCK_HAND_MINUTE.width}
            color={CLOCK_HAND_MINUTE.color}
            angleRef={minuteAngleRef}
          />
          <ClockHand
            length={CLOCK_HAND_SECOND.length}
            width={CLOCK_HAND_SECOND.width}
            color={CLOCK_HAND_SECOND.color}
            angleRef={secondAngleRef}
          />
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#c9a961" />
          </mesh>
        </>
      )}
    </group>
  );
}
