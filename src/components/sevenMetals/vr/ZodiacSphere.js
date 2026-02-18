import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { ZODIAC, ZODIAC_RADIUS } from './constants3D';
import * as THREE from 'three';

function ZodiacSegment({ sign, symbol, index, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const centerAngleDeg = -(index * 30 + 15);
  const centerAngleRad = (centerAngleDeg * Math.PI) / 180;

  const x = ZODIAC_RADIUS * Math.cos(centerAngleRad);
  const z = ZODIAC_RADIUS * Math.sin(centerAngleRad);

  // Face outward from center
  const lookAngle = Math.atan2(z, x);

  const color = selected ? '#f0c040' : hovered ? '#c9a961' : 'rgba(201, 169, 97, 0.6)';

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, -lookAngle + Math.PI / 2, 0]}
    >
      {/* Hit target */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[2.5, 1.5]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Symbol */}
      <Text
        position={[0, 0.35, 0.01]}
        fontSize={0.6}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {symbol}
      </Text>

      {/* Sign name */}
      <Text
        position={[0, -0.25, 0.01]}
        fontSize={0.28}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {sign}
      </Text>

      {/* Selection pulse */}
      {selected && (
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[0.7, 0.85, 24]} />
          <meshBasicMaterial color="#f0c040" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function ZodiacDivider({ index }) {
  const angleDeg = -(index * 30);
  const angleRad = (angleDeg * Math.PI) / 180;
  const inner = ZODIAC_RADIUS - 0.6;
  const outer = ZODIAC_RADIUS + 0.6;

  const x1 = inner * Math.cos(angleRad);
  const z1 = inner * Math.sin(angleRad);
  const x2 = outer * Math.cos(angleRad);
  const z2 = outer * Math.sin(angleRad);

  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  const angle = Math.atan2(z2 - z1, x2 - x1);

  return (
    <mesh position={[midX, 0, midZ]} rotation={[Math.PI / 2, 0, angle]}>
      <planeGeometry args={[length, 0.02]} />
      <meshBasicMaterial color="#c9a961" transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function ZodiacSphere({ selectedSign, onSelectSign }) {
  return (
    <group>
      {/* Inner and outer ring circles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ZODIAC_RADIUS - 0.6, ZODIAC_RADIUS - 0.58, 128]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ZODIAC_RADIUS + 0.6, ZODIAC_RADIUS + 0.62, 128]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>

      {/* Dividers */}
      {ZODIAC.map((_, i) => (
        <ZodiacDivider key={i} index={i} />
      ))}

      {/* Sign segments */}
      {ZODIAC.map((z, i) => (
        <ZodiacSegment
          key={z.sign}
          sign={z.sign}
          symbol={z.symbol}
          index={i}
          selected={selectedSign === z.sign}
          onClick={() => onSelectSign(selectedSign === z.sign ? null : z.sign)}
        />
      ))}

      {/* Cross lines (equinox and solstice) */}
      {/* Equinox line (E-W) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(ZODIAC_RADIUS + 1) * 2, 0.02]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
      {/* Solstice line (N-S) */}
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[(ZODIAC_RADIUS + 1) * 2, 0.02]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
