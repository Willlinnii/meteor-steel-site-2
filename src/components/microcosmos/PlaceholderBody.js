import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BASE_COLOR = '#667788';
const DIM_OPACITY = 0.15;
const ACTIVE_OPACITY = 0.85;
const DEFAULT_OPACITY = 0.55;
const PULSE_SPEED = 4;

/* ================================================================
   GEOMETRY HELPERS
   ================================================================ */

function tubeGeo(points, radius, segments = 20, radial = 8) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
  return new THREE.TubeGeometry(curve, segments, radius, radial, false);
}

/* ================================================================
   PART BUILDERS — pure functions returning part descriptor arrays.
   Each part: { id, label, systems[], type, ...geometry params }
   type: 'sphere' | 'cylinder' | 'box' | 'tube'
   ================================================================ */

// Helper to mirror parts left/right
const SIDES = [
  ['Left', -1, 'l'],
  ['Right', 1, 'r'],
];

/* ---------- SKELETAL ---------- */

function generateRibs() {
  const ribs = [];
  for (let i = 0; i < 12; i++) {
    const y = 3.0 - i * 0.1;
    const widthFactor = 1 - Math.abs(i - 5) * 0.06;
    const maxW = 0.45 * widthFactor + 0.25;
    const isFloating = i >= 10;
    const isFalse = i >= 7 && !isFloating;

    for (const [side, sign, sId] of SIDES) {
      const pts = [
        [sign * 0.06, y, -0.18],
        [sign * maxW * 0.4, y - 0.01, -0.12],
        [sign * maxW * 0.75, y - 0.03, -0.02],
        [sign * maxW, y - 0.04, 0.08],
      ];
      if (!isFloating) {
        pts.push([sign * maxW * 0.75, y - 0.03, 0.16]);
        if (!isFalse) {
          pts.push([sign * maxW * 0.4, y - 0.01, 0.22]);
          pts.push([sign * 0.06, y, 0.24]);
        }
      }
      ribs.push({
        id: `rib-${sId}-${i + 1}`,
        label: `${side} Rib ${i + 1}`,
        systems: ['skeletal'],
        type: 'tube',
        points: pts,
        radius: 0.016 - i * 0.0003,
        segments: isFloating ? 10 : isFalse ? 14 : 18,
      });
    }
  }
  return ribs;
}

