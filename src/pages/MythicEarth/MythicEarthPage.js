import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Viewer, Entity, BillboardGraphics, LabelGraphics } from 'resium';
import {
  Cartesian3, Color, VerticalOrigin, HorizontalOrigin,
  NearFarScalar, Cartesian2, LabelStyle,
  ImageryLayer as CesiumImageryLayer,
  ArcGisMapServerImageryProvider,
  BoundingSphere, Cartographic,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import sites from '../../data/mythicEarthSites.json';
import './MythicEarthPage.css';

/* ArcGIS World Imagery — high-res satellite tiles, free for display */
const baseLayer = CesiumImageryLayer.fromProviderAsync(
  ArcGisMapServerImageryProvider.fromUrl(
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
  )
);

const CATEGORIES = [
  { id: 'sacred-site', label: 'Sacred Sites', singular: 'Sacred Site', color: '#c9a961' },
  { id: 'mythic-location', label: 'Mythic Locations', singular: 'Mythic Location', color: '#c4713a' },
  { id: 'literary-location', label: 'Literary Locations', singular: 'Literary Location', color: '#8b9dc3' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const CATEGORY_COLORS = Object.fromEntries(
  CATEGORIES.map(c => [c.id, Color.fromCssColorString(c.color)])
);

function makePinSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#0a0a0f" stroke-width="1.5"/>
      <circle cx="14" cy="13" r="5" fill="#0a0a0f" opacity="0.3"/>
      <circle cx="14" cy="13" r="3.5" fill="#fff" opacity="0.9"/>
    </svg>`
  )}`;
}

const PIN_SVGS = Object.fromEntries(
  CATEGORIES.map(c => [c.id, makePinSvg(c.color)])
);

/* ── Internal Text Reader ── */
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

function SiteDetail({ site }) {
  const cat = CATEGORY_MAP[site.category];

  return (
    <div className="container">
      <h2 className="stage-heading">{site.name}</h2>
      <div className="mythic-earth-detail-tags">
        <span className={`mythic-earth-detail-tag ${site.category}`}>
          {cat?.singular}
        </span>
        {site.tradition && (
          <span className="mythic-earth-detail-tag tradition">{site.tradition}</span>
        )}
        <span className="mythic-earth-detail-tag region">{site.region}</span>
      </div>
      <div className="section-content">
        <div className="content-area">
          <div className="overview-text">
            {site.description.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {site.excerpt && (
            <div className="mythic-earth-excerpt">
              <h3 className="mythic-earth-excerpt-heading">From the Text</h3>
              <div className="mythic-earth-excerpt-body">
                {site.excerpt.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {site.wikisourcePage ? (
        <TextReader readUrl={site.readUrl} wikisourcePage={site.wikisourcePage} />
      ) : site.readUrl ? (
        <div className="mythic-earth-reader-toggle">
          <a href={site.readUrl} target="_blank" rel="noopener noreferrer" className="mythic-earth-reader-btn">
            Read Full Text
          </a>
        </div>
      ) : null}
    </div>
  );
}

function MythicEarthGlobe({ activeFilters, onSelectSite, onReady, highlightedSiteIds }) {
  const viewerRef = useRef(null);
  const readyFired = useRef(false);

  const highlightSet = useMemo(
    () => new Set(highlightedSiteIds || []),
    [highlightedSiteIds]
  );

  const filteredSites = useMemo(
    () => sites.filter(s => activeFilters.has(s.category)),
    [activeFilters]
  );

  const handleClick = useCallback((site) => {
    onSelectSite(site);
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(site.lng, site.lat, 800000),
        duration: 1.5,
      });
    }
  }, [onSelectSite]);

  // Expose flyTo methods to parent via onReady callback
  useEffect(() => {
    if (readyFired.current) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer || !onReady) return;
    readyFired.current = true;

    onReady({
      flyTo(site) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(site.lng, site.lat, 800000),
          duration: 1.5,
        });
      },
      flyToMultiple(siteList) {
        if (siteList.length === 0) return;
        if (siteList.length === 1) {
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(siteList[0].lng, siteList[0].lat, 800000),
            duration: 1.5,
          });
          return;
        }
        const points = siteList.map(s => Cartesian3.fromDegrees(s.lng, s.lat));
        const sphere = BoundingSphere.fromPoints(points);
        viewer.camera.flyToBoundingSphere(sphere, {
          offset: new Cartographic(0, -0.3, 0),
          duration: 1.8,
        });
      },
    });
  });

  return (
    <Viewer
      ref={viewerRef}
      className="mythic-earth-cesium"
      full={false}
      baseLayer={baseLayer}
      timeline={false}
      animation={false}
      homeButton={false}
      baseLayerPicker={false}
      navigationHelpButton={false}
      sceneModePicker={false}
      geocoder={false}
      fullscreenButton={false}
      selectionIndicator={false}
      infoBox={false}
      scene3DOnly={true}
    >
      {filteredSites.map(site => {
        const highlighted = highlightSet.has(site.id);
        return (
          <Entity
            key={site.id}
            position={Cartesian3.fromDegrees(site.lng, site.lat)}
            name={site.name}
            description={site.description}
            onClick={() => handleClick(site)}
          >
            <BillboardGraphics
              image={PIN_SVGS[site.category]}
              width={highlighted ? 38 : 28}
              height={highlighted ? 54 : 40}
              verticalOrigin={VerticalOrigin.BOTTOM}
              scaleByDistance={highlighted ? new NearFarScalar(1e4, 1.5, 8e6, 0.7) : new NearFarScalar(1e4, 1.2, 8e6, 0.4)}
              pixelOffset={new Cartesian2(0, 0)}
            />
            <LabelGraphics
              text={site.name}
              font={highlighted ? '14px Cinzel, serif' : '12px Cinzel, serif'}
              fillColor={highlighted ? Color.WHITE : (CATEGORY_COLORS[site.category] || Color.WHITE)}
              outlineColor={Color.BLACK}
              outlineWidth={highlighted ? 3 : 2}
              style={LabelStyle.FILL_AND_OUTLINE}
              verticalOrigin={VerticalOrigin.TOP}
              horizontalOrigin={HorizontalOrigin.CENTER}
              pixelOffset={new Cartesian2(0, 6)}
              scaleByDistance={highlighted ? new NearFarScalar(1e4, 1.2, 8e6, 0.3) : new NearFarScalar(1e4, 1, 5e6, 0)}
              showBackground={true}
              backgroundColor={highlighted ? new Color(0.78, 0.66, 0.38, 0.85) : new Color(0.04, 0.04, 0.06, 0.75)}
              backgroundPadding={new Cartesian2(6, 3)}
            />
          </Entity>
        );
      })}
    </Viewer>
  );
}

