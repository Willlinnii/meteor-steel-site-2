import React from 'react';
import { SELF_KEYS, TAB_LABEL_OVERRIDES, camelToTitle } from './usePerspective';

function labelFor(key) {
  return TAB_LABEL_OVERRIDES[key] || camelToTitle(key);
}

export default function PerspectiveTabContent({ columnKey, perspectiveData, activeTradition, onColumnClick, planet }) {
  if (!perspectiveData) {
    return (
      <div className="tab-content">
        <p className="chrono-empty">No correspondence for {planet} in this tradition.</p>
      </div>
    );
  }

  const { data, epochName } = perspectiveData;
  const isSelfTab = columnKey === '__self__';

  // Collect self-fields present in this entry
  const selfEntries = isSelfTab
    ? Object.keys(data)
        .filter(k => SELF_KEYS.has(k) && data[k] != null && data[k] !== '')
        .map(k => ({ key: k, label: labelFor(k), value: String(data[k]) }))
    : null;

  const value = !isSelfTab ? data[columnKey] : null;
  const columnLabel = !isSelfTab ? labelFor(columnKey) : 'Self';

  return (
    <div className="tab-content">
      {epochName && (
        <p className="perspective-epoch-line">
          {activeTradition?.tradition} epoch: <strong>{epochName}</strong>
        </p>
      )}

      {isSelfTab ? (
        selfEntries && selfEntries.length > 0 ? (
          selfEntries.map(({ key, label, value: v }) => (
            <div
              key={key}
              className="body-section perspective-clickable"
              onClick={() => onColumnClick(key)}
              title={`View all planets — ${label}`}
            >
              <h5>{label}</h5>
              <p>{v}</p>
            </div>
          ))
        ) : (
          <p className="chrono-empty">No self data for {planet} in this tradition.</p>
        )
      ) : value != null && value !== '' ? (
        <div
          className="body-section perspective-clickable"
          onClick={() => onColumnClick(columnKey)}
          title={`View all planets — ${columnLabel}`}
        >
          <h5>{columnLabel}</h5>
          <p>{String(value)}</p>
        </div>
      ) : (
        <p className="chrono-empty">No {columnLabel.toLowerCase()} data for {planet} in this tradition.</p>
      )}

      {activeTradition?.sourceText && (
        <div className="perspective-source-block">
          <p className="astrology-note">{activeTradition.sourceText} ({activeTradition.period})</p>
        </div>
      )}
    </div>
  );
}