function buildSkeletal() {
  const parts = [];

  // Skull
  parts.push({
    id: 'skull',
    label: 'Skull',
    systems: ['skeletal', 'nervous'],
    type: 'sphere',
    args: [0.52, 24, 18],
    position: [0, 4.2, 0],
    scale: [1, 1.05, 1.1],
  });

  // Mandible
  parts.push({
    id: 'mandible',
    label: 'Mandible',
    systems: ['skeletal'],
    type: 'sphere',
    args: [0.28, 12, 8],
    position: [0, 3.62, 0.12],
    scale: [1.3, 0.55, 0.9],
  });

  // Spine (S-curve)
  parts.push({
    id: 'spine',
    label: 'Vertebral Column',
    systems: ['skeletal', 'nervous'],
    type: 'tube',
    points: [
      [0, 3.5, -0.10],
      [0, 3.2, -0.14],
      [0, 2.9, -0.18],
      [0, 2.5, -0.21],
      [0, 2.1, -0.20],
      [0, 1.7, -0.17],
      [0, 1.3, -0.14],
      [0, 1.0, -0.15],
    ],
    radius: 0.055,
    segments: 28,
  });

  // Sacrum / coccyx
  parts.push({
    id: 'sacrum',
    label: 'Sacrum',
    systems: ['skeletal'],
    type: 'tube',
    points: [
      [0, 1.0, -0.15],
      [0, 0.88, -0.18],
      [0, 0.75, -0.22],
    ],
    radius: 0.06,
    segments: 8,
  });

  // Sternum
  parts.push({
    id: 'sternum',
    label: 'Sternum',
    systems: ['skeletal'],
    type: 'box',
    args: [0.07, 0.6, 0.035],
    position: [0, 2.65, 0.24],
  });

  // Ribs
  parts.push(...generateRibs());

  // Clavicles
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `clavicle-${sId}`,
      label: `${side} Clavicle`,
      systems: ['skeletal'],
      type: 'tube',
      points: [
        [sign * 0.06, 3.15, 0.18],
        [sign * 0.25, 3.18, 0.12],
        [sign * 0.50, 3.16, 0.04],
        [sign * 0.70, 3.10, -0.02],
      ],
      radius: 0.022,
      segments: 12,
    });
  }

  // Scapulae
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `scapula-${sId}`,
      label: `${side} Scapula`,
      systems: ['skeletal'],
      type: 'box',
      args: [0.22, 0.32, 0.025],
      position: [sign * 0.42, 2.82, -0.22],
      rotation: [0.1, 0, sign * 0.05],
    });
  }

  // Pelvis
  parts.push({
    id: 'pelvis',
    label: 'Pelvis',
    systems: ['skeletal'],
    type: 'sphere',
    args: [0.42, 16, 12],
    position: [0, 0.95, -0.02],
    scale: [1.4, 0.6, 0.75],
  });

  // Arms
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `humerus-${sId}`,
      label: `${side} Humerus`,
      systems: ['skeletal'],
      type: 'tube',
      points: [
        [sign * 0.72, 3.08, -0.02],
        [sign * 0.77, 2.70, 0.0],
        [sign * 0.81, 2.30, 0.02],
        [sign * 0.83, 1.95, 0.03],
      ],
      radius: 0.032,
      segments: 12,
    });
    parts.push({
      id: `forearm-${sId}`,
      label: `${side} Forearm`,
      systems: ['skeletal'],
      type: 'tube',
      points: [
        [sign * 0.83, 1.93, 0.04],
        [sign * 0.85, 1.60, 0.05],
        [sign * 0.87, 1.25, 0.04],
        [sign * 0.87, 0.98, 0.01],
      ],
      radius: 0.024,
      segments: 10,
    });
    parts.push({
      id: `hand-${sId}`,
      label: `${side} Hand`,
      systems: ['skeletal', 'nervous'],
      type: 'box',
      args: [0.13, 0.20, 0.05],
      position: [sign * 0.87, 0.78, 0.01],
    });
  }

  // Legs
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `femur-${sId}`,
      label: `${side} Femur`,
      systems: ['skeletal'],
      type: 'tube',
      points: [
        [sign * 0.28, 0.82, 0.0],
        [sign * 0.30, 0.40, 0.02],
        [sign * 0.30, -0.05, 0.03],
        [sign * 0.30, -0.45, 0.02],
      ],
      radius: 0.042,
      segments: 14,
    });
    parts.push({
      id: `tibia-${sId}`,
      label: `${side} Tibia`,
      systems: ['skeletal'],
      type: 'tube',
      points: [
        [sign * 0.30, -0.48, 0.04],
        [sign * 0.29, -0.90, 0.03],
        [sign * 0.28, -1.30, 0.02],
        [sign * 0.27, -1.65, 0.01],
      ],
      radius: 0.032,
      segments: 12,
    });
    parts.push({
      id: `fibula-${sId}`,
      label: `${side} Fibula`,
      systems: ['skeletal'],
      type: 'tube',
      points: [
        [sign * 0.32, -0.50, -0.01],
        [sign * 0.33, -0.90, -0.01],
        [sign * 0.33, -1.30, -0.02],
        [sign * 0.32, -1.65, -0.02],
      ],
      radius: 0.018,
      segments: 10,
    });
    parts.push({
      id: `foot-${sId}`,
      label: `${side} Foot`,
      systems: ['skeletal'],
      type: 'box',
      args: [0.13, 0.05, 0.26],
      position: [sign * 0.28, -1.78, 0.06],
    });
  }

  return parts;
}

/* ---------- CIRCULATORY ---------- */

