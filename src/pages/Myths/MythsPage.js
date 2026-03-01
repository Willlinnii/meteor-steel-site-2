import React, { useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useAreaOverride } from '../../App';
import CircleNav from '../../components/CircleNav';
import { ring1, ring2, ring3, allEpisodes, subtitle as seriesSubtitle, description as seriesDescription, rokuUrl } from '../../data/mythsSeriesData';
import treasuresData from '../../data/treasuresData';
import mythicEarthSites from '../../data/mythicEarthSites.json';
import ancientLibraries from '../../data/ancientLibraries.json';
import ancientTemples from '../../data/ancientTemples.json';
import { getAllBooks } from '../../data/bookOriginsUtils';
import { resolveOrigin } from '../../data/bookOrigins';
import libraryData from '../../data/mythSalonLibrary.json';
import mythsSynthesis from '../../data/mythsSynthesis.json';
import worldData from '../../data/normalOtherWorld.json';
import {
  CULTURES, ARCANA_POSITIONS,
  getArcanaForCulture, getArcanaPosition, getCrossReference,
  buildMinorArcana, getSuitsForCulture,
} from '../../games/mythouse/mythouseCardData';
import { StreetViewEmbed, AddSiteForm } from '../MythicEarth/MythicEarthPage';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import MYTHIC_EARTH_TOURS from '../../data/mythicEarthTours';
import mythicEarthMovements from '../../data/mythicEarthMovements.json';
import MythicAgesTimeline, { parseEraString } from '../../components/MythicAgesTimeline';
import '../Treasures/TreasuresPage.css';
import ArchetypesPanel from '../../components/ArchetypesPanel';
import olympianPantheon from '../../data/olympianPantheon.json';
import hinduPantheon from '../../data/hinduPantheon.json';
import norsePantheon from '../../data/norsePantheon.json';
import shintoPantheon from '../../data/shintoPantheon.json';
import aztecPantheon from '../../data/aztecPantheon.json';
import hawaiianPantheon from '../../data/hawaiianPantheon.json';
import maoriPantheon from '../../data/maoriPantheon.json';
import incaPantheon from '../../data/incaPantheon.json';
import yorubaPantheon from '../../data/yorubaPantheon.json';
import chinesePantheon from '../../data/chinesePantheon.json';
import egyptianPantheon from '../../data/egyptianPantheon.json';
import sumerianPantheon from '../../data/sumerianPantheon.json';
import celticIrishPantheon from '../../data/celticIrishPantheon.json';
import romanPantheon from '../../data/romanPantheon.json';
import mayaPantheon from '../../data/mayaPantheon.json';
import zoroastrianPantheon from '../../data/zoroastrianPantheon.json';
import persianPantheon from '../../data/persianPantheon.json';
import slavicPantheon from '../../data/slavicPantheon.json';
import finnishPantheon from '../../data/finnishPantheon.json';
import canaanitePantheon from '../../data/canaanitePantheon.json';
import koreanPantheon from '../../data/koreanPantheon.json';
import navajoPantheon from '../../data/navajoPantheon.json';
import hopiPantheon from '../../data/hopiPantheon.json';
import lakotaPantheon from '../../data/lakotaPantheon.json';
import aboriginalPantheon from '../../data/aboriginalPantheon.json';
import fonPantheon from '../../data/fonPantheon.json';
import mongolianPantheon from '../../data/mongolianPantheon.json';
import armenianPantheon from '../../data/armenianPantheon.json';
import celticWelshPantheon from '../../data/celticWelshPantheon.json';
import balticPantheon from '../../data/balticPantheon.json';
import akanPantheon from '../../data/akanPantheon.json';
import haidaPantheon from '../../data/haidaPantheon.json';
import mapuchePantheon from '../../data/mapuchePantheon.json';
import algonquinPantheon from '../../data/algonquinPantheon.json';
import guaraniPantheon from '../../data/guaraniPantheon.json';
import inuitPantheon from '../../data/inuitPantheon.json';
import hittitePantheon from '../../data/hittitePantheon.json';
import etruscanPantheon from '../../data/etruscanPantheon.json';
import georgianPantheon from '../../data/georgianPantheon.json';
import basquePantheon from '../../data/basquePantheon.json';
import berberPantheon from '../../data/berberPantheon.json';
import tibetanPantheon from '../../data/tibetanPantheon.json';
import haudenosauneePantheon from '../../data/haudenosauneePantheon.json';
import tainoPantheon from '../../data/tainoPantheon.json';
import samoanPantheon from '../../data/samoanPantheon.json';
import tahitianPantheon from '../../data/tahitianPantheon.json';
import zuluPantheon from '../../data/zuluPantheon.json';
import sanPantheon from '../../data/sanPantheon.json';
import khmerPantheon from '../../data/khmerPantheon.json';
import vietnamesePantheon from '../../data/vietnamesePantheon.json';
import vedicPantheon from '../../data/vedicPantheon.json';
import babylonianPantheon from '../../data/babylonianPantheon.json';
import phoenicianPantheon from '../../data/phoenicianPantheon.json';
import candoblePantheon from '../../data/candoblePantheon.json';
import bugandaPantheon from '../../data/bugandaPantheon.json';
import igboPantheon from '../../data/igboPantheon.json';
import muiscaPantheon from '../../data/muiscaPantheon.json';
import samiPantheon from '../../data/samiPantheon.json';
import mandePantheon from '../../data/mandePantheon.json';
import thaiPantheon from '../../data/thaiPantheon.json';
import javanesePantheon from '../../data/javanesePantheon.json';
import dogonPantheon from '../../data/dogonPantheon.json';
import scythianPantheon from '../../data/scythianPantheon.json';
import ainuPantheon from '../../data/ainuPantheon.json';
import celtiberianPantheon from '../../data/celtiberianPantheon.json';
import tonganPantheon from '../../data/tonganPantheon.json';
import haitianVodouPantheon from '../../data/haitianVodouPantheon.json';
import melanesianPantheon from '../../data/melanesianPantheon.json';
import malagasyPantheon from '../../data/malagasyPantheon.json';
import arabianPantheon from '../../data/arabianPantheon.json';
import filipinoPantheon from '../../data/filipinoPantheon.json';
import phrygianPantheon from '../../data/phrygianPantheon.json';
import angloSaxonPantheon from '../../data/angloSaxonPantheon.json';
import minoanPantheon from '../../data/minoanPantheon.json';
import zapotecPantheon from '../../data/zapotecPantheon.json';
import cheyennePantheon from '../../data/cheyennePantheon.json';
import cherokeePantheon from '../../data/cherokeePantheon.json';
import elamitePantheon from '../../data/elamitePantheon.json';
import arthurianPantheon from '../../data/arthurianPantheon.json';
import './MythsPage.css';

const PANTHEONS = {
  olympian: olympianPantheon,
  hindu: hinduPantheon,
  norse: norsePantheon,
  shinto: shintoPantheon,
  aztec: aztecPantheon,
  hawaiian: hawaiianPantheon,
  maori: maoriPantheon,
  inca: incaPantheon,
  yoruba: yorubaPantheon,
  chinese: chinesePantheon,
  egyptian: egyptianPantheon,
  sumerian: sumerianPantheon,
  'celtic-irish': celticIrishPantheon,
  roman: romanPantheon,
  maya: mayaPantheon,
  zoroastrian: zoroastrianPantheon,
  persian: persianPantheon,
  slavic: slavicPantheon,
  finnish: finnishPantheon,
  canaanite: canaanitePantheon,
  korean: koreanPantheon,
  navajo: navajoPantheon,
  hopi: hopiPantheon,
  lakota: lakotaPantheon,
  aboriginal: aboriginalPantheon,
  fon: fonPantheon,
  mongolian: mongolianPantheon,
  armenian: armenianPantheon,
  'celtic-welsh': celticWelshPantheon,
  baltic: balticPantheon,
  akan: akanPantheon,
  haida: haidaPantheon,
  mapuche: mapuchePantheon,
  algonquin: algonquinPantheon,
  guarani: guaraniPantheon,
  inuit: inuitPantheon,
  hittite: hittitePantheon,
  etruscan: etruscanPantheon,
  georgian: georgianPantheon,
  basque: basquePantheon,
  berber: berberPantheon,
  tibetan: tibetanPantheon,
  haudenosaunee: haudenosauneePantheon,
  taino: tainoPantheon,
  samoan: samoanPantheon,
  tahitian: tahitianPantheon,
  zulu: zuluPantheon,
  san: sanPantheon,
  khmer: khmerPantheon,
  vietnamese: vietnamesePantheon,
  vedic: vedicPantheon,
  babylonian: babylonianPantheon,
  phoenician: phoenicianPantheon,
  candoble: candoblePantheon,
  buganda: bugandaPantheon,
  igbo: igboPantheon,
  muisca: muiscaPantheon,
  sami: samiPantheon,
  mande: mandePantheon,
  thai: thaiPantheon,
  javanese: javanesePantheon,
  dogon: dogonPantheon,
  scythian: scythianPantheon,
  ainu: ainuPantheon,
  celtiberian: celtiberianPantheon,
  tongan: tonganPantheon,
  'haitian-vodou': haitianVodouPantheon,
  melanesian: melanesianPantheon,
  malagasy: malagasyPantheon,
  arabian: arabianPantheon,
  filipino: filipinoPantheon,
  phrygian: phrygianPantheon,
  'anglo-saxon': angloSaxonPantheon,
  minoan: minoanPantheon,
  zapotec: zapotecPantheon,
  cheyenne: cheyennePantheon,
  cherokee: cherokeePantheon,
  elamite: elamitePantheon,
  arthurian: arthurianPantheon,
};

const MythicEarthPage = lazy(() => import('../MythicEarth/MythicEarthPage'));

const MYTHIC_EARTH_CATEGORIES = [
  { id: 'sacred-site', label: 'Sacred', color: '#c9a961' },
  { id: 'literary-location', label: 'Literary', color: '#8b9dc3' },
  { id: 'temple', label: 'Temples', color: '#c47a5a' },
  { id: 'library', label: 'Libraries', color: '#a89060' },
];

/* Meta-groups: selecting a group ID matches all member pantheon IDs */
const TRADITION_GROUPS = {
  iranian: ['zoroastrian', 'persian', 'elamite'],
};

