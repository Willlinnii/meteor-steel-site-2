import React, { useEffect } from 'react';
import './CrossStageModal.css';

export default function CrossStageModal({ title, subtitle, stages, entries, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="cross-stage-overlay" onClick={onClose}>
      <div className="cross-stage-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cross-stage-close" onClick={onClose}>{'\u2715'}</button>
        <h2 className="cross-stage-title">{title}</h2>
        {subtitle && <p className="cross-stage-subtitle">{subtitle}</p>}
        <div className="cross-stage-entries">
          {stages.map((stage, i) => {
            const entry = entries[i];
            if (!entry) return null;
            return (
              <div key={stage.id} className="cross-stage-entry">
                <div className="cross-stage-stage-label">{stage.label}</div>
                {entry.heading && <div className="cross-stage-heading">{entry.heading}</div>}
                <div className="cross-stage-text">
                  {entry.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
