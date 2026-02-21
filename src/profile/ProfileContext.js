import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useCoursework } from '../coursework/CourseworkContext';
import { getEarnedRanks, getHighestRank, getActiveCredentials } from './profileEngine';
import { getQualifiedMentorTypes, isEligibleForMentor, getEffectiveMentorStatus, isMentorCourseComplete } from './mentorEngine';

const ProfileContext = createContext(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const { completedCourses } = useCoursework();
  const [profileData, setProfileData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const profileDataRef = useRef(profileData);
  useEffect(() => { profileDataRef.current = profileData; }, [profileData]);

  // Load profile from Firestore
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setProfileData(null);
      setLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const ref = doc(db, 'users', user.uid, 'meta', 'profile');
        const snap = await getDoc(ref);
        if (!cancelled) {
          setProfileData(snap.exists() ? snap.data() : null);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (!cancelled) setLoaded(true);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [user]);

  // Compute ranks from completedCourses
  const earnedRanks = getEarnedRanks(completedCourses);
  const highestRank = getHighestRank(completedCourses);

  // Compute active credentials from profileData
  const activeCredentials = getActiveCredentials(profileData?.credentials);

  const hasProfile = !!(profileData && profileData.credentials && Object.keys(profileData.credentials).length > 0);

  // Mentor derived values
  const mentorData = profileData?.mentor || null;
  const qualifiedMentorTypes = getQualifiedMentorTypes(profileData?.credentials);
  const mentorEligible = isEligibleForMentor(profileData?.credentials);
  const mentorCoursesComplete = isMentorCourseComplete(completedCourses);
  const effectiveMentorStatus = getEffectiveMentorStatus(mentorData, completedCourses);

  // Update credentials (partial — merges into existing)
  const updateCredentials = useCallback(async (updates) => {
    if (!user || !firebaseConfigured || !db) return;

    // Build the merged credentials object for both local state and Firestore
    const now = Date.now();
    const mergedCredentials = { ...(profileDataRef.current?.credentials || {}) };
    for (const [category, data] of Object.entries(updates)) {
      mergedCredentials[category] = {
        ...(mergedCredentials[category] || {}),
        ...data,
        updatedAt: now,
      };
    }

    // Update local state immediately
    setProfileData(prev => ({ ...prev, credentials: mergedCredentials }));

    // Persist to Firestore — use nested object (setDoc+merge doesn't interpret dot-notation keys)
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { credentials: mergedCredentials, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update credentials:', err);
    }
  }, [user]);

  // Update natal chart
  const updateNatalChart = useCallback(async (chartData) => {
    if (!user || !firebaseConfigured || !db) return;

    setProfileData(prev => ({ ...prev, natalChart: chartData }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { natalChart: chartData, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update natal chart:', err);
    }
  }, [user]);

  // Mark onboarding complete
  const completeOnboarding = useCallback(async () => {
    if (!user || !firebaseConfigured || !db) return;

    setProfileData(prev => ({ ...prev, onboardingComplete: true }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { onboardingComplete: true, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
  }, [user]);

  // Subscriptions
  const subscriptions = profileData?.subscriptions || {};

  const hasSubscription = useCallback((id) => {
    return !!(profileDataRef.current?.subscriptions || {})[id];
  }, []);

  const updateSubscription = useCallback(async (id, enabled) => {
    if (!user || !firebaseConfigured || !db) return;

    const merged = { ...(profileDataRef.current?.subscriptions || {}), [id]: enabled };

    // Update local state immediately
    setProfileData(prev => ({ ...prev, subscriptions: merged }));

    // Persist to Firestore
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { subscriptions: merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update subscription:', err);
    }
  }, [user]);

  // Purchases
  const purchases = profileData?.purchases || {};

  const hasPurchase = useCallback((id) => {
    return !!(profileDataRef.current?.purchases || {})[id];
  }, []);

  const updatePurchase = useCallback(async (id, enabled) => {
    if (!user || !firebaseConfigured || !db) return;

    const merged = { ...(profileDataRef.current?.purchases || {}), [id]: enabled };

    setProfileData(prev => ({ ...prev, purchases: merged }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { purchases: merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update purchase:', err);
    }
  }, [user]);

  // Submit mentor application
  const submitMentorApplication = useCallback(async ({ type, summary, documentUrl, documentName }) => {
    if (!user || !firebaseConfigured || !db) return;

    const mentorUpdate = {
      type,
      status: 'applied',
      appliedAt: Date.now(),
      applicationSummary: summary,
      documentUrl: documentUrl || null,
      documentName: documentName || null,
    };

    setProfileData(prev => ({ ...prev, mentor: { ...(prev?.mentor || {}), ...mentorUpdate } }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { mentor: mentorUpdate, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to submit mentor application:', err);
    }
  }, [user]);

  // Update mentor status (partial update to mentor field)
  const updateMentorStatus = useCallback(async (statusUpdate) => {
    if (!user || !firebaseConfigured || !db) return;

    setProfileData(prev => ({
      ...prev,
      mentor: { ...(prev?.mentor || {}), ...statusUpdate },
    }));

    try {
      const currentMentor = profileDataRef.current?.mentor || {};
      const merged = { ...currentMentor, ...statusUpdate };
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { mentor: merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update mentor status:', err);
    }
  }, [user]);

  // Handle from profile data
  const handle = profileData?.handle || null;

  // Refresh profile data (e.g. after handle registration)
  const refreshProfile = useCallback(async () => {
    if (!user || !firebaseConfigured || !db) return;
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      const snap = await getDoc(ref);
      setProfileData(snap.exists() ? snap.data() : null);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, [user]);

  const natalChart = profileData?.natalChart || null;

  const value = {
    profileData,
    earnedRanks,
    highestRank,
    activeCredentials,
    hasProfile,
    loaded,
    handle,
    natalChart,
    subscriptions,
    hasSubscription,
    updateSubscription,
    purchases,
    hasPurchase,
    updatePurchase,
    updateCredentials,
    updateNatalChart,
    completeOnboarding,
    refreshProfile,
    mentorData,
    qualifiedMentorTypes,
    mentorEligible,
    mentorCoursesComplete,
    effectiveMentorStatus,
    submitMentorApplication,
    updateMentorStatus,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
