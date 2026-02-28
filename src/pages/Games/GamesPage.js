import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useMultiplayer } from '../../multiplayer/MultiplayerContext';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import SnakesAndLaddersGame from '../../games/snakesAndLadders/SnakesAndLaddersGame';
import RoyalGameOfUrGame from '../../games/royalGameOfUr/RoyalGameOfUrGame';
import SenetGame from '../../games/senet/SenetGame';
import JackalsAndHoundsGame from '../../games/jackalsAndHounds/JackalsAndHoundsGame';
import MehenGame from '../../games/mehen/MehenGame';
import PachisiGame from '../../games/pachisi/PachisiGame';
import MythouseGame from '../../games/mythouse/MythouseGame';
import MythouseCards from '../../games/mythouse/MythouseCards';
import GameLobby from '../../games/shared/GameLobby';
import MultiplayerWrapper from '../../games/shared/MultiplayerWrapper';
import ShareCompletionModal from '../../components/fellowship/ShareCompletionModal';
import './GamesPage.css';

const GAMES = [
  {
    id: 'senet',
    label: 'Senet',
    origin: 'Egypt, c. 3100 BCE',
    description: 'Navigate 30 squares with stick dice. Strategy meets fate.',
  },
  {
    id: 'mehen',
    label: 'Mehen',
    origin: 'Egypt, c. 3000 BCE',
    description: 'Race along the coils of a serpent to the center and back.',
  },
  {
    id: 'royal-game-of-ur',
    label: 'Royal Game of Ur',
    origin: 'Mesopotamia, c. 2600 BCE',
    description: 'Race 7 pieces through a shared gauntlet. Rosettes grant sanctuary.',
  },
  {
    id: 'jackals-and-hounds',
    label: 'Jackals & Hounds',
    origin: 'Egypt, c. 2000 BCE',
    description: 'Parallel paths with hidden shortcuts. First to finish wins.',
  },
  {
    id: 'pachisi',
    label: 'Pachisi',
    origin: 'India, ancient',
    description: 'Cross-shaped board with cowrie shell dice. Castle squares grant safety.',
  },
  {
    id: 'snakes-and-ladders',
    label: 'Snakes & Ladders',
    origin: 'India (Moksha Patam), c. 1000 CE',
    description: 'A race of virtue and vice on a 10\u00D710 grid. Pure luck.',
  },
];

const MYTHOUSE_ORIGINALS = [
  {
    id: 'mythouse',
    label: 'Mythouse Game',
    origin: 'Board Game',
    description: 'Ascend 7 rings of a spiral mountain. Collect gems, face ordeals.',
    featured: true,
  },
];

const YELLOW_BRICK_ROADS = [
  {
    id: 'yellow-brick-road',
    label: 'Cosmic Journey',
    description: 'Ascend through the planetary spheres, traverse the zodiac, and descend carrying what you\'ve gathered. 26 encounters. 3 levels each.',
    externalPath: '/chronosphaera/yellow-brick-road',
    ouroborosPath: '/journey/cosmic',
  },
  {
    id: 'planetary-journey',
    label: 'Planetary Journey',
    description: 'Ascend through the seven classical spheres — Moon to Saturn. 7 encounters. 3 levels each.',
    externalPath: '/chronosphaera/yellow-brick-road',
    ouroborosPath: '/journey/planetary',
  },
  {
    id: 'zodiac-journey',
    label: 'Zodiac Journey',
    description: 'Walk the wheel of the twelve zodiac signs from Aries to Pisces. 12 encounters. 3 levels each.',
    externalPath: '/chronosphaera/yellow-brick-road',
    ouroborosPath: '/journey/zodiac',
  },
  {
    id: 'monomyth-journey',
    label: 'Monomyth Journey',
    description: 'Walk the eight stages of the Hero\'s Journey with Atlas as your guide.',
    externalPath: '/monomyth?journey=true',
    ouroborosPath: '/journey/monomyth',
  },
  {
    id: 'meteor-steel-journey',
    label: 'Meteor Steel Journey',
    description: 'Walk the eight stages of the Meteor Steel process with Atlas as your guide.',
    externalPath: '/?journey=true',
    ouroborosPath: '/journey/meteor-steel',
  },
  {
    id: 'fused-journey',
    label: 'Fused Journey',
    description: 'Walk monomyth and meteor steel fused into one wheel. Two questions per stage.',
    ouroborosPath: '/journey/fused',
  },
];

