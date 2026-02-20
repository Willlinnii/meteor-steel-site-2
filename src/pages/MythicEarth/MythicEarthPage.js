import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import sites from '../../data/mythicEarthSites.json';
import './MythicEarthPage.css';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const MAP_CONTAINER = { width: '100%', height: '100%' };

const MAP_CENTER = { lat: 25, lng: 20 };

const MAP_OPTIONS = {
  mapTypeId: 'hybrid',
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  minZoom: 2,
  tilt: 45,
  rotateControl: true,
  gestureHandling: 'greedy',
  styles: [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#e8e8f0' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#0a0a0f' }, { weight: 2 }],
    },
  ],
};

const CATEGORIES = [
  { id: 'sacred-site', label: 'Sacred Sites', singular: 'Sacred Site', color: '#c9a961' },
  { id: 'mythic-location', label: 'Mythic Locations', singular: 'Mythic Location', color: '#c4713a' },
  { id: 'literary-location', label: 'Literary Locations', singular: 'Literary Location', color: '#8b9dc3' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

function makeSvgMarker(color) {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#0a0a0f" stroke-width="1.5"/>
        <circle cx="14" cy="13" r="5" fill="#0a0a0f" opacity="0.3"/>
        <circle cx="14" cy="13" r="3.5" fill="#fff" opacity="0.9"/>
      </svg>`
    )}`,
    scaledSize: { width: 28, height: 40 },
    anchor: { x: 14, y: 40 },
  };
}

function MythicEarthMap({ activeFilters, onSelectSite, markerIcons }) {
  const filteredSites = useMemo(
    () => sites.filter(s => activeFilters.has(s.category)),
    [activeFilters]
  );

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER}
      mapContainerClassName="mythic-earth-map"
      center={MAP_CENTER}
      zoom={3}
      options={MAP_OPTIONS}
    >
      {filteredSites.map(site => (
        <Marker
          key={site.id}
          position={{ lat: site.lat, lng: site.lng }}
          title={site.name}
          icon={markerIcons[site.category]}
          onClick={() => onSelectSite(site)}
        />
      ))}
    </GoogleMap>
  );
}

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

  // Fetch table of contents from Wikisource
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

  // Fetch a chapter
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

function MythicEarthPage() {
  const [activeFilters, setActiveFilters] = useState(
    () => new Set(CATEGORIES.map(c => c.id))
  );
  const [selectedSite, setSelectedSite] = useState(null);
  const detailRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY || '' });

  const toggleFilter = useCallback((catId) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const markerIcons = useMemo(
    () => Object.fromEntries(CATEGORIES.map(c => [c.id, makeSvgMarker(c.color)])),
    []
  );

  const handleSelectSite = useCallback((site) => {
    setSelectedSite(site);
  }, []);

  // Scroll to detail panel when a site is selected
  useEffect(() => {
    if (selectedSite && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSite]);

  if (!API_KEY) {
    return (
      <div className="mythic-earth-page">
        <div className="mythic-earth-map-area">
          <div className="mythic-earth-no-key">
            <h2>Mythic Earth</h2>
            <p>To explore the mythological globe, add your Google Maps API key to the environment:</p>
            <p><code>REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here</code></p>
            <p>Then restart the development server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mythic-earth-page">
      <div className="mythic-earth-map-area">
        {isLoaded ? (
          <MythicEarthMap
            activeFilters={activeFilters}
            onSelectSite={handleSelectSite}
            markerIcons={markerIcons}
          />
        ) : (
          <div className="mythic-earth-loading">Loading globe...</div>
        )}

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
      </div>

      {selectedSite && (
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
