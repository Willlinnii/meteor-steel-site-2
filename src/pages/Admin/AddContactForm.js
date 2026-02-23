import React, { useState } from 'react';

export default function AddContactForm({ onSave, onCancel, existingEmails }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [dupWarning, setDupWarning] = useState(null);

  const checkDup = () => {
    if (email && existingEmails?.has(email.trim().toLowerCase())) {
      setDupWarning(`"${email}" already exists in contacts`);
    } else {
      setDupWarning(null);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() && !lastName.trim()) return;
    setSaving(true);
    await onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emails: email.trim() ? [email.trim().toLowerCase()] : [],
      phones: phone.trim() ? [phone.trim()] : [],
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      notes: notes.trim(),
    });
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setCompany(''); setJobTitle(''); setNotes(''); setDupWarning(null);
    setSaving(false);
  };

  return (
    <div className="contacts-add-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#8a8a9a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Add Contact
        </span>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: '#6a6a7a', cursor: 'pointer', fontSize: '1.1rem',
        }}>&times;</button>
      </div>

      <div className="contacts-form-grid">
        <div className="contacts-form-field">
          <label className="contacts-form-label">First Name</label>
          <input className="contacts-form-input" value={firstName}
            onChange={e => setFirstName(e.target.value)} placeholder="First name" />
        </div>
        <div className="contacts-form-field">
          <label className="contacts-form-label">Last Name</label>
          <input className="contacts-form-input" value={lastName}
            onChange={e => setLastName(e.target.value)} placeholder="Last name" />
        </div>
        <div className="contacts-form-field">
          <label className="contacts-form-label">Email</label>
          <input className="contacts-form-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} onBlur={checkDup} placeholder="email@example.com" />
          {dupWarning && <span className="contacts-dup-warning">{dupWarning}</span>}
        </div>
        <div className="contacts-form-field">
          <label className="contacts-form-label">Phone</label>
          <input className="contacts-form-input" value={phone}
            onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
        </div>
        <div className="contacts-form-field">
          <label className="contacts-form-label">Company</label>
          <input className="contacts-form-input" value={company}
            onChange={e => setCompany(e.target.value)} placeholder="Company" />
        </div>
        <div className="contacts-form-field">
          <label className="contacts-form-label">Job Title</label>
          <input className="contacts-form-input" value={jobTitle}
            onChange={e => setJobTitle(e.target.value)} placeholder="Job title" />
        </div>
        <div className="contacts-form-field full-width">
          <label className="contacts-form-label">Notes</label>
          <textarea className="contacts-form-input contacts-form-textarea" value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Notes..." />
        </div>
      </div>

      <div className="contacts-form-actions">
        <button onClick={onCancel} className="contacts-form-btn-cancel">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || (!firstName.trim() && !lastName.trim())}
          className="contacts-form-btn-save">
          {saving ? 'Saving...' : 'Save Contact'}
        </button>
      </div>
    </div>
  );
}
