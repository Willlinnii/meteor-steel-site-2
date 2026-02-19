import React, { useState, useCallback } from 'react';
import CircleNav from '../../components/CircleNav';
import { ring1, ring2, ring3, allEpisodes, subtitle as seriesSubtitle, description as seriesDescription, rokuUrl } from '../../data/mythsSeriesData';
import treasuresData from '../../data/treasuresData';
import '../Treasures/TreasuresPage.css';
import './MythsPage.css';

/* ── Series (triple-ring) constants ── */
const RING_1_STAGES = ring1.map(ep => ({ id: ep.id, label: ep.label }));
const RING_2_STAGES = ring2.map(ep => ({ id: ep.id, label: ep.label }));
const RING_3_STAGES = ring3.map(ep => ({ id: ep.id, label: ep.label }));

const RINGS = [
  { stages: RING_1_STAGES, radius: 44, className: 'myths-ring-1' },
  { stages: RING_2_STAGES, radius: 33, className: 'myths-ring-2' },
  { stages: RING_3_STAGES, radius: 22, className: 'myths-ring-3' },
];
const RING_CIRCLES = [47, 39, 27, 16];

/* ── Treasures (single-ring) constants ── */
const TREASURE_EPISODES = treasuresData.episodes.map(ep => ({ id: ep.id, label: ep.label }));

const TREASURE_TABS = [
  { id: 'themes', label: 'Themes' },
  { id: 'playlist', label: 'Playlist' },
  { id: 'references', label: 'References' },
  { id: 'music', label: 'Music & Media' },
  { id: 'productions', label: 'Previous Productions' },
];