const TRADITION_REGIONS = [
  { region: 'Global', traditions: [
    { id: 'global', label: 'Global' },
  ]},
  { region: 'Iranian', traditions: [
    { id: 'iranian', label: 'Iranian' },
    { id: 'zoroastrian', label: 'Zoroastrian' },
    { id: 'persian', label: 'Persian' },
    { id: 'elamite', label: 'Elamite' },
  ]},
  { region: 'Mediterranean', traditions: [
    { id: 'olympian', label: 'Greek' },
    { id: 'roman', label: 'Roman' },
    { id: 'minoan', label: 'Minoan' },
    { id: 'etruscan', label: 'Etruscan' },
    { id: 'phrygian', label: 'Phrygian' },
    { id: 'celtiberian', label: 'Iberian' },
    { id: 'phoenician', label: 'Phoenician' },
  ]},
  { region: 'Near East', traditions: [
    { id: 'sumerian', label: 'Sumerian' },
    { id: 'babylonian', label: 'Babylonian' },
    { id: 'hittite', label: 'Hittite' },
    { id: 'canaanite', label: 'Canaanite' },
    { id: 'arabian', label: 'Arabian' },
  ]},
  { region: 'Europe', traditions: [
    { id: 'norse', label: 'Norse' },
    { id: 'anglo-saxon', label: 'Anglo-Saxon' },
    { id: 'arthurian', label: 'Arthurian' },
    { id: 'celtic-irish', label: 'Irish' },
    { id: 'celtic-welsh', label: 'Welsh' },
    { id: 'slavic', label: 'Slavic' },
    { id: 'finnish', label: 'Finnish' },
    { id: 'sami', label: 'Sami' },
    { id: 'baltic', label: 'Baltic' },
    { id: 'basque', label: 'Basque' },
    { id: 'georgian', label: 'Georgian' },
    { id: 'armenian', label: 'Armenian' },
  ]},
  { region: 'Africa', traditions: [
    { id: 'egyptian', label: 'Egyptian' },
    { id: 'yoruba', label: 'Yoruba' },
    { id: 'fon', label: 'Fon' },
    { id: 'akan', label: 'Akan' },
    { id: 'igbo', label: 'Igbo' },
    { id: 'dogon', label: 'Dogon' },
    { id: 'mande', label: 'Mande' },
    { id: 'buganda', label: 'Buganda' },
    { id: 'zulu', label: 'Zulu' },
    { id: 'san', label: 'San' },
    { id: 'berber', label: 'Berber' },
    { id: 'malagasy', label: 'Malagasy' },
  ]},
  { region: 'South Asia', traditions: [
    { id: 'hindu', label: 'Hindu' },
    { id: 'vedic', label: 'Vedic' },
    { id: 'tibetan', label: 'Tibetan' },
  ]},
  { region: 'East Asia', traditions: [
    { id: 'chinese', label: 'Chinese' },
    { id: 'shinto', label: 'Shinto' },
    { id: 'korean', label: 'Korean' },
    { id: 'ainu', label: 'Ainu' },
    { id: 'mongolian', label: 'Mongolian' },
  ]},
  { region: 'Southeast Asia', traditions: [
    { id: 'khmer', label: 'Khmer' },
    { id: 'thai', label: 'Thai' },
    { id: 'javanese', label: 'Javanese' },
    { id: 'vietnamese', label: 'Vietnamese' },
    { id: 'filipino', label: 'Filipino' },
  ]},
  { region: 'Americas', traditions: [
    { id: 'aztec', label: 'Aztec' },
    { id: 'maya', label: 'Maya' },
    { id: 'zapotec', label: 'Zapotec' },
    { id: 'inca', label: 'Inca' },
    { id: 'muisca', label: 'Muisca' },
    { id: 'navajo', label: 'Navajo' },
    { id: 'hopi', label: 'Hopi' },
    { id: 'lakota', label: 'Lakota' },
    { id: 'cheyenne', label: 'Cheyenne' },
    { id: 'cherokee', label: 'Cherokee' },
    { id: 'haida', label: 'Haida' },
    { id: 'algonquin', label: 'Algonquin' },
    { id: 'haudenosaunee', label: 'Haudenosaunee' },
    { id: 'inuit', label: 'Inuit' },
    { id: 'taino', label: 'Taino' },
    { id: 'mapuche', label: 'Mapuche' },
    { id: 'guarani', label: 'Guarani' },
  ]},
  { region: 'Pacific', traditions: [
    { id: 'hawaiian', label: 'Hawaiian' },
    { id: 'maori', label: 'Maori' },
    { id: 'samoan', label: 'Samoan' },
    { id: 'tahitian', label: 'Tahitian' },
    { id: 'tongan', label: 'Tongan' },
    { id: 'melanesian', label: 'Melanesian' },
    { id: 'aboriginal', label: 'Aboriginal' },
  ]},
  { region: 'Diaspora', traditions: [
    { id: 'haitian-vodou', label: 'Haitian Vodou' },
    { id: 'candoble', label: 'Candomble' },
  ]},
  { region: 'Steppe', traditions: [
    { id: 'scythian', label: 'Scythian' },
  ]},
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

/* ── Libraries Panel (3-level: library grid → text grid → text detail) ── */
const LIBRARY_COORDS = {
  alexandria:      { lat: 31.20, lng: 29.92 },
  ashurbanipal:    { lat: 36.36, lng: 43.15 },
  'house-of-wisdom': { lat: 33.34, lng: 44.40 },
  nalanda:         { lat: 25.14, lng: 85.45 },
  constantinople:  { lat: 41.01, lng: 28.98 },
  dunhuang:        { lat: 40.04, lng: 94.80 },
  tibetan:         { lat: 29.32, lng: 91.11 },
  pergamon:        { lat: 39.13, lng: 27.18 },
  celsus:          { lat: 37.94, lng: 27.34 },
  timbuktu:        { lat: 16.77, lng: -3.01 },
  qarawiyyin:      { lat: 34.06, lng: -4.97 },
  maya:            { lat: 17.22, lng: -89.62 },
  quipu:           { lat: -13.52, lng: -71.97 },
  ugarit:          { lat: 35.60, lng: 35.78 },
  ebla:            { lat: 35.80, lng: 36.80 },
  'myth-salon':    { lat: 34.57, lng: -85.58 },
};

const ALL_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'science', label: 'Science' },
  { id: 'literature', label: 'Literature' },
  { id: 'magic', label: 'Magic' },
  { id: 'religion', label: 'Religion' },
  { id: 'law', label: 'Law' },
  { id: 'history', label: 'History' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'astronomy', label: 'Astronomy' },
  { id: 'archive', label: 'Archive' },
];

