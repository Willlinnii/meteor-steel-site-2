import React, { useState, useCallback, useMemo } from 'react';
import {
  buildPlayingDeck, SUITS, CULTURES, ARCANA_POSITIONS,
  getArcanaForCulture, getArcanaPosition, getCrossReference,
} from './mythouseCardData';

const TYPE_LABELS = { element: 'Element', planet: 'Planet', zodiac: 'Zodiac' };
const TYPE_SYMBOLS = {
  element: { Air: '\u2601', Water: '\u2248', Fire: '\u2632' },
  planet: { Mercury: '\u263F', Moon: '\u263D', Venus: '\u2640', Jupiter: '\u2643', Mars: '\u2642', Sun: '\u2609', Saturn: '\u2644' },
  zodiac: { Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B', Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F', Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653' },
};

export default function MythouseCards({ onExit }) {
  const [section, setSection] = useState('playing');
  const [suitFilter, setSuitFilter] = useState(null);
  const [activeCulture, setActiveCulture] = useState('tarot'); // 'tarot' | culture key
  const [expandedCard, setExpandedCard] = useState(null);

  // Playing cards (built once)
  const playingDeck = useMemo(() => buildPlayingDeck(), []);

  const filteredPlaying = useMemo(() => {
    if (!suitFilter) return playingDeck;
    return playingDeck.filter(c => c.suit === suitFilter);
  }, [playingDeck, suitFilter]);

  // Arcana cards for selected culture (empty for tarot overview)
  const arcanaCards = useMemo(() => {
    if (activeCulture === 'tarot') return [];
    return getArcanaForCulture(activeCulture);
  }, [activeCulture]);

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

  const isTarotView = activeCulture === 'tarot';

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
          {/* Tarot + Culture tabs */}
          <div className="mc-deck-tabs">
            <button
              className={`mc-tab${activeCulture === 'tarot' ? ' active' : ''}`}
              style={{ '--tab-color': 'var(--accent-gold)' }}
              onClick={() => { setActiveCulture('tarot'); setExpandedCard(null); }}
            >
              Tarot
              <span className="mc-tab-count">22</span>
            </button>
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

          {/* Tarot overview grid (22 base positions) */}
          {isTarotView && (
            <div className="mc-card-grid">
              {ARCANA_POSITIONS.map(pos => {
                const sym = (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '';
                return (
                  <button
                    key={pos.number}
                    className="mc-card mc-arcana-card mc-tarot-card"
                    onClick={() => setExpandedCard({ number: pos.number, name: pos.correspondence, culture: 'tarot' })}
                  >
                    <span className="mc-card-number">#{pos.number}</span>
                    <span className="mc-tarot-symbol">{sym}</span>
                    <span className="mc-card-name">{pos.correspondence}</span>
                    <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                      {TYPE_LABELS[pos.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Culture-specific card grid */}
          {!isTarotView && (
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
          )}

          {/* Detail overlay */}
          {expandedCard && (
            <div className="mc-detail-overlay" onClick={() => setExpandedCard(null)}>
              <div className="mc-detail-panel" onClick={e => e.stopPropagation()}>
                <div className="mc-detail-header">
                  <span className="mc-card-number" style={{ fontSize: '1rem' }}>
                    #{expandedCard.number}
                  </span>
                  <h3 className="mc-detail-name">{expandedCard.name}</h3>
                  {expandedCard.culture !== 'tarot' && (
                    <span className="mc-detail-culture">
                      {CULTURES.find(c => c.key === expandedCard.culture)?.label}
                    </span>
                  )}
                  <button className="mc-detail-close" onClick={() => setExpandedCard(null)}>
                    &times;
                  </button>
                </div>

                <div className="mc-detail-body">
                  {/* Correspondence badge */}
                  {position && (
                    <div style={{ marginBottom: 12 }}>
                      <span className={`mc-card-correspondence mc-corr-${position.type}`}>
                        {TYPE_LABELS[position.type]}: {position.correspondence}
                      </span>
                    </div>
                  )}

                  {/* Full description (culture-specific cards only) */}
                  {expandedCard.description && (
                    <p className="mc-section-text">{expandedCard.description}</p>
                  )}

                  {/* Cross-reference / cultural variants */}
                  <div className="mc-crossref">
                    <h4 className="mc-section-heading">
                      {expandedCard.culture === 'tarot' ? 'Across 7 Cultures' : 'Same Position Across Cultures'}
                    </h4>
                    {crossRef.map(ref => {
                      const cultureLabel = CULTURES.find(c => c.key === ref.culture)?.label;
                      const isCurrent = expandedCard.culture !== 'tarot' && ref.culture === expandedCard.culture;
                      return (
                        <button
                          key={ref.culture}
                          className={`mc-crossref-item${isCurrent ? ' active' : ''}`}
                          onClick={() => {
                            setActiveCulture(ref.culture);
                            setExpandedCard(ref);
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
