import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SourceBookPopup.css';

export default function SourceBookPopup({ books, tradition, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="source-popup-overlay" onClick={onClose}>
      <div className="source-popup" onClick={e => e.stopPropagation()}>
        <div className="source-popup-header">
          <h4 className="source-popup-title">{tradition}</h4>
          <span className="source-popup-subtitle">Library Sources</span>
          <button className="source-popup-close" onClick={onClose} title="Close">&times;</button>
        </div>
        <div className="source-popup-body">
          {books.map((book, i) => (
            <div key={book.title} className="source-popup-book">
              <div className="source-popup-book-info">
                <span className="source-popup-book-title">{book.title}</span>
                <span className="source-popup-book-meta">
                  {book.author || book.tradition}{book.year ? ` — ${book.year}` : ''}
                </span>
                {book.note && <span className="source-popup-book-note">{book.note}</span>}
              </div>
              <div className="source-popup-book-actions">
                {book.freeUrl && (
                  <a
                    className="source-popup-btn source-popup-btn-read"
                    href={book.freeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Read Free
                  </a>
                )}
                <button
                  className="source-popup-btn source-popup-btn-library"
                  onClick={() => {
                    onClose();
                    navigate(`/library?shelf=chronosphaera&book=${encodeURIComponent(book.title)}`);
                  }}
                >
                  View in Library
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
