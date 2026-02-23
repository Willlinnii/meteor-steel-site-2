import React, { useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';

export default function FamilyManagePage() {
  const { families, activeFamily, setActiveFamily, createFamily, joinFamily } = useFamily();
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    await createFamily(trimmed);
    setNewName('');
    setCreating(false);
  };

  const handleJoin = async () => {
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    setJoining(true);
    setJoinError(null);
    const ok = await joinFamily(trimmed);
    if (!ok) setJoinError('Invalid invite code or already a member.');
    else setJoinCode('');
    setJoining(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-ember)' }}>My Families</h1>

      {/* Existing families */}
      {families.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {families.map(f => (
            <div key={f.id} style={{ padding: 12, marginBottom: 8, background: activeFamily?.id === f.id ? 'rgba(196,113,58,0.12)' : 'rgba(139,157,195,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer' }} onClick={() => setActiveFamily(f)}>
              <strong style={{ color: 'var(--text-primary)' }}>{f.name}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {f.memberUids?.length || 0} member{(f.memberUids?.length || 0) !== 1 ? 's' : ''} &middot; Invite code: <code>{f.inviteCode}</code>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-secondary)' }}>Create a Family</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Family name" style={{ flex: 1, padding: 8, background: 'var(--bg-light)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)' }} />
        <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{ padding: '6px 16px', background: 'var(--accent-ember)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.75rem' }}>
          {creating ? '...' : 'Create'}
        </button>
      </div>

      {/* Join */}
      <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-secondary)' }}>Join a Family</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinError(null); }} placeholder="Invite code" style={{ flex: 1, padding: 8, background: 'var(--bg-light)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)' }} />
        <button onClick={handleJoin} disabled={joining || !joinCode.trim()} style={{ padding: '6px 16px', background: 'var(--accent-ember)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.75rem' }}>
          {joining ? '...' : 'Join'}
        </button>
      </div>
      {joinError && <p style={{ color: '#e44', fontSize: '0.8rem', marginTop: 4 }}>{joinError}</p>}
    </div>
  );
}
