import React, { useState } from 'react';
import './DodecahedronButton.css';

/* Schlegel-diagram dodecahedron: outer pentagon + inner rotated pentagon + connecting edges */
function DodecIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* outer pentagon */}
      <polygon points="12,3 20.6,9.2 17.3,19.3 6.7,19.3 3.4,9.2" fill="none" />
      {/* inner pentagon (rotated 36°) */}
      <polygon points="14.9,8 16.8,13.5 12,17 7.2,13.5 9.1,8" fill="none" />
      {/* connecting edges */}
      <line x1="12"   y1="3"    x2="14.9" y2="8" />
      <line x1="12"   y1="3"    x2="9.1"  y2="8" />
      <line x1="20.6" y1="9.2"  x2="14.9" y2="8" />
      <line x1="20.6" y1="9.2"  x2="16.8" y2="13.5" />
      <line x1="17.3" y1="19.3" x2="16.8" y2="13.5" />
      <line x1="17.3" y1="19.3" x2="12"   y2="17" />
      <line x1="6.7"  y1="19.3" x2="12"   y2="17" />
      <line x1="6.7"  y1="19.3" x2="7.2"  y2="13.5" />
      <line x1="3.4"  y1="9.2"  x2="7.2"  y2="13.5" />
      <line x1="3.4"  y1="9.2"  x2="9.1"  y2="8" />
    </svg>
  );
}

export default function DodecahedronButton({ className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={`dodec-btn ${className}`}
        onClick={() => setOpen(true)}
        title="Dodecahedron"
      >
        <DodecIcon />
      </button>

      {open && (
        <div className="dodec-overlay" onClick={() => setOpen(false)}>
          <div className="dodec-modal" onClick={e => e.stopPropagation()}>
            <button className="dodec-modal-close" onClick={() => setOpen(false)}>&times;</button>
            <div className="dodec-modal-icon">
              <DodecIcon size={64} />
            </div>
            <h2 className="dodec-modal-title">Dodecahedron</h2>
            <p className="dodec-modal-placeholder">Something is taking shape here...</p>
          </div>
        </div>
      )}
    </>
  );
}
