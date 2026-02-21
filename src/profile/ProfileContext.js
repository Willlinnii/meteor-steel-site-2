import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc, deleteField, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfigured } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useCoursework } from '../coursework/CourseworkContext';
import { getEarnedRanks, getHighestRank, getActiveCredentials } from './profileEngine';
import { getQualifiedMentorTypes, isEligibleForMentor, getEffectiveMentorStatus, isMentorCourseComplete } from './mentorEngine';
import { categorizePairings } from './mentorPairingEngine';
import { categorizeConsultingRequests } from './consultingEngine';

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

  // BYOK API keys (separate secrets doc with owner-only access)
  const [apiKeys, setApiKeys] = useState({});
  const [apiKeysLoaded, setApiKeysLoaded] = useState(false);
  const apiKeysRef = useRef(apiKeys);
  useEffect(() => { apiKeysRef.current = apiKeys; }, [apiKeys]);

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

  // One-time migration: starlight → starlight-bundle + both individual purchases
  useEffect(() => {
    if (!loaded || !user || !firebaseConfigured || !db) return;
    const purchases = profileData?.purchases;
    if (purchases && purchases.starlight && !purchases['starlight-bundle']) {
      const migrated = { ...purchases, 'starlight-bundle': true, 'fallen-starlight': true, 'story-of-stories': true };
      delete migrated.starlight;
      setProfileData(prev => ({ ...prev, purchases: migrated }));
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      setDoc(ref, { purchases: migrated, updatedAt: serverTimestamp() }, { merge: true })
        .catch(err => console.error('Failed to migrate starlight purchase:', err));
    }
  }, [loaded, user, profileData?.purchases]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load BYOK keys from secrets doc (separate from profile — owner-only read)
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setApiKeys({});
      setApiKeysLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadSecrets() {
      try {
        const ref = doc(db, 'users', user.uid, 'meta', 'secrets');
        const snap = await getDoc(ref);
        if (!cancelled) {
          setApiKeys(snap.exists() ? snap.data() : {});
          setApiKeysLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load API keys:', err);
        if (!cancelled) setApiKeysLoaded(true);
      }
    }

    loadSecrets();
    return () => { cancelled = true; };
  }, [user]);

  // Compute ranks from completedCourses
  const earnedRanks = getEarnedRanks(completedCourses);
  const highestRank = getHighestRank(completedCourses);

  // Mentor derived values (computed before credentials so guildMember can be injected)
  const mentorData = profileData?.mentor || null;
  const qualifiedMentorTypes = getQualifiedMentorTypes(profileData?.credentials);
  const mentorEligible = isEligibleForMentor(profileData?.credentials);
  const mentorCoursesComplete = isMentorCourseComplete(completedCourses);
  const effectiveMentorStatus = getEffectiveMentorStatus(mentorData, completedCourses);

  // Compute active credentials from profileData, injecting guildMember if active mentor
  const credentialsWithGuild = useMemo(() => {
    const base = profileData?.credentials || {};
    if (effectiveMentorStatus === 'active') {
      return { ...base, guildMember: { level: 1 } };
    }
    return base;
  }, [profileData?.credentials, effectiveMentorStatus]);
  const activeCredentials = getActiveCredentials(credentialsWithGuild);

  const hasProfile = !!(profileData && profileData.credentials && Object.keys(profileData.credentials).length > 0);

  // Photo URL derived from profile
  const photoURL = profileData?.photoURL || null;

  // Consulting data derived from profile
  const consultingData = profileData?.consulting || null;

  // --- Consulting request subscriptions ---
  const [consultingRequests, setConsultingRequests] = useState([]);

  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setConsultingRequests([]);
      return;
    }

    const reqRef = collection(db, 'consulting-requests');

    // Listener 1: requests where user is the consultant
    const qConsultant = query(
      reqRef,
      where('consultantUid', '==', user.uid),
      where('status', '==', 'pending'),
    );

    // Listener 2: requests where user is the requester
    const qRequester = query(
      reqRef,
      where('requesterUid', '==', user.uid),
      where('status', 'in', ['pending', 'accepted']),
    );

    let consultantResults = [];
    let requesterResults = [];

    const merge = () => {
      const map = new Map();
      [...consultantResults, ...requesterResults].forEach(r => map.set(r.id, r));
      setConsultingRequests(Array.from(map.values()));
    };

    const unsub1 = onSnapshot(qConsultant, (snap) => {
      consultantResults = [];
      snap.forEach(d => consultantResults.push({ id: d.id, ...d.data() }));
      merge();
    }, (err) => console.error('Consulting requests (consultant) listener error:', err));

    const unsub2 = onSnapshot(qRequester, (snap) => {
      requesterResults = [];
      snap.forEach(d => requesterResults.push({ id: d.id, ...d.data() }));
      merge();
    }, (err) => console.error('Consulting requests (requester) listener error:', err));

    return () => { unsub1(); unsub2(); };
  }, [user]);

  // --- Mentor pairing subscriptions ---
  const [mentorPairings, setMentorPairings] = useState([]);

  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setMentorPairings([]);
      return;
    }

    const pairingsRef = collection(db, 'mentor-pairings');

    // Listener 1: pairings where user is the mentor
    const qMentor = query(
      pairingsRef,
      where('mentorUid', '==', user.uid),
      where('status', 'in', ['pending', 'accepted']),
    );

    // Listener 2: pairings where user is the student
    const qStudent = query(
      pairingsRef,
      where('studentUid', '==', user.uid),
      where('status', 'in', ['pending', 'accepted']),
    );

    let mentorResults = [];
    let studentResults = [];

    const merge = () => {
      // Deduplicate by id (in case user is both mentor and student in same pairing — shouldn't happen but safe)
      const map = new Map();
      [...mentorResults, ...studentResults].forEach(p => map.set(p.id, p));
      setMentorPairings(Array.from(map.values()));
    };

    const unsub1 = onSnapshot(qMentor, (snap) => {
      mentorResults = [];
      snap.forEach(d => mentorResults.push({ id: d.id, ...d.data() }));
      merge();
    }, (err) => console.error('Mentor pairings listener error:', err));

    const unsub2 = onSnapshot(qStudent, (snap) => {
      studentResults = [];
      snap.forEach(d => studentResults.push({ id: d.id, ...d.data() }));
      merge();
    }, (err) => console.error('Student pairings listener error:', err));

    return () => { unsub1(); unsub2(); };
  }, [user]);

  // Categorize pairings into role-based groups
  const pairingCategories = useMemo(
    () => categorizePairings(mentorPairings, user?.uid),
    [mentorPairings, user?.uid]
  );

  // Categorize consulting requests into role-based groups
  const consultingCategories = useMemo(
    () => categorizeConsultingRequests(consultingRequests, user?.uid),
    [consultingRequests, user?.uid]
  );

  // --- Mentor pairing API methods ---

  const updateMentorBio = useCallback(async (bio) => {
    if (!user) return;
    const prevBio = profileDataRef.current?.mentor?.bio || '';
    setProfileData(prev => ({
      ...prev,
      mentor: { ...(prev?.mentor || {}), bio },
    }));
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-bio', bio }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to update bio');
      }
    } catch (err) {
      console.error('Failed to update mentor bio:', err);
      setProfileData(prev => ({
        ...prev,
        mentor: { ...(prev?.mentor || {}), bio: prevBio },
      }));
      throw err;
    }
  }, [user]);

  const updateMentorCapacity = useCallback(async (capacity) => {
    if (!user) return;
    const prevCap = profileDataRef.current?.mentor?.capacity;
    setProfileData(prev => ({
      ...prev,
      mentor: { ...(prev?.mentor || {}), capacity },
    }));
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update-capacity', capacity }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to update capacity');
      }
    } catch (err) {
      console.error('Failed to update mentor capacity:', err);
      setProfileData(prev => ({
        ...prev,
        mentor: { ...(prev?.mentor || {}), capacity: prevCap },
      }));
      throw err;
    }
  }, [user]);

  const publishToDirectory = useCallback(async () => {
    if (!user) return;
    setProfileData(prev => ({
      ...prev,
      mentor: { ...(prev?.mentor || {}), directoryListed: true },
    }));
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'publish' }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to publish');
      }
    } catch (err) {
      console.error('Failed to publish to directory:', err);
      setProfileData(prev => ({
        ...prev,
        mentor: { ...(prev?.mentor || {}), directoryListed: false },
      }));
      throw err;
    }
  }, [user]);

  const unpublishFromDirectory = useCallback(async () => {
    if (!user) return;
    setProfileData(prev => ({
      ...prev,
      mentor: { ...(prev?.mentor || {}), directoryListed: false },
    }));
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'unpublish' }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to unpublish');
      }
    } catch (err) {
      console.error('Failed to unpublish from directory:', err);
      setProfileData(prev => ({
        ...prev,
        mentor: { ...(prev?.mentor || {}), directoryListed: true },
      }));
      throw err;
    }
  }, [user]);

  const requestMentor = useCallback(async (mentorUid, message) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'pairing-request', mentorUid, message: message || null }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to request mentor');
      }
      return await resp.json();
    } catch (err) {
      console.error('Failed to request mentor:', err);
      throw err;
    }
  }, [user]);

  const respondToPairing = useCallback(async (pairingId, accept, declineReason) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: accept ? 'pairing-accept' : 'pairing-decline',
          pairingId,
          declineReason: declineReason || null,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to respond to pairing');
      }
    } catch (err) {
      console.error('Failed to respond to pairing:', err);
      throw err;
    }
  }, [user]);

  const endPairing = useCallback(async (pairingId) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'pairing-end', pairingId }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to end pairing');
      }
    } catch (err) {
      console.error('Failed to end pairing:', err);
      throw err;
    }
  }, [user]);

  // Update profile photo URL
  const updateProfilePhoto = useCallback(async (url) => {
    if (!user || !firebaseConfigured || !db) return;
    setProfileData(prev => ({ ...prev, photoURL: url }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update profile photo:', err);
    }
  }, [user]);

  // Save a BYOK API key (field = 'anthropicKey' | 'openaiKey')
  const saveApiKey = useCallback(async (field, value) => {
    if (!user || !firebaseConfigured || !db) return;
    const prev = apiKeysRef.current;
    setApiKeys(k => ({ ...k, [field]: value, updatedAt: new Date() }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'secrets');
      await setDoc(ref, { [field]: value, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save API key:', err);
      setApiKeys(prev);
    }
  }, [user]);

  // Remove a BYOK API key
  const removeApiKey = useCallback(async (field) => {
    if (!user || !firebaseConfigured || !db) return;
    const prev = apiKeysRef.current;
    setApiKeys(k => { const next = { ...k }; delete next[field]; return next; });
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'secrets');
      await setDoc(ref, { [field]: deleteField(), updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to remove API key:', err);
      setApiKeys(prev);
    }
  }, [user]);

  // Submit consulting profile from Atlas interview
  const submitConsultingProfile = useCallback(async (data) => {
    if (!user || !firebaseConfigured || !db) return;
    setProfileData(prev => ({ ...prev, consulting: data }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { consulting: data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to submit consulting profile:', err);
    }
  }, [user]);

  // Request consulting from a mentor
  const requestConsulting = useCallback(async (consultantUid, consultingType, message) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'consulting-request', consultantUid, consultingType: consultingType || null, message: message || null }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to request consulting');
      }
      return await resp.json();
    } catch (err) {
      console.error('Failed to request consulting:', err);
      throw err;
    }
  }, [user]);

  // Respond to consulting request (accept or decline)
  const respondToConsulting = useCallback(async (requestId, accept) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/mentor-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: accept ? 'consulting-accept' : 'consulting-decline', requestId }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to respond to consulting request');
      }
    } catch (err) {
      console.error('Failed to respond to consulting request:', err);
      throw err;
    }
  }, [user]);

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

  // Update numerology name
  const updateNumerologyName = useCallback(async (name) => {
    if (!user || !firebaseConfigured || !db) return;

    setProfileData(prev => ({ ...prev, numerologyName: name }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { numerologyName: name, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update numerology name:', err);
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

  // Batch update multiple purchases at once (avoids race conditions)
  const updatePurchases = useCallback(async (updates) => {
    if (!user || !firebaseConfigured || !db) return;

    const merged = { ...(profileDataRef.current?.purchases || {}), ...updates };

    setProfileData(prev => ({ ...prev, purchases: merged }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { purchases: merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update purchases:', err);
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

    // Clean replace — don't carry over old rejection data
    setProfileData(prev => ({ ...prev, mentor: mentorUpdate }));

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

  // BYOK derived values
  const hasAnthropicKey = !!apiKeys.anthropicKey;
  const hasOpenaiKey = !!apiKeys.openaiKey;

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
  const numerologyName = profileData?.numerologyName || null;

  const value = {
    profileData,
    earnedRanks,
    highestRank,
    activeCredentials,
    hasProfile,
    loaded,
    handle,
    natalChart,
    numerologyName,
    subscriptions,
    hasSubscription,
    updateSubscription,
    purchases,
    hasPurchase,
    updatePurchase,
    updatePurchases,
    updateCredentials,
    updateNatalChart,
    numerologyName,
    updateNumerologyName,
    completeOnboarding,
    refreshProfile,
    mentorData,
    qualifiedMentorTypes,
    mentorEligible,
    mentorCoursesComplete,
    effectiveMentorStatus,
    submitMentorApplication,
    updateMentorStatus,
    mentorPairings,
    pairingCategories,
    updateMentorBio,
    updateMentorCapacity,
    publishToDirectory,
    unpublishFromDirectory,
    requestMentor,
    respondToPairing,
    endPairing,
    photoURL,
    consultingData,
    consultingRequests,
    consultingCategories,
    updateProfilePhoto,
    submitConsultingProfile,
    requestConsulting,
    respondToConsulting,
    apiKeys,
    apiKeysLoaded,
    saveApiKey,
    removeApiKey,
    hasAnthropicKey,
    hasOpenaiKey,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