function buildCirculatory() {
  const parts = [];

  // Heart
  parts.push({
    id: 'heart',
    label: 'Heart',
    systems: ['circulatory', 'muscular'],
    type: 'sphere',
    args: [0.2, 16, 12],
    position: [-0.12, 2.65, 0.12],
    scale: [1, 1.15, 0.9],
  });

  // Aortic arch
  parts.push({
    id: 'aortic-arch',
    label: 'Aortic Arch',
    systems: ['circulatory'],
    type: 'tube',
    points: [
      [-0.08, 2.78, 0.10],
      [-0.04, 2.95, 0.06],
      [0.0, 3.02, 0.0],
      [0.0, 2.98, -0.08],
      [0.0, 2.85, -0.12],
    ],
    radius: 0.03,
    segments: 16,
  });

  // Descending aorta
  parts.push({
    id: 'descending-aorta',
    label: 'Descending Aorta',
    systems: ['circulatory'],
    type: 'tube',
    points: [
      [0.0, 2.85, -0.12],
      [0.0, 2.4, -0.14],
      [0.0, 1.9, -0.13],
      [0.0, 1.4, -0.11],
      [0.0, 1.0, -0.10],
    ],
    radius: 0.025,
    segments: 16,
  });

  // Carotid arteries (up the neck to brain)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `carotid-${sId}`,
      label: `${side} Carotid Artery`,
      systems: ['circulatory'],
      type: 'tube',
      points: [
        [sign * 0.02, 3.0, 0.02],
        [sign * 0.08, 3.25, 0.04],
        [sign * 0.10, 3.50, 0.02],
        [sign * 0.10, 3.80, 0.0],
      ],
      radius: 0.015,
      segments: 12,
    });
  }

  // Subclavian → brachial (arm arteries)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `arm-artery-${sId}`,
      label: `${side} Brachial Artery`,
      systems: ['circulatory'],
      type: 'tube',
      points: [
        [sign * 0.04, 3.0, 0.0],
        [sign * 0.35, 3.05, 0.02],
        [sign * 0.65, 2.90, 0.02],
        [sign * 0.78, 2.45, 0.03],
        [sign * 0.84, 1.90, 0.04],
        [sign * 0.86, 1.40, 0.03],
      ],
      radius: 0.012,
      segments: 16,
    });
  }

  // Iliac → femoral (leg arteries)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `leg-artery-${sId}`,
      label: `${side} Femoral Artery`,
      systems: ['circulatory'],
      type: 'tube',
      points: [
        [sign * 0.02, 1.0, -0.06],
        [sign * 0.15, 0.80, 0.02],
        [sign * 0.25, 0.40, 0.04],
        [sign * 0.28, -0.10, 0.04],
        [sign * 0.29, -0.60, 0.03],
        [sign * 0.28, -1.20, 0.02],
      ],
      radius: 0.012,
      segments: 18,
    });
  }

  return parts;
}

/* ---------- NERVOUS ---------- */

function buildNervous() {
  const parts = [];

  // Brain
  parts.push({
    id: 'brain',
    label: 'Brain',
    systems: ['nervous'],
    type: 'sphere',
    args: [0.42, 20, 16],
    position: [0, 4.3, -0.02],
    scale: [1, 0.9, 1.05],
  });

  // Cerebellum
  parts.push({
    id: 'cerebellum',
    label: 'Cerebellum',
    systems: ['nervous'],
    type: 'sphere',
    args: [0.2, 12, 10],
    position: [0, 3.95, -0.22],
  });

  // Spinal cord
  parts.push({
    id: 'spinal-cord',
    label: 'Spinal Cord',
    systems: ['nervous'],
    type: 'tube',
    points: [
      [0, 3.90, -0.10],
      [0, 3.50, -0.09],
      [0, 3.20, -0.12],
      [0, 2.90, -0.16],
      [0, 2.50, -0.18],
      [0, 2.10, -0.17],
      [0, 1.70, -0.14],
      [0, 1.30, -0.12],
    ],
    radius: 0.018,
    segments: 24,
  });

  // Brachial plexus (nerve branches to arms)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `brachial-nerve-${sId}`,
      label: `${side} Brachial Plexus`,
      systems: ['nervous'],
      type: 'tube',
      points: [
        [sign * 0.02, 3.20, -0.12],
        [sign * 0.20, 3.15, -0.06],
        [sign * 0.45, 3.08, -0.02],
        [sign * 0.68, 2.90, 0.0],
        [sign * 0.80, 2.50, 0.02],
        [sign * 0.85, 2.00, 0.03],
        [sign * 0.86, 1.50, 0.03],
        [sign * 0.87, 1.00, 0.02],
      ],
      radius: 0.008,
      segments: 20,
    });
  }

  // Sciatic nerves (down to legs)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `sciatic-nerve-${sId}`,
      label: `${side} Sciatic Nerve`,
      systems: ['nervous'],
      type: 'tube',
      points: [
        [sign * 0.05, 1.10, -0.14],
        [sign * 0.18, 0.85, -0.10],
        [sign * 0.25, 0.40, -0.04],
        [sign * 0.28, -0.10, -0.02],
        [sign * 0.29, -0.60, -0.01],
        [sign * 0.28, -1.10, 0.0],
        [sign * 0.27, -1.50, 0.0],
      ],
      radius: 0.008,
      segments: 18,
    });
  }

  return parts;
}

