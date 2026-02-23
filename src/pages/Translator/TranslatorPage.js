import React from 'react';
import { useScope } from '../../contexts/ScopeContext';

export default function TranslatorPage() {
  const { activeScope } = useScope();

  if (!activeScope) return <div style={{ padding: 24 }}>Select a family or friend group to use the translator.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-ember)' }}>Translator</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Translate between languages for {activeScope.name}.</p>
    </div>
  );
}
