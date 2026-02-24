import { useRef, useEffect } from 'react';

/**
 * Signed shortest-arc angular difference: how far `a` is from `b` (-180..+180).
 */
function angleDiff(a, b) {
  let d = a - b;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Detect if heading moved from one side of `boundary` to the other.
 */
function crossedBoundary(prev, curr, boundary) {
  const d1 = angleDiff(prev, boundary);
  const d2 = angleDiff(curr, boundary);
  return d1 * d2 < 0 && Math.abs(d1) < 15 && Math.abs(d2) < 15;
}

// Cardinal boundaries at 0° (N), 90° (E), 180° (S), 270° (W)
const CARDINALS = new Set([0, 90, 180, 270]);

// All boundaries: cardinals + zodiac sign edges every 30°
const ALL_BOUNDARIES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/**
 * Hook that triggers haptic feedback when the compass heading
 * crosses cardinal directions (stronger pulse) or zodiac sign
 * boundaries (lighter pulse).
 *
 * @param {number} heading  — current compass heading (0-360), or null if inactive
 * @param {boolean} active  — whether compass mode is on
 */
export default function useHapticFeedback(heading, active) {
  const prevRef = useRef(null);
  const cooldownRef = useRef(0);

  useEffect(() => {
    if (!active || heading == null || !('vibrate' in navigator)) {
      prevRef.current = null;
      return;
    }

    const prev = prevRef.current;
    prevRef.current = heading;

    if (prev === null) return;

    // Cooldown: no double-fire within 180ms
    const now = performance.now();
    if (now - cooldownRef.current < 180) return;

    for (const boundary of ALL_BOUNDARIES) {
      if (crossedBoundary(prev, heading, boundary)) {
        const isCardinal = CARDINALS.has(boundary);
        navigator.vibrate(isCardinal ? 25 : 10);
        cooldownRef.current = now;
        break;
      }
    }
  }, [heading, active]);
}