/* ---------- DIGESTIVE ---------- */

function buildDigestive() {
  const parts = [];

  // Esophagus
  parts.push({
    id: 'esophagus',
    label: 'Esophagus',
    systems: ['digestive'],
    type: 'tube',
    points: [
      [0, 3.40, -0.04],
      [0, 3.10, -0.06],
      [0, 2.80, -0.06],
      [-0.05, 2.50, -0.04],
      [-0.10, 2.20, 0.0],
      [-0.12, 2.00, 0.06],
    ],
    radius: 0.022,
    segments: 16,
  });

  // Stomach
  parts.push({
    id: 'stomach',
    label: 'Stomach',
    systems: ['digestive'],
    type: 'sphere',
    args: [0.25, 14, 10],
    position: [-0.15, 1.92, 0.08],
    scale: [1.2, 0.85, 0.75],
  });

  // Liver
  parts.push({
    id: 'liver',
    label: 'Liver',
    systems: ['digestive'],
    type: 'sphere',
    args: [0.30, 14, 10],
    position: [0.20, 2.10, 0.10],
    scale: [1.3, 0.65, 0.8],
  });

  // Pancreas
  parts.push({
    id: 'pancreas',
    label: 'Pancreas',
    systems: ['digestive'],
    type: 'cylinder',
    args: [0.04, 0.06, 0.35, 8],
    position: [0, 1.88, -0.02],
    rotation: [0, 0, Math.PI / 2 * 0.85],
  });

  // Small intestine — zigzag coils in lower abdomen
  const siPts = [];
  siPts.push([0.05, 1.78, 0.06]);
  for (let row = 0; row < 8; row++) {
    const y = 1.72 - row * 0.055;
    const xDir = row % 2 === 0 ? 1 : -1;
    siPts.push([xDir * 0.20, y, 0.08 + Math.sin(row) * 0.02]);
    siPts.push([xDir * -0.20, y - 0.025, 0.07 + Math.cos(row) * 0.02]);
  }
  siPts.push([0.25, 1.22, 0.05]);

  parts.push({
    id: 'small-intestine',
    label: 'Small Intestine',
    systems: ['digestive'],
    type: 'tube',
    points: siPts,
    radius: 0.025,
    segments: 48,
  });

  // Large intestine — ascending
  parts.push({
    id: 'ascending-colon',
    label: 'Ascending Colon',
    systems: ['digestive'],
    type: 'tube',
    points: [
      [0.30, 1.18, 0.04],
      [0.32, 1.40, 0.03],
      [0.33, 1.62, 0.02],
      [0.32, 1.82, 0.01],
    ],
    radius: 0.035,
    segments: 12,
  });

  // Large intestine — transverse
  parts.push({
    id: 'transverse-colon',
    label: 'Transverse Colon',
    systems: ['digestive'],
    type: 'tube',
    points: [
      [0.32, 1.84, 0.03],
      [0.15, 1.88, 0.06],
      [0, 1.90, 0.07],
      [-0.15, 1.88, 0.06],
      [-0.32, 1.84, 0.03],
    ],
    radius: 0.035,
    segments: 14,
  });

  // Large intestine — descending
  parts.push({
    id: 'descending-colon',
    label: 'Descending Colon',
    systems: ['digestive'],
    type: 'tube',
    points: [
      [-0.32, 1.82, 0.01],
      [-0.33, 1.62, 0.02],
      [-0.32, 1.40, 0.03],
      [-0.30, 1.18, 0.04],
      [-0.22, 1.08, 0.06],
    ],
    radius: 0.035,
    segments: 14,
  });

  return parts;
}