const XR_EXPERIENCES = [
  {
    id: 'celestial-3d',
    label: 'Celestial Wheels 3D',
    description: 'Step inside the planetary spheres. Orbit the Sun, stand at the center, or see live positions. VR headset and phone AR support.',
    path: '/chronosphaera/vr',
    features: 'VR · Phone AR · Fullscreen',
  },
  {
    id: 'mythic-earth-xr',
    label: 'Mythic Earth Globe',
    description: 'Sacred sites, mythic locations, and literary landmarks on an interactive 3D globe. In AR the earth floats over your camera feed.',
    path: '/mythic-earth',
    features: 'Phone AR · Gyroscope · Fullscreen',
  },
  {
    id: 'sacred-sites-360',
    label: 'Sacred Sites 360',
    description: 'Browse the world\'s sacred sites in immersive 360 Street View panoramas. Pick a site and look around from ground level.',
    path: '/sacred-sites-360',
    features: '360 Panorama · Street View',
  },
  {
    id: 'crown-3d',
    label: 'Crown & Ring 3D',
    description: 'Design a ring, bracelet, or crown with planetary metals and birthstones in an interactive 3D scene. Heliocentric, geocentric, and navaratna layouts.',
    path: '/ring',
    features: '3D · Orbit Controls · Fullscreen',
  },
  {
    id: 'dodecahedron-3d',
    label: 'Dodecahedron',
    description: 'Rotate a 3D Roman dodecahedron. Three modes: constellation map (Lantern of Phanes), Roman coin density calculator, and d12 die roller.',
    path: '/dodecahedron',
    features: '3D · Orbit Controls · Physics',
  },
  {
    id: 'art-book-3d',
    label: 'Fallen Starlight 3D',
    description: 'Explore a 3D mountain with seven levels of gemstones and ores mapped to the Fallen Starlight narrative. Book and mountain camera modes.',
    path: '/art-book',
    features: '3D · Dual Camera · Audio',
  },
  {
    id: 'microcosmos-3d',
    label: 'Microcosmos',
    description: 'An interactive 3D anatomical body explorer. Toggle body systems, select organs, and view planetary correspondences across traditions.',
    path: '/microcosmos',
    features: '3D · Orbit Controls · 2D Toggle',
  },
];

const CARD_DECKS = [
  { id: 'cards-world', label: 'World of Tarot', count: '670 cards', featured: true },
  { id: 'cards-tarot', label: 'Tarot', count: '78 cards', initialSection: 'arcana', initialCulture: 'tarot' },
  { id: 'cards-playing', label: 'Playing Cards', count: '52 cards', initialSection: 'playing', initialCulture: null },
  { id: 'cards-roman', label: 'Roman', count: '78 cards', initialSection: 'arcana', initialCulture: 'roman' },
  { id: 'cards-greek', label: 'Greek', count: '78 cards', initialSection: 'arcana', initialCulture: 'greek' },
  { id: 'cards-norse', label: 'Norse', count: '78 cards', initialSection: 'arcana', initialCulture: 'norse' },
  { id: 'cards-babylonian', label: 'Babylonian', count: '78 cards', initialSection: 'arcana', initialCulture: 'babylonian' },
  { id: 'cards-vedic', label: 'Vedic', count: '78 cards', initialSection: 'arcana', initialCulture: 'vedic' },
  { id: 'cards-islamic', label: 'Islamic', count: '78 cards', initialSection: 'arcana', initialCulture: 'islamic' },
  { id: 'cards-christian', label: 'Medieval Christianity', count: '78 cards', initialSection: 'arcana', initialCulture: 'christian' },
];

