import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../../profile/ProfileContext';
import usePlanetData from '../../hooks/usePlanetData';
import MetalDetailPanel from '../../components/chronosphaera/MetalDetailPanel';
import RingDiagram2D from './RingDiagram2D';
import { BIRTHSTONE_KEYS } from '../Crown/Gemstone3D';
import mythicCalendar from '../../data/mythicCalendar.json';
import zodiacData from '../../data/chronosphaeraZodiac.json';
import cardinalsData from '../../data/chronosphaeraCardinals.json';
import RingButton from '../../components/RingButton';
import '../Crown/CrownPage.css';
import './Ring2DPage.css';

const DATE_TYPES = [
  { key: 'birthday',    label: 'Birthday' },
  { key: 'engagement',  label: 'Engagement' },
  { key: 'wedding',     label: 'Wedding' },
  { key: 'anniversary', label: 'Anniversary' },
  { key: 'secret',      label: 'Secret' },
  { key: 'other',       label: 'Other' },
];

const FORM_TYPES = [
  { key: 'ring',     label: 'Ring' },
  { key: 'bracelet', label: 'Bracelet' },
  { key: 'belt',     label: 'Belt' },
  { key: 'armband',  label: 'Arm Band' },
  { key: 'crown',    label: 'Crown' },
];

const METAL_TYPES = [
  { key: 'gold',        label: 'Gold' },
  { key: 'silver',      label: 'Silver' },
  { key: 'meteorSteel', label: 'Meteor Steel' },
  { key: 'bronze',      label: 'Bronze' },
  { key: 'copper',      label: 'Copper' },
  { key: 'tin',         label: 'Tin' },
  { key: 'lead',        label: 'Lead' },
];

