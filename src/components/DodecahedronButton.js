import React, { useState, useCallback } from 'react';
import DODECAHEDRON_RESEARCH from '../data/dodecahedronResearch';
import './DodecahedronButton.css';

/* Schlegel-diagram dodecahedron: outer pentagon + inner rotated pentagon + connecting edges */
function DodecIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* outer pentagon */}
      <polygon points="12,3 20.6,9.2 17.3,19.3 6.7,19.3 3.4,9.2" fill="none" />
      {/* inner pentagon (rotated 36°) */}
      <polygon points="14.9,8 16.8,13.5 12,17 7.2,13.5 9.1,8" fill="none" />
      {/* connecting edges */}
      <line x1="12"   y1="3"    x2="14.9" y2="8" />
      <line x1="12"   y1="3"    x2="9.1"  y2="8" />
      <line x1="20.6" y1="9.2"  x2="14.9" y2="8" />
      <line x1="20.6" y1="9.2"  x2="16.8" y2="13.5" />
      <line x1="17.3" y1="19.3" x2="16.8" y2="13.5" />
      <line x1="17.3" y1="19.3" x2="12"   y2="17" />
      <line x1="6.7"  y1="19.3" x2="12"   y2="17" />
      <line x1="6.7"  y1="19.3" x2="7.2"  y2="13.5" />
      <line x1="3.4"  y1="9.2"  x2="7.2"  y2="13.5" />
      <line x1="3.4"  y1="9.2"  x2="9.1"  y2="8" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg className={`dodec-chevron ${open ? 'dodec-chevron-open' : ''}`}
      width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="3,4 6,7 9,4" />
    </svg>
  );
}

function SectionAccordion({ section, isOpen, onToggle }) {
  const [openEntry, setOpenEntry] = useState(null);

  const toggleEntry = useCallback((entryId) => {
    setOpenEntry(prev => prev === entryId ? null : entryId);
  }, []);

  return (
    <div className="dodec-section">
      <button className="dodec-section-header" onClick={onToggle}>
        <span className="dodec-section-title">{section.title}</span>
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && (
        <div className="dodec-section-body">
          <p className="dodec-section-summary">{section.summary}</p>
          <div className="dodec-entries">
            {section.entries.map(entry => (
              <div key={entry.id} className="dodec-entry">
                <button
                  className={`dodec-entry-header ${openEntry === entry.id ? 'dodec-entry-active' : ''}`}
                  onClick={() => toggleEntry(entry.id)}
                >
                  <span>{entry.title}</span>
                  <ChevronIcon open={openEntry === entry.id} />
                </button>
                {openEntry === entry.id && (
                  <div className="dodec-entry-body">
                    {entry.body.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DodecahedronButton({ className = '', iconSize }) {
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = useCallback((sectionId) => {
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  }, []);

  return (
    <>
      <button
        className={`dodec-btn ${className}`}
        onClick={() => setOpen(true)}
        title="Dodecahedron"
      >
        <DodecIcon size={iconSize} />
      </button>

      {open && (
        <div className="dodec-overlay" onClick={() => setOpen(false)}>
          <div className="dodec-modal" onClick={e => e.stopPropagation()}>
            <button className="dodec-modal-close" onClick={() => setOpen(false)}>&times;</button>

            <div className="dodec-modal-header">
              <div className="dodec-modal-icon">
                <DodecIcon size={48} />
              </div>
              <div className="dodec-modal-titles">
                <h2 className="dodec-modal-title">{DODECAHEDRON_RESEARCH.title}</h2>
                <p className="dodec-modal-subtitle">{DODECAHEDRON_RESEARCH.subtitle}</p>
              </div>
            </div>

            <div className="dodec-modal-content">
              {DODECAHEDRON_RESEARCH.coreSections.map(section => (
                <SectionAccordion
                  key={section.id}
                  section={section}
                  isOpen={openSection === section.id}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}

              <div className="dodec-extension-divider">
                <h3 className="dodec-extension-title">{DODECAHEDRON_RESEARCH.extensionTitle}</h3>
                <p className="dodec-extension-subtitle">{DODECAHEDRON_RESEARCH.extensionSubtitle}</p>
              </div>

              {DODECAHEDRON_RESEARCH.extensionSections.map(section => (
                <SectionAccordion
                  key={section.id}
                  section={section}
                  isOpen={openSection === section.id}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
