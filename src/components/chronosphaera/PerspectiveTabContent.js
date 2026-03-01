import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SELF_KEYS, DANTE_REALM_KEYS, TAB_LABEL_OVERRIDES, camelToTitle } from './usePerspective';
import { ARCANA_POSITIONS } from '../../games/mythouse/majorArcanaData';
import { getLibraryBooks } from '../../data/vaultLibraryMap';
import SourceBookPopup from './SourceBookPopup';

function labelFor(key) {
  return TAB_LABEL_OVERRIDES[key] || camelToTitle(key);
}

// Lookup: planet name → ARCANA_POSITIONS entry (for image + Waite description)
const PLANET_ARCANA = {};
for (const pos of ARCANA_POSITIONS) {
  if (pos.type === 'planet') {
    PLANET_ARCANA[pos.correspondence] = pos;
  }
}

function SourceBlock({ activeTradition }) {
  const [showPopup, setShowPopup] = useState(false);
  if (!activeTradition?.sourceText) return null;

  const books = getLibraryBooks(activeTradition.id);

  return (
    <div className="perspective-source-block">
      <p className="astrology-note">
        {activeTradition.sourceText} ({activeTradition.period})
        {books.length > 0 && (
          <button className="source-library-icon" onClick={() => setShowPopup(true)} title="View in Library">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </button>
        )}
      </p>
      {showPopup && (
        <SourceBookPopup books={books} tradition={activeTradition.tradition} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}

function TarotOverview({ data, planet, activeTradition }) {
  const arcana = PLANET_ARCANA[planet];
  const overview = data.overview;
  const imgSrc = arcana ? `/images/tarot/major-${String(arcana.number).padStart(2, '0')}.jpg` : null;

  return (
    <div className="tab-content">
      <h4 className="archetype-name">{data.majorArcana}</h4>
      <p className="sin-virtue-pair">{data.esotericTitle}</p>
      <div className="tarot-overview-layout">
        {imgSrc && (
          <div className="tarot-overview-image">
            <img src={imgSrc} alt={data.majorArcana} loading="lazy" />
            <Link to="/games/cards-tarot" className="tarot-full-deck-link">See full deck &rarr;</Link>
          </div>
        )}
        <div className="tarot-overview-text">
          <div className="body-section">
            <h5>Hebrew Letter</h5>
            <p>{data.hebrewLetter}</p>
          </div>
          <div className="body-section">
            <h5>Tree of Life</h5>
            <p>{data.treePath}</p>
          </div>
          {overview && overview.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
      {arcana?.waiteDesc && (
        <div className="body-section tarot-waite-section">
          <h5>A.E. Waite — The Pictorial Key to the Tarot (1911)</h5>
          <p className="tarot-waite-desc">{arcana.waiteDesc}</p>
        </div>
      )}
      <SourceBlock activeTradition={activeTradition} />
    </div>
  );
}

// Dante realm config: maps synthetic tab IDs to their data keys
const DANTE_REALM_CONFIG = {
  __paradiso__: {
    label: 'Paradiso',
    mainKey: 'paradise',
    mainLabel: 'Heaven',
    virtueKey: 'paradiseVirtue',
    noteKey: null,
    orderKey: 'paradise',
  },
  __purgatorio__: {
    label: 'Purgatorio',
    mainKey: 'purgatory',
    mainLabel: 'Terrace',
    virtueKey: 'purgatoryVirtue',
    noteKey: 'purgatoryNote',
    orderKey: 'purgatory',
  },
  __inferno__: {
    label: 'Inferno',
    mainKey: 'hell',
    mainLabel: 'Circle',
    virtueKey: null,
    noteKey: 'hellNote',
    orderKey: 'hell',
  },
};

function DanteRealmContent({ realmId, data, activeTradition }) {
  const cfg = DANTE_REALM_CONFIG[realmId];
  if (!cfg) return null;

  const mainText = data[cfg.mainKey];
  const virtue = cfg.virtueKey ? data[cfg.virtueKey] : null;
  const note = cfg.noteKey ? data[cfg.noteKey] : null;
  const order = activeTradition?.threeOrders?.[cfg.orderKey];

  return (
    <div className="tab-content">
      {mainText && (
        <div className="body-section">
          <p>{String(mainText)}</p>
        </div>
      )}
      {virtue && (
        <div className="body-section">
          <h5>Virtue</h5>
          <p>{String(virtue)}</p>
        </div>
      )}
      {note && (
        <div className="body-section dante-realm-note">
          <p>{String(note)}</p>
        </div>
      )}
      {order && (
        <div className="body-section dante-realm-order">
          <h5>{order.label}</h5>
          <p className="astrology-note">{order.note}</p>
        </div>
      )}
      <SourceBlock activeTradition={activeTradition} />
    </div>
  );
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

  // Dante realm tabs: grouped three-realm display
  if (DANTE_REALM_CONFIG[columnKey]) {
    return <DanteRealmContent realmId={columnKey} data={data} activeTradition={activeTradition} />;
  }

  // Tarot overview: special layout with card image
  if (columnKey === 'overview' && activeTradition?.tradition === 'Tarot') {
    return <TarotOverview data={data} planet={planet} activeTradition={activeTradition} />;
  }

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

      <SourceBlock activeTradition={activeTradition} />
    </div>
  );
}
