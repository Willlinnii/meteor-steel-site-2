import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createXRStore } from '@react-three/xr';
import CelestialScene from '../../components/chronosphaera/vr/CelestialScene';
import ARJoystick from '../../components/chronosphaera/vr/ARJoystick';
import ARMiniMap from '../../components/chronosphaera/vr/ARMiniMap';
import { ORBITAL_MODES, MODE_LABELS, MODE_SYMBOLS } from '../../components/chronosphaera/vr/constants3D';
import '../../components/chronosphaera/vr/CelestialScene.css';
import './ChronosphaeraPage.css';
import { usePageTracking } from '../../coursework/CourseworkContext';

// Reuse all existing data + content components from 2D page
import MetalDetailPanel from '../../components/chronosphaera/MetalDetailPanel';
import CultureSelector from '../../components/chronosphaera/CultureSelector';
import TarotCardContent from '../../components/chronosphaera/TarotCardContent';

import coreData from '../../data/chronosphaera.json';
import deitiesData from '../../data/chronosphaeraDeities.json';
import archetypesData from '../../data/chronosphaeraArchetypes.json';
import artistsData from '../../data/chronosphaeraArtists.json';
import hebrewData from '../../data/chronosphaeraHebrew.json';
import modernData from '../../data/chronosphaeraModern.json';
import sharedData from '../../data/chronosphaeraShared.json';
import storiesData from '../../data/chronosphaeraStories.json';
import theologyData from '../../data/chronosphaeraTheology.json';
import zodiacData from '../../data/chronosphaeraZodiac.json';
import cardinalsData from '../../data/chronosphaeraCardinals.json';
import elementsData from '../../data/chronosphaeraElements.json';
import planetaryCultures from '../../data/chronosphaeraPlanetaryCultures.json';
import dayNightData from '../../data/dayNight.json';

function findByMetal(arr, metal) {
  return arr.find(item => item.metal === metal) || null;
}
function findBySin(arr, sin) {
  return arr.find(item => item.sin === sin) || null;
}

const CULTURE_KEY_MAP = {
  Roman: 'roman', Greek: 'greek', Norse: 'norse',
  Babylonian: 'babylonian', Vedic: 'vedic', Islamic: 'islamic', Medieval: 'medieval',
  Tarot: 'tarot',
};

const MODE_ORDER = [
  ORBITAL_MODES.GEOCENTRIC,
  ORBITAL_MODES.HELIOCENTRIC,
  ORBITAL_MODES.LIVE,
  ORBITAL_MODES.ALIGNED,
];

// ---- Content components (mirrored from ChronosphaeraPage) ----

function CultureBlock({ cultureData }) {
  if (!cultureData) return <p className="chrono-empty">No data for this tradition.</p>;
  return (
    <div className="culture-block">
      <h4>{cultureData.name}</h4>
      {cultureData.myth && <p className="culture-myth"><em>{cultureData.myth}</em></p>}
      {cultureData.description && <p>{cultureData.description}</p>}
      {cultureData.symbols && <p className="culture-symbols"><strong>Symbols:</strong> {cultureData.symbols}</p>}
    </div>
  );
}

