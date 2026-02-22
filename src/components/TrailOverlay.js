import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import './TrailOverlay.css';

const PanoViewer = lazy(() => import('./PanoViewer'));

export default function TrailOverlay({ mediaSlots, onClose }) {
  const [current, setCurrent] = useState(0);

  const goNext = useCallback(() => {
    setCurrent(i => Math.min(i + 1, mediaSlots.length - 1));
  }, [mediaSlots.length]);

  const goPrev = useCallback(() => {
    setCurrent(i => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goNext, goPrev]);

  if (!mediaSlots || mediaSlots.length === 0) return null;

  const slot = mediaSlots[current];

  return (
    <div className="trail-overlay">
      <div className="trail-viewer">
        <Suspense fallback={<div className="trail-loading">Loading panorama...</div>}>
          <PanoViewer key={slot.slot} src={slot.url} type={slot.type} />
        </Suspense>
      </div>

      <div className="trail-chrome">
        <button className="trail-close" onClick={onClose} title="Close trail">
          &times;
        </button>

        <div className="trail-info">
          <div className="trail-counter">{current + 1} / {mediaSlots.length}</div>
          {slot.title && <h2 className="trail-title">{slot.title}</h2>}
          {slot.description && <p className="trail-desc">{slot.description}</p>}
        </div>

        <div className="trail-nav">
          <button
            className="trail-nav-btn"
            onClick={goPrev}
            disabled={current === 0}
            title="Previous"
          >
            &larr;
          </button>
          <button
            className="trail-nav-btn"
            onClick={goNext}
            disabled={current === mediaSlots.length - 1}
            title="Next"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
