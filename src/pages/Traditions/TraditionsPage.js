import React, { useState } from 'react';
import { useTraditions } from '../../contexts/TraditionsContext';
import { useScope } from '../../contexts/ScopeContext';

export default function TraditionsPage() {
  const { traditions, loading, addTradition, deleteTradition } = useTraditions();
  const { activeScope } = useScope();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await addTradition({ name: trimmed, description: description.trim() });
    setName('');
    setDescription('');
  };

  if (!activeScope) return <div style={{ padding: 24 }}>Select a family or friend group to view traditions.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-ember)' }}>{activeScope.name} Traditions</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tradition name" style={{ padding: 8, background: 'var(--bg-light)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)' }} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} style={{ padding: 8, background: 'var(--bg-light)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)', resize: 'vertical' }} />
        <button onClick={handleAdd} disabled={!name.trim()} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: 'var(--accent-ember)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.75rem' }}>Add Tradition</button>
      </div>

      {loading ? (
        <div><span className="celestial-loading-spinner" /></div>
      ) : traditions.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No traditions yet. Add one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {traditions.map(t => (
            <div key={t.id} style={{ padding: 12, background: 'rgba(139,157,195,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{t.name}</strong>
                <button onClick={() => deleteTradition(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
              </div>
              {t.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>{t.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
