import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameShell from '../shared/GameShell';
import GAME_BOOK from '../shared/gameBookData';
import { D6Display } from '../shared/DiceDisplay';
import { chooseBestMove, evaluateWithNoise } from '../shared/aiCore';
import {
  RINGS, SPACES_PER_RING, RING_DICE, GEMSTONE_VALUES, FALLEN_STARLIGHT_VALUE,
  PIECE_TYPES, LADDERS, CHUTES, ORDEAL_POSITIONS,
  ringPosToSVG, buildSpiralPath, rollForRing, getLadderAt, getChuteAt,
} from './mythouseData';
import { buildAllCards, shuffleDeck, drawContextualCard } from './mythouseCardData';

// Board expanded to fit celestial frame rings
const BOARD_SIZE = 660;
const CENTER = BOARD_SIZE / 2; // 330
const PLAYER_COLORS = ['#c9a961', '#8b9dc3'];

const DICE_TIERS = [
  { name: 'd6', sides: 6, unlockRing: 1 },
  { name: 'd8', sides: 8, unlockRing: 2 },
  { name: 'd12', sides: 12, unlockRing: 4 },
  { name: 'd20', sides: 20, unlockRing: 6 },
];

function pentagonPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

// === CELESTIAL FRAME DATA ===

// Zodiac ring dimensions (outer band, hugging edge)
const ZR_INNER = 270;
const ZR_OUTER = 318;
const ZR_GLYPH = 282;
const ZR_TEXT = 303;

// Month ring dimensions (between zodiac and game spiral)
const MR_INNER = 254;
const MR_OUTER = 267;
const MR_TEXT = 260;
const MR_OFFSET = 80;

