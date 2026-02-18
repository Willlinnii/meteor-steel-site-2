import React, { useState, useCallback, useMemo } from 'react';
import {
  buildPlayingDeck, SUITS, CULTURES,
  getArcanaForCulture, getArcanaPosition, getCrossReference,
} from './mythouseCardData';

export default function MythouseCards({ onExit }) {
  const [section, setSection] = useState('playing');
  const [suitFilter, setSuitFilter] = useState(null);
  const [activeCulture, setActiveCulture] = useState('roman');
  const [expandedCard, setExpandedCard] = useState(null);

  // Playing cards (built once)
  const playingDeck = useMemo(() => buildPlayingDeck(), []);

  const filteredPlaying = useMemo(() => {
    if (!suitFilter) return playingDeck;
    return playingDeck.filter(c => c.suit === suitFilter);
  }, [playingDeck, suitFilter]);

  // Arcana cards for selected culture
  const arcanaCards = useMemo(() => getArcanaForCulture(activeCulture), [activeCulture]);

  const handleArcanaClick = useCallback((card) => {
    setExpandedCard(card);
  }, []);

  const crossRef = useMemo(() => {
    if (!expandedCard) return [];
    return getCrossReference(expandedCard.number);
  }, [expandedCard]);

  const position = useMemo(() => {
    if (!expandedCard) return null;
    return getArcanaPosition(expandedCard.number);
  }, [expandedCard]);

  return (
    <div className="mc-browser">
      <button className="game-mode-back" onClick={onExit}>
        &#8592; Back
      </button>
      <h2 className="mc-title">Mythic Cards</h2>

      {/* Section toggle */}
      <div className="mc-section-toggle-bar">
        <button
          className={`mc-tab${section === 'playing' ? ' active' : ''}`}
          onClick={() => setSection('playing')}
        >
          Playing Cards
          <span className="mc-tab-count">52</span>
        </button>
        <button
          className={`mc-tab${section === 'arcana' ? ' active' : ''}`}
          onClick={() => setSection('arcana')}
        >
          Major Arcana
          <span className="mc-tab-count">154</span>
        </button>
      </div>

      {/* === PLAYING CARDS SECTION === */}
      {section === 'playing' && (
        <>
          {/* Suit filter tabs */}
          <div className="mc-deck-tabs">
            <button
              className={`mc-tab${suitFilter === null ? ' active' : ''}`}
              onClick={() => setSuitFilter(null)}
            >
              All
            </button>
            {SUITS.map(s => (
              <button
                key={s.key}
                className={`mc-tab${suitFilter === s.key ? ' active' : ''}`}
                style={{ '--tab-color': s.color }}
                onClick={() => setSuitFilter(s.key)}
              >
                <span style={{ color: s.color }}>{s.symbol}</span> {s.key.charAt(0).toUpperCase() + s.key.slice(1)}
              </button>
            ))}
          </div>

          {/* Playing card grid */}
          <div className="mc-card-grid mc-playing-grid">
            {filteredPlaying.map(card => (
              <div key={card.id} className="mc-playing-card">
                <span className="mc-playing-rank mc-playing-rank-top">{card.rank}</span>
                <span className="mc-playing-suit" style={{ color: card.suitColor }}>
                  {card.suitSymbol}
                </span>
                <span className="mc-playing-rank mc-playing-rank-bottom">{card.rank}</span>
                <span className="mc-playing-value">{card.value} pt{card.value !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* === MAJOR ARCANA SECTION === */}
      {section === 'arcana' && (
        <>
          {/* Culture tabs */}
          <div className="mc-deck-tabs">
            {CULTURES.map(c => (
              <button
                key={c.key}
                className={`mc-tab${activeCulture === c.key ? ' active' : ''}`}
                onClick={() => { setActiveCulture(c.key); setExpandedCard(null); }}
              >
                {c.label}
                <span className="mc-tab-count">22</span>
              </button>
            ))}
          </div>

          {/* Arcana card grid */}
          <div className="mc-card-grid">
            {arcanaCards.map(card => {
              const pos = getArcanaPosition(card.number);
              return (
                <button
                  key={`${card.culture}-${card.number}`}
                  className="mc-card mc-arcana-card"
                  onClick={() => handleArcanaClick(card)}
                >
                  <span className="mc-card-number">#{card.number}</span>
                  <span className="mc-card-name">{card.name}</span>
                  <span className="mc-card-brief">
                    {card.description.substring(0, 100)}{card.description.length > 100 ? '...' : ''}
                  </span>
                  {pos && (
                    <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                      {pos.correspondence}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail overlay */}
          {expandedCard && (
            <div className="mc-detail-overlay" onClick={() => setExpandedCard(null)}>
              <div className="mc-detail-panel" onClick={e => e.stopPropagation()}>
                <div className="mc-detail-header">
                  <span className="mc-card-number" style={{ fontSize: '1rem' }}>
                    #{expandedCard.number}
                  </span>
                  <h3 className="mc-detail-name">{expandedCard.name}</h3>
                  <span className="mc-detail-culture">
                    {CULTURES.find(c => c.key === expandedCard.culture)?.label}
                  </span>
                  <button className="mc-detail-close" onClick={() => setExpandedCard(null)}>
                    &times;
                  </button>
                </div>

                <div className="mc-detail-body">
                  {/* Correspondence badge */}
                  {position && (
                    <div style={{ marginBottom: 12 }}>
                      <span className={`mc-card-correspondence mc-corr-${position.type}`}>
                        {position.type === 'element' ? 'Element' : position.type === 'planet' ? 'Planet' : 'Zodiac'}:
                        {' '}{position.correspondence}
                      </span>
                    </div>
                  )}

                  {/* Full description */}
                  <p className="mc-section-text">{expandedCard.description}</p>

                  {/* Cross-reference section */}
                  <div className="mc-crossref">
                    <h4 className="mc-section-heading">
                      Same Position Across Cultures
                    </h4>
                    {crossRef.map(ref => {
                      const cultureLabel = CULTURES.find(c => c.key === ref.culture)?.label;
                      const isCurrent = ref.culture === expandedCard.culture;
                      return (
                        <button
                          key={ref.culture}
                          className={`mc-crossref-item${isCurrent ? ' active' : ''}`}
                          onClick={() => {
                            if (!isCurrent) {
                              setActiveCulture(ref.culture);
                              setExpandedCard(ref);
                            }
                          }}
                        >
                          <span className="mc-crossref-culture">{cultureLabel}</span>
                          <span className="mc-crossref-name">{ref.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
