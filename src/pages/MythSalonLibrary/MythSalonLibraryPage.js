import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import libraryData from '../../data/mythSalonLibrary.json';
import { useCoursework } from '../../coursework/CourseworkContext';
import useGoogleMapsApi from '../../hooks/useGoogleMapsApi';
import './MythSalonLibraryPage.css';

/* ===== TRAIL OF THE LIBRARY ===== */

const TRAIL_STOPS = [
  {
    id: 'sanctuary',
    label: 'The Sanctuary',
    short: 'Sanctuary',
    paragraphs: [
      'The Myth Salon Library is a living archive of mythological, spiritual, and cultural wisdom, devoted to preserving and sharing the world\u2019s deepest and most enduring stories. Located at the Mentone Mythouse Retreat in Alabama, along the Transformational Trail, the library is a sanctuary for rare texts, research collections, and curated works, including the revered Eranos Yearbooks.',
      'It welcomes ongoing book donations from individuals and organizations, integrating select works into its permanent collection while offering others in curated events and exchanges to support the preservation of knowledge.',
    ],
  },
  {
    id: 'gathering',
    label: 'The Gathering',
    short: 'Gathering',
    paragraphs: [
      'The roots of the library stretch back to the original Mythouse, where a group of Pacifica Graduate Institute PhD candidates\u2014including Will Linn and Matt McClain\u2014first gathered a shared mythological collection while writing their dissertations.',
      'This growing collection later blossomed into the Joseph Campbell Writers\u2019 Room at LA Center Studios, where it benefited from generous donations by the Joseph Campbell Foundation, the Philosophical Research Society, and the C.G. Jung Institute of Los Angeles.',
    ],
  },
  {
    id: 'migration',
    label: 'The Migration',
    short: 'Migration',
    paragraphs: [
      'When the Writers\u2019 Room closed, the library found temporary refuge at Mack Sennett Studios\u2014one of the oldest film studios in the world\u2014before making its long journey east to Mentone.',
      'Donated by the Joseph Campbell Foundation, the Collected Works of Joseph Campbell were placed into storage. Alongside them: the Depth Perspectives journal from the C.G. Jung Institute of Los Angeles; a full edition of The Secret Teachings of All Ages from the Philosophical Research Society; and additional volumes from the Pacifica Graduate Institute Alumni Association, as well as books gifted by students, colleagues, and friends.',
    ],
  },
  {
    id: 'danas-library',
    label: 'Dana\u2019s Library',
    short: 'Dana',
    paragraphs: [
      'In Mentone, the collection was united with the personal library of Dana White, co-founder of the Myth Salon. Dana\u2019s rare Jungian volumes, his Eranos texts, and mythological treasures form the soul of the current collection.',
      'Dana\u2019s contributions included the Bollingen Series and the Eranos Yearbooks\u2014a legacy that once formed the intellectual heart of a movement devoted to myth, imagination, and dream.',
    ],
  },
  {
    id: 'trail-of-time',
    label: 'The Trail of Time',
    short: 'Trail',
    paragraphs: [
      'Before The Revelation of Fallen Starlight was written, it was walked. It was here, in Mentone, Alabama, that the book was conceived\u2014after the ashes of everything Will had built\u2014to walk a different path. A path of story. A path of trust.',
      'Upon arrival, Will saw what could not be unseen: the pattern. An upper world and a lower world, split by the ridgeline known locally as the brow. At the far eastern edge, where the sun rises, there stood a natural stone formation\u2014a passage, a birth canal, a liminal gate. The sun rose there. And Will saw what he had spent his life studying and teaching. Not in metaphor, but in matter.',
    ],
  },
  {
    id: 'sacred-loop',
    label: 'The Sacred Loop',
    short: 'Loop',
    paragraphs: [
      'What began as an insight became a trail. And the trail became a journey. Waterfalls appeared on either side of the ridge. Trees wove themselves into archways. Stones formed steps. The property circled itself in mythic shape, and each stage of the StoryAtlas path found its place on the ground.',
      'There was no blueprint. No intention beyond one more walk along the loop. The trail was built in layers\u2014iteration by iteration. A branch would arc just right. A stone, shaped perfectly, would be waiting where it was needed. The land responded. The act of co-creating it became Will\u2019s deepest practice\u2014his most sacred prayer. A living ceremony with life and nature.',
    ],
  },
  {
    id: 'living-library',
    label: 'The Living Library',
    short: 'Library',
    paragraphs: [
      'At the center of the circle, the soul of the space: a mythic library.',
      'Today, the Myth Salon Library hosts workshops, retreats, and gatherings centered around mythology, storytelling, and depth psychology. It serves as a resource for courses like StoryAtlas, providing curated reading bundles that bring mythic teachings to life. Its collection includes the Bollingen Series, works from Michael Wiese Productions, and foundational texts across mythology, depth psychology, and cultural studies.',
      'Enriched by its layered history, the library continues to grow as a sacred site of creative and intellectual discovery, devoted to connecting seekers, scholars, and creators with the stories that shape the human spirit.',
    ],
  },
  {
    id: 'invitation',
    label: 'The Invitation',
    short: 'Invitation',
    paragraphs: [
      'To walk the trail is to live the pattern again. And again. And again. There are places along the path to sit, to reflect, to write. Each one a pause in the journey. Each one a mirror.',
      'If The Revelation of Fallen Starlight brought you to the threshold\u2026 And StoryAtlas opened the interior world\u2026 Then the Trail of Time is the body. It is where the myth walks. And where the soul remembers what it means to move through time.',
    ],
    attribution: '\u2014Atlas',
  },
];