const GAME_COMPONENTS = {
  'snakes-and-ladders': SnakesAndLaddersGame,
  'senet': SenetGame,
  'royal-game-of-ur': RoyalGameOfUrGame,
  'mehen': MehenGame,
  'jackals-and-hounds': JackalsAndHoundsGame,
  'pachisi': PachisiGame,
  'mythouse': MythouseGame,
};

export default function GamesPage() {
  const { '*': splat } = useParams();
  const navigate = useNavigate();
  const { trackElement, isElementCompleted, courseworkMode } = useCoursework();
  const { user } = useAuth();
  const { activeMatches, getMatchesForGame } = useMultiplayer(); // eslint-disable-line no-unused-vars
  const { hasSubscription } = useProfile();
  const [showYbrGate, setShowYbrGate] = useState(false);
  const [completedGame, setCompletedGame] = useState(null);
  const hasYBR = hasSubscription('ybr');

  // Parse URL: /games/:gameId/:mode or /games/:gameId/online/:matchId
  const parts = splat ? splat.split('/').filter(Boolean) : [];
  const gameId = parts[0] || null;
  const mode = parts[1] || null;
  const matchId = mode === 'online' ? (parts[2] || null) : null;

  const activeGame = gameId ? (GAMES.find(g => g.id === gameId) || MYTHOUSE_ORIGINALS.find(g => g.id === gameId)) : null;
  const activeCardDeck = gameId ? CARD_DECKS.find(d => d.id === gameId) : null;

  // Track page visit
  useEffect(() => {
    trackElement('games.page.visited');
  }, [trackElement]);

  // Track game start when mode is selected
  useEffect(() => {
    if (activeGame && mode) {
      trackElement(`games.${activeGame.id}.started`);
    }
  }, [activeGame, mode, trackElement]);

  const handleExit = (result) => {
    // Track game completion if the game was actually finished (not just backed out)
    if (activeGame && result === 'completed') {
      trackElement(`games.${activeGame.id}.completed`);
      setCompletedGame({ id: activeGame.id, name: activeGame.label || activeGame.id });
      return;
    }
    navigate('/games');
  };

  // Game completion share modal — check before rendering game components
  if (completedGame) {
    return (
      <div className="games-page">
        <ShareCompletionModal
          completionType="game"
          completionId={completedGame.id}
          completionLabel={completedGame.name}
          completionData={{ gameId: completedGame.id, gameName: completedGame.name }}
          onClose={() => { setCompletedGame(null); navigate('/games'); }}
          onPosted={() => { setCompletedGame(null); navigate('/games'); }}
        />
      </div>
    );
  }

  // Card deck entries (direct-launch with initial state)
  if (activeCardDeck) {
    return (
      <div className="games-page">
        <MythouseCards
          onExit={handleExit}
          initialSection={activeCardDeck.initialSection}
          initialCulture={activeCardDeck.initialCulture}
        />
      </div>
    );
  }

  // Online multiplayer — lobby or active match
  if (activeGame && mode === 'online') {
    const GameComponent = GAME_COMPONENTS[activeGame.id];
    if (GameComponent && matchId) {
      // Active match
      return (
        <div className="games-page">
          <MultiplayerWrapper
            gameId={activeGame.id}
            matchId={matchId}
            GameComponent={GameComponent}
            onExit={handleExit}
          />
        </div>
      );
    }
    // Lobby
    return (
      <div className="games-page">
        <GameLobby
          gameId={activeGame.id}
          gameName={activeGame.label}
          onExit={() => navigate(`/games/${activeGame.id}`)}
        />
      </div>
    );
  }

  // Playing a game (ai or local)
  if (activeGame && mode) {
    const GameComponent = GAME_COMPONENTS[activeGame.id];
    if (GameComponent && (mode === 'ai' || mode === 'local')) {
      return (
        <div className="games-page">
          <GameComponent mode={mode} onExit={handleExit} />
        </div>
      );
    }
  }

  // Mode selector for a specific game
  if (activeGame && !mode) {
    return (
      <div className="games-page">
        <div className="game-mode-selector">
          <Link className="game-mode-back" to="/games">
            &#8592; All Games
          </Link>
          <h2 className="game-mode-heading">{activeGame.label}</h2>
          <p className="game-mode-origin">{activeGame.origin}</p>
          <p className="game-mode-desc">{activeGame.description}</p>
          <div className="game-mode-buttons">
            <Link className="game-mode-btn" to={`/games/${activeGame.id}/ai`}>
              <span className="game-mode-label">vs Atlas</span>
              <span className="game-mode-sublabel">Play against Atlas</span>
            </Link>
            <Link className="game-mode-btn" to={`/games/${activeGame.id}/local`}>
              <span className="game-mode-label">Two Players</span>
              <span className="game-mode-sublabel">Hot-seat on this device</span>
            </Link>
            <Link className="game-mode-btn game-mode-btn-online" to={`/games/${activeGame.id}/online`}>
              <span className="game-mode-label">Online</span>
              <span className="game-mode-sublabel">Challenge a friend</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // All games grid
  return (
    <div className="games-page">
      <h1 className="games-page-title">Mythouse Games</h1>
      <p className="games-page-subtitle">
        Ancient board games brought to life. Choose a game to begin.
      </p>

      {/* My Matches section */}
      {activeMatches.length > 0 && (
        <>
          <h2 className="games-section-title">My Matches</h2>
          <div className="games-my-matches">
            {activeMatches.map(match => {
              const gameInfo = GAMES.find(g => g.id === match.gameType) || MYTHOUSE_ORIGINALS.find(g => g.id === match.gameType);
              const opponentIdx = match.players?.[0]?.uid === user?.uid ? 1 : 0;
              const opponent = match.players?.[opponentIdx];
              const myTurn = match.players?.[match.currentPlayer]?.uid === user?.uid;
              return (
                <button
                  key={match.id}
                  className={`games-match-card${myTurn ? ' my-turn' : ''}`}
                  onClick={() => navigate(`/games/${match.gameType}/online/${match.id}`)}
                >
                  <span className="games-match-game">{gameInfo?.label || match.gameType}</span>
                  <span className="games-match-vs">vs @{opponent?.handle || 'opponent'}</span>
                  <span className="games-match-turn">{match.status === 'waiting' ? 'Waiting...' : myTurn ? 'Your turn' : 'Their turn'}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <h2 className="games-section-title">Mythouse Originals</h2>
      <div className="games-grid">
        {MYTHOUSE_ORIGINALS.map(game => {
          const gameMatches = getMatchesForGame(game.id);
          const hasActiveMatch = gameMatches.length > 0;
          return (
            <Link
              key={game.id}
              className={`game-card${game.featured ? ' featured' : ''}${hasActiveMatch ? ' has-match' : ''}${courseworkMode ? (isElementCompleted(`games.${game.id}.clicked`) ? ' cw-completed' : ' cw-incomplete') : ''}`}
              to={`/games/${game.id}`}
              onClick={() => trackElement(`games.${game.id}.clicked`)}
            >
              <span className="game-card-title">{game.label}</span>
              <span className="game-card-origin">{game.origin}</span>
              <span className="game-card-desc">{game.description}</span>
              {hasActiveMatch && (
                <span className="game-card-match-badge">{gameMatches.length} active</span>
              )}
            </Link>
          );
        })}
      </div>

      <h2 className="games-section-title">Board Games</h2>
      <div className="games-grid">
        {GAMES.map(game => {
          const gameMatches = getMatchesForGame(game.id);
          const hasActiveMatch = gameMatches.length > 0;
          return (
            <Link
              key={game.id}
              className={`game-card${game.featured ? ' featured' : ''}${hasActiveMatch ? ' has-match' : ''}${courseworkMode ? (isElementCompleted(`games.${game.id}.clicked`) ? ' cw-completed' : ' cw-incomplete') : ''}`}
              to={game.externalPath || `/games/${game.id}`}
              onClick={() => trackElement(`games.${game.id}.clicked`)}
            >
              <span className="game-card-title">{game.label}</span>
              <span className="game-card-origin">{game.origin}</span>
              <span className="game-card-desc">{game.description}</span>
              {hasActiveMatch && (
                <span className="game-card-match-badge">{gameMatches.length} active</span>
              )}
            </Link>
          );
        })}
      </div>

      <h2 className="games-section-title">Cards</h2>
      <div className="games-grid">
        {CARD_DECKS.map(deck => (
          <Link
            key={deck.id}
            className={`game-card${deck.featured ? ' featured' : ''}`}
            to={`/games/${deck.id}`}
          >
            <span className="game-card-title">{deck.label}</span>
            <span className="game-card-origin">{deck.count}</span>
            <span className="game-card-desc">
              {deck.featured
                ? 'Browse all 52 playing cards and 8 full tarot decks across 7 cultures.'
                : deck.initialSection === 'playing'
                  ? 'The standard 52-card deck with all four suits.'
                  : '78-card deck — 22 major and 56 minor arcana.'}
            </span>
          </Link>
        ))}
      </div>

      <h2 className="games-section-title">Yellow Brick Roads</h2>
      <div className="games-grid">
        {YELLOW_BRICK_ROADS.map(game => (
          <div key={game.id} className={`game-card featured${!hasYBR ? ' game-card-locked' : ''}`}>
            {hasYBR ? (
              <Link className="game-card-link" to={game.externalPath}>
                <span className="game-card-title">{game.label}</span>
                <span className="game-card-desc">{game.description}</span>
              </Link>
            ) : (
              <div className="game-card-link" onClick={() => setShowYbrGate(true)} style={{ cursor: 'pointer' }}>
                <span className="game-card-title">{game.label}</span>
                <span className="game-card-desc">{game.description}</span>
              </div>
            )}
            {game.ouroborosPath && (
              hasYBR ? (
                <a
                  className="game-card-ouroboros"
                  href={game.ouroborosPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  Ouroboros
                </a>
              ) : (
                <span
                  className="game-card-ouroboros"
                  onClick={e => { e.stopPropagation(); setShowYbrGate(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  Ouroboros
                </span>
              )
            )}
          </div>
        ))}
      </div>

      <h2 className="games-section-title">VR / XR Experiences</h2>
      <div className="games-grid">
        {XR_EXPERIENCES.map(exp => (
          <Link key={exp.id} className="game-card featured" to={exp.path}>
            <span className="game-card-title">{exp.label}</span>
            <span className="game-card-origin">{exp.features}</span>
            <span className="game-card-desc">{exp.description}</span>
          </Link>
        ))}
      </div>

      {showYbrGate && (
        <div className="subscription-gate-overlay" onClick={() => setShowYbrGate(false)}>
          <div className="subscription-gate-popup" onClick={e => e.stopPropagation()}>
            <h3 className="subscription-gate-title">Yellow Brick Road</h3>
            <p className="subscription-gate-desc">The Yellow Brick Road is a guided, stage-by-stage journey through the monomyth. Enable the subscription in your profile to walk the path with Atlas.</p>
            <div className="subscription-gate-actions">
              <button className="subscription-gate-primary" onClick={() => { navigate('/profile#subscriptions'); setShowYbrGate(false); }}>
                Manage Membership
              </button>
              <button className="subscription-gate-secondary" onClick={() => setShowYbrGate(false)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