function ZodiacContent({ sign, activeCulture }) {
  const z = zodiacData.find(d => d.sign === sign);
  if (!z) return null;

  if (activeCulture === 'Tarot') {
    return (
      <div className="tab-content">
        <h4>{z.symbol} {z.archetype}</h4>
        <div className="overview-grid">
          <div className="overview-item"><span className="ov-label">Element</span><span className="ov-value">{z.element}</span></div>
          <div className="overview-item"><span className="ov-label">Modality</span><span className="ov-value">{z.modality}</span></div>
          <div className="overview-item"><span className="ov-label">Ruler</span><span className="ov-value">{z.rulingPlanet}</span></div>
          <div className="overview-item"><span className="ov-label">House</span><span className="ov-value">{z.house}</span></div>
          <div className="overview-item"><span className="ov-label">Dates</span><span className="ov-value">{z.dates}</span></div>
        </div>
        <TarotCardContent correspondenceType="zodiac" correspondenceValue={sign} element={z.element} showMinorArcana />
      </div>
    );
  }

  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = z.cultures?.[cultureKey];
  const elementEntry = elementsData[z.element];
  const elementCulture = elementEntry?.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <h4>{z.symbol} {z.archetype}</h4>
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Element</span><span className="ov-value">{z.element}</span></div>
        <div className="overview-item"><span className="ov-label">Modality</span><span className="ov-value">{z.modality}</span></div>
        <div className="overview-item"><span className="ov-label">Ruler</span><span className="ov-value">{z.rulingPlanet}</span></div>
        <div className="overview-item"><span className="ov-label">House</span><span className="ov-value">{z.house}</span></div>
        <div className="overview-item"><span className="ov-label">Dates</span><span className="ov-value">{z.dates}</span></div>
      </div>
      <div className="modern-section">
        <h5>{z.stageOfExperience}</h5>
        <p>{z.description}</p>
      </div>
      {cultureEntry && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={cultureEntry} />
        </div>
      )}
      {elementCulture && (
        <div className="modern-section">
          <h5>{z.element} — {activeCulture} Tradition</h5>
          <CultureBlock cultureData={elementCulture} />
        </div>
      )}
    </div>
  );
}

function CardinalContent({ cardinalId, activeCulture }) {
  const c = cardinalsData[cardinalId];
  if (!c) return null;

  if (activeCulture === 'Tarot') {
    return (
      <div className="tab-content">
        <div className="overview-grid">
          <div className="overview-item"><span className="ov-label">Date</span><span className="ov-value">{c.date}</span></div>
          <div className="overview-item"><span className="ov-label">Season</span><span className="ov-value">{c.season}</span></div>
          <div className="overview-item"><span className="ov-label">Direction</span><span className="ov-value">{c.direction}</span></div>
          <div className="overview-item"><span className="ov-label">Zodiac Cusp</span><span className="ov-value">{c.zodiacCusp}</span></div>
        </div>
        <TarotCardContent correspondenceType="cardinal" correspondenceValue={cardinalId} showMinorArcana />
      </div>
    );
  }

  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = c.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Date</span><span className="ov-value">{c.date}</span></div>
        <div className="overview-item"><span className="ov-label">Season</span><span className="ov-value">{c.season}</span></div>
        <div className="overview-item"><span className="ov-label">Direction</span><span className="ov-value">{c.direction}</span></div>
        <div className="overview-item"><span className="ov-label">Zodiac Cusp</span><span className="ov-value">{c.zodiacCusp}</span></div>
      </div>
      {c.description && <div className="modern-section"><h5>Description</h5><p>{c.description}</p></div>}
      {c.mythology && <div className="modern-section"><h5>Mythology</h5><p>{c.mythology}</p></div>}
      {c.themes && <div className="modern-section"><h5>Themes</h5><p>{c.themes}</p></div>}
      {cultureEntry && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={cultureEntry} />
        </div>
      )}
    </div>
  );
}

function DayNightContent({ side, activeCulture }) {
  const data = dayNightData[side];
  if (!data) return null;
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = data.cultures?.[cultureKey];

  return (
    <div className="tab-content">
      <div className="overview-grid">
        <div className="overview-item"><span className="ov-label">Element</span><span className="ov-value">{data.element}</span></div>
        <div className="overview-item"><span className="ov-label">Polarity</span><span className="ov-value">{data.polarity}</span></div>
        <div className="overview-item"><span className="ov-label">Qualities</span><span className="ov-value">{data.qualities}</span></div>
      </div>
      <div className="modern-section"><h5>{data.subtitle}</h5><p>{data.description}</p></div>
      <div className="modern-section"><h5>Cosmology</h5><p>{data.cosmology}</p></div>
      <div className="modern-section"><h5>Themes</h5><p>{data.themes}</p></div>
      {cultureEntry && (
        <div className="modern-section">
          <h5>{activeCulture} Tradition</h5>
          <CultureBlock cultureData={cultureEntry} />
        </div>
      )}
    </div>
  );
}

