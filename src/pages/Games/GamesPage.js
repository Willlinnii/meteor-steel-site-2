import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useMultiplayer } from '../../multiplayer/MultiplayerContext';
import { useAuth } from '../../auth/AuthContext';
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
import './GamesPage.css';

const GAMES = [
  {
    id: 'snakes-and-ladders',
    label: 'Snakes & Ladders',
    origin: 'India (Moksha Patam)',
    description: 'A race of virtue and vice on a 10\u00D710 grid. Pure luck.',
  },
  {
    id: 'senet',
    label: 'Senet',
    origin: 'Ancient Egypt',
    description: 'Navigate 30 squares with stick dice. Strategy meets fate.',
  },
  {
    id: 'royal-game-of-ur',
    label: 'Royal Game of Ur',
    origin: 'Mesopotamia',
    description: 'Race 7 pieces through a shared gauntlet. Rosettes grant sanctuary.',
  },
  {
    id: 'mehen',
    label: 'Mehen',
    origin: 'Ancient Egypt',
    description: 'Race along the coils of a serpent to the center and back.',
  },
  {
    id: 'jackals-and-hounds',
    label: 'Jackals & Hounds',
    origin: 'Ancient Egypt',
    description: 'Parallel paths with hidden shortcuts. First to finish wins.',
  },
  {
    id: 'pachisi',
    label: 'Pachisi',
    origin: 'India',
    description: 'Cross-shaped board with cowrie shell dice. Castle squares grant safety.',
  },
  {
    id: 'mythouse',
    label: 'Mythouse Game',
    origin: 'Mythouse Original',
    description: 'Ascend 7 rings of a spiral mountain. Collect gems, face ordeals.',
    featured: true,
  },
  {
    id: 'mythic-cards',
    label: 'Mythic Cards',
    origin: 'Mythouse Original',
    description: 'Browse 52 playing cards and 8 full tarot decks (78 cards each) across 7 cultures.',
    direct: true,
  },
];

const YELLOW_BRICK_ROADS = [
  {
    id: 'yellow-brick-road',
    label: 'Cosmic Journey',
    description: 'Ascend through the planetary spheres, traverse the zodiac, and descend carrying what you\'ve gathered. 26 encounters. 3 levels each.',
    externalPath: '/metals/yellow-brick-road',
    ouroborosPath: '/journey/cosmic',
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

  // Parse URL: /games/:gameId/:mode or /games/:gameId/online/:matchId
  const parts = splat ? splat.split('/').filter(Boolean) : [];
  const gameId = parts[0] || null;
  const mode = parts[1] || null;
  const matchId = mode === 'online' ? (parts[2] || null) : null;

  const activeGame = gameId ? GAMES.find(g => g.id === gameId) : null;

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
    }
    navigate('/games');
  };

  // Direct-launch entries (no mode selector)
  if (activeGame && activeGame.id === 'mythic-cards') {
    return (
      <div className="games-page">
        <MythouseCards onExit={handleExit} />
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
              const gameInfo = GAMES.find(g => g.id === match.gameType);
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

      <h2 className="games-section-title">Yellow Brick Roads</h2>
      <div className="games-grid">
        {YELLOW_BRICK_ROADS.map(game => (
          <div key={game.id} className="game-card featured">
            <Link className="game-card-link" to={game.externalPath}>
              <span className="game-card-title">{game.label}</span>
              <span className="game-card-desc">{game.description}</span>
            </Link>
            {game.ouroborosPath && (
              <a
                className="game-card-ouroboros"
                href={game.ouroborosPath}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                Ouroboros
              </a>
            )}
          </div>
        ))}
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
    </div>
  );
}
