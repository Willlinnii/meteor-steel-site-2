import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { MENTOR_STATUS } from '../../profile/mentorEngine';
import { apiFetch } from '../../lib/chatApi';
import { db, firebaseConfigured } from '../../auth/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import './TeacherPage.css';

// ── Read uploaded file as text ──
async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ── Main Component ──

export default function TeacherPage() {
  const { user } = useAuth();
  const { mentorData, effectiveMentorStatus } = useProfile();
  const navigate = useNavigate();

  // Syllabus input state
  const [courseName, setCourseName] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Parse results
  const [parsedItems, setParsedItems] = useState(null);
  const [matchedItems, setMatchedItems] = useState([]);
  const [unmatchedItems, setUnmatchedItems] = useState([]);

  // Saved courses
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Manual add autocomplete
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Access check ──
  const hasAccess = user && effectiveMentorStatus === MENTOR_STATUS.ACTIVE;

  // ── Load saved courses from Firestore ──
  useEffect(() => {
    if (!user || !firebaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, `users/${user.uid}/teacher-courses`));
        if (cancelled) return;
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setCourses(list);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // ── Fetch content catalog for autocomplete ──
  useEffect(() => {
    if (!hasAccess) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-catalog' }),
        });
        if (cancelled) return;
        const data = await res.json();
        if (data.catalog) setCatalog(data.catalog);
      } catch {
        // Non-critical — manual add just won't autocomplete
      }
    })();
    return () => { cancelled = true; };
  }, [hasAccess]);

  // Close autocomplete on outside click
  useEffect(() => {
    function handler(e) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── File upload handler ──
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');

    try {
      const text = await readFileAsText(file);
      setSyllabusText(text.slice(0, 15000));
    } catch (err) {
      setParseError('Failed to read file. Try pasting the text instead.');
    }
  }, []);

  // ── Parse syllabus ──
  const handleParse = useCallback(async () => {
    if (parsing || syllabusText.length < 50) return;
    setParsing(true);
    setParseError('');
    setParsedItems(null);
    setMatchedItems([]);
    setUnmatchedItems([]);

    try {
      const res = await apiFetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-syllabus', syllabusText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || 'Parse failed.');
        return;
      }
      setParsedItems(data.parsedItems || []);
      setMatchedItems(data.matchedItems || []);
      setUnmatchedItems(data.unmatchedItems || []);
    } catch (err) {
      setParseError('Network error. Please try again.');
    } finally {
      setParsing(false);
    }
  }, [parsing, syllabusText]);

  // ── Remove a matched item ──
  const removeMatch = useCallback((contentId) => {
    setMatchedItems(prev => prev.filter(m => m.contentId !== contentId));
  }, []);

  // ── Manual add from autocomplete ──
  const addManualItem = useCallback((item) => {
    setMatchedItems(prev => {
      if (prev.some(m => m.contentId === item.id)) return prev;
      return [...prev, {
        contentId: item.id,
        category: item.category,
        name: item.name,
        route: item.route,
        matchedFrom: 'manual',
        manuallyAdded: true,
      }];
    });
    setSearchQuery('');
    setShowAutocomplete(false);
  }, []);

  // ── Autocomplete results ──
  const autocompleteResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return catalog
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [searchQuery, catalog]);

  // ── Save course to Firestore ──
  const saveCourse = useCallback(async () => {
    if (!user || !courseName.trim() || saving) return;
    setSaving(true);
    try {
      const courseId = editingCourseId || `course-${Date.now()}`;
      const courseDoc = {
        name: courseName.trim(),
        updatedAt: serverTimestamp(),
        syllabusText,
        syllabusFileName: fileName || null,
        parsedItems: parsedItems || [],
        footprint: matchedItems,
        unmatchedItems,
      };
      if (!editingCourseId) {
        courseDoc.createdAt = serverTimestamp();
      }
      await setDoc(doc(db, `users/${user.uid}/teacher-courses`, courseId), courseDoc, { merge: true });

      // Refresh course list
      const snap = await getDocs(collection(db, `users/${user.uid}/teacher-courses`));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCourses(list);
      setEditingCourseId(courseId);
    } catch (err) {
      console.error('Save failed:', err);
      setParseError('Failed to save course.');
    } finally {
      setSaving(false);
    }
  }, [user, courseName, syllabusText, fileName, parsedItems, matchedItems, unmatchedItems, editingCourseId, saving]);

  // ── Delete course ──
  const deleteCourse = useCallback(async (courseId) => {
    if (!user || !window.confirm('Delete this course footprint?')) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/teacher-courses`, courseId));
      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (editingCourseId === courseId) {
        resetForm();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [user, editingCourseId]);

  // ── Load course into editor ──
  const loadCourse = useCallback((course) => {
    setEditingCourseId(course.id);
    setCourseName(course.name || '');
    setSyllabusText(course.syllabusText || '');
    setFileName(course.syllabusFileName || '');
    setParsedItems(course.parsedItems || []);
    setMatchedItems(course.footprint || []);
    setUnmatchedItems(course.unmatchedItems || []);
    setParseError('');
  }, []);

  // ── Reset form ──
  const resetForm = useCallback(() => {
    setEditingCourseId(null);
    setCourseName('');
    setSyllabusText('');
    setFileName('');
    setParsedItems(null);
    setMatchedItems([]);
    setUnmatchedItems([]);
    setParseError('');
  }, []);

  // ── Auth gate ──
  if (!user) {
    return (
      <div className="teacher-auth-gate">
        <h2>Sign In Required</h2>
        <p>Please sign in to access Teacher Mode.</p>
      </div>
    );
  }
  if (!hasAccess) {
    return (
      <div className="teacher-auth-gate">
        <h2>Mentor Access Required</h2>
        <p>Teacher Mode is available to active mentors.</p>
        <button className="teacher-back-btn" onClick={() => navigate('/profile')} style={{ marginTop: 16 }}>
          Go to Profile
        </button>
      </div>
    );
  }

  // ── Group matched items by category ──
  const matchGroups = {};
  for (const m of matchedItems) {
    const cat = m.category || 'other';
    if (!matchGroups[cat]) matchGroups[cat] = [];
    matchGroups[cat].push(m);
  }

  const hasResults = parsedItems !== null;

  return (
    <div className="teacher-page">
      <h1>Teacher Mode</h1>
      <p className="teacher-subtitle">Map your syllabus to Mythouse content</p>

      {/* ── Saved Courses ── */}
      {courses.length > 0 && !hasResults && (
        <div className="teacher-section">
          <h2 className="teacher-section-title">My Courses</h2>
          {courses.map(c => (
            <div key={c.id} className="teacher-course-card" onClick={() => loadCourse(c)}>
              <div>
                <div className="teacher-course-name">{c.name}</div>
                <div className="teacher-course-meta">
                  {(c.footprint || []).length} items
                  {c.createdAt?.seconds ? ` \u2022 ${new Date(c.createdAt.seconds * 1000).toLocaleDateString()}` : ''}
                </div>
              </div>
              <div className="teacher-course-actions">
                <button
                  className="teacher-delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteCourse(c.id); }}
                  title="Delete"
                >
                  \u2715
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Syllabus Input ── */}
      <div className="teacher-section">
        <h2 className="teacher-section-title">
          {editingCourseId ? 'Edit Course' : 'New Course'}
        </h2>

        <div className="teacher-input-row">
          <label>Course Name</label>
          <input
            type="text"
            className="teacher-text-input"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            placeholder="e.g. Intro to World Mythology"
            maxLength={120}
          />
        </div>

        <div className="teacher-input-row">
          <label>Syllabus Text</label>
          <textarea
            className="teacher-textarea"
            value={syllabusText}
            onChange={e => setSyllabusText(e.target.value)}
            placeholder="Paste your syllabus here, or upload a file below..."
            maxLength={15000}
          />
          <div className={`teacher-char-count ${syllabusText.length > 14500 ? 'over' : ''}`}>
            {syllabusText.length.toLocaleString()} / 15,000
          </div>
        </div>

        <div className="teacher-file-row">
          <button className="teacher-file-btn" onClick={() => fileInputRef.current?.click()}>
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          {fileName && <span className="teacher-file-name">{fileName}</span>}
        </div>

        {parseError && <div className="teacher-error">{parseError}</div>}

        <button
          className="teacher-parse-btn"
          onClick={handleParse}
          disabled={parsing || syllabusText.length < 50}
        >
          {parsing ? (
            <>
              <span className="teacher-spinner" />
              Parsing...
            </>
          ) : (
            'Parse Syllabus'
          )}
        </button>

        {editingCourseId && (
          <button className="teacher-back-btn" onClick={resetForm} style={{ marginLeft: 8 }}>
            New Course
          </button>
        )}
      </div>

      {/* ── Match Results ── */}
      {hasResults && (
        <>
          <div className="teacher-section">
            <h2 className="teacher-section-title">Matched Content</h2>
            <div className="teacher-match-stats">
              <strong>{matchedItems.length}</strong> content matches from{' '}
              <strong>{(parsedItems || []).length}</strong> parsed items
              {unmatchedItems.length > 0 && (
                <> \u2022 <strong>{unmatchedItems.length}</strong> unmatched</>
              )}
            </div>

            {Object.entries(matchGroups).map(([cat, items]) => (
              <div key={cat} className="teacher-match-group">
                <div className="teacher-match-group-title">{cat.replace(/-/g, ' ')}</div>
                {items.map(m => (
                  <div key={m.contentId} className="teacher-match-item">
                    {m.matchedFrom && m.matchedFrom !== 'manual' && (
                      <>
                        <span className="teacher-match-parsed">
                          {((parsedItems || []).find(p => p.id === m.matchedFrom) || {}).text || ''}
                        </span>
                        <span className="teacher-match-arrow">\u2192</span>
                      </>
                    )}
                    <div className="teacher-match-content">
                      <div className="teacher-match-name">
                        <a href={m.route}>{m.name}</a>
                      </div>
                      <div className="teacher-match-category">{m.category}</div>
                    </div>
                    <button
                      className="teacher-match-remove"
                      onClick={() => removeMatch(m.contentId)}
                      title="Remove"
                    >
                      \u2715
                    </button>
                  </div>
                ))}
              </div>
            ))}

            {matchedItems.length === 0 && (
              <div className="teacher-empty">No matches yet. Try parsing your syllabus or adding items manually.</div>
            )}
          </div>

          {/* ── Unmatched items ── */}
          {unmatchedItems.length > 0 && (
            <div className="teacher-unmatched">
              <h3 className="teacher-unmatched-title">Unmatched Items</h3>
              {unmatchedItems.map((u, i) => (
                <div key={i} className="teacher-unmatched-item">
                  {u.text} — <em>{u.reason}</em>
                </div>
              ))}
            </div>
          )}

          {/* ── Manual Add ── */}
          <div className="teacher-section">
            <h2 className="teacher-section-title">Add Content Manually</h2>
            <div className="teacher-manual-add" ref={autocompleteRef}>
              <input
                type="text"
                className="teacher-manual-input"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowAutocomplete(true); }}
                onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
                placeholder="Search for content to add..."
              />
              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className="teacher-autocomplete">
                  {autocompleteResults.map(item => (
                    <div
                      key={item.id}
                      className="teacher-autocomplete-item"
                      onClick={() => addManualItem(item)}
                    >
                      {item.name}
                      <span className="teacher-autocomplete-cat">{item.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Save / Actions ── */}
          <div className="teacher-actions-row">
            <button
              className="teacher-save-btn"
              onClick={saveCourse}
              disabled={saving || !courseName.trim()}
            >
              {saving ? 'Saving...' : editingCourseId ? 'Update Course' : 'Save Course'}
            </button>
            <button className="teacher-back-btn" onClick={resetForm}>
              {editingCourseId ? 'Cancel' : 'Clear'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