/* ── Treasures content (inlined from TreasuresPage) ── */
function TreasuresContent({ currentEpisode, onSelectEpisode, viewToggle }) {
  const [activeTab, setActiveTab] = useState('themes');
  const [activeTheme, setActiveTheme] = useState(null);

  const episodeData = treasuresData.episodes.find(ep => ep.id === currentEpisode);
  const isPlaceholder = episodeData && episodeData.themes.length === 0;

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'themes') setActiveTheme(null);
  }, []);

  // Reset tab state when episode changes
  const prevEp = React.useRef(currentEpisode);
  React.useEffect(() => {
    if (prevEp.current !== currentEpisode) {
      prevEp.current = currentEpisode;
      setActiveTab('themes');
      setActiveTheme(null);
    }
  }, [currentEpisode]);

  const videoUrl = activeTab === 'playlist' && episodeData?.playlist ? episodeData.playlist : null;

  return (
    <>
      <CircleNav
        stages={TREASURE_EPISODES}
        currentStage={currentEpisode}
        onSelectStage={onSelectEpisode}
        clockwise={false}
        onToggleDirection={() => {}}
        centerLine1="Lost"
        centerLine2="Treasures"
        centerLine3=""
        showAuthor={false}
        videoUrl={videoUrl}
        onCloseVideo={() => setActiveTab('themes')}
      />

      <div className="treasures-subtitle">{treasuresData.subtitle}</div>

      {viewToggle}

      {episodeData && (
        <h2 className="stage-heading">{episodeData.label}</h2>
      )}

      <div className="container">
        <div id="content-container">
          {currentEpisode === 'overview' && (
            <div className="treasures-overview">
              <div className="treasures-overview-text">
                {treasuresData.description.split('\n\n').map((p, i) => (
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
                    {TREASURE_TABS.map(tab => (
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
    </>
  );
}

/* ── Helper: derive a short theme label from an entry ── */
const TRAILING_WORD = /\s+(and|or|the|a|an|of|in|on|at|to|for|with|by|from|as|but|so|that|which|who|its|this|into|has|is|are|was|were|do|does|did|it|we|our|us|my|they|their|his|her|how|no|not|more|than|also|even|why|be|yet|if|he|she|such|about|when|like|very|some|any)$/i;

function deriveLabel(entry, index) {
  let src = entry.question || entry.text;

  // Strip metadata / header prefixes
  src = src
    .replace(/^[^.!?\n]{0,40}\s*[-–—]\s*(Dr\.\s*)?Will\s+Linn[^.!?\n]*[.!?,\n\-–—]\s*/i, '')
    .replace(/^(Dr\.\s*)?Will\s+Linn[^.!?\n]*[.!?,\n\-–—]\s*/i, '')
    .replace(/^WILL\s+LINN\s*[-–—:.,]?\s*/i, '')
    .replace(/^[^.!?\n]{0,40}(Dr\.\s*)?Will\s+Linn(?=[A-Z])/i, '')
    .replace(/^Mythologi?st[.,]?\s*/i, '')
    .replace(/^Meta\s+Expertise\s+Questions?\s+on\s+/i, '')
    .replace(/^Myths?\s*[–—:-]\s*(the\s+greatest\s+(mysteries|myths)\s+of\s+(Humanity|Mankind))?:?\s*/i, '')
    .replace(/^THE\s+GREATEST\s+(MYTHS?|MYSTERIES)\s+OF\s+(HUMANITY|MANKIND)\s*/i, '')
    .replace(/^Storyline\.?\s*/i, '')
    .replace(/^Topic:\s*/i, '')
    .replace(/^Synopsis\.?\s*/i, '')
    .replace(/^ITV\s+(Questions?|Fragen)\s*[\w\s]*/i, '')
    .replace(/^Fragen\s+(für|zu)\s+[\w\s]+zu?\s*/i, '')
    .replace(/^(HEADLINE\s+)/i, '')
    .replace(/^Summary\s*[-–—]\s*/i, '')
    .replace(/^\?\?\s*/, '')
    .replace(/^=\s*/, '')
    .replace(/^3(?=[A-Z])/, '')
    .replace(/^[„""\u201C\u201E]+/, '')
    .replace(/[„""\u201D\u201C]+$/, '')
    .replace(/^[-–—]\s*/, '')
    .trim();

  // Strip ALL-CAPS section headers
  const firstLine = src.split(/[\n]/)[0];
  if (/^[A-Z\s\d'&:–—.,!?-]{4,}$/.test(firstLine.trim())) {
    src = src.substring(firstLine.length).replace(/^\s*/, '');
  }

  // Strip title-like lines ending with dash
  src = src.replace(/^[^\n]{0,55}\s+[-–—]\s*\n?\s*/, '');

  // Second-pass cleanup
  src = src
    .replace(/^Storyline\.?\s*/i, '')
    .replace(/^Mythologi?st[.,]?\s*/i, '')
    .replace(/^THE\s+GREATEST\s+(MYTHS?|MYSTERIES)\s+OF\s+(HUMANITY|MANKIND)[,.]?\s*/i, '')
    .trim();

  // Strip leading ALL-CAPS clause
  src = src.replace(/^[A-Z\s]{4,}[A-Z],?\s*/, '');

  if (!src || src.length < 5) return 'Part ' + (index + 1);

  if (entry.question) {
    let q = src.replace(/[?◊]+\s*$/g, '').replace(/◊[^]*$/, '').trim();
    q = q
      .replace(/^(Or maybe we could also ask:?\s*)/i, '')
      .replace(/^(Free answer\.?\s*)/i, '')
      .replace(/^(This is a very interesting[^.]*[.:]\s*)/i, '')
      .replace(/^(In (short|what|which|the),?\s*)/i, '')
      .replace(/^(Can|Could)\s+you\s+(tell|give|show|explain)\s+(us|me)\s+(a\s+bit\s+)?(about|more\s+about|how|why|what|the)?\s*/i, '')
      .replace(/^(Please\s+)?(Tell|Give|Show|Explain)\s+(us|me)\s+(a\s+bit\s+)?(about|more\s+about|how|why|what|the)?\s*/i, '')
      .replace(/^(What|Why|How|Which|Where|When|Who|Is|Are|Do|Does|Did|Can|Could|Isn't|Aren't|Don't)\s+(is|are|makes?|do|does|did|can|could|was|were|has|have|had|it|there|about|exactly|you think|you tell|you explain|you believe|you say|would|should|come|basically|much|many|far|often|literally|long|well|probable|realistic|possible|really|even|ever|right|else|since|such|so)\s+/i, '')
      .replace(/^(What|Why|How|Which|Where|When|Who|Is|Are|Do|Does|Did|Can|Could|Isn't|Aren't|Don't|What's)\s+/i, '')
      .replace(/^(is|are|makes?|do|does|did|can|could|was|were|has|have|had|it|there|the|a|an|about|really|truly|still|ever|even|basically|mainly|just|already|perhaps|apparently|especially|particularly|you|us)\s+/i, '')
      .replace(/^(is|are|the|a|an)\s+/i, '')
      .replace(/^us\s+(a\s+bit\s+|more\s+)?(about\s+)?/i, '')
      .replace(/\s+so\s+(special|unique|interesting|important|puzzling|famous|big|great|much)$/i, '')
      .replace(/[.]\s*$/, '');
    q = q.charAt(0).toUpperCase() + q.slice(1);
    if (q.length > 38) {
      q = q.substring(0, 39).replace(/\s+\S*$/, '');
    }
    q = q.replace(TRAILING_WORD, '').replace(TRAILING_WORD, '');
    if (q.length < 6) return 'Part ' + (index + 1);
    return q;
  }

  // Text entries — strip filler openings
  let t = src
    .replace(/^(On (one|another) level[,]?\s*)/i, '')
    .replace(/^(In the (case|history|end|folklore)[^,]*[,]\s*)/i, '')
    .replace(/^(It is (exactly|clear to)\s+)/i, '')
    .replace(/^(This (is|also|created|was|episode|golden)\s+(the\s+|a\s+|about\s+)?)/i, '')
    .replace(/^(There (is|are)\s+(a\s+)?)/i, '')
    .replace(/^(Hardly any\s+)/i, 'The ')
    .replace(/^(Nowadays,?\s+(the\s+)?)/i, '')
    .replace(/^(One (theory|might|of)\s+)/i, '')
    .replace(/^(The (bigger\s+)?question (is|remains):?\s*)/i, '')
    .replace(/^(Researchers of\s+)/i, '')
    .replace(/^(That is also true for\s+)/i, '')
    .replace(/^(Professor \w+,?\s*though,?\s*only\s+)/i, '')
    .replace(/^(But\s+(what\s+if\s+)?)/i, '')
    .replace(/^(Since\s+the\s+)/i, '')
    .replace(/^(As\s+(one|her|Kathleen|Cleopatra)\s+)/i, '')
    .replace(/^(Whether\s+(of\s+)?)/i, '')
    .replace(/^(Here\s+is\s+where\s+)/i, '')
    .replace(/^(Finally,?\s+(we\s+)?)/i, '')
    .replace(/^(Hidden from\s+)/i, '')
    .replace(/^(For\s+Jeff\s+)/i, 'Jeff ')
    .replace(/^(Such as\s+)/i, '')
    .replace(/^(After\s+the\s+battle\s+of\s+)/i, 'Battle of ')
    .replace(/^(Using\s+several\s+)/i, '')
    .replace(/^(According\s+to\s+the\s+)/i, '')
    .replace(/^(Our\s+(documentary|journey|protagonist|main)\s+(is\s+|starts?\s+)?)/i, '')
    .replace(/^(Of\s+the\s+10\s+myths?\s+of\s+Season\s+\w+[,.]?\s*)/i, '')
    .replace(/^(With\s+Archeologist\s+)/i, '')
    .replace(/^(What\s+sounds\s+fantastic\s+)/i, '')
    .replace(/^(We\s+travel\s+to\s+)/i, '')
    .replace(/^(At\s+the\s+beginning\s+of\s+the\s+film\s+)/i, '')
    .replace(/^(The\s+film\s+looks\s+for\s+)/i, '')
    .replace(/^(How\s+much\s+truth\s+)/i, 'Truth ')
    .replace(/^(It\s+could\s+be\s+the\s+same\s+)/i, '')
    .replace(/^(Power\.\s+Love\.\s+Death\.\s+)/i, '')
    .replace(/^(Explores\s+the\s+myth\s+of\s+the\s+)/i, '')
    .replace(/^(Gets\s+more\s+probable\s+with\s+the\s+)/i, '')
    .replace(/^(The\s+first\s+)/i, 'First ')
    .replace(/^(Early\s+)/i, '')
    .replace(/^(Is\s+about\s+the\s+)/i, '');

  // Strip ALL-CAPS phrases left over after filler removal
  t = t
    .replace(/^THE\s+GREATEST\s+(MYTHS?|MYSTERIES)\s+OF\s+(HUMANITY|MANKIND)[,.]?\s*/i, '')
    .replace(/^[A-Z][A-Z\s]{3,}[A-Z][,.]?\s+(?=[a-z])/g, '');

  let label;
  const clause = t.match(/^[^.!?,;:\n]{8,38}[.!?,;:]/);
  if (clause) {
    label = clause[0].replace(/[.!?,;:\s]+$/, '');
  } else {
    label = t.substring(0, 39).replace(/\s+\S*$/, '');
  }
  label = label.replace(TRAILING_WORD, '').replace(TRAILING_WORD, '');
  label = label.charAt(0).toUpperCase() + label.slice(1);
  if (label.length < 6) return 'Part ' + (index + 1);
  return label;
}

/* ── Series content ── */
function SeriesContent({ currentEpisode, onSelectEpisode, viewToggle }) {
  const [clockwise, setClockwise] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  const episodeData = allEpisodes.find(ep => ep.id === currentEpisode);

  // Reset when episode changes
  const prevEp = React.useRef(currentEpisode);
  React.useEffect(() => {
    if (prevEp.current !== currentEpisode) {
      prevEp.current = currentEpisode;
      setActiveEntry(null);
      setVideoUrl(null);
    }
  }, [currentEpisode]);

  return (
    <>
      <div className="myths-circle-wrapper">
        <CircleNav
          rings={RINGS}
          ringCircles={RING_CIRCLES}
          currentStage={currentEpisode}
          onSelectStage={onSelectEpisode}
          clockwise={clockwise}
          onToggleDirection={() => setClockwise(!clockwise)}
          centerLine1="Myths"
          centerLine2=""
          centerLine3="Mysteries"
          showAuthor={false}
          videoUrl={videoUrl}
          onCloseVideo={() => setVideoUrl(null)}
        />
      </div>

      <div className="myths-subtitle">{seriesSubtitle}</div>

      {viewToggle}

      {episodeData && (
        <h2 className="stage-heading">{episodeData.title}</h2>
      )}

      <div className="container">
        <div id="content-container">
          {currentEpisode === 'overview' && (
            <div className="myths-overview">
              <div className="myths-overview-text">
                {seriesDescription.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {rokuUrl && (
                <div className="myths-roku-link">
                  <a href={rokuUrl} target="_blank" rel="noopener noreferrer">
                    Watch on The Roku Channel
                  </a>
                </div>
              )}
            </div>
          )}

          {currentEpisode === 'bio' && (
            <div className="myths-overview">
              <div className="myths-overview-text">
                <p>Bio content for the Myths series.</p>
              </div>
            </div>
          )}

          {episodeData && currentEpisode !== 'overview' && currentEpisode !== 'bio' && (
            <>
              {episodeData.playlist && (
                <div className="myths-play-bar">
                  <button
                    className={`myths-play-btn${videoUrl ? ' active' : ''}`}
                    onClick={() => setVideoUrl(videoUrl ? null : episodeData.playlist)}
                  >
                    {videoUrl ? '\u25A0 Stop' : '\u25B6 Watch'}
                  </button>
                </div>
              )}
              {episodeData.entries.length === 0 ? (
                <div className="myths-placeholder">
                  <p>Content coming soon.</p>
                  <p>This episode is currently in development.</p>
                </div>
              ) : (
                <div className="myths-interview">
                  <div className="myths-interview-intro">
                    From the interview with Will Linn for <em>Myths: The Greatest Mysteries of Humanity</em>.
                  </div>

                  <div className="myths-theme-buttons">
                    {episodeData.entries.map((entry, i) => (
                      <button
                        key={i}
                        className={`myths-theme-btn${activeEntry === i ? ' active' : ''}`}
                        onClick={() => setActiveEntry(activeEntry === i ? null : i)}
                      >
                        {deriveLabel(entry, i)}
                      </button>
                    ))}
                  </div>

                  {activeEntry !== null && episodeData.entries[activeEntry] && (
                    <div className="myths-theme-content" key={activeEntry}>
                      {episodeData.entries[activeEntry].question && (
                        <div className="myths-theme-question">
                          {episodeData.entries[activeEntry].question}
                        </div>
                      )}
                      <div className="myths-theme-body">
                        {episodeData.entries[activeEntry].text.split('\n\n').map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Combined Myths Page ── */
function MythsPage() {
  const [activeView, setActiveView] = useState('series');
  const [seriesEpisode, setSeriesEpisode] = useState('overview');
  const [treasuresEpisode, setTreasuresEpisode] = useState('overview');

  const handleViewSwitch = useCallback((view) => {
    setActiveView(view);
  }, []);

  const viewToggle = (
    <div className="myths-view-toggle">
      <button
        className={`myths-view-btn${activeView === 'series' ? ' active' : ''}`}
        onClick={() => handleViewSwitch('series')}
      >
        Myths Series
      </button>
      <button
        className={`myths-view-btn${activeView === 'treasures' ? ' active' : ''}`}
        onClick={() => handleViewSwitch('treasures')}
      >
        Lost Treasures
      </button>
    </div>
  );

  return (
    <div className={`myths-page${activeView === 'treasures' ? ' myths-page--treasures' : ''}`}>
      {activeView === 'series' ? (
        <SeriesContent
          currentEpisode={seriesEpisode}
          onSelectEpisode={setSeriesEpisode}
          viewToggle={viewToggle}
        />
      ) : (
        <TreasuresContent
          currentEpisode={treasuresEpisode}
          onSelectEpisode={setTreasuresEpisode}
          viewToggle={viewToggle}
        />
      )}
    </div>
  );
}

export default MythsPage;
