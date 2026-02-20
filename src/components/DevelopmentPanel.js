import React, { useState, useRef, useEffect } from 'react';

const DEV_MODES = [
  { id: 'noting', label: 'Noting' },
  { id: 'reflecting', label: 'Reflecting' },
  { id: 'creating', label: 'Creating' },
];

function defaultOpener(stageLabel, mode) {
  if (mode === 'noting') return `You're exploring ${stageLabel}. What do you notice? Jot down observations — images, connections, questions that arise.`;
  if (mode === 'reflecting') return `You're sitting with ${stageLabel}. What does it stir in you personally? What memories, feelings, or recognitions surface?`;
  return `You're at ${stageLabel}. What wants to be created here? What new ideas, connections, or possibilities are emerging?`;
}

export default function DevelopmentPanel({ stageLabel, stageKey, entries, setEntries, storyTag, atlasOpener }) {
  const [mode, setMode] = useState('noting');
  const [draft, setDraft] = useState('');
  const [relatingIdx, setRelatingIdx] = useState(null);
  const scrollRef = useRef(null);

  const key = `${stageKey}-${mode}`;
  const saved = entries[key] || [];

  const opener = atlasOpener || defaultOpener(stageLabel, mode);

  // Auto-scroll to bottom when entries change or a relation loads
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [saved.length, relatingIdx]);

  const handleRelate = async (entryIndex, entryText) => {
    setRelatingIdx(entryIndex);
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
            content: `I am exploring "${stageLabel}". ${modeInstruction}\n\nHere is what I wrote:\n\n"${entryText}"\n\nRespond as a thoughtful guide. Ask a follow-up question that deepens the exploration. Draw a brief connection to the mythology, themes, or material, then pose one question that invites the writer to go further. Be concise — 2-3 sentences.`
          }]
        }),
      });
      const data = await res.json();
      const relation = data.reply || data.error || 'Could not generate a response.';
      setEntries(prev => {
        const list = [...(prev[key] || [])];
        if (list[entryIndex]) {
          list[entryIndex] = { ...list[entryIndex], relation };
        }
        return { ...prev, [key]: list };
      });
    } catch {
      setEntries(prev => {
        const list = [...(prev[key] || [])];
        if (list[entryIndex]) {
          list[entryIndex] = { ...list[entryIndex], relation: 'Network error. Please try again.' };
        }
        return { ...prev, [key]: list };
      });
    }
    setRelatingIdx(null);
  };

  const handleSave = () => {
    if (!draft.trim()) return;
    const entry = { text: draft.trim(), relation: null };
    if (storyTag) entry.storyTag = storyTag;
    const newIndex = saved.length;
    setEntries(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), entry],
    }));
    setDraft('');
    // Auto-relate in background
    handleRelate(newIndex, draft.trim());
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

      <div className="dev-chat" ref={scrollRef}>
        {/* Atlas opener */}
        <div className="dev-msg dev-msg-atlas">
          <span className="dev-msg-label">Atlas</span>
          <p>{opener}</p>
        </div>

        {/* Entries as chat messages */}
        {saved.map((entry, i) => (
          <React.Fragment key={i}>
            <div className="dev-msg dev-msg-user">
              <span className="dev-msg-label">You</span>
              <p>{entry.text}</p>
            </div>
            {entry.relation && (
              <div className="dev-msg dev-msg-atlas">
                <span className="dev-msg-label">Atlas</span>
                {entry.relation.split('\n\n').map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            )}
            {relatingIdx === i && !entry.relation && (
              <div className="dev-msg dev-msg-atlas dev-msg-loading">
                <span className="dev-msg-label">Atlas</span>
                <p className="dev-typing">...</p>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="dev-input-row">
        <textarea
          className="dev-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${mode === 'noting' ? 'Jot down observations...' : mode === 'reflecting' ? 'Record your reflections...' : 'Develop your ideas...'}`}
          rows={4}
        />
        <button
          className="dev-save-btn"
          onClick={handleSave}
          disabled={!draft.trim()}
        >
          Save
        </button>
      </div>
    </div>
  );
}
