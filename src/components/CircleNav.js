import React, { useRef, useEffect, useCallback, useState } from 'react';

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

export default function CircleNav({ stages, currentStage, onSelectStage, clockwise, onToggleDirection, centerLine1, centerLine2, centerLine3, showAuthor = true, videoUrl, onCloseVideo, onAuthorPlay, worldZones, activeWorld, onSelectWorld, modelOverlay, onCloseModel, ybrActive, ybrCurrentStopIndex, ybrStages, onToggleYBR, ybrAutoStart, playIntroAnim, getStageClass }) {
  const radius = 42;
  const computed = getStageAngles(stages, clockwise);
  const playerRef = useRef(null);
  const playerDivRef = useRef(null);
  const [ybrAnimStage, setYbrAnimStage] = useState(-1);
  const ybrAnimRef = useRef(null);

  // Sequential light-up animation when toggling YBR on
  const handleYBRClick = useCallback(() => {
    if (ybrActive) {
      // Already active — just toggle off
      onToggleYBR();
      return;
    }
    // Run the light-up sequence, then activate
    if (ybrAnimRef.current) clearTimeout(ybrAnimRef.current);
    let i = 0;
    const total = stages.length;
    const step = () => {
      setYbrAnimStage(i);
      i++;
      if (i <= total) {
        ybrAnimRef.current = setTimeout(step, 140);
      } else {
        ybrAnimRef.current = setTimeout(() => {
          setYbrAnimStage(-1);
          onToggleYBR();
        }, 200);
      }
    };
    step();
  }, [ybrActive, onToggleYBR, stages.length]);

  useEffect(() => {
    return () => { if (ybrAnimRef.current) clearTimeout(ybrAnimRef.current); };
  }, []);

  // Auto-start YBR animation when requested (e.g., from Games page URL param)
  useEffect(() => {
    if (ybrAutoStart && !ybrActive && ybrAnimStage < 0) {
      handleYBRClick();
    }
  }, [ybrAutoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visual-only intro light-up (no journey activation)
  useEffect(() => {
    if (!playIntroAnim || ybrActive || ybrAnimStage >= 0) return;
    if (ybrAnimRef.current) clearTimeout(ybrAnimRef.current);
    let i = 0;
    const total = stages.length;
    const step = () => {
      setYbrAnimStage(i);
      i++;
      if (i <= total) {
        ybrAnimRef.current = setTimeout(step, 140);
      } else {
        ybrAnimRef.current = setTimeout(() => setYbrAnimStage(-1), 200);
      }
    };
    step();
  }, [playIntroAnim]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <line x1="12" y1="50" x2="88" y2="50" className="world-divider" />
          )}
          {modelOverlay && !listId && (() => {
            const m = modelOverlay;
            const r = 28;
            const mr = 1.8;
            const step = clockwise ? 45 : -45;
            const isLunar = m.id === 'lunar-month';
            return (
              <g className="model-overlay-ring">
                <circle cx="50" cy="50" r={r} fill="none" stroke={m.color} strokeWidth="0.4" opacity="0.6" />
                <line x1="50" y1={50 - r - 1} x2="50" y2={50 + r + 1} stroke={m.color} strokeWidth="0.2" opacity="0.3" />
                {m.stages.map((label, i) => {
                  if (!label) return null;
                  const angle = -90 + step * i;
                  const rad = (angle * Math.PI) / 180;
                  const px = 50 + r * Math.cos(rad);
                  const py = 50 + r * Math.sin(rad);
                  if (!isLunar) {
                    return <circle key={i} cx={px} cy={py} r={mr} fill={m.color} opacity="0.7" />;
                  }
                  const uid = `moon-${i}`;
                  // Moon phases: 0=full, 1=waning gibbous, 2=last quarter, 3=waning crescent,
                  //              4=new, 5=waxing crescent, 6=first quarter, 7=waxing gibbous
                  if (i === 0) {
                    // Full moon — filled circle
                    return <circle key={i} cx={px} cy={py} r={mr} fill={m.color} opacity="0.9" />;
                  }
                  if (i === 4) {
                    // New moon — empty circle
                    return <circle key={i} cx={px} cy={py} r={mr} fill="none" stroke={m.color} strokeWidth="0.3" opacity="0.7" />;
                  }
                  // Half and crescent phases use clip paths
                  return (
                    <g key={i}>
                      <defs>
                        <clipPath id={uid}>
                          {i === 2 && (
                            // Last quarter — left half lit
                            <rect x={px - mr} y={py - mr} width={mr} height={mr * 2} />
                          )}
                          {i === 6 && (
                            // First quarter — right half lit
                            <rect x={px} y={py - mr} width={mr} height={mr * 2} />
                          )}
                          {i === 1 && (
                            // Waning gibbous — mostly lit, shadow on right
                            <path d={`M ${px} ${py - mr} A ${mr} ${mr} 0 1 0 ${px} ${py + mr} A ${mr * 0.4} ${mr} 0 0 1 ${px} ${py - mr}`} />
                          )}
                          {i === 3 && (
                            // Waning crescent — thin sliver on left
                            <path d={`M ${px} ${py - mr} A ${mr} ${mr} 0 1 0 ${px} ${py + mr} A ${mr * 0.4} ${mr} 0 0 0 ${px} ${py - mr}`} />
                          )}
                          {i === 5 && (
                            // Waxing crescent — thin sliver on right
                            <path d={`M ${px} ${py - mr} A ${mr} ${mr} 0 1 1 ${px} ${py + mr} A ${mr * 0.4} ${mr} 0 0 1 ${px} ${py - mr}`} />
                          )}
                          {i === 7 && (
                            // Waxing gibbous — mostly lit, shadow on left
                            <path d={`M ${px} ${py - mr} A ${mr} ${mr} 0 1 1 ${px} ${py + mr} A ${mr * 0.4} ${mr} 0 0 0 ${px} ${py - mr}`} />
                          )}
                        </clipPath>
                      </defs>
                      <circle cx={px} cy={py} r={mr} fill="none" stroke={m.color} strokeWidth="0.2" opacity="0.4" />
                      <circle cx={px} cy={py} r={mr} fill={m.color} opacity="0.85" clipPath={`url(#${uid})`} />
                    </g>
                  );
                })}
              </g>
            );
          })()}
          {(ybrActive || ybrAnimStage >= 0) && (() => {
            const step = clockwise ? 45 : -45;
            const r = 42;
            const isAnim = ybrAnimStage >= 0;
            const points = (ybrStages || stages).map((s, i) => {
              const angle = -90 + step * i;
              const rad = (angle * Math.PI) / 180;
              return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
            });
            return (
              <g className="ybr-overlay" style={{ pointerEvents: 'none' }}>
                <circle cx="50" cy="50" r={r} className="ybr-path-full" fill="none" />
                {points.map((p, i) => {
                  let cls, radius;
                  if (isAnim) {
                    const lit = i < ybrAnimStage;
                    const current = i === ybrAnimStage;
                    cls = current ? 'ybr-stop-anim-current' : lit ? 'ybr-stop-anim-lit' : 'ybr-stop-future';
                    radius = current ? 2.5 : lit ? 1.8 : 1.2;
                  } else {
                    const isPast = i < ybrCurrentStopIndex;
                    const isCurrent = i === ybrCurrentStopIndex;
                    cls = isPast ? 'ybr-stop-past' : isCurrent ? 'ybr-stop-current' : 'ybr-stop-future';
                    radius = isPast ? 1.8 : isCurrent ? 2.5 : 1.2;
                  }
                  return (
                    <circle key={i} cx={p.x} cy={p.y} r={radius} className={`ybr-stop-marker ${cls}`} />
                  );
                })}
              </g>
            );
          })()}
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
        ) : modelOverlay ? (
          <div className="model-center-info" style={{ '--model-color': modelOverlay.color }}>
            <span className="model-center-title" style={{ color: modelOverlay.color }}>{modelOverlay.title}</span>
            <span className="model-center-theorist">{modelOverlay.theorist}</span>
            <span className="model-center-labels">
              <span className="model-world-label">{modelOverlay.normalWorldLabel}</span>
              <span className="model-world-sep">/</span>
              <span className="model-world-label">{modelOverlay.otherWorldLabel}</span>
            </span>
            <button className="model-close-btn" onClick={onCloseModel}>{'\u2715'}</button>
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

        {worldZones && !listId && (
          <>
            <div
              className={`world-zone world-zone-upper${activeWorld === 'normal' ? ' active' : ''}`}
              onClick={() => onSelectWorld && onSelectWorld(activeWorld === 'normal' ? null : 'normal')}
            />
            <div
              className={`world-zone world-zone-lower${activeWorld === 'other' ? ' active' : ''}`}
              onClick={() => onSelectWorld && onSelectWorld(activeWorld === 'other' ? null : 'other')}
            />
            <div
              className={`world-zone-threshold${activeWorld === 'threshold' ? ' active' : ''}`}
              onClick={() => onSelectWorld && onSelectWorld(activeWorld === 'threshold' ? null : 'threshold')}
            />
          </>
        )}

        {modelOverlay && !listId && (() => {
          const m = modelOverlay;
          const r = 33;
          const step = clockwise ? 45 : -45;
          return m.stages.map((label, i) => {
            if (!label) return null;
            const angle = -90 + step * i;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + r * Math.cos(rad);
            const y = 50 + r * Math.sin(rad);
            const tangent = angle + 90;
            let norm = ((tangent + 180) % 360 + 360) % 360 - 180;
            let labelRot = norm;
            if (norm > 90) labelRot = norm - 180;
            if (norm < -90) labelRot = norm + 180;
            return (
              <div
                key={`model-${i}`}
                className="model-stage-marker"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  cursor: 'pointer',
                }}
                title={label}
                onClick={() => onSelectStage(stages[i]?.id)}
              >
                <span
                  className="model-stage-label"
                  style={{ transform: `rotate(${labelRot}deg)`, color: m.color }}
                >
                  {label}
                </span>
              </div>
            );
          });
        })()}

        {computed.map(s => {
          const rad = (s.angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);
          return (
            <div
              key={s.id}
              className={`circle-stage ${currentStage === s.id ? 'active' : ''} ${getStageClass ? getStageClass(s.id) : ''}`}
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

        {onToggleYBR && (
          <button
            className={`circle-ybr-toggle${ybrActive ? ' active' : ''}${ybrAnimStage >= 0 ? ' animating' : ''}`}
            onClick={handleYBRClick}
            title={ybrActive ? 'Exit Yellow Brick Road' : 'Yellow Brick Road'}
          >
            <svg viewBox="0 0 20 14" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M1,4 L7,1 L19,1 L13,4 Z" />
              <path d="M1,4 L1,13 L13,13 L13,4" />
              <path d="M13,4 L19,1 L19,10 L13,13" />
              <line x1="7" y1="4" x2="7" y2="13" />
              <line x1="1" y1="8.5" x2="13" y2="8.5" />
              <line x1="4" y1="8.5" x2="4" y2="13" />
              <line x1="10" y1="4" x2="10" y2="8.5" />
            </svg>
          </button>
        )}
      </div>
      <button className="direction-toggle" onClick={onToggleDirection}>
        {clockwise ? '\u21BB' : '\u21BA'}
      </button>
    </div>
  );
}
