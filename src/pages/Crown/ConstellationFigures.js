import React, { useMemo } from 'react';
import * as THREE from 'three';
import constellationsData from '../../data/constellations.json';
import { ZODIAC_RADIUS, ZODIAC_CONSTELLATION_MAP } from '../../components/chronosphaera/vr/constants3D';

// ── Coordinate conversion (same as ZodiacSphere.js) ───────────────────
const DEG2RAD = Math.PI / 180;
const OBLIQUITY = 23.4393 * DEG2RAD;
const COS_OBL = Math.cos(OBLIQUITY);
const SIN_OBL = Math.sin(OBLIQUITY);

function equatorialToEcliptic(lonDeg, latDeg) {
  const alpha = lonDeg * DEG2RAD;
  const delta = latDeg * DEG2RAD;
  const sinBeta = Math.sin(delta) * COS_OBL - Math.cos(delta) * SIN_OBL * Math.sin(alpha);
  const beta = Math.asin(Math.max(-1, Math.min(1, sinBeta)));
  const lambda = Math.atan2(
    Math.sin(alpha) * COS_OBL + Math.tan(delta) * SIN_OBL,
    Math.cos(alpha)
  );
  return { lambda, beta };
}

// ── Figure path data ──────────────────────────────────────────────────
// Each figure: array of strokes. Each stroke: array of [x, y] in 0–100 space.
// Drawn as golden line art on transparent canvas, then mapped onto cylinder.

