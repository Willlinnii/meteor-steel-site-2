import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Viewer, Entity, BillboardGraphics, LabelGraphics } from 'resium';
import {
  Cartesian3, Color, VerticalOrigin, HorizontalOrigin,
  NearFarScalar, Cartesian2, LabelStyle,
  ImageryLayer as CesiumImageryLayer,
  ArcGisMapServerImageryProvider,
  BoundingSphere, Cartographic,
  Math as CesiumMath, HeadingPitchRoll,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import sites from '../../data/mythicEarthSites.json';
import movements from '../../data/mythicEarthMovements.json';
import libraryData from '../../data/mythSalonLibrary.json';
import { useAreaOverride, useXRMode } from '../../App';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { usePageTracking } from '../../coursework/CourseworkContext';
import './MythicEarthPage.css';

import { apiFetch } from '../../lib/chatApi';
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
  { id: 'temple', label: 'Temples', singular: 'Temple', color: '#c47a5a' },
  { id: 'library', label: 'Library', singular: 'Library', color: '#a89060' },
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

function makeLibraryPinSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#0a0a0f" stroke-width="1.5"/>
      <rect x="8" y="7" width="12" height="13" rx="1" fill="#0a0a0f" opacity="0.3"/>
      <rect x="9" y="8" width="10" height="11" rx="0.5" fill="#fff" opacity="0.9"/>
      <line x1="11" y1="11" x2="17" y2="11" stroke="#0a0a0f" stroke-width="0.8" opacity="0.4"/>
      <line x1="11" y1="13.5" x2="17" y2="13.5" stroke="#0a0a0f" stroke-width="0.8" opacity="0.4"/>
      <line x1="11" y1="16" x2="15" y2="16" stroke="#0a0a0f" stroke-width="0.8" opacity="0.4"/>
    </svg>`
  )}`;
}

function makeTemplePinSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#0a0a0f" stroke-width="1.5"/>
      <path d="M14 5 L8 10 L8 19 L20 19 L20 10 Z" fill="#0a0a0f" opacity="0.3"/>
      <path d="M14 6 L9 10.5 L9 18 L19 18 L19 10.5 Z" fill="#fff" opacity="0.9"/>
      <rect x="10.5" y="11" width="2.5" height="7" fill="#0a0a0f" opacity="0.25"/>
      <rect x="15" y="11" width="2.5" height="7" fill="#0a0a0f" opacity="0.25"/>
    </svg>`
  )}`;
}

const PIN_SVGS = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.id === 'temple' ? makeTemplePinSvg(c.color) : c.id === 'library' ? makeLibraryPinSvg(c.color) : makePinSvg(c.color)])
);

function makeUserPinSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#6bc5a0" stroke-width="2.5"/>
      <circle cx="14" cy="13" r="5" fill="#0a0a0f" opacity="0.3"/>
      <circle cx="14" cy="13" r="3.5" fill="#fff" opacity="0.9"/>
    </svg>`
  )}`;
}

const USER_PIN_SVGS = Object.fromEntries(
  CATEGORIES.map(c => [c.id, makeUserPinSvg(c.color)])
);

const USER_LABEL_COLOR = Color.fromCssColorString('#6bc5a0');

function makeMovementPinSvg(color) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 30 16 30s16-18 16-30C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#0a0a0f" stroke-width="1.5"/>
      <circle cx="16" cy="15" r="8" fill="#0a0a0f" opacity="0.3"/>
      <path d="M16 8 L17.5 13 L23 13 L18.5 16.5 L20 22 L16 18.5 L12 22 L13.5 16.5 L9 13 L14.5 13 Z" fill="#fff" opacity="0.9"/>
    </svg>`
  )}`;
}

