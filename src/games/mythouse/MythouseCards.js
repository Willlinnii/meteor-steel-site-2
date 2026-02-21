import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  buildPlayingDeck, buildMajorArcanaDeck, SUITS, CULTURES, ARCANA_POSITIONS,
  getArcanaForCulture, getArcanaPosition, getCrossReference,
  buildMinorArcana, getSuitsForCulture,
} from './mythouseCardData';
import { apiFetch } from '../../lib/chatApi';

const TYPE_LABELS = { element: 'Element', planet: 'Planet', zodiac: 'Zodiac' };
const TYPE_SYMBOLS = {
  element: { Air: '\u2601', Water: '\u2248', Fire: '\u2632' },
  planet: { Mercury: '\u263F', Moon: '\u263D', Venus: '\u2640', Jupiter: '\u2643', Mars: '\u2642', Sun: '\u2609', Saturn: '\u2644' },
  zodiac: { Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B', Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F', Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653' },
};

const POSITION_KEYS = ['present', 'past', 'future'];

export default function MythouseCards({ onExit, initialSection, initialCulture }) {
  const [deckOpen, setDeckOpen] = useState(false);
  const [section, setSection] = useState(initialSection || 'playing');
  const [suitFilter, setSuitFilter] = useState(null);
  const [activeCulture, setActiveCulture] = useState(initialCulture || 'tarot');
  const [expandedCard, setExpandedCard] = useState(null);
  const [arcanaView, setArcanaView] = useState('major'); // 'major' | 'minor'
  const [minorSuitFilter, setMinorSuitFilter] = useState(null);

  // --- Reading state ---
  const [drawType] = useState('three-card');
  const [readingPhase, setReadingPhase] = useState(null);
  const [readingMessages, setReadingMessages] = useState([]);
  const [readingInput, setReadingInput] = useState('');
  const [readingLoading, setReadingLoading] = useState(false);
  const [drawnCards, setDrawnCards] = useState([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [readingIntention, setReadingIntention] = useState('');
  const revealTimers = useRef([]);
  const chatEndRef = useRef(null);
  const intentionExchangeCount = useRef(0);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [readingMessages, readingLoading]);

  // Cleanup timers
  useEffect(() => {
    return () => revealTimers.current.forEach(t => clearTimeout(t));
  }, []);

  // Playing cards (built once)
  const playingDeck = useMemo(() => buildPlayingDeck(), []);

  const filteredPlaying = useMemo(() => {
    if (!suitFilter) return playingDeck;
    return playingDeck.filter(c => c.suit === suitFilter);
  }, [playingDeck, suitFilter]);

  // Major Arcana cards for selected culture
  const arcanaCards = useMemo(() => {
    if (activeCulture === 'tarot') return [];
    return getArcanaForCulture(activeCulture);
  }, [activeCulture]);

  // Minor Arcana cards for selected culture (including tarot base)
  const minorCards = useMemo(() => {
    return buildMinorArcana(activeCulture);
  }, [activeCulture]);

  // Suits for the active culture
  const cultureSuits = useMemo(() => {
    return getSuitsForCulture(activeCulture);
  }, [activeCulture]);

  // Filtered minor arcana
  const filteredMinor = useMemo(() => {
    if (!minorSuitFilter) return minorCards;
    return minorCards.filter(c => c.suit === minorSuitFilter);
  }, [minorCards, minorSuitFilter]);

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

  // Derive deck info for the closed view
  const isPlaying = (initialSection || 'playing') === 'playing';
  const isWorldOfTarot = !initialSection && !initialCulture;
  const deckLabel = isWorldOfTarot
    ? 'World of Tarot'
    : isPlaying
      ? 'Playing Cards'
      : (CULTURES.find(c => c.key === (initialCulture || 'tarot'))?.label || initialCulture || 'Tarot');
  const deckCount = isWorldOfTarot ? 670 : isPlaying ? 52 : 78;
  const cultureLabel = CULTURES.find(c => c.key === activeCulture)?.label || 'Tarot';

  // --- Reading handlers ---

  const performDraw = useCallback(() => {
    const deck = buildMajorArcanaDeck(activeCulture);
    const three = deck.slice(0, 3).map((card, i) => ({
      ...card,
      position: POSITION_KEYS[i],
    }));
    setDrawnCards(three);
    setRevealedCount(0);
    setReadingPhase('drawing');

    // After 800ms transition to spread
    const t0 = setTimeout(() => setReadingPhase('spread'), 800);
    // Staggered reveals: center(present) at 600ms, left(past) at 1800ms, right(future) at 3000ms
    const t1 = setTimeout(() => setRevealedCount(1), 600 + 800);
    const t2 = setTimeout(() => setRevealedCount(2), 1800 + 800);
    const t3 = setTimeout(() => setRevealedCount(3), 3000 + 800);
    const t4 = setTimeout(() => setReadingPhase('interpret-ask'), 4200 + 800);
    revealTimers.current = [t0, t1, t2, t3, t4];
  }, [activeCulture]);

  const handleStartReading = useCallback(async () => {
    setReadingPhase('intention');
    setReadingMessages([]);
    setReadingInput('');
    setReadingIntention('');
    setDrawnCards([]);
    setRevealedCount(0);
    intentionExchangeCount.current = 0;
    setReadingLoading(true);

    try {
      const resp = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tarot-reading',
          tarotPhase: 'intention',
          culture: activeCulture,
          messages: [{ role: 'user', content: 'I would like a tarot reading.' }],
        }),
      });
      const data = await resp.json();
      setReadingMessages([{ role: 'assistant', content: data.reply || 'What brings you to the cards today?' }]);
    } catch {
      setReadingMessages([{ role: 'assistant', content: 'What brings you to the cards today?' }]);
    }
    setReadingLoading(false);
  }, [activeCulture]);

  const handleSendIntention = useCallback(async () => {
    const text = readingInput.trim();
    if (!text || readingLoading) return;

    const newMessages = [...readingMessages, { role: 'user', content: text }];
    setReadingMessages(newMessages);
    setReadingInput('');
    setReadingLoading(true);

    // Store first user message as intention
    if (!readingIntention) {
      setReadingIntention(text);
    }
    intentionExchangeCount.current += 1;

    try {
      const resp = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tarot-reading',
          tarotPhase: 'intention',
          culture: activeCulture,
          messages: newMessages,
        }),
      });
      const data = await resp.json();
      const updated = [...newMessages, { role: 'assistant', content: data.reply }];
      setReadingMessages(updated);

      // If ready to draw, or 3 exchanges passed — auto-proceed
      if (data.readyToDraw || intentionExchangeCount.current >= 3) {
        setReadingLoading(false);
        setTimeout(() => performDraw(), 1500);
        return;
      }
    } catch {
      setReadingMessages(prev => [...prev, { role: 'assistant', content: 'Let us proceed with your reading.' }]);
      setTimeout(() => performDraw(), 1500);
    }
    setReadingLoading(false);
  }, [readingInput, readingMessages, readingLoading, readingIntention, activeCulture, performDraw]);

  const handleRequestInterpretation = useCallback(async () => {
    setReadingPhase('interpreting');
    setReadingLoading(true);

    const cardDescriptions = drawnCards.map(c => ({
      number: c.number,
      name: c.name,
      description: c.description || '',
      correspondence: c.correspondence || '',
      type: c.type || '',
      position: c.position,
    }));

    const intention = readingIntention || readingMessages.find(m => m.role === 'user')?.content || '';

    try {
      const resp = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tarot-reading',
          tarotPhase: 'interpretation',
          culture: activeCulture,
          tarotCards: cardDescriptions,
          tarotIntention: intention,
          messages: [{ role: 'user', content: 'Please interpret my reading.' }],
        }),
      });
      const data = await resp.json();
      setReadingMessages([{ role: 'assistant', content: data.reply || 'The cards speak...' }]);
    } catch {
      setReadingMessages([{ role: 'assistant', content: 'The cards hold mysteries I cannot quite reach at this moment. Please try again.' }]);
    }
    setReadingLoading(false);
  }, [drawnCards, readingIntention, readingMessages, activeCulture]);

  const handleSendFollowUp = useCallback(async () => {
    const text = readingInput.trim();
    if (!text || readingLoading) return;

    const newMessages = [...readingMessages, { role: 'user', content: text }];
    setReadingMessages(newMessages);
    setReadingInput('');
    setReadingLoading(true);

    const cardDescriptions = drawnCards.map(c => ({
      number: c.number,
      name: c.name,
      description: c.description || '',
      correspondence: c.correspondence || '',
      type: c.type || '',
      position: c.position,
    }));

    const intention = readingIntention || '';

    try {
      const resp = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tarot-reading',
          tarotPhase: 'interpretation',
          culture: activeCulture,
          tarotCards: cardDescriptions,
          tarotIntention: intention,
          messages: newMessages,
        }),
      });
      const data = await resp.json();
      setReadingMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setReadingMessages(prev => [...prev, { role: 'assistant', content: 'I seem to have lost the thread. Could you ask again?' }]);
    }
    setReadingLoading(false);
  }, [readingInput, readingMessages, readingLoading, drawnCards, readingIntention, activeCulture]);

  const handleCancelReading = useCallback(() => {
    revealTimers.current.forEach(t => clearTimeout(t));
    revealTimers.current = [];
    setReadingPhase(null);
    setReadingMessages([]);
    setReadingInput('');
    setReadingLoading(false);
    setDrawnCards([]);
    setRevealedCount(0);
    setReadingIntention('');
    intentionExchangeCount.current = 0;
  }, []);

  // --- Helpers for spread rendering ---
  // Render order: past(left), present(center), future(right)
  const spreadOrder = useMemo(() => {
    if (drawnCards.length < 3) return [];
    const past = drawnCards.find(c => c.position === 'past');
    const present = drawnCards.find(c => c.position === 'present');
    const future = drawnCards.find(c => c.position === 'future');
    return [past, present, future].filter(Boolean);
  }, [drawnCards]);

  const isCardRevealed = (card) => {
    // Reveal order: present first (count >= 1), past second (count >= 2), future third (count >= 3)
    if (card.position === 'present') return revealedCount >= 1;
    if (card.position === 'past') return revealedCount >= 2;
    if (card.position === 'future') return revealedCount >= 3;
    return false;
  };

  // --- Reading UI ---

  // Intention chat view
  if (readingPhase === 'intention') {
    return (
      <div className="mc-browser">
        <button className="game-mode-back" onClick={handleCancelReading}>
          &#8592; Cancel
        </button>
        <div className="mc-reading-panel">
          <h2 className="mc-reading-title">Setting Your Intention</h2>
          <p className="mc-reading-subtitle">{cultureLabel} &middot; Three Card Spread</p>
          <div className="mc-reading-chat">
            {readingMessages.map((msg, i) => (
              <div key={i} className={`mc-reading-msg mc-reading-msg-${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {readingLoading && (
              <div className="mc-reading-msg mc-reading-msg-assistant mc-reading-typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="mc-reading-input-row">
            <input
              className="mc-reading-input"
              type="text"
              placeholder="Share what's on your mind..."
              value={readingInput}
              onChange={e => setReadingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendIntention()}
              disabled={readingLoading}
            />
            <button
              className="mc-reading-send"
              onClick={handleSendIntention}
              disabled={readingLoading || !readingInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Drawing transition
  if (readingPhase === 'drawing') {
    return (
      <div className="mc-browser">
        <div className="mc-reading-panel">
          <div className="mc-drawing-state">
            <div className="mc-stack mc-stack-drawing">
              <div className="mc-stack-card mc-stack-3" />
              <div className="mc-stack-card mc-stack-2" />
              <div className="mc-stack-card mc-stack-1 mc-stack-pulse">
                <span className="mc-stack-label">{cultureLabel}</span>
              </div>
            </div>
            <p className="mc-drawing-label">Drawing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Card spread + interpret ask + interpreting
  if (readingPhase === 'spread' || readingPhase === 'interpret-ask' || readingPhase === 'interpreting') {
    return (
      <div className="mc-browser">
        <button className="game-mode-back" onClick={handleCancelReading}>
          &#8592; Back
        </button>
        <div className="mc-reading-panel">
          <h2 className="mc-reading-title">{cultureLabel} Reading</h2>

          {/* Three card spread */}
          <div className="mc-spread">
            {spreadOrder.map(card => {
              const revealed = isCardRevealed(card);
              const pos = getArcanaPosition(card.number);
              const sym = pos ? (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '' : '';
              return (
                <div key={card.position} className={`mc-spread-slot ${card.position}`}>
                  <span className="mc-spread-position-label">
                    {card.position.charAt(0).toUpperCase() + card.position.slice(1)}
                  </span>
                  {revealed ? (
                    <div className="mc-spread-card mc-spread-card-revealed">
                      <span className="mc-card-number">#{card.number}</span>
                      {sym && <span className="mc-spread-symbol">{sym}</span>}
                      <span className="mc-spread-card-name">{card.name}</span>
                      {pos && (
                        <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                          {pos.correspondence}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mc-spread-card mc-spread-card-facedown">
                      <span className="mc-spread-facedown-symbol">&#x2726;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interpret ask */}
          {readingPhase === 'interpret-ask' && (
            <div className="mc-interpret-ask">
              <p>Your cards are drawn. Would you like me to interpret your reading?</p>
              <div className="mc-interpret-buttons">
                <button className="card-deck-btn card-deck-btn-action" onClick={handleRequestInterpretation}>
                  Yes, interpret
                </button>
                <button className="card-deck-btn" onClick={handleCancelReading}>
                  No thanks
                </button>
              </div>
            </div>
          )}

          {/* Interpretation view */}
          {readingPhase === 'interpreting' && (
            <div className="mc-reading-interpretation">
              <div className="mc-reading-chat">
                {readingMessages.map((msg, i) => (
                  <div key={i} className={`mc-reading-msg mc-reading-msg-${msg.role}`}>
                    {msg.content}
                  </div>
                ))}
                {readingLoading && (
                  <div className="mc-reading-msg mc-reading-msg-assistant mc-reading-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {!readingLoading && readingMessages.length > 0 && (
                <>
                  <div className="mc-reading-input-row">
                    <input
                      className="mc-reading-input"
                      type="text"
                      placeholder="Ask a follow-up..."
                      value={readingInput}
                      onChange={e => setReadingInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendFollowUp()}
                    />
                    <button
                      className="mc-reading-send"
                      onClick={handleSendFollowUp}
                      disabled={!readingInput.trim()}
                    >
                      Send
                    </button>
                  </div>
                  <div className="mc-reading-done">
                    <button className="card-deck-btn card-deck-btn-action" onClick={() => {
                      handleCancelReading();
                      handleStartReading();
                    }}>
                      New Reading
                    </button>
                    <button className="card-deck-btn" onClick={handleCancelReading}>
                      Return to Deck
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Closed deck landing view
  if (!deckOpen) {
    const showAsk = !isPlaying && !isWorldOfTarot;
    return (
      <div className="mc-browser">
        <button className="game-mode-back" onClick={onExit}>
          &#8592; Back
        </button>
        <div className="mc-closed-landing">
          <div className="mc-stack">
            <div className="mc-stack-card mc-stack-3" />
            <div className="mc-stack-card mc-stack-2" />
            <div className="mc-stack-card mc-stack-1">
              <span className="mc-stack-label">{deckLabel}</span>
              <span className="mc-stack-count">{deckCount} cards</span>
            </div>
          </div>
          <div className="mc-closed-actions">
            <button className="card-deck-btn" onClick={() => setDeckOpen(true)}>
              View Deck
            </button>
            {showAsk ? (
              <>
                <select className="mc-draw-select" value={drawType} disabled>
                  <option value="three-card">Three Card</option>
                </select>
                <button className="card-deck-btn card-deck-btn-action" onClick={handleStartReading}>
                  Ask
                </button>
              </>
            ) : (
              <button className="card-deck-btn card-deck-btn-action">
                {isPlaying ? 'Play' : 'Ask'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-browser">
      <button className="game-mode-back" onClick={() => setDeckOpen(false)}>
        &#8592; Back
      </button>
      <h2 className="mc-title">{deckLabel}</h2>

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
          Tarot Decks
          <span className="mc-tab-count">78 each</span>
        </button>
      </div>

      {/* === PLAYING CARDS SECTION === */}
      {section === 'playing' && (
        <>
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

          <div className="mc-card-grid mc-playing-grid">
            <button className="mc-playing-card mc-fold-card" onClick={() => setDeckOpen(false)}>
              <span className="mc-fold-icon">&#8645;</span>
              <span className="mc-fold-label">Fold Deck</span>
            </button>
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

      {/* === TAROT DECKS SECTION === */}
      {section === 'arcana' && (
        <>
          {/* Culture tabs */}
          <div className="mc-deck-tabs">
            <button
              className={`mc-tab${activeCulture === 'tarot' ? ' active' : ''}`}
              style={{ '--tab-color': 'var(--accent-gold)' }}
              onClick={() => { setActiveCulture('tarot'); setExpandedCard(null); setMinorSuitFilter(null); }}
            >
              Tarot
              <span className="mc-tab-count">78</span>
            </button>
            {CULTURES.map(c => (
              <button
                key={c.key}
                className={`mc-tab${activeCulture === c.key ? ' active' : ''}`}
                onClick={() => { setActiveCulture(c.key); setExpandedCard(null); setMinorSuitFilter(null); }}
              >
                {c.label}
                <span className="mc-tab-count">78</span>
              </button>
            ))}
          </div>

          {/* Major / Minor sub-toggle */}
          <div className="mc-sub-toggle">
            <button
              className={`mc-sub-tab${arcanaView === 'major' ? ' active' : ''}`}
              onClick={() => setArcanaView('major')}
            >
              Major Arcana
              <span className="mc-tab-count">22</span>
            </button>
            <button
              className={`mc-sub-tab${arcanaView === 'minor' ? ' active' : ''}`}
              onClick={() => setArcanaView('minor')}
            >
              Minor Arcana
              <span className="mc-tab-count">56</span>
            </button>
          </div>

          {/* ---- MAJOR ARCANA VIEW ---- */}
          {arcanaView === 'major' && (
            <>
              {/* Tarot overview grid (22 base positions) */}
              {isTarotView && (
                <div className="mc-card-grid">
                  <button className="mc-card mc-arcana-card mc-tarot-card mc-fold-card" onClick={() => setDeckOpen(false)}>
                    <span className="mc-fold-icon">&#8645;</span>
                    <span className="mc-fold-label">Fold Deck</span>
                  </button>
                  {ARCANA_POSITIONS.map(pos => {
                    const sym = (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '';
                    return (
                      <button
                        key={pos.number}
                        className="mc-card mc-arcana-card mc-tarot-card"
                        onClick={() => setExpandedCard({ number: pos.number, name: pos.tarot, culture: 'tarot' })}
                      >
                        <span className="mc-card-number">#{pos.number}</span>
                        <span className="mc-tarot-symbol">{sym}</span>
                        <span className="mc-card-name">{pos.tarot}</span>
                        <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                          {pos.correspondence}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Culture-specific major arcana grid */}
              {!isTarotView && (
                <div className="mc-card-grid">
                  <button className="mc-card mc-arcana-card mc-fold-card" onClick={() => setDeckOpen(false)}>
                    <span className="mc-fold-icon">&#8645;</span>
                    <span className="mc-fold-label">Fold Deck</span>
                  </button>
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
            </>
          )}

          {/* ---- MINOR ARCANA VIEW ---- */}
          {arcanaView === 'minor' && (
            <>
              {/* Suit filter tabs */}
              <div className="mc-deck-tabs mc-suit-tabs">
                <button
                  className={`mc-tab${minorSuitFilter === null ? ' active' : ''}`}
                  onClick={() => setMinorSuitFilter(null)}
                >
                  All Suits
                </button>
                {cultureSuits.map(s => (
                  <button
                    key={s.key}
                    className={`mc-tab${minorSuitFilter === s.key ? ' active' : ''}`}
                    style={{ '--tab-color': s.color }}
                    onClick={() => setMinorSuitFilter(s.key)}
                  >
                    <span style={{ color: s.color }}>{s.symbol}</span> {s.name}
                  </button>
                ))}
              </div>

              {/* Suit description (when filtering by a single suit) */}
              {minorSuitFilter && (() => {
                const suit = cultureSuits.find(s => s.key === minorSuitFilter);
                return suit?.desc ? (
                  <p className="mc-suit-desc">
                    <span className="mc-suit-element" style={{ color: suit.color }}>{suit.element}</span>
                    {' \u2014 '}{suit.desc}
                  </p>
                ) : null;
              })()}

              {/* Minor arcana card grid */}
              <div className="mc-card-grid mc-minor-grid">
                <button className="mc-minor-card mc-fold-card" onClick={() => setDeckOpen(false)}>
                  <span className="mc-fold-icon">&#8645;</span>
                  <span className="mc-fold-label">Fold Deck</span>
                </button>
                {filteredMinor.map(card => (
                  <div
                    key={card.id}
                    className={`mc-minor-card${card.isCourt ? ' mc-court' : ''}`}
                  >
                    <span className="mc-minor-rank-top">{card.isCourt ? card.rankLabel.charAt(0) : card.rankLabel}</span>
                    <span className="mc-minor-suit" style={{ color: card.suitColor }}>
                      {card.suitSymbol}
                    </span>
                    <span className="mc-minor-name">{card.rankLabel}</span>
                    <span className="mc-minor-suit-label" style={{ color: card.suitColor }}>
                      {card.suitName}
                    </span>
                    <span className="mc-minor-value">{card.value} pt{card.value !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Detail overlay (major arcana only) */}
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

                  {/* Tarot name subtitle (for culture-specific views) */}
                  {expandedCard.culture !== 'tarot' && position && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontStyle: 'italic', margin: '0 0 8px' }}>
                      Tarot: {position.tarot}
                    </p>
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
                      const cLabel = CULTURES.find(c => c.key === ref.culture)?.label;
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
                          <span className="mc-crossref-culture">{cLabel}</span>
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