const FIGURE_PATHS = {
  // Aries — Ram, side profile facing left
  Ari: [
    [[55,28],[48,18],[38,16],[35,22],[40,28]],        // right horn spiral
    [[55,28],[62,18],[72,16],[75,22],[70,28]],        // left horn spiral
    [[40,28],[55,35],[70,28]],                         // forehead
    [[45,35],[55,42],[65,35]],                         // snout
    [[55,42],[55,52],[50,58],[42,62],[38,72]],         // chest + front leg
    [[42,62],[55,65],[68,62]],                         // belly
    [[68,62],[72,72]],                                 // back leg
    [[55,52],[60,50],[68,55],[72,48],[78,45]],         // back + tail
  ],

  // Taurus — Bull, front-facing head and horns
  Tau: [
    [[20,50],[30,30],[38,20],[42,15]],                 // left horn
    [[80,50],[70,30],[62,20],[58,15]],                 // right horn
    [[20,50],[35,55],[50,58],[65,55],[80,50]],         // brow line
    [[35,55],[40,65],[45,70],[50,72],[55,70],[60,65],[65,55]], // face
    [[42,62],[45,64]],                                 // left nostril
    [[58,62],[55,64]],                                 // right nostril
    [[38,48],[42,50]],                                 // left eye
    [[62,48],[58,50]],                                 // right eye
    [[50,72],[45,82],[40,90]],                         // left shoulder
    [[50,72],[55,82],[60,90]],                         // right shoulder
  ],

  // Gemini — Twins standing together
  Gem: [
    [[32,18],[32,22],[30,22],[34,22],[32,22],[32,45]], // left head + body
    [[32,35],[22,42]],                                 // left arm out
    [[32,35],[40,30]],                                 // left arm to twin
    [[32,45],[25,70],[22,85]],                         // left leg L
    [[32,45],[38,70],[40,85]],                         // left leg R
    [[62,18],[62,22],[60,22],[64,22],[62,22],[62,45]], // right head + body
    [[62,35],[72,42]],                                 // right arm out
    [[62,35],[54,30]],                                 // right arm to twin
    [[62,45],[55,70],[52,85]],                         // right leg L
    [[62,45],[68,70],[72,85]],                         // right leg R
    [[40,30],[54,30]],                                 // connecting hands
  ],

  // Cancer — Crab, top-down view
  Cnc: [
    [[35,45],[40,40],[50,38],[60,40],[65,45]],         // top shell
    [[35,45],[40,52],[50,55],[60,52],[65,45]],         // bottom shell
    [[35,45],[25,35],[18,28],[15,32]],                 // left claw upper
    [[35,45],[25,40],[18,35],[15,38]],                 // left claw lower
    [[65,45],[75,35],[82,28],[85,32]],                 // right claw upper
    [[65,45],[75,40],[82,35],[85,38]],                 // right claw lower
    [[38,52],[32,62],[28,70]],                         // left legs
    [[45,55],[42,65],[38,73]],                         // left mid leg
    [[55,55],[58,65],[62,73]],                         // right mid leg
    [[62,52],[68,62],[72,70]],                         // right legs
  ],

  // Leo — Lion, side profile
  Leo: [
    [[25,32],[30,25],[38,22],[45,25],[48,32]],         // mane top
    [[25,32],[22,38],[25,42],[30,42]],                 // mane left
    [[48,32],[50,38],[48,42],[42,42]],                 // mane right
    [[30,42],[35,45],[42,42]],                         // chin
    [[35,38],[38,40]],                                 // eye
    [[36,42],[37,44]],                                 // nose
    [[42,35],[55,30],[68,32],[75,38]],                 // back
    [[30,42],[32,50],[30,58],[28,65],[25,75]],         // front leg 1
    [[35,50],[33,58],[32,68]],                         // front leg 2
    [[68,42],[65,55],[62,65],[60,75]],                 // back leg 1
    [[72,40],[70,52],[68,62],[67,72]],                 // back leg 2
    [[42,42],[42,50],[35,50]],                         // chest
    [[68,42],[75,38],[80,35],[85,30],[82,25]],         // tail curling up
  ],

  // Virgo — Standing woman holding wheat
  Vir: [
    [[50,12],[50,16],[48,16],[52,16],[50,16],[50,38]], // head + body
    [[50,30],[38,22],[35,20]],                         // left arm up (holding wheat)
    [[35,20],[33,15],[36,12],[38,15],[34,10]],         // wheat sheaf
    [[50,30],[62,38],[68,42]],                         // right arm down
    [[50,38],[50,42],[42,55],[38,68],[35,85]],         // left dress/leg
    [[50,42],[58,55],[62,68],[65,85]],                 // right dress/leg
    [[42,55],[58,55]],                                 // dress mid
    [[40,65],[60,65]],                                 // dress lower
  ],

  // Libra — Balance scales
  Lib: [
    [[50,75],[50,30]],                                 // center post
    [[50,30],[50,25],[48,22],[52,22],[50,25]],         // fulcrum point
    [[25,35],[75,35]],                                 // beam
    [[25,35],[20,40],[30,40],[25,35]],                 // left pan
    [[20,40],[18,45],[22,48],[28,48],[32,45],[30,40]], // left pan bowl
    [[75,35],[70,40],[80,40],[75,35]],                 // right pan
    [[70,40],[68,45],[72,48],[78,48],[82,45],[80,40]], // right pan bowl
  ],

  // Scorpio — Scorpion, side view
  Sco: [
    [[15,45],[20,42],[25,40],[18,38],[12,42]],         // left claw
    [[15,50],[20,52],[25,50],[18,55],[12,52]],         // right claw
    [[25,45],[32,44],[40,45],[48,46]],                 // body segments
    [[48,46],[55,44],[60,40],[65,34]],                 // tail rising
    [[65,34],[68,28],[72,24],[75,22]],                 // tail tip
    [[75,22],[78,20],[76,18]],                         // stinger
    [[32,48],[30,55],[28,60]],                         // leg 1
    [[38,48],[37,56],[35,62]],                         // leg 2
    [[44,49],[44,57],[43,63]],                         // leg 3
    [[50,48],[52,56],[53,62]],                         // leg 4
  ],

  // Sagittarius — Centaur archer
  Sgr: [
    [[45,18],[45,22],[43,22],[47,22],[45,22],[45,35]], // head + torso
    [[45,28],[35,22],[30,18]],                         // bow arm
    [[45,28],[55,22],[60,20]],                         // draw arm
    [[30,18],[25,28],[22,38],[30,38],[35,30],[30,18]], // bow curve
    [[22,18],[35,22]],                                 // arrow
    [[45,35],[42,38],[35,42],[30,50]],                 // horse front
    [[30,50],[28,60],[25,72],[22,82]],                 // front leg 1
    [[32,50],[30,62],[28,75]],                         // front leg 2
    [[45,35],[52,38],[60,42],[68,48]],                 // horse back
    [[68,48],[70,58],[72,68],[75,80]],                 // back leg 1
    [[65,48],[68,60],[70,72]],                         // back leg 2
    [[68,48],[75,45],[80,40],[82,35]],                 // tail
  ],

  // Capricorn — Sea-goat (goat front, fish tail)
  Cap: [
    [[22,32],[28,22],[32,18]],                         // left horn
    [[32,32],[35,24],[38,20]],                         // right horn
    [[22,32],[25,38],[32,40],[38,38],[40,32]],         // head
    [[28,36],[30,38]],                                 // eye
    [[32,40],[32,48],[30,55],[28,62]],                 // front leg 1
    [[36,40],[35,50],[33,58]],                         // front leg 2
    [[38,38],[45,40],[52,42],[58,44]],                 // body
    [[58,44],[65,48],[72,55],[78,58]],                 // tail curving
    [[78,58],[82,55],[85,50]],                         // tail fin upper
    [[78,58],[82,62],[85,65]],                         // tail fin lower
    [[58,44],[62,38],[65,42]],                         // dorsal/transition
  ],

  // Aquarius — Figure pouring water from vessel
  Aqr: [
    [[50,12],[50,16],[48,16],[52,16],[50,16],[50,35]], // head + body
    [[50,28],[38,25],[32,28],[30,32],[35,35],[32,28]], // left arm + vessel
    [[50,28],[62,35]],                                 // right arm
    [[50,35],[42,55],[38,72],[35,85]],                 // left leg
    [[50,35],[58,55],[62,72],[65,85]],                 // right leg
    [[32,35],[28,42],[25,50],[22,58],[20,65]],         // water stream 1
    [[30,38],[26,45],[23,55],[22,62]],                 // water stream 2
    [[28,42],[32,48],[28,55],[32,62]],                 // water wavy
  ],

  // Pisces — Two fish connected by a band
  Psc: [
    [[20,30],[25,25],[32,24],[38,26],[40,30],[38,34],[32,36],[25,35],[20,30]], // fish 1
    [[32,24],[35,22],[38,24]],                         // fish 1 tail
    [[28,28],[30,30]],                                 // fish 1 eye
    [[70,60],[75,55],[82,54],[88,56],[90,60],[88,64],[82,66],[75,65],[70,60]], // fish 2
    [[82,54],[85,52],[88,54]],                         // fish 2 tail
    [[78,58],[80,60]],                                 // fish 2 eye
    [[38,33],[42,36],[48,40],[52,44],[58,50],[62,55],[68,60]], // connecting band
  ],
};

