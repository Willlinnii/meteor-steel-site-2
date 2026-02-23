import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../lib/chatApi';
import { useFellowship } from '../../contexts/FellowshipContext';
import FELLOWSHIP_TYPES from '../../data/fellowshipTypes';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * ShareCompletionModal — state machine for sharing completions with fellows.
 *
 * States: generating → preview → editing → media → posting → done
 */
export default function ShareCompletionModal({
  completionType,
  completionId,
  completionLabel,
  completionData,
  onClose,
  onPosted,
}) {
  const { postCompletionShare, uploadImages } = useFellowship();
  const [phase, setPhase] = useState('generating'); // generating | preview | editing | media | posting | done
  const [summary, setSummary] = useState('');
  const [fullStory, setFullStory] = useState('');
  const [error, setError] = useState(null);

  // Editing state
  const [editMessages, setEditMessages] = useState([]);
  const [editInput, setEditInput] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Media state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoURL, setVideoURL] = useState('');
  const fileInputRef = useRef(null);

  const typeDef = FELLOWSHIP_TYPES[completionType] || {};

  // Generate initial summary on mount
  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const res = await apiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'fellowship-summary',
            completionType,
            completionData,
          }),
        });
        if (cancelled) return;
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setSummary(data.summary || '');
        setFullStory(data.fullStory || '');
        setPhase('preview');
      } catch (err) {
        if (!cancelled) setError('Failed to generate summary. Please try again.');
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [completionType, completionData]);

  // Scroll chat to bottom
  useEffect(() => {
    if (phase === 'editing') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [editMessages, phase]);

  // Send edit message to Atlas
  const handleSendEdit = useCallback(async () => {
    const text = editInput.trim();
    if (!text || editLoading) return;
    setEditInput('');
    const newMessages = [...editMessages, { role: 'user', content: text }];
    setEditMessages(newMessages);
    setEditLoading(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'fellowship-revise',
          currentSummary: summary,
          currentFullStory: fullStory,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setEditMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }]);
      } else if (data.revised) {
        setSummary(data.summary);
        setFullStory(data.fullStory || '');
        setEditMessages(prev => [...prev, { role: 'assistant', content: 'I\'ve updated your post. Click "Accept Changes" to see the preview.' }]);
      } else {
        setEditMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setEditMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setEditLoading(false);
    }
  }, [editInput, editLoading, editMessages, summary, fullStory]);

  // Handle image selection
  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_SIZE);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = valid.slice(0, remaining);
    setImageFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, { name: f.name, url: ev.target.result }]);
      };
      reader.readAsDataURL(f);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [imageFiles]);

  const removeImage = useCallback((idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Post to Fellowship
  const handlePost = useCallback(async () => {
    setPhase('posting');
    setError(null);
    try {
      let uploadedImages = [];
      if (imageFiles.length > 0) {
        uploadedImages = await uploadImages(imageFiles);
      }
      await postCompletionShare({
        summary,
        fullStory,
        completionType,
        completionId,
        completionLabel: completionLabel || typeDef.label || completionType,
        images: uploadedImages,
        videoURL: videoURL || null,
      });
      setPhase('done');
      setTimeout(() => {
        onPosted?.();
        onClose();
      }, 2000);
    } catch {
      setError('Failed to post. Please try again.');
      setPhase('preview');
    }
  }, [summary, fullStory, completionType, completionId, completionLabel, typeDef, imageFiles, videoURL, uploadImages, postCompletionShare, onPosted, onClose]);

  // Lock scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fellowship-modal-overlay" onClick={onClose}>
      <div className="fellowship-modal" onClick={e => e.stopPropagation()}>
        <button className="fellowship-modal-close" onClick={onClose}>&times;</button>

        <h2 className="fellowship-modal-title">
          Share with your Fellows
        </h2>

        {typeDef.icon && (
          <div className="fellowship-modal-badge" style={{ color: typeDef.color }}>
            {typeDef.icon} {completionLabel || typeDef.label}
          </div>
        )}

        {error && <div className="fellowship-modal-error">{error}</div>}

        {/* GENERATING */}
        {phase === 'generating' && (
          <div className="fellowship-modal-generating">
            <div className="fellowship-modal-spinner" />
            <p>Atlas is crafting your story...</p>
          </div>
        )}

        {/* PREVIEW */}
        {phase === 'preview' && (
          <div className="fellowship-modal-preview">
            <div className="fellowship-modal-summary">{summary}</div>
            {fullStory && (
              <details className="fellowship-modal-story-details">
                <summary>Read full story...</summary>
                <div className="fellowship-modal-story">
                  {fullStory.split('\n').map((line, i) => (
                    line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                  ))}
                </div>
              </details>
            )}

            {imagePreviews.length > 0 && (
              <div className="fellowship-modal-image-previews">
                {imagePreviews.map((img, i) => (
                  <div key={i} className="fellowship-modal-image-preview">
                    <img src={img.url} alt={img.name} />
                    <button onClick={() => removeImage(i)}>&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div className="fellowship-modal-actions">
              <button className="fellowship-modal-btn fellowship-modal-btn-primary" onClick={handlePost}>
                Share
              </button>
              <button className="fellowship-modal-btn" onClick={() => setPhase('editing')}>
                Edit with Atlas
              </button>
              <button className="fellowship-modal-btn" onClick={() => setPhase('media')}>
                Add Media
              </button>
              <button className="fellowship-modal-btn fellowship-modal-btn-skip" onClick={onClose}>
                Skip
              </button>
            </div>
          </div>
        )}

        {/* EDITING */}
        {phase === 'editing' && (
          <div className="fellowship-modal-editing">
            <div className="fellowship-modal-chat">
              {editMessages.map((msg, i) => (
                <div key={i} className={`fellowship-modal-msg fellowship-modal-msg-${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {editLoading && (
                <div className="fellowship-modal-msg fellowship-modal-msg-assistant fellowship-modal-typing">
                  <span /><span /><span />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="fellowship-modal-edit-input-row">
              <input
                className="fellowship-modal-edit-input"
                type="text"
                placeholder="Tell Atlas what to change..."
                value={editInput}
                onChange={e => setEditInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendEdit()}
              />
              <button
                className="fellowship-modal-btn fellowship-modal-btn-primary"
                onClick={handleSendEdit}
                disabled={!editInput.trim() || editLoading}
              >
                Send
              </button>
            </div>
            <button className="fellowship-modal-btn" onClick={() => setPhase('preview')}>
              Accept Changes
            </button>
          </div>
        )}

        {/* MEDIA */}
        {phase === 'media' && (
          <div className="fellowship-modal-media">
            <h3>Add Media</h3>
            <div className="fellowship-modal-media-section">
              <label>Images (max {MAX_IMAGES}, 5MB each)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={imageFiles.length >= MAX_IMAGES}
              />
              {imagePreviews.length > 0 && (
                <div className="fellowship-modal-image-previews">
                  {imagePreviews.map((img, i) => (
                    <div key={i} className="fellowship-modal-image-preview">
                      <img src={img.url} alt={img.name} />
                      <button onClick={() => removeImage(i)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="fellowship-modal-media-section">
              <label>Video URL</label>
              <input
                className="fellowship-modal-video-input"
                type="url"
                placeholder="https://..."
                value={videoURL}
                onChange={e => setVideoURL(e.target.value)}
              />
            </div>
            <button className="fellowship-modal-btn fellowship-modal-btn-primary" onClick={() => setPhase('preview')}>
              Done
            </button>
          </div>
        )}

        {/* POSTING */}
        {phase === 'posting' && (
          <div className="fellowship-modal-generating">
            <div className="fellowship-modal-spinner" />
            <p>Posting...</p>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div className="fellowship-modal-done">
            <span className="fellowship-modal-done-check">{'\u2714'}</span>
            <p>Posted!</p>
          </div>
        )}
      </div>
    </div>
  );
}
