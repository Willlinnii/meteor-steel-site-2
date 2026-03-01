import React, { useRef, useEffect, useState } from 'react';
import './YinYangSpinner.css';

function drawYinYang(ctx, cx, cy, r, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Clip to outer circle
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // White half (left semicircle: from 90° to -90° counter-clockwise = left side)
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2);
  ctx.fillStyle = '#f0ead6';
  ctx.fill();

  // Black half (right semicircle)
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  // White upper bulge (S-curve top)
  ctx.beginPath();
  ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#f0ead6';
  ctx.fill();

  // Black lower bulge (S-curve bottom)
  ctx.beginPath();
  ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  // Black dot in white area
  ctx.beginPath();
  ctx.arc(0, -r / 2, r / 7, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  // White dot in black area
  ctx.beginPath();
  ctx.arc(0, r / 2, r / 7, 0, Math.PI * 2);
  ctx.fillStyle = '#f0ead6';
  ctx.fill();

  ctx.restore();

  // Outer ring (drawn outside clip)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 165, 90, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export default function YinYangSpinner() {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const animRef = useRef(null);
  const speedRef = useRef(2);
  const trailRef = useRef(1);

  const [speed, setSpeed] = useState(2);
  const [trail, setTrail] = useState(0);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Auto-compute trail from speed, but allow manual override
  const effectiveTrail = trail > 0 ? trail : (speed < 2 ? 1 : Math.min(0.98, 1 - (1.2 / speed)));
  useEffect(() => { trailRef.current = effectiveTrail; }, [effectiveTrail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 300;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';
    ctx.scale(dpr, dpr);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const r = displaySize * 0.38;
    let lastTime = performance.now();

    // Initial fill
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, displaySize, displaySize);

    function animate(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      angleRef.current += speedRef.current * Math.PI * 2 * dt;

      // Trail: low alpha = heavy trail (persistence), 1 = full clear
      const fadeAlpha = 1 - trailRef.current;
      ctx.fillStyle = `rgba(10, 10, 20, ${fadeAlpha})`;
      ctx.fillRect(0, 0, displaySize, displaySize);

      ctx.save();
      drawYinYang(ctx, cx, cy, r, angleRef.current);
      ctx.restore();

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const rpm = (speed * 60).toFixed(0);

  return (
    <div className="yinyang-spinner">
      <canvas ref={canvasRef} className="yinyang-canvas" />
      <div className="yinyang-controls">
        <label className="yinyang-label">
          Speed: {speed.toFixed(1)} rev/s ({rpm} RPM)
          <input
            type="range" min="0.5" max="30" step="0.5"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          />
        </label>
        <label className="yinyang-label">
          Trail: {(effectiveTrail * 100).toFixed(0)}%
          <input
            type="range" min="0" max="0.98" step="0.02"
            value={trail}
            onChange={e => setTrail(Number(e.target.value))}
          />
        </label>
        <div className="yinyang-hint">
          {speed < 5 && 'Crank it up to see the rings...'}
          {speed >= 5 && speed < 12 && 'Rings forming — the dots are tracing circles'}
          {speed >= 12 && speed < 20 && 'Concentric bands — the S-curve becomes geometry'}
          {speed >= 20 && 'Full strobe — persistence of vision in action'}
        </div>
      </div>
    </div>
  );
}
