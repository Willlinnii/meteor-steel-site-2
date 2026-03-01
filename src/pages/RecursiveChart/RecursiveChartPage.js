import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import { computeRecursiveReading, computeCelestialWeather, computeFieldTopology } from '../../astrology/recursiveEngine';
import PerspectiveSelector from './PerspectiveSelector';
import RecursiveChartDiagram from './RecursiveChartDiagram';
import RecursiveReadingPanel from './RecursiveReadingPanel';
import RecursiveChartTheory from './RecursiveChartTheory';
import SolarCycleIndicator from './SolarCycleIndicator';
import SynastryPanel from './SynastryPanel';
import './RecursiveChartPage.css';

export default function RecursiveChartPage() {
  const { natalChart } = useProfile();
  const { trackElement, trackTime } = useCoursework();
  const [perspective, setPerspective] = useState('geocentric');
  const [transitDate, setTransitDate] = useState(() => new Date());
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [emFieldVisible, setEmFieldVisible] = useState(false);
  const [showOrbitalPaths, setShowOrbitalPaths] = useState(true);
  const [mode, setMode] = useState('weather');
  const [zodiacFrame, setZodiacFrame] = useState('tropical');
  const [showTheory, setShowTheory] = useState(false);
  const [personalLayer, setPersonalLayer] = useState('birth');

  // Lock personal/synastry mode off when no birth data
  useEffect(() => {
    if ((mode === 'personal' || mode === 'synastry') && !natalChart?.birthData) setMode('weather');
  }, [natalChart, mode]);

  // Page visit tracking
  useEffect(() => { trackElement('recursive-chart.page.visited'); }, [trackElement]);

  // Time tracking per perspective view
  const timeRef = useRef({ view: perspective, start: Date.now() });
  useEffect(() => {
    const prev = timeRef.current;
    const elapsed = Math.round((Date.now() - prev.start) / 1000);
    if (elapsed > 0) trackTime(`recursive-chart.${prev.view}.time`, elapsed);
    timeRef.current = { view: perspective, start: Date.now() };
  }, [perspective, trackTime]);

  // Flush time on unmount
  useEffect(() => {
    return () => {
      const prev = timeRef.current;
      const elapsed = Math.round((Date.now() - prev.start) / 1000);
      if (elapsed > 0) trackTime(`recursive-chart.${prev.view}.time`, elapsed);
    };
  }, [trackTime]);

  // Track perspective switches
  const handlePerspective = (key) => {
    setPerspective(key);
    trackElement(`recursive-chart.perspective.${key}`);
    setSelectedPlanet(null);
  };

  // Track planet selection
  const handleSelectPlanet = (name) => {
    setSelectedPlanet(prev => prev === name ? null : name);
    if (name) trackElement(`recursive-chart.planet.${name}`);
  };

  // Transit date change
  const handleDateChange = (e) => {
    const d = new Date(e.target.value + 'T12:00:00');
    if (!isNaN(d.getTime())) setTransitDate(d);
  };

  // Mode change with tracking
  const handleModeChange = (newMode) => {
    if (newMode === 'personal' && !natalChart?.birthData) return;
    setMode(newMode);
    setPersonalLayer('birth');
    trackElement(`recursive-chart.mode.${newMode}`);
  };

  // Layer change within personal mode
  const handleLayerChange = (layer) => {
    setPersonalLayer(layer);
    trackElement(`recursive-chart.layer.${layer}`);
  };

  // Zodiac frame toggle with tracking
  const handleZodiacToggle = (frame) => {
    setZodiacFrame(frame);
    trackElement(`recursive-chart.zodiac.${frame}`);
  };

  // Toggle handlers with tracking
  const handleEmToggle = () => {
    setEmFieldVisible(v => !v);
    trackElement('recursive-chart.em-field.toggled');
  };
  const handleOrbitsToggle = () => {
    setShowOrbitalPaths(v => !v);
    trackElement('recursive-chart.orbits.toggled');
  };

  // Always compute weather data (date-only)
  const weatherData = useMemo(() => {
    try {
      return computeCelestialWeather(transitDate);
    } catch (err) {
      console.error('Weather computation error:', err);
      return null;
    }
  }, [transitDate]);

  // Conditionally compute personal data (only when mode is personal AND birth data exists)
  const recursiveData = useMemo(() => {
    if (mode !== 'personal' || !natalChart?.birthData) return null;
    try {
      return computeRecursiveReading(natalChart, transitDate);
    } catch (err) {
      console.error('Recursive chart computation error:', err);
      return null;
    }
  }, [natalChart, transitDate, mode]);

  // Derive active positions and aspects from weather data
  const { activePositions, activeAspects } = useMemo(() => {
    if (!weatherData) return { activePositions: null, activeAspects: null };

    if (perspective === 'geocentric' || perspective === 'reading') {
      return { activePositions: weatherData.geocentric.planets, activeAspects: weatherData.geocentric.aspects };
    }
    if (perspective === 'heliocentric') {
      return { activePositions: weatherData.heliocentric.planets, activeAspects: weatherData.heliocentric.aspects };
    }
    if (weatherData.perspectives[perspective]) {
      return { activePositions: weatherData.perspectives[perspective].positions, activeAspects: weatherData.perspectives[perspective].aspects };
    }
    return { activePositions: null, activeAspects: null };
  }, [weatherData, perspective]);

  // Natal positions for ghost markers (only in personal mode)
  const natalPositions = useMemo(() => {
    if (mode !== 'personal' || !recursiveData) return null;
    const geo = recursiveData.geocentric.planets;
    // Normalize natal positions to object format
    if (Array.isArray(geo)) {
      return Object.fromEntries(geo.map(p => [p.name, p]));
    }
    return geo;
  }, [mode, recursiveData]);

  // Compute EM field topology — uses transitDate directly (current sky)
  const obsKey = perspective === 'geocentric' ? 'Earth'
    : perspective === 'heliocentric' ? 'Sun'
    : perspective === 'reading' ? 'Earth'
    : perspective === 'Moon' ? 'Earth'
    : perspective;

  const fieldData = useMemo(() => {
    if (!emFieldVisible) return null;
    return computeFieldTopology(obsKey, transitDate);
  }, [emFieldVisible, obsKey, transitDate]);

  // Solar cycle data
  const activeSolarCycle = weatherData?.solarCycle || null;
  const birthSolarCycle = mode === 'personal' && recursiveData ? recursiveData.birthSolarCycle : null;

  // Swap diagram primary/ghost based on personal layer
  const diagramPositions = (mode === 'personal' && personalLayer === 'birth' && natalPositions)
    ? natalPositions : activePositions;
  const diagramNatalPositions = (mode === 'personal' && personalLayer === 'birth')
    ? null : natalPositions;

  const transitDateStr = transitDate.toISOString().split('T')[0];

  return (
    <div className="recursive-page">
      <div className="recursive-header">
        <div className="rc-mode-row">
          <div className="rc-mode-toggle">
            <button
              className={`rc-mode-btn${mode === 'weather' ? ' active' : ''}`}
              onClick={() => handleModeChange('weather')}
            >
              Today's Sky
            </button>
            <button
              className={`rc-mode-btn${mode === 'personal' ? ' active' : ''}`}
              onClick={() => handleModeChange('personal')}
              disabled={!natalChart?.birthData}
              title={!natalChart?.birthData ? 'Set up birth data in Profile to unlock' : ''}
            >
              Personal
            </button>
            <button
              className={`rc-mode-btn${mode === 'synastry' ? ' active' : ''}`}
              onClick={() => handleModeChange('synastry')}
              disabled={!natalChart?.birthData}
              title={!natalChart?.birthData ? 'Set up birth data in Profile to unlock' : ''}
            >
              Synastry
            </button>
          </div>
          <button
            className="rc-theory-btn"
            onClick={() => { setShowTheory(true); trackElement('recursive-chart.theory.opened'); }}
            title="About this approach"
          >
            ?
          </button>
        </div>
        <PerspectiveSelector
          perspective={perspective}
          onSelect={handlePerspective}
          emFieldVisible={emFieldVisible}
          onEmToggle={handleEmToggle}
          showOrbitalPaths={showOrbitalPaths}
          onOrbitsToggle={handleOrbitsToggle}
          mode={mode}
          zodiacFrame={zodiacFrame}
          onZodiacToggle={handleZodiacToggle}
        />
        <div className="recursive-date-picker">
          <label className="recursive-date-label">Transit Date</label>
          <input
            type="date"
            className="recursive-date-input"
            value={transitDateStr}
            onChange={handleDateChange}
          />
        </div>
      </div>

      <div className="recursive-layout">
        <RecursiveChartDiagram
          positions={diagramPositions}
          aspects={activeAspects}
          perspective={perspective}
          selectedPlanet={selectedPlanet}
          onSelectPlanet={handleSelectPlanet}
          hoveredPlanet={hoveredPlanet}
          onHoverPlanet={setHoveredPlanet}
          emFieldVisible={emFieldVisible}
          fieldData={fieldData}
          showOrbitalPaths={showOrbitalPaths}
          mode={mode}
          natalPositions={diagramNatalPositions}
          zodiacFrame={zodiacFrame}
          date={transitDate}
          houses={mode === 'personal' && recursiveData ? recursiveData.houses : null}
          ascendant={mode === 'personal' && recursiveData ? recursiveData.ascendant : null}
          midheaven={mode === 'personal' && recursiveData ? recursiveData.midheaven : null}
          lunarNodes={weatherData?.lunarNodes || null}
        />
        {mode === 'synastry' ? (
          <SynastryPanel
            natalChart={natalChart}
            transitDate={transitDate}
          />
        ) : (
          <RecursiveReadingPanel
            perspective={perspective}
            data={recursiveData}
            weatherData={weatherData}
            selectedPlanet={selectedPlanet}
            emFieldVisible={emFieldVisible}
            fieldData={fieldData}
            mode={mode}
            zodiacFrame={zodiacFrame}
            date={transitDate}
            natalChart={natalChart}
            personalLayer={personalLayer}
            onLayerChange={handleLayerChange}
            retrogrades={weatherData?.retrogrades}
            lunarPhase={weatherData?.lunarPhase}
          />
        )}
      </div>

      {activeSolarCycle && (
        <SolarCycleIndicator
          solarCycle={activeSolarCycle}
          birthSolarCycle={birthSolarCycle}
        />
      )}
      {showTheory && <RecursiveChartTheory onClose={() => setShowTheory(false)} />}
    </div>
  );
}
