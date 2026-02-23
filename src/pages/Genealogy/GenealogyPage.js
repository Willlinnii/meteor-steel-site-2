import React from 'react';
import { useGenealogy } from '../../contexts/GenealogyContext';
import { useFamily } from '../../contexts/FamilyContext';

export default function GenealogyPage() {
  const { people, loading } = useGenealogy();
  const { activeFamily } = useFamily();

  if (!activeFamily) return <div style={{ padding: 24 }}>Select a family to view the family tree.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-ember)' }}>{activeFamily.name} Family Tree</h1>

      {loading ? (
        <div><span className="celestial-loading-spinner" /></div>
      ) : people.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No family members added yet. Start building your family tree!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {people.map(p => (
            <div key={p.id} style={{ padding: 12, background: 'rgba(139,157,195,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong>
              {p.relationship && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>({p.relationship})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
