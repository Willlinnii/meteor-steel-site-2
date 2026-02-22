import React from 'react';
import { Stars } from '@react-three/drei';

export default function StarfieldBackground({ cameraAR }) {
  return (
    <Stars
      radius={100}
      depth={50}
      count={cameraAR ? 2000 : 5000}
      factor={cameraAR ? 1.5 : 4}
      saturation={0}
      fade
      speed={0.5}
    />
  );
}
