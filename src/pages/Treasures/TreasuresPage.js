import React, { useState, useCallback } from 'react';
import CircleNav from '../../components/CircleNav';
import data from '../../data/treasuresData';
import './TreasuresPage.css';

const EPISODES = data.episodes.map(ep => ({ id: ep.id, label: ep.label }));

const TABS = [
  { id: 'themes', label: 'Themes' },
  { id: 'playlist', label: 'Playlist' },
  { id: 'references', label: 'References' },
  { id: 'music', label: 'Music & Media' },
  { id: 'productions', label: 'Previous Productions' },
];

function TreasuresPage() {
  const [currentEpisode, setCurrentEpisode] = useState('overview');
  const [clockwise, setClockwise] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');
  const [activeTheme, setActiveTheme] = useState(null);

  const episodeData = data.episodes.find(ep => ep.id === currentEpisode);
  const isPlaceholder = episodeData && episodeData.themes.length === 0;

  const handleSelectEpisode = useCallback((stage) => {
    setCurrentEpisode(stage);
    setActiveTab('themes');
    setActiveTheme(null);
  }, []);

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'themes') setActiveTheme(null);
  }, []);

  const videoUrl = activeTab === 'playlist' && episodeData?.playlist ? episodeData.playlist : null;

  return (
    <div className="treasures-page">
      <CircleNav
        stages={EPISODES}
        currentStage={currentEpisode}
        onSelectStage={handleSelectEpisode}
        clockwise={clockwise}
        onToggleDirection={() => setClockwise(!clockwise)}
        centerLine1="Lost"
        centerLine2="Treasures"
        centerLine3=""
        showAuthor={false}
        videoUrl={videoUrl}
        onCloseVideo={() => setActiveTab('themes')}
      />

      <div className="treasures-subtitle">{data.subtitle}</div>

      {episodeData && (
        <h2 className="stage-heading">{episodeData.label}</h2>
      )}

      <div className="container">
        <div id="content-container">
          {currentEpisode === 'overview' && (
            <div className="treasures-overview">
              <div className="treasures-overview-text">
                {data.description.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {currentEpisode === 'bio' && (
            <div className="treasures-overview">
              <div className="treasures-overview-text">
                <p>Bio content for the Treasures series.</p>
              </div>
            </div>
          )}

          {episodeData && currentEpisode !== 'overview' && currentEpisode !== 'bio' && (
            <>
              {isPlaceholder ? (
                <div className="treasures-placeholder">
                  <p>Content coming soon.</p>
                  <p>This episode is currently in development.</p>
                </div>
              ) : (
                <>
                  <div className="treasures-tabs">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        className={`treasures-tab-btn${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="treasures-content">
                    {activeTab === 'themes' && (
                      <div className="treasures-themes">
                        <div className="treasures-theme-buttons">
                          {episodeData.themes.map(theme => (
                            <button
                              key={theme.id}
                              className={`treasures-theme-btn${activeTheme === theme.id ? ' active' : ''}`}
                              onClick={() => setActiveTheme(activeTheme === theme.id ? null : theme.id)}
                            >
                              {theme.title}
                            </button>
                          ))}
                        </div>
                        {activeTheme && (() => {
                          const theme = episodeData.themes.find(t => t.id === activeTheme);
                          if (!theme) return null;
                          return (
                            <div className="treasures-theme-content" key={theme.id}>
                              <div className="treasures-body">
                                {theme.content.split('\n\n').map((p, i) => (
                                  <p key={i}>{p}</p>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {activeTab === 'playlist' && (
                      <div className="treasures-playlist-info">
                        {episodeData.playlist ? (
                          <p>The playlist is now playing in the circle above. Use the controls to navigate between videos.</p>
                        ) : (
                          <p>Playlist coming soon for this episode.</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'references' && (
                      <div className="treasures-references">
                        {episodeData.references.length > 0 ? (
                          <ul className="treasures-ref-list">
                            {episodeData.references.map((ref, i) => (
                              <li key={i} className="treasures-ref-item">
                                <span className="treasures-ref-title">{ref.title}</span>
                                <span className="treasures-ref-desc">{ref.description}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="treasures-empty">References coming soon.</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'music' && (
                      <div className="treasures-music">
                        {episodeData.music.length > 0 ? (
                          <ul className="treasures-ref-list">
                            {episodeData.music.map((item, i) => (
                              <li key={i} className="treasures-ref-item">
                                <span className="treasures-ref-title">{item.title}</span>
                                <span className="treasures-ref-artist">{item.artist}</span>
                                <span className="treasures-ref-desc">{item.description}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="treasures-empty">Music & media coming soon.</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'productions' && (
                      <div className="treasures-productions">
                        {episodeData.previousProductions.length > 0 ? (
                          <ul className="treasures-ref-list">
                            {episodeData.previousProductions.map((prod, i) => (
                              <li key={i} className="treasures-ref-item">
                                <span className="treasures-ref-title">{prod.title} ({prod.year})</span>
                                <span className="treasures-ref-type">{prod.type}</span>
                                <span className="treasures-ref-desc">{prod.description}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="treasures-empty">Previous productions coming soon.</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TreasuresPage;
