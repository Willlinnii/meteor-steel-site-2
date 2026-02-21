import React, { useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import CircleNav from '../../components/CircleNav';
import { ring1, ring2, ring3, allEpisodes, subtitle as seriesSubtitle, description as seriesDescription, rokuUrl } from '../../data/mythsSeriesData';
import treasuresData from '../../data/treasuresData';
import mythicEarthSites from '../../data/mythicEarthSites.json';
import {
  CULTURES, ARCANA_POSITIONS,
  getArcanaForCulture, getArcanaPosition, getCrossReference,
  buildMinorArcana, getSuitsForCulture,
} from '../../games/mythouse/mythouseCardData';
import { StreetViewEmbed } from '../MythicEarth/MythicEarthPage';
import '../Treasures/TreasuresPage.css';
import './MythsPage.css';

const MythicEarthPage = lazy(() => import('../MythicEarth/MythicEarthPage'));

const MYTHIC_EARTH_CATEGORIES = [
  { id: 'sacred-site', label: 'Sacred Sites', color: '#c9a961' },
  { id: 'mythic-location', label: 'Mythic Locations', color: '#c4713a' },
  { id: 'literary-location', label: 'Literary Locations', color: '#8b9dc3' },
];

/* ── Text Reader (mirrors MythicEarthPage's internal TextReader) ── */
function TextReader({ readUrl, wikisourcePage }) {
  const [chapters, setChapters] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);
  const [chapterText, setChapterText] = useState('');
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [error, setError] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const textRef = useRef(null);

  const openReader = useCallback(async () => {
    setReaderOpen(true);
    if (chapters) return;
    setLoadingIndex(true);
    setError(null);
    try {
      const res = await fetch(`/api/sacred-text?mode=index&page=${encodeURIComponent(wikisourcePage)}`);
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        setChapters(data.chapters);
      } else {
        setError('No chapters found for this text.');
      }
    } catch {
      setError('Failed to load table of contents.');
    }
    setLoadingIndex(false);
  }, [wikisourcePage, chapters]);

  const loadChapter = useCallback(async (chapter) => {
    setActiveChapter(chapter);
    setLoadingChapter(true);
    setChapterText('');
    setError(null);
    try {
      const sectionParam = chapter.section != null ? `&section=${chapter.section}` : '';
      const res = await fetch(`/api/sacred-text?mode=chapter&page=${encodeURIComponent(chapter.page)}${sectionParam}`);
      const data = await res.json();
      if (data.text) {
        setChapterText(data.text);
        if (textRef.current) textRef.current.scrollTop = 0;
      } else {
        setError('Failed to load chapter text.');
      }
    } catch {
      setError('Failed to load chapter text.');
    }
    setLoadingChapter(false);
  }, []);

  if (!readerOpen) {
    return (
      <div className="mythic-earth-reader-toggle">
        <button className="mythic-earth-reader-btn" onClick={openReader}>
          Open Reader
        </button>
        <a href={readUrl} target="_blank" rel="noopener noreferrer" className="mythic-earth-reader-external">
          Read on Wikisource
        </a>
      </div>
    );
  }

  return (
    <div className="mythic-earth-reader">
      <div className="mythic-earth-reader-header">
        <h3 className="mythic-earth-reader-title">Reader</h3>
        <button className="mythic-earth-reader-close" onClick={() => { setReaderOpen(false); setActiveChapter(null); setChapterText(''); }}>
          Close Reader
        </button>
      </div>

      {loadingIndex && (
        <div className="mythic-earth-reader-loading">Loading table of contents...</div>
      )}

      {error && !loadingIndex && !loadingChapter && (
        <div className="mythic-earth-reader-error">
          {error}
          <a href={readUrl} target="_blank" rel="noopener noreferrer"> Read on Sacred Texts instead.</a>
        </div>
      )}

      {chapters && (
        <div className="mythic-earth-reader-body">
          <div className="mythic-earth-reader-chapters">
            <div className="mythic-earth-reader-chapter-list">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  className={`mythic-earth-reader-chapter-btn${activeChapter?.url === ch.url ? ' active' : ''}`}
                  onClick={() => loadChapter(ch)}
                  title={ch.label}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mythic-earth-reader-text" ref={textRef}>
            {loadingChapter ? (
              <div className="mythic-earth-reader-loading">Loading...</div>
            ) : chapterText ? (
              <div className="mythic-earth-reader-content">
                <h4 className="mythic-earth-reader-chapter-heading">{activeChapter?.label}</h4>
                {chapterText.split('\n\n').map((p, i) => {
                  const trimmed = p.trim();
                  if (!trimmed) return null;
                  if (trimmed === '---') return <hr key={i} className="mythic-earth-reader-divider" />;
                  const headingMatch = trimmed.match(/^===\s*(.+?)\s*===$/);
                  if (headingMatch) {
                    return <h5 key={i} className="mythic-earth-reader-section-heading">{headingMatch[1]}</h5>;
                  }
                  return <p key={i} dangerouslySetInnerHTML={{
                    __html: trimmed
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/_(.+?)_/g, '<em>$1</em>')
                  }} />;
                })}
              </div>
            ) : (
              <div className="mythic-earth-reader-placeholder">
                Select a chapter to begin reading.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Motif Index (Stith Thompson) ── */
const TMI_CATEGORIES = [
  { id: 'A', label: 'Mythological Motifs' },
  { id: 'B', label: 'Animals' },
  { id: 'C', label: 'Tabu' },
  { id: 'D', label: 'Magic' },
  { id: 'E', label: 'The Dead' },
  { id: 'F', label: 'Marvels' },
  { id: 'G', label: 'Ogres' },
  { id: 'H', label: 'Tests' },
  { id: 'J', label: 'The Wise and the Foolish' },
  { id: 'K', label: 'Deceptions' },
  { id: 'L', label: 'Reversal of Fortune' },
  { id: 'M', label: 'Ordaining the Future' },
  { id: 'N', label: 'Chance and Fate' },
  { id: 'P', label: 'Society' },
  { id: 'Q', label: 'Rewards and Punishments' },
  { id: 'R', label: 'Captives and Fugitives' },
  { id: 'S', label: 'Unnatural Cruelty' },
  { id: 'T', label: 'Sex' },
  { id: 'U', label: 'The Nature of Life' },
  { id: 'V', label: 'Religion' },
  { id: 'W', label: 'Traits of Character' },
  { id: 'X', label: 'Humor' },
  { id: 'Z', label: 'Miscellaneous Groups of Motifs' },
];

function MotifItem({ entry, isExpanded, onToggle }) {
  return (
    <div className={`motif-item${isExpanded ? ' expanded' : ''}`}>
      <button className="motif-item-row" onClick={onToggle}>
        <span className="motif-code">{entry.m}</span>
        <span className="motif-desc">{entry.d}</span>
        {(entry.r || entry.l) && <span className="motif-has-refs">{'\u25B8'}</span>}
      </button>
      {isExpanded && (
        <div className="motif-detail">
          {entry.a && (
            <div className="motif-detail-addl">{entry.a}</div>
          )}
          {entry.l && entry.l.length > 0 && (
            <div className="motif-detail-locations">
              <span className="motif-detail-label">Locations:</span>
              <span className="motif-detail-loc-list">{entry.l.join(' \u00B7 ')}</span>
            </div>
          )}
          {entry.r && (
            <div className="motif-detail-refs">
              <span className="motif-detail-label">References:</span>
              <span className="motif-detail-ref-text">{entry.r}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MotifIndex() {
  const [catData, setCatData] = useState({});   // { A: [...], B: [...] }
  const [loading, setLoading] = useState(false);
  const [activeCat, setActiveCat] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMotif, setExpandedMotif] = useState(null);
  const listRef = useRef(null);

  // Load a category's data on demand
  const loadCategory = useCallback((letter) => {
    if (catData[letter]) return; // already loaded
    setLoading(true);
    fetch(`/data/tmi/${letter}.json`)
      .then(r => r.json())
      .then(data => {
        setCatData(prev => ({ ...prev, [letter]: data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [catData]);

  // Load active category on mount and when it changes
  useEffect(() => {
    loadCategory(activeCat);
  }, [activeCat, loadCategory]);

  const motifs = catData[activeCat] || [];

  // Search across all loaded categories
  const isSearching = searchQuery.length >= 2;
  const displayMotifs = isSearching
    ? Object.values(catData).flat().filter(entry =>
        entry.m.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.d.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.l && entry.l.some(loc => loc.toLowerCase().includes(searchQuery.toLowerCase())))
      ).slice(0, 200)
    : motifs;

  // Group motifs by major section
  const sections = [];
  if (!isSearching && displayMotifs.length > 0) {
    let currentSection = null;
    for (const entry of displayMotifs) {
      const numPart = entry.m.replace(/^[A-Z]/, '').replace(/\.$/, '');
      const isTopLevel = !numPart.includes('.');
      const num = parseInt(numPart, 10);
      if (isTopLevel && !isNaN(num) && num % 100 === 0 && num >= 100) {
        currentSection = { header: entry.m, title: entry.d, motifs: [] };
        sections.push(currentSection);
      } else if (isTopLevel && !isNaN(num) && num < 100 && sections.length === 0) {
        if (!currentSection) {
          currentSection = { header: displayMotifs[0].m, title: displayMotifs[0].d, motifs: [] };
          sections.push(currentSection);
        }
        if (entry.m !== currentSection.header) {
          currentSection.motifs.push(entry);
        }
      } else {
        if (!currentSection) {
          currentSection = { header: '', title: activeCat, motifs: [] };
          sections.push(currentSection);
        }
        currentSection.motifs.push(entry);
      }
    }
  }

  const handleCatClick = useCallback((catId) => {
    setActiveCat(catId);
    setExpandedMotif(null);
    setSearchQuery('');
    if (listRef.current) listRef.current.scrollTop = 0;
  }, []);

  // Load all categories for search
  const handleSearchFocus = useCallback(() => {
    for (const cat of TMI_CATEGORIES) {
      if (!catData[cat.id]) loadCategory(cat.id);
    }
  }, [catData, loadCategory]);

  const catInfo = TMI_CATEGORIES.find(c => c.id === activeCat);
  const loadedCount = Object.keys(catData).length;

  return (
    <div className="motif-index">
      <div className="motif-index-header">
        <h2 className="motif-index-title">Motif-Index of Folk-Literature</h2>
        <p className="motif-index-subtitle">Stith Thompson's classification of narrative elements in folk-literature</p>
      </div>

      {/* Search */}
      <div className="motif-search-bar">
        <input
          type="text"
          className="motif-search-input"
          placeholder="Search 46,000+ motifs..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setExpandedMotif(null); }}
          onFocus={handleSearchFocus}
        />
        {searchQuery && (
          <button className="motif-search-clear" onClick={() => setSearchQuery('')}>{'\u2715'}</button>
        )}
      </div>

      {/* Category Grid */}
      {!isSearching && (
        <div className="motif-cat-grid">
          {TMI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`motif-cat-btn${activeCat === cat.id ? ' active' : ''}${catData[cat.id] ? ' loaded' : ''}`}
              onClick={() => handleCatClick(cat.id)}
            >
              <span className="motif-cat-letter">{cat.id}</span>
              <span className="motif-cat-label">{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active category info */}
      {!isSearching && catInfo && (
        <div className="motif-cat-info">
          <span className="motif-cat-info-label">{catInfo.id}. {catInfo.label}</span>
          {motifs.length > 0 && <span className="motif-cat-info-count">{motifs.length.toLocaleString()} motifs</span>}
        </div>
      )}

      {isSearching && (
        <div className="motif-cat-info">
          <span className="motif-cat-info-label">Search results</span>
          <span className="motif-cat-info-count">
            {displayMotifs.length >= 200 ? '200+' : displayMotifs.length} matches
            {loadedCount < 23 && ` (${loadedCount}/23 categories loaded)`}
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="motif-loading">
          <span className="mythic-earth-loading-spinner" />
          <span>Loading motifs...</span>
        </div>
      )}

      {/* Motif list */}
      {!loading && motifs.length > 0 && (
        <div className="motif-list" ref={listRef}>
          {isSearching ? (
            displayMotifs.length === 0 ? (
              <div className="motif-empty">No motifs match "{searchQuery}"</div>
            ) : (
              <div className="motif-section">
                {displayMotifs.map(entry => (
                  <MotifItem
                    key={entry.m}
                    entry={entry}
                    isExpanded={expandedMotif === entry.m}
                    onToggle={() => setExpandedMotif(expandedMotif === entry.m ? null : entry.m)}
                  />
                ))}
              </div>
            )
          ) : sections.length > 0 ? (
            sections.map((section, si) => (
              <div key={si} className="motif-section">
                <div className="motif-section-header">
                  <span className="motif-section-code">{section.header}</span>
                  <span className="motif-section-title">{section.title}</span>
                </div>
                {section.motifs.map(entry => (
                  <MotifItem
                    key={entry.m}
                    entry={entry}
                    isExpanded={expandedMotif === entry.m}
                    onToggle={() => setExpandedMotif(expandedMotif === entry.m ? null : entry.m)}
                  />
                ))}
              </div>
            ))
          ) : (
            <div className="motif-empty">No motifs in this category.</div>
          )}
        </div>
      )}

      <div className="motif-attribution">
        Thompson, Stith. <em>Motif-Index of Folk-Literature</em>. Indiana University Press, 1955-1958. Data: <a href="https://github.com/fbkarsdorp/tmi" target="_blank" rel="noopener noreferrer">fbkarsdorp/tmi</a> (Apache-2.0).
      </div>
    </div>
  );
}

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

/* ── Tarot constants ── */
const TYPE_LABELS = { element: 'Element', planet: 'Planet', zodiac: 'Zodiac' };
const TYPE_SYMBOLS = {
  element: { Air: '\u2601', Water: '\u2248', Fire: '\u2632' },
  planet: { Mercury: '\u263F', Moon: '\u263D', Venus: '\u2640', Jupiter: '\u2643', Mars: '\u2642', Sun: '\u2609', Saturn: '\u2644' },
  zodiac: { Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B', Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F', Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653' },
};

/* ── Tarot Decks content ── */
function TarotContent() {
  const [activeCulture, setActiveCulture] = useState('tarot');
  const [expandedCard, setExpandedCard] = useState(null);
  const [arcanaView, setArcanaView] = useState('major');
  const [minorSuitFilter, setMinorSuitFilter] = useState(null);

  const arcanaCards = useMemo(() => {
    if (activeCulture === 'tarot') return [];
    return getArcanaForCulture(activeCulture);
  }, [activeCulture]);

  const minorCards = useMemo(() => buildMinorArcana(activeCulture), [activeCulture]);
  const cultureSuits = useMemo(() => getSuitsForCulture(activeCulture), [activeCulture]);

  const filteredMinor = useMemo(() => {
    if (!minorSuitFilter) return minorCards;
    return minorCards.filter(c => c.suit === minorSuitFilter);
  }, [minorCards, minorSuitFilter]);

  const crossRef = useMemo(() => {
    if (!expandedCard) return [];
    return getCrossReference(expandedCard.number);
  }, [expandedCard]);

  const position = useMemo(() => {
    if (!expandedCard) return null;
    return getArcanaPosition(expandedCard.number);
  }, [expandedCard]);

  const isTarotView = activeCulture === 'tarot';

  return (
    <div className="tarot-section">
      <div className="tarot-section-header">
        <h2 className="tarot-section-title">Tarot Decks</h2>
        <p className="tarot-section-subtitle">
          22 Major Arcana and 56 Minor Arcana across 7 mythic cultures.
          Each position maps to the same archetype — tap any card to see its cross-cultural variants.
        </p>
      </div>

      {/* Culture tabs */}
      <div className="mc-deck-tabs">
        <button
          className={`mc-tab${activeCulture === 'tarot' ? ' active' : ''}`}
          style={{ '--tab-color': 'var(--accent-gold)' }}
          onClick={() => { setActiveCulture('tarot'); setExpandedCard(null); setMinorSuitFilter(null); }}
        >
          Tarot
          <span className="mc-tab-count">78</span>
        </button>
        {CULTURES.map(c => (
          <button
            key={c.key}
            className={`mc-tab${activeCulture === c.key ? ' active' : ''}`}
            onClick={() => { setActiveCulture(c.key); setExpandedCard(null); setMinorSuitFilter(null); }}
          >
            {c.label}
            <span className="mc-tab-count">78</span>
          </button>
        ))}
      </div>

      {/* Major / Minor toggle */}
      <div className="mc-sub-toggle">
        <button
          className={`mc-sub-tab${arcanaView === 'major' ? ' active' : ''}`}
          onClick={() => setArcanaView('major')}
        >
          Major Arcana
          <span className="mc-tab-count">22</span>
        </button>
        <button
          className={`mc-sub-tab${arcanaView === 'minor' ? ' active' : ''}`}
          onClick={() => setArcanaView('minor')}
        >
          Minor Arcana
          <span className="mc-tab-count">56</span>
        </button>
      </div>

      {/* MAJOR ARCANA */}
      {arcanaView === 'major' && (
        <>
          {isTarotView && (
            <div className="mc-card-grid">
              {ARCANA_POSITIONS.map(pos => {
                const sym = (TYPE_SYMBOLS[pos.type] || {})[pos.correspondence] || '';
                return (
                  <button
                    key={pos.number}
                    className="mc-card mc-arcana-card mc-tarot-card"
                    onClick={() => setExpandedCard({ number: pos.number, name: pos.tarot, culture: 'tarot' })}
                  >
                    <span className="mc-card-number">#{pos.number}</span>
                    <span className="mc-tarot-symbol">{sym}</span>
                    <span className="mc-card-name">{pos.tarot}</span>
                    <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                      {pos.correspondence}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isTarotView && (
            <div className="mc-card-grid">
              {arcanaCards.map(card => {
                const pos = getArcanaPosition(card.number);
                return (
                  <button
                    key={`${card.culture}-${card.number}`}
                    className="mc-card mc-arcana-card"
                    onClick={() => setExpandedCard(card)}
                  >
                    <span className="mc-card-number">#{card.number}</span>
                    <span className="mc-card-name">{card.name}</span>
                    <span className="mc-card-brief">
                      {card.description.substring(0, 100)}{card.description.length > 100 ? '...' : ''}
                    </span>
                    {pos && (
                      <span className={`mc-card-correspondence mc-corr-${pos.type}`}>
                        {pos.correspondence}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MINOR ARCANA */}
      {arcanaView === 'minor' && (
        <>
          <div className="mc-deck-tabs mc-suit-tabs">
            <button
              className={`mc-tab${minorSuitFilter === null ? ' active' : ''}`}
              onClick={() => setMinorSuitFilter(null)}
            >
              All Suits
            </button>
            {cultureSuits.map(s => (
              <button
                key={s.key}
                className={`mc-tab${minorSuitFilter === s.key ? ' active' : ''}`}
                style={{ '--tab-color': s.color }}
                onClick={() => setMinorSuitFilter(s.key)}
              >
                <span style={{ color: s.color }}>{s.symbol}</span> {s.name}
              </button>
            ))}
          </div>

          {minorSuitFilter && (() => {
            const suit = cultureSuits.find(s => s.key === minorSuitFilter);
            return suit?.desc ? (
              <p className="mc-suit-desc">
                <span className="mc-suit-element" style={{ color: suit.color }}>{suit.element}</span>
                {' \u2014 '}{suit.desc}
              </p>
            ) : null;
          })()}

          <div className="mc-card-grid mc-minor-grid">
            {filteredMinor.map(card => (
              <div
                key={card.id}
                className={`mc-minor-card${card.isCourt ? ' mc-court' : ''}`}
              >
                <span className="mc-minor-rank-top">{card.isCourt ? card.rankLabel.charAt(0) : card.rankLabel}</span>
                <span className="mc-minor-suit" style={{ color: card.suitColor }}>
                  {card.suitSymbol}
                </span>
                <span className="mc-minor-name">{card.rankLabel}</span>
                <span className="mc-minor-suit-label" style={{ color: card.suitColor }}>
                  {card.suitName}
                </span>
                <span className="mc-minor-value">{card.value} pt{card.value !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail overlay */}
      {expandedCard && (
        <div className="mc-detail-overlay" onClick={() => setExpandedCard(null)}>
          <div className="mc-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="mc-detail-header">
              <span className="mc-card-number" style={{ fontSize: '1rem' }}>
                #{expandedCard.number}
              </span>
              <h3 className="mc-detail-name">{expandedCard.name}</h3>
              {expandedCard.culture !== 'tarot' && (
                <span className="mc-detail-culture">
                  {CULTURES.find(c => c.key === expandedCard.culture)?.label}
                </span>
              )}
              <button className="mc-detail-close" onClick={() => setExpandedCard(null)}>
                &times;
              </button>
            </div>

            <div className="mc-detail-body">
              {position && (
                <div style={{ marginBottom: 12 }}>
                  <span className={`mc-card-correspondence mc-corr-${position.type}`}>
                    {TYPE_LABELS[position.type]}: {position.correspondence}
                  </span>
                </div>
              )}

              {expandedCard.culture !== 'tarot' && position && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontStyle: 'italic', margin: '0 0 8px' }}>
                  Tarot: {position.tarot}
                </p>
              )}

              {expandedCard.description && (
                <p className="mc-section-text">{expandedCard.description}</p>
              )}

              <div className="mc-crossref">
                <h4 className="mc-section-heading">
                  {expandedCard.culture === 'tarot' ? 'Across 7 Cultures' : 'Same Position Across Cultures'}
                </h4>
                {crossRef.map(ref => {
                  const cultureLabel = CULTURES.find(c => c.key === ref.culture)?.label;
                  const isCurrent = expandedCard.culture !== 'tarot' && ref.culture === expandedCard.culture;
                  return (
                    <button
                      key={ref.culture}
                      className={`mc-crossref-item${isCurrent ? ' active' : ''}`}
                      onClick={() => {
                        setActiveCulture(ref.culture);
                        setExpandedCard(ref);
                      }}
                    >
                      <span className="mc-crossref-culture">{cultureLabel}</span>
                      <span className="mc-crossref-name">{ref.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Series content ── */
function SeriesContent({ currentEpisode, onSelectEpisode, viewToggle }) {
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
          clockwise={false}
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
  const [activeView, setActiveView] = useState('earth');
  const [seriesEpisode, setSeriesEpisode] = useState('overview');
  const [treasuresEpisode, setTreasuresEpisode] = useState('overview');
  const [selectedMythicSite, setSelectedMythicSite] = useState(null);
  const [mythicEarthCategory, setMythicEarthCategory] = useState('sacred-site');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {activeView === 'earth' ? (
        <>
          <Suspense fallback={<div className="mythic-earth-loading"><span className="mythic-earth-loading-spinner" /></div>}>
            <MythicEarthPage
              embedded
              onSiteSelect={setSelectedMythicSite}
              externalSite={selectedMythicSite}
            />
          </Suspense>

          <div className="mythic-earth-content-area">
            <div className="mythic-earth-categories">
              {MYTHIC_EARTH_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`mythic-earth-cat-btn${mythicEarthCategory === cat.id ? ' active' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => { setMythicEarthCategory(cat.id); setSelectedMythicSite(null); }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {selectedMythicSite ? (
              <div className="mythic-earth-site-detail">
                <button className="mythic-earth-back" onClick={() => setSelectedMythicSite(null)}>
                  {'\u2190'} Back to {MYTHIC_EARTH_CATEGORIES.find(c => c.id === mythicEarthCategory)?.label}
                </button>
                <h3>{selectedMythicSite.name}</h3>
                <div className="mythic-earth-site-tags">
                  <span
                    className="mythic-earth-tag"
                    style={{ background: MYTHIC_EARTH_CATEGORIES.find(c => c.id === selectedMythicSite.category)?.color }}
                  >
                    {MYTHIC_EARTH_CATEGORIES.find(c => c.id === selectedMythicSite.category)?.label}
                  </span>
                  {selectedMythicSite.tradition && (
                    <span className="mythic-earth-tag tradition">{selectedMythicSite.tradition}</span>
                  )}
                  <span className="mythic-earth-tag region">{selectedMythicSite.region}</span>
                </div>
                <StreetViewEmbed site={selectedMythicSite} />
                <div className="mythic-earth-site-text">
                  {selectedMythicSite.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>
                {selectedMythicSite.excerpt && (
                  <div className="mythic-earth-excerpt-block">
                    <h4>From the Text</h4>
                    <blockquote>{selectedMythicSite.excerpt}</blockquote>
                  </div>
                )}

                {selectedMythicSite.wikisourcePage ? (
                  <TextReader readUrl={selectedMythicSite.readUrl} wikisourcePage={selectedMythicSite.wikisourcePage} />
                ) : selectedMythicSite.readUrl ? (
                  <div className="mythic-earth-reader-toggle">
                    <a href={selectedMythicSite.readUrl} target="_blank" rel="noopener noreferrer" className="mythic-earth-reader-btn">
                      Read Full Text
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mythic-earth-site-grid">
                {mythicEarthSites.filter(s => s.category === mythicEarthCategory).map(site => (
                  <button
                    key={site.id}
                    className="mythic-earth-site-card"
                    onClick={() => setSelectedMythicSite(site)}
                  >
                    <span className="site-card-name">{site.name}</span>
                    <span className="site-card-region">{site.region}</span>
                    {site.tradition && <span className="site-card-tradition">{site.tradition}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : activeView === 'series' ? (
        <SeriesContent
          currentEpisode={seriesEpisode}
          onSelectEpisode={setSeriesEpisode}
          viewToggle={viewToggle}
        />
      ) : activeView === 'treasures' ? (
        <TreasuresContent
          currentEpisode={treasuresEpisode}
          onSelectEpisode={setTreasuresEpisode}
          viewToggle={viewToggle}
        />
      ) : activeView === 'motifs' ? (
        <MotifIndex />
      ) : activeView === 'tarot' ? (
        <TarotContent />
      ) : null}

      {/* Floating toggle buttons */}
      <div className="myths-float-toggles" data-expanded={mobileMenuOpen || undefined}>
        <button
          className="myths-float-btn myths-mobile-mode-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          title={mobileMenuOpen ? 'Collapse buttons' : 'Show mode buttons'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
              </>
            )}
          </svg>
        </button>
        <button
          className={`myths-float-btn${activeView === 'earth' ? ' active' : ''}`}
          onClick={() => handleViewSwitch('earth')}
          title="Mythic Earth"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="4.5" ry="10" />
            <path d="M2.5 9 L21.5 9" />
            <path d="M2.5 15 L21.5 15" />
          </svg>
        </button>
        <button
          className={`myths-float-btn${activeView === 'motifs' ? ' active' : ''}`}
          onClick={() => handleViewSwitch('motifs')}
          title="Motif Index"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3z" />
            <path d="M7 7h4" />
            <path d="M7 11h10" />
            <path d="M7 15h10" />
            <path d="M7 19h6" />
          </svg>
        </button>
        <button
          className={`myths-float-btn${activeView === 'tarot' ? ' active' : ''}`}
          onClick={() => handleViewSwitch('tarot')}
          title="Tarot Decks"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="2.5" />
            <path d="M12 7.5v6" />
            <path d="M9 10l3 1.5 3-1.5" />
            <path d="M10 13.5l2 4 2-4" />
            <path d="M8 9l-2-3" strokeWidth="1.4" />
            <path d="M5 20h6" />
            <path d="M11 20l2-2.5" />
            <circle cx="17" cy="3.5" r="1.5" fill="currentColor" opacity="0.3" />
          </svg>
        </button>
        <button
          className={`myths-float-btn${activeView === 'series' || activeView === 'treasures' ? ' active' : ''}`}
          onClick={() => handleViewSwitch(activeView === 'treasures' ? 'treasures' : 'series')}
          title="Myths Content"
        >
          <span className="myths-float-m">M</span>
        </button>
      </div>
    </div>
  );
}

export default MythsPage;
