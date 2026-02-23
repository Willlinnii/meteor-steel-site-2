import React, { useState } from 'react';
import { useCreations } from '../../contexts/CreationsContext';
import { useScope } from '../../contexts/ScopeContext';

export default function CreationsPage() {
  const { creations, loading, addCreation, deleteCreation } = useCreations();
  const { activeScope } = useScope();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await addCreation({ title: trimmed, description: description.trim() });
    setTitle('');
    setDescription('');
  };

  if (!activeScope) return <div style={{ padding: 24 }}>Select a family or friend group to view creations.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-ember)' }}>{activeScope.name} Creations</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Creation title" style={{ padding: 8, background: 'var(--bg-light)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)' }} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} style={{ padding: 8, background: 'var(--bg-light)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)', resize: 'vertical' }} />
        <button onClick={handleAdd} disabled={!title.trim()} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: 'var(--accent-ember)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.75rem' }}>Add Creation</button>
      </div>

      {loading ? (
        <div><span className="celestial-loading-spinner" /></div>
      ) : creations.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No creations yet. Add one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {creations.map(c => (
            <div key={c.id} style={{ padding: 12, background: 'rgba(139,157,195,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{c.title}</strong>
                <button onClick={() => deleteCreation(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
              </div>
              {c.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>{c.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
