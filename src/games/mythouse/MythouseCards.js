import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  buildPlayingDeck, buildMajorArcanaDeck, SUITS, CULTURES, ARCANA_POSITIONS,
  getArcanaForCulture, getArcanaPosition, getCrossReference,
  buildMinorArcana, getSuitsForCulture,
} from './mythouseCardData';
import { apiFetch } from '../../lib/chatApi';
import useVoice from '../../hooks/useVoice';
import { useWritings } from '../../writings/WritingsContext';
import ShareCompletionModal from '../../components/fellowship/ShareCompletionModal';

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// Tarot card image helpers (Rider-Waite-Smith, public domain)
const RANK_TO_IMG = {
  ace: '01', '2': '02', '3': '03', '4': '04', '5': '05',
  '6': '06', '7': '07', '8': '08', '9': '09', '10': '10',
  page: '11', knight: '12', queen: '13', king: '14',
};
const ELEMENT_TO_SUIT_IMG = { Air: 'swords', Water: 'cups', Fire: 'wands', Earth: 'pentacles' };

function getTarotMajorImg(number) {
  return `/images/tarot/major-${String(number).padStart(2, '0')}.jpg`;
}

function getTarotMinorImg(card) {
  const suit = card.culture === 'tarot' ? card.suit : ELEMENT_TO_SUIT_IMG[card.element];
  const num = RANK_TO_IMG[card.rank];
  if (!suit || !num) return null;
  return `/images/tarot/${suit}-${num}.jpg`;
}

