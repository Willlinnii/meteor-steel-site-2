import React, { useState, useEffect } from 'react';
import './SolarMagneticField.css';

const ALIGNMENT_EXPLAIN = {
  aligned: {
    label: 'Aligned with Earth',
    detail: 'The solar wind\'s magnetic field is pointing northward right now — the same direction as Earth\'s field. When the two fields align, they don\'t connect easily. Earth\'s magnetosphere stays closed and quiet. Fewer particles get in. Aurora activity is low. Think of it like two magnets facing the same way — they slide past each other.',
  },
  opposing: {
    label: 'Opposing Earth',
    detail: 'The solar wind\'s magnetic field is pointing southward — opposite to Earth\'s northward field. When they point in opposite directions, the fields link up through a process called magnetic reconnection. Earth\'s magnetosphere opens and solar wind pours in along the field lines, energizing the radiation belts and lighting up the aurora. This is the active state — the one that drives geomagnetic storms.',
  },
  neutral: {
    label: 'Neutral',
    detail: 'The north-south component of the solar wind\'s magnetic field is near zero right now — neither clearly aligned with nor opposing Earth\'s field. Conditions are quiet. The field fluctuates constantly, so this can shift to aligned or opposing within minutes.',
  },
};

function formatNT(val) {
  return val != null ? `${val > 0 ? '+' : ''}${val.toFixed(1)} nT` : '—';
}

export default function SolarMagneticField() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/celestial?type=solar-field')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="solar-mag solar-mag-collapsed">
        <p className="solar-mag-loading">Loading solar wind data…</p>
      </div>
    );
  }

  if (!data) return null;

  const { current, hourAvg, alignment, polarField } = data;
  const avgSource = hourAvg || current;
  const info = ALIGNMENT_EXPLAIN[alignment] || ALIGNMENT_EXPLAIN.neutral;

  return (
    <div className={`solar-mag${open ? ' solar-mag-open' : ' solar-mag-collapsed'}`} onClick={() => setOpen(o => !o)}>
      {/* Collapsed: single line */}
      <div className="solar-mag-header">
        <span className={`solar-mag-dot ${alignment}`} />
        <span className="solar-mag-header-text">
          Solar Magnetic Field: <strong>{polarField.status.split('—')[0].trim()}</strong>
        </span>
        <span className={`solar-mag-chevron${open ? ' solar-mag-chevron-open' : ''}`}>&#9662;</span>
      </div>

      {/* Expanded */}
      {open && (
        <div className="solar-mag-body" onClick={e => e.stopPropagation()}>
          {/* Alignment indicator + explanation */}
          <div className="solar-mag-alignment">
            <div className="solar-mag-alignment-label">{info.label}</div>
            <p className="solar-mag-alignment-detail">{info.detail}</p>
          </div>

          {/* Live readings */}
          <div className="solar-mag-readings">
            <span className="solar-mag-reading">
              <span className="smr-label">Field strength</span>
              <span className="smr-value">{formatNT(current.bt)}</span>
            </span>
            <span className="solar-mag-reading">
              <span className="smr-label">Bz (north/south)</span>
              <span className="smr-value">{formatNT(avgSource.bz)}</span>
            </span>
            <span className="solar-mag-reading">
              <span className="smr-label">Sector</span>
              <span className="smr-value">{current.sector}</span>
            </span>
            {hourAvg && (
              <span className="solar-mag-reading">
                <span className="smr-label">1hr avg Bz</span>
                <span className="smr-value">{formatNT(hourAvg.bz)}</span>
              </span>
            )}
          </div>

          {/* Cycle context */}
          <div className="solar-mag-cycle">
            <p>{polarField.status}</p>
            <p>{polarField.earthComparison}</p>
          </div>
        </div>
      )}
    </div>
  );
}