/* ===== SVG TRAIL LOOP ===== */

const TRAIL_CX = 180;
const TRAIL_CY = 140;
const TRAIL_RX = 155;
const TRAIL_RY = 110;

function trailPosition(index, total) {
  // Start from top, go clockwise
  const angle = (-Math.PI / 2) + (index / total) * 2 * Math.PI;
  return {
    x: TRAIL_CX + TRAIL_RX * Math.cos(angle),
    y: TRAIL_CY + TRAIL_RY * Math.sin(angle),
  };
}

function TrailLoop({ activeStop, onSelectStop }) {
  const total = TRAIL_STOPS.length;
  const positions = TRAIL_STOPS.map((_, i) => trailPosition(i, total));

  // Build path segments for visited trail
  const pathPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (-Math.PI / 2) + (i / 64) * 2 * Math.PI;
    const x = TRAIL_CX + TRAIL_RX * Math.cos(angle);
    const y = TRAIL_CY + TRAIL_RY * Math.sin(angle);
    pathPoints.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const fullPath = pathPoints.join(' ') + ' Z';

  return (
    <svg className="trail-loop-svg" viewBox="0 0 360 280" aria-label="Library Trail">
      {/* Outer glow */}
      <defs>
        <filter id="trail-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Full trail path */}
      <path
        d={fullPath}
        fill="none"
        stroke="rgba(201, 169, 97, 0.12)"
        strokeWidth="2"
        strokeDasharray="6 4"
      />

      {/* Active trail path (glow) */}
      <path
        d={fullPath}
        fill="none"
        stroke="rgba(201, 169, 97, 0.06)"
        strokeWidth="8"
      />

      {/* Center label */}
      <text
        x={TRAIL_CX} y={TRAIL_CY - 8}
        textAnchor="middle"
        fill="rgba(201, 169, 97, 0.4)"
        fontSize="11"
        fontFamily="Cinzel, serif"
        fontWeight="600"
        letterSpacing="0.12em"
      >
        MYTH SALON
      </text>
      <text
        x={TRAIL_CX} y={TRAIL_CY + 10}
        textAnchor="middle"
        fill="rgba(201, 169, 97, 0.3)"
        fontSize="9"
        fontFamily="Cinzel, serif"
        fontWeight="400"
        letterSpacing="0.08em"
      >
        LIBRARY
      </text>

      {/* Connection lines between stops */}
      {positions.map((pos, i) => {
        const next = positions[(i + 1) % total];
        return (
          <line
            key={`conn-${i}`}
            x1={pos.x} y1={pos.y}
            x2={next.x} y2={next.y}
            stroke="rgba(201, 169, 97, 0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Stop nodes */}
      {TRAIL_STOPS.map((stop, i) => {
        const pos = positions[i];
        const isActive = activeStop === i;
        const nodeR = isActive ? 10 : 7;

        return (
          <g
            key={stop.id}
            className="trail-stop-node"
            onClick={() => onSelectStop(i)}
            style={{ cursor: 'pointer' }}
          >
            {/* Hit area */}
            <circle cx={pos.x} cy={pos.y} r={20} fill="transparent" />

            {/* Active pulse */}
            {isActive && (
              <circle cx={pos.x} cy={pos.y} r={nodeR + 4} fill="none" stroke="rgba(201, 169, 97, 0.5)" strokeWidth="1">
                <animate attributeName="r" values={`${nodeR + 2};${nodeR + 7};${nodeR + 2}`} dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2.5s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Node circle */}
            <circle
              cx={pos.x} cy={pos.y} r={nodeR}
              fill={isActive ? 'rgba(201, 169, 97, 0.9)' : 'rgba(201, 169, 97, 0.2)'}
              stroke={isActive ? 'rgba(201, 169, 97, 0.8)' : 'rgba(201, 169, 97, 0.35)'}
              strokeWidth={isActive ? 2 : 1}
              filter={isActive ? 'url(#trail-glow)' : undefined}
            />

            {/* Label */}
            <text
              x={pos.x}
              y={pos.y + (pos.y < TRAIL_CY ? -14 : 18)}
              textAnchor="middle"
              fill={isActive ? 'rgba(201, 169, 97, 0.95)' : 'rgba(255, 255, 255, 0.45)'}
              fontSize={isActive ? '9' : '8'}
              fontFamily="Cinzel, serif"
              fontWeight={isActive ? '700' : '400'}
              letterSpacing="0.04em"
            >
              {stop.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ===== TRAIL CONTENT PANEL ===== */

function TrailContent({ stopIndex }) {
  if (stopIndex === null) {
    return (
      <div className="trail-content trail-content-prompt">
        <p>Select a station on the trail to begin the story of the library.</p>
      </div>
    );
  }

  const stop = TRAIL_STOPS[stopIndex];
  const total = TRAIL_STOPS.length;

  return (
    <div className="trail-content">
      <div className="trail-content-header">
        <span className="trail-content-number">{stopIndex + 1} / {total}</span>
        <h3 className="trail-content-title">{stop.label}</h3>
      </div>
      <div className="trail-content-body">
        {stop.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {stop.attribution && (
          <p className="trail-attribution">{stop.attribution}</p>
        )}
      </div>
    </div>
  );
}

/* ===== SHELF COMPONENTS ===== */

const SHELF_ICONS = {
  'monomythic-story': '\u2609',
  bollingen: '\u2726',
  campbell: '\u2726',
  jung: '\u2726',
  'sacred-texts': '\u2721',
  'medieval-renaissance': '\u2694',
  'poetry-visionary': '\u270E',
  'theology-mysticism': '\u2720',
  'depth-psychology': '\u2693',
  'california-mystics': '\u2600',
  'california-sacred-ground': '\u26F0',
  'artists-studio': '\u25CB',
  'screening-room': '\u25A0',
  'music-performance': '\u266B',
  'alexandrian-scrolls': '\uD83D\uDCDC',
};

const SPINE_COLORS = [
  '#7a3b3b', '#3b6b4a', '#3b4b7a', '#5a7a6b', '#7a6a3b',
  '#5a3b7a', '#4b5a3b', '#7a4b3b', '#3b5a6a', '#6a3b5a',
  '#6b5a4a', '#3b6a6a', '#8a6a4a', '#4a3b6b', '#6b7a4a', '#7a5a5a',
];

function BookSpine({ book, onClick, isSelected, colorIndex = 0 }) {
  const inSite = book.inSite;
  const bgColor = SPINE_COLORS[colorIndex % SPINE_COLORS.length];
  const height = 300 + ((book.title.length * 7) % 100);

  return (
    <button
      className={`book-spine${inSite ? ' in-site' : ''}${isSelected ? ' selected' : ''}`}
      onClick={onClick}
      title={book.title}
      style={{ '--spine-bg': bgColor, height: `${height}px` }}
    >
      <span className="spine-title">{book.title}</span>
      {book.volume && <span className="spine-volume">{book.volume}</span>}
    </button>
  );
}

/* ===== OPEN LIBRARY HOOK ===== */

const olCache = {};

function useOpenLibrary(title, author) {
  const cacheKey = title ? `${title}||${author || ''}` : '';
  const [data, setData] = useState(() =>
    cacheKey && olCache[cacheKey]
      ? { ...olCache[cacheKey], loading: false }
      : { description: null, coverUrl: null, subjects: null, loading: false }
  );

  useEffect(() => {
    if (!title) {
      setData({ description: null, coverUrl: null, subjects: null, loading: false });
      return;
    }

    const key = `${title}||${author || ''}`;
    if (olCache[key]) {
      setData({ ...olCache[key], loading: false });
      return;
    }

    let cancelled = false;
    setData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        /* --- search: try title+author, title-only, then q= fallback --- */
        let docs = [];
        const strategies = [];
        if (author) strategies.push({ title, author });
        strategies.push({ title, author: '' });
        /* q= strategy: combine title + author for general search */
        const qTerms = author ? `${title} ${author}` : title;
        strategies.push({ q: qTerms });

        for (const strat of strategies) {
          if (cancelled) return;
          const params = new URLSearchParams({ limit: '5' });
          if (strat.q) {
            params.set('q', strat.q);
          } else {
            params.set('title', strat.title);
            if (strat.author) params.set('author', strat.author);
          }
          const res = await fetch(`https://openlibrary.org/search.json?${params}`);
          const json = await res.json();
          if (json.docs?.length) { docs = json.docs; break; }
        }

        if (cancelled) return;
        if (!docs.length) {
          const empty = { description: null, coverUrl: null, subjects: null };
          olCache[key] = empty;
          if (!cancelled) setData({ ...empty, loading: false });
          return;
        }

        /* --- best cover from any result --- */
        const coverDoc = docs.find(d => d.cover_i);
        const coverUrl = coverDoc
          ? `https://covers.openlibrary.org/b/id/${coverDoc.cover_i}-M.jpg`
          : null;

        /* --- subjects from top result --- */
        const subjects = docs[0].subject ? docs[0].subject.slice(0, 6) : null;

        /* --- try each result's work endpoint for a description --- */
        let description = null;
        for (const d of docs) {
          if (cancelled) return;
          if (!d.key) continue;
          try {
            const workRes = await fetch(`https://openlibrary.org${d.key}.json`);
            const workData = await workRes.json();
            const raw = workData.description;
            const desc = typeof raw === 'string' ? raw : raw?.value || null;
            if (desc) { description = desc; break; }
          } catch { /* try next */ }
        }

        const result = { description, coverUrl, subjects };
        olCache[key] = result;
        if (!cancelled) setData({ ...result, loading: false });
      } catch {
        const empty = { description: null, coverUrl: null, subjects: null };
        if (!cancelled) { olCache[key] = empty; setData({ ...empty, loading: false }); }
      }
    })();

    return () => { cancelled = true; };
  }, [title, author]);

  return data;
}

/* ===== BOOK DETAIL ===== */

function BookDetail({ book, shelfType, trackElement }) {
  const isSearchable = book && shelfType !== 'films' && !book.medium && !book.creator;
  const ol = useOpenLibrary(
    isSearchable ? book.title : null,
    isSearchable ? (book.author || '') : ''
  );

  if (!book) return null;

  let content;

  if (shelfType === 'films') {
    content = (
      <>
        <h3 className="detail-title">{book.title}</h3>
        <div className="detail-meta">
          {book.year && <span className="detail-year">{book.year}</span>}
          {book.director && <span className="detail-author">dir. {book.director}</span>}
        </div>
        {book.note && <p className="detail-note">{book.note}</p>}
        {book.inSite && <span className="detail-badge">Referenced in site</span>}
      </>
    );
  } else if (book.medium && !book.creator) {
    content = (
      <>
        <h3 className="detail-title">{book.name || book.title}</h3>
        <div className="detail-meta">
          {book.subject && <span className="detail-subject">{book.subject}</span>}
          {book.year && <span className="detail-year">{book.year}</span>}
          {book.medium && <span className="detail-medium">{book.medium}</span>}
        </div>
        {book.inSite && <span className="detail-badge">Referenced in site</span>}
      </>
    );
  } else if (book.creator) {
    content = (
      <>
        <h3 className="detail-title">{book.title}</h3>
        <div className="detail-meta">
          <span className="detail-author">{book.creator}</span>
          {book.year && <span className="detail-year">{book.year}</span>}
          {book.medium && <span className="detail-medium">{book.medium}</span>}
        </div>
        {book.note && <p className="detail-note">{book.note}</p>}
        {book.inSite && <span className="detail-badge">Referenced in site</span>}
      </>
    );
  } else {
    content = (
      <>
        <h3 className="detail-title">{book.title}</h3>
        <div className="detail-meta">
          {book.author && <span className="detail-author">{book.author}</span>}
          {book.editor && <span className="detail-editor">ed. {book.editor}</span>}
          {book.translator && <span className="detail-editor">trans. {book.translator}</span>}
          {book.tradition && <span className="detail-tradition">{book.tradition}</span>}
          {book.year && <span className="detail-year">{book.year}</span>}
          {book.volume && <span className="detail-volume">Vol. {book.volume}</span>}
        </div>
        {book.note && <p className="detail-note">{book.note}</p>}
        {book.panelKey && <span className="detail-badge panel-link">Monomyth panel: {book.panelKey}</span>}
        {book.inSite && <span className="detail-badge">Referenced in site</span>}
      </>
    );
  }

  const hasOL = ol.description || ol.coverUrl || ol.subjects?.length;

  const showStore = isSearchable;

  return (
    <div className="book-detail">
      {content}
      {(book.freeUrl || showStore) && (
        <div className="detail-actions">
          {book.freeUrl && (
            <a
              className="detail-action-btn detail-action-read"
              href={book.freeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackElement('library.read.clicked')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Read Free
            </a>
          )}
          {showStore && (
            <a
              className="detail-action-btn detail-action-store"
              href={`/store?book=${encodeURIComponent(book.title)}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Store
            </a>
          )}
        </div>
      )}
      {isSearchable && (
        <div className="detail-ol-section">
          {ol.loading ? (
            <span className="detail-ol-loading">Searching Open Library...</span>
          ) : hasOL ? (
            <div className="detail-ol-body">
              {ol.coverUrl && (
                <img
                  className="detail-ol-cover"
                  src={ol.coverUrl}
                  alt=""
                  loading="lazy"
                />
              )}
              <div className="detail-ol-text">
                {ol.description && <p>{ol.description}</p>}
                {ol.subjects?.length > 0 && (
                  <p className="detail-ol-subjects">
                    {ol.subjects.join(' \u00B7 ')}
                  </p>
                )}
                <span className="detail-ol-source">via Open Library</span>
              </div>
            </div>
          ) : (
            <span className="detail-ol-none">No description found on Open Library</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== DARK MAP STYLES ===== */

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a18' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a18' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a5a7a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'administrative.province', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0e0e1e' }] },
];

function makeLibraryPinSvg(isSelected) {
  const fill = isSelected ? '%23c9a961' : '%23a89060';
  const opacity = isSelected ? '1' : '0.7';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${fill}" opacity="${opacity}"/><circle cx="16" cy="14" r="6" fill="%230a0a18"/><text x="16" y="18" text-anchor="middle" font-size="11" fill="${fill}" font-family="serif">&#x1F4DA;</text></svg>`)}`;
}

/* ===== LIBRARY MAP ===== */

function LibraryMap({ libraries, selectedId, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const mapsKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useGoogleMapsApi(mapsKey);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 33, lng: 10 },
      zoom: 2,
      styles: DARK_MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      backgroundColor: '#0a0a18',
    });
    mapInstanceRef.current = map;

    libraries.forEach(lib => {
      const marker = new window.google.maps.Marker({
        position: { lat: lib.lat, lng: lib.lng },
        map,
        title: lib.name,
        icon: {
          url: makeLibraryPinSvg(lib.id === selectedId),
          scaledSize: new window.google.maps.Size(32, 42),
          anchor: new window.google.maps.Point(16, 42),
        },
      });
      marker._libraryId = lib.id;
      marker.addListener('click', () => onSelect(lib.id));
      markersRef.current.push(marker);
    });
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker icons when selection changes
  useEffect(() => {
    markersRef.current.forEach(m => {
      const isSel = m._libraryId === selectedId;
      m.setIcon({
        url: makeLibraryPinSvg(isSel),
        scaledSize: new window.google.maps.Size(32, 42),
        anchor: new window.google.maps.Point(16, 42),
      });
    });
  }, [selectedId]);

  if (!mapsKey) {
    // Fallback: library cards when no API key
    return (
      <div className="library-map-fallback">
        {libraries.map(lib => (
          <button
            key={lib.id}
            className={`library-card-btn${selectedId === lib.id ? ' active' : ''}`}
            onClick={() => onSelect(lib.id)}
          >
            <span className="library-card-name">{lib.name}</span>
            <span className="library-card-subtitle">{lib.subtitle}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="library-map-container">
      {!isLoaded && <div className="library-map-loading">Loading map...</div>}
      <div ref={mapRef} className="library-google-map" />
    </div>
  );
}

/* ===== PAGE ===== */

export default function MythSalonLibraryPage() {
  const [selectedLibraryId, setSelectedLibraryId] = useState(null);
  const [activeTrailStop, setActiveTrailStop] = useState(null);
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackElement, trackTime, isElementCompleted, courseworkMode } = useCoursework();

  const libraries = libraryData.libraries;
  const selectedLibrary = libraries.find(l => l.id === selectedLibraryId) || null;
  const shelves = selectedLibrary?.shelves || [];

  // Deep linking: ?shelf=X&book=Y (defaults to myth-salon for backward compat)
  useEffect(() => {
    const shelfParam = searchParams.get('shelf');
    const libraryParam = searchParams.get('library');
    const bookParam = searchParams.get('book');
    if (shelfParam) {
      const libId = libraryParam || 'myth-salon';
      setSelectedLibraryId(libId);
      setSelectedShelfId(shelfParam);
      if (bookParam) {
        const lib = libraries.find(l => l.id === libId);
        const shelf = lib?.shelves.find(s => s.id === shelfParam);
        const items = shelf?.books || shelf?.films || shelf?.works || shelf?.artists || [];
        const idx = items.findIndex(b => (b.title || b.name) === bookParam);
        if (idx >= 0) setSelectedBook(idx);
      }
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Page visit tracking
  useEffect(() => { trackElement('library.page.visited'); }, [trackElement]);

  // Time tracking for trail stops
  const timeRef = useRef({ stop: null, start: Date.now() });
  useEffect(() => {
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0 && prev.stop !== null) trackTime(`library.trail.stop.${prev.stop}.time`, elapsed);
    timeRef.current = { stop: activeTrailStop, start: Date.now() };
    return () => {
      const cur = timeRef.current;
      const secs = Math.round((Date.now() - cur.start) / 1000);
      if (secs > 0 && cur.stop !== null) trackTime(`library.trail.stop.${cur.stop}.time`, secs);
    };
  }, [activeTrailStop, trackTime]);

  const handleSelectLibrary = useCallback((id) => {
    setSelectedLibraryId(id);
    setSelectedShelfId(null);
    setSelectedBook(null);
    setActiveTrailStop(null);
    trackElement(`library.location.${id}`);
  }, [trackElement]);

  const selectedShelf = shelves.find(s => s.id === selectedShelfId);
  const shelfItems = selectedShelf
    ? (selectedShelf.books || selectedShelf.films || selectedShelf.works || selectedShelf.artists || []).map(item => ({
        ...item,
        title: item.title || item.name || item.subject || 'Untitled',
      }))
    : [];

  const totalItems = shelves.reduce((sum, s) => {
    const items = s.books || s.films || s.works || s.artists || [];
    return sum + items.length;
  }, 0);

  return (
    <div className="myth-salon-library-page">
      <header className="library-header">
        <h1 className="library-title">Libraries of the World</h1>
        <p className="library-subtitle">Select a library to explore its collection</p>
      </header>

      {/* Library Map */}
      <LibraryMap
        libraries={libraries}
        selectedId={selectedLibraryId}
        onSelect={handleSelectLibrary}
      />

      {/* Selected Library Content */}
      {selectedLibrary && (
        <div className="library-content">
          <div className="library-content-header">
            <h2 className="library-content-name">{selectedLibrary.name}</h2>
            <p className="library-content-subtitle">{selectedLibrary.subtitle}</p>
          </div>

          {/* Trail Loop (only for libraries with a trail) */}
          {selectedLibrary.hasTrail && (
            <section className="trail-section">
              <TrailLoop
                activeStop={activeTrailStop}
                onSelectStop={(i) => {
                  const next = activeTrailStop === i ? null : i;
                  if (next !== null) trackElement(`library.trail.stop.${next}`);
                  setActiveTrailStop(next);
                }}
              />
              <TrailContent stopIndex={activeTrailStop} />
            </section>
          )}

          {/* Divider */}
          <div className="library-divider">
            <span className="divider-label">The Collection</span>
            <span className="divider-count">{shelves.length} {shelves.length === 1 ? 'shelf' : 'shelves'} &middot; {totalItems} works</span>
          </div>

          {/* Shelf Tab Buttons */}
          <div className="shelf-tab-bar">
            {shelves.map(shelf => {
              const count = (shelf.books || shelf.films || shelf.works || shelf.artists || []).length;
              const icon = SHELF_ICONS[shelf.id] || '\u25CF';
              const isActive = selectedShelfId === shelf.id;
              return (
                <button
                  key={shelf.id}
                  className={`shelf-tab${isActive ? ' active' : ''}${shelf.type === 'collected' ? ' collected' : ''}${courseworkMode ? (isElementCompleted(`library.shelf.${shelf.id}`) ? ' cw-completed' : ' cw-incomplete') : ''}`}
                  onClick={() => {
                    if (!isActive) trackElement(`library.shelf.${shelf.id}`);
                    setSelectedShelfId(isActive ? null : shelf.id);
                    setSelectedBook(null);
                  }}
                >
                  <span className="shelf-tab-icon">{icon}</span>
                  <span className="shelf-tab-name">{shelf.name}</span>
                  <span className="shelf-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Shelf Display */}
          {selectedShelf && (
            <div className="shelf-display">
              <h2 className="shelf-display-title">{selectedShelf.name}</h2>
              <p className="shelf-display-description">{selectedShelf.description}</p>

              <div className="shelf-rail">
                <div className="bookshelf-row">
                  {shelfItems.map((item, i) => (
                    <BookSpine
                      key={`${item.title}-${i}`}
                      book={item}
                      isSelected={selectedBook === i}
                      onClick={() => { if (selectedBook !== i) trackElement(`library.shelf.${selectedShelfId}.book.${i}`); setSelectedBook(selectedBook === i ? null : i); }}
                      colorIndex={i}
                    />
                  ))}
                </div>
                <div className="shelf-ledge" />
              </div>

              {selectedBook !== null && (
                <BookDetail book={shelfItems[selectedBook]} shelfType={selectedShelf.type} trackElement={trackElement} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
