import React from 'react';

export default function TextBlock({ text }) {
  if (!text || !text.trim()) return null;
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}
