import React from 'react';
import { ARCANA_POSITIONS, getCrossReference, getSuitsForCulture } from '../../games/mythouse/mythouseCardData';

const ROMAN_NUMERALS = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

const CARDINAL_TO_ZODIAC = {
  'vernal-equinox': 'Aries',
  'summer-solstice': 'Cancer',
  'autumnal-equinox': 'Libra',
  'winter-solstice': 'Capricorn',
};

const ZODIAC_ELEMENTS = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};

const ELEMENT_ARCANA = { Air: 0, Water: 12, Fire: 20 };

const CULTURE_KEYS = ['roman', 'greek', 'norse', 'babylonian', 'vedic', 'islamic', 'christian'];
const CULTURE_LABELS = { roman: 'Roman', greek: 'Greek', norse: 'Norse', babylonian: 'Babylonian', vedic: 'Vedic', islamic: 'Islamic', christian: 'Medieval Christianity' };

const ALL_SUIT_CULTURES = ['tarot', ...CULTURE_KEYS];
const SUIT_CULTURE_LABELS = { tarot: 'Tarot', ...CULTURE_LABELS };

function ArcanaCard({ position, cards }) {
  const numeral = ROMAN_NUMERALS[position.number] || String(position.number);
  return (
    <div className="tarot-arcana-block">
      <div className="tarot-position-header">
        <span className="tarot-numeral">{numeral}</span>
        <span className="tarot-name">{position.tarot}</span>
        <span className="tarot-correspondence">{position.correspondence}</span>
      </div>
      <div className="tarot-culture-grid">
        {cards.map(card => (
          <div key={card.culture} className="tarot-culture-card">
            <div className="tarot-culture-label">{CULTURE_LABELS[card.culture] || card.culture}</div>
            <div className="tarot-card-name">{card.name}</div>
            <p className="tarot-card-desc">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MinorArcanaSection({ element }) {
  const suits = ALL_SUIT_CULTURES
    .map(key => {
      const cultureSuits = getSuitsForCulture(key);
      const suit = cultureSuits.find(s => s.element === element);
      return suit ? { culture: key, ...suit } : null;
    })
    .filter(Boolean);

  if (suits.length === 0) return null;

  return (
    <div className="tarot-minor-section">
      <h5>Minor Arcana — {element} Suits</h5>
      <div className="tarot-suit-grid">
        {suits.map(s => (
          <div key={s.culture} className="tarot-suit-item">
            <span className="tarot-suit-symbol" style={{ color: s.color }}>{s.symbol}</span>
            <div>
              <div className="tarot-culture-label">{SUIT_CULTURE_LABELS[s.culture]}</div>
              <div className="tarot-card-name">{s.name}</div>
              {s.desc && <p className="tarot-suit-desc">{s.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TarotCardContent({ correspondenceType, correspondenceValue, element, showMinorArcana }) {
  let zodiacSign = null;
  let resolvedElement = element || null;

  if (correspondenceType === 'cardinal') {
    zodiacSign = CARDINAL_TO_ZODIAC[correspondenceValue];
    if (!resolvedElement && zodiacSign) resolvedElement = ZODIAC_ELEMENTS[zodiacSign];
  } else if (correspondenceType === 'zodiac') {
    zodiacSign = correspondenceValue;
    if (!resolvedElement) resolvedElement = ZODIAC_ELEMENTS[correspondenceValue];
  }

  // Find the arcana position for this correspondence
  let position = null;
  if (correspondenceType === 'planet') {
    position = ARCANA_POSITIONS.find(p => p.type === 'planet' && p.correspondence === correspondenceValue);
  } else if (correspondenceType === 'zodiac' || correspondenceType === 'cardinal') {
    const sign = zodiacSign || correspondenceValue;
    position = ARCANA_POSITIONS.find(p => p.type === 'zodiac' && p.correspondence === sign);
  }

  if (!position) return <p className="chrono-empty">No tarot correspondence found.</p>;

  const cards = getCrossReference(position.number);

  // Element arcana (for cardinal points)
  let elementPosition = null;
  let elementCards = [];
  if (correspondenceType === 'cardinal' && resolvedElement && ELEMENT_ARCANA[resolvedElement] !== undefined) {
    elementPosition = ARCANA_POSITIONS.find(p => p.number === ELEMENT_ARCANA[resolvedElement]);
    if (elementPosition) elementCards = getCrossReference(elementPosition.number);
  }

  return (
    <div className="tab-content tarot-content">
      <ArcanaCard position={position} cards={cards} />

      {elementPosition && elementCards.length > 0 && (
        <>
          <h5 style={{ marginTop: '1.5rem' }}>Element Card — {resolvedElement}</h5>
          <ArcanaCard position={elementPosition} cards={elementCards} />
        </>
      )}

      {showMinorArcana && resolvedElement && (
        <MinorArcanaSection element={resolvedElement} />
      )}
    </div>
  );
}