/* ── Search bar with autocomplete + Atlas AI ── */
function MythicEarthSearch({ onSelectSite, globeApi, onHighlight }) {
  const [query, setQuery] = useState('');
  const [autoResults, setAutoResults] = useState([]);
  const [showAuto, setShowAuto] = useState(false);
  const [atlasLoading, setAtlasLoading] = useState(false);
  const [atlasReply, setAtlasReply] = useState('');
  const [atlasSites, setAtlasSites] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowAuto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete: filter sites client-side
  const handleInput = useCallback((e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setAutoResults([]);
      setShowAuto(false);
      return;
    }
    const lower = q.toLowerCase();
    const matches = sites.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.region.toLowerCase().includes(lower) ||
      (s.tradition && s.tradition.toLowerCase().includes(lower)) ||
      s.category.replace(/-/g, ' ').includes(lower)
    ).slice(0, 8);
    setAutoResults(matches);
    setShowAuto(matches.length > 0);
  }, []);

  // Click autocomplete result: fly to site
  const handleAutoSelect = useCallback((site) => {
    setShowAuto(false);
    setQuery('');
    setAutoResults([]);
    onSelectSite(site);
    if (globeApi.current) {
      globeApi.current.flyTo(site);
    }
  }, [onSelectSite, globeApi]);

  // Atlas search: send query to /api/chat
  const handleAtlasSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || atlasLoading) return;
    setShowAuto(false);
    setAtlasLoading(true);
    setAtlasReply('');
    setAtlasSites([]);

    const userMsg = { role: 'user', content: q };
    const newHistory = [...chatHistory, userMsg].slice(-10); // keep last 5 exchanges (10 messages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          area: 'mythic-earth',
        }),
      });
      const data = await res.json();
      const reply = data.reply || 'No response.';
      const returnedSites = data.sites || [];

      setAtlasReply(reply);
      setAtlasSites(returnedSites);
      setChatHistory([...newHistory, { role: 'assistant', content: reply }].slice(-10));
      onHighlight(returnedSites.map(s => s.id));

      // Navigate globe to returned sites
      if (returnedSites.length > 0 && globeApi.current) {
        if (returnedSites.length === 1) {
          globeApi.current.flyTo(returnedSites[0]);
          onSelectSite(returnedSites[0]);
        } else {
          globeApi.current.flyToMultiple(returnedSites);
        }
      }
    } catch {
      setAtlasReply('Something went wrong reaching Atlas. Please try again.');
    }
    setAtlasLoading(false);
    setQuery('');
  }, [query, atlasLoading, chatHistory, globeApi, onSelectSite, onHighlight]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAtlasSearch();
    }
    if (e.key === 'Escape') {
      setShowAuto(false);
      inputRef.current?.blur();
    }
  }, [handleAtlasSearch]);

  const dismissAtlas = useCallback(() => {
    setAtlasReply('');
    setAtlasSites([]);
    onHighlight([]);
  }, [onHighlight]);

  return (
    <>
      <div className="mythic-earth-search-wrapper" ref={wrapperRef}>
        <div className={`mythic-earth-search-bar${atlasLoading ? ' loading' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className="mythic-earth-search-input"
            placeholder="Search sites or ask Atlas..."
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (autoResults.length > 0) setShowAuto(true); }}
          />
          <button
            className="mythic-earth-search-btn"
            onClick={handleAtlasSearch}
            disabled={atlasLoading || !query.trim()}
            title="Ask Atlas"
          >
            {atlasLoading ? '\u2026' : '\u2192'}
          </button>
        </div>

        {showAuto && autoResults.length > 0 && (
          <div className="mythic-earth-autocomplete">
            {autoResults.map(site => (
              <button
                key={site.id}
                className="mythic-earth-autocomplete-item"
                onClick={() => handleAutoSelect(site)}
              >
                <span
                  className="mythic-earth-autocomplete-dot"
                  style={{ background: CATEGORY_MAP[site.category]?.color }}
                />
                <span className="mythic-earth-autocomplete-name">{site.name}</span>
                <span className="mythic-earth-autocomplete-region">{site.region}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {atlasReply && (
        <div className="mythic-earth-atlas-panel">
          <button className="mythic-earth-atlas-close" onClick={dismissAtlas} title="Close">{'\u2715'}</button>
          <div className="mythic-earth-atlas-reply">{atlasReply}</div>
          {atlasSites.length > 0 && (
            <div className="mythic-earth-atlas-sites">
              {atlasSites.map(site => (
                <button
                  key={site.id}
                  className="mythic-earth-atlas-chip"
                  onClick={() => {
                    onSelectSite(site);
                    if (globeApi.current) globeApi.current.flyTo(site);
                  }}
                >
                  <span
                    className="mythic-earth-autocomplete-dot"
                    style={{ background: CATEGORY_MAP[site.category]?.color }}
                  />
                  {site.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </>
  );
}

function MythicEarthPage({ embedded, onSiteSelect: onSiteSelectExternal, externalSite }) {
  const [activeFilters, setActiveFilters] = useState(
    () => new Set(CATEGORIES.map(c => c.id))
  );
  const [selectedSite, setSelectedSite] = useState(null);
  const [highlightedSiteIds, setHighlightedSiteIds] = useState([]);
  const detailRef = useRef(null);
  const globeApi = useRef(null);

  const toggleFilter = useCallback((catId) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const handleSelectSite = useCallback((site) => {
    if (!embedded) setSelectedSite(site);
    if (onSiteSelectExternal) onSiteSelectExternal(site);
  }, [embedded, onSiteSelectExternal]);

  const handleGlobeReady = useCallback((api) => {
    globeApi.current = api;
  }, []);

  const handleHighlight = useCallback((ids) => {
    setHighlightedSiteIds(ids);
  }, []);

  // Fly globe to site selected from parent content area
  useEffect(() => {
    if (embedded && externalSite && globeApi.current) {
      globeApi.current.flyTo(externalSite);
    }
  }, [externalSite, embedded]);

  useEffect(() => {
    if (selectedSite && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSite]);

  return (
    <div className="mythic-earth-page">
      <div className="mythic-earth-map-area">
        <MythicEarthGlobe
          activeFilters={activeFilters}
          onSelectSite={handleSelectSite}
          onReady={handleGlobeReady}
          highlightedSiteIds={highlightedSiteIds}
        />

        <MythicEarthSearch
          onSelectSite={handleSelectSite}
          globeApi={globeApi}
          onHighlight={handleHighlight}
        />

        {!embedded && (
          <div className="mythic-earth-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`mythic-earth-filter-btn ${cat.id}${activeFilters.has(cat.id) ? ' active' : ''}`}
                onClick={() => toggleFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!embedded && selectedSite && (
        <div className="mythic-earth-detail" ref={detailRef}>
          <button
            className="mythic-earth-detail-close"
            onClick={() => setSelectedSite(null)}
            title="Close"
          >
            {'\u2715'}
          </button>
          <SiteDetail site={selectedSite} />
        </div>
      )}
    </div>
  );
}

export default MythicEarthPage;
