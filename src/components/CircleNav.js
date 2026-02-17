import React from 'react';

function getStageAngles(stages, clockwise) {
  const step = clockwise ? 45 : -45;
  return stages.map((s, i) => {
    const angle = -90 + step * i;
    const tangent = angle + 90;
    let norm = ((tangent + 180) % 360 + 360) % 360 - 180;
    let labelRotation = norm;
    if (norm > 90) labelRotation = norm - 180;
    if (norm < -90) labelRotation = norm + 180;
    if (s.flipLabel) labelRotation += 180;
    return { ...s, angle, labelRotation };
  });
}

export default function CircleNav({ stages, currentStage, onSelectStage, clockwise, onToggleDirection, centerLine1, centerLine2, centerLine3, showAuthor = true }) {
  const radius = 42;
  const computed = getStageAngles(stages, clockwise);

  return (
    <div className="circle-nav-wrapper">
      <div className="circle-nav">
        <svg viewBox="0 0 100 100" className="circle-rings">
          <circle cx="50" cy="50" r="47" className="ring ring-outer" />
          <circle cx="50" cy="50" r="38" className="ring ring-inner" />
        </svg>

        <div
          className={`circle-center ${currentStage === 'overview' ? 'active' : ''}`}
          onClick={() => onSelectStage('overview')}
        >
          {(centerLine1 == null ? 'Journey' : centerLine1) && <span className="center-title-journey">{centerLine1 == null ? 'Journey' : centerLine1}</span>}
          {(centerLine2 == null ? 'of' : centerLine2) && <span className="center-title-of">{centerLine2 == null ? 'of' : centerLine2}</span>}
          {(centerLine3 == null ? 'Fallen Starlight' : centerLine3) && <span className="center-title-fallen">{centerLine3 == null ? 'Fallen Starlight' : centerLine3}</span>}
          {showAuthor && (
            <span
              className={`center-author ${currentStage === 'bio' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onSelectStage('bio'); }}
            >
              Will Linn
            </span>
          )}
        </div>

        {computed.map(s => {
          const rad = (s.angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          return (
            <div
              key={s.id}
              className={`circle-stage ${currentStage === s.id ? 'active' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => onSelectStage(s.id)}
            >
              <span
                className="circle-stage-label"
                style={{ transform: `rotate(${s.labelRotation}deg)` }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <button className="direction-toggle" onClick={onToggleDirection}>
        {clockwise ? '\u21BB' : '\u21BA'}
      </button>
    </div>
  );
}
