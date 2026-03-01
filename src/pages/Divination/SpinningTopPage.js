import React, { useState, useCallback, useRef } from 'react';
import { TOP_FACES } from '../../data/spinningTopData';

const FACE_COUNT = TOP_FACES.length;
const FACE_ANGLE = 360 / FACE_COUNT;

export default function SpinningTopPage() {
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState([]);
  const totalRotation = useRef(0);

  const handleSpin = useCallback(() => {
    setSpinning(true);
    setResult(null);
    const faceIdx = Math.floor(Math.random() * FACE_COUNT);
    const face = TOP_FACES[faceIdx];
    const fullRotations = (4 + Math.floor(Math.random() * 4)) * 360;
    const faceOffset = faceIdx * FACE_ANGLE;
    totalRotation.current += fullRotations + faceOffset;

    setTimeout(() => {
      setResult(face);
      setSpinning(false);
      setHistory(prev => [face.symbol, ...prev].slice(0, 20));
    }, 2200);
  }, []);

  return (
    <div className="divination-oracle divination-top">
      <div className="divination-top-stage">
        <div
          className={`divination-top-shape${spinning ? ' spinning' : ''}`}
          style={{
            transform: `rotate(${totalRotation.current}deg)`,
            transition: spinning
              ? 'transform 2.2s cubic-bezier(0.12, 0.8, 0.28, 1)'
              : 'none',
          }}
        >
          <div className="divination-top-face">
            {result ? result.symbol : '?'}
          </div>
        </div>
        <div className="divination-top-pointer">&#9660;</div>
      </div>

      <button className="divination-roll-btn" onClick={handleSpin} disabled={spinning}>
        {spinning ? 'Spinning...' : 'Spin'}
      </button>

      {result && !spinning && (
        <div className="divination-oracle-reading">
          <div className="divination-oracle-title">
            {result.symbol} &mdash; {result.label}
          </div>
          <div className="divination-oracle-text">{result.meaning}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="divination-oracle-history">
          {history.map((val, i) => (
            <div key={i} className="divination-oracle-history-item">{val}</div>
          ))}
        </div>
      )}

      <div className="divination-oracle-source">
        Teetotum. Roman/medieval four-sided lot-casting top.
        Faces: T (Totum), A (Aufer), D (Depone), N (Nihil).
      </div>
    </div>
  );
}
