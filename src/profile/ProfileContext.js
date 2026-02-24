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

  // Pilgrimages (saved sacred sites from Mythic Earth)
  const [pilgrimages, setPilgrimages] = useState({});
  const [pilgrimagesLoaded, setPilgrimagesLoaded] = useState(false);
  const pilgrimagesRef = useRef(pilgrimages);
  useEffect(() => { pilgrimagesRef.current = pilgrimages; }, [pilgrimages]);

  // User sites (custom pins on Mythic Earth globe)
  const [userSites, setUserSites] = useState({});
  const [userSitesLoaded, setUserSitesLoaded] = useState(false);
  const userSitesRef = useRef(userSites);
  useEffect(() => { userSitesRef.current = userSites; }, [userSites]);

  // Saved curated site IDs (bookmarked to "My Sites")
  const [savedSiteIds, setSavedSiteIds] = useState({});

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

  // Load pilgrimages from Firestore
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setPilgrimages({});
      setPilgrimagesLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadPilgrimages() {
      try {
        const ref = doc(db, 'users', user.uid, 'meta', 'pilgrimages');
        const snap = await getDoc(ref);
        if (!cancelled) {
          setPilgrimages(snap.exists() ? (snap.data().sites || {}) : {});
          setPilgrimagesLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load pilgrimages:', err);
        if (!cancelled) setPilgrimagesLoaded(true);
      }
    }

    loadPilgrimages();
    return () => { cancelled = true; };
  }, [user]);

  // Load user sites from Firestore
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      setUserSites({});
      setUserSitesLoaded(false);
      return;
    }

    let cancelled = false;

    async function loadUserSites() {
      try {
        const ref = doc(db, 'users', user.uid, 'meta', 'userSites');
        const snap = await getDoc(ref);
        if (!cancelled) {
          const data = snap.exists() ? snap.data() : {};
          setUserSites(data.sites || {});
          setSavedSiteIds(data.savedSiteIds || {});
          setUserSitesLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load user sites:', err);
        if (!cancelled) setUserSitesLoaded(true);
      }
    }

    loadUserSites();
    return () => { cancelled = true; };
  }, [user]);

  // Compute ranks from completedCourses
  const earnedRanks = useMemo(() => getEarnedRanks(completedCourses), [completedCourses]);
  const highestRank = useMemo(() => getHighestRank(completedCourses), [completedCourses]);

  // Mentor derived values (computed before credentials so guildMember can be injected)
  const mentorData = profileData?.mentor || null;
  const qualifiedMentorTypes = useMemo(() => getQualifiedMentorTypes(profileData?.credentials), [profileData?.credentials]);
  const mentorEligible = useMemo(() => isEligibleForMentor(profileData?.credentials), [profileData?.credentials]);
  const mentorCoursesComplete = useMemo(() => isMentorCourseComplete(completedCourses), [completedCourses]);
  const effectiveMentorStatus = useMemo(() => getEffectiveMentorStatus(mentorData, completedCourses), [mentorData, completedCourses]);

  // Compute active credentials from profileData, injecting guildMember if active mentor
  const credentialsWithGuild = useMemo(() => {
    const base = profileData?.credentials || {};
    if (effectiveMentorStatus === 'active') {
      return { ...base, guildMember: { level: 1 } };
    }
    return base;
  }, [profileData?.credentials, effectiveMentorStatus]);
  const activeCredentials = useMemo(() => getActiveCredentials(credentialsWithGuild), [credentialsWithGuild]);

  const hasProfile = !!(profileData && profileData.credentials && Object.keys(profileData.credentials).length > 0);

  // Photo URL derived from profile
  const photoURL = profileData?.photoURL || null;

  // Consulting data derived from profile
  const consultingData = profileData?.consulting || null;

  // Curator approval derived from profile
  const curatorApproved = profileData?.curatorApproved === true;

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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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
      const resp = await fetch('/api/mentor', {
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

  // Update curator approval status
  const updateCuratorStatus = useCallback(async (approved) => {
    if (!user || !firebaseConfigured || !db) return;
    setProfileData(prev => ({ ...prev, curatorApproved: approved }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { curatorApproved: approved, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update curator status:', err);
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

  // Update lucky number
  const updateLuckyNumber = useCallback(async (num) => {
    if (!user || !firebaseConfigured || !db) return;

    setProfileData(prev => ({ ...prev, luckyNumber: num }));

    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { luckyNumber: num, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update lucky number:', err);
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

  // Subscriptions (read-only — flags written by Stripe webhook only)
  const subscriptions = useMemo(() => profileData?.subscriptions || {}, [profileData?.subscriptions]);

  const hasSubscription = useCallback((id) => {
    return !!(profileDataRef.current?.subscriptions || {})[id];
  }, []);

  // Purchases (read-only — flags written by Stripe webhook only)
  const purchases = useMemo(() => profileData?.purchases || {}, [profileData?.purchases]);

  const hasPurchase = useCallback((id) => {
    return !!(profileDataRef.current?.purchases || {})[id];
  }, []);

  // Refresh profile data (e.g. after handle registration, free purchase activation)
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

  // Stripe integration
  const hasStripeAccount = !!profileData?.stripeCustomerId;

  const initiateCheckout = useCallback(async (itemId, options = {}) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const body = { itemId };
      if (options.donationAmount) body.donationAmount = options.donationAmount;
      if (options.launchKey) body.launchKey = options.launchKey;
      const resp = await fetch('/api/stripe?route=checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to create checkout session');
      }
      const data = await resp.json();
      if (data.activated) {
        // Free item — activated server-side, refresh profile
        await refreshProfile();
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      throw err;
    }
  }, [user, refreshProfile]);

  const openBillingPortal = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/stripe?route=portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to open billing portal');
      }
      const { url } = await resp.json();
      window.location.href = url;
    } catch (err) {
      console.error('Billing portal error:', err);
      throw err;
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

  // Accept mentor contract (legal agreement gate before activation)
  const acceptMentorContract = useCallback(async () => {
    if (!user || !firebaseConfigured || !db) return;

    const contractUpdate = { mentorContractAccepted: true, mentorContractAcceptedAt: Date.now() };

    setProfileData(prev => ({
      ...prev,
      mentor: { ...(prev?.mentor || {}), ...contractUpdate },
    }));

    try {
      const currentMentor = profileDataRef.current?.mentor || {};
      const merged = { ...currentMentor, ...contractUpdate };
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { mentor: merged, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to accept mentor contract:', err);
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

  // Mythouse API key (from secrets doc)
  const mythouseApiKey = apiKeys.mythouseApiKey || null;
  const hasMythouseKey = !!mythouseApiKey;

  const generateMythouseKey = useCallback(async () => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/user-actions?route=apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'generate' }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to generate key');
      }
      const data = await resp.json();
      setApiKeys(k => ({ ...k, mythouseApiKey: data.key }));
      return data.key;
    } catch (err) {
      console.error('Failed to generate Mythouse API key:', err);
      throw err;
    }
  }, [user]);

  const regenerateMythouseKey = useCallback(async () => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/user-actions?route=apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'regenerate' }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to regenerate key');
      }
      const data = await resp.json();
      setApiKeys(k => ({ ...k, mythouseApiKey: data.key }));
      return data.key;
    } catch (err) {
      console.error('Failed to regenerate Mythouse API key:', err);
      throw err;
    }
  }, [user]);

  // BYOK derived values
  const hasAnthropicKey = !!apiKeys.anthropicKey;
  const hasOpenaiKey = !!apiKeys.openaiKey;

  // Social links
  const social = useMemo(() => profileData?.social || {}, [profileData?.social]);

  const updateSocial = useCallback(async (socialData) => {
    if (!user || !firebaseConfigured || !db) return;
    setProfileData(prev => ({ ...prev, social: socialData }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { social: socialData, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update social links:', err);
    }
  }, [user]);

  // Save personal story (raw + transmuted)
  const savePersonalStory = useCallback(async (raw, transmuted) => {
    if (!user || !firebaseConfigured || !db) return;
    const storyData = { raw, transmuted, updatedAt: Date.now() };
    setProfileData(prev => ({ ...prev, personalStory: storyData }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'profile');
      await setDoc(ref, { personalStory: storyData, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save personal story:', err);
    }
  }, [user]);

  // Add a sacred site to pilgrimages
  const addPilgrimage = useCallback(async (site) => {
    if (!user || !firebaseConfigured || !db) return;
    const entry = {
      siteId: site.id,
      name: site.name,
      category: site.category,
      region: site.region,
      lat: site.lat,
      lng: site.lng,
      tradition: site.tradition || null,
      addedAt: Date.now(),
    };
    setPilgrimages(prev => ({ ...prev, [site.id]: entry }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'pilgrimages');
      await setDoc(ref, { sites: { [site.id]: entry }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to add pilgrimage:', err);
      setPilgrimages(prev => { const next = { ...prev }; delete next[site.id]; return next; });
    }
  }, [user]);

  // Remove a sacred site from pilgrimages
  const removePilgrimage = useCallback(async (siteId) => {
    if (!user || !firebaseConfigured || !db) return;
    const prev = pilgrimagesRef.current[siteId];
    setPilgrimages(p => { const next = { ...p }; delete next[siteId]; return next; });
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'pilgrimages');
      await setDoc(ref, { sites: { [siteId]: deleteField() }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to remove pilgrimage:', err);
      if (prev) setPilgrimages(p => ({ ...p, [siteId]: prev }));
    }
  }, [user]);

  // Add a custom user site to Mythic Earth
  const addUserSite = useCallback(async (siteData) => {
    if (!user || !firebaseConfigured || !db) return;
    const id = `user-${user.uid.slice(0, 6)}-${Date.now()}`;
    const entry = {
      id,
      name: siteData.name,
      lat: siteData.lat,
      lng: siteData.lng,
      category: siteData.category,
      description: siteData.description || '',
      region: siteData.region || '',
      isUserSite: true,
      createdAt: Date.now(),
    };
    setUserSites(prev => ({ ...prev, [id]: entry }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'userSites');
      await setDoc(ref, { sites: { [id]: entry }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to add user site:', err);
      setUserSites(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  }, [user]);

  // Remove a custom user site
  const removeUserSite = useCallback(async (siteId) => {
    if (!user || !firebaseConfigured || !db) return;
    const prev = userSitesRef.current[siteId];
    setUserSites(p => { const next = { ...p }; delete next[siteId]; return next; });
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'userSites');
      await setDoc(ref, { sites: { [siteId]: deleteField() }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to remove user site:', err);
      if (prev) setUserSites(p => ({ ...p, [siteId]: prev }));
    }
  }, [user]);

  // Save a curated site to "My Sites" (bookmark by ID)
  const saveSite = useCallback(async (siteId) => {
    if (!user || !firebaseConfigured || !db) return;
    setSavedSiteIds(prev => ({ ...prev, [siteId]: true }));
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'userSites');
      await setDoc(ref, { savedSiteIds: { [siteId]: true }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save site:', err);
      setSavedSiteIds(prev => { const next = { ...prev }; delete next[siteId]; return next; });
    }
  }, [user]);

  // Remove a curated site from "My Sites"
  const unsaveSite = useCallback(async (siteId) => {
    if (!user || !firebaseConfigured || !db) return;
    setSavedSiteIds(prev => { const next = { ...prev }; delete next[siteId]; return next; });
    try {
      const ref = doc(db, 'users', user.uid, 'meta', 'userSites');
      await setDoc(ref, { savedSiteIds: { [siteId]: deleteField() }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to unsave site:', err);
      setSavedSiteIds(prev => ({ ...prev, [siteId]: true }));
    }
  }, [user]);

  // Handle from profile data
  const handle = profileData?.handle || null;

  const natalChart = profileData?.natalChart || null;
  const numerologyName = profileData?.numerologyName || null;
  const luckyNumber = profileData?.luckyNumber ?? null;
  const personalStory = profileData?.personalStory || null;

  const value = useMemo(() => ({
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
    purchases,
    hasPurchase,
    hasStripeAccount,
    initiateCheckout,
    openBillingPortal,
    updateCredentials,
    updateNatalChart,
    updateNumerologyName,
    luckyNumber,
    updateLuckyNumber,
    completeOnboarding,
    refreshProfile,
    mentorData,
    qualifiedMentorTypes,
    mentorEligible,
    mentorCoursesComplete,
    effectiveMentorStatus,
    submitMentorApplication,
    acceptMentorContract,
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
    mythouseApiKey,
    hasMythouseKey,
    generateMythouseKey,
    regenerateMythouseKey,
    social,
    updateSocial,
    pilgrimages,
    pilgrimagesLoaded,
    addPilgrimage,
    removePilgrimage,
    userSites,
    userSitesLoaded,
    addUserSite,
    removeUserSite,
    savedSiteIds,
    saveSite,
    unsaveSite,
    personalStory,
    savePersonalStory,
    curatorApproved,
    updateCuratorStatus,
  }), [
    profileData, earnedRanks, highestRank, activeCredentials, hasProfile, loaded, handle,
    natalChart, numerologyName, subscriptions, hasSubscription, purchases, hasPurchase,
    hasStripeAccount, initiateCheckout, openBillingPortal, updateCredentials,
    updateNatalChart, updateNumerologyName, luckyNumber, updateLuckyNumber,
    completeOnboarding, refreshProfile, mentorData, qualifiedMentorTypes, mentorEligible,
    mentorCoursesComplete, effectiveMentorStatus, submitMentorApplication, acceptMentorContract,
    updateMentorStatus, mentorPairings, pairingCategories, updateMentorBio, updateMentorCapacity,
    publishToDirectory, unpublishFromDirectory, requestMentor, respondToPairing, endPairing,
    photoURL, consultingData, consultingRequests, consultingCategories, updateProfilePhoto,
    submitConsultingProfile, requestConsulting, respondToConsulting,
    apiKeys, apiKeysLoaded, saveApiKey, removeApiKey, hasAnthropicKey, hasOpenaiKey,
    mythouseApiKey, hasMythouseKey, generateMythouseKey, regenerateMythouseKey,
    social, updateSocial, pilgrimages, pilgrimagesLoaded, addPilgrimage, removePilgrimage,
    userSites, userSitesLoaded, addUserSite, removeUserSite, savedSiteIds, saveSite, unsaveSite,
    personalStory, savePersonalStory, curatorApproved, updateCuratorStatus,
  ]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
