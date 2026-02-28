import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../profile/ProfileContext';
import { apiFetch } from '../../lib/chatApi';
import { db, firebaseConfigured } from '../../auth/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import './TeacherPage.css';

// ── Category display mapping ──
const CATEGORY_LABELS = {
  'monomyth-stage': "Hero's Journey Stages",
  'theorist': 'Theorists & Scholars',
  'pantheon': 'Mythological Figures & Pantheons',
  'sacred-site': 'Sacred Sites',
  'library': 'Library & Reading',
  'monomyth-model': 'Monomyth Frameworks',
  'monomyth-myth': 'Myths & Sacred Narratives',
  'monomyth-film': 'Films',
  'planet': 'Planets & Metals',
  'zodiac': 'Zodiac Signs',
  'constellation': 'Constellations',
  'element': 'Classical Elements',
  'cardinal': 'Cardinal Directions & Seasons',
  'archetype': 'Archetypes',
  'game': 'Ancient Games',
  'cycle': 'Natural Cycles',
  'figure': 'Mythological Figures',
  'savior': 'Savior Figures',
  'journey': 'Journeys',
  'fallen-starlight': 'Fallen Starlight',
  'tv-episode': 'Mythology Channel',
  'medicine-wheel': 'Medicine Wheels',
  'calendar': 'Mythic Calendar',
};
const CATEGORY_ORDER = [
  'monomyth-stage', 'theorist', 'monomyth-model', 'pantheon', 'monomyth-myth',
  'sacred-site', 'library', 'monomyth-film', 'planet', 'zodiac',
  'constellation', 'element', 'cardinal', 'archetype', 'game',
  'figure', 'savior', 'cycle', 'journey', 'fallen-starlight',
  'tv-episode', 'medicine-wheel', 'calendar',
];

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
  const { hasSubscription } = useProfile();
  const navigate = useNavigate();

  // Syllabus input state
  const [courseName, setCourseName] = useState('');
  const [institution, setInstitution] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [creditHours, setCreditHours] = useState('');
  const [instructor, setInstructor] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
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
  const [, setLoadingCourses] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Manual add autocomplete
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef(null);
  const fileInputRef = useRef(null);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ── Access check ──
  const hasAccess = user && hasSubscription('teaching');

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
        const res = await apiFetch('/api/guild-member', {
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

  // ── Escape key to close modal ──
  useEffect(() => {
    if (!showUploadModal) return;
    function handler(e) {
      if (e.key === 'Escape') setShowUploadModal(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showUploadModal]);

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
      const res = await apiFetch('/api/guild-member', {
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
      setShowUploadModal(false);
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
        institution: institution.trim() || null,
        courseNumber: courseNumber.trim() || null,
        creditHours: creditHours.trim() || null,
        instructor: instructor.trim() || null,
        courseDescription: courseDescription.trim() || null,
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
  }, [user, courseName, institution, courseNumber, creditHours, instructor, courseDescription, syllabusText, fileName, parsedItems, matchedItems, unmatchedItems, editingCourseId, saving]);

  // ── Load course into editor ──
  const loadCourse = useCallback((course) => {
    setEditingCourseId(course.id);
    setCourseName(course.name || '');
    setInstitution(course.institution || '');
    setCourseNumber(course.courseNumber || '');
    setCreditHours(course.creditHours || '');
    setInstructor(course.instructor || '');
    setCourseDescription(course.courseDescription || '');
    setSyllabusText(course.syllabusText || '');
    setFileName(course.syllabusFileName || '');
    setParsedItems(course.parsedItems || []);
    setMatchedItems(course.footprint || []);
    setUnmatchedItems(course.unmatchedItems || []);
    setParseError('');
    setShowUploadModal(false);
  }, []);

  // ── Reset form ──
  const resetForm = useCallback(() => {
    setEditingCourseId(null);
    setCourseName('');
    setInstitution('');
    setCourseNumber('');
    setCreditHours('');
    setInstructor('');
    setCourseDescription('');
    setSyllabusText('');
    setFileName('');
    setParsedItems(null);
    setMatchedItems([]);
    setUnmatchedItems([]);
    setParseError('');
  }, []);

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
  }, [user, editingCourseId, resetForm]);

  // ── Group matched items by category (sorted) ──
  const sortedGroups = useMemo(() => {
    const groups = {};
    for (const m of matchedItems) {
      const cat = m.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    }
    const orderIndex = (cat) => {
      const idx = CATEGORY_ORDER.indexOf(cat);
      return idx >= 0 ? idx : CATEGORY_ORDER.length;
    };
    return Object.entries(groups).sort((a, b) => orderIndex(a[0]) - orderIndex(b[0]));
  }, [matchedItems]);

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
        <h2>Teaching Subscription Required</h2>
        <p>Teacher Mode requires an active Teaching subscription.</p>
        <button className="teacher-back-btn" onClick={() => navigate('/profile#subscriptions')} style={{ marginTop: 16 }}>
          Subscribe on Profile
        </button>
      </div>
    );
  }

  const hasResults = parsedItems !== null;

  return (
    <div className="teacher-page">

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div className="teacher-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="teacher-modal" onClick={e => e.stopPropagation()}>
            <button className="teacher-modal-close" onClick={() => setShowUploadModal(false)}>{'\u2715'}</button>
            <h2 className="teacher-modal-title">
              {editingCourseId ? 'Edit Course' : 'New Course'}
            </h2>

            <div className="teacher-input-row">
              <label>Course Name</label>
              <input
                type="text"
                className="teacher-text-input"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. Story: Mediums & Genres"
                maxLength={120}
              />
            </div>

            <div className="teacher-input-row">
              <label>Institution</label>
              <input
                type="text"
                className="teacher-text-input"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="e.g. Relativity School"
                maxLength={120}
              />
            </div>

            <div className="teacher-modal-row-2col">
              <div className="teacher-input-row">
                <label>Course Number</label>
                <input
                  type="text"
                  className="teacher-text-input"
                  value={courseNumber}
                  onChange={e => setCourseNumber(e.target.value)}
                  placeholder="e.g. GED 101"
                  maxLength={20}
                />
              </div>
              <div className="teacher-input-row">
                <label>Credit Hours</label>
                <input
                  type="text"
                  className="teacher-text-input"
                  value={creditHours}
                  onChange={e => setCreditHours(e.target.value)}
                  placeholder="e.g. 2"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="teacher-input-row">
              <label>Instructor</label>
              <input
                type="text"
                className="teacher-text-input"
                value={instructor}
                onChange={e => setInstructor(e.target.value)}
                placeholder="Instructor name"
                maxLength={100}
              />
            </div>

            <div className="teacher-input-row">
              <label>Course Description</label>
              <textarea
                className="teacher-textarea teacher-textarea-sm"
                value={courseDescription}
                onChange={e => setCourseDescription(e.target.value)}
                placeholder="Brief course description..."
                maxLength={2000}
              />
            </div>

            <div className="teacher-modal-divider">
              <span>Syllabus Text</span>
            </div>

            <div className="teacher-input-row">
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

            <div className="teacher-modal-actions">
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
                <button className="teacher-back-btn" onClick={() => { resetForm(); setShowUploadModal(false); }}>
                  New Course
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Syllabus Document ── */}
      <div className="syllabus-document">

        {/* ── Syllabus Header ── */}
        <div className="syllabus-header">
          <div className={`syllabus-institution${!institution && !hasResults ? ' syllabus-placeholder' : ''}`}>
            {institution || (hasResults ? '' : 'YOUR INSTITUTION')}
          </div>
          <h1 className={`syllabus-title${!courseName && !hasResults ? ' syllabus-placeholder' : ''}`}>
            {courseName || (hasResults ? 'Untitled Course' : 'Course Title')}
          </h1>

          {(courseNumber || creditHours || instructor || hasResults) && (
            <div className="syllabus-meta-row">
              {courseNumber && <span>NUMBER: {courseNumber}</span>}
              {courseNumber && creditHours && <span className="syllabus-meta-sep">{'\u2502'}</span>}
              {creditHours && <span>CREDIT HOURS: {creditHours}</span>}
              {(courseNumber || creditHours) && instructor && <span className="syllabus-meta-sep">{'\u2502'}</span>}
              {instructor && <span>INSTRUCTOR: {instructor}</span>}
            </div>
          )}

          {!hasResults && !institution && !courseName && (
            <p className="syllabus-subtitle">Map your syllabus to Mythouse content</p>
          )}

          <div className="syllabus-header-actions">
            <button className="teacher-upload-btn" onClick={() => setShowUploadModal(true)}>
              {editingCourseId ? 'Edit Syllabus' : 'Upload Syllabus'}
            </button>
            {editingCourseId && (
              <button className="teacher-back-btn" onClick={resetForm}>
                New Course
              </button>
            )}
          </div>
        </div>

        {hasResults ? (
          <>
            {/* ── Course Description ── */}
            {courseDescription && (
              <div className="syllabus-section">
                <h2 className="syllabus-section-heading">Course Description</h2>
                <p className="syllabus-body-text">{courseDescription}</p>
              </div>
            )}

            {/* ── Content Map ── */}
            <div className="syllabus-section">
              <h2 className="syllabus-section-heading">Mythouse Content Map</h2>
              <div className="teacher-match-stats">
                <strong>{matchedItems.length}</strong> matches from{' '}
                <strong>{(parsedItems || []).length}</strong> parsed items
                {unmatchedItems.length > 0 && (
                  <> {'\u2022'} <strong>{unmatchedItems.length}</strong> unmatched</>
                )}
              </div>

              {sortedGroups.map(([cat, items]) => (
                <div key={cat} className="teacher-match-group">
                  <div className="teacher-match-group-title">
                    {CATEGORY_LABELS[cat] || cat.replace(/-/g, ' ')}
                    <span className="teacher-match-group-count">{items.length}</span>
                  </div>
                  {items.map(m => (
                    <div key={m.contentId} className="teacher-match-item">
                      {m.matchedFrom && m.matchedFrom !== 'manual' && (
                        <>
                          <span className="teacher-match-parsed">{m.matchedFrom}</span>
                          <span className="teacher-match-arrow">{'\u2192'}</span>
                        </>
                      )}
                      <div className="teacher-match-content">
                        <div className="teacher-match-name">
                          <a
                            href={m.route}
                            onClick={(e) => { e.preventDefault(); navigate(m.route); }}
                          >
                            {m.name}
                          </a>
                        </div>
                        <div className="teacher-match-category">{CATEGORY_LABELS[m.category] || m.category}</div>
                      </div>
                      <button
                        className="teacher-match-remove"
                        onClick={() => removeMatch(m.contentId)}
                        title="Remove"
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {matchedItems.length === 0 && (
                <div className="teacher-empty">No matches yet. Try parsing your syllabus or adding items manually.</div>
              )}
            </div>

            {/* ── Unmatched Items ── */}
            {unmatchedItems.length > 0 && (
              <div className="syllabus-section">
                <h2 className="syllabus-section-heading">Unmatched Items</h2>
                <div className="teacher-unmatched-list">
                  {unmatchedItems.map((u, i) => (
                    <div key={i} className="teacher-unmatched-item">
                      {u.text} — <em>{u.reason}</em>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Add Content ── */}
            <div className="syllabus-section">
              <h2 className="syllabus-section-heading">Add Content</h2>
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
            <div className="syllabus-actions">
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
        ) : (
          /* ── Empty State ── */
          <div className="syllabus-empty-content">
            <div className="teacher-empty-categories">
              {CATEGORY_ORDER.slice(0, 12).map(cat => (
                <span key={cat} className="teacher-empty-cat-tag">
                  {CATEGORY_LABELS[cat]}
                </span>
              ))}
              <span className="teacher-empty-cat-tag teacher-empty-cat-more">
                +{CATEGORY_ORDER.length - 12} more
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Saved Courses (outside document) ── */}
      {courses.length > 0 && (
        <div className="teacher-courses-section">
          <h2 className="teacher-courses-heading">My Courses</h2>
          {courses.map(c => (
            <div key={c.id} className="teacher-course-card" onClick={() => loadCourse(c)}>
              <div>
                <div className="teacher-course-name">{c.name}</div>
                <div className="teacher-course-meta">
                  {(c.footprint || []).length} items
                  {c.institution ? ` \u2022 ${c.institution}` : ''}
                  {c.createdAt?.seconds ? ` \u2022 ${new Date(c.createdAt.seconds * 1000).toLocaleDateString()}` : ''}
                </div>
              </div>
              <div className="teacher-course-actions">
                <button
                  className="teacher-delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteCourse(c.id); }}
                  title="Delete"
                >
                  {'\u2715'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
