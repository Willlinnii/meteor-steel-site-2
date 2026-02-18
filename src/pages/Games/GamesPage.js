import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SnakesAndLaddersGame from '../../games/snakesAndLadders/SnakesAndLaddersGame';
import RoyalGameOfUrGame from '../../games/royalGameOfUr/RoyalGameOfUrGame';
import SenetGame from '../../games/senet/SenetGame';
import JackalsAndHoundsGame from '../../games/jackalsAndHounds/JackalsAndHoundsGame';
import MehenGame from '../../games/mehen/MehenGame';
import PachisiGame from '../../games/pachisi/PachisiGame';
import MythouseGame from '../../games/mythouse/MythouseGame';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);

  useEffect(() => {
    const gameParam = searchParams.get('game');
    const modeParam = searchParams.get('mode');
    if (gameParam) {
      const game = GAMES.find(g => g.id === gameParam);
      if (game) {
        setActiveGame(game);
        if (modeParam === 'ai' || modeParam === 'local') setGameMode(modeParam);
      }
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameClick = (game) => {
    if (activeGame?.id === game.id && !gameMode) {
      setActiveGame(null);
    } else {
      setActiveGame(game);
      setGameMode(null);
    }
  };

  const handleExit = () => {
    setActiveGame(null);
    setGameMode(null);
  };

  if (activeGame && gameMode) {
    const GameComponent = GAME_COMPONENTS[activeGame.id];
    if (GameComponent) {
      return (
        <div className="games-page">
          <GameComponent mode={gameMode} onExit={handleExit} />
        </div>
      );
    }
  }

  return (
    <div className="games-page">
      {activeGame && !gameMode ? (
        <div className="game-mode-selector">
          <button className="game-mode-back" onClick={() => setActiveGame(null)}>
            &#8592; All Games
          </button>
          <h2 className="game-mode-heading">{activeGame.label}</h2>
          <p className="game-mode-origin">{activeGame.origin}</p>
          <p className="game-mode-desc">{activeGame.description}</p>
          <div className="game-mode-buttons">
            <button className="game-mode-btn" onClick={() => setGameMode('ai')}>
              <span className="game-mode-label">vs Atlas</span>
              <span className="game-mode-sublabel">Play against Atlas</span>
            </button>
            <button className="game-mode-btn" onClick={() => setGameMode('local')}>
              <span className="game-mode-label">Two Players</span>
              <span className="game-mode-sublabel">Hot-seat on this device</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="games-page-title">Mythouse Games</h1>
          <p className="games-page-subtitle">
            Ancient board games brought to life. Choose a game to begin.
          </p>
          <div className="games-grid">
            {GAMES.map(game => (
              <button
                key={game.id}
                className={`game-card${activeGame?.id === game.id ? ' active' : ''}${game.featured ? ' featured' : ''}`}
                onClick={() => handleGameClick(game)}
              >
                <span className="game-card-title">{game.label}</span>
                <span className="game-card-origin">{game.origin}</span>
                <span className="game-card-desc">{game.description}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