const MOVEMENT_PIN_SVGS = Object.fromEntries(
  movements.map(m => [m.id, makeMovementPinSvg(m.color)])
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

function StreetViewEmbed({ site }) {
  const [open, setOpen] = useState(false);
  const mapsKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const sv = typeof site.streetView === 'object' ? site.streetView : {};
  const heading = sv.heading ?? 0;
  const pitch = sv.pitch ?? 0;
  const fov = sv.fov ?? 90;

  if (!site.streetView) return null;

  return (
    <div className="mythic-earth-streetview">
      <button
        className="mythic-earth-streetview-btn"
        onClick={() => setOpen(!open)}
      >
        {open ? '\u2715  Close Street View' : '\u{1F30D}  Explore in Street View'}
      </button>

      {open && (
        <div className="mythic-earth-streetview-container">
          {mapsKey ? (
            <iframe
              title={`Street View of ${site.name}`}
              src={`https://www.google.com/maps/embed/v1/streetview?key=${mapsKey}&location=${site.lat},${site.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`}
              className="mythic-earth-streetview-iframe"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="mythic-earth-streetview-fallback">
              <p>Add a <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> for embedded Street View.</p>
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${site.lat},${site.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mythic-earth-streetview-link"
              >
                Open in Google Street View
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SiteDetail({ site, isPilgrimage, onTogglePilgrimage, isLoggedIn, onDeleteSite, isSaved, onToggleSave }) {
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
        {site.isUserSite && (
          <span className="mythic-earth-detail-tag" style={{ background: 'rgba(107,197,160,0.12)', borderColor: 'rgba(107,197,160,0.4)', color: '#6bc5a0' }}>My Site</span>
        )}
        {isLoggedIn && !site.isUserSite && (
          <button
            className={`mythic-earth-detail-tag mythic-earth-save-btn${isSaved ? ' saved' : ''}`}
            onClick={() => onToggleSave(site)}
          >
            {isSaved ? '\u2713 My Sites' : '+ My Sites'}
          </button>
        )}
      </div>

      {isLoggedIn && !site.isUserSite && (
        <div style={{ textAlign: 'center', margin: '12px 0 4px' }}>
          <button
            className={`mythic-earth-pilgrimage-btn${isPilgrimage ? ' added' : ''}`}
            onClick={() => onTogglePilgrimage(site)}
          >
            {isPilgrimage ? '\u2713  Added to My Pilgrimages' : 'Add to My Pilgrimages'}
          </button>
        </div>
      )}

      {site.isUserSite && onDeleteSite && (
        <div style={{ textAlign: 'center', margin: '12px 0 4px' }}>
          <button
            className="mythic-earth-delete-site-btn"
            onClick={() => onDeleteSite(site.id)}
          >
            Delete This Site
          </button>
        </div>
      )}

      <StreetViewEmbed site={site} />

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

function MovementDetail({ movement }) {
  const collections = (movement.connectedCollections || [])
    .map(id => libraryData.shelves.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className="container">
      <h2 className="stage-heading">{movement.name}</h2>
      <div className="me-movement-meta">
        {movement.subtitle} &middot; {movement.location} &middot; Founded {movement.founded}
      </div>

      <StreetViewEmbed site={movement} />

      <div className="section-content">
        <div className="content-area">
          <div className="overview-text">
            {movement.description.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="me-figures-section">
        <h3 className="mythic-earth-excerpt-heading">Key Figures</h3>
        <div className="me-movement-figures">
          {movement.keyFigures.map((fig, i) => (
            <span key={i} className="me-figure-chip">
              {fig.name}
              <span className="me-figure-role">{fig.role}</span>
            </span>
          ))}
        </div>
      </div>

      {collections.map(shelf => (
        <div key={shelf.id} className="me-collection">
          <h3 className="me-collection-name">{shelf.name}</h3>
          <p className="me-collection-desc">{shelf.description}</p>
          <div className="me-collection-books">
            {shelf.books.map((book, i) => (
              <div key={i} className="me-book-row">
                {book.volume && <span className="me-book-vol">{book.volume} &middot; </span>}
                <span className="me-book-title">{book.title}</span>
                {' '}&mdash; {book.author}{book.editor ? ` (ed. ${book.editor})` : ''}, {book.year}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MythicEarthGlobe({ activeFilters, onSelectSite, onReady, highlightedSiteIds, cameraAR, vrSupported, onViewerReady, initialLocation, activeTab, onSelectMovement, showPilgrimagesOnly, pilgrimageIds, extraSites }) {
  const viewerRef = useRef(null);
  const readyFired = useRef(false);
  const geoApplied = useRef(false);

  const highlightSet = useMemo(
    () => new Set(highlightedSiteIds || []),
    [highlightedSiteIds]
  );

  const filteredSites = useMemo(() => {
    const curated = sites.filter(s => {
      if (!activeFilters.has(s.category)) return false;
      if (showPilgrimagesOnly && pilgrimageIds && !pilgrimageIds.has(s.id)) return false;
      return true;
    });
    const userList = (extraSites || []).filter(s => activeFilters.has(s.category));
    return [...curated, ...userList];
  }, [activeFilters, showPilgrimagesOnly, pilgrimageIds, extraSites]);

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

  const handleMovementClick = useCallback((movement) => {
    if (onSelectMovement) onSelectMovement(movement);
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(movement.lng, movement.lat, 800000),
        duration: 1.5,
      });
    }
  }, [onSelectMovement]);

  // Expose flyTo methods + viewer to parent via onReady callback
  useEffect(() => {
    if (readyFired.current) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    readyFired.current = true;

    // Center globe on user's IP-based location (instant, no animation)
    if (initialLocation && !geoApplied.current) {
      geoApplied.current = true;
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(initialLocation.lng, initialLocation.lat, 20000000),
      });
    }

    // Ensure touch events work on mobile by setting touch-action on the canvas
    const canvas = viewer.canvas;
    if (canvas) canvas.style.touchAction = 'none';

    if (onViewerReady) onViewerReady(viewer);

    if (onReady) {
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
    }
  });

  // Apply geo-centering if location arrives after viewer was already initialized
  useEffect(() => {
    if (geoApplied.current || !initialLocation) return;
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    geoApplied.current = true;
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(initialLocation.lng, initialLocation.lat, 20000000),
    });
  }, [initialLocation]);

  // Make Cesium scene transparent in AR mode
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    const scene = viewer.scene;
    if (cameraAR) {
      scene.backgroundColor = new Color(0, 0, 0, 0);
      if (scene.skyBox) scene.skyBox.show = false;
      if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
      if (scene.sun) scene.sun.show = false;
      if (scene.moon) scene.moon.show = false;
      scene.globe.baseColor = new Color(0, 0, 0, 0);
    } else {
      scene.backgroundColor = Color.BLACK;
      if (scene.skyBox) scene.skyBox.show = true;
      if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
      if (scene.sun) scene.sun.show = true;
      if (scene.moon) scene.moon.show = true;
      scene.globe.baseColor = Color.BLACK;
    }
  }, [cameraAR]);

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
      vrButton={vrSupported || false}
      selectionIndicator={false}
      infoBox={false}
      scene3DOnly={true}
    >
      {activeTab === 'sites' && filteredSites.map(site => {
        const highlighted = highlightSet.has(site.id);
        const isUser = site.isUserSite;
        return (
          <Entity
            key={site.id}
            position={Cartesian3.fromDegrees(site.lng, site.lat)}
            name={site.name}
            description={site.description}
            onClick={() => handleClick(site)}
          >
            <BillboardGraphics
              image={isUser ? (USER_PIN_SVGS[site.category] || USER_PIN_SVGS['sacred-site']) : PIN_SVGS[site.category]}
              width={highlighted ? 38 : 28}
              height={highlighted ? 54 : 40}
              verticalOrigin={VerticalOrigin.BOTTOM}
              scaleByDistance={highlighted ? new NearFarScalar(1e4, 1.5, 8e6, 0.7) : new NearFarScalar(1e4, 1.2, 8e6, 0.4)}
              pixelOffset={new Cartesian2(0, 0)}
            />
            <LabelGraphics
              text={site.name}
              font={highlighted ? '14px Cinzel, serif' : '12px Cinzel, serif'}
              fillColor={highlighted ? Color.WHITE : (isUser ? USER_LABEL_COLOR : (CATEGORY_COLORS[site.category] || Color.WHITE))}
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
      {activeTab === 'movements' && movements.map(m => (
        <Entity
          key={m.id}
          position={Cartesian3.fromDegrees(m.lng, m.lat)}
          name={m.name}
          onClick={() => handleMovementClick(m)}
        >
          <BillboardGraphics
            image={MOVEMENT_PIN_SVGS[m.id]}
            width={32}
            height={46}
            verticalOrigin={VerticalOrigin.BOTTOM}
            scaleByDistance={new NearFarScalar(1e4, 1.4, 8e6, 0.6)}
            pixelOffset={new Cartesian2(0, 0)}
          />
          <LabelGraphics
            text={m.name}
            font="14px Cinzel, serif"
            fillColor={Color.fromCssColorString('#d4a853')}
            outlineColor={Color.BLACK}
            outlineWidth={3}
            style={LabelStyle.FILL_AND_OUTLINE}
            verticalOrigin={VerticalOrigin.TOP}
            horizontalOrigin={HorizontalOrigin.CENTER}
            pixelOffset={new Cartesian2(0, 8)}
            scaleByDistance={new NearFarScalar(1e4, 1.2, 1e7, 0.4)}
            showBackground={true}
            backgroundColor={new Color(0.04, 0.04, 0.06, 0.8)}
            backgroundPadding={new Cartesian2(8, 4)}
          />
        </Entity>
      ))}
    </Viewer>
  );
}

/* ── Search bar with autocomplete + Atlas AI ── */
function MythicEarthSearch({ onSelectSite, globeApi, onHighlight, activeTab, onSelectMovement, userSites }) {
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

  // Autocomplete: filter sites or movements client-side
  const handleInput = useCallback((e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setAutoResults([]);
      setShowAuto(false);
      return;
    }
    const lower = q.toLowerCase();
    let matches;
    if (activeTab === 'movements') {
      matches = movements.filter(m =>
        m.name.toLowerCase().includes(lower) ||
        m.location.toLowerCase().includes(lower) ||
        m.keyFigures.some(f => f.name.toLowerCase().includes(lower))
      ).map(m => ({ ...m, _isMovement: true })).slice(0, 8);
    } else {
      const allSites = [...sites, ...(userSites || [])];
      matches = allSites.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.region.toLowerCase().includes(lower) ||
        (s.tradition && s.tradition.toLowerCase().includes(lower)) ||
        s.category.replace(/-/g, ' ').includes(lower)
      ).slice(0, 8);
    }
    setAutoResults(matches);
    setShowAuto(matches.length > 0);
  }, [activeTab, userSites]);

  // Click autocomplete result: fly to site or movement
  const handleAutoSelect = useCallback((item) => {
    setShowAuto(false);
    setQuery('');
    setAutoResults([]);
    if (item._isMovement) {
      if (onSelectMovement) onSelectMovement(item);
      if (globeApi.current) globeApi.current.flyTo(item);
    } else {
      onSelectSite(item);
      if (globeApi.current) globeApi.current.flyTo(item);
    }
  }, [onSelectSite, onSelectMovement, globeApi]);

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
      const res = await apiFetch('/api/chat', {
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
            placeholder={activeTab === 'movements' ? "Search movements..." : "Search sites or ask Atlas..."}
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
            {autoResults.map(item => (
              <button
                key={item.id}
                className="mythic-earth-autocomplete-item"
                onClick={() => handleAutoSelect(item)}
              >
                <span
                  className="mythic-earth-autocomplete-dot"
                  style={{ background: item._isMovement ? (item.color || '#d4a853') : CATEGORY_MAP[item.category]?.color }}
                />
                <span className="mythic-earth-autocomplete-name">{item.name}</span>
                <span className="mythic-earth-autocomplete-region">{item._isMovement ? item.location : item.region}</span>
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

function AddSiteForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [category, setCategory] = useState('sacred-site');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');

  const valid = name.trim() && lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onAdd({
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
      category,
      region: region.trim(),
      description: description.trim(),
    });
    setName(''); setLat(''); setLng(''); setCategory('sacred-site'); setRegion(''); setDescription('');
  };

  return (
    <form className="mythic-earth-add-site-form" onSubmit={handleSubmit}>
      <h4>Add a Site</h4>
      <div className="mythic-earth-add-site-row">
        <label>
          Name
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Sacred Spring" />
        </label>
      </div>
      <div className="mythic-earth-add-site-row">
        <label>
          Latitude
          <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 37.9715" />
        </label>
        <label>
          Longitude
          <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} placeholder="e.g. 23.7267" />
        </label>
      </div>
      <div className="mythic-earth-add-site-row">
        <label>
          Category
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.singular || c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Region
          <input type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Greece" />
        </label>
      </div>
      <div className="mythic-earth-add-site-row full">
        <label>
          Description
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Why is this place meaningful to you?" />
        </label>
      </div>
      <div className="mythic-earth-add-site-actions">
        <button type="submit" className="mythic-earth-add-site-submit" disabled={!valid}>Add Site</button>
        {onCancel && <button type="button" className="mythic-earth-add-site-cancel" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function MythicEarthPage({ embedded, onSiteSelect: onSiteSelectExternal, externalSite, externalFilters, externalTourSiteIds }) {
  const { track } = usePageTracking('mythic-earth');
  const { xrMode } = useXRMode();
  const { user } = useAuth();
  const { pilgrimages, addPilgrimage, removePilgrimage, userSites, addUserSite, removeUserSite, savedSiteIds, saveSite, unsaveSite } = useProfile();
  const [activeTab, setActiveTab] = useState('sites');
  const [showPilgrimagesOnly, setShowPilgrimagesOnly] = useState(false);
  const [showMySites, setShowMySites] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const pilgrimageIdSet = useMemo(
    () => new Set(Object.keys(pilgrimages || {})),
    [pilgrimages]
  );

  const userSitesList = useMemo(
    () => Object.values(userSites || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [userSites]
  );

  const savedSiteIdSet = useMemo(
    () => new Set(Object.keys(savedSiteIds || {})),
    [savedSiteIds]
  );

  // Resolve saved curated sites by ID from the imported sites array
  const savedCuratedSites = useMemo(
    () => sites.filter(s => savedSiteIdSet.has(s.id)),
    [savedSiteIdSet]
  );

  // Combined list for the My Sites panel: saved curated sites + user-created sites
  const allMySites = useMemo(
    () => [...savedCuratedSites, ...userSitesList],
    [savedCuratedSites, userSitesList]
  );

  const handleToggleSavedSite = useCallback((site) => {
    if (savedSiteIdSet.has(site.id)) {
      unsaveSite(site.id);
    } else {
      saveSite(site.id);
    }
  }, [savedSiteIdSet, saveSite, unsaveSite]);

  const handleTogglePilgrimage = useCallback((site) => {
    if (pilgrimageIdSet.has(site.id)) {
      removePilgrimage(site.id);
    } else {
      addPilgrimage(site);
    }
  }, [pilgrimageIdSet, addPilgrimage, removePilgrimage]);

  const handleAddUserSite = useCallback((siteData) => {
    addUserSite(siteData);
    setShowAddForm(false);
  }, [addUserSite]);

  const handleDeleteUserSite = useCallback((siteId) => {
    removeUserSite(siteId);
    setSelectedSite(null);
  }, [removeUserSite]);
  const [activeFilters, setActiveFilters] = useState(
    () => new Set(CATEGORIES.map(c => c.id))
  );
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [highlightedSiteIds, setHighlightedSiteIds] = useState([]);
  const [initialLocation, setInitialLocation] = useState(null);
  const detailRef = useRef(null);
  const globeApi = useRef(null);

  // VR/AR state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraAR, setCameraAR] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cesiumViewerRef = useRef(null);
  const gyroAnglesRef = useRef({ heading: 0, pitch: -0.5 });

  // Register Atlas area so ChatPanel knows we're on Mythic Earth
  const { register: registerArea } = useAreaOverride();
  useEffect(() => {
    if (!embedded) registerArea('mythic-earth');
    return () => registerArea(null);
  }, [embedded, registerArea]);

  // Fetch user's approximate location from IP for initial globe centering
  useEffect(() => {
    let cancelled = false;
    fetch('https://ipwho.is/')
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.latitude != null && data.longitude != null) {
          setInitialLocation({ lat: data.latitude, lng: data.longitude });
        }
      })
      .catch(() => {}); // silent fail — globe stays at default view
    return () => { cancelled = true; };
  }, []);

  // Detect WebXR VR support
  useEffect(() => {
    const xr = navigator.xr;
    if (xr && typeof xr.isSessionSupported === 'function') {
      xr.isSessionSupported('immersive-vr').then(ok => {
        const isMobileOrHeadset = /Mobile|Quest|Pico|Vive/i.test(navigator.userAgent);
        setVrSupported(ok && isMobileOrHeadset);
      }).catch(() => {});
    }
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    track('fullscreen');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [track]);

  const startCameraAR = useCallback(async () => {
    try {
      // iOS requires user gesture for deviceorientation permission
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') {
          alert('Gyroscope permission is needed for AR mode. Please allow motion access.');
          return;
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      track('ar.started');
      setCameraAR(true);
    } catch (err) {
      console.warn('Camera AR failed:', err);
      alert('Could not access camera. Make sure you allow camera access and are on HTTPS.');
    }
  }, [track]);

  const stopCameraAR = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraAR(false);
  }, []);

  // Gyroscope-driven camera control in AR mode
  useEffect(() => {
    if (!cameraAR) return;
    const viewer = cesiumViewerRef.current;
    if (!viewer) return;

    // Store initial camera position to preserve height
    const startPos = viewer.camera.positionCartographic.clone();
    const smoothing = 0.15;

    const handleOrientation = (e) => {
      if (e.alpha == null || e.beta == null) return;

      // alpha: 0-360 compass heading, beta: -180 to 180 pitch, gamma: -90 to 90 roll
      const targetHeading = CesiumMath.toRadians(e.alpha);
      // Map beta: ~90 = looking at horizon, <90 = looking up, >90 = looking down
      const targetPitch = CesiumMath.toRadians(Math.max(-90, Math.min(0, -(e.beta - 90))));

      // Smooth interpolation
      const angles = gyroAnglesRef.current;
      // Handle heading wrap-around
      let dh = targetHeading - angles.heading;
      if (dh > Math.PI) dh -= 2 * Math.PI;
      if (dh < -Math.PI) dh += 2 * Math.PI;
      angles.heading += dh * smoothing;
      angles.pitch += (targetPitch - angles.pitch) * smoothing;

      viewer.camera.setView({
        destination: Cartesian3.fromRadians(
          startPos.longitude, startPos.latitude, startPos.height
        ),
        orientation: new HeadingPitchRoll(angles.heading, angles.pitch, 0),
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    // Disable default Cesium mouse/touch interactions in AR
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    viewer.scene.screenSpaceCameraController.enableTilt = false;

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        viewer.scene.screenSpaceCameraController.enableZoom = true;
        viewer.scene.screenSpaceCameraController.enableTilt = true;
      }
    };
  }, [cameraAR]);

  const handleViewerReady = useCallback((viewer) => {
    cesiumViewerRef.current = viewer;
  }, []);

  const toggleFilter = useCallback((catId) => {
    track('category.' + catId);
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, [track]);

  const handleSelectSite = useCallback((site) => {
    track('site.' + site.id);
    if (!embedded) setSelectedSite(site);
    if (onSiteSelectExternal) onSiteSelectExternal(site);
    setHighlightedSiteIds([site.id]);
  }, [embedded, onSiteSelectExternal, track]);

  const handleGlobeReady = useCallback((api) => {
    globeApi.current = api;
  }, []);

  const handleHighlight = useCallback((ids) => {
    setHighlightedSiteIds(ids);
  }, []);

  const handleTabSwitch = useCallback((tab) => {
    setActiveTab(tab);
    setSelectedSite(null);
    setSelectedMovement(null);
    setHighlightedSiteIds([]);
  }, []);

  const handleSelectMovement = useCallback((movement) => {
    track('movement.' + movement.id);
    setSelectedMovement(movement);
    setSelectedSite(null);
  }, [track]);

  // Fly globe to site selected from parent content area
  useEffect(() => {
    if (embedded && externalSite && globeApi.current) {
      globeApi.current.flyTo(externalSite);
    }
  }, [externalSite, embedded]);

  useEffect(() => {
    if ((selectedSite || selectedMovement) && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSite, selectedMovement]);

  const [xrSlot, setXrSlot] = useState(null);
  useEffect(() => {
    if (xrMode) {
      // Wait a tick for the slot div to appear in the DOM
      const raf = requestAnimationFrame(() => {
        setXrSlot(document.getElementById('xr-controls-slot'));
      });
      return () => cancelAnimationFrame(raf);
    }
    setXrSlot(null);
  }, [xrMode]);

  return (
    <>
      <div className={`mythic-earth-page${cameraAR ? ' ar-active' : ''}`}>
        <div className="mythic-earth-map-area">
          {cameraAR && (
            <video
              ref={videoRef}
              className="mythic-earth-camera-video"
              autoPlay
              playsInline
              muted
            />
          )}

          <MythicEarthGlobe
            activeFilters={embedded && externalFilters ? externalFilters : activeFilters}
            onSelectSite={handleSelectSite}
            onReady={handleGlobeReady}
            highlightedSiteIds={highlightedSiteIds}
            cameraAR={cameraAR}
            vrSupported={vrSupported}
            onViewerReady={handleViewerReady}
            initialLocation={initialLocation}
            activeTab={activeTab}
            onSelectMovement={handleSelectMovement}
            showPilgrimagesOnly={embedded && externalTourSiteIds ? true : showPilgrimagesOnly}
            pilgrimageIds={embedded && externalTourSiteIds ? externalTourSiteIds : pilgrimageIdSet}
            extraSites={userSitesList}
          />

          {!cameraAR && (
            <div className="mythic-earth-bottom-controls">
              {!embedded && (
                <div className="mythic-earth-tab-bar">
                  <button
                    className={`mythic-earth-tab${activeTab === 'sites' ? ' active' : ''}`}
                    onClick={() => { handleTabSwitch('sites'); setShowPilgrimagesOnly(false); }}
                  >
                    Sites
                  </button>
                  <button
                    className={`mythic-earth-tab${activeTab === 'movements' ? ' active' : ''}`}
                    onClick={() => { handleTabSwitch('movements'); setShowPilgrimagesOnly(false); }}
                  >
                    Movements
                  </button>
                  {user && (
                    <button
                      className={`mythic-earth-tab${showPilgrimagesOnly ? ' active' : ''}`}
                      onClick={() => {
                        const next = !showPilgrimagesOnly;
                        setShowPilgrimagesOnly(next);
                        setShowMySites(false);
                        if (next) setActiveTab('sites');
                      }}
                    >
                      My Pilgrimages
                      {pilgrimageIdSet.size > 0 && (
                        <span className="mythic-earth-tab-count">{pilgrimageIdSet.size}</span>
                      )}
                    </button>
                  )}
                  {user && (
                    <button
                      className={`mythic-earth-tab${showMySites ? ' active' : ''}`}
                      style={showMySites ? { background: 'rgba(107,197,160,0.2)', color: '#6bc5a0', borderColor: '#6bc5a0' } : {}}
                      onClick={() => {
                        const next = !showMySites;
                        setShowMySites(next);
                        setShowPilgrimagesOnly(false);
                        if (next) setActiveTab('sites');
                      }}
                    >
                      My Sites
                      {allMySites.length > 0 && (
                        <span className="mythic-earth-tab-count" style={{ background: 'rgba(107,197,160,0.3)', color: '#6bc5a0' }}>{allMySites.length}</span>
                      )}
                    </button>
                  )}
                </div>
              )}
              <MythicEarthSearch
                onSelectSite={handleSelectSite}
                globeApi={globeApi}
                onHighlight={handleHighlight}
                activeTab={activeTab}
                onSelectMovement={handleSelectMovement}
                userSites={userSitesList}
              />
              {!embedded && activeTab === 'sites' && (
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
          )}
        </div>

        {!embedded && !cameraAR && selectedSite && (
          <div className="mythic-earth-detail" ref={detailRef}>
            <button
              className="mythic-earth-detail-close"
              onClick={() => setSelectedSite(null)}
              title="Close"
            >
              {'\u2715'}
            </button>
            <SiteDetail
              site={selectedSite}
              isPilgrimage={pilgrimageIdSet.has(selectedSite.id)}
              onTogglePilgrimage={handleTogglePilgrimage}
              isLoggedIn={!!user}
              onDeleteSite={selectedSite.isUserSite ? handleDeleteUserSite : undefined}
              isSaved={savedSiteIdSet.has(selectedSite.id)}
              onToggleSave={handleToggleSavedSite}
            />
          </div>
        )}

        {!embedded && !cameraAR && selectedMovement && (
          <div className="mythic-earth-detail" ref={detailRef}>
            <button
              className="mythic-earth-detail-close"
              onClick={() => setSelectedMovement(null)}
              title="Close"
            >
              {'\u2715'}
            </button>
            <MovementDetail movement={selectedMovement} />
          </div>
        )}

        {!embedded && !cameraAR && showMySites && !selectedSite && (
          <div className="mythic-earth-my-sites-panel">
            <h3>My Sites</h3>
            {allMySites.length > 0 ? (
              <div className="mythic-earth-user-site-list">
                {allMySites.map(site => (
                  <div
                    key={site.id}
                    className="mythic-earth-user-site-row"
                    onClick={() => handleSelectSite(site)}
                  >
                    <span
                      className="mythic-earth-autocomplete-dot"
                      style={{ background: CATEGORY_MAP[site.category]?.color || '#6bc5a0' }}
                    />
                    <span className="mythic-earth-user-site-name">{site.name}</span>
                    <span className="mythic-earth-user-site-region">{site.region}</span>
                    <button
                      className="mythic-earth-user-site-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (site.isUserSite) {
                          handleDeleteUserSite(site.id);
                        } else {
                          unsaveSite(site.id);
                        }
                      }}
                      title="Remove"
                    >
                      {'\u2715'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mythic-earth-my-sites-empty">No sites yet. Save sites from their detail page, or add your own below.</p>
            )}
            {showAddForm ? (
              <AddSiteForm onAdd={handleAddUserSite} onCancel={() => setShowAddForm(false)} />
            ) : (
              <button className="mythic-earth-add-site-toggle" onClick={() => setShowAddForm(true)}>
                + Add a Site
              </button>
            )}
          </div>
        )}
      </div>

      {xrSlot && createPortal(
        <>
          <button className="mythic-earth-ctrl-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? 'Exit FS' : 'Fullscreen'}
          </button>
          {!cameraAR ? (
            <button className="mythic-earth-ctrl-btn" onClick={startCameraAR} title="Phone AR — camera passthrough with globe overlay">
              Phone AR
            </button>
          ) : (
            <button className="mythic-earth-ctrl-btn" onClick={stopCameraAR} title="Exit AR mode">
              Exit AR
            </button>
          )}
          {vrSupported && (
            <button className="mythic-earth-ctrl-btn" onClick={() => {
              const vrBtn = document.querySelector('.cesium-VRButton');
              if (vrBtn) vrBtn.click();
            }} title="Enter VR — stereoscopic view">
              VR
            </button>
          )}
        </>,
        xrSlot
      )}
    </>
  );
}

export { StreetViewEmbed, AddSiteForm };
export default MythicEarthPage;
