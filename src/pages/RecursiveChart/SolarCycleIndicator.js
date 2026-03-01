import React from 'react';
import { getSolarCycleRule } from '../../data/recursiveRules';

/**
 * Format a Date as "Mon YYYY" for display.
 */
function formatFlipDate(d) {
  if (!d || isNaN(d.getTime())) return '?';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * SVG semicircular arc solar cycle indicator.
 * Arc sweeps from left (min) through top (max) to right (min).
 * Shows current position + optional birth position marker.
 * Polarity labels and dipole arrow show field orientation.
 * Now includes observed reversal dates from historical record.
 */
export default function SolarCycleIndicator({ solarCycle, birthSolarCycle }) {
  if (!solarCycle) return null;

  const { cycleNumber, phase, ascending, yearsInCycle,
          flipStart, flipEnd, observed, inReversal, note } = solarCycle;
  const rule = getSolarCycleRule(phase, ascending);

  // Arc geometry: 300x90 SVG, semicircle from left to right
  const W = 300;
  const H = 90;
  const cx = W / 2;
  const arcR = 120;
  const arcY = H - 10; // arc center y (bottom)

  // Phase 0->1 maps to angle PI->0 (left to right across the top)
  const phaseToAngle = (p) => Math.PI * (1 - p);

  // Point on the arc
  const arcPoint = (angle) => ({
    x: cx + arcR * Math.cos(angle),
    y: arcY - arcR * Math.sin(angle),
  });

  // Build the background arc path (full semicircle)
  const startPt = arcPoint(Math.PI);  // left (phase 0)
  const endPt = arcPoint(0);          // right (phase 1)
  const bgPath = `M${startPt.x},${startPt.y} A${arcR},${arcR} 0 0,1 ${endPt.x},${endPt.y}`;

  // Build the filled progress arc
  const currentAngle = phaseToAngle(phase);
  const currentPt = arcPoint(currentAngle);
  const largeArc = phase > 0.5 ? 1 : 0;
  const fillPath = `M${startPt.x},${startPt.y} A${arcR},${arcR} 0 ${largeArc},1 ${currentPt.x},${currentPt.y}`;

  // Birth marker
  let birthPt = null;
  if (birthSolarCycle) {
    const birthAngle = phaseToAngle(birthSolarCycle.phase);
    birthPt = arcPoint(birthAngle);
  }

  // Polarity: before solar max (ascending), dipole points "up" (+);
  // after flip (descending), dipole points "down" (-)
  const flipped = !ascending;

  // Dipole arrow at current position dot
  const arrowLen = 12;
  const arrowAngle = flipped ? Math.PI / 2 : -Math.PI / 2; // down when flipped, up when not
  const arrowDx = arrowLen * Math.cos(arrowAngle);
  const arrowDy = arrowLen * Math.sin(arrowAngle);

  // Reversal date display
  const flipStartStr = flipStart ? formatFlipDate(flipStart) : null;
  const flipEndStr = flipEnd ? formatFlipDate(flipEnd) : null;
  const sameFlipDate = flipStartStr === flipEndStr;
  const reversalLabel = observed
    ? (sameFlipDate ? `Reversal: ~${flipStartStr}` : `Reversal: ${flipStartStr} – ${flipEndStr}`)
    : (sameFlipDate ? `Estimated reversal: ~${flipStartStr}` : `Estimated reversal: ${flipStartStr} – ${flipEndStr}`);

  return (
    <div className="recursive-solar-container">
      <div className="recursive-solar-title">
        Solar Cycle {cycleNumber}
      </div>
      <div className="recursive-solar-arc-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <defs>
            <linearGradient id="rc-solar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-gold, #c9a961)" />
              <stop offset="100%" stopColor="var(--accent-ember, #d06040)" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path d={bgPath}
            fill="none" stroke="rgba(139,157,195,0.15)" strokeWidth="4" strokeLinecap="round"
          />

          {/* Filled progress arc */}
          <path d={fillPath}
            fill="none" stroke="url(#rc-solar-grad)" strokeWidth="4" strokeLinecap="round"
          />

          {/* Current position dot */}
          <circle cx={currentPt.x} cy={currentPt.y} r="5"
            fill="var(--accent-gold, #c9a961)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"
          >
            <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Dipole arrow at current position */}
          <line
            x1={currentPt.x}
            y1={currentPt.y}
            x2={currentPt.x + arrowDx}
            y2={currentPt.y + arrowDy}
            stroke="var(--accent-gold, #c9a961)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <polygon
            points={`${currentPt.x + arrowDx},${currentPt.y + arrowDy} ${currentPt.x + arrowDx - 3 * Math.cos(arrowAngle - 0.5)},${currentPt.y + arrowDy - 3 * Math.sin(arrowAngle - 0.5)} ${currentPt.x + arrowDx - 3 * Math.cos(arrowAngle + 0.5)},${currentPt.y + arrowDy - 3 * Math.sin(arrowAngle + 0.5)}`}
            fill="var(--accent-gold, #c9a961)"
            opacity="0.7"
          />

          {/* Birth marker */}
          {birthPt && (
            <>
              <circle cx={birthPt.x} cy={birthPt.y} r="3"
                fill="none" stroke="rgba(201,169,97,0.6)" strokeWidth="1"
              />
              <text x={birthPt.x} y={birthPt.y - 8}
                textAnchor="middle" fill="rgba(201,169,97,0.5)"
                fontSize="8" fontFamily="Cinzel, serif"
              >
                Birth
              </text>
            </>
          )}

          {/* Min / Max labels */}
          <text x={startPt.x - 2} y={startPt.y + 14}
            textAnchor="middle" fill="rgba(139,157,195,0.5)"
            fontSize="9" fontFamily="Cinzel, serif"
          >
            Min
          </text>
          <text x={cx} y={arcY - arcR - 8}
            textAnchor="middle" fill="rgba(201,169,97,0.6)"
            fontSize="9" fontFamily="Cinzel, serif"
          >
            Max
          </text>
          <text x={endPt.x + 2} y={endPt.y + 14}
            textAnchor="middle" fill="rgba(139,157,195,0.5)"
            fontSize="9" fontFamily="Cinzel, serif"
          >
            Min
          </text>

          {/* Polarity labels on ascending/descending sides */}
          <text x={startPt.x + 30} y={startPt.y - 8}
            textAnchor="middle" fill="rgba(201,169,97,0.4)"
            fontSize="10" fontFamily="Cinzel, serif"
          >
            +
          </text>
          <text x={endPt.x - 30} y={endPt.y - 8}
            textAnchor="middle" fill="rgba(208,96,64,0.4)"
            fontSize="10" fontFamily="Cinzel, serif"
          >
            &minus;
          </text>
        </svg>
      </div>
      <div className="recursive-solar-note">
        {rule.phase} — {yearsInCycle.toFixed(1)} years in
      </div>
      <div className="recursive-solar-reversal">
        {inReversal && <span className="rc-reversal-active">Reversal in progress</span>}
        {!inReversal && <span className="rc-reversal-date">{reversalLabel}</span>}
        {observed && <span className="rc-reversal-observed" title={note || 'WSO/HMI magnetogram data'}>Observed</span>}
        {!observed && <span className="rc-reversal-estimated" title={note || 'Extrapolated from average cycle length'}>Estimated</span>}
      </div>
    </div>
  );
}
