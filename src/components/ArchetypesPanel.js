import React, { useState, useEffect, useRef } from 'react';
import archetypeData from '../data/archetypeCharacters.json';
import DevelopmentPanel from './DevelopmentPanel';
import { useWritings } from '../writings/WritingsContext';

const DOMAIN_COLORS = {
  'archetypal-roles': '#b08d57',
  'hero-faces': '#8b5e3c',
  'character-design': '#5a7a8b',
  'psychology': '#7a5a8b',
};

function ArchetypesPanel({ trackElement, trackPrefix = 'myths' }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDev, setShowDev] = useState(false);
  const [devEntries, setDevEntries] = useState({});
  const { notesData, saveNotes, loaded: writingsLoaded } = useWritings();
  const prevDevEntries = useRef(devEntries);

  const prefix = `${trackPrefix}.archetypes`;

  // Load dev entries from persisted notes
  useEffect(() => {
    if (writingsLoaded && notesData.entries) {
      const relevant = {};
      Object.entries(notesData.entries).forEach(([key, val]) => {
        if (key.startsWith('archetype-')) relevant[key] = val;
      });
      if (Object.keys(relevant).length > 0) setDevEntries(prev => ({ ...relevant, ...prev }));
    }
  }, [writingsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save dev entries on change
  useEffect(() => {
    if (!writingsLoaded) return;
    if (prevDevEntries.current === devEntries) return;
    prevDevEntries.current = devEntries;
    Object.entries(devEntries).forEach(([key, val]) => {
      saveNotes(key, val);
    });
  }, [devEntries, writingsLoaded, saveNotes]);

  // Breadcrumb bar — sticky at top when drilled in
  const breadcrumb = (selectedCategory || selectedEntry) ? (
    <div className="archetype-breadcrumb">
      <button className="archetype-breadcrumb-link" onClick={() => { setSelectedCategory(null); setSelectedEntry(null); setShowDev(false); }}>
        Archetypes
      </button>
      {selectedCategory && (
        <>
          <span className="archetype-breadcrumb-sep">/</span>
          {selectedEntry ? (
            <button className="archetype-breadcrumb-link" onClick={() => { setSelectedEntry(null); setShowDev(false); }}>
              {selectedCategory.name}
            </button>
          ) : (
            <span className="archetype-breadcrumb-current">{selectedCategory.name}</span>
          )}
        </>
      )}
      {selectedEntry && (
        <>
          <span className="archetype-breadcrumb-sep">/</span>
          <span className="archetype-breadcrumb-current">{selectedEntry.name}</span>
        </>
      )}
    </div>
  ) : null;

  // Level 3: Entry detail
  if (selectedEntry) {
    const stageKey = `archetype-${selectedEntry.id}`;
    return (
      <>
        {breadcrumb}
        <div className="alexandria-detail">
          <h3>{selectedEntry.name}</h3>
          <div className="alexandria-detail-meta">
            <span className="alexandria-detail-author">{selectedEntry.subtitle}</span>
            <span className={`alexandria-detail-badge ${selectedEntry.domain}`}
              style={{ background: DOMAIN_COLORS[selectedEntry.domain] + '55' }}>
              {archetypeData.find(c => c.id === selectedEntry.domain)?.name}
            </span>
          </div>
          <div className="mythic-earth-site-text">
            {selectedEntry.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {selectedEntry.quotes && selectedEntry.quotes.length > 0 && (
            <div className="archetype-quotes">
              {selectedEntry.quotes.map((q, i) => (
                <blockquote key={i} className="archetype-quote">
                  <p>{q.text}</p>
                  <cite className="archetype-quote-source">{q.source}</cite>
                </blockquote>
              ))}
            </div>
          )}

          <button
            className={`archetype-dev-toggle${showDev ? ' active' : ''}`}
            onClick={() => { setShowDev(prev => !prev); trackElement(`${prefix}.${selectedCategory.id}.${selectedEntry.id}.development`); }}
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10,2 L10,11" />
              <path d="M7,5 Q10,3 13,5" />
              <path d="M6,11 L14,11" />
              <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
            </svg>
            {showDev ? 'Hide Development' : 'Development'}
          </button>

          {showDev && (
            <DevelopmentPanel
              stageLabel={selectedEntry.name}
              stageKey={stageKey}
              entries={devEntries}
              setEntries={setDevEntries}
              atlasOpener={`You're exploring the archetype "${selectedEntry.name}" — ${selectedEntry.subtitle}. What observations, connections, or personal resonances come to mind?`}
            />
          )}
        </div>
      </>
    );
  }

  // Level 2: Entry grid for selected category
  if (selectedCategory) {
    return (
      <>
        {breadcrumb}
        <div className="alexandria-panel libraries-panel">
          <div className="alexandria-header libraries-header">
            <h3>{selectedCategory.name}</h3>
            <p>{selectedCategory.description}</p>
          </div>

          <div className="mythic-earth-site-grid">
            {selectedCategory.entries.map(entry => (
              <button
                key={entry.id}
                className="mythic-earth-site-card archetype-entry-card"
                style={{ borderLeft: `3px solid ${DOMAIN_COLORS[entry.domain]}` }}
                onClick={() => { setSelectedEntry(entry); trackElement(`${prefix}.${selectedCategory.id}.${entry.id}`); }}
              >
                <span className="site-card-name">{entry.name}</span>
                <span className="site-card-region">{entry.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Level 1: Category grid
  return (
    <div className="libraries-panel">
      <div className="alexandria-header libraries-header archetypes-top-header">
        <h3>Archetypal Characters</h3>
        <p>Character archetypes and design principles from Jung, Campbell, Vogler, McKee, and Field — the recurring patterns that shape every story ever told.</p>
      </div>

      <div className="mythic-earth-site-grid">
        {archetypeData.map(cat => (
          <button
            key={cat.id}
            className="mythic-earth-site-card archetype-category-card"
            style={{ borderLeft: `3px solid ${cat.color}` }}
            onClick={() => { setSelectedCategory(cat); trackElement(`${prefix}.${cat.id}`); }}
          >
            <span className="site-card-name">{cat.name}</span>
            <span className="archetype-category-desc">{cat.description}</span>
            <span className="archetype-category-count">{cat.entries.length} entries</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ArchetypesPanel;