// ── Canvas texture generator ──────────────────────────────────────────
function createFigureTexture(paths) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const s = size / 100; // scale from 0–100 to canvas px

  // Glow pass (thick, low opacity)
  ctx.strokeStyle = 'rgba(240, 192, 64, 0.25)';
  ctx.lineWidth = 6 * (size / 256);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of paths) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0] * s, stroke[0][1] * s);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i][0] * s, stroke[i][1] * s);
    }
    ctx.stroke();
  }

  // Main pass (thinner, brighter)
  ctx.strokeStyle = 'rgba(240, 200, 80, 0.7)';
  ctx.lineWidth = 2 * (size / 256);
  ctx.shadowColor = 'rgba(240, 192, 64, 0.6)';
  ctx.shadowBlur = 6;
  for (const stroke of paths) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0] * s, stroke[0][1] * s);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i][0] * s, stroke[i][1] * s);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Compute constellation center + extent on the zodiac cylinder ──────
function getConstellationPlacement(constellationId) {
  const constellation = constellationsData.find(c => c.id === constellationId);
  if (!constellation || constellation.lines.length === 0) return null;

  // Collect all unique star ecliptic coords
  const coords = [];
  const seen = new Set();
  for (const [[lon1, lat1], [lon2, lat2]] of constellation.lines) {
    for (const [lon, lat] of [[lon1, lat1], [lon2, lat2]]) {
      const key = `${lon},${lat}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { lambda, beta } = equatorialToEcliptic(lon, lat);
      coords.push({ lambda, beta });
    }
  }

  if (coords.length === 0) return null;

  // Circular mean for lambda (handles wrapping)
  const sinSum = coords.reduce((s, c) => s + Math.sin(c.lambda), 0);
  const cosSum = coords.reduce((s, c) => s + Math.cos(c.lambda), 0);
  const centerLambda = Math.atan2(sinSum / coords.length, cosSum / coords.length);

  // Simple mean for beta (latitude)
  const centerBeta = coords.reduce((s, c) => s + c.beta, 0) / coords.length;

  // Compute angular span (unwrap around center)
  let minDLambda = Infinity, maxDLambda = -Infinity;
  let minBeta = Infinity, maxBeta = -Infinity;
  for (const c of coords) {
    let dl = c.lambda - centerLambda;
    while (dl > Math.PI) dl -= 2 * Math.PI;
    while (dl < -Math.PI) dl += 2 * Math.PI;
    if (dl < minDLambda) minDLambda = dl;
    if (dl > maxDLambda) maxDLambda = dl;
    if (c.beta < minBeta) minBeta = c.beta;
    if (c.beta > maxBeta) maxBeta = c.beta;
  }

  const spanLambda = maxDLambda - minDLambda;
  const spanBeta = maxBeta - minBeta;

  return { centerLambda, centerBeta, spanLambda, spanBeta };
}

// ── Main component ────────────────────────────────────────────────────
export default function ConstellationFigures() {
  const figures = useMemo(() => {
    const result = [];
    for (const [sign, conId] of Object.entries(ZODIAC_CONSTELLATION_MAP)) {
      const paths = FIGURE_PATHS[conId];
      if (!paths) continue;
      const placement = getConstellationPlacement(conId);
      if (!placement) continue;

      const texture = createFigureTexture(paths);
      result.push({ sign, conId, placement, texture });
    }
    return result;
  }, []);

  const R = ZODIAC_RADIUS - 0.15; // slightly inside the cylinder wall

  return (
    <group>
      {figures.map(({ conId, placement, texture }) => {
        const angle = -placement.centerLambda;
        const x = R * Math.cos(angle);
        const z = R * Math.sin(angle);
        const y = R * Math.tan(placement.centerBeta);

        // Size: convert angular span to world units, with minimum
        const width = Math.max(placement.spanLambda * R, 3);
        const height = Math.max(placement.spanBeta * R, 3);

        const lookAngle = Math.atan2(z, x);

        return (
          <mesh
            key={conId}
            position={[x, y, z]}
            rotation={[0, -lookAngle + Math.PI / 2, 0]}
          >
            <planeGeometry args={[width * 1.3, height * 1.3]} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}
