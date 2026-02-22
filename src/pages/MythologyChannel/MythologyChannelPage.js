import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mythsData from '../../data/mythsEpisodes.json';
import mythsSynthesis from '../../data/mythsSynthesis.json';
import { useCoursework } from '../../coursework/CourseworkContext';
import './MythologyChannelPage.css';

const SHOWS = [
  {
    id: 'myths-tv',
    label: 'Myths: Greatest Mysteries',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLqal35qVo2sWWRcS9pRrR68YOgT4p4Ftm',
    description: 'The international TV series exploring humanity\'s greatest myths — featuring Will Linn as meta-expert.',
    isMythsTV: true,
  },
  {
    id: 'myth-salon',
    label: 'Myth Salon',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpmankurn1mE7-r3fHY4nAV',
    description: 'Live conversations exploring myth, depth psychology, and the soul of culture.',
  },
  {
    id: 'mythosophia',
    label: 'Mythosophia',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtotNrVSEqO-Nq87oZBysW1a',
    description: 'Mythic wisdom and the philosophical dimensions of storytelling.',
  },
  {
    id: 'deep-sight',
    label: 'Deep Sight',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtowPCw_QkXozvJzzTqvZozz',
    description: 'Visionary explorations of myth and the imaginal.',
  },
  {
    id: 'journey-of-the-goddess',
    label: 'Journey of the Goddess',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtodFheYcPjTGgbD1lsT-Pqf',
    description: 'Tracing the feminine divine through myth, culture, and consciousness.',
  },
  {
    id: 'transformational-narrative',
    label: 'Transformational Narrative',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtrYkiA3glbcfa2oqkaj05qW',
    description: 'The power of story to transform consciousness and culture.',
  },
  {
    id: 'dennis-slattery',
    label: 'Myth, Poetics & Culture',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqUrR_L1_fsxw0S4ugOMo50',
    description: 'Talks by Dennis Patrick Slattery on mythopoetics and literature.',
  },
  {
    id: 'lionel-corbett',
    label: 'Depth & Meaning',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CNyqy5clgYGMmZ7RE2Kj7F-',
    description: 'Talks by Lionel Corbett on Jungian psychology and the numinous.',
  },
  {
    id: 'myth-is-all-around-us',
    label: 'Myth is All Around Us',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtplVff23-tgQ5KIt8Z89_Fe',
    description: 'Discovering mythic patterns in everyday life and the world around us.',
  },
  {
    id: 'scholar-talks',
    label: 'Scholar Talks',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CO4EWIb9HnC6Zdx6NUQhTfL',
    description: 'Academic lectures on mythology, religion, and depth psychology.',
  },
  {
    id: 'mastery-circle',
    label: 'Mastery Circle',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CPCSA14Lzfm3uNlNBA_a0zi',
    description: 'Deep-dive sessions on mythological mastery and practice.',
  },
  {
    id: 'mythology-classroom',
    label: 'Mythology Classroom',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL9K_KMb-XthdXvDeKlccUWpRoR5znho_v',
    description: 'Educational sessions teaching the foundations of mythological study.',
  },
  {
    id: 'the-tao',
    label: 'The Tao',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CMh5cYBmYMM8Mq_Q00uinNX',
    description: 'Explorations of Taoist philosophy and its mythic dimensions.',
  },
  {
    id: 'pulling-focus',
    label: 'Pulling Focus',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpAyw0zUzQqRM5LCh_A-Qx_',
    description: 'Documentary depths and archetypal realities.',
  },
  {
    id: 'climate-journey',
    label: 'Climate Journey',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtrIDNF6v_WameHvlEQ3joMC',
    description: 'Mythic perspectives on the climate crisis and our relationship to Earth.',
  },
];

