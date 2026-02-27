import React from 'react';
import { BODY_SYSTEMS } from './BodySystemDefs';

export default function BodyContentPanel({ activeSystem, selectedPart }) {
  const systemDef = BODY_SYSTEMS.find((s) => s.id === activeSystem);

  return (
    <div className="microcosmos-content-container">
      {systemDef ? (
        <>
          <h2 className="microcosmos-heading">
            <span className="microcosmos-heading-icon">{systemDef.icon}</span>
            {systemDef.label} System
          </h2>
          <p className="microcosmos-description">{systemDef.description}</p>
          {selectedPart && (
            <p className="microcosmos-part-label">
              Selected: <strong>{selectedPart.label}</strong>
            </p>
          )}
        </>
      ) : selectedPart ? (
        <>
          <h2 className="microcosmos-heading">{selectedPart.label}</h2>
          <p className="microcosmos-description">
            Part of: {selectedPart.systems.join(', ')}
          </p>
        </>
      ) : (
        <p className="microcosmos-placeholder-text">
          Select a body system or click a part to explore
        </p>
      )}
    </div>
  );
}
