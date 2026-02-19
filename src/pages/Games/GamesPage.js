import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SnakesAndLaddersGame from '../../games/snakesAndLadders/SnakesAndLaddersGame';
import RoyalGameOfUrGame from '../../games/royalGameOfUr/RoyalGameOfUrGame';
import SenetGame from '../../games/senet/SenetGame';
import JackalsAndHoundsGame from '../../games/jackalsAndHounds/JackalsAndHoundsGame';
import MehenGame from '../../games/mehen/MehenGame';
import PachisiGame from '../../games/pachisi/PachisiGame';
import MythouseGame from '../../games/mythouse/MythouseGame';
import MythouseCards from '../../games/mythouse/MythouseCards';
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
  },
  {
    id: 'monomyth-journey',
    label: 'Monomyth Journey',
    description: 'Walk the eight stages of the Hero\'s Journey with Atlas as your guide.',
    externalPath: '/monomyth?journey=true',
  },
  {
    id: 'meteor-steel-journey',
    label: 'Meteor Steel Journey',
    description: 'Walk the eight stages of the Meteor Steel process with Atlas as your guide.',
    externalPath: '/?journey=true',
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

  // Parse URL: /games/:gameId/:mode
  const parts = splat ? splat.split('/').filter(Boolean) : [];
  const gameId = parts[0] || null;
  const mode = parts[1] || null;

  const activeGame = gameId ? GAMES.find(g => g.id === gameId) : null;

  const handleExit = () => {
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

  // Playing a game
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

      <h2 className="games-section-title">Yellow Brick Roads</h2>
      <div className="games-grid">
        {YELLOW_BRICK_ROADS.map(game => (
          <Link
            key={game.id}
            className="game-card featured"
            to={game.externalPath}
          >
            <span className="game-card-title">{game.label}</span>
            <span className="game-card-desc">{game.description}</span>
          </Link>
        ))}
      </div>

      <h2 className="games-section-title">Board Games</h2>
      <div className="games-grid">
        {GAMES.map(game => (
          <Link
            key={game.id}
            className={`game-card${game.featured ? ' featured' : ''}`}
            to={game.externalPath || `/games/${game.id}`}
          >
            <span className="game-card-title">{game.label}</span>
            <span className="game-card-origin">{game.origin}</span>
            <span className="game-card-desc">{game.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
