import React, { Suspense, useState, useEffect, Component } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useProfile } from '../../profile/ProfileContext';
import CrownScene from './CrownScene';
import './CrownPage.css';

class SceneErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="crown-error">
          <p>The 3D view encountered a problem.</p>
          <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DATE_TYPES = [
  { key: 'birthday',   label: 'Birthday' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'wedding',    label: 'Wedding' },
];

function parseDate(val) {
  if (!val) return null;
  const [y, m, d] = val.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function CrownPage() {
  const [searchParams] = useSearchParams();
  const { natalChart } = useProfile();
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [selectedCardinal, setSelectedCardinal] = useState(null);
  const [dates, setDates] = useState({ birthday: '', engagement: '', wedding: '' });
  const [activeDateType, setActiveDateType] = useState('birthday');
  const [mode, setMode] = useState('heliocentric');

  // URL param takes priority, then natal chart from profile
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

  const handleDateChange = (e) => {
    setDates(prev => ({ ...prev, [activeDateType]: e.target.value }));
  };

  const handleClear = () => {
    setDates(prev => ({ ...prev, [activeDateType]: '' }));
  };

  const activeInput = dates[activeDateType];
  const activeDate = parseDate(activeInput);

  return (
    <div className="crown-page">
      {/* Birthday input overlay */}
      <div className="crown-birthday-bar">
        <div className="crown-date-types">
          {DATE_TYPES.map(dt => (
            <button
              key={dt.key}
              className={`crown-date-type-btn${activeDateType === dt.key ? ' active' : ''}${dates[dt.key] ? ' has-date' : ''}`}
              onClick={() => setActiveDateType(dt.key)}
            >
              {dt.label}
            </button>
          ))}
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
        <span className="crown-mode-divider" />
        <div className="crown-mode-toggle">
          <button
            className={`crown-mode-btn${mode === 'heliocentric' ? ' active' : ''}`}
            onClick={() => setMode('heliocentric')}
            title="Heliocentric — Sun centered"
          >
            &#x2609;
          </button>
          <button
            className={`crown-mode-btn${mode === 'geocentric' ? ' active' : ''}`}
            onClick={() => setMode('geocentric')}
            title="Geocentric — Earth centered"
          >
            &#x25CE;
          </button>
        </div>
      </div>

      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 30], fov: 60, near: 0.1, far: 200 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <CrownScene
              selectedPlanet={selectedPlanet}
              onSelectPlanet={(p) => setSelectedPlanet(selectedPlanet === p ? null : p)}
              selectedCardinal={selectedCardinal}
              onSelectCardinal={setSelectedCardinal}
              birthDate={activeDate}
              mode={mode}
            />
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={50}
              maxPolarAngle={Math.PI}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