/* ---------- RESPIRATORY ---------- */

function buildRespiratory() {
  const parts = [];

  // Trachea
  parts.push({
    id: 'trachea',
    label: 'Trachea',
    systems: ['respiratory'],
    type: 'tube',
    points: [
      [0, 3.50, 0.06],
      [0, 3.30, 0.06],
      [0, 3.10, 0.06],
      [0, 2.92, 0.05],
    ],
    radius: 0.03,
    segments: 12,
  });

  // Main bronchi (Y-split)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `bronchus-${sId}`,
      label: `${side} Main Bronchus`,
      systems: ['respiratory'],
      type: 'tube',
      points: [
        [0, 2.92, 0.05],
        [sign * 0.10, 2.85, 0.03],
        [sign * 0.22, 2.78, 0.0],
      ],
      radius: 0.022,
      segments: 10,
    });

    // Secondary bronchi (further branching)
    parts.push({
      id: `bronchiole-upper-${sId}`,
      label: `${side} Upper Bronchiole`,
      systems: ['respiratory'],
      type: 'tube',
      points: [
        [sign * 0.22, 2.78, 0.0],
        [sign * 0.28, 2.82, -0.04],
        [sign * 0.34, 2.85, -0.06],
      ],
      radius: 0.012,
      segments: 8,
    });
    parts.push({
      id: `bronchiole-lower-${sId}`,
      label: `${side} Lower Bronchiole`,
      systems: ['respiratory'],
      type: 'tube',
      points: [
        [sign * 0.22, 2.78, 0.0],
        [sign * 0.30, 2.68, -0.02],
        [sign * 0.36, 2.58, -0.04],
      ],
      radius: 0.012,
      segments: 8,
    });
  }

  // Lungs (translucent volumes)
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `lung-${sId}`,
      label: `${side} Lung`,
      systems: ['respiratory'],
      type: 'sphere',
      args: [0.35, 16, 12],
      position: [sign * 0.30, 2.62, -0.02],
      scale: [0.75, 1.15, 0.65],
    });
  }

  // Diaphragm (flat disc)
  parts.push({
    id: 'diaphragm',
    label: 'Diaphragm',
    systems: ['respiratory', 'muscular'],
    type: 'cylinder',
    args: [0.52, 0.52, 0.035, 20],
    position: [0, 2.15, 0.02],
    scale: [1.1, 1, 0.7],
  });

  return parts;
}

/* ---------- MUSCULAR ---------- */

function buildMuscular() {
  const parts = [];

  // Trapezius (upper back / neck)
  parts.push({
    id: 'trapezius',
    label: 'Trapezius',
    systems: ['muscular'],
    type: 'sphere',
    args: [0.35, 12, 10],
    position: [0, 3.10, -0.16],
    scale: [1.8, 0.8, 0.4],
  });

  // Pectorals
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `pectoral-${sId}`,
      label: `${side} Pectoral`,
      systems: ['muscular'],
      type: 'sphere',
      args: [0.22, 12, 10],
      position: [sign * 0.22, 2.80, 0.16],
      scale: [1.4, 0.8, 0.5],
    });
  }

  // Deltoids
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `deltoid-${sId}`,
      label: `${side} Deltoid`,
      systems: ['muscular'],
      type: 'sphere',
      args: [0.14, 10, 8],
      position: [sign * 0.72, 3.02, 0.0],
      scale: [1.1, 1.2, 1.0],
    });
  }

  // Biceps
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `bicep-${sId}`,
      label: `${side} Bicep`,
      systems: ['muscular'],
      type: 'sphere',
      args: [0.10, 10, 8],
      position: [sign * 0.80, 2.48, 0.06],
      scale: [0.8, 1.8, 0.9],
    });
  }

  // Abdominals
  parts.push({
    id: 'abdominals',
    label: 'Abdominals',
    systems: ['muscular'],
    type: 'box',
    args: [0.28, 0.55, 0.08],
    position: [0, 1.75, 0.18],
  });

  // Gluteus
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `gluteus-${sId}`,
      label: `${side} Gluteus`,
      systems: ['muscular'],
      type: 'sphere',
      args: [0.16, 10, 8],
      position: [sign * 0.18, 0.85, -0.12],
      scale: [1.1, 0.9, 1.0],
    });
  }

  // Quadriceps
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `quadricep-${sId}`,
      label: `${side} Quadricep`,
      systems: ['muscular'],
      type: 'sphere',
      args: [0.12, 10, 8],
      position: [sign * 0.30, 0.10, 0.08],
      scale: [0.85, 2.2, 0.9],
    });
  }

  // Calves
  for (const [side, sign, sId] of SIDES) {
    parts.push({
      id: `calf-${sId}`,
      label: `${side} Calf`,
      systems: ['muscular'],
      type: 'sphere',
      args: [0.08, 10, 8],
      position: [sign * 0.30, -0.85, -0.04],
      scale: [0.9, 2.0, 1.0],
    });
  }

  return parts;
}