function parseDate(val) {
  if (!val) return null;
  const [y, m, d] = val.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function Ring2DPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { natalChart, ringForm, updateRingForm, ringMetal, updateRingMetal, ringLayout, updateRingLayout, ringMode, updateRingMode, ringZodiacMode, updateRingZodiacMode, jewelryConfig, updateJewelryConfig } = useProfile();
  const formConfig = jewelryConfig?.[ringForm] || { size: null, date: '', dateType: 'birthday' };
  const mergedData = usePlanetData();

  // Selection state
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [selectedSign, setSelectedSign] = useState(null);
  const [selectedCardinal, setSelectedCardinal] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCulture, setActiveCulture] = useState(null);
  const mode = ringMode;
  const setMode = updateRingMode;
  const zodiacMode = ringZodiacMode;
  const setZodiacMode = updateRingZodiacMode;

  // Date/form state
  const [dates, setDates] = useState({ birthday: '', engagement: '', wedding: '', anniversary: '', secret: '', other: '' });
  const [activeDateType, setActiveDateType] = useState('birthday');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const [formDropOpen, setFormDropOpen] = useState(false);
  const [metalDropOpen, setMetalDropOpen] = useState(false);
  const datePickerRef = useRef(null);
  const formPickerRef = useRef(null);
  const metalPickerRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!dateDropOpen && !formDropOpen && !metalDropOpen) return;
    const handleClick = (e) => {
      if (dateDropOpen && datePickerRef.current && !datePickerRef.current.contains(e.target)) setDateDropOpen(false);
      if (formDropOpen && formPickerRef.current && !formPickerRef.current.contains(e.target)) setFormDropOpen(false);
      if (metalDropOpen && metalPickerRef.current && !metalPickerRef.current.contains(e.target)) setMetalDropOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dateDropOpen, formDropOpen, metalDropOpen]);

  // URL param / natal chart birthday
  useEffect(() => {
    const bd = searchParams.get('birthday');
    if (bd && /^\d{4}-\d{2}-\d{2}$/.test(bd)) {
      setDates(prev => ({ ...prev, birthday: bd }));
      setActiveDateType('birthday');
    } else if (natalChart?.birthData) {
      const { year, month, day } = natalChart.birthData;
      const val = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setDates(prev => prev.birthday ? prev : { ...prev, birthday: val });
    }
  }, [searchParams, natalChart]);

  // Load per-form date config
  useEffect(() => {
    const fc = jewelryConfig?.[ringForm];
    if (!fc) return;
    setActiveDateType(fc.dateType || 'birthday');
    if (fc.date) setDates(prev => ({ ...prev, [fc.dateType || 'birthday']: fc.date }));
  }, [ringForm, jewelryConfig]);

  // Apply form/metal/layout from URL params
  useEffect(() => {
    const formParam = searchParams.get('form');
    const metalParam = searchParams.get('metal');
    const layoutParam = searchParams.get('layout');
    if (formParam && FORM_TYPES.some(f => f.key === formParam)) updateRingForm(formParam);
    else updateRingForm('ring');
    if (metalParam && METAL_TYPES.some(m => m.key === metalParam)) updateRingMetal(metalParam);
    if (layoutParam && (layoutParam === 'astronomical' || layoutParam === 'navaratna')) updateRingLayout(layoutParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = (e) => {
    const val = e.target.value;
    setDates(prev => ({ ...prev, [activeDateType]: val }));
    updateJewelryConfig(ringForm, { date: val, dateType: activeDateType });
  };

  const handleClear = () => {
    setDates(prev => ({ ...prev, [activeDateType]: '' }));
    updateJewelryConfig(ringForm, { date: '' });
  };

  const activeInput = dates[activeDateType];
  const activeDate = parseDate(activeInput);

  const birthstone = useMemo(() => {
    const bd = parseDate(dates.birthday) || activeDate;
    if (!bd) return null;
    const entry = mythicCalendar[bd.getMonth()];
    if (!entry || !entry.stone) return null;
    const name = entry.stone.name;
    const key = BIRTHSTONE_KEYS[name];
    return key ? { name, key } : null;
  }, [dates.birthday, activeDate]);

  // Fallback: if birthday is cleared while in birthstone mode, revert to heliocentric
  useEffect(() => {
    if (mode === 'birthstone' && !birthstone) setMode('heliocentric');
  }, [birthstone, mode]);

  // Default bracelet to geocentric
  useEffect(() => {
    if (ringForm === 'bracelet' && mode === 'heliocentric') setMode('geocentric');
  }, [ringForm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear selections when switching
  const handleSelectPlanet = (p) => {
    setSelectedPlanet(prev => prev === p ? null : p);
    setSelectedSign(null);
    setSelectedCardinal(null);
    setActiveTab('overview');
  };
  const handleSelectSign = (s) => {
    setSelectedSign(prev => prev === s ? null : s);
    setSelectedPlanet(null);
    setSelectedCardinal(null);
  };
  const handleSelectCardinal = (c) => {
    setSelectedCardinal(prev => prev === c ? null : c);
    setSelectedPlanet(null);
    setSelectedSign(null);
  };

  const currentData = selectedPlanet ? (mergedData[selectedPlanet] || null) : null;

  // Build URL params string for navigation
  const buildParams = () => {
    const params = new URLSearchParams();
    if (ringForm) params.set('form', ringForm);
    if (ringMetal) params.set('metal', ringMetal);
    if (ringLayout) params.set('layout', ringLayout);
    if (dates[activeDateType]) {
      params.set('birthday', dates[activeDateType]);
    }
    return params.toString();
  };

  const hasContent = selectedPlanet || selectedSign || selectedCardinal;

  return (
    <div className="ring2d-page">
      <RingButton />
      <div className="ring2d-diagram-area">
        <RingDiagram2D
          birthDate={activeDate}
          mode={mode}
          zodiacMode={zodiacMode}
          selectedPlanet={selectedPlanet}
          onSelectPlanet={handleSelectPlanet}
          hoveredPlanet={hoveredPlanet}
          onHoverPlanet={setHoveredPlanet}
          selectedSign={selectedSign}
          onSelectSign={handleSelectSign}
          selectedCardinal={selectedCardinal}
          onSelectCardinal={handleSelectCardinal}
        />
      </div>

      {/* Content panel */}
      {hasContent && (
        <div className="ring2d-content">
          {selectedPlanet && currentData && (
            <>
              <h2 className="chrono-heading">
                <span className="chrono-heading-title-row">{selectedPlanet}</span>
                <span className="chrono-sub">{currentData.core?.metal || ''}</span>
              </h2>
              <div className="container">
                <div id="content-container">
                  <MetalDetailPanel
                    data={currentData}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    activeCulture={activeCulture}
                    onSelectCulture={setActiveCulture}
                  />
                </div>
              </div>
            </>
          )}
          {selectedSign && (
            <>
              <h2 className="chrono-heading">
                <span className="chrono-heading-title-row">{selectedSign}</span>
                <span className="chrono-sub">{zodiacData.find(z => z.sign === selectedSign)?.archetype || 'Zodiac'}</span>
              </h2>
              <div className="container">
                <div id="content-container">
                  <ZodiacContent sign={selectedSign} />
                </div>
              </div>
            </>
          )}
          {selectedCardinal && (
            <>
              <h2 className="chrono-heading">
                <span className="chrono-heading-title-row">{cardinalsData[selectedCardinal]?.label || selectedCardinal}</span>
                <span className="chrono-sub">Cardinal Point</span>
              </h2>
              <div className="container">
                <div id="content-container">
                  <CardinalContent id={selectedCardinal} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {birthstone && (
        <div className="crown-birthstone-label">{birthstone.name}</div>
      )}

      {/* Settings bar — matches CrownPage exactly */}
      <div className="crown-birthday-bar">
        <div className="crown-date-picker" ref={formPickerRef}>
          <button
            className="crown-date-trigger"
            onClick={() => setFormDropOpen(prev => !prev)}
          >
            {FORM_TYPES.find(f => f.key === ringForm)?.label || 'Ring'}
            <span className="crown-date-chevron">&#x25BE;</span>
          </button>
          {formDropOpen && (
            <div className="crown-date-dropdown">
              {FORM_TYPES.map(f => (
                <button
                  key={f.key}
                  className={`crown-date-option${ringForm === f.key ? ' active' : ''}`}
                  onClick={() => { updateRingForm(f.key); setFormDropOpen(false); }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="crown-date-picker" ref={metalPickerRef}>
          <button
            className="crown-date-trigger"
            onClick={() => setMetalDropOpen(prev => !prev)}
          >
            {METAL_TYPES.find(m => m.key === ringMetal)?.label || 'Gold'}
            <span className="crown-date-chevron">&#x25BE;</span>
          </button>
          {metalDropOpen && (
            <div className="crown-date-dropdown">
              {METAL_TYPES.map(m => (
                <button
                  key={m.key}
                  className={`crown-date-option${ringMetal === m.key ? ' active' : ''}`}
                  onClick={() => { updateRingMetal(m.key); setMetalDropOpen(false); }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={`crown-layout-toggle${ringLayout === 'navaratna' ? ' navaratna' : ''}`}
          onClick={() => updateRingLayout(ringLayout === 'astronomical' ? 'navaratna' : 'astronomical')}
          title={ringLayout === 'astronomical' ? 'Astronomical — stones at real positions' : 'Navaratna — traditional clustered layout'}
        >
          {ringLayout === 'astronomical' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#c9a961" strokeWidth="1" opacity="0.4" />
              <circle cx="12" cy="4" r="1.5" fill="#c9a961" />
              <circle cx="19" cy="9" r="1.5" fill="#c9a961" />
              <circle cx="18" cy="17" r="1.5" fill="#c9a961" />
              <circle cx="6" cy="17" r="1.5" fill="#c9a961" />
              <circle cx="5" cy="9" r="1.5" fill="#c9a961" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#f0c040" strokeWidth="1" opacity="0.4" />
              <circle cx="12" cy="4" r="2" fill="#f0c040" />
              <circle cx="9" cy="6.5" r="1.3" fill="#f0c040" />
              <circle cx="15" cy="6.5" r="1.3" fill="#f0c040" />
              <circle cx="7.5" cy="9" r="1.3" fill="#f0c040" />
              <circle cx="16.5" cy="9" r="1.3" fill="#f0c040" />
            </svg>
          )}
        </button>
        <span className="crown-mode-divider" />
        <div className="crown-date-picker" ref={datePickerRef}>
          <button
            className="crown-date-trigger"
            onClick={() => setDateDropOpen(prev => !prev)}
          >
            {DATE_TYPES.find(dt => dt.key === activeDateType).label}
            <span className="crown-date-chevron">&#x25BE;</span>
          </button>
          {dateDropOpen && (
            <div className="crown-date-dropdown">
              {DATE_TYPES.map(dt => (
                <button
                  key={dt.key}
                  className={`crown-date-option${activeDateType === dt.key ? ' active' : ''}${dates[dt.key] ? ' has-date' : ''}`}
                  onClick={() => {
                    setActiveDateType(dt.key);
                    setDateDropOpen(false);
                    if (dates[dt.key]) {
                      updateJewelryConfig(ringForm, { dateType: dt.key, date: dates[dt.key] });
                    }
                  }}
                >
                  {dt.label}
                  {dates[dt.key] && <span className="crown-date-dot" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="date"
          className="crown-date-input"
          value={activeInput}
          onChange={handleDateChange}
        />
        {activeDate && (
          <button className="crown-clear-btn" onClick={handleClear}>
            Clear
          </button>
        )}
        <button
          className="crown-clear-btn crown-zodiac-toggle"
          onClick={() => setZodiacMode(prev => prev === 'tropical' ? 'sidereal' : 'tropical')}
          title={zodiacMode === 'tropical' ? 'Switch to Sidereal zodiac' : 'Switch to Tropical zodiac'}
        >
          {zodiacMode === 'tropical' ? 'Tropical' : 'Sidereal'}
        </button>
        <span className="crown-mode-divider" />
        <div className="crown-mode-toggle">
          <button
            className={`crown-mode-btn${mode === 'heliocentric' ? ' active' : ''}`}
            onClick={() => setMode('heliocentric')}
            title="Heliocentric — Sun centered"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="4.5" fill={mode === 'heliocentric' ? '#f0c040' : '#c9a961'} opacity={mode === 'heliocentric' ? 1 : 0.5} />
              {[0,45,90,135,180,225,270,315].map(a => (
                <line key={a} x1={12+Math.cos(a*Math.PI/180)*6.5} y1={12+Math.sin(a*Math.PI/180)*6.5} x2={12+Math.cos(a*Math.PI/180)*9} y2={12+Math.sin(a*Math.PI/180)*9} stroke={mode === 'heliocentric' ? '#f0c040' : '#c9a961'} strokeWidth="1.5" strokeLinecap="round" opacity={mode === 'heliocentric' ? 1 : 0.5} />
              ))}
            </svg>
          </button>
          <button
            className={`crown-mode-btn${mode === 'geocentric' ? ' active' : ''}`}
            onClick={() => setMode('geocentric')}
            title="Geocentric — Earth centered"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="7" stroke={mode === 'geocentric' ? '#4a9bd9' : '#c9a961'} strokeWidth="1.5" fill={mode === 'geocentric' ? '#1a4a6a' : 'none'} opacity={mode === 'geocentric' ? 1 : 0.5} />
              <ellipse cx="12" cy="12" rx="3" ry="7" stroke={mode === 'geocentric' ? '#4a9bd9' : '#c9a961'} strokeWidth="1" opacity={mode === 'geocentric' ? 1 : 0.5} />
              <line x1="5" y1="12" x2="19" y2="12" stroke={mode === 'geocentric' ? '#4a9bd9' : '#c9a961'} strokeWidth="1" opacity={mode === 'geocentric' ? 1 : 0.5} />
              <circle cx="12" cy="12" r="7" stroke="none" fill={mode === 'geocentric' ? '#2a8a3a' : 'none'} opacity="0.2" />
            </svg>
          </button>
          <button
            className={`crown-mode-btn${mode === 'birthstone' ? ' active' : ''}${!birthstone ? ' disabled' : ''}`}
            onClick={() => birthstone && setMode('birthstone')}
            disabled={!birthstone}
            title={birthstone ? `Birthstone — ${birthstone.name}` : 'Birthstone — enter a birthday first'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 3 L17 9 L12 21 L7 9 Z" fill={mode === 'birthstone' ? '#f0c040' : 'none'} opacity={mode === 'birthstone' ? 0.25 : 0} />
              <path d="M12 3 L17 9 L12 21 L7 9 Z" stroke={mode === 'birthstone' ? '#f0c040' : '#c9a961'} strokeWidth="1.5" strokeLinejoin="round" opacity={mode === 'birthstone' ? 1 : 0.5} />
              <line x1="7" y1="9" x2="17" y2="9" stroke={mode === 'birthstone' ? '#f0c040' : '#c9a961'} strokeWidth="1" opacity={mode === 'birthstone' ? 1 : 0.5} />
              <line x1="12" y1="3" x2="12" y2="9" stroke={mode === 'birthstone' ? '#f0c040' : '#c9a961'} strokeWidth="0.8" opacity={mode === 'birthstone' ? 0.7 : 0.3} />
            </svg>
          </button>
        </div>
        <span className="crown-mode-divider" />
        <div className="crown-ring-size">
          <label className="crown-ring-size-label">Size</label>
          <input
            type="number"
            className="crown-ring-size-input"
            min="1"
            max="16"
            step="0.5"
            placeholder="—"
            value={formConfig.size ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              updateJewelryConfig(ringForm, { size: v === '' ? null : parseFloat(v) });
            }}
          />
        </div>
        <button
          className="crown-store-btn"
          title="View in store"
          onClick={() => {
            const params = new URLSearchParams({ highlight: 'jewelry', form: ringForm || 'ring' });
            if (ringMetal) params.set('metal', ringMetal);
            if (ringLayout) params.set('layout', ringLayout);
            if (formConfig.size != null) params.set('size', formConfig.size);
            if (dates[activeDateType]) {
              params.set('date', dates[activeDateType]);
              params.set('dateType', activeDateType);
            }
            navigate(`/store?${params.toString()}`);
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5H6z" stroke="#c9a961" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="3" y1="7" x2="21" y2="7" stroke="#c9a961" strokeWidth="1.5" />
            <path d="M16 11a4 4 0 01-8 0" stroke="#c9a961" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="ring2d-view-toggle"
          title="Switch to 3D view"
          onClick={() => navigate(`/ring?${buildParams()}`)}
        >
          3D
        </button>
      </div>
    </div>
  );
}

/* ── Inline content components ────────────────────────────────────── */

function ZodiacContent({ sign }) {
  const z = zodiacData.find(d => d.sign === sign);
  if (!z) return <p className="chrono-empty">No data for {sign}.</p>;

  return (
    <div className="metal-detail-panel">
      <div className="tab-content">
        {z.dates && <p style={{ color: 'rgba(201,169,97,0.7)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{z.dates}</p>}
        {z.element && <p style={{ color: 'rgba(201,169,97,0.8)', fontSize: '0.85rem' }}>Element: {z.element} &middot; Quality: {z.quality || ''}</p>}
        {z.ruling_planet && <p style={{ color: 'rgba(201,169,97,0.8)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Ruling Planet: {z.ruling_planet}</p>}
        {z.archetype && <p style={{ color: '#c9a961', fontStyle: 'italic', marginBottom: '0.75rem' }}>{z.archetype}</p>}
        {z.description && <p style={{ color: '#d0c8b0', lineHeight: 1.6 }}>{z.description}</p>}
        {z.cultures && Object.entries(z.cultures).map(([culture, data]) => (
          <div key={culture} style={{ marginTop: '0.75rem' }}>
            <h5 style={{ color: '#c9a961', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{culture}</h5>
            {data.name && <p style={{ color: '#d0c8b0' }}><strong>{data.name}</strong>{data.description ? ` \u2014 ${data.description}` : ''}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardinalContent({ id }) {
  const data = cardinalsData[id];
  if (!data) return <p className="chrono-empty">No data for this cardinal point.</p>;

  return (
    <div className="metal-detail-panel">
      <div className="tab-content">
        {data.date && <p style={{ color: 'rgba(201,169,97,0.7)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{data.date}</p>}
        {data.description && <p style={{ color: '#d0c8b0', lineHeight: 1.6 }}>{data.description}</p>}
        {data.significance && <p style={{ color: '#d0c8b0', lineHeight: 1.6, marginTop: '0.5rem' }}>{data.significance}</p>}
      </div>
    </div>
  );
}