function PlanetCultureContent({ planet, activeCulture }) {
  const planetData = planetaryCultures[planet];
  if (!planetData) return null;
  const cultureKey = CULTURE_KEY_MAP[activeCulture];
  const cultureEntry = planetData[cultureKey];
  if (!cultureEntry) return null;
  return (
    <div className="modern-section planet-culture-section">
      <h5>{activeCulture} Tradition — {planet}</h5>
      <CultureBlock cultureData={cultureEntry} />
    </div>
  );
}

// ---- Main page ----

export default function ChronosphaeraVRPage() {
  const { track } = usePageTracking('chronosphaera-vr');
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(ORBITAL_MODES.GEOCENTRIC);
  const [selectedPlanet, setSelectedPlanet] = useState('Sun');
  const [selectedSign, setSelectedSign] = useState(null);
  const [selectedCardinal, setSelectedCardinal] = useState(null);
  const [selectedEarth, setSelectedEarth] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCulture, setActiveCulture] = useState('Greek');
  const [panelOpen, setPanelOpen] = useState(true);

  // WebXR store — created once, shared with CelestialScene
  const xrStore = useMemo(() => createXRStore(), []);
  const [arSupported, setArSupported] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Only check native WebXR — skip polyfills by also checking for a real XR device
    const xr = navigator.xr;
    if (xr && typeof xr.isSessionSupported === 'function') {
      // immersive-ar: phones with ARCore/ARKit
      xr.isSessionSupported('immersive-ar').then(ok => setArSupported(ok)).catch(() => {});
      // immersive-vr: actual headsets only — check that it's not just a polyfill
      xr.isSessionSupported('immersive-vr').then(ok => {
        // Desktop Chrome reports true via polyfill/emulator — filter by checking for mobile or headset UA
        const isMobileOrHeadset = /Mobile|Quest|Pico|Vive/i.test(navigator.userAgent);
        setVrSupported(ok && isMobileOrHeadset);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enterAR = () => {
    track('xr-ar.started');
    xrStore.enterAR().catch((err) => {
      console.warn('AR not available:', err.message);
      alert('AR is not supported on this device. Try opening this page on a phone with AR support (Android Chrome).');
    });
  };
  const enterVR = () => {
    track('xr-vr.started');
    xrStore.enterVR().catch((err) => {
      console.warn('VR not available:', err.message);
      alert('VR is not supported on this device. Try a VR headset browser (Quest, Vision Pro).');
    });
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Camera AR mode — phone camera as background, gyroscope controls
  const [cameraAR, setCameraAR] = useState(false);
  const [arPassthrough, setArPassthrough] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [orientationGranted, setOrientationGranted] = useState(false);
  const [gyroDenied, setGyroDenied] = useState(false);
  // After reload, show a "tap to start AR" prompt so the fresh gesture triggers the dialog
  const [arRetry, setArRetry] = useState(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('chrono-ar-retry')) {
      sessionStorage.removeItem('chrono-ar-retry');
      return true;
    }
    return false;
  });

  const startCameraAR = useCallback(async () => {
    try {
      // iOS requires user gesture for deviceorientation + devicemotion permission
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') {
          setGyroDenied(true);
          return;
        }
      }
      if (typeof DeviceMotionEvent !== 'undefined' &&
          typeof DeviceMotionEvent.requestPermission === 'function') {
        await DeviceMotionEvent.requestPermission().catch(() => {});
      }
      setGyroDenied(false);
      setArRetry(false);
      setOrientationGranted(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCameraAR = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraAR(false);
    setArPassthrough(false);
    setArPanelLocked(false);
    panelLockedExtRef.current = false;
  }, []);

  // Auto-start camera AR when arriving from 3D button
  const autoARTriggered = useRef(false);
  useEffect(() => {
    if (location.state?.autoAR && !autoARTriggered.current) {
      autoARTriggered.current = true;
      // Small delay to let mount settle before requesting permissions
      const t = setTimeout(() => startCameraAR(), 300);
      return () => clearTimeout(t);
    }
  }, [location.state, startCameraAR]);

  // AR navigation state
  const joystickRef = useRef({ x: 0, y: 0 });
  const cameraPosRef = useRef({ x: 0, y: 0, z: 0 });
  const anglesRef = useRef(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const onFlyComplete = useCallback(() => setFlyToTarget(null), []);

  // Full-screen info panel lock state (AR mode)
  const [arPanelLocked, setArPanelLocked] = useState(false);
  const panelLockedExtRef = useRef(false);

  const handlePanelLock = useCallback(() => {
    setArPanelLocked(true);
    panelLockedExtRef.current = true;
  }, []);

  const handlePanelUnlock = useCallback(() => {
    setArPanelLocked(false);
    panelLockedExtRef.current = false;
  }, []);

  // Fly to a planet when tapped (in AR mode)
  const handleFlyTo = useCallback((pos) => {
    setFlyToTarget(pos);
  }, []);

  const mergedData = useMemo(() => {
    const map = {};
    coreData.forEach(item => {
      map[item.planet] = {
        core: item,
        deities: findByMetal(deitiesData, item.metal),
        archetype: findBySin(archetypesData, item.sin),
        artists: findBySin(artistsData, item.sin),
        hebrew: findByMetal(hebrewData, item.metal),
        modern: findBySin(modernData, item.sin),
        shared: sharedData,
        stories: findBySin(storiesData, item.sin),
        theology: findBySin(theologyData, item.sin),
      };
    });
    return map;
  }, []);

  const cycleMode = () => {
    const idx = MODE_ORDER.indexOf(mode);
    const nextMode = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
    track('mode.' + nextMode);
    setMode(nextMode);
  };

  const handleSelectPlanet = (p) => {
    track('planet.' + p);
    setSelectedPlanet(p);
    setSelectedSign(null);
    setSelectedCardinal(null);
    setSelectedEarth(null);
    setActiveTab('overview');
    setPanelOpen(true);
  };
  const handleSelectSign = (sign) => {
    track('zodiac.' + sign);
    setSelectedSign(sign);
    setSelectedCardinal(null);
    setSelectedEarth(null);
    setPanelOpen(true);
  };
  const handleSelectCardinal = (c) => {
    track('cardinal.' + c);
    setSelectedCardinal(c);
    setSelectedSign(null);
    setSelectedEarth(null);
    setPanelOpen(true);
  };
  const handleSelectEarth = (e) => {
    track('earth.' + e);
    setSelectedEarth(e);
    setSelectedSign(null);
    setSelectedCardinal(null);
    setPanelOpen(true);
  };

  // Determine what to show in the panel
  const hasSelection = selectedSign || selectedCardinal || selectedEarth || selectedPlanet;
  const currentData = mergedData[selectedPlanet] || null;

  // Panel heading
  // Build panel content for both side panel and 3D AR panel
  const panelContent = selectedSign ? (
    <div className="metal-detail-panel">
      <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
      <ZodiacContent sign={selectedSign} activeCulture={activeCulture} />
    </div>
  ) : selectedCardinal ? (
    <div className="metal-detail-panel">
      <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
      <CardinalContent cardinalId={selectedCardinal} activeCulture={activeCulture} />
    </div>
  ) : selectedEarth ? (
    <div className="metal-detail-panel">
      <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
      <DayNightContent side={selectedEarth} activeCulture={activeCulture} />
    </div>
  ) : currentData ? (
    <>
      <MetalDetailPanel
        data={currentData}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeCulture={activeCulture}
        onSelectCulture={setActiveCulture}
      />
      {activeTab === 'overview' && (
        <div className="planet-culture-wrapper">
          <CultureSelector activeCulture={activeCulture} onSelectCulture={setActiveCulture} />
          <PlanetCultureContent planet={currentData.core.planet} activeCulture={activeCulture} />
        </div>
      )}
    </>
  ) : null;

  let panelHeading = '';
  let panelSub = '';
  if (selectedSign) {
    panelHeading = selectedSign;
    panelSub = zodiacData.find(z => z.sign === selectedSign)?.archetype || 'Zodiac';
  } else if (selectedCardinal) {
    panelHeading = cardinalsData[selectedCardinal]?.label || selectedCardinal;
    panelSub = 'Cardinal Point';
  } else if (selectedEarth) {
    panelHeading = `Earth \u00B7 ${selectedEarth === 'day' ? 'Day' : 'Night'}`;
    panelSub = selectedEarth === 'day' ? 'Daylight' : 'Night Shadow';
  } else if (currentData) {
    panelHeading = `${currentData.core.planet} \u2014 ${currentData.core.metal}`;
    panelSub = `${currentData.core.day} \u00B7 ${currentData.core.sin} / ${currentData.core.virtue}`;
  }

  return (
    <div className="celestial-vr-layout" style={cameraAR ? { background: 'transparent' } : undefined}>
      {/* 3D Scene */}
      <div className={`celestial-scene-wrapper ${panelOpen && hasSelection ? 'panel-open' : ''}`} style={cameraAR ? { background: 'transparent' } : undefined}>
        {/* Camera feed for phone AR mode */}
        {cameraAR && (
          <video
            ref={videoRef}
            className="camera-ar-video"
            autoPlay
            playsInline
            muted
          />
        )}

        <CelestialScene
          mode={mode}
          selectedPlanet={selectedPlanet}
          onSelectPlanet={handleSelectPlanet}
          selectedSign={selectedSign}
          onSelectSign={handleSelectSign}
          selectedCardinal={selectedCardinal}
          onSelectCardinal={handleSelectCardinal}
          selectedEarth={selectedEarth}
          onSelectEarth={handleSelectEarth}
          infoPanelContent={cameraAR && hasSelection ? panelContent : null}
          xrStore={xrStore}
          cameraAR={cameraAR}
          arPassthrough={arPassthrough}
          joystickRef={joystickRef}
          flyToTarget={flyToTarget}
          onFlyComplete={onFlyComplete}
          cameraPosRef={cameraPosRef}
          anglesRef={anglesRef}
          onPanelLock={handlePanelLock}
          panelLockedRef={panelLockedExtRef}
          orientationGranted={orientationGranted}
        />

        {/* AR navigation overlays — hidden when full-screen panel is open */}
        {cameraAR && !arPanelLocked && (
          <>
            <ARJoystick joystickRef={joystickRef} />
            <ARMiniMap
              anglesRef={anglesRef}
              cameraPos={cameraPosRef.current}
              onFlyTo={handleFlyTo}
            />
          </>
        )}

        {/* Full-screen info panel overlay (AR lock mode) */}
        {cameraAR && arPanelLocked && hasSelection && (
          <div className="ar-fullscreen-panel">
            <div className="ar-fullscreen-panel-header">
              <div>
                <h2 className="ar-fullscreen-panel-heading">{panelHeading}</h2>
                {panelSub && <span className="ar-fullscreen-panel-sub">{panelSub}</span>}
              </div>
              <button className="ar-fullscreen-panel-close" onClick={handlePanelUnlock} title="Return to cosmos">
                &times;
              </button>
            </div>
            <div className="ar-fullscreen-panel-body">
              {panelContent}
            </div>
            <div className="ar-fullscreen-panel-footer" onClick={handlePanelUnlock}>
              Return to Cosmos
            </div>
          </div>
        )}

        {/* Overlay controls on the 3D canvas */}
        <Link to="/chronosphaera" className="celestial-back-link">
          &larr; Back to 2D
        </Link>

        <div className="celestial-mode-label">
          {MODE_LABELS[mode]}
        </div>

        <div className="celestial-controls">
          <button className="celestial-btn" onClick={cycleMode} title={`Current: ${MODE_LABELS[mode]}`}>
            {MODE_SYMBOLS[mode]} Mode
          </button>
          <button className="celestial-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen immersive view'}>
            {isFullscreen ? 'Exit FS' : 'Fullscreen'}
          </button>
          {!cameraAR ? (
            <button className="celestial-btn celestial-xr-enter" onClick={startCameraAR} title="Phone AR — use camera as window into the scene">
              Phone AR
            </button>
          ) : (
            <>
              <button
                className={`celestial-btn celestial-xr-enter${arPassthrough ? ' active' : ''}`}
                onClick={() => setArPassthrough(p => !p)}
                title={arPassthrough ? 'Show starfield background' : 'Passthrough — camera only with artifacts'}
              >
                {arPassthrough ? 'Stars Off' : 'Passthrough'}
              </button>
              <button className="celestial-btn celestial-xr-enter" onClick={stopCameraAR} title="Exit camera AR mode">
                Exit AR
              </button>
            </>
          )}
          {arSupported && (
            <button className="celestial-btn celestial-xr-enter" onClick={enterAR} title="Enter AR — view in your space">
              AR
            </button>
          )}
          {vrSupported && (
            <button className="celestial-btn celestial-xr-enter" onClick={enterVR} title="Enter VR — immersive view">
              VR
            </button>
          )}
          {!cameraAR && panelOpen && hasSelection && (
            <button className="celestial-btn" onClick={() => setPanelOpen(false)}>
              Hide Panel
            </button>
          )}
          {!cameraAR && !panelOpen && hasSelection && (
            <button className="celestial-btn" onClick={() => setPanelOpen(true)}>
              Show Panel
            </button>
          )}
          <button className="celestial-btn" onClick={() => navigate('/chronosphaera?view=3d')} title="Return to inline 3D view">
            3D
          </button>
          <button className="celestial-btn" onClick={() => navigate('/chronosphaera')} title="Return to 2D view">
            2D
          </button>
        </div>

        {gyroDenied && (
          <div className="celestial-gyro-denied">
            <p>Motion access was denied. Safari only shows the permission prompt once per visit.</p>
            <button
              className="celestial-btn celestial-xr-enter"
              onClick={() => {
                try { sessionStorage.setItem('chrono-ar-retry', '1'); } catch {}
                window.location.reload();
              }}
            >
              Reload Page
            </button>
            <p className="celestial-gyro-denied-hint">
              After the page reloads, tap <strong>Start AR</strong> and then tap <strong>Allow</strong> when Safari asks for motion access.
            </p>
            <button className="celestial-gyro-denied-dismiss" onClick={() => setGyroDenied(false)}>Dismiss</button>
          </div>
        )}
        {arRetry && !cameraAR && (
          <div className="celestial-gyro-denied">
            <p>Tap below to start AR. When Safari asks for motion access, tap <strong>Allow</strong>.</p>
            <button
              className="celestial-btn celestial-xr-enter"
              onClick={startCameraAR}
            >
              Start AR
            </button>
            <button className="celestial-gyro-denied-dismiss" onClick={() => setArRetry(false)}>Dismiss</button>
          </div>
        )}
      </div>

      {/* Side panel with full content — hidden in AR mode (content goes into 3D scene instead) */}
      <div className={`celestial-side-panel ${!cameraAR && panelOpen && hasSelection ? 'open' : ''}`}>
        <div className="celestial-panel-header">
          <div>
            <h2 className="celestial-panel-heading">{panelHeading}</h2>
            {panelSub && <span className="celestial-panel-sub">{panelSub}</span>}
          </div>
          <button className="celestial-panel-close" onClick={() => setPanelOpen(false)} title="Close panel">
            &times;
          </button>
        </div>

        <div className="celestial-panel-body">
          {panelContent || <p className="chrono-empty">Select a planet, zodiac sign, or cardinal point to explore.</p>}
        </div>
      </div>
    </div>
  );
}