/* ================================================================
   ASSEMBLE ALL PARTS
   ================================================================ */

function buildAllParts() {
  return [
    ...buildSkeletal(),
    ...buildCirculatory(),
    ...buildNervous(),
    ...buildDigestive(),
    ...buildRespiratory(),
    ...buildMuscular(),
  ];
}

/* ================================================================
   GEOMETRY FACTORY — creates Three.js BufferGeometry from part desc.
   ================================================================ */

function createGeometry(part) {
  switch (part.type) {
    case 'tube':
      return tubeGeo(
        part.points,
        part.radius || 0.02,
        part.segments || 20
      );
    case 'sphere':
      return new THREE.SphereGeometry(...(part.args || [0.2, 12, 10]));
    case 'cylinder':
      return new THREE.CylinderGeometry(...(part.args || [0.1, 0.1, 0.5, 8]));
    case 'box':
      return new THREE.BoxGeometry(...(part.args || [0.2, 0.2, 0.2]));
    default:
      return new THREE.SphereGeometry(0.1, 8, 8);
  }
}

/* ================================================================
   REACT COMPONENT
   ================================================================ */

export default function PlaceholderBody({
  activeSystem,
  systemColorMap,
  selectedPart,
  onSelectPart,
}) {
  const parts = useMemo(() => buildAllParts(), []);

  // Create all geometries once
  const geometries = useMemo(() => {
    const map = {};
    for (const p of parts) {
      map[p.id] = createGeometry(p);
    }
    return map;
  }, [parts]);

  // Refs for mesh instances (for pulse animation)
  const meshRefs = useRef({});
  const prevSelected = useRef(null);

  // Single useFrame for selected-part pulse (no per-part hooks)
  useFrame(({ clock }) => {
    // Reset previous selection
    if (prevSelected.current && prevSelected.current !== selectedPart) {
      const m = meshRefs.current[prevSelected.current];
      const p = parts.find((x) => x.id === prevSelected.current);
      if (m && p) m.scale.set(...(p.scale || [1, 1, 1]));
    }
    prevSelected.current = selectedPart;

    // Pulse current selection
    if (selectedPart) {
      const m = meshRefs.current[selectedPart];
      const p = parts.find((x) => x.id === selectedPart);
      if (m && p) {
        const base = p.scale || [1, 1, 1];
        const t = Math.sin(clock.elapsedTime * PULSE_SPEED);
        const s = THREE.MathUtils.lerp(0.93, 1.07, (t + 1) / 2);
        m.scale.set(base[0] * s, base[1] * s, base[2] * s);
      }
    }
  });

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  }, []);
  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group>
      {parts.map((part) => {
        const belongsToActive =
          activeSystem && part.systems.includes(activeSystem);
        const isDimmed = activeSystem && !belongsToActive;
        const color = belongsToActive
          ? systemColorMap[activeSystem] || BASE_COLOR
          : BASE_COLOR;
        const opacity = isDimmed
          ? DIM_OPACITY
          : belongsToActive
          ? ACTIVE_OPACITY
          : DEFAULT_OPACITY;

        return (
          <mesh
            key={part.id}
            ref={(el) => {
              if (el) meshRefs.current[part.id] = el;
            }}
            geometry={geometries[part.id]}
            position={part.position || [0, 0, 0]}
            rotation={part.rotation || [0, 0, 0]}
            scale={part.scale || [1, 1, 1]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPart(part);
            }}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity}
              roughness={0.6}
              metalness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
