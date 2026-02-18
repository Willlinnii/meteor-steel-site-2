import React, { useState, useCallback } from 'react';
import { buildDeck, shuffleDeck, drawCard, DECK_INFO } from './mythouseCardData';

const DECK_KEYS = ['figures', 'metals', 'stars', 'journey'];
const STAGES = [
  'golden-age', 'falling-star', 'impact-crater', 'forge',
  'quenching', 'integration', 'drawing', 'new-age',
];
const STAGE_LABELS = {
  'golden-age': 'Golden Age', 'falling-star': 'Falling Star',
  'impact-crater': 'Impact Crater', 'forge': 'Forge',
  'quenching': 'Quenching', 'integration': 'Integration',
  'drawing': 'Drawing', 'new-age': 'New Age',
};

export default function MythouseCards({ onExit }) {
  const [activeDeck, setActiveDeck] = useState('figures');
  const [cards, setCards] = useState(() => buildDeck('figures'));
  const [drawnCards, setDrawnCards] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedStages, setExpandedStages] = useState({});

  const switchDeck = useCallback((key) => {
    setActiveDeck(key);
    setCards(buildDeck(key));
    setDrawnCards([]);
    setExpandedCard(null);
    setExpandedStages({});
  }, []);

  const handleShuffle = useCallback(() => {
    setCards(prev => shuffleDeck(prev));
  }, []);

  const handleDraw = useCallback(() => {
    if (cards.length === 0) return;
    const { card, remaining } = drawCard(cards);
    setCards(remaining);
    setDrawnCards(prev => [card, ...prev]);
  }, [cards]);

  const handleReset = useCallback(() => {
    setCards(buildDeck(activeDeck));
    setDrawnCards([]);
    setExpandedCard(null);
    setExpandedStages({});
  }, [activeDeck]);

  const toggleStage = useCallback((stageKey) => {
    setExpandedStages(prev => ({ ...prev, [stageKey]: !prev[stageKey] }));
  }, []);

  const info = DECK_INFO[activeDeck];

  return (
    <div className="mc-browser">
      <button className="game-mode-back" onClick={onExit}>
        &#8592; Back
      </button>
      <h2 className="mc-title">Mythic Card Decks</h2>

      {/* Deck tabs */}
      <div className="mc-deck-tabs">
        {DECK_KEYS.map(key => (
          <button
            key={key}
            className={`mc-tab${activeDeck === key ? ' active' : ''}`}
            style={{ '--tab-color': DECK_INFO[key].color }}
            onClick={() => switchDeck(key)}
          >
            {DECK_INFO[key].label}
            <span className="mc-tab-count">{DECK_INFO[key].count}</span>
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="mc-actions">
        <button className="mc-action-btn" onClick={handleShuffle}>Shuffle</button>
        <button className="mc-action-btn" onClick={handleDraw} disabled={cards.length === 0}>
          Draw ({cards.length})
        </button>
        <button className="mc-action-btn" onClick={handleReset}>Reset</button>
      </div>

      {/* Drawn cards row */}
      {drawnCards.length > 0 && (
        <div className="mc-drawn-row">
          {drawnCards.map(card => (
            <button
              key={card.id}
              className="mc-drawn-thumb"
              style={{ borderColor: info.color }}
              onClick={() => { setExpandedCard(card); setExpandedStages({}); }}
            >
              <span className="mc-drawn-name">{card.name}</span>
              <span className="mc-drawn-power">{card.power}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card grid */}
      <div className="mc-card-grid">
        {cards.map(card => (
          <button
            key={card.id}
            className="mc-card"
            onClick={() => { setExpandedCard(card); setExpandedStages({}); }}
          >
            <span className="mc-card-deck" style={{ color: info.color }}>{card.deckLabel}</span>
            <span className="mc-card-name">{card.name}</span>
            <span className="mc-card-brief">{card.brief}</span>
            <span className="mc-card-power">{card.power}</span>
          </button>
        ))}
        {cards.length === 0 && (
          <p className="mc-empty">All cards drawn. Click Reset to rebuild the deck.</p>
        )}
      </div>

      {/* Detail overlay */}
      {expandedCard && (
        <div className="mc-detail-overlay" onClick={() => setExpandedCard(null)}>
          <div className="mc-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="mc-detail-header">
              <span className="mc-detail-deck" style={{ color: info.color }}>
                {expandedCard.deckLabel}
              </span>
              <h3 className="mc-detail-name">{expandedCard.name}</h3>
              <span className="mc-detail-power">{expandedCard.power}</span>
              <button className="mc-detail-close" onClick={() => setExpandedCard(null)}>
                &times;
              </button>
            </div>

            <div className="mc-detail-body">
              {/* Figures: 8 collapsible stages */}
              {expandedCard.deck === 'figures' && STAGES.map(s => {
                const text = expandedCard.detail[s];
                if (!text || !text.trim()) return null;
                const isOpen = expandedStages[s];
                return (
                  <div key={s} className="mc-detail-section">
                    <button
                      className={`mc-section-toggle${isOpen ? ' open' : ''}`}
                      onClick={() => toggleStage(s)}
                    >
                      {STAGE_LABELS[s]}
                      <span className="mc-section-arrow">{isOpen ? '\u25BC' : '\u25B6'}</span>
                    </button>
                    {isOpen && <p className="mc-section-text">{text}</p>}
                  </div>
                );
              })}

              {/* Metals: archetype info + deities */}
              {expandedCard.deck === 'metals' && (
                <>
                  <div className="mc-meta-row">
                    <span className="mc-meta-tag">{expandedCard.detail.metal}</span>
                    <span className="mc-meta-tag">{expandedCard.detail.sin}</span>
                  </div>
                  <div className="mc-detail-section">
                    <h4 className="mc-section-heading">Shadow</h4>
                    <p className="mc-section-text">{expandedCard.detail.shadow}</p>
                  </div>
                  <div className="mc-detail-section">
                    <h4 className="mc-section-heading">Light</h4>
                    <p className="mc-section-text">{expandedCard.detail.light}</p>
                  </div>
                  {expandedCard.detail.deities.length > 0 && (
                    <div className="mc-detail-section">
                      <h4 className="mc-section-heading">Deities</h4>
                      <div className="mc-deity-grid">
                        {expandedCard.detail.deities.map((d, i) => (
                          <div key={i} className="mc-deity-card">
                            <span className="mc-deity-name">{d.name}</span>
                            <span className="mc-deity-culture">{d.culture}</span>
                            <span className="mc-deity-domain">{d.domain}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Stars: zodiac info + cultural variants */}
              {expandedCard.deck === 'stars' && (
                <>
                  <div className="mc-meta-row">
                    <span className="mc-meta-tag">{expandedCard.detail.symbol} {expandedCard.detail.element}</span>
                    <span className="mc-meta-tag">{expandedCard.detail.modality}</span>
                    <span className="mc-meta-tag">{expandedCard.detail.rulingPlanet}</span>
                  </div>
                  <p className="mc-section-text" style={{ marginBottom: 8 }}>
                    <strong>{expandedCard.detail.dates}</strong> &mdash; {expandedCard.detail.archetype}
                  </p>
                  <p className="mc-section-text">{expandedCard.detail.description}</p>
                  {expandedCard.detail.cultures && (
                    <div className="mc-detail-section" style={{ marginTop: 12 }}>
                      <h4 className="mc-section-heading">Cultural Variants</h4>
                      {Object.entries(expandedCard.detail.cultures).map(([key, c]) => (
                        <div key={key} className="mc-culture-row">
                          <span className="mc-culture-label">{key}</span>
                          <span className="mc-culture-name">{c.name}</span>
                          <p className="mc-culture-desc">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Journey: full essay */}
              {expandedCard.deck === 'journey' && (
                <div className="mc-essay-scroll">
                  {expandedCard.detail.essay.split('\n\n').map((para, i) => (
                    <p key={i} className="mc-section-text">{para}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