function LibrariesPanel({ trackElement, timelineRange, onFlyTo }) {
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedText, setSelectedText] = useState(null);
  const [librarySubTab, setLibrarySubTab] = useState('libraries');
  const [selectedShelf, setSelectedShelf] = useState(null);

  // Level 3: Text detail (ancient libraries)
  if (selectedText) {
    return (
      <div className="alexandria-detail">
        <button className="mythic-earth-back" onClick={() => { setSelectedText(null); if (onFlyTo) onFlyTo(LIBRARY_COORDS[selectedLibrary.id] || null, `lib-${selectedLibrary.id}`); }}>
          {'\u2190'} Back to {selectedLibrary.name}
        </button>
        <h3>{selectedText.title}</h3>
        <div className="alexandria-detail-meta">
          <span className="alexandria-detail-author">{selectedText.author}</span>
          <span className="alexandria-detail-date">{selectedText.date}</span>
          <span className={`alexandria-detail-badge ${selectedText.category}`}>{selectedText.category}</span>
        </div>
        <div className="mythic-earth-site-text">
          {selectedText.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {selectedText.fragments && (
          <div className="alexandria-fragments">
            This text survives only in fragments quoted by later authors. No complete manuscript is known to exist.
          </div>
        )}

        {selectedText.wikisourcePage ? (
          <TextReader readUrl={selectedText.readUrl} wikisourcePage={selectedText.wikisourcePage} />
        ) : selectedText.readUrl ? (
          <div className="mythic-earth-reader-toggle">
            <a href={selectedText.readUrl} target="_blank" rel="noopener noreferrer" className="mythic-earth-reader-btn">
              Read Full Text
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  // Level 2: Text grid for selected ancient library
  if (selectedLibrary) {
    const libCategories = [...new Set(selectedLibrary.texts.map(t => t.category))];
    const filters = ALL_CATEGORIES.filter(c => c.id === 'all' || libCategories.includes(c.id));
    const filteredTexts = activeFilter === 'all'
      ? selectedLibrary.texts
      : selectedLibrary.texts.filter(t => t.category === activeFilter);

    return (
      <div className="alexandria-panel libraries-panel">
        <button className="mythic-earth-back" onClick={() => { setSelectedLibrary(null); setActiveFilter('all'); if (onFlyTo) onFlyTo(null, null); }}>
          {'\u2190'} Back to Libraries
        </button>
        <div className="alexandria-header libraries-header">
          <h3>{selectedLibrary.name}</h3>
          <p className="library-card-location">{selectedLibrary.location} &middot; {selectedLibrary.era}</p>
          <p>{selectedLibrary.tagline}</p>
        </div>

        <div className="alexandria-filters">
          {filters.map(f => (
            <button
              key={f.id}
              className={`mythic-earth-cat-btn${activeFilter === f.id ? ' active' : ''}`}
              style={{ '--cat-color': '#a89060' }}
              onClick={() => { setActiveFilter(f.id); trackElement(`myths.library.${selectedLibrary.id}.filter.${f.id}`); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mythic-earth-site-grid">
          {filteredTexts.map(text => (
            <button
              key={text.id}
              className="mythic-earth-site-card alexandria-card"
              onClick={() => { setSelectedText(text); trackElement(`myths.library.${selectedLibrary.id}.text.${text.id}`); if (onFlyTo) onFlyTo(LIBRARY_COORDS[selectedLibrary.id] || null, `lib-${selectedLibrary.id}`); }}
            >
              <span className="site-card-name">{text.title}</span>
              <span className="site-card-region">{text.author}</span>
              <div className="alexandria-card-footer">
                <span className="alexandria-card-date">{text.date}</span>
                <span className={`alexandria-card-badge ${text.category}`}>{text.category}</span>
              </div>
              {text.fragments && <span className="alexandria-card-fragments">Fragments</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Shelves sub-tab: shelf detail
  if (librarySubTab === 'shelves' && selectedShelf) {
    const items = selectedShelf.books || selectedShelf.films || selectedShelf.artists || selectedShelf.works || [];
    return (
      <div className="libraries-panel">
        <button className="mythic-earth-back" onClick={() => { setSelectedShelf(null); if (onFlyTo) onFlyTo(null, null); }}>
          {'\u2190'} Back to Shelves
        </button>
        <div className="alexandria-header libraries-header">
          <h3>{selectedShelf.name}</h3>
          <p>{selectedShelf.description}</p>
        </div>
        <div className="mythic-earth-site-grid">
          {items.map((item, i) => {
            const origin = resolveOrigin(item, selectedShelf.id);
            const matchedBook = item.title ? getAllBooks().find(b => b.title === item.title) : null;
            const pinId = matchedBook ? `book-${matchedBook.id}` : null;
            return (
              <button
                key={i}
                className="mythic-earth-site-card literature-card"
                onClick={() => {
                  trackElement(`myths.library.shelf.${selectedShelf.id}.item.${i}`);
                  if (onFlyTo) onFlyTo(origin || null, pinId);
                }}
              >
                <span className="site-card-name">{item.title || item.subject || item.name}</span>
                {(item.author || item.creator || item.director) && (
                  <span className="site-card-region">{item.author || item.creator || item.director}</span>
                )}
                {item.tradition && <span className="site-card-region">{item.tradition}</span>}
                <div className="literature-card-footer">
                  <span className="alexandria-card-date">{item.year}</span>
                  {item.medium && <span className="literature-card-region-badge">{item.medium}</span>}
                </div>
                {item.note && <span className="library-card-tagline">{item.note}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Level 1: Library grid with sub-tabs
  return (
    <div className="libraries-panel">
      <div className="library-sub-tabs">
        <button
          className={`mythic-earth-cat-btn${librarySubTab === 'libraries' ? ' active' : ''}`}
          style={{ '--cat-color': '#a89060' }}
          onClick={() => { setLibrarySubTab('libraries'); trackElement('myths.library.subtab.libraries'); }}
        >
          Libraries
        </button>
        <button
          className={`mythic-earth-cat-btn${librarySubTab === 'shelves' ? ' active' : ''}`}
          style={{ '--cat-color': '#a89060' }}
          onClick={() => { setLibrarySubTab('shelves'); trackElement('myths.library.subtab.shelves'); }}
        >
          Shelves
        </button>
      </div>

      {librarySubTab === 'libraries' ? (
        <>
          <div className="alexandria-header libraries-header">
            <h3>Libraries</h3>
            <p>Libraries spanning four thousand years and five continents — the great repositories of human knowledge from cuneiform to quipu.</p>
          </div>

          <div className="mythic-earth-site-grid">
            {ancientLibraries.filter(lib => {
              const era = parseEraString(lib.era);
              if (!era) return true;
              return era.endYear >= timelineRange[0] && era.startYear <= timelineRange[1];
            }).map(lib => (
              <button
                key={lib.id}
                className="mythic-earth-site-card library-card"
                onClick={() => { setSelectedLibrary(lib); trackElement(`myths.library.${lib.id}`); if (onFlyTo && LIBRARY_COORDS[lib.id]) onFlyTo(LIBRARY_COORDS[lib.id], `lib-${lib.id}`); }}
              >
                <span className="site-card-name">{lib.name}</span>
                <span className="site-card-region">{lib.location}</span>
                <span className="library-card-era">{lib.era}</span>
                <span className="library-card-tagline">{lib.tagline}</span>
                <span className="library-card-count">{lib.texts.length} texts</span>
              </button>
            ))}
            <button
              key="myth-salon"
              className="mythic-earth-site-card library-card"
              onClick={() => { setLibrarySubTab('shelves'); trackElement('myths.library.myth-salon'); if (onFlyTo) onFlyTo({ lat: 34.5667, lng: -85.5811 }, 'lib-myth-salon'); }}
            >
              <span className="site-card-name">Myth Salon Library</span>
              <span className="site-card-region">Mentone, Alabama</span>
              <span className="library-card-era">2020 – present</span>
              <span className="library-card-tagline">A living archive of mythological, spiritual, and cultural wisdom at the Mentone Mythouse Retreat.</span>
              <span className="library-card-count">{libraryData.libraries.find(l => l.id === 'myth-salon').shelves.length} shelves</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="alexandria-header libraries-header">
            <h3>Myth Salon Library</h3>
            <p>{libraryData.libraries.find(l => l.id === 'myth-salon').shelves.length} shelves of books, films, art, and music that form the foundation of the mythic tradition.</p>
          </div>

          <div className="mythic-earth-site-grid">
            {libraryData.libraries.find(l => l.id === 'myth-salon').shelves.map(shelf => {
              const itemCount = (shelf.books || shelf.films || shelf.artists || shelf.works || []).length;
              return (
                <button
                  key={shelf.id}
                  className="mythic-earth-site-card library-card"
                  onClick={() => { setSelectedShelf(shelf); trackElement(`myths.library.shelf.${shelf.id}`); }}
                >
                  <span className="site-card-name">{shelf.name}</span>
                  <span className="library-card-tagline">{shelf.description.slice(0, 100)}{shelf.description.length > 100 ? '...' : ''}</span>
                  <span className="library-card-count">{itemCount} {shelf.type === 'films' ? 'films' : 'items'}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Literature Panel (flat book grid with sort/filter/detail) ── */
const REGION_OPTIONS = ['All', 'Near East', 'Mediterranean', 'Europe', 'Africa', 'Asia', 'Americas', 'Unknown'];

function LiteraturePanel({ trackElement, timelineRange, onFlyTo }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [regionFilter, setRegionFilter] = useState('All');

  const allBooks = getAllBooks();

  const filteredBooks = useMemo(() => {
    let books = allBooks;
    // Timeline filter
    if (timelineRange) {
      books = books.filter(b => {
        if (!b.era) return true;
        return b.era.endYear >= timelineRange[0] && b.era.startYear <= timelineRange[1];
      });
    }
    // Region filter
    if (regionFilter !== 'All') {
      books = books.filter(b => b.region === regionFilter);
    }
    // Sort
    const sorted = [...books];
    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const aY = a.era ? a.era.startYear : Infinity;
        const bY = b.era ? b.era.startYear : Infinity;
        return aY - bY;
      });
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'region') {
      sorted.sort((a, b) => a.region.localeCompare(b.region) || a.title.localeCompare(b.title));
    }
    return sorted;
  }, [allBooks, timelineRange, regionFilter, sortBy]);

  // Book detail
  if (selectedBook) {
    return (
      <div className="literature-panel">
        <button className="mythic-earth-back" onClick={() => { setSelectedBook(null); if (onFlyTo) onFlyTo(null, null); }}>
          {'\u2190'} Back to Literature
        </button>
        <h3>{selectedBook.title}</h3>
        <div className="literature-detail-meta">
          {selectedBook.author && <span className="literature-detail-author">{selectedBook.author}</span>}
          {selectedBook.tradition && <span className="literature-detail-tradition">{selectedBook.tradition}</span>}
          <span className="literature-detail-date">{selectedBook.year}</span>
          <span className="literature-detail-origin">{selectedBook.originLabel}</span>
          <span className="literature-detail-region-badge">{selectedBook.region}</span>
        </div>
        {selectedBook.note && (
          <div className="literature-detail-note">{selectedBook.note}</div>
        )}
        <div className="literature-detail-actions">
          {selectedBook.freeUrl && (
            <a href={selectedBook.freeUrl} target="_blank" rel="noopener noreferrer" className="mythic-earth-reader-btn">
              Read Online
            </a>
          )}
          <a
            href={`/library?shelf=${selectedBook.shelves[0]}&book=${encodeURIComponent(selectedBook.title)}`}
            className="mythic-earth-reader-btn literature-library-link"
          >
            View in Library
          </a>
        </div>
      </div>
    );
  }

  // Book grid
  return (
    <div className="literature-panel">
      <div className="alexandria-header libraries-header">
        <h3>Literature</h3>
        <p>~{allBooks.length} foundational texts spanning five millennia — sacred epics, mystical treatises, philosophical dialogues, and the works that shaped the study of myth.</p>
      </div>

      <div className="literature-controls">
        <div className="literature-sort-buttons">
          <button
            className={`mythic-earth-cat-btn${sortBy === 'date' ? ' active' : ''}`}
            style={{ '--cat-color': '#8b9dc3' }}
            onClick={() => { setSortBy('date'); trackElement('myths.literature.sort.date'); }}
          >
            Date
          </button>
          <button
            className={`mythic-earth-cat-btn${sortBy === 'title' ? ' active' : ''}`}
            style={{ '--cat-color': '#8b9dc3' }}
            onClick={() => { setSortBy('title'); trackElement('myths.literature.sort.title'); }}
          >
            Title
          </button>
          <button
            className={`mythic-earth-cat-btn${sortBy === 'region' ? ' active' : ''}`}
            style={{ '--cat-color': '#8b9dc3' }}
            onClick={() => { setSortBy('region'); trackElement('myths.literature.sort.region'); }}
          >
            Region
          </button>
        </div>
        <div className="literature-region-filter">
          <select
            value={regionFilter}
            onChange={e => { setRegionFilter(e.target.value); trackElement(`myths.literature.filter.${e.target.value}`); }}
          >
            {REGION_OPTIONS.map(r => (
              <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mythic-earth-site-grid">
        {filteredBooks.map(book => (
          <button
            key={book.id}
            className="mythic-earth-site-card literature-card"
            onClick={() => { setSelectedBook(book); trackElement(`myths.literature.book.${book.id}`); if (onFlyTo) onFlyTo(book, `book-${book.id}`); }}
          >
            <span className="site-card-name">{book.title}</span>
            {book.author && <span className="site-card-region">{book.author}</span>}
            {book.tradition && <span className="site-card-region">{book.tradition}</span>}
            <div className="literature-card-footer">
              <span className="alexandria-card-date">{book.year}</span>
              <span className="literature-card-region-badge">{book.region}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Ancient Temples Panel (3-level: temple grid → deity grid → deity detail) ── */
const TEMPLE_DOMAINS = [
  { id: 'all', label: 'All' },
  { id: 'creator', label: 'Creator' },
  { id: 'guardian', label: 'Guardian' },
  { id: 'cosmic', label: 'Cosmic' },
  { id: 'underworld', label: 'Underworld' },
  { id: 'warrior', label: 'Warrior' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'nature', label: 'Nature' },
  { id: 'love', label: 'Love' },
  { id: 'divine-figure', label: 'Divine Figure' },
  { id: 'sacred-object', label: 'Sacred Object' },
];

function TemplesPanel({ trackElement, timelineRange }) {
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDeity, setSelectedDeity] = useState(null);

  // Level 3: Deity detail
  if (selectedDeity) {
    return (
      <div className="alexandria-detail">
        <button className="mythic-earth-back" onClick={() => setSelectedDeity(null)}>
          {'\u2190'} Back to {selectedTemple.name}
        </button>
        <h3>{selectedDeity.title}</h3>
        <div className="alexandria-detail-meta">
          <span className="alexandria-detail-author">{selectedDeity.role}</span>
          <span className={`alexandria-detail-badge ${selectedDeity.domain}`}>{selectedDeity.domain}</span>
        </div>
        <div className="mythic-earth-site-text">
          {selectedDeity.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    );
  }

  // Level 2: Deity grid for selected temple
  if (selectedTemple) {
    const templeDomains = [...new Set(selectedTemple.deities.map(d => d.domain))];
    const filters = TEMPLE_DOMAINS.filter(d => d.id === 'all' || templeDomains.includes(d.id));
    const filteredDeities = activeFilter === 'all'
      ? selectedTemple.deities
      : selectedTemple.deities.filter(d => d.domain === activeFilter);

    return (
      <div className="alexandria-panel libraries-panel">
        <button className="mythic-earth-back" onClick={() => { setSelectedTemple(null); setActiveFilter('all'); }}>
          {'\u2190'} Back to Temples
        </button>
        <div className="alexandria-header libraries-header">
          <h3>{selectedTemple.name}</h3>
          <p className="library-card-location">{selectedTemple.location} &middot; {selectedTemple.era}</p>
          <p>{selectedTemple.tagline}</p>
        </div>

        <div className="alexandria-filters">
          {filters.map(f => (
            <button
              key={f.id}
              className={`mythic-earth-cat-btn${activeFilter === f.id ? ' active' : ''}`}
              style={{ '--cat-color': '#c47a5a' }}
              onClick={() => { setActiveFilter(f.id); trackElement(`myths.temple.${selectedTemple.id}.filter.${f.id}`); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mythic-earth-site-grid">
          {filteredDeities.map(deity => (
            <button
              key={deity.id}
              className="mythic-earth-site-card alexandria-card"
              onClick={() => { setSelectedDeity(deity); trackElement(`myths.temple.${selectedTemple.id}.deity.${deity.id}`); }}
            >
              <span className="site-card-name">{deity.title}</span>
              <span className="site-card-region">{deity.role}</span>
              <div className="alexandria-card-footer">
                <span className={`alexandria-card-badge ${deity.domain}`}>{deity.domain}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Level 1: Temple grid
  return (
    <div className="libraries-panel">
      <div className="alexandria-header libraries-header">
        <h3>Ancient Temples</h3>
        <p>Ten temples spanning five millennia and five continents — the great houses of worship where humanity honored its gods.</p>
      </div>

      <div className="mythic-earth-site-grid">
        {ancientTemples.filter(temple => {
          const era = parseEraString(temple.era);
          if (!era) return true; // no parseable date → always show
          return era.endYear >= timelineRange[0] && era.startYear <= timelineRange[1];
        }).map(temple => (
          <button
            key={temple.id}
            className="mythic-earth-site-card temple-card"
            onClick={() => { setSelectedTemple(temple); trackElement(`myths.temple.${temple.id}`); }}
          >
            <span className="site-card-name">{temple.name}</span>
            <span className="site-card-region">{temple.location}</span>
            <span className="temple-card-era">{temple.era}</span>
            <span className="temple-card-tagline">{temple.tagline}</span>
            <span className="temple-card-count">{temple.deities.length} deities</span>
          </button>
        ))}
      </div>
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
  const { trackElement } = useCoursework();
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
    trackElement(`myths.motifs.category.${catId}`);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [trackElement]);

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
  { id: 'overview', label: 'Overview' },
  { id: 'historical-core', label: 'Historical Core' },
  { id: 'myths', label: 'Myths' },
  { id: 'playlist', label: 'Playlist' },
  { id: 'references', label: 'References' },
  { id: 'music', label: 'Music & Media' },
  { id: 'productions', label: 'Previous Productions' },
];

/* ── Treasures content (inlined from TreasuresPage) ── */
function TreasuresContent({ currentEpisode, onSelectEpisode, viewToggle }) {
  const { trackElement } = useCoursework();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTheme, setActiveTheme] = useState(null);
  const [playlistActive, setPlaylistActive] = useState(false);

  const episodeData = treasuresData.episodes.find(ep => ep.id === currentEpisode);
  const isPlaceholder = episodeData && episodeData.themes.length === 0;

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    trackElement(`myths.treasures.tab.${tabId}`);
    if (tabId !== 'myths') setActiveTheme(null);
    // Activate playlist when Playlist tab is selected; other tabs leave it playing
    if (tabId === 'playlist') setPlaylistActive(true);
  }, [trackElement]);

  // Reset tab state when episode changes
  const prevEp = React.useRef(currentEpisode);
  React.useEffect(() => {
    if (prevEp.current !== currentEpisode) {
      prevEp.current = currentEpisode;
      setActiveTab('overview');
      setActiveTheme(null);
      setPlaylistActive(false);
    }
  }, [currentEpisode]);

  // Playlist stays active across tab switches; only closed via the X button
  const videoUrl = playlistActive && episodeData?.playlist ? episodeData.playlist : null;

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
        onCloseVideo={() => { setPlaylistActive(false); setActiveTab('overview'); }}
      />

      <div className="treasures-subtitle">{treasuresData.subtitle}</div>

      {viewToggle}

      {episodeData && (
        <h2 className="stage-heading">{episodeData.label.replace(/\n/g, ' ')}</h2>
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
                    {activeTab === 'overview' && (
                      <div className="treasures-overview">
                        <div className="treasures-overview-text">
                          {episodeData.overview ? (
                            episodeData.overview.split('\n\n').map((p, i) => (
                              <p key={i}>{p}</p>
                            ))
                          ) : (
                            <p className="treasures-empty">Overview coming soon.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'historical-core' && (
                      <div className="treasures-historical-core">
                        {episodeData.historicalCore ? (
                          <div className="treasures-body">
                            {episodeData.historicalCore.split('\n\n').map((p, i) => (
                              <p key={i}>{p}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="treasures-empty">Historical core coming soon.</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'myths' && (
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
                                {theme.content ? (
                                  theme.content.split('\n\n').map((p, i) => (
                                    <p key={i}>{p}</p>
                                  ))
                                ) : (
                                  <p className="treasures-empty">Research in development.</p>
                                )}
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
  const { trackElement } = useCoursework();
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
          onClick={() => { setActiveCulture('tarot'); setExpandedCard(null); setMinorSuitFilter(null); trackElement('myths.tarot.culture.tarot'); }}
        >
          Tarot
          <span className="mc-tab-count">78</span>
        </button>
        {CULTURES.map(c => (
          <button
            key={c.key}
            className={`mc-tab${activeCulture === c.key ? ' active' : ''}`}
            onClick={() => { setActiveCulture(c.key); setExpandedCard(null); setMinorSuitFilter(null); trackElement(`myths.tarot.culture.${c.key}`); }}
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
  const { trackElement } = useCoursework();
  const { register } = useAreaOverride();
  const [activeEntry, setActiveEntry] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [interviewMode, setInterviewMode] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailExpanded, setDetailExpanded] = useState({});

  const episodeData = allEpisodes.find(ep => ep.id === currentEpisode);
  const synthesisData = mythsSynthesis[currentEpisode] || null;

  // Register episode context for Atlas (area stays null — ChatPanel detects via pathname)
  useEffect(() => {
    register(null, { episode: currentEpisode });
    return () => register(null, null);
  }, [currentEpisode, register]);

  // Reset when episode changes
  const prevEp = React.useRef(currentEpisode);
  React.useEffect(() => {
    if (prevEp.current !== currentEpisode) {
      prevEp.current = currentEpisode;
      setActiveEntry(null);
      setVideoUrl(null);
      setInterviewMode(false);
      setExpandedEntry(null);
      setDetailOpen(false);
      setDetailExpanded({});
    }
  }, [currentEpisode]);

  // Handle CircleNav clicks — second click on same episode opens detail page
  const handleStageSelect = useCallback((ep) => {
    if (ep === currentEpisode && ep !== 'overview' && ep !== 'bio') {
      setDetailOpen(true);
      setDetailExpanded({});
      trackElement(`myths.series.detail.${ep}`);
    } else {
      setDetailOpen(false);
      setDetailExpanded({});
      onSelectEpisode(ep);
    }
  }, [currentEpisode, onSelectEpisode, trackElement]);

  const toggleDetailSection = useCallback((key) => {
    setDetailExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* ── Episode Detail Page ── */
  if (detailOpen && episodeData) {
    const storylineEntries = episodeData.entries.filter(e => !e.question);
    const questionEntries = episodeData.entries.filter(e => e.question);
    return (
      <div className="series-detail">
        <button className="series-detail-back" onClick={() => setDetailOpen(false)}>
          {'\u2190'} Back
        </button>

        <h2 className="series-detail-title">{episodeData.title}</h2>

        {episodeData.summary && (
          <p className="series-detail-summary">{episodeData.summary}</p>
        )}

        {episodeData.playlist && (
          <div className="series-detail-play">
            <button
              className={`myths-play-btn${videoUrl ? ' active' : ''}`}
              onClick={() => setVideoUrl(videoUrl ? null : episodeData.playlist)}
            >
              {videoUrl ? '\u25A0 Stop Playlist' : '\u25B6 Watch Playlist'}
            </button>
            {videoUrl && (
              <div className="series-detail-video">
                <iframe
                  src={videoUrl}
                  title={episodeData.title}
                  width="100%"
                  height="360"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

        {/* Overview */}
        {synthesisData && synthesisData.overview && (
          <div className="series-detail-overview">
            {synthesisData.overview.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Synthesis sections */}
        {synthesisData && (
          <div className="series-detail-section">
            <button
              className={`series-detail-section-btn${detailExpanded.synthesis ? ' open' : ''}`}
              onClick={() => toggleDetailSection('synthesis')}
            >
              <span className="series-detail-arrow">{detailExpanded.synthesis ? '\u25BC' : '\u25B6'}</span>
              Synthesis
            </button>
            {detailExpanded.synthesis && (
              <div className="series-detail-section-body">
                {synthesisData.sections.map((s, i) => (
                  <div key={i} className="series-detail-synth">
                    <h4 className="series-detail-synth-heading">{s.heading}</h4>
                    <div className="series-detail-synth-text">
                      {s.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Storyline */}
        {storylineEntries.length > 0 && (
          <div className="series-detail-section">
            <button
              className={`series-detail-section-btn${detailExpanded.storyline ? ' open' : ''}`}
              onClick={() => toggleDetailSection('storyline')}
            >
              <span className="series-detail-arrow">{detailExpanded.storyline ? '\u25BC' : '\u25B6'}</span>
              Storyline
            </button>
            {detailExpanded.storyline && (
              <div className="series-detail-section-body">
                {storylineEntries.map((entry, i) =>
                  entry.text.split('\n\n').map((p, j) => <p key={`${i}-${j}`}>{p}</p>)
                )}
              </div>
            )}
          </div>
        )}

        {/* Interview Q&A */}
        {questionEntries.length > 0 && (
          <div className="series-detail-section">
            <button
              className={`series-detail-section-btn${detailExpanded.interview ? ' open' : ''}`}
              onClick={() => toggleDetailSection('interview')}
            >
              <span className="series-detail-arrow">{detailExpanded.interview ? '\u25BC' : '\u25B6'}</span>
              Interview ({questionEntries.length})
            </button>
            {detailExpanded.interview && (
              <div className="series-detail-section-body">
                {questionEntries.map((entry, i) => (
                  <div key={i} className="series-detail-qa">
                    <button
                      className={`series-detail-qa-q${detailExpanded[`q-${i}`] ? ' open' : ''}`}
                      onClick={() => toggleDetailSection(`q-${i}`)}
                    >
                      <span className="series-detail-arrow">{detailExpanded[`q-${i}`] ? '\u25BE' : '\u25B8'}</span>
                      {entry.question}
                    </button>
                    {detailExpanded[`q-${i}`] && (
                      <div className="series-detail-qa-a">
                        {entry.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="myths-circle-wrapper">
        <CircleNav
          rings={RINGS}
          ringCircles={RING_CIRCLES}
          currentStage={currentEpisode}
          onSelectStage={handleStageSelect}
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
                  <div className="myths-mode-toggle">
                    <button
                      className={`myths-mode-btn${!interviewMode ? ' active' : ''}`}
                      onClick={() => { setInterviewMode(false); trackElement(`myths.series.mode.synthesis`); }}
                    >
                      Synthesis
                    </button>
                    <button
                      className={`myths-mode-btn${interviewMode ? ' active' : ''}`}
                      onClick={() => { setInterviewMode(true); trackElement(`myths.series.mode.transcript`); }}
                    >
                      Interview Transcript
                    </button>
                  </div>

                  {!interviewMode && synthesisData && (
                    <div className="myths-synthesis">
                      {synthesisData.overview && (
                        <div className="myths-synthesis-overview">
                          {synthesisData.overview.split('\n\n').map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                      {synthesisData.sections.map((s, i) => (
                        <div key={i} className="myths-synthesis-section">
                          <h4 className="myths-synthesis-heading">{s.heading}</h4>
                          <div className="myths-synthesis-body">
                            {s.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!interviewMode && !synthesisData && (
                    <div className="myths-interview-intro">
                      Synthesis coming soon for this episode.
                    </div>
                  )}

                  {interviewMode && (() => {
                    const storylineEntries = episodeData.entries.filter(e => !e.question);
                    const questionEntries = episodeData.entries.filter(e => e.question);
                    return (
                      <div className="myths-transcript">
                        <div className="myths-interview-intro">
                          From the interview with Will Linn for <em>Myths: The Greatest Mysteries of Humanity</em>.
                        </div>
                        {storylineEntries.length > 0 && (
                          <div className={`myths-transcript-entry${expandedEntry === 'storyline' ? ' expanded' : ''}`}>
                            <button
                              className="myths-transcript-question myths-transcript-storyline"
                              onClick={() => setExpandedEntry(expandedEntry === 'storyline' ? null : 'storyline')}
                            >
                              <span className="myths-transcript-question-text">Storyline</span>
                              <span className="myths-transcript-chevron">{expandedEntry === 'storyline' ? '\u25BE' : '\u25B8'}</span>
                            </button>
                            {expandedEntry === 'storyline' && (
                              <div className="myths-transcript-answer">
                                {storylineEntries.map((entry, i) =>
                                  entry.text.split('\n\n').map((p, j) => <p key={`${i}-${j}`}>{p}</p>)
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {questionEntries.map((entry, i) => (
                          <div key={i} className={`myths-transcript-entry${expandedEntry === i ? ' expanded' : ''}`}>
                            <button
                              className="myths-transcript-question"
                              onClick={() => setExpandedEntry(expandedEntry === i ? null : i)}
                            >
                              <span className="myths-transcript-question-text">{entry.question}</span>
                              <span className="myths-transcript-chevron">{expandedEntry === i ? '\u25BE' : '\u25B8'}</span>
                            </button>
                            {expandedEntry === i && (
                              <div className="myths-transcript-answer">
                                {entry.text.split('\n\n').map((p, j) => <p key={j}>{p}</p>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Cosmology View ── */
const COSMOLOGY_SECTIONS = {
  'normal-world': { ...worldData.normalWorld, accent: 'upper' },
  'threshold': { ...worldData.threshold, accent: 'gold' },
  'other-world': { ...worldData.otherWorld, accent: 'lower' },
};

function CosmologyView({ trackElement }) {
  const [activeSection, setActiveSection] = useState('normal-world');
  const [expanded, setExpanded] = useState({});
  const contentRef = useRef(null);

  const data = COSMOLOGY_SECTIONS[activeSection];

  const selectSection = useCallback((id) => {
    setActiveSection(id);
    setExpanded({});
    trackElement(`myths.cosmology.${id}`);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [trackElement]);

  const toggleSection = useCallback((label) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const renderExpandable = (label, content) => {
    if (!content) return null;
    const isOpen = expanded[label];
    return (
      <div className="cosmology-expand" key={label}>
        <button className={`cosmology-expand-btn${isOpen ? ' open' : ''}`} onClick={() => toggleSection(label)}>
          <span className="cosmology-expand-arrow">{isOpen ? '\u25BC' : '\u25B6'}</span>
          {label}
        </button>
        {isOpen && (
          <div className="cosmology-expand-body">
            {typeof content === 'object' && !Array.isArray(content)
              ? Object.entries(content).map(([k, v]) => (
                  <div className="cosmology-kv" key={k}>
                    <strong>{typeof v === 'object' ? v.name || v.title || k : k}</strong>
                    <p>{typeof v === 'object' ? v.description : v}</p>
                  </div>
                ))
              : <p>{String(content)}</p>
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cosmology-view">
      <div className="cosmology-diagram-wrap">
        <CosmologyCircle activeSection={activeSection} onSelect={selectSection} />
      </div>

      <h2 className="cosmology-mode-heading">Myths</h2>

      {/* Content panel */}
      <div className={`cosmology-content accent-${data.accent}`} ref={contentRef}>
        <h3 className="cosmology-content-title">{data.title}</h3>
        <p className="cosmology-content-subtitle">{data.subtitle}</p>
        <p className="cosmology-content-desc">{data.description}</p>
        {renderExpandable('Overview', data.overview)}
        {renderExpandable('Separation', data.separation)}
        {renderExpandable('Shelter', data.shelter)}
        {renderExpandable('Shadow', data.shadow)}
        {renderExpandable('Wasteland', data.wasteland)}
        {renderExpandable('Underworld', data.underworld)}
        {renderExpandable('Dimensions', data.dimensions)}
        {renderExpandable('Dream', data.dream)}
        {renderExpandable('Myths', data.myths)}
        {renderExpandable('Center', data.center)}
        {renderExpandable('Mimesis', data.mimesis)}
        {renderExpandable('Regeneration', data.regeneration)}
        {renderExpandable('Guardians', data.guardians)}
        {renderExpandable('Motifs', data.motifs)}
        {renderExpandable('Adze', data.adze)}
      </div>
    </div>
  );
}

/* ── Shared Cosmology Diagram ── */
function CosmologyCircle({ activeSection, onSelect }) {
  const s = activeSection;
  const upper = 'rgba(218,190,90,';   // warm yellow/gold — Normal World
  const lower = 'rgba(70,110,180,';   // cool deep blue — Other World
  const mid = 'rgba(100,180,100,';     // green — threshold (yellow + blue blend)

  return (
    <svg viewBox="60 5 230 195" className="cosmology-diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clip-top"><rect x="60" y="5" width="230" height="93" /></clipPath>
        <clipPath id="clip-bottom"><rect x="60" y="122" width="230" height="78" /></clipPath>
      </defs>
      {/* Top half arc stroke */}
      <path d="M 90 110 A 85 85 0 0 1 260 110" fill="none"
        stroke={s === 'normal-world' ? `${upper}0.8)` : `${upper}0.2)`} strokeWidth="1.2" pointerEvents="none" />
      {/* Top half fill */}
      <path d="M 175 25 A 85 85 0 0 1 260 110 L 90 110 A 85 85 0 0 1 175 25 Z"
        fill={s === 'normal-world' ? `${upper}0.32)` : `${upper}0.08)`} stroke="none"
        clipPath="url(#clip-top)" className="cosmology-hit-area" onClick={() => onSelect('normal-world')} />
      {/* Bottom half arc stroke */}
      <path d="M 90 110 A 85 85 0 0 0 260 110" fill="none"
        stroke={s === 'other-world' ? `${lower}0.8)` : `${lower}0.2)`} strokeWidth="1.2" pointerEvents="none" />
      {/* Bottom half fill */}
      <path d="M 90 110 A 85 85 0 0 0 260 110 Z"
        fill={s === 'other-world' ? `${lower}0.35)` : `${lower}0.1)`} stroke="none"
        clipPath="url(#clip-bottom)" className="cosmology-hit-area" onClick={() => onSelect('other-world')} />
      {/* Threshold band */}
      <rect x="90" y="98" width="170" height="24" rx="2"
        fill={s === 'threshold' ? `${mid}0.28)` : `${mid}0.08)`}
        stroke={s === 'threshold' ? `${mid}0.8)` : `${mid}0.25)`} strokeWidth="1"
        className="cosmology-hit-area" onClick={() => onSelect('threshold')} />
      <text x="175" y="114.5" textAnchor="middle" pointerEvents="none"
        fill={s === 'threshold' ? 'rgba(130,210,130,1)' : 'rgba(130,210,130,0.55)'}
        fontFamily="'Cinzel',serif" fontSize="10" fontWeight="600" letterSpacing="0.14em">THRESHOLD</text>
      {/* Normal World label */}
      <text x="175" y="64" textAnchor="middle" pointerEvents="none"
        fill={s === 'normal-world' ? 'rgba(245,225,130,0.75)' : 'rgba(245,225,130,0.3)'} fontSize="8.5" fontStyle="italic">
        Consciousness &#183; Ego &#183; Zenith</text>
      <text x="175" y="80" textAnchor="middle" pointerEvents="none"
        fill={s === 'normal-world' ? 'rgba(250,230,140,1)' : 'rgba(250,230,140,0.45)'}
        fontFamily="'Cinzel',serif" fontSize="13" fontWeight="600" letterSpacing="0.08em">NORMAL WORLD</text>
      {/* Other World label */}
      <text x="175" y="148" textAnchor="middle" pointerEvents="none"
        fill={s === 'other-world' ? 'rgba(150,195,255,1)' : 'rgba(150,195,255,0.45)'}
        fontFamily="'Cinzel',serif" fontSize="13" fontWeight="600" letterSpacing="0.08em">OTHER WORLD</text>
      <text x="175" y="166" textAnchor="middle" pointerEvents="none"
        fill={s === 'other-world' ? 'rgba(150,195,255,0.75)' : 'rgba(150,195,255,0.3)'} fontSize="8.5" fontStyle="italic">
        Unconscious &#183; Dream &#183; Nadir</text>
    </svg>
  );
}

/* ── Cosmology Cycles View ── */
const CYCLE_KEYS = ['Solar Day', 'Lunar Month', 'Solar Year', 'Wake & Sleep', 'Procreation', 'Mortality'];
const CYCLE_SOURCES = {
  'normal-world': { data: worldData.normalWorld, accent: 'upper' },
  'threshold': { data: worldData.threshold, accent: 'gold' },
  'other-world': { data: worldData.otherWorld, accent: 'lower' },
};

function CosmologyCycles({ trackElement }) {
  const [activeSection, setActiveSection] = useState('normal-world');

  const selectSection = useCallback((id) => {
    setActiveSection(id);
    trackElement(`myths.cosmology.cycles.${id}`);
  }, [trackElement]);

  const src = CYCLE_SOURCES[activeSection];

  return (
    <div className="cosmology-view">
      <div className="cosmology-diagram-wrap">
        <CosmologyCircle activeSection={activeSection} onSelect={selectSection} />
      </div>
      <h2 className="cosmology-mode-heading">Cycles</h2>
      <div className={`cosmology-content accent-${src.accent}`}>
        <h3 className="cosmology-content-title">{src.data.title}</h3>
        <p className="cosmology-content-subtitle">Natural Cycles</p>
        <div className="cosmology-cycles-grid">
          {CYCLE_KEYS.map(cycle => (
            <div className="cosmology-cycle-entry" key={cycle}>
              <strong className="cosmology-cycle-name">{cycle}</strong>
              <p>{src.data.cycles[cycle]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Cosmology Theorists View ── */
const THEORIST_SOURCES = {
  'normal-world': { data: worldData.normalWorld, accent: 'upper' },
  'threshold': { data: worldData.threshold, accent: 'gold' },
  'other-world': { data: worldData.otherWorld, accent: 'lower' },
};

function CosmologyTheorists({ trackElement }) {
  const [activeSection, setActiveSection] = useState('normal-world');

  const selectSection = useCallback((id) => {
    setActiveSection(id);
    trackElement(`myths.cosmology.theorists.${id}`);
  }, [trackElement]);

  const src = THEORIST_SOURCES[activeSection];

  return (
    <div className="cosmology-view">
      <div className="cosmology-diagram-wrap">
        <CosmologyCircle activeSection={activeSection} onSelect={selectSection} />
      </div>
      <h2 className="cosmology-mode-heading">Theorists</h2>
      <div className={`cosmology-content accent-${src.accent}`}>
        <h3 className="cosmology-content-title">{src.data.title}</h3>
        <p className="cosmology-content-subtitle">Theorists</p>
        <div className="cosmology-cycles-grid">
          {Object.entries(src.data.theorists).map(([key, t]) => (
            <div className="cosmology-cycle-entry" key={key}>
              <strong className="cosmology-cycle-name">{t.name}</strong>
              <p>{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Cosmology Films View ── */
const FILM_SOURCES = {
  'normal-world': { data: worldData.normalWorld, accent: 'upper' },
  'threshold': { data: worldData.threshold, accent: 'gold' },
  'other-world': { data: worldData.otherWorld, accent: 'lower' },
};

function CosmologyFilms({ trackElement }) {
  const [activeSection, setActiveSection] = useState('normal-world');

  const selectSection = useCallback((id) => {
    setActiveSection(id);
    trackElement(`myths.cosmology.films.${id}`);
  }, [trackElement]);

  const src = FILM_SOURCES[activeSection];

  return (
    <div className="cosmology-view">
      <div className="cosmology-diagram-wrap">
        <CosmologyCircle activeSection={activeSection} onSelect={selectSection} />
      </div>
      <h2 className="cosmology-mode-heading">Films</h2>
      <div className={`cosmology-content accent-${src.accent}`}>
        <h3 className="cosmology-content-title">{src.data.title}</h3>
        <p className="cosmology-content-subtitle">Films</p>
        {src.data.films ? (
          <div className="cosmology-cycles-grid">
            {Object.entries(src.data.films).map(([key, f]) => (
              <div className="cosmology-cycle-entry" key={key}>
                <strong className="cosmology-cycle-name">{f.title} ({f.year})</strong>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="cosmology-content-desc" style={{ opacity: 0.5, fontStyle: 'italic' }}>No films for this section yet.</p>
        )}
      </div>
    </div>
  );
}

/* ── URL ↔ view mapping ── */
const VIEW_PATHS = {
  earth: 'earth',
  series: 'series',
  treasures: 'treasures',
  motifs: 'motifs',
  tarot: 'tarot',
  cosmology: 'cosmology',
  'cosmology-cycles': 'cosmology-cycles',
  'cosmology-theorists': 'cosmology-theorists',
  'cosmology-films': 'cosmology-films',
  archetypes: 'archetypes',
};
const PATH_TO_VIEW = Object.fromEntries(Object.entries(VIEW_PATHS).map(([v, p]) => [p, v]));

function viewFromPath(pathname) {
  const sub = pathname.replace(/^\/myths\/?/, '').replace(/\/$/, '');
  return PATH_TO_VIEW[sub] || 'earth';
}

/* ── Pantheon Panel ── */
function PantheonField({ label, value }) {
  if (!value) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  if (!display) return null;
  return (
    <div className="pantheon-field">
      <span className="pantheon-field-label">{label}:</span>{' '}
      <span className="pantheon-field-value">{display}</span>
    </div>
  );
}

function PantheonPanel({ pantheonId, selectedDeity, onSelectDeity }) {
  const pantheon = PANTHEONS[pantheonId];
  if (!pantheon) return null;

  const groups = [
    { key: 'olympian', label: 'The Twelve Olympians' },
    { key: 'titan', label: 'Titans' },
    { key: 'other', label: 'Other Figures' },
  ];

  if (selectedDeity) {
    const d = selectedDeity;
    // Find prev/next within the same group
    const groupDeities = pantheon.deities.filter(dd => dd.group === d.group);
    const idx = groupDeities.findIndex(dd => dd.id === d.id);
    const prev = idx > 0 ? groupDeities[idx - 1] : null;
    const next = idx < groupDeities.length - 1 ? groupDeities[idx + 1] : null;
    return (
      <div className="pantheon-detail">
        <nav className="pantheon-nav">
          <button className="pantheon-nav-back" onClick={() => onSelectDeity(null)}>
            {pantheon.name}
          </button>
          <span className="pantheon-nav-sep">/</span>
          <span className="pantheon-nav-current">{d.name}</span>
        </nav>
        <h3 className="pantheon-deity-name">{d.name}</h3>
        <div className="pantheon-deity-meta">
          <span className="pantheon-deity-title">{d.title}</span>
          {d.planet && <span className="pantheon-planet-badge">{d.planet}</span>}
        </div>
        {d.description && (
          <div className="pantheon-deity-description">
            {d.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
        <div className="pantheon-fields">
          <PantheonField label="Animals" value={d.animals} />
          <PantheonField label="Colors" value={d.colors} />
          <PantheonField label="Metals" value={d.metals} />
          <PantheonField label="Weapons" value={d.weapons} />
          <PantheonField label="Vegetation" value={d.vegetation} />
          <PantheonField label="Consorts" value={d.consorts} />
          <PantheonField label="Birth" value={d.birthCreation} />
          <PantheonField label="Day" value={d.dayTime} />
          <PantheonField label="Holidays" value={d.holidays} />
        </div>
        <div className="pantheon-prev-next">
          {prev ? (
            <button className="pantheon-prev-next-btn" onClick={() => onSelectDeity(prev)}>
              &larr; {prev.name}
            </button>
          ) : <span />}
          {next ? (
            <button className="pantheon-prev-next-btn" onClick={() => onSelectDeity(next)}>
              {next.name} &rarr;
            </button>
          ) : <span />}
        </div>
      </div>
    );
  }

  return (
    <div className="pantheon-panel">
      {groups.map(g => {
        const deities = pantheon.deities.filter(d => d.group === g.key);
        if (deities.length === 0) return null;
        return (
          <div key={g.key} className="pantheon-group">
            <h4 className="pantheon-group-label">{g.label}</h4>
            <div className="pantheon-grid">
              {deities.map(d => (
                <button
                  key={d.id}
                  className={`pantheon-card${d.planet ? ' has-planet' : ''}`}
                  onClick={() => onSelectDeity(d)}
                >
                  <span className="pantheon-card-name">{d.name}</span>
                  <span className="pantheon-card-title">{d.title}</span>
                  {d.planet && <span className="pantheon-card-planet">{d.planet}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Combined Myths Page ── */
function MythsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackElement } = useCoursework();
  const { user } = useAuth();
  const { userSites, addUserSite, removeUserSite, savedSiteIds, saveSite, unsaveSite } = useProfile();
  const [activeView, setActiveView] = useState(() => viewFromPath(location.pathname));
  const [seriesEpisode, setSeriesEpisode] = useState('overview');
  const [treasuresEpisode, setTreasuresEpisode] = useState('overview');
  const [selectedMythicSite, setSelectedMythicSite] = useState(null);
  const [selectedPantheonDeity, setSelectedPantheonDeity] = useState(null);
  const flyToSeq = useRef(0);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [highlightedTimelinePin, setHighlightedTimelinePin] = useState(null);
  const handlePanelFlyTo = useCallback((coords, pinId) => {
    if (coords?.lat != null && coords?.lng != null) {
      flyToSeq.current += 1;
      setFlyToTarget({ ...coords, _seq: flyToSeq.current });
    }
    setHighlightedTimelinePin(pinId || null);
  }, []);
  const [mythicEarthCategory, setMythicEarthCategory] = useState('sacred-site');
  const [activeEarthFilters, setActiveEarthFilters] = useState(
    () => new Set(MYTHIC_EARTH_CATEGORIES.map(c => c.id))
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMySitesAdd, setShowMySitesAdd] = useState(false);
  const [activeTour, setActiveTour] = useState(null);
  const [activeTradition, setActiveTradition] = useState('all');
  const [traditionPanelOpen, setTraditionPanelOpen] = useState(false);
  const [displayPantheonOverride, setDisplayPantheonOverride] = useState(null);
  const earthContentRef = useRef(null);

  const userSitesList = useMemo(
    () => Object.values(userSites || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [userSites]
  );

  const savedSiteIdSet = useMemo(
    () => new Set(Object.keys(savedSiteIds || {})),
    [savedSiteIds]
  );

  const savedCuratedSites = useMemo(
    () => mythicEarthSites.filter(s => savedSiteIdSet.has(s.id)),
    [savedSiteIdSet]
  );

  const allMySites = useMemo(
    () => [...savedCuratedSites, ...userSitesList],
    [savedCuratedSites, userSitesList]
  );

  const tourSiteIds = useMemo(
    () => activeTour ? new Set(activeTour.siteIds) : null,
    [activeTour]
  );

  const traditionCounts = useMemo(() => {
    const counts = {};
    mythicEarthSites.forEach(s => {
      (s.pantheons || []).forEach(pid => {
        counts[pid] = (counts[pid] || 0) + 1;
      });
    });
    Object.entries(TRADITION_GROUPS).forEach(([groupId, memberIds]) => {
      counts[groupId] = mythicEarthSites.filter(s =>
        (s.pantheons || []).some(pid => memberIds.includes(pid))
      ).length;
    });
    return counts;
  }, []);

  const displayPantheonId = useMemo(() => {
    const p = selectedMythicSite?.pantheons;
    if (!p?.length) return null;
    if (displayPantheonOverride && p.includes(displayPantheonOverride)) return displayPantheonOverride;
    if (activeTradition !== 'all') {
      if (p.includes(activeTradition)) return activeTradition;
      const groupIds = TRADITION_GROUPS[activeTradition];
      if (groupIds) {
        const match = p.find(pid => groupIds.includes(pid));
        if (match) return match;
      }
    }
    return p[0];
  }, [selectedMythicSite, activeTradition, displayPantheonOverride]);

  const [timelineRange, setTimelineRange] = useState([-13000, 2026]);

  const timelinePins = useMemo(() => {
    const pins = [];
    mythicEarthSites.forEach(s => {
      const era = parseEraString(s.era);
      if (era) {
        const catDef = MYTHIC_EARTH_CATEGORIES.find(c => c.id === s.category);
        pins.push({ id: `site-${s.id}`, name: s.name, ...era, type: s.category, color: catDef?.color || '#c9a961' });
      }
    });
    mythicEarthMovements.forEach(m => {
      const era = parseEraString(m.founded);
      if (era) pins.push({ id: `movement-${m.id}`, name: m.name, ...era, type: 'movement', color: m.color || '#b07acc' });
    });
    getAllBooks().forEach(book => {
      if (book.era) {
        pins.push({
          id: `book-${book.id}`, name: book.title,
          ...book.era, type: 'book', color: '#8b9dc3',
        });
      }
    });
    ancientLibraries.forEach(lib => {
      const era = parseEraString(lib.era);
      if (era) pins.push({ id: `lib-${lib.id}`, name: lib.name, ...era, type: 'library', color: '#a89060' });
    });
    ancientTemples.forEach(temple => {
      const era = parseEraString(temple.era);
      if (era) pins.push({ id: `temple-${temple.id}`, name: temple.name, ...era, type: 'temple', color: '#c47a5a' });
    });
    return pins;
  }, []);

  const bookSites = useMemo(() =>
    getAllBooks()
      .filter(b => b.lat != null && b.lng != null)
      .map(b => ({
        id: `book-${b.id}`, name: b.title,
        lat: b.lat, lng: b.lng, era: b.year,
        category: 'literary-location', region: b.region,
        description: b.note || '', isBook: true,
      })),
    []
  );

  const librarySites = useMemo(() => {
    const sites = ancientLibraries
      .filter(lib => LIBRARY_COORDS[lib.id])
      .map(lib => ({
        id: `library-${lib.id}`,
        name: lib.name,
        lat: LIBRARY_COORDS[lib.id].lat,
        lng: LIBRARY_COORDS[lib.id].lng,
        era: lib.era,
        category: 'library',
        isLibrary: true,
        region: lib.location,
        description: lib.tagline || '',
      }));
    const mythSalonCoords = LIBRARY_COORDS['myth-salon'];
    if (mythSalonCoords) {
      sites.push({
        id: 'library-myth-salon',
        name: 'Myth Salon Library',
        lat: mythSalonCoords.lat,
        lng: mythSalonCoords.lng,
        era: '2020 – present',
        category: 'library',
        isLibrary: true,
        region: 'Mentone, Alabama',
        description: 'A living archive of mythological, spiritual, and cultural wisdom at the Mentone Mythouse Retreat.',
      });
    }
    return sites;
  }, []);

  useEffect(() => { trackElement('myths.page.visited'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Content updates in place when a site is selected — no viewport scrolling
  // so the user's view of the globe and controls stays fixed.

  // Sync activeView when URL changes (back/forward navigation)
  useEffect(() => {
    const view = viewFromPath(location.pathname);
    setActiveView(view);
  }, [location.pathname]);

  const handleViewSwitch = useCallback((view) => {
    setActiveView(view);
    trackElement(`myths.view.${view}`);
    const sub = VIEW_PATHS[view];
    navigate(sub ? `/myths/${sub}` : '/myths', { replace: false });
  }, [trackElement, navigate]);

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
              externalFilters={activeEarthFilters}
              externalTourSiteIds={tourSiteIds}
              externalTimelineRange={timelineRange}
              externalTradition={activeTradition}
              onSiteSelect={(site) => {
                setSelectedMythicSite(site);
                setDisplayPantheonOverride(null);
                if (site?.category === 'temple') setMythicEarthCategory('temple');
                else if (site?.category === 'library') setMythicEarthCategory('library');
                setHighlightedTimelinePin(site ? (site.isBook ? site.id : `site-${site.id}`) : null);
              }}
              externalSite={selectedMythicSite}
              externalFlyTo={flyToTarget}
              externalExtraSites={[
                ...librarySites,
                ...(selectedMythicSite?.category === 'library' ? bookSites : []),
              ]}
            />
          </Suspense>

          <div className="mythic-earth-content-area" ref={earthContentRef}>
            <div className="mythic-earth-categories">
              <button
                className={`mythic-earth-cat-btn tradition-dropdown-btn${activeTradition !== 'all' ? ' active' : ''}`}
                style={{ '--cat-color': '#c9a961' }}
                onClick={() => setTraditionPanelOpen(prev => !prev)}
              >
                {activeTradition === 'all'
                  ? 'Myths'
                  : TRADITION_REGIONS.flatMap(r => r.traditions).find(t => t.id === activeTradition)?.label || 'Myths'}
                <span className="tradition-dropdown-arrow">{traditionPanelOpen ? '\u25B2' : '\u25BC'}</span>
              </button>
              {MYTHIC_EARTH_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`mythic-earth-cat-btn${activeEarthFilters.has(cat.id) ? ' active' : ''}${mythicEarthCategory === 'my-sites' ? '' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => {
                    setActiveEarthFilters(prev => {
                      const next = new Set(prev);
                      if (next.has(cat.id)) next.delete(cat.id);
                      else next.add(cat.id);
                      return next;
                    });
                    setMythicEarthCategory(cat.id);
                    setSelectedMythicSite(null);
                    setActiveTour(null);
                    setHighlightedTimelinePin(null);
                    trackElement(`myths.earth.category.${cat.id}`);
                  }}
                >
                  {cat.label}
                </button>
              ))}
              <button
                className={`mythic-earth-cat-btn${mythicEarthCategory === 'tours' ? ' active' : ''}`}
                style={{ '--cat-color': '#b07acc' }}
                onClick={() => {
                  setMythicEarthCategory('tours');
                  setSelectedMythicSite(null);
                  setActiveTour(null);
                  trackElement('myths.earth.category.tours');
                }}
              >
                Tours
              </button>
              {user && (
                <button
                  className={`mythic-earth-cat-btn${mythicEarthCategory === 'my-sites' ? ' active' : ''}`}
                  style={{ '--cat-color': '#6bc5a0' }}
                  onClick={() => {
                    setMythicEarthCategory('my-sites');
                    setSelectedMythicSite(null);
                    trackElement('myths.earth.category.my-sites');
                  }}
                >
                  My Sites
                  {allMySites.length > 0 && (
                    <span style={{ marginLeft: 6, fontSize: '0.65rem', opacity: 0.7 }}>({allMySites.length})</span>
                  )}
                </button>
              )}
            </div>

            {traditionPanelOpen && (
              <div className="tradition-panel">
                <button className={`tradition-panel-item${activeTradition === 'all' ? ' active' : ''}`}
                  onClick={() => { setActiveTradition('all'); setTraditionPanelOpen(false); setSelectedMythicSite(null); }}>
                  Myths <span className="tradition-count">{mythicEarthSites.length}</span>
                </button>
                {TRADITION_REGIONS.map(region => {
                  const visible = region.traditions.filter(t => traditionCounts[t.id] > 0);
                  if (!visible.length) return null;
                  return (
                    <React.Fragment key={region.region}>
                      <div className="tradition-panel-region">{region.region}</div>
                      {visible.map(t => (
                        <button key={t.id}
                          className={`tradition-panel-item${activeTradition === t.id ? ' active' : ''}`}
                          onClick={() => {
                            setActiveTradition(t.id);
                            setTraditionPanelOpen(false);
                            setSelectedMythicSite(null);
                            setSelectedPantheonDeity(null);
                            setDisplayPantheonOverride(null);
                            trackElement(`myths.earth.tradition.${t.id}`);
                          }}>
                          {t.label} <span className="tradition-count">{traditionCounts[t.id]}</span>
                        </button>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {mythicEarthCategory !== 'tours' && mythicEarthCategory !== 'my-sites' && (
              <MythicAgesTimeline
                rangeStart={timelineRange[0]}
                rangeEnd={timelineRange[1]}
                onRangeChange={(s, e) => setTimelineRange([s, e])}
                pins={timelinePins}
                highlightedPinId={highlightedTimelinePin}
                onPinClick={(pin) => {
                  setHighlightedTimelinePin(pin.id);
                  if (pin.type === 'movement') return;
                  if (pin.type === 'book') {
                    const book = getAllBooks().find(b => `book-${b.id}` === pin.id);
                    if (book) {
                      setMythicEarthCategory('literary-location');
                      if (book.lat != null) handlePanelFlyTo(book, pin.id);
                      trackElement(`myths.earth.pin.book.${book.id}`);
                    }
                    return;
                  }
                  if (pin.type === 'library') {
                    setMythicEarthCategory('library');
                    const libId = pin.id.slice(4); // strip 'lib-'
                    if (libId && LIBRARY_COORDS[libId]) handlePanelFlyTo(LIBRARY_COORDS[libId], pin.id);
                    trackElement(`myths.earth.pin.${pin.id}`);
                    return;
                  }
                  if (pin.type === 'temple') {
                    setMythicEarthCategory('temple');
                    trackElement(`myths.earth.pin.${pin.id}`);
                    return;
                  }
                  const site = mythicEarthSites.find(s => `site-${s.id}` === pin.id);
                  if (site) {
                    setMythicEarthCategory(site.category);
                    setSelectedMythicSite(site);
                    trackElement(`myths.earth.pin.${site.id}`);
                  }
                }}
              />
            )}

            {mythicEarthCategory === 'tours' && !activeTour && !selectedMythicSite ? (
              <div className="mythic-earth-tour-panel">
                <div className="mythic-earth-tour-header">
                  <h3>Tours</h3>
                  <p>Curated journeys across the mythic landscape — follow a story from site to site.</p>
                </div>
                <div className="mythic-earth-tour-grid">
                  {MYTHIC_EARTH_TOURS.map(tour => (
                    <button
                      key={tour.id}
                      className="mythic-earth-tour-card"
                      style={{ '--tour-color': tour.color }}
                      onClick={() => {
                        setActiveTour(tour);
                        setActiveEarthFilters(new Set(MYTHIC_EARTH_CATEGORIES.map(c => c.id)));
                        trackElement(`myths.earth.tour.${tour.id}`);
                      }}
                    >
                      <span className="tour-card-name">{tour.name}</span>
                      <span className="tour-card-desc">{tour.description}</span>
                      <span className="tour-card-count">{tour.siteIds.length} sites</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : activeTour && !selectedMythicSite ? (
              <div className="mythic-earth-tour-panel">
                <button className="mythic-earth-back" onClick={() => setActiveTour(null)}>
                  {'\u2190'} Back to Tours
                </button>
                <div className="mythic-earth-tour-header">
                  <h3 style={{ color: activeTour.color }}>{activeTour.name}</h3>
                  <p>{activeTour.description}</p>
                </div>
                <div className="mythic-earth-site-grid">
                  {mythicEarthSites.filter(s => activeTour.siteIds.includes(s.id)).map(site => (
                    <button
                      key={site.id}
                      className="mythic-earth-site-card"
                      style={{ borderColor: `${activeTour.color}55` }}
                      onClick={() => { setSelectedMythicSite(site); trackElement(`myths.earth.tour.${activeTour.id}.site.${site.id}`); }}
                    >
                      <span className="site-card-name">{site.name}</span>
                      <span className="site-card-region">{site.region}</span>
                      {site.pantheons?.length > 0 && (
                        <span className="site-card-tradition">
                          {site.pantheons.map(pid => PANTHEONS[pid]?.name).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </button>
                  ))}
                  {activeTour.siteIds.filter(id => !mythicEarthSites.find(s => s.id === id)).length > 0 && (
                    <p className="mythic-earth-tour-placeholder">
                      {activeTour.siteIds.filter(id => !mythicEarthSites.find(s => s.id === id)).length} site(s) coming soon
                    </p>
                  )}
                </div>
              </div>
            ) : mythicEarthCategory === 'my-sites' && !selectedMythicSite ? (
              <div className="mythic-earth-site-grid-wrapper">
                {allMySites.length > 0 ? (
                  <div className="mythic-earth-site-grid">
                    {allMySites.map(site => (
                      <button
                        key={site.id}
                        className="mythic-earth-site-card"
                        style={{ borderColor: site.isUserSite ? 'rgba(107,197,160,0.3)' : `${MYTHIC_EARTH_CATEGORIES.find(c => c.id === site.category)?.color || 'rgba(107,197,160,0.3)'}55` }}
                        onClick={() => { setSelectedMythicSite(site); trackElement(`myths.earth.site.${site.id}`); }}
                      >
                        <span className="site-card-name">{site.name}</span>
                        <span className="site-card-region">{site.region || 'Unknown'}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: "'Crimson Pro', serif", padding: '20px 0' }}>
                    No sites yet. Save sites from their detail page, or add your own below.
                  </p>
                )}
                {showMySitesAdd ? (
                  <AddSiteForm
                    onAdd={(data) => { addUserSite(data); setShowMySitesAdd(false); }}
                    onCancel={() => setShowMySitesAdd(false)}
                  />
                ) : (
                  <button
                    className="mythic-earth-add-site-toggle"
                    onClick={() => setShowMySitesAdd(true)}
                  >
                    + Add a Site
                  </button>
                )}
              </div>
            ) : mythicEarthCategory === 'literary-location' && !selectedMythicSite ? (
              <LiteraturePanel trackElement={trackElement} timelineRange={timelineRange} onFlyTo={handlePanelFlyTo} />
            ) : mythicEarthCategory === 'temple' || selectedMythicSite?.category === 'temple' ? (
              <TemplesPanel trackElement={trackElement} timelineRange={timelineRange} />
            ) : mythicEarthCategory === 'library' || selectedMythicSite?.category === 'library' ? (
              <LibrariesPanel trackElement={trackElement} timelineRange={timelineRange} onFlyTo={handlePanelFlyTo} />
            ) : selectedMythicSite ? (
              <div className="mythic-earth-site-detail">
                <button className="mythic-earth-back" onClick={() => { setSelectedMythicSite(null); setSelectedPantheonDeity(null); setDisplayPantheonOverride(null); setHighlightedTimelinePin(null); }}>
                  {'\u2190'} Back to {activeTradition !== 'all' ? (TRADITION_REGIONS.flatMap(r => r.traditions).find(t => t.id === activeTradition)?.label || 'Sites') : mythicEarthCategory === 'my-sites' ? 'My Sites' : (MYTHIC_EARTH_CATEGORIES.find(c => c.id === mythicEarthCategory)?.label || 'Sites')}
                </button>
                <h3>{selectedMythicSite.name}</h3>
                <div className="mythic-earth-site-tags">
                  <span
                    className="mythic-earth-tag"
                    style={{ background: selectedMythicSite.isUserSite ? '#6bc5a0' : (MYTHIC_EARTH_CATEGORIES.find(c => c.id === selectedMythicSite.category)?.color) }}
                  >
                    {selectedMythicSite.isUserSite ? 'My Site' : (MYTHIC_EARTH_CATEGORIES.find(c => c.id === selectedMythicSite.category)?.label)}
                  </span>
                  {selectedMythicSite.pantheons?.length > 0 && selectedMythicSite.pantheons.some(pid => PANTHEONS[pid]) && (
                    <span className="mythic-earth-tag tradition">
                      {selectedMythicSite.pantheons.map(pid => PANTHEONS[pid]?.name).filter(Boolean).join(' / ')}
                    </span>
                  )}
                  <span className="mythic-earth-tag region">{selectedMythicSite.region}</span>
                  {selectedMythicSite.era && selectedMythicSite.era !== 'mythic' && selectedMythicSite.era !== 'nature' && (
                    <span className="mythic-earth-tag era">{selectedMythicSite.era}</span>
                  )}
                  {user && !selectedMythicSite.isUserSite && (
                    <button
                      className={`mythic-earth-tag mythic-earth-save-btn${savedSiteIdSet.has(selectedMythicSite.id) ? ' saved' : ''}`}
                      onClick={() => {
                        if (savedSiteIdSet.has(selectedMythicSite.id)) {
                          unsaveSite(selectedMythicSite.id);
                        } else {
                          saveSite(selectedMythicSite.id);
                        }
                      }}
                    >
                      {savedSiteIdSet.has(selectedMythicSite.id) ? '\u2713 My Sites' : '+ My Sites'}
                    </button>
                  )}
                </div>
                {selectedMythicSite.isUserSite && (
                  <div style={{ textAlign: 'center', margin: '12px 0' }}>
                    <button
                      className="mythic-earth-delete-site-btn"
                      onClick={() => { removeUserSite(selectedMythicSite.id); setSelectedMythicSite(null); }}
                    >
                      Delete This Site
                    </button>
                  </div>
                )}
                <StreetViewEmbed site={selectedMythicSite} />
                <div className="mythic-earth-site-text">
                  {(selectedMythicSite.description || '').split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
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

                {displayPantheonId && (
                  <>
                    {selectedMythicSite.pantheons?.length > 1 && (
                      <div className="pantheon-tradition-tabs">
                        {selectedMythicSite.pantheons.filter(pid => PANTHEONS[pid]).map(pid => (
                          <button key={pid} className={pid === displayPantheonId ? 'active' : ''}
                            onClick={() => { setDisplayPantheonOverride(pid); setSelectedPantheonDeity(null); }}>
                            {PANTHEONS[pid].name}
                          </button>
                        ))}
                      </div>
                    )}
                    <PantheonPanel
                      pantheonId={displayPantheonId}
                      selectedDeity={selectedPantheonDeity}
                      onSelectDeity={setSelectedPantheonDeity}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="mythic-earth-site-grid">
                {mythicEarthSites.filter(s => {
                  if (activeTradition !== 'all') {
                    const matchIds = TRADITION_GROUPS[activeTradition] || [activeTradition];
                    if (!s.pantheons || !s.pantheons.some(pid => matchIds.includes(pid))) return false;
                  }
                  if (activeTradition === 'all' && s.category !== mythicEarthCategory) return false;
                  const era = parseEraString(s.era);
                  if (!era) return true; // mythic/undated always show
                  return era.endYear >= timelineRange[0] && era.startYear <= timelineRange[1];
                }).map(site => (
                  <button
                    key={site.id}
                    className="mythic-earth-site-card"
                    onClick={() => { setSelectedMythicSite(site); setDisplayPantheonOverride(null); trackElement(`myths.earth.site.${site.id}`); }}
                  >
                    <span className="site-card-name">{site.name}</span>
                    <span className="site-card-region">{site.region}</span>
                    {site.pantheons?.length > 0 && (
                      <span className="site-card-tradition">
                        {site.pantheons.map(pid => PANTHEONS[pid]?.name).filter(Boolean).join(', ')}
                      </span>
                    )}
                    {site.era && site.era !== 'mythic' && site.era !== 'nature' && <span className="site-card-era">{site.era}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : activeView === 'series' ? (
        <SeriesContent
          currentEpisode={seriesEpisode}
          onSelectEpisode={(ep) => { setSeriesEpisode(ep); trackElement(`myths.series.episode.${ep}`); }}
          viewToggle={viewToggle}
        />
      ) : activeView === 'treasures' ? (
        <TreasuresContent
          currentEpisode={treasuresEpisode}
          onSelectEpisode={(ep) => { setTreasuresEpisode(ep); trackElement(`myths.treasures.episode.${ep}`); }}
          viewToggle={viewToggle}
        />
      ) : activeView === 'motifs' ? (
        <MotifIndex />
      ) : activeView === 'tarot' ? (
        <Navigate to="/divination/tarot" replace />
      ) : activeView === 'cosmology' ? (
        <CosmologyView trackElement={trackElement} />
      ) : activeView === 'cosmology-cycles' ? (
        <CosmologyCycles trackElement={trackElement} />
      ) : activeView === 'cosmology-theorists' ? (
        <CosmologyTheorists trackElement={trackElement} />
      ) : activeView === 'cosmology-films' ? (
        <CosmologyFilms trackElement={trackElement} />
      ) : activeView === 'archetypes' ? (
        <ArchetypesPanel trackElement={trackElement} trackPrefix="myths" />
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
          className={`myths-float-btn${activeView.startsWith('cosmology') ? ' active' : ''}`}
          onClick={() => {
            const cosmoViews = ['cosmology', 'cosmology-cycles', 'cosmology-theorists', 'cosmology-films'];
            const idx = cosmoViews.indexOf(activeView);
            handleViewSwitch(cosmoViews[(idx + 1) % cosmoViews.length]);
          }}
          title="Mythic Cosmology"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </button>
        <button
          className={`myths-float-btn${activeView === 'archetypes' ? ' active' : ''}`}
          onClick={() => handleViewSwitch('archetypes')}
          title="Archetypes"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21c0-3.5 2.9-6.5 6.5-6.5s6.5 3 6.5 6.5" />
          </svg>
        </button>
        <button
          className={`myths-float-btn${activeView === 'series' || activeView === 'treasures' ? ' active' : ''}`}
          onClick={() => handleViewSwitch(activeView === 'treasures' ? 'treasures' : 'series')}
          title="Myths Content"
        >
          <span className="myths-float-m">M</span>
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
      </div>
    </div>
  );
}

export default MythsPage;
