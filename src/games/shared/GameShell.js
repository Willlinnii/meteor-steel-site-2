import React, { useState, useEffect, useRef } from 'react';

export default function GameShell({
  gameName,
  players,
  currentPlayer,
  diceResult,
  gamePhase,
  winner,
  turnCount,
  onRoll,
  onRestart,
  onReset,
  onExit,
  diceDisplay,
  children,
  extraInfo,
  message,
  playerNames,
  moveLog,
  rules,
  secrets,
}) {
  const logRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null); // 'rules' | 'secrets' | null

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [moveLog]);

  const restartFn = onRestart || onReset;
  const isRolling = gamePhase === 'rolling' && winner === null && winner !== 0;
  const hasPlayers = players && players.length > 0;
  const hasControls = onRoll || diceDisplay || extraInfo;

  // Determine winner display name
  let winnerName = null;
  if (winner !== null && winner !== undefined) {
    if (typeof winner === 'string') {
      winnerName = winner;
    } else if (hasPlayers && players[winner]) {
      winnerName = players[winner].name;
    } else if (playerNames && playerNames[winner]) {
      winnerName = playerNames[winner];
    }
  }

  const togglePanel = (panel) => {
    setOpenPanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="game-shell">
      <div className="game-shell-header">
        <button className="game-shell-back" onClick={onExit} title="Back to games">
          &#8592; Games
        </button>
        <h2 className="game-shell-title">{gameName}</h2>
        {turnCount !== undefined && (
          <div className="game-shell-turn">Turn {(turnCount || 0) + 1}</div>
        )}
      </div>

      {hasPlayers && (
        <div className="game-shell-players">
          {players.map((p, i) => (
            <div
              key={i}
              className={`game-shell-player${currentPlayer === i ? ' active' : ''}${winner === i ? ' winner' : ''}`}
            >
              <span className="player-dot" style={{ background: p.color }} />
              <span className="player-name">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="game-shell-board">
        {children}
      </div>

      {hasControls && (
        <div className="game-shell-controls">
          {diceDisplay && (
            <div className="game-shell-dice-area">
              {diceDisplay}
            </div>
          )}
          {(extraInfo || message) && (
            <div className="game-shell-extra">{extraInfo || message}</div>
          )}
          <div className="game-shell-buttons">
            {onRoll && (
              <button
                className="game-btn game-btn-roll"
                onClick={onRoll}
                disabled={!isRolling}
              >
                Roll Dice
              </button>
            )}
            {restartFn && (
              <button className="game-btn game-btn-restart" onClick={restartFn}>
                Restart
              </button>
            )}
          </div>
        </div>
      )}

      {moveLog && moveLog.length > 0 && (
        <div className="game-move-log" ref={logRef}>
          {moveLog.map((entry, i) => (
            <div key={i} className="game-move-log-entry">{entry}</div>
          ))}
        </div>
      )}

      {(rules || secrets) && (
        <div className="game-book-section">
          <div className="game-book-toggles">
            {rules && (
              <button
                className={`game-book-toggle${openPanel === 'rules' ? ' active' : ''}`}
                onClick={() => togglePanel('rules')}
              >
                Rules
              </button>
            )}
            {secrets && (
              <button
                className={`game-book-toggle game-book-toggle-secrets${openPanel === 'secrets' ? ' active' : ''}`}
                onClick={() => togglePanel('secrets')}
              >
                Secrets
              </button>
            )}
          </div>

          {openPanel === 'rules' && rules && (
            <div className="game-book-panel">
              <ul className="game-book-rules">
                {rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {openPanel === 'secrets' && secrets && (
            <div className="game-book-panel game-book-panel-secrets">
              {secrets.map((secret, i) => (
                <div key={i} className="game-book-secret">
                  <h4 className="game-book-secret-heading">{secret.heading}</h4>
                  <p className="game-book-secret-text">{secret.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {winnerName && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            <h3 className="game-over-title">
              {winnerName} Wins!
            </h3>
            <div className="game-over-buttons">
              <button className="game-btn game-btn-roll" onClick={restartFn}>
                Play Again
              </button>
              <button className="game-btn game-btn-restart" onClick={() => onExit && onExit('completed')}>
                Back to Games
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