/* ── Show Detail Page (second click on a show card) ── */
function ShowDetailPage({ show, onBack, trackElement }) {
  const [expanded, setExpanded] = useState({});

  const toggleSection = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // For Myths TV, render full episode list with synthesis
  if (show.isMythsTV) {
    return (
      <MythsTVDetailPage show={show} onBack={onBack} trackElement={trackElement} />
    );
  }

  return (
    <div className="show-detail">
      <button className="show-detail-back" onClick={onBack}>
        {'\u2190'} Back to Channel
      </button>
      <h2 className="show-detail-title">{show.label}</h2>
      <p className="show-detail-desc">{show.description}</p>

      {show.playlist && (
        <div className="show-detail-player">
          <iframe
            src={show.playlist}
            title={show.label}
            width="100%"
            height="400"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="show-detail-placeholder">
        <p>More content for <strong>{show.label}</strong> coming soon.</p>
      </div>
    </div>
  );
}

/* ── Myths TV Detail Page (full episode content) ── */
function MythsTVDetailPage({ show, onBack, trackElement }) {
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [expanded, setExpanded] = useState({});

  const toggleSection = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleEpisodeSelect = useCallback((ep) => {
    if (selectedEpisode?.id === ep.id) {
      setSelectedEpisode(null);
      setExpanded({});
    } else {
      setSelectedEpisode(ep);
      setExpanded({});
      trackElement(`mythology-channel.detail.episode.${ep.id}`);
    }
  }, [selectedEpisode, trackElement]);

  const synthesis = selectedEpisode ? (mythsSynthesis[selectedEpisode.id] || null) : null;

  return (
    <div className="show-detail">
      <button className="show-detail-back" onClick={onBack}>
        {'\u2190'} Back to Channel
      </button>
      <h2 className="show-detail-title">{show.label}</h2>
      <p className="show-detail-desc">{show.description}</p>

      {show.playlist && (
        <div className="show-detail-player">
          <iframe
            src={show.playlist}
            title={show.label}
            width="100%"
            height="400"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <h3 className="show-detail-episodes-heading">Episodes</h3>
      <div className="show-detail-episodes-grid">
        {mythsData.episodes.map(ep => (
          <button
            key={ep.id}
            className={`show-detail-ep-btn${selectedEpisode?.id === ep.id ? ' active' : ''}`}
            onClick={() => handleEpisodeSelect(ep)}
          >
            {ep.title}
          </button>
        ))}
      </div>

      {selectedEpisode && (
        <div className="show-detail-ep-content">
          <h3 className="show-detail-ep-title">{selectedEpisode.title}</h3>
          {selectedEpisode.summary && (
            <p className="show-detail-ep-summary">{selectedEpisode.summary}</p>
          )}

          {/* Synthesis sections */}
          {synthesis && (
            <div className="show-detail-section">
              <button
                className={`show-detail-section-btn${expanded.synthesis ? ' open' : ''}`}
                onClick={() => toggleSection('synthesis')}
              >
                <span className="show-detail-arrow">{expanded.synthesis ? '\u25BC' : '\u25B6'}</span>
                Synthesis
              </button>
              {expanded.synthesis && (
                <div className="show-detail-section-body">
                  {synthesis.sections.map((s, i) => (
                    <div key={i} className="show-detail-synth">
                      <h4 className="show-detail-synth-heading">{s.heading}</h4>
                      <div className="show-detail-synth-text">
                        {s.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interview entries */}
          {selectedEpisode.entries.length > 0 && (() => {
            const storyline = selectedEpisode.entries.filter(e => !e.question);
            const questions = selectedEpisode.entries.filter(e => e.question);
            return (
              <>
                {storyline.length > 0 && (
                  <div className="show-detail-section">
                    <button
                      className={`show-detail-section-btn${expanded.storyline ? ' open' : ''}`}
                      onClick={() => toggleSection('storyline')}
                    >
                      <span className="show-detail-arrow">{expanded.storyline ? '\u25BC' : '\u25B6'}</span>
                      Storyline
                    </button>
                    {expanded.storyline && (
                      <div className="show-detail-section-body">
                        {storyline.map((entry, i) =>
                          entry.text.split('\n\n').map((p, j) => <p key={`${i}-${j}`}>{p}</p>)
                        )}
                      </div>
                    )}
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="show-detail-section">
                    <button
                      className={`show-detail-section-btn${expanded.interview ? ' open' : ''}`}
                      onClick={() => toggleSection('interview')}
                    >
                      <span className="show-detail-arrow">{expanded.interview ? '\u25BC' : '\u25B6'}</span>
                      Interview ({questions.length})
                    </button>
                    {expanded.interview && (
                      <div className="show-detail-section-body">
                        {questions.map((entry, i) => (
                          <div key={i} className="show-detail-qa">
                            <button
                              className={`show-detail-qa-q${expanded[`q-${i}`] ? ' open' : ''}`}
                              onClick={() => toggleSection(`q-${i}`)}
                            >
                              <span className="show-detail-arrow">{expanded[`q-${i}`] ? '\u25BE' : '\u25B8'}</span>
                              {entry.question}
                            </button>
                            {expanded[`q-${i}`] && (
                              <div className="show-detail-qa-a">
                                {entry.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function MythsEpisodeContent({ episode }) {
  return (
    <div className="myths-episode-content">
      <h3 className="myths-episode-title">{episode.title}</h3>
      {episode.summary && (
        <p className="myths-episode-summary">{episode.summary}</p>
      )}
      <div className="myths-entries">
        {episode.entries.map((entry, i) => (
          <div key={i} className="myths-entry">
            {entry.question && (
              <h4 className="myths-entry-question">{entry.question}</h4>
            )}
            <div className="myths-entry-text">
              {entry.text.split('\n\n').map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MythologyChannelPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [activeShow, setActiveShow] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [zapKey, setZapKey] = useState(0);
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);

  const [detailShow, setDetailShow] = useState(null);

  const { trackElement, trackTime, isElementCompleted, courseworkMode } = useCoursework();
  const triggerZap = useCallback(() => setZapKey(k => k + 1), []);

  // Page visit tracking
  useEffect(() => { trackElement('mythology-channel.page.visited'); }, [trackElement]);

  // Time tracking per active show
  const timeRef = useRef({ show: null, start: Date.now() });
  useEffect(() => {
    const showId = activeShow?.id || null;
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0 && prev.show) trackTime(`mythology-channel.show.${prev.show}.time`, elapsed);
    timeRef.current = { show: showId, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      const secs = Math.round((Date.now() - cur.start) / 1000);
      if (secs > 0 && cur.show) trackTime(`mythology-channel.show.${cur.show}.time`, secs);
    };
  }, [activeShow, trackTime]);

  // Zap antennas on first open
  useEffect(() => {
    const t = setTimeout(triggerZap, 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep link from URL param
  useEffect(() => {
    if (showId) {
      const show = SHOWS.find(s => s.id === showId);
      if (show) {
        setActiveShow(show);
        setVideoUrl(show.playlist || null);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  }, []);

  // Create/destroy player when show changes
  useEffect(() => {
    if (!activeShow || !activeShow.playlist) {
      destroyPlayer();
      return;
    }

    const listId = activeShow.playlist.match(/list=([^&]+)/)?.[1];
    if (!listId) return;

    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !playerContainerRef.current) return;
      destroyPlayer();
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        width: '100%',
        height: '100%',
        playerVars: {
          listType: 'playlist',
          list: listId,
          autoplay: 1,
          modestbranding: 1,
        },
      });
    };

    // Load YT API if not already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      destroyPlayer();
    };
  }, [activeShow, destroyPlayer]);

  const handleShowClick = (show) => {
    if (activeShow?.id === show.id) {
      // Second click — open detail page
      setDetailShow(show);
      trackElement(`mythology-channel.detail.${show.id}`);
    } else {
      trackElement(`mythology-channel.show.${show.id}`);
      setActiveShow(show);
      setActiveEpisode(null);
      setDetailShow(null);
      setVideoUrl(show.playlist || null);
      triggerZap();
      navigate(`/mythology-channel/${show.id}`, { replace: true });
    }
  };

  const handleTvClick = () => {
    if (videoUrl) {
      setActiveShow(null);
      setVideoUrl(null);
      setActiveEpisode(null);
      navigate('/mythology-channel', { replace: true });
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (playerRef.current?.previousVideo) playerRef.current.previousVideo();
    triggerZap();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (playerRef.current?.nextVideo) playerRef.current.nextVideo();
    triggerZap();
  };

  const handleEpisodeClick = (episode) => {
    if (!activeEpisode || activeEpisode.id !== episode.id) {
      trackElement(`mythology-channel.episode.${episode.id}`);
    }
    setActiveEpisode(prev => prev?.id === episode.id ? null : episode);
  };

  const isMythsActive = activeShow?.isMythsTV;
  const isOn = !!videoUrl;

  // Show detail page if open
  if (detailShow) {
    return (
      <div className="mythology-channel-page">
        <ShowDetailPage
          show={detailShow}
          onBack={() => setDetailShow(null)}
          trackElement={trackElement}
        />
      </div>
    );
  }

  return (
    <div className="mythology-channel-page">
      <div className={`tv-wrapper${isOn ? ' tv-on' : ''}`}>
        <img
          src={process.env.PUBLIC_URL + (isOn ? '/tv-frame.png' : '/tv-solid.png')}
          alt="Mythology Channel TV"
          className="tv-frame-img"
        />
        {isOn && (
          <div className="tv-screen-area">
            <div ref={playerContainerRef} className="tv-video-player" />
          </div>
        )}
        {isOn && (
          <button className="tv-knob tv-knob-prev" onClick={handlePrev} title="Previous">
            &#9664;
          </button>
        )}
        {isOn && (
          <button className="tv-knob tv-knob-next" onClick={handleNext} title="Next">
            &#9654;
          </button>
        )}
        {isOn && (
          <button className="tv-power-btn" onClick={handleTvClick} title="Turn off">
            {'\u25A0'}
          </button>
        )}
        {zapKey > 0 && (
          <svg key={zapKey} className="tv-zap-overlay" viewBox="0 0 100 12" preserveAspectRatio="none">
            {/* Left antenna zaps — travel from center-dome up-left */}
            <polyline className="zap zap-l1" points="50,10 46,7 48,6 43,3 45,2 38,0" />
            <polyline className="zap zap-l2" points="50,10 47,8 49,7 44,4 46,3 36,0.5" />
            <polyline className="zap zap-l3" points="50,10 45,6 47,5 42,2 34,0" />
            {/* Right antenna zaps — travel from center-dome up-right */}
            <polyline className="zap zap-r1" points="50,10 54,7 52,6 57,3 55,2 62,0" />
            <polyline className="zap zap-r2" points="50,10 53,8 51,7 56,4 54,3 64,0.5" />
            <polyline className="zap zap-r3" points="50,10 55,6 53,5 58,2 66,0" />
          </svg>
        )}
      </div>

      {activeShow && (
        <div className="tv-now-playing">
          Now Playing: <strong>{activeShow.label}</strong>
        </div>
      )}

      <div className="mythology-channel-shows">
        <h2 className="shows-heading">Series</h2>
        <div className="shows-grid">
          {SHOWS.map(show => (
            <button
              key={show.id}
              className={`show-card${activeShow?.id === show.id ? ' active' : ''}${show.isMythsTV ? ' myths-tv-card' : ''}${courseworkMode ? (isElementCompleted(`mythology-channel.show.${show.id}`) ? ' cw-completed' : ' cw-incomplete') : ''}`}
              onClick={() => handleShowClick(show)}
            >
              <span className="show-card-title">{show.label}</span>
              <span className="show-card-desc">{show.description}</span>
            </button>
          ))}
        </div>
      </div>

      {activeShow?.id === 'climate-journey' && (
        <div className="climate-bootcamp-cta">
          <a
            href="https://www.thestoryatlas.com/my-courses/climate-bootcamp/introducing-the-situation"
            target="_blank"
            rel="noopener noreferrer"
            className="climate-bootcamp-btn"
          >
            Enter the Climate Bootcamp
          </a>
        </div>
      )}

      {isMythsActive && (
        <div className="myths-section">
          <div className="myths-header">
            <h2 className="myths-show-title">{mythsData.show.title}</h2>
            <p className="myths-show-desc">{mythsData.show.description}</p>
            <a
              className="myths-roku-btn"
              href={mythsData.show.rokuUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              See Full Series on Roku
            </a>
          </div>

          <h3 className="myths-episodes-heading">Episodes &mdash; Will Linn Interviews</h3>
          <div className="myths-episodes-grid">
            {mythsData.episodes.map(ep => (
              <button
                key={ep.id}
                className={`myths-episode-btn${activeEpisode?.id === ep.id ? ' active' : ''}`}
                onClick={() => handleEpisodeClick(ep)}
              >
                {ep.title}
              </button>
            ))}
          </div>

          {activeEpisode && (
            <div className="myths-episode-panel">
              <MythsEpisodeContent episode={activeEpisode} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
