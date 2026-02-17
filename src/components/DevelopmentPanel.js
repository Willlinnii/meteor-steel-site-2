import React, { useState } from 'react';

const DEV_MODES = [
  { id: 'noting', label: 'Noting' },
  { id: 'reflecting', label: 'Reflecting' },
  { id: 'creating', label: 'Creating' },
];

export default function DevelopmentPanel({ stageLabel, stageKey, entries, setEntries }) {
  const [mode, setMode] = useState('noting');
  const [draft, setDraft] = useState('');
  const [relating, setRelating] = useState(false);
  const [relation, setRelation] = useState(null);

  const key = `${stageKey}-${mode}`;
  const saved = entries[key] || [];

  const handleSave = () => {
    if (!draft.trim()) return;
    setEntries(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { text: draft.trim(), relation: null }],
    }));
    setDraft('');
    setRelation(null);
  };

  const handleRelate = async () => {
    if (!draft.trim()) return;
    setRelating(true);
    setRelation(null);
    try {
      const modeInstruction = mode === 'noting'
        ? 'The user is noting observations.'
        : mode === 'reflecting'
        ? 'The user is reflecting on personal meaning.'
        : 'The user is creating new ideas or connections.';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `I am exploring "${stageLabel}". ${modeInstruction}\n\nHere is what I wrote:\n\n"${draft.trim()}"\n\nRelate what I wrote to the material in the archive. Draw specific connections to the mythology, figures, technology, and themes. Be concise but insightful.`
          }]
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setRelation(data.reply);
      } else {
        setRelation(data.error || 'Could not generate a response.');
      }
    } catch {
      setRelation('Network error. Please try again.');
    }
    setRelating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <div className="dev-panel">
      <div className="dev-modes">
        {DEV_MODES.map(m => (
          <button
            key={m.id}
            className={`dev-mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {saved.length > 0 && (
        <div className="dev-entries">
          {saved.map((entry, i) => (
            <div key={i} className="dev-entry">
              <p>{entry.text}</p>
              {entry.relation && (
                <div className="dev-relation">
                  {entry.relation.split('\n\n').map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <textarea
        className="dev-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`${mode === 'noting' ? 'Jot down observations...' : mode === 'reflecting' ? 'Record your reflections...' : 'Develop your ideas...'}`}
        rows={6}
      />

      {relation && (
        <div className="dev-relation-preview">
          {relation.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      <div className="dev-actions">
        <button
          className="dev-save-btn"
          onClick={handleSave}
          disabled={!draft.trim()}
        >
          Save
        </button>
        <button
          className="dev-relate-btn"
          onClick={handleRelate}
          disabled={!draft.trim() || relating}
        >
          {relating ? 'Relating...' : 'Relate'}
        </button>
      </div>
    </div>
  );
}