// Zodiac signs with hand-drawn SVG path glyphs (from celestial clocks)
const ZODIAC = [
  { sign: 'Aries',       glyph: 'M-5,6 C-5,-2 -1,-7 0,-7 C1,-7 5,-2 5,6 M0,-7 L0,7' },
  { sign: 'Taurus',      glyph: 'M-6,-4 C-6,-8 6,-8 6,-4 M0,-4 C-4,-4 -6,0 -6,3 C-6,6 -3,7 0,7 C3,7 6,6 6,3 C6,0 4,-4 0,-4' },
  { sign: 'Gemini',      glyph: 'M-6,-7 C-2,-5 2,-5 6,-7 M-6,7 C-2,5 2,5 6,7 M-3,-6 L-3,6 M3,-6 L3,6' },
  { sign: 'Cancer',      glyph: 'M-6,-1 C-6,-5 0,-5 3,-3 M6,1 C6,5 0,5 -3,3 M-4,-1 A2,2 0 1,1 -4,-1.01 M4,1 A2,2 0 1,1 4,1.01' },
  { sign: 'Leo',         glyph: 'M-5,5 C-5,1 -2,-2 0,-2 C2,-2 4,0 4,3 C4,5 3,6 2,6 M0,-2 C-2,-2 -4,-5 -2,-7 C0,-8 3,-7 4,-5' },
  { sign: 'Virgo',       glyph: 'M-6,6 L-6,-4 C-6,-6 -4,-6 -3,-4 L-3,4 C-3,6 -1,6 0,4 L0,-4 C0,-6 2,-6 3,-4 L3,4 C3,6 5,4 6,2 M3,4 C4,6 6,7 7,5' },
  { sign: 'Libra',       glyph: 'M-7,3 L7,3 M-5,0 C-5,-4 5,-4 5,0 M-7,6 L7,6' },
  { sign: 'Scorpio',     glyph: 'M-6,6 L-6,-4 C-6,-6 -4,-6 -3,-4 L-3,4 C-3,6 -1,6 0,4 L0,-4 C0,-6 2,-6 3,-4 L3,6 L5,4 M3,6 L5,8' },
  { sign: 'Sagittarius', glyph: 'M-5,7 L6,-6 M6,-6 L1,-6 M6,-6 L6,-1 M-3,2 L3,-4' },
  { sign: 'Capricorn',   glyph: 'M-7,2 C-7,-4 -3,-7 0,-4 L0,4 C0,7 3,8 5,6 C7,4 6,1 4,1 C2,1 1,3 2,5' },
  { sign: 'Aquarius',    glyph: 'M-7,-2 L-4,-5 L-1,-2 L2,-5 L5,-2 M-7,2 L-4,-1 L-1,2 L2,-1 L5,2' },
  { sign: 'Pisces',      glyph: 'M-6,0 L6,0 M-3,-7 C-6,-4 -6,4 -3,7 M3,-7 C6,-4 6,4 3,7' },
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const CARDINALS = [
  { label: 'V.Eq.',  angle: 0 },
  { label: 'S.Sol.', angle: -90 },
  { label: 'A.Eq.',  angle: 180 },
  { label: 'W.Sol.', angle: 90 },
];

// Ring -> ruling planet -> zodiac sign indices that light up
const RING_ZODIAC = {
  1: [3],       // Moon -> Cancer
  2: [2, 5],    // Mercury -> Gemini, Virgo
  3: [1, 6],    // Venus -> Taurus, Libra
  4: [4],       // Sun -> Leo
  5: [0, 7],    // Mars -> Aries, Scorpio
  6: [8, 11],   // Jupiter -> Sagittarius, Pisces
  7: [9, 10],   // Saturn -> Capricorn, Aquarius
};

const RING_SYMBOLS = ['\u263D', '\u263F', '\u2640', '\u2609', '\u2642', '\u2643', '\u2644'];

// Educational content for zodiac signs
const ZODIAC_INFO = [
  { dates: 'Mar 21 \u2013 Apr 19', element: 'Fire', planet: 'Mars (Ring 5)', desc: 'The Ram. First sign of the zodiac, marking the vernal equinox. In ancient Babylon this constellation signaled the start of the agricultural year. Mars, its ruling planet, governs Ring 5 \u2014 the ring of courage and conquest.' },
  { dates: 'Apr 20 \u2013 May 20', element: 'Earth', planet: 'Venus (Ring 3)', desc: 'The Bull. Associated with fertility and spring\u2019s abundance. The Egyptians linked Taurus to the sacred Apis bull. Venus, its ruler, governs Ring 3 \u2014 the ring of beauty and harmony.' },
  { dates: 'May 21 \u2013 Jun 20', element: 'Air', planet: 'Mercury (Ring 2)', desc: 'The Twins. Symbol of duality and communication. In Greek myth, Castor and Pollux were placed among the stars. Mercury governs Ring 2 \u2014 the ring of messages and trade.' },
  { dates: 'Jun 21 \u2013 Jul 22', element: 'Water', planet: 'Moon (Ring 1)', desc: 'The Crab. Tied to the summer solstice and the tides. The Egyptians saw a scarab here \u2014 symbol of rebirth. The Moon governs Ring 1 \u2014 the starting ring of reflection and intuition.' },
  { dates: 'Jul 23 \u2013 Aug 22', element: 'Fire', planet: 'Sun (Ring 4)', desc: 'The Lion. Sign of sovereignty and creative power. In Mesopotamia, the lion marked the hottest part of summer. The Sun governs Ring 4 \u2014 the central ring of illumination.' },
  { dates: 'Aug 23 \u2013 Sep 22', element: 'Earth', planet: 'Mercury (Ring 2)', desc: 'The Maiden. Harvest sign of precision and service. Often linked to Demeter or Persephone. Mercury also governs Ring 2 \u2014 the ring of craft and careful analysis.' },
  { dates: 'Sep 23 \u2013 Oct 22', element: 'Air', planet: 'Venus (Ring 3)', desc: 'The Scales. Marks the autumnal equinox when day and night balance. The only zodiac sign represented by an object rather than a creature. Venus also governs Ring 3 \u2014 the ring of justice and art.' },
  { dates: 'Oct 23 \u2013 Nov 21', element: 'Water', planet: 'Mars (Ring 5)', desc: 'The Scorpion. Sign of transformation and depth. In Sumerian myth, scorpion-men guarded the gates of the underworld. Mars also governs Ring 5 \u2014 the ring of ordeals and rebirth.' },
  { dates: 'Nov 22 \u2013 Dec 21', element: 'Fire', planet: 'Jupiter (Ring 6)', desc: 'The Archer. Seeker of truth and far horizons. The centaur Chiron taught heroes the healing arts. Jupiter governs Ring 6 \u2014 the ring of expansion and wisdom.' },
  { dates: 'Dec 22 \u2013 Jan 19', element: 'Earth', planet: 'Saturn (Ring 7)', desc: 'The Sea-Goat. Marks the winter solstice and the return of light. An ancient hybrid creature from Sumerian tradition. Saturn governs Ring 7 \u2014 the summit ring of mastery and endurance.' },
  { dates: 'Jan 20 \u2013 Feb 18', element: 'Air', planet: 'Saturn (Ring 7)', desc: 'The Water-Bearer. Sign of innovation and collective vision. In Egyptian lore, the Nile\u2019s flood was poured from a celestial vessel. Saturn also governs Ring 7 \u2014 the ring of the final ascent.' },
  { dates: 'Feb 19 \u2013 Mar 20', element: 'Water', planet: 'Jupiter (Ring 6)', desc: 'The Fishes. Last sign, closing the great cycle before rebirth. Two fish swim in opposite directions, bound together. Jupiter also governs Ring 6 \u2014 the ring of dreams and faith.' },
];

// Educational content for months
const MONTH_INFO = [
  { etymology: 'Named for Janus, Roman god of doorways, gates, and transitions.', note: 'Janus has two faces \u2014 one looking back, one forward. Originally not part of the Roman calendar; added by King Numa Pompilius around 713 BC.' },
  { etymology: 'From Februa, the Roman festival of purification held on the 15th.', note: 'The shortest month. Originally the last month of the Roman year. The purification rites prepared the city for the new year in March.' },
  { etymology: 'Named for Mars, the Roman god of war and agriculture.', note: 'Originally the first month of the Roman calendar \u2014 New Year began here. Mars was an agricultural guardian before becoming a war god. Contains the vernal equinox.' },
  { etymology: 'Possibly from Latin aperire (\u201cto open\u201d), as flowers open in spring.', note: 'Sacred to Venus in the Roman tradition. Some scholars connect it to the Etruscan name for Aphrodite. The medieval English called it \u201cEaster-month.\u201d' },
  { etymology: 'Named for Maia, Roman goddess of growth and nurturing.', note: 'Maia was the eldest of the Pleiades and mother of Mercury. The Romans made offerings to her on May 1st. Celtic traditions celebrate Beltane at the start of May.' },
  { etymology: 'Named for Juno, goddess of marriage, childbirth, and the Roman state.', note: 'Contains the summer solstice \u2014 the longest day. Traditional month for weddings in Western culture. Juno was the protector of Rome and queen of the gods.' },
  { etymology: 'Named for Julius Caesar, who reformed the calendar in 46 BC.', note: 'Originally called Quintilis (\u201cfifth month\u201d). Caesar\u2019s Julian calendar replaced the chaotic Roman system. He was born on July 12th or 13th, 100 BC.' },
  { etymology: 'Named for Emperor Augustus Caesar, who followed Julius.', note: 'Originally Sextilis (\u201csixth month\u201d). Augustus chose it to commemorate his greatest victories, including the conquest of Egypt. He took a day from February to make it 31 days.' },
  { etymology: 'From Latin septem (\u201cseven\u201d) \u2014 the 7th month of the old 10-month Roman calendar.', note: 'Contains the autumnal equinox. The Harvest Moon often falls in September. Despite calendar reform, the name was never updated.' },
  { etymology: 'From Latin octo (\u201ceight\u201d) \u2014 the 8th month of the old Roman calendar.', note: 'Many ancient cultures marked this as a threshold time. The Celtic festival Samhain (Oct 31) celebrated the thinning of the veil between worlds.' },
  { etymology: 'From Latin novem (\u201cnine\u201d) \u2014 the 9th month of the old Roman calendar.', note: 'The Romans held the Plebeian Games (Ludi Plebeii) November 4\u201317. In many traditions, this month honors the dead and ancestors.' },
  { etymology: 'From Latin decem (\u201cten\u201d) \u2014 the 10th month of the old Roman calendar.', note: 'Contains the winter solstice \u2014 the shortest day and return of light. Saturnalia, the great Roman festival of gift-giving, was held Dec 17\u201323.' },
];

// Celestial frame helpers
function polar(r, deg) {
  const rad = deg * Math.PI / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function tangentRot(deg) {
  let r = deg + 90;
  while (r > 180) r -= 360;
  while (r <= -180) r += 360;
  if (r > 90 || r < -90) r += 180;
  while (r > 180) r -= 360;
  while (r <= -180) r += 360;
  return r;
}

// === GAME LOGIC ===

function initPieces() {
  return [
    PIECE_TYPES.map((_, i) => ({ ring: 1, pos: i * 2, finished: false })),
    PIECE_TYPES.map((_, i) => ({ ring: 1, pos: i * 2 + 1, finished: false })),
  ];
}

export default function MythouseGame({ mode, onExit }) {
  const [pieces, setPieces] = useState(initPieces);
  const [scores, setScores] = useState([0, 0]);
  const [gems, setGems] = useState(() => {
    const g = {};
    for (let r = 1; r <= RINGS; r++) g[r] = true;
    return g;
  });
  const [starlightClaimed, setStarlightClaimed] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [gamePhase, setGamePhase] = useState('rolling');
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('Roll the dice to begin your ascent!');
  const [legalMoves, setLegalMoves] = useState([]);
  const [ordeal, setOrdeal] = useState(null);
  const [moveLog, setMoveLog] = useState([]);
  const [direction, setDirection] = useState(1);
  const [selectedCelestial, setSelectedCelestial] = useState(null); // { type: 'zodiac'|'month', index }
  const [gameDeck, setGameDeck] = useState(() => shuffleDeck(buildAllCards()));
  const aiTimer = useRef(null);
  const isAI = mode === 'ai';

  const resetGame = useCallback(() => {
    setPieces(initPieces());
    setScores([0, 0]);
    setGems(() => {
      const g = {};
      for (let r = 1; r <= RINGS; r++) g[r] = true;
      return g;
    });
    setStarlightClaimed(false);
    setCurrentPlayer(0);
    setDiceValue(null);
    setGamePhase('rolling');
    setWinner(null);
    setTurnCount(0);
    setMessage('Roll the dice to begin your ascent!');
    setLegalMoves([]);
    setOrdeal(null);
    setMoveLog([]);
    setSelectedCelestial(null);
    setGameDeck(shuffleDeck(buildAllCards()));
    if (aiTimer.current) clearTimeout(aiTimer.current);
  }, []);

  const getHighestRing = useCallback((player) => {
    return Math.max(...pieces[player].filter(p => !p.finished).map(p => p.ring), 1);
  }, [pieces]);

  const getLegalMovesForPlayer = useCallback((player, roll, currentPieces) => {
    const myPieces = currentPieces[player];
    const oppPieces = currentPieces[1 - player];
    const moves = [];

    for (let i = 0; i < myPieces.length; i++) {
      const piece = myPieces[i];
      if (piece.finished) continue;

      let newPos = piece.pos + roll;
      let newRing = piece.ring;

      if (newPos >= SPACES_PER_RING) {
        if (piece.ring >= RINGS) {
          if (newPos === SPACES_PER_RING) {
            moves.push({ pieceIdx: i, toRing: RINGS, toPos: SPACES_PER_RING, type: 'summit' });
          }
          continue;
        }
        newRing = piece.ring + 1;
        newPos = newPos - SPACES_PER_RING;
      }

      const ownBlocked = myPieces.some((p, j) =>
        j !== i && !p.finished && p.ring === newRing && p.pos === newPos
      );

      const oppOnDest = oppPieces.some(p =>
        !p.finished && p.ring === newRing && p.pos === newPos
      );

      moves.push({
        pieceIdx: i,
        fromRing: piece.ring,
        fromPos: piece.pos,
        toRing: newRing,
        toPos: newPos,
        type: ownBlocked ? 'push' : oppOnDest ? 'displace' : 'move',
      });
    }

    return moves;
  }, []);

  const handleRoll = useCallback(() => {
    if (gamePhase !== 'rolling' || winner !== null) return;
    const highRing = getHighestRing(currentPlayer);
    const roll = rollForRing(highRing);
    setDiceValue(roll);

    const moves = getLegalMovesForPlayer(currentPlayer, roll, pieces);
    if (moves.length === 0) {
      setMessage(`Rolled ${roll} \u2014 no legal moves`);
      setMoveLog(log => [...log, `${isAI ? (currentPlayer === 0 ? 'You' : 'Atlas') : 'Player ' + (currentPlayer + 1)} rolled ${roll} \u2014 no legal moves`]);
      setCurrentPlayer(p => 1 - p);
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      return;
    }

    setLegalMoves(moves);
    setGamePhase('moving');
    setMessage(`Rolled ${roll} (${RING_DICE[highRing].name}) \u2014 choose a piece`);
  }, [gamePhase, winner, currentPlayer, pieces, getHighestRing, getLegalMovesForPlayer, isAI]);

  const applyMove = useCallback((move) => {
    setPieces(prev => {
      const next = [prev[0].map(p => ({ ...p })), prev[1].map(p => ({ ...p }))];

      if (move.type === 'summit') {
        next[currentPlayer][move.pieceIdx].finished = true;

        const allFinished = next[currentPlayer].every(p => p.finished);
        if (allFinished || !starlightClaimed) {
          if (!starlightClaimed) {
            setStarlightClaimed(true);
            setScores(s => {
              const ns = [...s];
              ns[currentPlayer] += FALLEN_STARLIGHT_VALUE;
              return ns;
            });
            setMessage(`Reached the summit! Claimed Fallen Starlight (+${FALLEN_STARLIGHT_VALUE})`);
            setMoveLog(log => [...log, `Reached the summit! Claimed Fallen Starlight (+${FALLEN_STARLIGHT_VALUE})`]);
          }

          setWinner(null);
          setGamePhase('gameover');

          const finalScores = [...scores];
          finalScores[currentPlayer] += FALLEN_STARLIGHT_VALUE;
          const w = finalScores[0] > finalScores[1] ? 0 : finalScores[1] > finalScores[0] ? 1 : 0;
          setWinner(w);
          return next;
        }

        setMessage('Piece reaches the summit!');
        setMoveLog(log => [...log, 'Piece reaches the summit!']);
        setCurrentPlayer(p => 1 - p);
        setGamePhase('rolling');
        setTurnCount(t => t + 1);
        setLegalMoves([]);
        return next;
      }

      let destRing = move.toRing;
      let destPos = move.toPos;

      if (move.type === 'push') {
        const pushIdx = next[currentPlayer].findIndex((p, j) =>
          j !== move.pieceIdx && !p.finished && p.ring === destRing && p.pos === destPos
        );
        if (pushIdx !== -1) {
          next[currentPlayer][pushIdx].pos = Math.max(0, next[currentPlayer][pushIdx].pos - 3);
        }
      }

      if (move.type === 'displace') {
        const oppIdx = next[1 - currentPlayer].findIndex(p =>
          !p.finished && p.ring === destRing && p.pos === destPos
        );
        if (oppIdx !== -1) {
          next[1 - currentPlayer][oppIdx].pos = 0;
        }
      }

      next[currentPlayer][move.pieceIdx].ring = destRing;
      next[currentPlayer][move.pieceIdx].pos = destPos;

      const ladder = getLadderAt(destRing, destPos);
      if (ladder) {
        next[currentPlayer][move.pieceIdx].ring = ladder.toRing;
        next[currentPlayer][move.pieceIdx].pos = ladder.toPos;
        setMessage(`Ladder! Climb to ring ${ladder.toRing}`);
        setMoveLog(log => [...log, `Ladder! Climb to ring ${ladder.toRing}`]);
      } else {
        const chute = getChuteAt(destRing, destPos);
        if (chute) {
          next[currentPlayer][move.pieceIdx].ring = chute.toRing;
          next[currentPlayer][move.pieceIdx].pos = chute.toPos;
          setMessage(`Chute! Slide to ring ${chute.toRing}`);
          setMoveLog(log => [...log, `Chute! Slide to ring ${chute.toRing}`]);
        } else {
          setMessage(`Moved to ring ${destRing}, position ${destPos}`);
          setMoveLog(log => [...log, `Moved to ring ${destRing}, position ${destPos}`]);
        }
      }

      if (gems[destRing] && destPos === 0) {
        setGems(g => ({ ...g, [destRing]: false }));
        const val = GEMSTONE_VALUES[destRing];
        setScores(s => {
          const ns = [...s];
          ns[currentPlayer] += val;
          return ns;
        });
        setMessage(m => m + ` Collected gemstone (+${val} pts)!`);
        setMoveLog(log => [...log, `Collected gemstone (+${val} pts)!`]);
      }

      const finalRing = next[currentPlayer][move.pieceIdx].ring;
      if (ORDEAL_POSITIONS.includes(finalRing) && next[currentPlayer][move.pieceIdx].pos === 0 &&
          move.fromRing !== finalRing) {
        setOrdeal({
          challenger: currentPlayer,
          defender: 1 - currentPlayer,
          cards: [null, null],
          revealed: false,
          pieceIdx: move.pieceIdx,
          ring: finalRing,
        });
        setGamePhase('ordeal');
        setLegalMoves([]);
        return next;
      }

      setCurrentPlayer(p => 1 - p);
      setGamePhase('rolling');
      setTurnCount(t => t + 1);
      setLegalMoves([]);
      return next;
    });
  }, [currentPlayer, gems, scores, starlightClaimed]);

  const handlePieceClick = useCallback((pieceIdx) => {
    if (gamePhase !== 'moving') return;
    const move = legalMoves.find(m => m.pieceIdx === pieceIdx);
    if (move) applyMove(move);
  }, [gamePhase, legalMoves, applyMove]);

  const handleOrdealReveal = useCallback(() => {
    if (!ordeal || ordeal.revealed) return;
    let deck = gameDeck;
    if (deck.length < 2) deck = shuffleDeck(buildAllCards());
    const draw1 = drawContextualCard(deck, ordeal.ring);
    const draw2 = drawContextualCard(draw1.remaining, ordeal.ring);
    setGameDeck(draw2.remaining);
    const card0 = draw1.card || { name: 'Unknown', power: Math.floor(Math.random() * 10) + 1, deckLabel: '' };
    const card1 = draw2.card || { name: 'Unknown', power: Math.floor(Math.random() * 10) + 1, deckLabel: '' };
    setOrdeal(prev => ({ ...prev, cards: [card0, card1], revealed: true }));
  }, [ordeal, gameDeck]);

  const handleOrdealClose = useCallback(() => {
    if (!ordeal || !ordeal.revealed) return;
    const c0 = ordeal.cards[0];
    const c1 = ordeal.cards[1];
    const p0 = c0.power;
    const p1 = c1.power;
    const ordealWinner = p0 >= p1 ? ordeal.challenger : ordeal.defender;

    if (ordealWinner === ordeal.challenger) {
      const msg = `Won with ${c0.name} (${p0}) vs ${c1.name} (${p1})!`;
      setMessage(msg);
      setMoveLog(log => [...log, msg]);
      setScores(s => {
        const ns = [...s];
        ns[ordeal.challenger] += 10;
        return ns;
      });
    } else {
      const msg = `Lost! ${c0.name} (${p0}) vs ${c1.name} (${p1}). Pushed back.`;
      setMessage(msg);
      setMoveLog(log => [...log, msg]);
      setPieces(prev => {
        const next = [prev[0].map(p => ({ ...p })), prev[1].map(p => ({ ...p }))];
        const piece = next[ordeal.challenger][ordeal.pieceIdx];
        piece.pos = Math.max(0, piece.pos - 5);
        return next;
      });
    }

    setOrdeal(null);
    setCurrentPlayer(p => 1 - p);
    setGamePhase('rolling');
    setTurnCount(t => t + 1);
  }, [ordeal]);

  // AI auto-play
  useEffect(() => {
    if (isAI && currentPlayer === 1 && winner === null) {
      if (gamePhase === 'rolling') {
        aiTimer.current = setTimeout(handleRoll, 700);
      } else if (gamePhase === 'moving' && legalMoves.length > 0) {
        aiTimer.current = setTimeout(() => {
          const move = chooseBestMove(legalMoves, (m) => {
            let score = 0;
            if (m.type === 'summit') score += 100;
            if (m.type === 'displace') score += 10;
            if (m.toRing > m.fromRing) score += 15;
            score += m.toPos * 0.5;
            const ladder = getLadderAt(m.toRing, m.toPos);
            if (ladder) score += 20;
            const chute = getChuteAt(m.toRing, m.toPos);
            if (chute) score -= 15;
            if (m.type === 'push') score -= 5;
            return evaluateWithNoise(score);
          });
          if (move) applyMove(move);
        }, 500);
      } else if (gamePhase === 'ordeal') {
        aiTimer.current = setTimeout(() => {
          if (!ordeal?.revealed) {
            handleOrdealReveal();
            setTimeout(handleOrdealClose, 800);
          }
        }, 600);
      }
    }
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [isAI, currentPlayer, gamePhase, winner, legalMoves, ordeal,
      handleRoll, applyMove, handleOrdealReveal, handleOrdealClose]);

  // === RENDER ===

  const players = isAI
    ? [{ name: 'You', color: PLAYER_COLORS[0] }, { name: 'Atlas', color: PLAYER_COLORS[1] }]
    : [{ name: 'Player 1', color: PLAYER_COLORS[0] }, { name: 'Player 2', color: PLAYER_COLORS[1] }];

  const legalPieceIndices = new Set(legalMoves.map(m => m.pieceIdx));

  const highestRing = getHighestRing(currentPlayer);
  const activeDieSides = RING_DICE[highestRing].sides;

  // Active zodiac signs based on current ring's ruling planet
  const activeZodiac = new Set(RING_ZODIAC[highestRing] || []);
  const currentMonth = new Date().getMonth();

  return (
    <GameShell
      gameName="Mythouse Game"
      players={players}
      currentPlayer={currentPlayer}
      diceResult={diceValue}
      gamePhase={gamePhase}
      winner={winner}
      turnCount={turnCount}
      onRoll={handleRoll}
      onRestart={resetGame}
      onExit={onExit}
      diceDisplay={diceValue ? <><D6Display value={Math.min(diceValue, 6)} /><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 2 }}>{RING_DICE[highestRing].name}: {diceValue}</div></> : null}
      extraInfo={message}
      moveLog={moveLog}
      rules={GAME_BOOK['mythouse'].rules}
      secrets={GAME_BOOK['mythouse'].secrets}
    >
      <div className="mythouse-layout">
      <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg className="game-board-svg" viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}>

        {/* ====== CELESTIAL FRAME ====== */}

        {/* Zodiac ring band */}
        <circle cx={CENTER} cy={CENTER} r={ZR_INNER} fill="none"
          stroke="rgba(201,169,97,0.18)" strokeWidth="0.7" />
        <circle cx={CENTER} cy={CENTER} r={ZR_OUTER} fill="none"
          stroke="rgba(201,169,97,0.18)" strokeWidth="0.7" />

        {/* Equinox/Solstice cross axes */}
        {[0, -90, 180, 90].map((angle, i) => {
          const inner = polar(MR_INNER, angle);
          const outer = polar(ZR_OUTER + 4, angle);
          return (
            <line key={`axis-${i}`}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="rgba(201,169,97,0.08)" strokeWidth="0.5" />
          );
        })}

        {/* Zodiac segments */}
        {ZODIAC.map((z, i) => {
          const startAngle = -(i * 30);
          const midAngle = -(i * 30 + 15);
          const active = activeZodiac.has(i);

          const d1 = polar(ZR_INNER, startAngle);
          const d2 = polar(ZR_OUTER, startAngle);
          const gp = polar(ZR_GLYPH, midAngle);
          const tp = polar(ZR_TEXT, midAngle);
          const rot = tangentRot(midAngle);

          const col = active ? 'rgba(201,169,97,0.9)' : 'rgba(201,169,97,0.28)';
          const glyphCol = active ? '#c9a961' : 'rgba(201,169,97,0.35)';

          const selected = selectedCelestial?.type === 'zodiac' && selectedCelestial?.index === i;
          const selCol = selected ? 'rgba(201,169,97,1)' : col;
          const selGlyph = selected ? '#c9a961' : glyphCol;

          return (
            <g key={`z-${i}`} className="mythouse-celestial-hit"
              onClick={() => setSelectedCelestial(prev => prev?.type === 'zodiac' && prev?.index === i ? null : { type: 'zodiac', index: i })}
              style={{ cursor: 'pointer' }}>
              <title>{z.sign}</title>
              <line x1={d1.x} y1={d1.y} x2={d2.x} y2={d2.y}
                stroke="rgba(201,169,97,0.15)" strokeWidth="0.5" />
              {(active || selected) && (
                <circle cx={gp.x} cy={gp.y} r={11}
                  fill={selected ? 'rgba(201,169,97,0.12)' : 'rgba(201,169,97,0.06)'} stroke={selected ? 'rgba(201,169,97,0.4)' : 'none'} strokeWidth={selected ? 0.6 : 0} />
              )}
              <path d={z.glyph}
                transform={`translate(${gp.x},${gp.y}) rotate(${rot}) scale(0.5)`}
                fill="none" stroke={selGlyph}
                strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <text x={tp.x} y={tp.y}
                transform={`rotate(${rot}, ${tp.x}, ${tp.y})`}
                textAnchor="middle" dominantBaseline="central"
                fontSize="7" fill={selCol}
                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.03em' }}>
                {z.sign}
              </text>
            </g>
          );
        })}

        {/* Cardinal markers */}
        {CARDINALS.map((c, i) => {
          const midR = (ZR_INNER + ZR_OUTER) / 2;
          const pt = polar(midR, c.angle);
          return (
            <polygon key={`card-${i}`}
              points={`${pt.x},${pt.y - 6} ${pt.x + 5},${pt.y} ${pt.x},${pt.y + 6} ${pt.x - 5},${pt.y}`}
              fill="rgba(201,169,97,0.2)" stroke="rgba(201,169,97,0.5)" strokeWidth="0.6" />
          );
        })}

        {/* Month ring band */}
        <circle cx={CENTER} cy={CENTER} r={MR_INNER} fill="none"
          stroke="rgba(139,195,170,0.12)" strokeWidth="0.6" />
        <circle cx={CENTER} cy={CENTER} r={MR_OUTER} fill="none"
          stroke="rgba(139,195,170,0.12)" strokeWidth="0.6" />

        {/* Month segments */}
        {MONTHS.map((m, i) => {
          const startAngle = -(i * 30) + MR_OFFSET;
          const midAngle = -(i * 30 + 15) + MR_OFFSET;
          const isCurrent = i === currentMonth;

          const d1 = polar(MR_INNER, startAngle);
          const d2 = polar(MR_OUTER, startAngle);
          const tp = polar(MR_TEXT, midAngle);
          const rot = tangentRot(midAngle);

          const col = isCurrent ? 'rgba(139,195,170,0.85)' : 'rgba(139,195,170,0.3)';

          const mSelected = selectedCelestial?.type === 'month' && selectedCelestial?.index === i;
          const mCol = mSelected ? 'rgba(139,195,170,1)' : col;

          return (
            <g key={`m-${i}`} className="mythouse-celestial-hit"
              onClick={() => setSelectedCelestial(prev => prev?.type === 'month' && prev?.index === i ? null : { type: 'month', index: i })}
              style={{ cursor: 'pointer' }}>
              <title>{m}</title>
              <line x1={d1.x} y1={d1.y} x2={d2.x} y2={d2.y}
                stroke="rgba(139,195,170,0.1)" strokeWidth="0.4" />
              <text x={tp.x} y={tp.y}
                transform={`rotate(${rot}, ${tp.x}, ${tp.y})`}
                textAnchor="middle" dominantBaseline="central"
                fontSize="6" fill={mCol}
                style={{ fontFamily: 'Cinzel, serif', fontWeight: mSelected ? 700 : 'normal' }}>
                {m}
              </text>
            </g>
          );
        })}

        {/* Bridge circle between month ring and game spiral */}
        <circle cx={CENTER} cy={CENTER} r={252} fill="none"
          stroke="rgba(201,169,97,0.06)" strokeWidth="0.4" strokeDasharray="3 4" />

        {/* ====== GAME BOARD ====== */}

        {/* Spiral path */}
        <path
          d={buildSpiralPath(CENTER, CENTER, direction)}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Spaces */}
        {Array.from({ length: RINGS }, (_, ri) => {
          const ring = ri + 1;
          return Array.from({ length: SPACES_PER_RING }, (_, pi) => {
            const { x, y } = ringPosToSVG(ring, pi, CENTER, CENTER, direction);
            return (
              <circle
                key={`sp-${ring}-${pi}`}
                cx={x} cy={y} r={4}
                fill="rgba(26,26,36,0.8)"
                stroke="var(--border-subtle)"
                strokeWidth="0.3"
              />
            );
          });
        })}

        {/* Ladders */}
        {LADDERS.map((l, i) => {
          const from = ringPosToSVG(l.fromRing, l.fromPos, CENTER, CENTER, direction);
          const to = ringPosToSVG(l.toRing, l.toPos, CENTER, CENTER, direction);
          return (
            <g key={`lad-${i}`}>
              <title>{`Ladder: R${l.fromRing} \u2192 R${l.toRing}`}</title>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="transparent" strokeWidth="6" />
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className="mythouse-ladder-line" />
            </g>
          );
        })}

        {/* Chutes */}
        {CHUTES.map((c, i) => {
          const from = ringPosToSVG(c.fromRing, c.fromPos, CENTER, CENTER, direction);
          const to = ringPosToSVG(c.toRing, c.toPos, CENTER, CENTER, direction);
          return (
            <g key={`chu-${i}`}>
              <title>{`Chute: R${c.fromRing} \u2192 R${c.toRing}`}</title>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="transparent" strokeWidth="6" />
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                className="mythouse-chute" />
            </g>
          );
        })}

        {/* Gemstones */}
        {Object.entries(gems).map(([ring, available]) => {
          if (!available) return null;
          const r = Number(ring);
          const { x, y } = ringPosToSVG(r, 0, CENTER, CENTER, direction);
          return (
            <g key={`gem-${ring}`}>
              <title>{`Gemstone (${GEMSTONE_VALUES[r]} pts)`}</title>
              <polygon
                points={`${x},${y - 6} ${x + 5},${y + 3} ${x - 5},${y + 3}`}
                className="mythouse-gem"
              />
            </g>
          );
        })}

        {/* Fallen Starlight at center */}
        {!starlightClaimed && (
          <g>
            <title>Fallen Starlight (588 pts)</title>
            <polygon
              points={`${CENTER},${CENTER - 12} ${CENTER + 4},${CENTER - 3} ${CENTER + 12},${CENTER - 3} ${CENTER + 6},${CENTER + 3} ${CENTER + 8},${CENTER + 12} ${CENTER},${CENTER + 6} ${CENTER - 8},${CENTER + 12} ${CENTER - 6},${CENTER + 3} ${CENTER - 12},${CENTER - 3} ${CENTER - 4},${CENTER - 3}`}
              className="mythouse-star"
            />
          </g>
        )}

        {/* Pieces */}
        {[0, 1].map(player =>
          pieces[player].map((piece, i) => {
            if (piece.finished) return null;
            const { x, y } = ringPosToSVG(piece.ring, piece.pos, CENTER, CENTER, direction);
            const offset = player === 0 ? -5 : 5;
            const isClickable = gamePhase === 'moving' && player === currentPlayer && legalPieceIndices.has(i);
            return (
              <g
                key={`p${player}-${i}`}
                className={`board-piece${isClickable ? ' board-piece-highlight' : ''}`}
                onClick={() => isClickable && handlePieceClick(i)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <title>{`${PIECE_TYPES[i].name} (${players[player].name})`}</title>
                <circle
                  cx={x + offset} cy={y} r={6}
                  fill={PLAYER_COLORS[player]}
                  stroke={isClickable ? 'var(--accent-ember)' : 'var(--bg-dark)'}
                  strokeWidth={isClickable ? 1.5 : 0.8}
                />
                <text
                  x={x + offset} y={y + 1}
                  textAnchor="middle" fontSize="6"
                  fill="var(--bg-dark)" pointerEvents="none"
                >
                  {PIECE_TYPES[i].symbol}
                </text>
              </g>
            );
          })
        )}

        {/* Ring labels with planet symbols */}
        {Array.from({ length: RINGS }, (_, i) => {
          const ring = i + 1;
          const { x, y } = ringPosToSVG(ring, 14, CENTER, CENTER, direction);
          return (
            <text
              key={`rl-${ring}`}
              x={x} y={y + 3}
              textAnchor="middle" fontSize="7"
              fill="var(--text-secondary)" opacity="0.6"
            >
              R{ring} {RING_SYMBOLS[i]}
            </text>
          );
        })}

        {/* Dice tier icons */}
        <g className="mythouse-dice-tiers">
          {DICE_TIERS.map((tier, i) => {
            const tx = 530 + i * 30;
            const ty = 30;
            const s = 10;
            const unlocked = highestRing >= tier.unlockRing;
            const active = activeDieSides === tier.sides;
            const fillColor = unlocked ? 'var(--accent-gold)' : 'var(--bg-medium)';
            const strokeColor = active ? 'var(--accent-ember)' : 'var(--border-subtle)';
            return (
              <g key={tier.name} opacity={unlocked ? 1 : 0.25}>
                <title>{`${tier.name.toUpperCase()} (${active ? 'active' : unlocked ? 'unlocked' : 'locked'})`}</title>
                {active && (
                  <rect x={tx - s - 3} y={ty - s - 3} width={(s + 3) * 2} height={(s + 3) * 2} rx={4}
                    fill="none" stroke="var(--accent-ember)" strokeWidth={1.5} opacity={0.5} />
                )}
                {tier.sides === 6 && (
                  <rect x={tx - s} y={ty - s} width={s * 2} height={s * 2} rx={2}
                    fill={fillColor} stroke={strokeColor} strokeWidth={0.8} />
                )}
                {tier.sides === 8 && (
                  <polygon points={`${tx},${ty - s} ${tx + s},${ty} ${tx},${ty + s} ${tx - s},${ty}`}
                    fill={fillColor} stroke={strokeColor} strokeWidth={0.8} />
                )}
                {tier.sides === 12 && (
                  <polygon points={pentagonPoints(tx, ty, s)}
                    fill={fillColor} stroke={strokeColor} strokeWidth={0.8} />
                )}
                {tier.sides === 20 && (
                  <polygon points={`${tx},${ty - s} ${tx + s},${ty + s} ${tx - s},${ty + s}`}
                    fill={fillColor} stroke={strokeColor} strokeWidth={0.8} />
                )}
                <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8"
                  fill={active ? 'var(--bg-dark)' : 'var(--text-secondary)'}
                  pointerEvents="none" fontWeight={active ? 'bold' : 'normal'}>
                  {tier.sides}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <button
        className="direction-toggle"
        onClick={() => setDirection(d => d * -1)}
        title={direction === 1 ? 'Currently clockwise \u2014 click to flip' : 'Currently counter-clockwise \u2014 click to flip'}
      >
        {direction === 1 ? '\u21BB' : '\u21BA'}
      </button>
      </div>

      <div className="mythouse-score-bar">
        {players.map((p, i) => (
          <span key={i} className="mythouse-score-item">
            <span className="mythouse-score-dot" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="mythouse-score-value" style={{ color: PLAYER_COLORS[i] }}>{scores[i]} pts</span>
          </span>
        ))}
      </div>

      {/* Celestial info panel */}
      {selectedCelestial && (
        <div className="mythouse-celestial-panel">
          {selectedCelestial.type === 'zodiac' && (() => {
            const z = ZODIAC[selectedCelestial.index];
            const info = ZODIAC_INFO[selectedCelestial.index];
            return (<>
              <div className="mythouse-celestial-header">
                <span className="mythouse-celestial-name">{z.sign}</span>
                <span className="mythouse-celestial-dates">{info.dates}</span>
                <button className="mythouse-celestial-close" onClick={() => setSelectedCelestial(null)}>&times;</button>
              </div>
              <div className="mythouse-celestial-tags">
                <span className="mythouse-celestial-tag">{info.element}</span>
                <span className="mythouse-celestial-tag">{info.planet}</span>
              </div>
              <p className="mythouse-celestial-desc">{info.desc}</p>
            </>);
          })()}
          {selectedCelestial.type === 'month' && (() => {
            const m = MONTHS[selectedCelestial.index];
            const info = MONTH_INFO[selectedCelestial.index];
            return (<>
              <div className="mythouse-celestial-header">
                <span className="mythouse-celestial-name">{m}</span>
                <button className="mythouse-celestial-close" onClick={() => setSelectedCelestial(null)}>&times;</button>
              </div>
              <p className="mythouse-celestial-desc" style={{ marginBottom: 6 }}>{info.etymology}</p>
              <p className="mythouse-celestial-desc">{info.note}</p>
            </>);
          })()}
        </div>
      )}

      {/* Ordeal overlay */}
      {ordeal && (
        <div className="mythouse-ordeal-overlay" onClick={ordeal.revealed ? handleOrdealClose : undefined}>
          <div className="mythouse-ordeal-panel">
            <h3 className="mythouse-ordeal-title">The Ordeal!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
              A duel at the gate. Each player draws a card.
            </p>
            <div className="mythouse-ordeal-cards">
              <div
                className={`mythouse-ordeal-card ${ordeal.revealed ? 'face-up' : 'face-down'}`}
                onClick={!ordeal.revealed ? handleOrdealReveal : undefined}
                style={{ cursor: !ordeal.revealed ? 'pointer' : 'default' }}
              >
                {ordeal.revealed ? (
                  <>
                    <span className="mythouse-ordeal-card-deck">{ordeal.cards[0].deckLabel}</span>
                    <span className="mythouse-ordeal-card-name">{ordeal.cards[0].name}</span>
                    <span className="mythouse-ordeal-card-power">{ordeal.cards[0].power}</span>
                  </>
                ) : '?'}
              </div>
              <div className={`mythouse-ordeal-card ${ordeal.revealed ? 'face-up' : 'face-down'}`}>
                {ordeal.revealed ? (
                  <>
                    <span className="mythouse-ordeal-card-deck">{ordeal.cards[1].deckLabel}</span>
                    <span className="mythouse-ordeal-card-name">{ordeal.cards[1].name}</span>
                    <span className="mythouse-ordeal-card-power">{ordeal.cards[1].power}</span>
                  </>
                ) : '?'}
              </div>
            </div>
            {ordeal.revealed && (
              <p style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                {ordeal.cards[0].power >= ordeal.cards[1].power
                  ? 'You win the ordeal!'
                  : 'You lose the ordeal...'}
                <br />
                <small style={{ color: 'var(--text-secondary)' }}>Click to continue</small>
              </p>
            )}
            {!ordeal.revealed && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Click a card to reveal</p>
            )}
          </div>
        </div>
      )}
      </div>
    </GameShell>
  );
}
