import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  instruction,
  playerStatus,
  // Multiplayer props
  chatPanel,
  onForfeit,
  onPlayerClick,
  isOnline,
  isMyTurn,
}) {
  const logRef = useRef(null);
  const shellRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [moveLog]);

  useEffect(() => {
    const onFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && shellRef.current) {
      shellRef.current.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const restartFn = onRestart || onReset;
  const hasPlayers = players && players.length > 0;

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

  const getInstruction = () => {
    if (instruction) return instruction;

    if (winnerName) {
      return `${winnerName} has won the game! Press Restart for a rematch, or use the back arrow to return to the game room.`;
    }
    if (isOnline && !isMyTurn) {
      return "It\u2019s your opponent\u2019s turn. Watch the board and wait for them to finish their move.";
    }

    const lines = [];
    const pName = playerNames?.[currentPlayer] || (hasPlayers && players[currentPlayer]?.name);
    if (pName && turnCount !== undefined) {
      lines.push(`Turn ${(turnCount || 0) + 1} \u2014 ${pName}'s move.`);
    }

    if (onRoll) {
      lines.push('Click the dice area to roll and determine your next move.');
    } else if (gamePhase === 'selectPiece' || gamePhase === 'moving' || gamePhase === 'move') {
      lines.push('Choose which piece to move. Highlighted pieces or squares show your valid options.');
    }

    const msg = extraInfo || message;
    if (msg) lines.push(msg);

    return lines.join(' ') || 'Take your turn.';
  };

  // Generate default player readout from players prop
  const getDefaultPlayerStatus = () => {
    if (!hasPlayers) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        {players.map((p, i) => (
          <div key={i} style={{ textAlign: 'center', opacity: currentPlayer === i ? 1 : 0.6 }}>
            <span className="player-dot" style={{ background: p.color, width: 10, height: 10, display: 'inline-block', borderRadius: '50%', marginRight: 6 }} />
            <span style={{ color: p.color, fontWeight: currentPlayer === i ? 'bold' : 'normal', fontSize: '0.85rem' }}>{p.name}</span>
            {currentPlayer === i && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: 6 }}>(active)</span>}
          </div>
        ))}
      </div>
    );
  };

  const togglePanel = (panel) => {
    setOpenPanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className={`game-shell${isFullscreen ? ' game-shell-fullscreen' : ''}`} ref={shellRef}>
      {/* Compact header bar */}
      <div className="game-shell-header">
        <button className="game-shell-back" onClick={onExit} title="Back to games">
          &#8592;
        </button>
        <h2 className="game-shell-title">{gameName}</h2>
        {turnCount !== undefined && (
          <div className="game-shell-turn">Turn {(turnCount || 0) + 1}</div>
        )}
      </div>

      {/* Board */}
      <div className="game-shell-board">
        {children}
      </div>

      {/* Dice area — clickable to roll */}
      <div
        className={`game-shell-dice-bar${onRoll ? ' roll-ready' : ''}`}
        onClick={onRoll || undefined}
        role={onRoll ? 'button' : undefined}
        tabIndex={onRoll ? 0 : undefined}
      >
        {diceDisplay || (
          <div className="game-shell-dice-placeholder">
            {onRoll
              ? (isOnline && !isMyTurn ? 'Waiting\u2026' : 'Roll')
              : (message || extraInfo || '\u00A0')}
          </div>
        )}
        {onRoll && diceDisplay && (
          <div className="game-shell-roll-hint">tap to roll</div>
        )}
      </div>

      {moveLog && moveLog.length > 0 && (
        <div className="game-move-log" ref={logRef}>
          {moveLog.map((entry, i) => (
            <div key={i} className="game-move-log-entry">{entry}</div>
          ))}
        </div>
      )}

      {chatPanel}

      {/* Four toggle buttons: Instructions, Players, Rules, Secrets */}
      <div className="game-book-section">
        <div className="game-book-toggles">
          <button
            className={`game-book-toggle game-book-toggle-instructions${openPanel === 'instructions' ? ' active' : ''}`}
            onClick={() => togglePanel('instructions')}
          >
            Instructions
          </button>
          <button
            className={`game-book-toggle game-book-toggle-players${openPanel === 'players' ? ' active' : ''}`}
            onClick={() => togglePanel('players')}
          >
            Players
          </button>
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

        {openPanel === 'instructions' && (
          <div className="game-book-panel game-book-panel-instructions">
            <p className="game-book-instruction-text">{getInstruction()}</p>
          </div>
        )}

        {openPanel === 'players' && (
          <div className="game-book-panel game-book-panel-players">
            {playerStatus || getDefaultPlayerStatus() || (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>No player information available.</p>
            )}
          </div>
        )}

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

        {/* Restart / Forfeit below panel */}
        <div className="game-shell-bottom-actions">
          {restartFn && (
            <button className="game-btn game-btn-restart" onClick={restartFn}>
              Restart
            </button>
          )}
          {onForfeit && !winnerName && (
            <button className="game-btn game-btn-forfeit" onClick={onForfeit}>
              Forfeit
            </button>
          )}
        </div>
      </div>

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

      {/* Fixed fullscreen button — stacked above Atlas chat button */}
      <button
        className={`game-fullscreen-fab${isFullscreen ? ' active' : ''}`}
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? '\u2715' : '\u26F6'}
      </button>
    </div>
  );
}
