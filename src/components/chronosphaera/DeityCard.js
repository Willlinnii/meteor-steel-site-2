import React from 'react';

function Field({ label, value }) {
  if (!value) return null;
  const display = Array.isArray(value) ? value.join(', ') : value;
  if (!display) return null;
  return (
    <div className="deity-field">
      <span className="deity-field-label">{label}:</span>{' '}
      <span className="deity-field-value">{display}</span>
    </div>
  );
}

export default function DeityCard({ deity }) {
  if (!deity) return null;
  return (
    <div className="deity-card">
      <h4 className="deity-name">{deity.name}</h4>
      {deity.culture && <span className="deity-culture">{deity.culture}</span>}
      {deity.domain && <p className="deity-domain">{deity.domain}</p>}
      <div className="deity-fields">
        <Field label="Animals" value={deity.animals} />
        <Field label="Colors" value={deity.colors} />
        <Field label="Metals" value={deity.metals} />
        <Field label="Weapons" value={deity.weapons} />
        <Field label="Consorts" value={deity.consorts} />
        <Field label="Vegetation" value={deity.vegetation} />
        <Field label="Birth/Creation" value={deity.birthCreation} />
        <Field label="Planet Connection" value={deity.planetConnection} />
        <Field label="Day & Time" value={deity.dayTime} />
        <Field label="Holidays" value={deity.holidays} />
      </div>
    </div>
  );
}
