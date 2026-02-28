import React, { Suspense, useState, useEffect, useCallback, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DodecahedronScene, { GEO_TO_MAP, NUMBER_TO_GEO, GEO_TO_NUMBER } from './DodecahedronScene';
import DODECAHEDRON_FACE_MAP from '../../data/dodecahedronFaceMap';
import { rollD12 } from '../../games/shared/diceEngine';
import DodecahedronContent from './DodecahedronContent';
import './DodecahedronPage.css';

class SceneErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dodecahedron-error">
          <p>The 3D view encountered a problem.</p>
          <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MODE_CYCLE = ['stars', 'roman', 'die'];
const MODE_LABELS = {
  stars: 'Lantern of Phanes',
  roman: 'Roman Dodecahedron',
  die: 'Die',
};

// Known pure metal densities for matching
const KNOWN_METALS = [
  { name: 'Gold',   density: 19.32, color: '#d4a017' },
  { name: 'Silver', density: 10.49, color: '#b0b0b8' },
  { name: 'Copper', density: 8.96,  color: '#b87333' },
];

// Roman coin presets — pure metal densities, historical weights & real dimensions (mm)
// Diameters from numismatic records (2nd–3rd c. CE specimens)
// Thickness is derived: h = (weight/density) / (π·r²) so the cylinder volume matches weight/density exactly
const DEMO_COINS = [
  { id: 'gold',   label: 'Aureus',     weight: 8.0,  density: 19.32, color: '#d4a017', r: 7,  diameter: 20 },
  { id: 'silver', label: 'Denarius',    weight: 3.9,  density: 10.49, color: '#b0b0b8', r: 9,  diameter: 18 },
  { id: 'copper', label: 'Sestertius',  weight: 25.0, density: 8.96,  color: '#b87333', r: 11, diameter: 33 },
];

// Empirical: approximate outer circumradius (mm) from specimen weight (g)
// Archaeological data: typical 100–250g specimens are 50–80mm across (vertex to vertex)
// Fit: 35g → ~23mm R, 100g → 30mm, 150g → 34mm, 250g → 40mm, 580g → 55mm
const dodecCircumradius = (weightG) => 12 + Math.sqrt(weightG) * 1.8;

// Default: ~150g medium specimen → R ≈ 34mm (68mm across, squarely in the typical 5–7cm range)
const DEFAULT_DODEC_R_MM = 34;

export { MODE_CYCLE, MODE_LABELS };

export default function DodecahedronPage({ embedded, externalMode, onModeChange }) {
  const navigate = useNavigate();
  const [selectedFace, setSelectedFace] = useState(null);
  const [lit, setLit] = useState(true);
  const [internalMode, setInternalMode] = useState('stars');
  const mode = externalMode || internalMode;
  const setMode = setInternalMode;
  const prevExternalMode = useRef(externalMode);
  useEffect(() => {
    if (externalMode && externalMode !== prevExternalMode.current) {
      setSelectedFace(null);
      prevExternalMode.current = externalMode;
    }
  }, [externalMode]);
  const [rolling, setRolling] = useState(false);
  const [rollTargetGeo, setRollTargetGeo] = useState(null);
  const [waterActive, setWaterActive] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calc, setCalc] = useState({
    dodecWeight: '', dodecVolume: '',
    objWeight: '', objWeightWater: '',
  });
  const [measuring, setMeasuring] = useState(false);
  // null = instant (manual input), 0 = started, 1/2/3 = cascading reveals
  const [revealStep, setRevealStep] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    if (mode !== 'roman') { setWaterActive(false); setCalcOpen(false); setMeasuring(false); setRevealStep(null); setSelectedCoin(null); }
  }, [mode]);

  const handleCalcToggle = useCallback(() => {
    setCalcOpen(prev => {
      const next = !prev;
      if (!next) setWaterActive(false); // closing calc turns off water
      return next;
    });
  }, []);

  const handleSolutionSelect = useCallback(() => {
    if (!calcOpen) {
      setCalcOpen(true);
    }
  }, [calcOpen]);

  const updateCalc = useCallback((key, value) => {
    // Allow empty, digits, single decimal point, leading minus
    if (value !== '' && !/^-?\d*\.?\d*$/.test(value)) return;
    setCalc(prev => ({ ...prev, [key]: value }));
    setRevealStep(null); // manual edit → show all results instantly
    if (key === 'objWeight') setSelectedCoin(null); // manual weight edit deselects coin
  }, []);

  const handleCoinSelect = useCallback((coin) => {
    if (measuring) return;

    // Each click picks a fresh coin — 1/3 chance it's counterfeit
    const counterfeit = Math.random() < 1 / 3;
    let actualDensity = coin.density;
    let actualWeight = coin.weight;

    if (counterfeit) {
      // Fake density: off enough to fail purity, still closest to the right metal
      const ranges = {
        gold:   [[15.0, 18.0]],                       // alloyed/plated, still matches gold
        silver: [[10.0, 10.2], [11.0, 13.0]],         // under or over pure silver
        copper: [[7.5, 8.5], [9.1, 9.7]],             // lighter or heavier alloy
      };
      const coinRanges = ranges[coin.id];
      const range = coinRanges[Math.floor(Math.random() * coinRanges.length)];
      actualDensity = range[0] + Math.random() * (range[1] - range[0]);
      // Same-size coin in a different alloy → weight shifts proportionally
      actualWeight = coin.weight * (actualDensity / coin.density);
    }

    setSelectedCoin({ ...coin, actualDensity, actualWeight, counterfeit, _nonce: Math.random() });
    setCalc(prev => ({
      ...prev,
      objWeight: actualWeight.toFixed(1),
      objWeightWater: '',
    }));
    setRevealStep(null);
    setWaterActive(false);
  }, [measuring]);

  const handleGenerateDodec = useCallback(() => {
    if (measuring) return;
    // Size factor: 0 → 1 maps smallest to largest known specimens
    const t = Math.random();
    // Weight: 35–580g, power curve so more cluster in the common 100–250g range
    const weight = 35 + Math.pow(t, 1.15) * (580 - 35);
    // Bronze alloy density varies 8.4–9.0 g/cm³ depending on tin/lead content
    const density = 8.4 + Math.random() * 0.6;
    const volume = weight / density;
    setCalc(prev => ({
      ...prev,
      dodecWeight: weight.toFixed(1),
      dodecVolume: volume.toFixed(3),
    }));
  }, [measuring]);

  const handleFindWeight = useCallback(() => {
    if (measuring) return;
    const w = parseFloat(calc.objWeight);
    if (!(w > 0)) return;

    setMeasuring(true);
    setRevealStep(0);
    setWaterActive(true);

    // After water fills (~4s): reveal weight in water
    setTimeout(() => {
      // Use selected coin's actual density (pure or counterfeit), or simulate bronze-like
      const density = selectedCoin ? selectedCoin.actualDensity : 8.5 + Math.random() * 0.4;
      const wInWater = w * (1 - 1 / density);
      setCalc(prev => ({ ...prev, objWeightWater: wInWater.toFixed(4) }));
      setRevealStep(1);
    }, 4500);

    // Cascade: volume displaced after 0.5s
    setTimeout(() => setRevealStep(2), 5000);

    // Cascade: density after another 0.5s
    setTimeout(() => setRevealStep(3), 5500);

    // Cascade: material match after another 0.5s
    setTimeout(() => { setRevealStep(4); setMeasuring(false); }, 6000);
  }, [calc.objWeight, measuring, selectedCoin]);

  // Dodecahedron density
  const dW = parseFloat(calc.dodecWeight);
  const dV = parseFloat(calc.dodecVolume);
  const dodecDensity = dW > 0 && dV > 0 ? dW / dV : null;

  // Object: buoyant force = weight_air - weight_water = weight of displaced water
  // Volume displaced = buoyant force / water density (1 g/cm³)
  const oW = parseFloat(calc.objWeight);
  const oWw = parseFloat(calc.objWeightWater);
  const waterDisplaced = oW > 0 && oWw >= 0 && oW > oWw ? oW - oWw : null;
  const objVolume = waterDisplaced; // cm³ (water density = 1 g/cm³)
  const objDensity = oW > 0 && objVolume > 0 ? oW / objVolume : null;

  // Closest known metal to the computed object density
  const matchedMetal = objDensity
    ? KNOWN_METALS.reduce((best, m) =>
        Math.abs(m.density - objDensity) < Math.abs(best.density - objDensity) ? m : best
      )
    : null;

  // Should a computed result be visible? (instant mode or cascade reached that step)
  const showResult = (step) => revealStep === null || revealStep >= step;

  const cycleMode = () => {
    if (rolling) return;
    setMode(prev => {
      const idx = MODE_CYCLE.indexOf(prev);
      return MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
    });
    setSelectedFace(null);
  };

  const handleFaceClick = (faceIdx) => {
    if (rolling) return;
    setSelectedFace(prev => (prev === faceIdx ? null : faceIdx));
  };

  const handleRoll = () => {
    if (rolling) return;
    const num = rollD12();
    const geoIdx = NUMBER_TO_GEO[num];
    setSelectedFace(null);
    setRollTargetGeo(geoIdx);
    setRolling(true);
  };

  const handleRollComplete = () => {
    setRolling(false);
    setSelectedFace(rollTargetGeo);
  };

  // Convert geometry face index → face map entry for info panel
  const mapIdx = selectedFace !== null ? GEO_TO_MAP[selectedFace] : null;
  const faceData = mapIdx !== null ? DODECAHEDRON_FACE_MAP[mapIdx] : null;
  const faceColorHsl = selectedFace !== null
    ? `hsl(${selectedFace * 30}, 70%, 60%)`
    : null;

  const isRoman = mode === 'roman';

  return (
    <div className={`dodecahedron-page dodecahedron-page-scrollable${embedded ? ' dodecahedron-embedded' : ''}`}>
      <div className="dodec-viewport">
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 1.5, 7], fov: 55, near: 0.1, far: 300 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
          onPointerMissed={rolling ? undefined : () => setSelectedFace(null)}
        >
          <Suspense fallback={null}>
            <DodecahedronScene
              selectedFace={selectedFace}
              onFaceClick={handleFaceClick}
              lit={lit}
              mode={mode}
              rollState={{ rolling, targetGeoIdx: rollTargetGeo }}
              onRollComplete={handleRollComplete}
              waterActive={waterActive}
              coinData={isRoman ? selectedCoin : null}
              dodecRealRadius={dW > 0 ? dodecCircumradius(dW) : DEFAULT_DODEC_R_MM}
            />
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={3}
              maxDistance={200}
              target={[0, 0, 0]}
              enabled={!rolling}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      <button
        className={`dodec-mode-btn ${mode !== 'stars' ? 'dodec-mode-active' : ''} dodec-mode-${mode}`}
        onClick={() => {}}
        aria-label={`Current: ${MODE_LABELS[mode]}.`}
      >
        <span className="dodec-mode-tooltip">{MODE_LABELS[mode]}</span>
        <svg viewBox="0 0 40 40" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pentagon outline (dodecahedron face) */}
          <path d="M20 4 L34 14 L29 30 L11 30 L6 14 Z" stroke="currentColor" strokeWidth="2" fill="white" fillOpacity="0.15" />
          {/* Inner pentagon edge hints */}
          <path d="M20 4 L20 16 M34 14 L24 18 M29 30 L22 22 M11 30 L18 22 M6 14 L16 18" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
          {/* Dots — like a d12 showing 5 */}
          <circle cx="20" cy="12" r="2" fill="currentColor" />
          <circle cx="27" cy="18" r="2" fill="currentColor" />
          <circle cx="13" cy="18" r="2" fill="currentColor" />
          <circle cx="24" cy="26" r="2" fill="currentColor" />
          <circle cx="16" cy="26" r="2" fill="currentColor" />
        </svg>
      </button>

      <button
        className="dodec-lantern-switch"
        onClick={() => setLit(prev => !prev)}
        aria-label={lit ? 'Turn lantern off' : 'Turn lantern on'}
      >
        <span className={`dodec-switch-track ${lit ? 'dodec-switch-on' : ''}`}>
          <span className="dodec-switch-thumb" />
        </span>
      </button>


      {mode === 'roman' && calcOpen && (
        <div className="dodec-calc-panel">
          <div className="dodec-calc-header">
            <span className="dodec-calc-title">Density Calculator</span>
            <button className="dodec-calc-close" onClick={() => { setCalcOpen(false); setWaterActive(false); }} aria-label="Close">&times;</button>
          </div>

          <div className="dodec-calc-section">
            <div className="dodec-calc-section-label">
              Dodecahedron
              <button
                className="dodec-calc-gen-btn"
                onClick={handleGenerateDodec}
                disabled={measuring}
                title="Generate random dodecahedron"
              >
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                  <path d="M8 1 L13.5 5 L11.5 12 L4.5 12 L2.5 5 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.1" />
                </svg>
              </button>
            </div>
            <div className="dodec-calc-row">
              <label>Weight</label>
              <div className="dodec-calc-input-wrap">
                <input
                  type="text" inputMode="decimal"
                  value={calc.dodecWeight}
                  onChange={e => updateCalc('dodecWeight', e.target.value)}
                  placeholder="0"
                />
                <span className="dodec-calc-unit">g</span>
              </div>
            </div>
            <div className="dodec-calc-row">
              <label>Volume</label>
              <div className="dodec-calc-input-wrap">
                <input
                  type="text" inputMode="decimal"
                  value={calc.dodecVolume}
                  onChange={e => updateCalc('dodecVolume', e.target.value)}
                  placeholder="0"
                />
                <span className="dodec-calc-unit">cm&sup3;</span>
              </div>
            </div>
            <div className="dodec-calc-row dodec-calc-result-row">
              <label>Density</label>
              <span className={`dodec-calc-value ${dodecDensity ? 'dodec-calc-value-live' : ''}`}>
                {dodecDensity ? dodecDensity.toFixed(2) : '\u2014'}
                <span className="dodec-calc-unit">g/cm&sup3;</span>
              </span>
            </div>
          </div>

          <div className="dodec-calc-divider" />

          <div className="dodec-calc-section">
            <div className="dodec-calc-section-label">
              Object
              <span className="dodec-calc-coins">
                {DEMO_COINS.map(coin => (
                  <button
                    key={coin.id}
                    className={`dodec-calc-coin ${selectedCoin?.id === coin.id ? 'dodec-calc-coin-active' : ''}`}
                    onClick={() => handleCoinSelect(coin)}
                    disabled={measuring}
                    title={`${coin.label} (${coin.weight}g)`}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <circle cx="12" cy="12" r={coin.r} fill={coin.color} fillOpacity="0.85" />
                      <circle cx="12" cy="12" r={coin.r} fill="none" stroke={coin.color} strokeWidth="1.5" />
                      <circle cx="12" cy="12" r={coin.r - 2.5} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                    </svg>
                  </button>
                ))}
              </span>
            </div>
            <div className="dodec-calc-row">
              <label>Weight</label>
              <div className="dodec-calc-input-wrap">
                <input
                  type="text" inputMode="decimal"
                  value={calc.objWeight}
                  onChange={e => updateCalc('objWeight', e.target.value)}
                  placeholder="0"
                  disabled={measuring}
                />
                <span className="dodec-calc-unit">g</span>
              </div>
            </div>
            <div className="dodec-calc-row">
              <label>Weight in water</label>
              {measuring && revealStep === 0 ? (
                <span className="dodec-calc-measuring">Measuring&hellip;</span>
              ) : calc.objWeightWater || (revealStep !== null && revealStep >= 1) ? (
                <div className={`dodec-calc-input-wrap ${revealStep === 1 ? 'dodec-calc-fade-in' : ''}`}>
                  <input
                    type="text" inputMode="decimal"
                    value={calc.objWeightWater}
                    onChange={e => updateCalc('objWeightWater', e.target.value)}
                    placeholder="0"
                  />
                  <span className="dodec-calc-unit">g</span>
                </div>
              ) : (
                <button
                  className="dodec-calc-find-btn"
                  onClick={handleFindWeight}
                  disabled={!calc.objWeight || !(parseFloat(calc.objWeight) > 0)}
                >
                  Find weight in water
                </button>
              )}
            </div>
            <div className={`dodec-calc-row dodec-calc-result-row ${showResult(2) && objVolume ? 'dodec-calc-fade-in' : ''}`}>
              <label>Volume displaced</label>
              <span className={`dodec-calc-value ${objVolume && showResult(2) ? 'dodec-calc-value-live' : ''}`}>
                {objVolume && showResult(2) ? objVolume.toFixed(3) : '\u2014'}
                <span className="dodec-calc-unit">cm&sup3;</span>
              </span>
            </div>
            <div className={`dodec-calc-row dodec-calc-result-row ${showResult(3) && objDensity ? 'dodec-calc-fade-in' : ''}`}>
              <label>Density</label>
              <span className={`dodec-calc-value ${objDensity && showResult(3) ? 'dodec-calc-value-live' : ''}`}>
                {objDensity && showResult(3) ? objDensity.toFixed(2) : '\u2014'}
                <span className="dodec-calc-unit">g/cm&sup3;</span>
              </span>
            </div>
            {matchedMetal && showResult(4) && (
              <>
                <div className="dodec-calc-row dodec-calc-ref-row dodec-calc-fade-in">
                  <label>Density of {matchedMetal.name}</label>
                  <span className="dodec-calc-value dodec-calc-value-ref">
                    {matchedMetal.density.toFixed(2)}
                    <span className="dodec-calc-unit">g/cm&sup3;</span>
                  </span>
                </div>
                <div className="dodec-calc-row dodec-calc-result-row dodec-calc-fade-in">
                  <label>Material</label>
                  <span className={`dodec-calc-value dodec-calc-value-live ${selectedCoin?.counterfeit ? 'dodec-calc-counterfeit' : ''}`}
                    style={{ color: selectedCoin?.counterfeit ? undefined : matchedMetal.color }}>
                    {selectedCoin?.counterfeit ? `Counterfeit ${matchedMetal.name}` : matchedMetal.name}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {faceData && lit && (
        <div className="dodec-info-panel">
          <div
            className="dodec-face-badge"
            style={{ backgroundColor: faceColorHsl }}
          >
            Face {GEO_TO_NUMBER[selectedFace]}
          </div>
          <div className="dodec-star-count">
            {faceData.starCount} stars
          </div>
          <div className="dodec-constellation-list">
            {faceData.constellations.map(name => (
              <span key={name} className="dodec-constellation-tag">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {mode === 'die' && (
        <div className="dodec-roll-bar">
          <button
            className={`dodec-roll-btn ${rolling ? 'dodec-roll-spinning' : ''}`}
            onClick={handleRoll}
            disabled={rolling}
          >
            {rolling ? 'Rolling\u2026' : 'Play Dice with the Cosmos'}
          </button>
          <button
            className="dodec-store-btn"
            onClick={() => navigate('/store?highlight=dice')}
            title="View in store"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5H6z" stroke="#c9a961" strokeWidth="1.5" strokeLinejoin="round" /><line x1="3" y1="7" x2="21" y2="7" stroke="#c9a961" strokeWidth="1.5" /><path d="M16 11a4 4 0 01-8 0" stroke="#c9a961" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}
      </div>

      <DodecahedronContent
        mode={mode}
        calcOpen={calcOpen}
        onCalcToggle={handleCalcToggle}
        onSolutionSelect={handleSolutionSelect}
        onModeChange={onModeChange}
      />
    </div>
  );
}
