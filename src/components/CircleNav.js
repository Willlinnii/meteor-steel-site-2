import React, { useRef, useEffect, useCallback } from 'react';

function getStageAngles(stages, clockwise) {
  const step = clockwise ? 45 : -45;
  return stages.map((s, i) => {
    const angle = -90 + step * i;
    const tangent = angle + 90;
    let norm = ((tangent + 180) % 360 + 360) % 360 - 180;
    let labelRotation = norm;
    if (norm > 90) labelRotation = norm - 180;
    if (norm < -90) labelRotation = norm + 180;
    if (s.flipLabel) labelRotation += 180;
    return { ...s, angle, labelRotation };
  });
}

// Load the YouTube IFrame API script once
let ytApiReady = false;
let ytApiCallbacks = [];
function ensureYTApi() {
  if (ytApiReady || window.YT?.Player) {
    ytApiReady = true;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    ytApiCallbacks.push(resolve);
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytApiCallbacks.forEach(cb => cb());
        ytApiCallbacks = [];
      };
    }
  });
}

export default function CircleNav({ stages, currentStage, onSelectStage, clockwise, onToggleDirection, centerLine1, centerLine2, centerLine3, showAuthor = true, videoUrl, onCloseVideo, onAuthorPlay, worldZones, activeWorld, onSelectWorld }) {
  const radius = 42;
  const computed = getStageAngles(stages, clockwise);
  const playerRef = useRef(null);
  const playerDivRef = useRef(null);

  // Extract list ID from embed URL
  const listId = videoUrl ? new URL(videoUrl).searchParams.get('list') : null;

  useEffect(() => {
    if (!listId) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }
    let cancelled = false;
    ensureYTApi().then(() => {
      if (cancelled || !playerDivRef.current) return;
      // Destroy any existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        playerVars: {
          listType: 'playlist',
          list: listId,
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => e.target.playVideo(),
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [listId]);

  const handlePrev = useCallback(() => {
    if (playerRef.current?.previousVideo) playerRef.current.previousVideo();
  }, []);

  const handleNext = useCallback(() => {
    if (playerRef.current?.nextVideo) playerRef.current.nextVideo();
  }, []);

  return (
    <div className="circle-nav-wrapper">
      <div className="circle-nav">
        <svg viewBox="0 0 100 100" className="circle-rings">
          <circle cx="50" cy="50" r="47" className="ring ring-outer" />
          <circle cx="50" cy="50" r="38" className="ring ring-inner" />
          {worldZones && !listId && (
            <>
              {/* Upper semicircle — Normal World */}
              <path
                d="M 12,50 A 38,38 0 0,1 88,50 Z"
                className={`world-zone world-zone-upper${activeWorld === 'normal' ? ' active' : ''}`}
                onClick={() => onSelectWorld && onSelectWorld(activeWorld === 'normal' ? null : 'normal')}
              />
              {/* Lower semicircle — Other World */}
              <path
                d="M 12,50 A 38,38 0 0,0 88,50 Z"
                className={`world-zone world-zone-lower${activeWorld === 'other' ? ' active' : ''}`}
                onClick={() => onSelectWorld && onSelectWorld(activeWorld === 'other' ? null : 'other')}
              />
              {/* Horizontal dividing line */}
              <line x1="12" y1="50" x2="88" y2="50" className="world-divider" />
            </>
          )}
        </svg>

        {listId ? (
          <div className="circle-video-container">
            <div ref={playerDivRef} className="circle-video-player" />
            <button className="circle-video-close" onClick={onCloseVideo} title="Close video">{'\u2715'}</button>
            <div className="circle-video-controls">
              <button className="circle-video-btn" onClick={handlePrev} title="Previous">{'\u25C0'}</button>
              <button className="circle-video-btn" onClick={handleNext} title="Next">{'\u25B6'}</button>
            </div>
          </div>
        ) : (
          <div
            className={`circle-center ${currentStage === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectStage('overview')}
          >
            {(centerLine1 == null ? 'Journey' : centerLine1) && <span className="center-title-journey">{centerLine1 == null ? 'Journey' : centerLine1}</span>}
            {(centerLine2 == null ? 'of' : centerLine2) && <span className="center-title-of">{centerLine2 == null ? 'of' : centerLine2}</span>}
            {(centerLine3 == null ? 'Fallen Starlight' : centerLine3) && <span className="center-title-fallen">{centerLine3 == null ? 'Fallen Starlight' : centerLine3}</span>}
            {showAuthor && (
              <span
                className={`center-author ${currentStage === 'bio' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelectStage('bio'); }}
              >
                Will Linn
                {onAuthorPlay && (
                  <span className="author-play-icon" onClick={(e) => { e.stopPropagation(); onAuthorPlay(); }}>{' \u25B6'}</span>
                )}
              </span>
            )}
          </div>
        )}

        {computed.map(s => {
          const rad = (s.angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          return (
            <div
              key={s.id}
              className={`circle-stage ${currentStage === s.id ? 'active' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => onSelectStage(s.id)}
            >
              <span
                className="circle-stage-label"
                style={{ transform: `rotate(${s.labelRotation}deg)` }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <button className="direction-toggle" onClick={onToggleDirection}>
        {clockwise ? '\u21BB' : '\u21BA'}
      </button>
    </div>
  );
}
