import React, { useState, useMemo } from 'react';
import StoryCard from './StoryCard';
import StoryMatchingSection from './StoryMatchingSection';
import { CATEGORY_CONFIG, CATEGORY_ORDER } from '../../storyCards/storyCardDefs';
import './StoryCardDeck.css';

export default function StoryCardDeck({ cards, loaded, vaultCardIds, onToggleVault }) {
  const [expanded, setExpanded] = useState(false);
  const [sectionCollapsed, setSectionCollapsed] = useState(true);
  const [showMatching, setShowMatching] = useState(false);

  // Group cards by category in display order
  const grouped = useMemo(() => {
    const map = {};
    for (const card of cards) {
      if (!map[card.category]) map[card.category] = [];
      map[card.category].push(card);
    }
    return CATEGORY_ORDER
      .filter(cat => map[cat]?.length > 0)
      .map(cat => ({ category: cat, config: CATEGORY_CONFIG[cat], cards: map[cat] }));
  }, [cards]);

  // Pick up to 5 cards for the pile preview (one per category when possible)
  const pileCards = useMemo(() => {
    const picks = [];
    for (const group of grouped) {
      if (picks.length >= 5) break;
      picks.push(group.cards[0]);
    }
    // Fill remaining from any category
    if (picks.length < 5) {
      for (const card of cards) {
        if (picks.length >= 5) break;
        if (!picks.includes(card)) picks.push(card);
      }
    }
    return picks;
  }, [cards, grouped]);

  const matchingToggle = (
    <button
      className="story-deck-matching-toggle"
      onClick={() => setShowMatching(v => !v)}
    >
      {showMatching ? 'Hide Story Matching' : 'Story Matching'}
    </button>
  );

  const sectionToggle = (
    <h2 className="profile-section-title profile-section-toggle" onClick={() => setSectionCollapsed(v => !v)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSectionCollapsed(v => !v); }}>
      My Story Cards
      <span className={`profile-section-chevron${!sectionCollapsed ? ' open' : ''}`}>&#9662;</span>
    </h2>
  );

  if (!loaded) {
    return (
      <>
        {sectionToggle}
        {!sectionCollapsed && <div className="profile-empty">Loading story cards...</div>}
      </>
    );
  }

  return (
    <>
      {sectionToggle}

      {!sectionCollapsed && (
        <>
          {cards.length === 0 ? (
            <div className="profile-empty">
              Begin your journey to collect story cards.
            </div>
          ) : (
            <>
              {/* Collapsed: stacked card pile */}
              <div
                className={`story-deck-pile${expanded ? ' story-deck-pile-hidden' : ''}`}
                onClick={() => setExpanded(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(true); }}
              >
                {pileCards.map((card, i) => (
                  <div
                    key={card.sourceId}
                    className="story-deck-pile-card"
                    style={{
                      borderLeftColor: card.color || '#888',
                      transform: `rotate(${(i - 2) * 3}deg) translateY(${i * -2}px)`,
                      zIndex: pileCards.length - i,
                    }}
                  >
                    <span className="story-deck-pile-icon">{card.icon}</span>
                    <span className="story-deck-pile-title">{card.title}</span>
                  </div>
                ))}
                <div className="story-deck-badge">{cards.length}</div>
                <div className="story-deck-hint">Click to expand</div>
              </div>

              {/* Expanded: categorized grid */}
              {expanded && (
                <div className="story-deck-expanded">
                  <button className="story-deck-collapse-btn" onClick={() => setExpanded(false)}>
                    Collapse deck
                  </button>
                  {grouped.map(({ category, config, cards: catCards }) => (
                    <div key={category} className="story-deck-category">
                      <h3 className="story-deck-category-header">
                        <span>{config.icon}</span> {config.label}
                        <span className="story-deck-category-count">{catCards.length}</span>
                      </h3>
                      <div className="story-deck-grid">
                        {catCards.map(card => (
                          <div key={card.sourceId} className="story-deck-card-wrapper">
                            <StoryCard card={card} />
                            {onToggleVault && (
                              <button
                                className={`story-deck-vault-btn${vaultCardIds?.has(card.sourceId) ? ' active' : ''}`}
                                onClick={() => onToggleVault(card.sourceId)}
                                title={vaultCardIds?.has(card.sourceId) ? 'Remove from vault' : 'Add to vault'}
                              >
                                {vaultCardIds?.has(card.sourceId) ? '\u{1F512}' : '\u{1F513}'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Story Matching pop-down */}
          {matchingToggle}
          {showMatching && <StoryMatchingSection />}
        </>
      )}
    </>
  );
}
