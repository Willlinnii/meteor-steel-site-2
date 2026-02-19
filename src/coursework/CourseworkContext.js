import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import {
  COURSES, getActiveCourses, checkCourseCompletion, courseProgress,
  getIncompleteRequirements, getAllTrackedElements,
} from './courseEngine';

const CourseworkContext = createContext(null);

const FLUSH_INTERVAL = 30000; // 30 seconds
const PROGRESS_SECTIONS = [
  'home', 'monomyth', 'metals', 'games', 'fallen-starlight',
  'story-forge', 'atlas', 'mythology-channel', 'library', 'journeys',
];

export function useCoursework() {
  const ctx = useContext(CourseworkContext);
  if (!ctx) throw new Error('useCoursework must be used within CourseworkProvider');
  return ctx;
}

export function CourseworkProvider({ children }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState({}); // { sectionId: { elements: { ... } } }
  const [courseworkMode, setCourseworkMode] = useState(false);
  const [completedCourses, setCompletedCourses] = useState(new Set());
  const [newlyCompleted, setNewlyCompleted] = useState(null); // course that just completed (for popup)
  const [loaded, setLoaded] = useState(false);

  const dirtyRef = useRef(new Set()); // sections with unflushed changes
  const progressRef = useRef(progress);
  const flushTimerRef = useRef(null);
  const userRef = useRef(user);

  // Keep refs in sync
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Load progress from Firestore on login
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setProgress({});
      setCompletedCourses(new Set());
      setLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadProgress() {
      const loaded = {};
      try {
        for (const section of PROGRESS_SECTIONS) {
          const ref = doc(db, 'users', user.uid, 'progress', section);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            loaded[section] = snap.data();
          }
        }

        // Load completed courses
        const certRef = doc(db, 'users', user.uid, 'meta', 'certificates');
        const certSnap = await getDoc(certRef);
        const certs = certSnap.exists() ? new Set(Object.keys(certSnap.data().completed || {})) : new Set();

        if (!cancelled) {
          setProgress(loaded);
          setCompletedCourses(certs);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load coursework progress:', err);
        if (!cancelled) setLoaded(true);
      }
    }

    loadProgress();
    return () => { cancelled = true; };
  }, [user]);

  // Flush dirty sections to Firestore
  const flush = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !firebaseConfigured || !db) return;
    const dirty = new Set(dirtyRef.current);
    if (dirty.size === 0) return;
    dirtyRef.current = new Set();

    const currentProgress = progressRef.current;

    for (const section of dirty) {
      const data = currentProgress[section];
      if (!data) continue;
      try {
        const ref = doc(db, 'users', currentUser.uid, 'progress', section);
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error(`Failed to flush section ${section}:`, err);
        // Put it back as dirty for next flush
        dirtyRef.current.add(section);
      }
    }
  }, []);

  // Periodic flush timer
  useEffect(() => {
    if (!user || !firebaseConfigured) return;
    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      // Flush on unmount
      flush();
    };
  }, [user, flush]);

  // Flush on page navigation / visibility change
  useEffect(() => {
    const handleVisChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const handleBeforeUnload = () => flush();
    document.addEventListener('visibilitychange', handleVisChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flush]);

  // Track an element interaction
  const trackElement = useCallback((elementId, extra = {}) => {
    if (!userRef.current) return;

    const section = elementId.split('.')[0];

    setProgress(prev => {
      const sectionData = prev[section] || { elements: {} };
      const existing = sectionData.elements[elementId];
      const now = Date.now();

      const updated = {
        ...existing,
        firstSeen: existing?.firstSeen || now,
        lastSeen: now,
        count: (existing?.count || 0) + (extra.increment !== false ? 1 : 0),
      };

      // Accumulate time if provided
      if (extra.timeSpent) {
        updated.timeSpent = (existing?.timeSpent || 0) + extra.timeSpent;
      }

      // Merge any additional metadata
      if (extra.meta) {
        updated.meta = { ...(existing?.meta || {}), ...extra.meta };
      }

      const newSection = {
        ...sectionData,
        elements: { ...sectionData.elements, [elementId]: updated },
      };

      return { ...prev, [section]: newSection };
    });

    dirtyRef.current.add(section);
  }, []);

  // Track time spent on a section (called periodically by components)
  const trackTime = useCallback((elementId, seconds) => {
    trackElement(elementId, { timeSpent: seconds, increment: false });
  }, [trackElement]);

  // Check for newly completed courses after progress changes
  useEffect(() => {
    if (!loaded) return;
    const activeCourses = getActiveCourses();

    for (const course of activeCourses) {
      if (completedCourses.has(course.id)) continue;
      if (checkCourseCompletion(course, progress)) {
        // Course just completed!
        setCompletedCourses(prev => new Set([...prev, course.id]));
        setNewlyCompleted(course);

        // Persist certificate
        if (user && firebaseConfigured && db) {
          const certRef = doc(db, 'users', user.uid, 'meta', 'certificates');
          setDoc(certRef, {
            completed: { [course.id]: { completedAt: Date.now(), courseName: course.name } },
          }, { merge: true }).catch(err => console.error('Failed to save certificate:', err));
        }
      }
    }
  }, [progress, loaded, completedCourses, user]);

  // Dismiss completion popup
  const dismissCompletion = useCallback(() => {
    setNewlyCompleted(null);
  }, []);

  // Toggle coursework visual mode
  const toggleCourseworkMode = useCallback(() => {
    setCourseworkMode(prev => !prev);
  }, []);

  // Check if an element is completed (for visual indicators)
  const isElementCompleted = useCallback((elementId) => {
    const section = elementId.split('.')[0];
    const sectionData = progress[section];
    if (!sectionData || !sectionData.elements) return false;
    return !!sectionData.elements[elementId];
  }, [progress]);

  // Get all course progress info for profile page
  const getCourseStates = useCallback(() => {
    const activeCourses = getActiveCourses();
    return activeCourses.map(course => ({
      ...course,
      completed: completedCourses.has(course.id),
      progress: courseProgress(course, progress),
      incompleteRequirements: getIncompleteRequirements(course, progress),
    }));
  }, [progress, completedCourses]);

  // Get all tracked element IDs
  const getTrackedElements = useCallback(() => {
    return getAllTrackedElements(progress);
  }, [progress]);

  // Build summary string for Atlas (optional currentPage for context)
  const buildCourseSummary = useCallback((currentPage) => {
    const states = getCourseStates();
    if (states.length === 0) return '';
    let summary = states.map(c => {
      if (c.completed) return `${c.name}: COMPLETED`;
      const pct = Math.round(c.progress * 100);
      const remaining = c.incompleteRequirements
        .map(r => `  - ${r.description} (${Math.round(r.progress * 100)}% done)`)
        .join('\n');
      return `${c.name} (${pct}% complete):\n${remaining}`;
    }).join('\n\n');
    if (currentPage) {
      summary += `\n\nCurrently viewing: ${currentPage}`;
    }
    return summary;
  }, [getCourseStates]);

  const value = {
    progress,
    courseworkMode,
    toggleCourseworkMode,
    trackElement,
    trackTime,
    isElementCompleted,
    getCourseStates,
    getTrackedElements,
    completedCourses,
    newlyCompleted,
    dismissCompletion,
    buildCourseSummary,
    loaded,
    allCourses: COURSES,
  };

  return (
    <CourseworkContext.Provider value={value}>
      {children}
    </CourseworkContext.Provider>
  );
}
