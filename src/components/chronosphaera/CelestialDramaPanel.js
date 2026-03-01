import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../lib/chatApi';
import './CelestialDramaPanel.css';

const ASPECT_COLORS = {
  Conjunction: '#e8e8e8',
  Sextile: '#6ecf8a',
  Square: '#e06060',
  Trine: '#4a9bd9',
  Opposition: '#f0c040',
};

const PLANET_SYMBOLS = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640',
  Mars: '\u2642', Jupiter: '\u2643', Saturn: '\u2644',
};

export default function CelestialDramaPanel() {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [skyData, setSkyData] = useState(null);
  const [monomythLabel, setMonomythLabel] = useState('');
  const [moonLabel, setMoonLabel] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(true);
  const fetchedRef = useRef(false);

  // Fetch story when user expands for the first time
  useEffect(() => {
    if (collapsed || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    apiFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'celestial-drama' }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setStory(data.story || '');
        setSkyData(data.skyData || null);
        setMonomythLabel(data.monomythLabel || '');
        setMoonLabel(data.moonLabel || '');
        setGeneratedAt(data.generatedAt || '');
      })
      .catch(err => {
        setError(err.message || 'Failed to load story');
      })
      .finally(() => setLoading(false));
  }, [collapsed]);

  // Parse story into title + paragraphs
  let title = '';
  let paragraphs = [];
  if (story) {
    const lines = story.split('\n').filter(l => l.trim());
    title = lines[0] || '';
    paragraphs = lines.slice(1);
  }

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="celestial-drama-section">
      <button
        className={`celestial-drama-toggle-bar${!collapsed ? ' open' : ''}`}
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="celestial-drama-toggle-icon">{collapsed ? '\u25B6' : '\u25BC'}</span>
        <span className="celestial-drama-toggle-label">Today's Celestial Drama</span>
        {moonLabel && collapsed && <span className="celestial-drama-toggle-hint">{moonLabel}</span>}
      </button>

      {!collapsed && (
        <div className="celestial-drama-panel">
          <div className="celestial-drama-header">
            {(moonLabel || monomythLabel || dateStr) && (
              <div className="celestial-drama-subheader">
                {moonLabel && <span className="celestial-drama-tag">{moonLabel}</span>}
                {monomythLabel && <span className="celestial-drama-tag">{monomythLabel}</span>}
                {dateStr && <span className="celestial-drama-date">{dateStr}</span>}
              </div>
            )}
          </div>

          <div className="celestial-drama-body">
            {loading && (
              <div className="celestial-drama-loading">
                <div className="celestial-drama-spinner" />
                <span>Reading the sky...</span>
              </div>
            )}

            {error && (
              <div className="celestial-drama-error">
                <p>Could not generate today's story.</p>
                <p className="celestial-drama-error-detail">{error}</p>
              </div>
            )}

            {!loading && !error && story && (
              <>
                {title && <h3 className="celestial-drama-story-title">{title}</h3>}
                <div className="celestial-drama-prose">
                  {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </>
            )}
          </div>

          {!loading && skyData && (
            <div className="celestial-drama-footer">
              <div className="celestial-drama-planets">
                {(skyData.planets || []).map(p => (
                  <span key={p.name} className="celestial-drama-planet-badge" title={`${p.name} in ${p.sign} at ${p.degree}\u00B0`}>
                    <span className="celestial-drama-planet-symbol">{PLANET_SYMBOLS[p.name] || p.name[0]}</span>
                    <span className="celestial-drama-planet-sign">{p.sign}</span>
                  </span>
                ))}
              </div>
              {skyData.aspects && skyData.aspects.length > 0 && (
                <div className="celestial-drama-aspects">
                  {skyData.aspects.map((a, i) => (
                    <span key={i} className="celestial-drama-aspect-chip" style={{ borderColor: ASPECT_COLORS[a.aspect] || '#888' }} title={`${a.planet1} ${a.aspect} ${a.planet2} (orb ${a.orb}\u00B0)`}>
                      {PLANET_SYMBOLS[a.planet1] || a.planet1[0]} {a.aspect} {PLANET_SYMBOLS[a.planet2] || a.planet2[0]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
