import React from 'react';
import { useStoryBook } from '../../contexts/StoryBookContext';
import { useScope } from '../../contexts/ScopeContext';

export default function StoryBookPage() {
  const { entries, loading } = useStoryBook();
  const { activeScope } = useScope();

  if (!activeScope) return <div style={{ padding: 24 }}>Select a family or friend group to view the story book.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-ember)' }}>{activeScope.name} Story Book</h1>

      {loading ? (
        <div><span className="celestial-loading-spinner" /></div>
      ) : entries.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No stories yet. Members can add their stories here.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => (
            <div key={e.id} style={{ padding: 12, background: 'rgba(139,157,195,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{e.title || e.id}</strong>
              {e.text && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>{e.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