const TYPE_LABELS = { element: 'Element', planet: 'Planet', zodiac: 'Zodiac' };
const TYPE_SYMBOLS = {
  element: { Air: '\u2601', Water: '\u2248', Fire: '\u2632' },
  planet: { Mercury: '\u263F', Moon: '\u263D', Venus: '\u2640', Jupiter: '\u2643', Mars: '\u2642', Sun: '\u2609', Saturn: '\u2644' },
  zodiac: { Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B', Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F', Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653' },
};

const POSITION_KEYS = ['present', 'past', 'future'];

// All culture options including tarot base
const CULTURE_OPTIONS = [
  { key: 'tarot', label: 'Tarot' },
  ...CULTURES,
];

// Circular carousel selector for cultures
function CultureCarousel({ activeKey, onSelect }) {
  const items = CULTURE_OPTIONS;
  const count = items.length;
  const containerRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, movedPx: 0 });
  const jumpRAF = useRef(null);
  const isJumping = useRef(false);

  // 3 copies: [copy0 ... copy1(canonical) ... copy2]
  const tripled = useMemo(() => [...items, ...items, ...items], [items]);

  // Item width including gap
  const ITEM_W = 130; // approximate: 110px min-width + 10px gap each side

  // Scroll to center a real index (within the middle copy) without animation
  const jumpToMiddle = useCallback((idx) => {
    const el = containerRef.current;
    if (!el) return;
    const middleStart = count; // first index of middle copy
    const targetIdx = middleStart + idx;
    const child = el.children[targetIdx];
    if (!child) return;
    const elRect = el.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    const offset = (childRect.left + childRect.width / 2) - (elRect.left + elRect.width / 2);
    isJumping.current = true;
    el.scrollLeft = el.scrollLeft + offset;
    // Reset flag after a frame
    requestAnimationFrame(() => { isJumping.current = false; });
  }, [count]);

  // On mount and when activeKey changes, center the active item
  useEffect(() => {
    const idx = items.findIndex(c => c.key === activeKey);
    if (idx >= 0) jumpToMiddle(idx);
  }, [activeKey, items, jumpToMiddle]);

  // Find which item is closest to center and select it
  const detectCenter = useCallback(() => {
    const el = containerRef.current;
    if (!el || isJumping.current) return;
    const elRect = el.getBoundingClientRect();
    const centerX = elRect.left + elRect.width / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const r = el.children[i].getBoundingClientRect();
      const d = Math.abs((r.left + r.width / 2) - centerX);
      if (d < closestDist) { closestDist = d; closestIdx = i; }
    }
    return closestIdx % count;
  }, [count]);

  // Snap to the nearest item center and select it
  const snapAndSelect = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const realIdx = detectCenter();
    if (realIdx === undefined) return;

    // Snap-scroll to center that child
    const elRect = el.getBoundingClientRect();
    const centerX = elRect.left + elRect.width / 2;
    // Find the actual closest child element (not just modular index)
    let best = null, bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const r = el.children[i].getBoundingClientRect();
      const d = Math.abs((r.left + r.width / 2) - centerX);
      if (d < bestDist) { bestDist = d; best = el.children[i]; }
    }
    if (best) {
      const r = best.getBoundingClientRect();
      const offset = (r.left + r.width / 2) - centerX;
      el.scrollTo({ left: el.scrollLeft + offset, behavior: 'smooth' });
    }

    const item = items[realIdx];
    if (item && item.key !== activeKey) {
      onSelect(item.key);
    }

    // After snap animation, silently jump to the middle copy
    setTimeout(() => jumpToMiddle(realIdx), 350);
  }, [detectCenter, items, activeKey, onSelect, jumpToMiddle]);

  const onMouseDown = useCallback((e) => {
    const el = containerRef.current;
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, movedPx: 0 };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;
    e.preventDefault();
    const el = containerRef.current;
    const x = e.pageX - el.offsetLeft;
    const dx = x - drag.current.startX;
    drag.current.movedPx = Math.max(drag.current.movedPx, Math.abs(dx));
    el.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    snapAndSelect();
  }, [snapAndSelect]);

  // Touch support
  const onTouchStart = useCallback((e) => {
    const el = containerRef.current;
    const touch = e.touches[0];
    drag.current = { active: true, startX: touch.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, movedPx: 0 };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!drag.current.active) return;
    const el = containerRef.current;
    const touch = e.touches[0];
    const x = touch.pageX - el.offsetLeft;
    const dx = x - drag.current.startX;
    drag.current.movedPx = Math.max(drag.current.movedPx, Math.abs(dx));
    el.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    snapAndSelect();
  }, [snapAndSelect]);

  // Also handle wheel/trackpad scroll ending
  const scrollTimer = useRef(null);
  const onScroll = useCallback(() => {
    if (isJumping.current) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!drag.current.active) snapAndSelect();
    }, 150);
  }, [snapAndSelect]);

  // Arrow navigation
  const navigate = useCallback((delta) => {
    const idx = items.findIndex(c => c.key === activeKey);
    const next = ((idx + delta) % count + count) % count;
    onSelect(items[next].key);
  }, [items, activeKey, count, onSelect]);

  return (
    <div className="mc-culture-carousel-wrap">
      <button className="mc-culture-carousel-arrow" onClick={() => navigate(-1)} aria-label="Previous culture">&#x2039;</button>
      <div
        className="mc-culture-carousel"
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onScroll={onScroll}
      >
        {tripled.map((item, i) => {
          const realIdx = i % count;
          const isActive = items[realIdx].key === activeKey;
          return (
            <button
              key={`${item.key}-${i}`}
              className={`mc-culture-item${isActive ? ' active' : ''}`}
              onClick={() => {
                if (drag.current.movedPx > 5) return;
                onSelect(item.key);
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <button className="mc-culture-carousel-arrow" onClick={() => navigate(1)} aria-label="Next culture">&#x203A;</button>
    </div>
  );
}

export default function MythouseCards({ onExit, initialSection, initialCulture }) {
  const [viewMode, setViewMode] = useState('fan'); // 'fan' | 'open'
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
  const [showFellowshipShare, setShowFellowshipShare] = useState(false);
  const revealTimers = useRef([]);
  const chatEndRef = useRef(null);
  const intentionExchangeCount = useRef(0);

  // --- Story Forge (save readings as personal stories) ---
  const { addStory, addStoryEntry, updateStoryGenerated } = useWritings();
  const savedStoryId = useRef(null);

  // --- Voice / audio ---
  const { voiceEnabled, recording, speaking, toggleVoice, startListening, stopListening, speak, stopSpeaking } = useVoice(setReadingInput, 'atlas');
  const fanDrag = useRef({ active: false, startX: 0, scrollLeft: 0, movedPx: 0 });
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const fanScrollRAF = useRef(null);
  const fanRef = useRef(null);

  // Compute which card is nearest the horizontal center of the fan container
  const updateFeaturedIndex = useCallback((el) => {
    if (!el || !el.children.length) return;
    const containerRect = el.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (!child.dataset || child.dataset.fanCard === undefined) {
        // skip ::after pseudo (won't appear here) and non-card elements
      }
      const r = child.getBoundingClientRect();
      const childCenter = r.left + r.width / 2;
      const dist = Math.abs(childCenter - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    setFeaturedIndex(closestIdx);
  }, []);

  // Snap-scroll to center the nearest card after drag or scroll settles
  const snapToNearest = useCallback((el) => {
    if (!el || !el.children.length) return;
    const containerRect = el.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    let closestChild = null;
    let closestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      const r = child.getBoundingClientRect();
      const childCenter = r.left + r.width / 2;
      const dist = Math.abs(childCenter - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestChild = child;
      }
    }
    if (closestChild) {
      const childRect = closestChild.getBoundingClientRect();
      const offset = (childRect.left + childRect.width / 2) - centerX;
      el.scrollTo({ left: el.scrollLeft + offset, behavior: 'smooth' });
    }
  }, []);

  // Scroll the fan to center a specific card index
  const scrollToIndex = useCallback((el, idx) => {
    if (!el || !el.children.length) return;
    const clamped = Math.max(0, Math.min(idx, el.children.length - 1));
    const child = el.children[clamped];
    if (!child) return;
    const containerRect = el.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    const offset = (childRect.left + childRect.width / 2) - (containerRect.left + containerRect.width / 2);
    el.scrollTo({ left: el.scrollLeft + offset, behavior: 'smooth' });
  }, []);

  const fanScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (fanScrollRAF.current) cancelAnimationFrame(fanScrollRAF.current);
    fanScrollRAF.current = requestAnimationFrame(() => updateFeaturedIndex(el));
  }, [updateFeaturedIndex]);

  // Click-and-drag scroll for fan containers
  const fanMouseDown = useCallback((e) => {
    const el = e.currentTarget;
    fanDrag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, movedPx: 0 };
    el.style.scrollBehavior = 'auto';
  }, []);
  const fanMouseMove = useCallback((e) => {
    if (!fanDrag.current.active) return;
    e.preventDefault();
    const el = e.currentTarget;
    const x = e.pageX - el.offsetLeft;
    const dx = x - fanDrag.current.startX;
    fanDrag.current.movedPx = Math.max(fanDrag.current.movedPx, Math.abs(dx));
    el.scrollLeft = fanDrag.current.scrollLeft - dx;
  }, []);
  const fanMouseUp = useCallback((e) => {
    if (!fanDrag.current.active) return;
    fanDrag.current.active = false;
    const el = e.currentTarget;
    setTimeout(() => snapToNearest(el), 80);
  }, [snapToNearest]);

  // Whether the last mouse interaction was a drag (suppress card click)
  const wasDrag = useCallback(() => fanDrag.current.movedPx > 5, []);
  const fanRefCb = useCallback((el) => { fanRef.current = el; }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [readingMessages, readingLoading]);

  // Cleanup timers
  useEffect(() => {
    return () => revealTimers.current.forEach(t => clearTimeout(t));
  }, []);

  // Reset featured index when filters change
  useEffect(() => { setFeaturedIndex(0); }, [section, suitFilter, activeCulture, arcanaView, minorSuitFilter, viewMode]);

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

  // Info panel renderer for the featured card in a fan
  const renderFanInfo = useCallback((cards, type) => {
    if (viewMode !== 'fan' || !cards.length) return null;
    const idx = Math.max(0, Math.min(featuredIndex, cards.length - 1));
    const card = cards[idx];

    if (type === 'playing') {
      const suitMeta = SUITS.find(s => s.key === card.suit);
      const suitName = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
      const rankNames = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
      const cardName = `${rankNames[card.rank] || card.rank} of ${suitName}`;
      return (
        <div className="mc-fan-info" key={`info-${card.id}`}>
          <div className="mc-fan-info-name">
            <span style={{ color: suitMeta?.color }}>{card.suitSymbol}</span>{' '}{cardName}
          </div>
          <div className="mc-fan-info-sub">{card.value} point{card.value !== 1 ? 's' : ''}</div>
        </div>
      );
    }

    if (type === 'tarot') {
      const pos = getArcanaPosition(card.number);
      const sym = pos ? (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '' : '';
      const desc = card.waiteDesc || pos?.waiteDesc || '';
      return (
        <div className="mc-fan-info" key={`info-${card.number}`}>
          <div className="mc-fan-info-name">#{card.number} {pos?.tarot || card.name}</div>
          <div className="mc-fan-info-sub">
            {pos && <>{TYPE_LABELS[pos.type]}: {sym} {pos.correspondence}</>}
          </div>
          {desc && (
            <div className="mc-fan-info-desc">
              {desc.length > 200 ? desc.substring(0, 200) + '...' : desc}
            </div>
          )}
          <button className="mc-fan-info-detail-link" onClick={() => setExpandedCard({ number: card.number || pos?.number, name: pos?.tarot || card.name, culture: 'tarot' })}>
            View Details
          </button>
        </div>
      );
    }

    if (type === 'arcana') {
      const pos = getArcanaPosition(card.number);
      const sym = pos ? (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '' : '';
      return (
        <div className="mc-fan-info" key={`info-${card.culture}-${card.number}`}>
          <div className="mc-fan-info-name">#{card.number} {card.name}</div>
          <div className="mc-fan-info-sub">
            {CULTURES.find(c => c.key === card.culture)?.label}
            {pos && <>{' \u2022 '}{sym} {pos.correspondence}</>}
          </div>
          {card.description && (
            <div className="mc-fan-info-desc">
              {card.description.length > 200 ? card.description.substring(0, 200) + '...' : card.description}
            </div>
          )}
          <button className="mc-fan-info-detail-link" onClick={() => handleArcanaClick(card)}>
            View Details
          </button>
        </div>
      );
    }

    if (type === 'minor') {
      return (
        <div className="mc-fan-info" key={`info-${card.id}`}>
          <div className="mc-fan-info-name">
            {card.rankLabel} of <span style={{ color: card.suitColor }}>{card.suitSymbol}</span> {card.suitName}
          </div>
          <div className="mc-fan-info-sub">
            {card.element}{card.isCourt ? ' \u2022 Court Card' : ''}
            {' \u2022 '}{card.value} point{card.value !== 1 ? 's' : ''}
          </div>
          {card.waiteDesc && (
            <div className="mc-fan-info-desc">
              {card.waiteDesc.length > 200 ? card.waiteDesc.substring(0, 200) + '...' : card.waiteDesc}
            </div>
          )}
        </div>
      );
    }
    return null;
  }, [viewMode, featuredIndex, handleArcanaClick]);

  // Arrow navigation bar below the fan (replaces scrollbar)
  const renderFanNav = useCallback((totalCards) => {
    if (viewMode !== 'fan' || totalCards === 0) return null;
    const idx = Math.max(0, Math.min(featuredIndex, totalCards - 1));
    const atStart = idx === 0;
    const atEnd = idx >= totalCards - 1;
    return (
      <div className="mc-fan-nav">
        <button
          className="mc-fan-nav-btn"
          disabled={atStart}
          onClick={() => { const el = fanRef.current; if (el) scrollToIndex(el, idx - 5); }}
          aria-label="Back 5 cards"
        >&#x00AB;</button>
        <button
          className="mc-fan-nav-btn"
          disabled={atStart}
          onClick={() => { const el = fanRef.current; if (el) scrollToIndex(el, idx - 1); }}
          aria-label="Previous card"
        >&#x2039;</button>
        <span className="mc-fan-nav-pos">{idx + 1} / {totalCards}</span>
        <button
          className="mc-fan-nav-btn"
          disabled={atEnd}
          onClick={() => { const el = fanRef.current; if (el) scrollToIndex(el, idx + 1); }}
          aria-label="Next card"
        >&#x203A;</button>
        <button
          className="mc-fan-nav-btn"
          disabled={atEnd}
          onClick={() => { const el = fanRef.current; if (el) scrollToIndex(el, idx + 5); }}
          aria-label="Forward 5 cards"
        >&#x00BB;</button>
      </div>
    );
  }, [viewMode, featuredIndex, scrollToIndex]);

  const crossRef = useMemo(() => {
    if (!expandedCard) return [];
    return getCrossReference(expandedCard.number);
  }, [expandedCard]);

  const position = useMemo(() => {
    if (!expandedCard) return null;
    return getArcanaPosition(expandedCard.number);
  }, [expandedCard]);

  const isTarotView = activeCulture === 'tarot';

  const isPlaying = (initialSection || 'playing') === 'playing';
  const isWorldOfTarot = !initialSection && !initialCulture;
  const deckLabel = isWorldOfTarot
    ? 'World of Tarot'
    : isPlaying
      ? 'Playing Cards'
      : (CULTURES.find(c => c.key === (initialCulture || 'tarot'))?.label || initialCulture || 'Tarot');
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
    const t1 = setTimeout(() => { setRevealedCount(1); speak(`Present: ${three[0].name}`); }, 600 + 800);
    const t2 = setTimeout(() => { setRevealedCount(2); speak(`Past: ${three[1].name}`); }, 1800 + 800);
    const t3 = setTimeout(() => { setRevealedCount(3); speak(`Future: ${three[2].name}`); }, 3000 + 800);
    const t4 = setTimeout(() => setReadingPhase('interpret-ask'), 4200 + 800);
    revealTimers.current = [t0, t1, t2, t3, t4];
  }, [activeCulture, speak]);

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
      const greeting = data.reply || 'What brings you to the cards today?';
      setReadingMessages([{ role: 'assistant', content: greeting }]);
      speak(greeting);
    } catch {
      const fallback = 'What brings you to the cards today?';
      setReadingMessages([{ role: 'assistant', content: fallback }]);
      speak(fallback);
    }
    setReadingLoading(false);
  }, [activeCulture, speak]);

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
      speak(data.reply);

      // If ready to draw, or 3 exchanges passed — auto-proceed
      if (data.readyToDraw || intentionExchangeCount.current >= 3) {
        setReadingLoading(false);
        setTimeout(() => performDraw(), 1500);
        return;
      }
    } catch {
      const fallback = 'Let us proceed with your reading.';
      setReadingMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      speak(fallback);
      setTimeout(() => performDraw(), 1500);
    }
    setReadingLoading(false);
  }, [readingInput, readingMessages, readingLoading, readingIntention, activeCulture, performDraw, speak]);

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
      const reply = data.reply || 'The cards speak...';
      setReadingMessages([{ role: 'assistant', content: reply }]);
      speak(reply);

      // Save reading as a personal story in Story Forge
      const storyId = `tarot-${Date.now()}`;
      const storyName = intention ? `Tarot: ${intention.slice(0, 60)}` : 'Tarot Reading';
      addStory(storyId, storyName, 'tarot-reading');

      const stageMap = { past: 'golden-age', present: 'forge', future: 'new-age' };
      drawnCards.forEach(card => {
        const stageId = stageMap[card.position];
        addStoryEntry(storyId, stageId, {
          text: `${card.name} (${activeCulture}) — ${card.description || ''}`,
          source: 'tarot-reading',
        });
      });
      updateStoryGenerated(storyId, 'forge', reply);
      savedStoryId.current = storyId;
    } catch {
      const fallback = 'The cards hold mysteries I cannot quite reach at this moment. Please try again.';
      setReadingMessages([{ role: 'assistant', content: fallback }]);
      speak(fallback);
    }
    setReadingLoading(false);
  }, [drawnCards, readingIntention, readingMessages, activeCulture, speak, addStory, addStoryEntry, updateStoryGenerated]);

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
      speak(data.reply);

      // Update saved story with follow-up interpretation
      if (savedStoryId.current && data.reply) {
        updateStoryGenerated(savedStoryId.current, 'new-age', data.reply);
      }
    } catch {
      const fallback = 'I seem to have lost the thread. Could you ask again?';
      setReadingMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      speak(fallback);
    }
    setReadingLoading(false);
  }, [readingInput, readingMessages, readingLoading, drawnCards, readingIntention, activeCulture, speak, updateStoryGenerated]);

  const handleCancelReading = useCallback(() => {
    revealTimers.current.forEach(t => clearTimeout(t));
    revealTimers.current = [];
    stopSpeaking();
    setReadingPhase(null);
    setReadingMessages([]);
    setReadingInput('');
    setReadingLoading(false);
    setDrawnCards([]);
    setRevealedCount(0);
    setReadingIntention('');
    intentionExchangeCount.current = 0;
    savedStoryId.current = null;
  }, [stopSpeaking]);

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
        <div className="mc-reading-top-bar">
          <button className="game-mode-back" onClick={handleCancelReading}>
            &#8592; Cancel
          </button>
          <button
            className={`mc-voice-toggle${voiceEnabled ? ' active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
          </button>
        </div>
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
            {speaking && !readingLoading && (
              <div className="mc-reading-msg mc-reading-msg-assistant mc-reading-speaking">
                <span className="mc-speaking-icon">{'\u{1F50A}'}</span> Speaking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="mc-reading-input-row">
            <input
              className="mc-reading-input"
              type="text"
              placeholder={voiceEnabled ? 'Tap mic or type...' : "Share what's on your mind..."}
              value={readingInput}
              onChange={e => setReadingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendIntention()}
              disabled={readingLoading}
            />
            {voiceEnabled && SpeechRecognition && (
              <button
                className={`mc-mic-btn${recording ? ' recording' : ''}`}
                onClick={recording ? stopListening : startListening}
                disabled={readingLoading || speaking}
                title={recording ? 'Stop recording' : 'Start recording'}
              >
                {recording ? '\u{23F9}' : '\u{1F3A4}'}
              </button>
            )}
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
        <div className="mc-reading-top-bar">
          <button className="game-mode-back" onClick={handleCancelReading}>
            &#8592; Back
          </button>
          <button
            className={`mc-voice-toggle${voiceEnabled ? ' active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
          </button>
        </div>
        <div className="mc-reading-panel">
          <h2 className="mc-reading-title">{cultureLabel} Reading</h2>

          {/* Three card spread */}
          <div className="mc-spread">
            {spreadOrder.map(card => {
              const revealed = isCardRevealed(card);
              const pos = getArcanaPosition(card.number);
              const sym = pos ? (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '' : '';
              const spreadImg = activeCulture === 'tarot' ? getTarotMajorImg(card.number) : null;
              return (
                <div key={card.position} className={`mc-spread-slot ${card.position}`}>
                  <span className="mc-spread-position-label">
                    {card.position.charAt(0).toUpperCase() + card.position.slice(1)}
                  </span>
                  {revealed ? (
                    <div className={`mc-spread-card mc-spread-card-revealed${spreadImg ? ' has-img' : ''}`}>
                      {spreadImg && <img className="mc-card-img" src={spreadImg} alt={card.name} loading="lazy" />}
                      {spreadImg ? (
                        <div className="mc-card-img-overlay mc-spread-overlay">
                          <span className="mc-spread-card-name">{card.name}</span>
                        </div>
                      ) : (
                        <>
                          <span className="mc-card-number">#{card.number}</span>
                          {sym && <span className="mc-spread-symbol">{sym}</span>}
                          <span className="mc-spread-card-name">{card.name}</span>
                          {pos && (
                            <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                              {pos.correspondence}
                            </span>
                          )}
                        </>
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
                {speaking && !readingLoading && (
                  <div className="mc-reading-msg mc-reading-msg-assistant mc-reading-speaking">
                    <span className="mc-speaking-icon">{'\u{1F50A}'}</span> Speaking...
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
                      placeholder={voiceEnabled ? 'Tap mic or type...' : 'Ask a follow-up...'}
                      value={readingInput}
                      onChange={e => setReadingInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendFollowUp()}
                    />
                    {voiceEnabled && SpeechRecognition && (
                      <button
                        className={`mc-mic-btn${recording ? ' recording' : ''}`}
                        onClick={recording ? stopListening : startListening}
                        disabled={readingLoading || speaking}
                        title={recording ? 'Stop recording' : 'Start recording'}
                      >
                        {recording ? '\u{23F9}' : '\u{1F3A4}'}
                      </button>
                    )}
                    <button
                      className="mc-reading-send"
                      onClick={handleSendFollowUp}
                      disabled={!readingInput.trim()}
                    >
                      Send
                    </button>
                  </div>
                  <div className="mc-reading-done">
                    <button className="fellowship-share-btn" onClick={() => setShowFellowshipShare(true)}>
                      Share this reading?
                    </button>
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
                  {showFellowshipShare && (
                    <ShareCompletionModal
                      completionType="tarot"
                      completionId={`tarot-${Date.now()}`}
                      completionLabel="Tarot Reading"
                      completionData={{
                        drawnCards: drawnCards.map(c => ({ name: c.name, position: c.position })),
                        readingIntention,
                        interpretation: readingMessages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n'),
                        activeCulture,
                      }}
                      onClose={() => setShowFellowshipShare(false)}
                      onPosted={() => setShowFellowshipShare(false)}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Derive toolbar button label and whether Ask is functional
  const showAsk = !isPlaying && !isWorldOfTarot;
  const drawLabel = isPlaying ? 'Play' : 'Ask';

  const fanProps = {
    ref: fanRefCb,
    onMouseDown: fanMouseDown,
    onMouseMove: fanMouseMove,
    onMouseUp: fanMouseUp,
    onMouseLeave: fanMouseUp,
    onScroll: fanScroll,
  };

  return (
    <div className="mc-browser">
      <button className="game-mode-back" onClick={onExit}>
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

      {/* Toolbar: view toggle + draw controls */}
      <div className="mc-toolbar">
        <div className="mc-view-toggle">
          <button
            className={`mc-view-btn${viewMode === 'fan' ? ' active' : ''}`}
            onClick={() => setViewMode('fan')}
          >
            Fan
          </button>
          <button
            className={`mc-view-btn${viewMode === 'open' ? ' active' : ''}`}
            onClick={() => setViewMode('open')}
          >
            Open
          </button>
        </div>
        {showAsk && (
          <>
            <button
              className={`mc-voice-toggle${voiceEnabled ? ' active' : ''}`}
              onClick={toggleVoice}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? '\u{1F50A}' : '\u{1F507}'}
            </button>
            <select className="mc-draw-select" value={drawType} disabled>
              <option value="three-card">Three Card</option>
            </select>
            <button className="card-deck-btn card-deck-btn-action" onClick={handleStartReading}>
              {drawLabel}
            </button>
          </>
        )}
        {!showAsk && (
          <button className="card-deck-btn card-deck-btn-action" disabled={isPlaying}>
            {drawLabel}
          </button>
        )}
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

          {viewMode === 'fan' ? (
            <>
              <div className="mc-fan" {...fanProps}>
                {filteredPlaying.map((card, i) => (
                  <div key={card.id} className={`mc-playing-card${i === featuredIndex ? ' mc-fan-featured' : ''}`} data-fan-card>
                    <span className="mc-playing-rank mc-playing-rank-top">{card.rank}</span>
                    <span className="mc-playing-suit" style={{ color: card.suitColor }}>
                      {card.suitSymbol}
                    </span>
                    <span className="mc-playing-rank mc-playing-rank-bottom">{card.rank}</span>
                    <span className="mc-playing-value">{card.value} pt{card.value !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
              {renderFanNav(filteredPlaying.length)}
              {renderFanInfo(filteredPlaying, 'playing')}
            </>
          ) : (
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
          )}
        </>
      )}

      {/* === TAROT DECKS SECTION === */}
      {section === 'arcana' && (
        <>
          {/* Culture carousel */}
          <CultureCarousel
            activeKey={activeCulture}
            onSelect={(key) => { setActiveCulture(key); setExpandedCard(null); setMinorSuitFilter(null); }}
          />

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
              {/* Tarot overview (22 base positions) */}
              {isTarotView && (
                <>
                  <div className={viewMode === 'fan' ? 'mc-fan' : 'mc-card-grid'} {...(viewMode === 'fan' ? fanProps : {})}>
                    {ARCANA_POSITIONS.map((pos, i) => {
                      const sym = (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '';
                      const imgSrc = getTarotMajorImg(pos.number);
                      return (
                        <button
                          key={pos.number}
                          className={`mc-card mc-arcana-card mc-tarot-card has-img${viewMode === 'fan' && i === featuredIndex ? ' mc-fan-featured' : ''}`}
                          data-fan-card
                          onClick={() => { if (!wasDrag()) setExpandedCard({ number: pos.number, name: pos.tarot, culture: 'tarot' }); }}
                        >
                          <img className="mc-card-img" src={imgSrc} alt={pos.tarot} loading="lazy" />
                          <div className="mc-card-img-overlay">
                            <span className="mc-card-number">#{pos.number}</span>
                            <span className="mc-card-name">{pos.tarot}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {viewMode === 'fan' && renderFanNav(ARCANA_POSITIONS.length)}
                  {viewMode === 'fan' && renderFanInfo(ARCANA_POSITIONS, 'tarot')}
                </>
              )}

              {/* Culture-specific major arcana */}
              {!isTarotView && (
                <>
                  <div className={viewMode === 'fan' ? 'mc-fan' : 'mc-card-grid'} {...(viewMode === 'fan' ? fanProps : {})}>
                    {arcanaCards.map((card, i) => {
                      const pos = getArcanaPosition(card.number);
                      return (
                        <button
                          key={`${card.culture}-${card.number}`}
                          className={`mc-card mc-arcana-card${viewMode === 'fan' && i === featuredIndex ? ' mc-fan-featured' : ''}`}
                          data-fan-card
                          onClick={() => { if (!wasDrag()) handleArcanaClick(card); }}
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
                  {viewMode === 'fan' && renderFanNav(arcanaCards.length)}
                  {viewMode === 'fan' && renderFanInfo(arcanaCards, 'arcana')}
                </>
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

              {/* Minor arcana cards */}
              {viewMode === 'fan' ? (
                <>
                  <div className="mc-fan" {...fanProps}>
                    {filteredMinor.map((card, i) => {
                      const minorImg = getTarotMinorImg(card);
                      return (
                        <div
                          key={card.id}
                          className={`mc-minor-card${card.isCourt ? ' mc-court' : ''}${minorImg ? ' has-img' : ''}${i === featuredIndex ? ' mc-fan-featured' : ''}`}
                          data-fan-card
                        >
                          {minorImg && <img className="mc-card-img" src={minorImg} alt={`${card.rankLabel} of ${card.suitName}`} loading="lazy" />}
                          {minorImg ? (
                            <div className="mc-card-img-overlay">
                              <span className="mc-minor-name">{card.rankLabel}</span>
                              <span className="mc-minor-suit-label" style={{ color: card.suitColor }}>{card.suitName}</span>
                            </div>
                          ) : (
                            <>
                              <span className="mc-minor-rank-top">{card.isCourt ? card.rankLabel.charAt(0) : card.rankLabel}</span>
                              <span className="mc-minor-suit" style={{ color: card.suitColor }}>
                                {card.suitSymbol}
                              </span>
                              <span className="mc-minor-name">{card.rankLabel}</span>
                              <span className="mc-minor-suit-label" style={{ color: card.suitColor }}>
                                {card.suitName}
                              </span>
                              <span className="mc-minor-value">{card.value} pt{card.value !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {renderFanNav(filteredMinor.length)}
                  {renderFanInfo(filteredMinor, 'minor')}
                </>
              ) : (
                <div className="mc-card-grid mc-minor-grid">
                  {filteredMinor.map(card => {
                    const minorImg = getTarotMinorImg(card);
                    return (
                      <div
                        key={card.id}
                        className={`mc-minor-card${card.isCourt ? ' mc-court' : ''}${minorImg ? ' has-img' : ''}`}
                      >
                        {minorImg && <img className="mc-card-img" src={minorImg} alt={`${card.rankLabel} of ${card.suitName}`} loading="lazy" />}
                        {minorImg ? (
                          <div className="mc-card-img-overlay">
                            <span className="mc-minor-name">{card.rankLabel}</span>
                            <span className="mc-minor-suit-label" style={{ color: card.suitColor }}>{card.suitName}</span>
                          </div>
                        ) : (
                          <>
                            <span className="mc-minor-rank-top">{card.isCourt ? card.rankLabel.charAt(0) : card.rankLabel}</span>
                            <span className="mc-minor-suit" style={{ color: card.suitColor }}>
                              {card.suitSymbol}
                            </span>
                            <span className="mc-minor-name">{card.rankLabel}</span>
                            <span className="mc-minor-suit-label" style={{ color: card.suitColor }}>
                              {card.suitName}
                            </span>
                            <span className="mc-minor-value">{card.value} pt{card.value !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                  {/* Tarot card image */}
                  {expandedCard.culture === 'tarot' && (
                    <div className="mc-detail-img-wrap">
                      <img
                        className="mc-detail-img"
                        src={getTarotMajorImg(expandedCard.number)}
                        alt={expandedCard.name}
                        loading="lazy"
                      />
                    </div>
                  )}

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

                  {/* Full description (culture-specific cards) */}
                  {expandedCard.description && (
                    <p className="mc-section-text">{expandedCard.description}</p>
                  )}

                  {/* Waite description (tarot base cards) */}
                  {expandedCard.culture === 'tarot' && position?.waiteDesc && (
                    <div style={{ marginTop: expandedCard.description ? 12 : 0 }}>
                      <h4 className="mc-section-heading">From The Pictorial Key</h4>
                      <p className="mc-section-text">{position.waiteDesc}</p>
                      <p className="mc-waite-source">
                        — A.E. Waite, <em>The Pictorial Key to the Tarot</em> (1910)
                      </p>
                    </div>
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
