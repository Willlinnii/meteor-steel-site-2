import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useProfile } from '../../profile/ProfileContext';
import { RANKS, rankProgress } from '../../profile/profileEngine';
import ProfileChat from '../../profile/ProfileChat';
import MentorApplicationChat from '../../profile/MentorApplicationChat';
import ConsultingSetupChat from '../../profile/ConsultingSetupChat';
import { MENTOR_STATUS, MENTOR_TYPES, getMentorDisplay, getMentorCourseChecklist, DEFAULT_MENTOR_CAPACITY, MAX_MENTOR_BIO_LENGTH, MAX_MENTOR_CAPACITY } from '../../profile/mentorEngine';
import { validatePhoto, uploadProfilePhoto } from '../../profile/photoUpload';
import { checkAvailability, registerHandle } from '../../multiplayer/handleService';
import { apiFetch } from '../../lib/chatApi';
import { computeNumerology, NUMBER_MEANINGS, NUMBER_TYPES } from '../../profile/numerologyEngine';
import FriendsSection from './FriendsSection';
import StoryCardDeck from './StoryCardDeck';
import { useStoryCardSync } from '../../storyCards/useStoryCardSync';
import chronosphaeraZodiac from '../../data/chronosphaeraZodiac.json';
import mythicCalendar from '../../data/mythicCalendar.json';
import constellationContent from '../../data/constellationContent.json';
import { EMBODIED_READING, TIMELESS_READING, PAIR_DYNAMIC, SAME_SIGN_READING } from '../../data/twoWheelReadings';
import dayNight from '../../data/dayNight.json';

const SUBSCRIPTIONS = [
  {
    id: 'developer-api', name: 'Secret Weapon API', free: true,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
    description: 'Generate an API key to query the Mythouse knowledge graph programmatically.',
    details: 'This site is the explorable inside of the API. Every planet, archetype, journey, and correspondence you can query through the API lives here. The more you explore, the more powerfully you\'ll use it.',
    hasCustomContent: true,
  },
  {
    id: 'master-key', name: 'Mythouse Master Key', price: '$100/mo',
    isBundle: true,
    bundleSubscriptions: ['ybr', 'forge', 'coursework', 'monomyth'],
    bundlePurchases: ['starlight-bundle', 'fallen-starlight', 'story-of-stories'],
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="15" r="5" />
        <path d="M8 10V2" />
        <path d="M11 5L8 2L5 5" />
        <path d="M13 15h8" />
        <path d="M18 12v6" />
        <path d="M21 12v6" />
      </svg>
    ),
    description: 'Everything Mythouse has to offer — all journeys, courses, stories, and the forge.',
    details: 'The Master Key unlocks the full Mythouse experience: all Yellow Brick Road journeys, the Story Forge, full Coursework tracking (Monomyth Explorer, Celestial Clocks Explorer, Meteor Steel Initiate, Atlas Conversationalist, Mythic Gamer, Starlight Reader, Ouroboros Walker), the Monomyth & Meteor Steel overlay, and the complete Starlight Bundle (Fallen Starlight + Story of Stories).',
  },
  {
    id: 'ybr', name: 'Yellow Brick Road', price: '$5/mo',
    icon: (
      <svg viewBox="0 0 20 14" width="20" height="14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M1,4 L7,1 L19,1 L13,4 Z" />
        <path d="M1,4 L1,13 L13,13 L13,4" />
        <path d="M13,4 L19,1 L19,10 L13,13" />
        <line x1="7" y1="4" x2="7" y2="13" />
        <line x1="1" y1="8.5" x2="13" y2="8.5" />
        <line x1="4" y1="8.5" x2="4" y2="13" />
        <line x1="10" y1="4" x2="10" y2="8.5" />
      </svg>
    ),
    description: 'Interactive journey through the monomyth stages with Atlas as your guide.',
    details: 'The Yellow Brick Road is a guided, stage-by-stage journey through the monomyth. Atlas walks alongside you as you encounter mythic figures at each threshold \u2014 gods, tricksters, mentors, and shadow guardians drawn from world mythology. Answer their challenges through conversation to advance along the path.',
  },
  {
    id: 'forge', name: 'Story Forge', price: '$45/mo',
    icon: (
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10,2 L10,11" />
        <path d="M7,5 Q10,3 13,5" />
        <path d="M6,11 L14,11" />
        <path d="M5,11 L5,14 Q10,18 15,14 L15,11" />
      </svg>
    ),
    description: 'Write your own story using mythic structure with AI collaboration.',
    details: 'The Story Forge lets you craft your own personal myth using the eight stages of the monomyth as a framework. Write freely at each stage while an AI collaborator helps you develop themes, deepen character arcs, and weave in mythic resonance. Your stories are saved to your profile and can be revisited anytime.',
  },
  {
    id: 'coursework', name: 'Coursework', price: '$45/mo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12 L12 6 L22 12 L12 18 Z" />
        <path d="M6 14 L6 19 C6 19 9 22 12 22 C15 22 18 19 18 19 L18 14" />
        <line x1="22" y1="12" x2="22" y2="18" />
      </svg>
    ),
    description: 'Track your progress through courses, earn ranks and certificates.',
    details: 'Coursework tracks your exploration across the site and awards progress toward structured courses. Visit pages, interact with content, and complete activities to fill requirements. Finish courses to earn ranks and certificates displayed on your profile.',
  },
  {
    id: 'monomyth', name: 'Monomyth & Meteor Steel',
    price: '$25/mo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3 L14 6 L10 6 Z" fill="currentColor" stroke="none" />
      </svg>
    ),
    description: 'The hero\'s journey ring and the metallurgical transformation narrative on the Chronosphaera.',
    details: 'Activates the eight-stage monomyth ring and the meteor steel metallurgical overlay on the Chronosphaera. Toggle between the hero\'s journey stages and their correspondence to the ancient art of steel-making.',
  },
];

const PURCHASES = [
  {
    id: 'fallen-starlight', name: 'Fallen Starlight',
    price: '$25',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M12 6 L10.8 9.2 L7.5 9.2 L10.1 11.3 L9.1 14.5 L12 12.5 L14.9 14.5 L13.9 11.3 L16.5 9.2 L13.2 9.2 Z" fill="currentColor" stroke="none" />
      </svg>
    ),
    description: 'The original revelation \u2014 tracing the descent of celestial fire through the seven planetary metals.',
    details: 'Fallen Starlight overlays a mythic narrative layer onto the Chronosphaera \u2014 eight stages of the descent of light into matter, each aligned with a planetary metal and its archetypal story. Activate to explore the cosmic drama from within the celestial clock.',
  },
  {
    id: 'story-of-stories', name: 'Story of Stories',
    price: '$25',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </svg>
    ),
    description: 'The meta-narrative \u2014 the stories that emerged from the fall of light into matter.',
    details: 'Story of Stories is a companion layer to Fallen Starlight \u2014 the mythic tradition behind the seven metals, told through the Chronosphaera. It traces the stories that emerged as celestial fire descended into the material world.',
  },
  {
    id: 'medicine-wheel', name: 'Medicine Wheel', donation: true,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 L5 14 L11 14 L11 22 L19 10 L13 10 Z" />
      </svg>
    ),
    description: 'The medicine wheel — Hyemeyohsts Storm\'s teachings on the sacred hoop and the four directions.',
    details: 'Activating the Medicine Wheel overlays the sacred hoop onto the Chronosphaera, mapping the four directions, their powers, and their animals onto the celestial clock. Based on the teachings of Hyemeyohsts Storm.',
  },
  {
    id: 'starlight-bundle', name: 'Starlight Bundle',
    price: '$40',
    isBundle: true,
    bundleItems: ['fallen-starlight', 'story-of-stories'],
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 19.5A2.5 2.5 0 0 1 4.5 17H13" />
        <path d="M4.5 4H13v16H4.5A2.5 2.5 0 0 1 2 17.5v-11A2.5 2.5 0 0 1 4.5 4z" />
        <path d="M11 19.5A2.5 2.5 0 0 1 13.5 17H22" />
        <path d="M13.5 2H22v20H13.5A2.5 2.5 0 0 1 11 19.5v-15A2.5 2.5 0 0 1 13.5 2z" />
        <path d="M8 8 L7.4 9.6 L5.8 9.6 L7.1 10.6 L6.6 12.2 L8 11.2 L9.4 12.2 L8.9 10.6 L10.2 9.6 L8.6 9.6 Z" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </svg>
    ),
    description: 'Both books together at a discounted price.',
    details: 'Get both Fallen Starlight and Story of Stories together. Explore the full cosmic drama on the Chronosphaera \u2014 the fall of light into matter, and the stories that emerged from it.',
  },
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { getCourseStates, completedCourses, certificateData, allCourses } = useCoursework();
  const { earnedRanks, highestRank, activeCredentials, hasProfile, loaded: profileLoaded, handle, natalChart, updateNatalChart, numerologyName, updateNumerologyName, luckyNumber, updateLuckyNumber, subscriptions, purchases, hasStripeAccount, initiateCheckout, openBillingPortal, refreshProfile, mentorData, qualifiedMentorTypes, mentorEligible, mentorCoursesComplete, effectiveMentorStatus, pairingCategories, updateMentorBio, updateMentorCapacity, publishToDirectory, unpublishFromDirectory, respondToPairing, endPairing, photoURL, consultingData, consultingCategories, updateProfilePhoto, respondToConsulting, apiKeys, saveApiKey, removeApiKey, hasAnthropicKey, hasOpenaiKey, mythouseApiKey, hasMythouseKey, generateMythouseKey, regenerateMythouseKey, social, updateSocial, pilgrimages, pilgrimagesLoaded, removePilgrimage, personalStory, savePersonalStory, curatorApproved } = useProfile();
const { cards: storyCards, loaded: storyCardsLoaded } = useStoryCardSync();
  const navigate = useNavigate();
  const location = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [showConsultingChat, setShowConsultingChat] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); // 'ybr' | 'forge' | etc.
  const [showSocial, setShowSocial] = useState(false);
  const [consultingRespondingId, setConsultingRespondingId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // itemId being checked out
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [donationAmount, setDonationAmount] = useState(''); // for pay-what-you-want items
  const [launchKey, setLaunchKey] = useState(''); // sales key to activate items for free

  // PWA / App install
  // Store links — drop in URLs when live in the App Store / Play Store
  const APP_STORE_URL = null;   // e.g. 'https://apps.apple.com/app/mythouse/id...'
  const PLAY_STORE_URL = null;  // e.g. 'https://play.google.com/store/apps/details?id=com.mythouse.app'
  const hasStoreLinks = !!(APP_STORE_URL || PLAY_STORE_URL);

  const [installPrompt, setInstallPrompt] = useState(null);
  const isNativeApp = !!(window.Capacitor?.isNativePlatform?.());
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const [appInstalled, setAppInstalled] = useState(isNativeApp || isStandalone);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setAppInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setAppInstalled(true);
    setInstallPrompt(null);
  };

  // Detect checkout success from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutSuccess(true);
      // Refresh profile after a short delay to pick up webhook-written flags
      const timer = setTimeout(() => {
        refreshProfile();
        setCheckoutSuccess(false);
      }, 3000);
      // Clean the URL
      navigate('/profile', { replace: true });
      return () => clearTimeout(timer);
    }
  }, [location.search, refreshProfile, navigate]);

  // Personal Story state
  const [storyInput, setStoryInput] = useState('');
  const [storyEditing, setStoryEditing] = useState(false);
  const [storyTransmuting, setStoryTransmuting] = useState(false);
  const [storyView, setStoryView] = useState('transmuted');
  const [storyError, setStoryError] = useState(null);

  useEffect(() => {
    if (personalStory?.raw) setStoryInput(personalStory.raw);
  }, [personalStory?.raw]);

  const handleTransmute = async () => {
    if (!storyInput.trim()) return;
    setStoryTransmuting(true);
    setStoryError(null);
    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'story-transmute', rawText: storyInput.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await savePersonalStory(storyInput.trim(), data.transmuted);
      setStoryEditing(false);
      setStoryView('transmuted');
    } catch (err) {
      console.error('Transmute error:', err);
      setStoryError(err.message || 'Failed to transmute story.');
    } finally {
      setStoryTransmuting(false);
    }
  };

  // BYOK API key input state
  const [anthropicKeyInput, setAnthropicKeyInput] = useState('');
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [keySaving, setKeySaving] = useState(null); // 'anthropicKey' | 'openaiKey' | null

  // Mythouse API key state
  const [showMythouseKey, setShowMythouseKey] = useState(false);
  const [mythouseKeyLoading, setMythouseKeyLoading] = useState(false);
  const [mythousCopyFeedback, setMythousCopyFeedback] = useState(false);
  const [setupPromptCopied, setSetupPromptCopied] = useState(false);
  const [installPromptCopied, setInstallPromptCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Social media link state
  const [socialInputs, setSocialInputs] = useState({ instagram: '', facebook: '', linkedin: '', youtube: '' });
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialDirty, setSocialDirty] = useState(false);

  useEffect(() => {
    if (social) {
      setSocialInputs({
        instagram: social.instagram || '',
        facebook: social.facebook || '',
        linkedin: social.linkedin || '',
        youtube: social.youtube || '',
      });
    }
  }, [social]);

  const handleSocialChange = (platform, value) => {
    setSocialInputs(prev => ({ ...prev, [platform]: value }));
    setSocialDirty(true);
  };

  const handleSocialSave = async () => {
    setSocialSaving(true);
    await updateSocial(socialInputs);
    setSocialSaving(false);
    setSocialDirty(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || photoUploading) return;
    const validation = validatePhoto(file);
    if (!validation.valid) return;
    setPhotoUploading(true);
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      await updateProfilePhoto(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
    }
    setPhotoUploading(false);
  };

  const handleConsultingAccept = async (requestId) => {
    setConsultingRespondingId(requestId);
    try { await respondToConsulting(requestId, true); } catch {}
    setConsultingRespondingId(null);
  };

  const handleConsultingDecline = async (requestId) => {
    setConsultingRespondingId(requestId);
    try { await respondToConsulting(requestId, false); } catch {}
    setConsultingRespondingId(null);
  };

  const [certDownloading, setCertDownloading] = useState(null); // courseId while generating

  const handleDownloadCertificate = useCallback(async (course) => {
    setCertDownloading(course.id);
    try {
      const [{ jsPDF }, { generateCertificate }] = await Promise.all([
        import('jspdf'),
        import('../../coursework/generateCertificate'),
      ]);
      const certInfo = certificateData[course.id];
      generateCertificate(jsPDF, {
        userName: user?.displayName || user?.email?.split('@')[0] || 'Traveler',
        courseName: course.name,
        courseDescription: course.description,
        requirements: course.requirements,
        completedAt: certInfo?.completedAt || Date.now(),
        courseId: course.id,
      });
    } catch (err) {
      console.error('Certificate generation failed:', err);
    }
    setCertDownloading(null);
  }, [certificateData, user]);

  // Scroll to #subscriptions or #purchases when navigated with hash
  useEffect(() => {
    if (location.hash === '#subscriptions' || location.hash === '#purchases') {
      const id = location.hash.slice(1);
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);
  const [handleInput, setHandleInput] = useState('');
  const [handleStatus, setHandleStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'error'
  const [handleSaving, setHandleSaving] = useState(false);
  const [showHandleEdit, setShowHandleEdit] = useState(false);

  const checkHandle = useCallback(async (value) => {
    if (!value || value.length < 3) { setHandleStatus(null); return; }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(value)) { setHandleStatus('format'); return; }
    setHandleStatus('checking');
    try {
      const available = await checkAvailability(value);
      setHandleStatus(available ? 'available' : 'taken');
    } catch (err) {
      console.error('Handle availability check failed:', err);
      setHandleStatus('check-error');
    }
  }, []);

  const saveHandle = useCallback(async () => {
    if (handleStatus !== 'available' || handleSaving) return;
    setHandleSaving(true);
    try {
      await registerHandle(handleInput);
      await refreshProfile();
      setShowHandleEdit(false);
      setHandleInput('');
      setHandleStatus(null);
    } catch (err) {
      console.error('Handle registration failed:', err);
      setHandleStatus('save-error');
    }
    setHandleSaving(false);
  }, [handleInput, handleStatus, handleSaving, refreshProfile]);

  const courseStates = getCourseStates();
  const activeCourses = courseStates.filter(c => c.active);

  // Separate completed, in-progress, and not-started
  const completed = activeCourses.filter(c => c.completed);
  const inProgress = activeCourses.filter(c => !c.completed && c.progress > 0);
  const notStarted = activeCourses.filter(c => !c.completed && c.progress === 0);

  // Build certificates list from completedCourses set
  const certificates = allCourses.filter(c => completedCourses.has(c.id));

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Traveler';
  const initial = displayName.charAt(0).toUpperCase();

  // Derive sun sign for basics card
  const sunSign = natalChart?.planets?.find(p => p.name === 'Sun');
  const sunSymbol = sunSign ? (ZODIAC_SYMBOLS[sunSign.sign] || '') : null;
  const moonSign = natalChart?.planets?.find(p => p.name === 'Moon');
  const risingSign = natalChart?.ascendant;

  // Mentor display for basics card
  const mentorDisplay = effectiveMentorStatus === 'active' ? getMentorDisplay(mentorData) : null;

  // Build profile summary lines
  const summaryLines = useMemo(() => {
    const lines = [];
    // Line 1: Highest rank + credential titles
    const parts1 = [];
    if (highestRank) parts1.push(highestRank.name);
    if (activeCredentials.length > 0) {
      parts1.push(activeCredentials.map(c => c.display.name).join(', '));
    }
    if (parts1.length > 0) lines.push(parts1.join(' \u2014 '));

    // Line 2: Mentor + astrology
    const parts2 = [];
    if (effectiveMentorStatus === 'active' && mentorData?.type) {
      const mt = MENTOR_TYPES[mentorData.type];
      if (mt) parts2.push(mt.title);
    }
    const astro = [];
    if (sunSign) astro.push(`${sunSign.sign} Sun`);
    if (moonSign) astro.push(`${moonSign.sign} Moon`);
    if (risingSign) astro.push(`${risingSign.sign} Rising`);
    if (astro.length > 0) parts2.push(astro.join(', '));
    if (parts2.length > 0) lines.push(parts2.join(' \u00B7 '));

    // Line 3: Numerology + courses + pilgrimages
    const parts3 = [];
    if (luckyNumber != null) parts3.push(`Life Path ${luckyNumber}`);
    if (completed.length > 0) parts3.push(`${completed.length} course${completed.length !== 1 ? 's' : ''} completed`);
    const pilgCount = Object.keys(pilgrimages || {}).length;
    if (pilgCount > 0) parts3.push(`${pilgCount} sacred site${pilgCount !== 1 ? 's' : ''} saved`);
    if (parts3.length > 0) lines.push(parts3.join(' \u00B7 '));

    return lines;
  }, [highestRank, activeCredentials, effectiveMentorStatus, mentorData, sunSign, moonSign, risingSign, luckyNumber, completed.length, pilgrimages]);

  return (
    <div className="profile-page">
      {/* ── Basics Card ── */}
      <div className="profile-basics-card">
        <div className="profile-header">
          <div className="profile-avatar" onClick={() => document.getElementById('photo-upload-input')?.click()} style={{ cursor: 'pointer', position: 'relative' }}>
            {photoURL ? (
              <img src={photoURL} alt="" className="profile-avatar-img" />
            ) : (
              initial
            )}
            {photoUploading && <span className="profile-avatar-loading" />}
            <div className="profile-avatar-upload-overlay">
              {photoUploading ? '' : '\uD83D\uDCF7'}
            </div>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-name">{displayName}</div>
          {/* Handle Section (above email) */}
          {handle && !showHandleEdit ? (
            <div className="profile-handle">
              <span className="profile-handle-at">@{handle}</span>
              <button className="profile-handle-edit-btn" onClick={() => { setShowHandleEdit(true); setHandleInput(handle); }}>Change</button>
            </div>
          ) : (
            <div className="profile-handle-setup">
              {!handle && <div className="profile-handle-prompt">Set a handle for multiplayer</div>}
              <div className="profile-handle-form">
                <input
                  className="profile-handle-input"
                  type="text"
                  placeholder="Choose a handle..."
                  value={handleInput}
                  maxLength={20}
                  onChange={e => {
                    const v = e.target.value;
                    setHandleInput(v);
                    checkHandle(v);
                  }}
                />
                <button
                  className="profile-handle-save-btn"
                  disabled={handleStatus !== 'available' || handleSaving}
                  onClick={saveHandle}
                >
                  {handleSaving ? 'Saving...' : 'Save'}
                </button>
                {showHandleEdit && (
                  <button className="profile-handle-cancel-btn" onClick={() => { setShowHandleEdit(false); setHandleInput(''); setHandleStatus(null); }}>Cancel</button>
                )}
              </div>
              {handleStatus === 'checking' && <div className="profile-handle-status">Checking...</div>}
              {handleStatus === 'available' && <div className="profile-handle-status available">Available</div>}
              {handleStatus === 'taken' && <div className="profile-handle-status taken">Already taken</div>}
              {handleStatus === 'format' && <div className="profile-handle-status error">3-20 chars, letters/numbers/_/- only</div>}
              {handleStatus === 'check-error' && <div className="profile-handle-status error">Could not check availability — check console</div>}
              {handleStatus === 'save-error' && <div className="profile-handle-status error">Failed to save handle — check console</div>}
            </div>
          )}
          <div className="profile-email">{user?.email}</div>
          {/* Social handles display */}
          {(() => {
            const handles = [
              social?.instagram && `ig: ${social.instagram}`,
              social?.facebook && `fb: ${social.facebook}`,
              social?.linkedin && `li: ${social.linkedin}`,
              social?.youtube && `yt: ${social.youtube}`,
            ].filter(Boolean);
            return handles.length > 0 ? (
              <div className="profile-card-social-handles">{handles.join(' · ')}</div>
            ) : null;
          })()}
        </div>

        {/* Profile Summary */}
        {summaryLines.length > 0 && (
          <div className="profile-summary">
            {summaryLines.map((line, i) => (
              <div key={i} className="profile-summary-line">{line}</div>
            ))}
          </div>
        )}

        {/* Admin shortcut */}
        {user?.email === process.env.REACT_APP_ADMIN_EMAIL && (
          <button className="profile-dragon-btn" onClick={() => navigate('/dragon')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.5 2 4 6 4 9c0 2 .5 3 1.5 4L4 17l3-1.5c1 1.5 3 2.5 5 2.5s4-1 5-2.5l3 1.5-1.5-4c1-1 1.5-2 1.5-4 0-3-2.5-7-8-7z" />
              <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
              <path d="M9 13c1 1 5 1 6 0" />
            </svg>
            Domain of the Dragon
          </button>
        )}

        {/* ── Badges Row ── */}
        {(earnedRanks.length > 0 || activeCredentials.length > 0 || sunSymbol || luckyNumber != null || mentorDisplay) && (
          <div className="profile-badges-row">
            {/* Rank badges */}
            {earnedRanks.map(rank => (
              <span key={rank.id} className="profile-badge" title={rank.name} onClick={() => document.getElementById('section-ranks')?.scrollIntoView({ behavior: 'smooth' })}>
                {rank.icon}
              </span>
            ))}
            {/* Credential badges */}
            {activeCredentials.map(cred => (
              <span key={cred.category} className="profile-badge credential" title={`${cred.display.name} (L${cred.level})`} onClick={() => document.getElementById('section-credentials')?.scrollIntoView({ behavior: 'smooth' })}>
                {cred.display.icon}
              </span>
            ))}
            {/* Mentor badge */}
            {mentorDisplay && (
              <span className="profile-badge mentor" title={mentorDisplay.title} onClick={() => document.getElementById('section-mentorship')?.scrollIntoView({ behavior: 'smooth' })}>
                {mentorDisplay.icon}
              </span>
            )}
            {/* Sun sign */}
            {sunSymbol && (
              <span className="profile-badge sun-sign" title={`Sun in ${sunSign.sign}`} onClick={() => document.getElementById('section-natal-chart')?.scrollIntoView({ behavior: 'smooth' })}>
                {sunSymbol}
              </span>
            )}
            {/* Lucky number */}
            {luckyNumber != null && (
              <span className="profile-badge lucky-number" title={`Lucky Number ${luckyNumber}`} onClick={() => document.getElementById('section-numerology')?.scrollIntoView({ behavior: 'smooth' })}>
                {luckyNumber}
              </span>
            )}
          </div>
        )}
      </div>

      {/* My Story */}
      <h2 className="profile-section-title">My Story</h2>
      {!storyEditing && personalStory?.transmuted ? (
        <div className="profile-story-section">
          <div className="profile-story-display">
            {storyView === 'transmuted' ? personalStory.transmuted : personalStory.raw}
          </div>
          <div className="profile-story-actions">
            <button
              className="profile-story-toggle"
              onClick={() => setStoryView(v => v === 'transmuted' ? 'original' : 'transmuted')}
            >
              {storyView === 'transmuted' ? 'View Original' : 'View Transmuted'}
            </button>
            <button
              className="profile-update-btn"
              onClick={() => { setStoryEditing(true); setStoryError(null); }}
            >
              Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-story-section">
          {!personalStory?.transmuted && !storyEditing && (
            <div className="profile-empty">
              Share your story — paste a bio, CV, or personal introduction and Atlas will transmute it into your personal myth.
            </div>
          )}
          <textarea
            className="profile-story-textarea"
            placeholder="Paste your bio, CV, resume, or personal introduction here..."
            value={storyInput}
            onChange={e => setStoryInput(e.target.value)}
            rows={8}
          />
          {storyError && <div className="profile-story-error">{storyError}</div>}
          <div className="profile-story-actions">
            <button
              className="profile-story-transmute-btn"
              disabled={storyTransmuting || !storyInput.trim()}
              onClick={handleTransmute}
            >
              {storyTransmuting ? 'Transmuting...' : 'Transmute'}
            </button>
            {personalStory?.transmuted && (
              <button
                className="profile-update-btn"
                onClick={() => { setStoryEditing(false); setStoryError(null); }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Natal Chart Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h2 id="section-natal-chart" className="profile-section-title" style={{ margin: 0 }}>Natal Chart</h2>
        {natalChart?.birthData && (
          <button
            className="profile-badge"
            title="View your Crown"
            onClick={() => {
              const bd = natalChart.birthData;
              const mm = String(bd.month).padStart(2, '0');
              const dd = String(bd.day).padStart(2, '0');
              navigate(`/crown?birthday=${bd.year}-${mm}-${dd}`);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', fontSize: '1.2rem', lineHeight: 1, color: 'inherit', opacity: 0.8 }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="12" rx="9" ry="3.5" />
              <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
              <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </button>
        )}
      </div>
      <NatalChartDisplay chart={natalChart} />
      <NatalChartInput existingChart={natalChart} onSave={updateNatalChart} />

      {/* Numerology Section */}
      <h2 id="section-numerology" className="profile-section-title">Numerology</h2>
      <NumerologyDisplay
        savedName={numerologyName}
        displayName={user?.displayName}
        onSave={updateNumerologyName}
        luckyNumber={luckyNumber}
        onSaveLucky={updateLuckyNumber}
      />

      {/* My Story Cards (with Story Matching pop-down) */}
      <StoryCardDeck cards={storyCards} loaded={storyCardsLoaded} />

      {/* Social Media Links (click-to-expand) */}
      <h2
        className="profile-section-title profile-section-toggle"
        onClick={() => setShowSocial(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowSocial(v => !v); }}
      >
        Social Media
        <span className={`profile-section-chevron${showSocial ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {showSocial && (
        <div className="profile-social-links">
          {[
            { key: 'instagram', label: 'Instagram', placeholder: 'username' },
            { key: 'facebook', label: 'Facebook', placeholder: 'username or profile URL' },
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'username or profile URL' },
            { key: 'youtube', label: 'YouTube', placeholder: 'channel name or URL' },
          ].map(p => (
            <div key={p.key} className="profile-social-row">
              <div className="profile-social-label">{p.label}</div>
              <input
                className="profile-social-input"
                type="text"
                placeholder={p.placeholder}
                value={socialInputs[p.key]}
                onChange={e => handleSocialChange(p.key, e.target.value)}
              />
            </div>
          ))}
          {socialDirty && (
            <button
              className="profile-social-save-btn"
              disabled={socialSaving}
              onClick={handleSocialSave}
            >
              {socialSaving ? 'Saving...' : 'Save Social Links'}
            </button>
          )}
        </div>
      )}

      {/* Credentials Section */}
      <h2 id="section-credentials" className="profile-section-title">Credentials</h2>
      {!profileLoaded && (
        <div className="profile-empty">Loading credentials...</div>
      )}
      {profileLoaded && (showChat || !hasProfile) && (
        <ProfileChat onComplete={() => setShowChat(false)} isUpdate={hasProfile} />
      )}
      {profileLoaded && hasProfile && !showChat && (
        <>
          <div className="profile-credential-list">
            {activeCredentials.map(cred => (
              <div key={cred.category} className="profile-credential-card">
                <span className="profile-credential-icon">{cred.display.icon}</span>
                <div className="profile-credential-info">
                  <div className="profile-credential-name">{cred.display.name}</div>
                  {cred.details && (
                    <div className="profile-credential-details">{cred.details}</div>
                  )}
                </div>
                <span className="profile-credential-level">L{cred.level}</span>
              </div>
            ))}
          </div>
          <button className="profile-update-btn" onClick={() => setShowChat(true)}>
            Update Credentials
          </button>
        </>
      )}

      {/* Curator Section */}
      {profileLoaded && curatorApproved && (
        <>
          <h2 className="profile-section-title">Curator</h2>
          <div className="profile-credential-card">
            <span className="profile-credential-icon">{'\uD83D\uDDBC'}</span>
            <div className="profile-credential-info">
              <div className="profile-credential-name">Approved Curator</div>
              <div className="profile-credential-details">You can contribute products to the Curated Collection</div>
            </div>
          </div>
          <button className="profile-update-btn" onClick={() => navigate('/curated')}>
            Go to Curated Collection
          </button>
        </>
      )}

      {/* Mentor Section */}
      {profileLoaded && (
        <MentorSection
          effectiveMentorStatus={effectiveMentorStatus}
          mentorEligible={mentorEligible}
          qualifiedMentorTypes={qualifiedMentorTypes}
          mentorData={mentorData}
          mentorCoursesComplete={mentorCoursesComplete}
          completedCourses={completedCourses}
          allCourses={allCourses}
          showMentorChat={showMentorChat}
          setShowMentorChat={setShowMentorChat}
          showConsultingChat={showConsultingChat}
          setShowConsultingChat={setShowConsultingChat}
          pairingCategories={pairingCategories}
          updateMentorBio={updateMentorBio}
          updateMentorCapacity={updateMentorCapacity}
          publishToDirectory={publishToDirectory}
          unpublishFromDirectory={unpublishFromDirectory}
          respondToPairing={respondToPairing}
          endPairing={endPairing}
          consultingData={consultingData}
          consultingCategories={consultingCategories}
          onConsultingAccept={handleConsultingAccept}
          onConsultingDecline={handleConsultingDecline}
          consultingRespondingId={consultingRespondingId}
        />
      )}

      {/* Certificates */}
      <h2 className="profile-section-title">Certificates</h2>
      {certificates.length === 0 ? (
        <div className="profile-empty">
          Complete a course to earn your first certificate.
        </div>
      ) : (
        <div className="profile-cert-list">
          {certificates.map(course => {
            const certInfo = certificateData[course.id];
            const dateStr = certInfo?.completedAt
              ? new Date(certInfo.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : 'Certificate earned';
            return (
              <div key={course.id} className="profile-cert-card">
                <span className="profile-cert-icon">{'\u2728'}</span>
                <div className="profile-cert-info">
                  <div className="profile-cert-name">{course.name}</div>
                  <div className="profile-cert-date">{dateStr}</div>
                </div>
                <button
                  className="profile-cert-download-btn"
                  disabled={certDownloading === course.id}
                  onClick={() => handleDownloadCertificate(course)}
                >
                  {certDownloading === course.id ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Ranks Section */}
      <h2 id="section-ranks" className="profile-section-title">Ranks</h2>
      <div className="profile-rank-list">
        {RANKS.map(rank => {
          const earned = earnedRanks.some(r => r.id === rank.id);
          const progress = rankProgress(rank, completedCourses);
          const pct = Math.round(progress.fraction * 100);
          const courseNames = rank.requiredCourses.map(id => {
            const course = allCourses.find(c => c.id === id);
            return course ? course.name : id;
          });

          return (
            <div key={rank.id} className={`profile-rank-card${earned ? ' earned' : ''}`}>
              <span className="profile-rank-icon">{rank.icon}</span>
              <div className="profile-rank-info">
                <div className="profile-rank-name">{rank.name}</div>
                <div className="profile-rank-courses">
                  {earned ? 'Earned' : `${progress.completed}/${progress.total} courses`} — {courseNames.join(', ')}
                </div>
                {!earned && (
                  <div className="profile-rank-progress">
                    <div className="profile-progress-bar">
                      <div className="profile-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Membership Add-Ons */}
      <h2 className="profile-section-title">Membership Add-Ons</h2>

      {/* Launch Key */}
      <div className="profile-launch-key-row">
        <input
          type="text"
          className="profile-launch-key-input"
          placeholder="Enter launch key..."
          value={launchKey}
          onChange={e => setLaunchKey(e.target.value)}
        />
        {launchKey && <span className="profile-launch-key-hint">Key active — purchases will be comped</span>}
      </div>

      {/* Subscriptions Sub-Section */}
      <div id="subscriptions">
        <h3 className="profile-subsection-title">Subscriptions</h3>
        <div className="profile-subscription-list">
          {SUBSCRIPTIONS.map(sub => {
            const enabled = !!subscriptions[sub.id];
            const expanded = expandedCard === sub.id;
            const isBundle = !!sub.isBundle;
            return (
              <div key={sub.id} className={`profile-subscription-card${enabled ? ' active' : ''}${expanded ? ' expanded' : ''}${isBundle ? ' profile-purchase-bundle' : ''}`}>
                <div className="profile-subscription-row" onClick={() => setExpandedCard(expanded ? null : sub.id)}>
                  <span className="profile-subscription-icon">{sub.icon}</span>
                  <div className="profile-subscription-info">
                    <div className="profile-subscription-name">{sub.name}{isBundle && <span className="profile-bundle-badge">Bundle</span>}</div>
                    <div className="profile-subscription-desc">{sub.description}</div>
                  </div>
                  <span className="profile-subscription-action" onClick={e => e.stopPropagation()}>
                    {enabled ? (
                      <span className="profile-stripe-status active">Active</span>
                    ) : (
                      <button
                        className="profile-stripe-btn subscribe"
                        disabled={checkoutLoading === sub.id}
                        onClick={async () => {
                          setCheckoutLoading(sub.id);
                          try { await initiateCheckout(sub.id, launchKey ? { launchKey } : {}); } catch {}
                          setCheckoutLoading(null);
                        }}
                      >
                        {checkoutLoading === sub.id ? '...' : sub.free ? 'Activate' : sub.price ? `Subscribe ${sub.price}` : 'Subscribe'}
                      </button>
                    )}
                  </span>
                </div>
                {expanded && (
                  <div className="profile-subscription-details">
                    {sub.hasCustomContent && sub.id === 'developer-api' ? (
                      <>
                        <p className="profile-dev-api-pitch">{sub.details}</p>

                        {/* Tier 1: Secret Weapon API */}
                        <div className="profile-api-tier">
                          <div className="profile-api-tier-title">Secret Weapon API</div>
                          <p className="profile-api-tier-desc">
                            Query the Mythouse knowledge graph. Build its intelligence into what you're creating.
                          </p>
                          <a href="/secret-weapon-api" className="profile-api-learn-more" onClick={e => { e.preventDefault(); navigate('/secret-weapon-api'); }}>
                            What flows through this key &rarr;
                          </a>
                          {enabled && (
                            <div className="profile-api-key-row" style={{ borderBottom: 'none', paddingTop: 4 }}>
                              {hasMythouseKey ? (
                                <div style={{ width: '100%' }}>
                                  <div className="profile-api-key-saved" style={{ marginBottom: 8 }}>
                                    <span className="profile-api-key-masked">
                                      {showMythouseKey
                                        ? mythouseApiKey
                                        : `${mythouseApiKey.slice(0, 7)}${'•'.repeat(20)}${mythouseApiKey.slice(-4)}`}
                                    </span>
                                  </div>
                                  <div className="profile-api-key-actions">
                                    <button
                                      className="profile-api-key-save-btn"
                                      onClick={() => setShowMythouseKey(v => !v)}
                                    >
                                      {showMythouseKey ? 'Hide' : 'Show'}
                                    </button>
                                    <button
                                      className="profile-api-key-save-btn"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(mythouseApiKey);
                                          setMythousCopyFeedback(true);
                                          setTimeout(() => setMythousCopyFeedback(false), 2000);
                                        } catch {}
                                      }}
                                    >
                                      {mythousCopyFeedback ? 'Copied!' : 'Copy'}
                                    </button>
                                    {confirmRegen ? (
                                      <>
                                        <button
                                          className="profile-api-key-remove-btn"
                                          disabled={mythouseKeyLoading}
                                          onClick={async () => {
                                            setMythouseKeyLoading(true);
                                            try {
                                              await regenerateMythouseKey();
                                              setShowMythouseKey(true);
                                            } catch {}
                                            setMythouseKeyLoading(false);
                                            setConfirmRegen(false);
                                          }}
                                        >
                                          {mythouseKeyLoading ? '...' : 'Confirm Regenerate'}
                                        </button>
                                        <button
                                          className="profile-api-key-save-btn"
                                          onClick={() => setConfirmRegen(false)}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        className="profile-api-key-remove-btn"
                                        onClick={() => setConfirmRegen(true)}
                                      >
                                        Regenerate
                                      </button>
                                    )}
                                  </div>
                                  <div className="profile-api-key-snippet">
                                    <code>Authorization: Bearer {showMythouseKey ? mythouseApiKey : 'myt_...'}</code>
                                  </div>

                                  <div className="profile-api-setup-prompt">
                                    <div className="profile-api-setup-header">
                                      <span className="profile-api-setup-label">Setup Prompt</span>
                                      <span className="profile-api-setup-hint">Paste into any AI tool's system prompt, project config, or first message</span>
                                    </div>
                                    <pre className="profile-api-setup-text">{`# Mythouse Coordinate System API

Base URL: https://meteor-steel-site-2.vercel.app/api/v1/
Auth: Authorization: Bearer ${mythouseApiKey}

You have access to a mythology engine built over twenty years \u2014 story structure, archetypal patterns, planetary correspondences, natural cycles, and sacred geography, all as structured queryable data.

## When to use it
Any time I'm building something with structure \u2014 stories, shows, installations, apps, games, writing, visual sequences, timelines, character arcs, world-building. Don't wait for me to say "mythology." If what I'm making has stages, cycles, archetypes, or patterns, this API has a framework for it. Use it proactively.

## How to use it
1. Combine multiple endpoints to build richer structure
2. Use ?include=all on detail endpoints for full nested data
3. Work the data into what you're building \u2014 don't show me raw JSON unless I ask
4. Fetch in the background \u2014 I want to see results, not API calls
5. When the coordinate system shapes your output, sign it at the end:

\u2014 Atlas
  Mythouse

## What's in it

Narrative structure:
  /v1/phases \u2014 8 monomyth stages (the narrative spine of the whole system)
  /v1/phases/{id}/theorists, /myths, /films, /cycles, /depth \u2014 deep context per stage
  /v1/models \u2014 20+ theoretical frameworks (Campbell, Jung, Vogler, Murdock...)
  /v1/figures \u2014 100+ mythological figures mapped to stages
  /v1/synthesis \u2014 meta-narrative: how all layers connect across the 8 stages
  /v1/steel-process \u2014 the metallurgical metaphor mapped to the cycle
  /v1/fallen-starlight \u2014 the Fallen Starlight story, chapter by chapter

Cosmological systems:
  /v1/planets \u2014 7 classical planets with metals, deities, cultures, archetypes, artists
  /v1/zodiac \u2014 12 signs with cross-cultural traditions
  /v1/elements \u2014 4 classical elements
  /v1/cardinals \u2014 4 directions / seasonal thresholds
  /v1/constellations \u2014 88 constellations with mythology and cultural star names
  /v1/calendar \u2014 12-month mythic calendar with birthstones, flowers, holidays
  /v1/day-night \u2014 day/night polarities across cultures

Natural cycles & journeys:
  /v1/cycles \u2014 6 natural cycles (solar day, lunar month, solar year, sleep, procreation, mortality)
  /v1/journey \u2014 26-stop cosmic journey through planets and zodiac signs
  /v1/wheels \u2014 medicine wheels: indigenous four-directional knowledge systems

Geography & reference:
  /v1/sites \u2014 sacred sites worldwide with GPS coordinates
  /v1/library \u2014 curated reading list of foundational texts

All responses return { data, meta } JSON. GET /v1/ for full discovery.`}</pre>
                                    <button
                                      className="profile-api-key-save-btn"
                                      onClick={async () => {
                                        try {
                                          const text = `# Mythouse Coordinate System API\n\nBase URL: https://meteor-steel-site-2.vercel.app/api/v1/\nAuth: Authorization: Bearer ${mythouseApiKey}\n\nYou have access to a mythology engine built over twenty years \u2014 story structure, archetypal patterns, planetary correspondences, natural cycles, and sacred geography, all as structured queryable data.\n\n## When to use it\nAny time I\u2019m building something with structure \u2014 stories, shows, installations, apps, games, writing, visual sequences, timelines, character arcs, world-building. Don\u2019t wait for me to say \u201cmythology.\u201d If what I\u2019m making has stages, cycles, archetypes, or patterns, this API has a framework for it. Use it proactively.\n\n## How to use it\n1. Combine multiple endpoints to build richer structure\n2. Use ?include=all on detail endpoints for full nested data\n3. Work the data into what you\u2019re building \u2014 don\u2019t show me raw JSON unless I ask\n4. Fetch in the background \u2014 I want to see results, not API calls\n5. When the coordinate system shapes your output, sign it at the end:\n\n\u2014 Atlas\n  Mythouse\n\n## What\u2019s in it\n\nNarrative structure:\n  /v1/phases \u2014 8 monomyth stages (the narrative spine of the whole system)\n  /v1/phases/{id}/theorists, /myths, /films, /cycles, /depth \u2014 deep context per stage\n  /v1/models \u2014 20+ theoretical frameworks (Campbell, Jung, Vogler, Murdock...)\n  /v1/figures \u2014 100+ mythological figures mapped to stages\n  /v1/synthesis \u2014 meta-narrative: how all layers connect across the 8 stages\n  /v1/steel-process \u2014 the metallurgical metaphor mapped to the cycle\n  /v1/fallen-starlight \u2014 the Fallen Starlight story, chapter by chapter\n\nCosmological systems:\n  /v1/planets \u2014 7 classical planets with metals, deities, cultures, archetypes, artists\n  /v1/zodiac \u2014 12 signs with cross-cultural traditions\n  /v1/elements \u2014 4 classical elements\n  /v1/cardinals \u2014 4 directions / seasonal thresholds\n  /v1/constellations \u2014 88 constellations with mythology and cultural star names\n  /v1/calendar \u2014 12-month mythic calendar with birthstones, flowers, holidays\n  /v1/day-night \u2014 day/night polarities across cultures\n\nNatural cycles & journeys:\n  /v1/cycles \u2014 6 natural cycles (solar day, lunar month, solar year, sleep, procreation, mortality)\n  /v1/journey \u2014 26-stop cosmic journey through planets and zodiac signs\n  /v1/wheels \u2014 medicine wheels: indigenous four-directional knowledge systems\n\nGeography & reference:\n  /v1/sites \u2014 sacred sites worldwide with GPS coordinates\n  /v1/library \u2014 curated reading list of foundational texts\n\nAll responses return { data, meta } JSON. GET /v1/ for full discovery.`;
                                          await navigator.clipboard.writeText(text);
                                          setSetupPromptCopied(true);
                                          setTimeout(() => setSetupPromptCopied(false), 2000);
                                        } catch {}
                                      }}
                                    >
                                      {setupPromptCopied ? 'Copied!' : 'Copy Setup Prompt'}
                                    </button>
                                  </div>

                                  <div className="profile-api-setup-prompt">
                                    <div className="profile-api-setup-header">
                                      <span className="profile-api-setup-label">Install Prompt</span>
                                      <span className="profile-api-setup-hint">Paste this as a follow-up message so your AI saves the setup permanently</span>
                                    </div>
                                    <pre className="profile-api-setup-text">{`Save the setup prompt above as CLAUDE.md in my project root so it loads automatically every session. Then add CLAUDE.md to .gitignore to keep the API key out of version control.`}</pre>
                                    <button
                                      className="profile-api-key-save-btn"
                                      onClick={async () => {
                                        try {
                                          const text = `Save the setup prompt above as CLAUDE.md in my project root so it loads automatically every session. Then add CLAUDE.md to .gitignore to keep the API key out of version control.`;
                                          await navigator.clipboard.writeText(text);
                                          setInstallPromptCopied(true);
                                          setTimeout(() => setInstallPromptCopied(false), 2000);
                                        } catch {}
                                      }}
                                    >
                                      {installPromptCopied ? 'Copied!' : 'Copy Install Prompt'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="profile-api-terms">By generating a key you agree: content accessed via this API may not be used to train foundation models. All rights reserved by Glinter LLC.</p>
                                  <button
                                    className="profile-api-key-save-btn"
                                    disabled={mythouseKeyLoading}
                                    onClick={async () => {
                                      setMythouseKeyLoading(true);
                                      try {
                                        await generateMythouseKey();
                                      setShowMythouseKey(true);
                                    } catch {}
                                    setMythouseKeyLoading(false);
                                  }}
                                >
                                  {mythouseKeyLoading ? 'Generating...' : 'Generate API Key'}
                                </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tier 2: Ambient Atlas */}
                        <div className="profile-api-tier coming-soon">
                          <div className="profile-api-tier-title">
                            Ambient Atlas
                            <span className="profile-api-tier-badge">Coming Soon</span>
                          </div>
                          <p className="profile-api-tier-desc">
                            Embed the full Mythouse Engine into your creations. Your users experience the mythic intelligence live — not just data, but the reasoning and connections behind it.
                          </p>
                        </div>
                      </>
                    ) : sub.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchases Sub-Section */}
      <div id="purchases">
        <h3 className="profile-subsection-title">Purchases</h3>
        <div className="profile-subscription-list">
          {PURCHASES.map(p => {
            const enabled = !!purchases[p.id];
            const expanded = expandedCard === p.id;
            const isBundle = !!p.isBundle;
            return (
              <div key={p.id} className={`profile-subscription-card${enabled ? ' active' : ''}${expanded ? ' expanded' : ''}${isBundle ? ' profile-purchase-bundle' : ''}`}>
                <div className="profile-subscription-row" onClick={() => setExpandedCard(expanded ? null : p.id)}>
                  <span className="profile-subscription-icon">{p.icon}</span>
                  <div className="profile-subscription-info">
                    <div className="profile-subscription-name">{p.name}{isBundle && <span className="profile-bundle-badge">Bundle</span>}</div>
                    <div className="profile-subscription-desc">{p.description}</div>
                  </div>
                  <span className="profile-subscription-action" onClick={e => e.stopPropagation()}>
                    {enabled ? (
                      <span className="profile-stripe-status active">Purchased</span>
                    ) : p.donation ? (
                      <span className="profile-donation-row">
                        <span className="profile-donation-input-wrap">
                          <span className="profile-donation-dollar">$</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="10"
                            className="profile-donation-input"
                            value={donationAmount}
                            onChange={e => setDonationAmount(e.target.value)}
                          />
                        </span>
                        <button
                          className="profile-stripe-btn purchase"
                          disabled={checkoutLoading === p.id || !donationAmount}
                          onClick={async () => {
                            const cents = Math.round(Number(donationAmount) * 100);
                            if (cents < 100) return;
                            setCheckoutLoading(p.id);
                            try { await initiateCheckout(p.id, { donationAmount: cents, ...(launchKey ? { launchKey } : {}) }); } catch {}
                            setCheckoutLoading(null);
                          }}
                        >
                          {checkoutLoading === p.id ? '...' : 'Donate'}
                        </button>
                      </span>
                    ) : (
                      <button
                        className="profile-stripe-btn purchase"
                        disabled={checkoutLoading === p.id}
                        onClick={async () => {
                          setCheckoutLoading(p.id);
                          try { await initiateCheckout(p.id, launchKey ? { launchKey } : {}); } catch {}
                          setCheckoutLoading(null);
                        }}
                      >
                        {checkoutLoading === p.id ? '...' : p.price ? `Buy ${p.price}` : 'Buy'}
                      </button>
                    )}
                  </span>
                </div>
                {expanded && (
                  <div className="profile-subscription-details">
                    {p.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout success banner */}
      {checkoutSuccess && (
        <div className="profile-checkout-success">
          Payment successful! Your access is being activated...
        </div>
      )}

      {/* Billing & Payment Methods */}
      <div className="profile-billing-section">
        <h3 className="profile-subsection-title">Billing & Payment Methods</h3>
        {hasStripeAccount ? (
          <div className="profile-billing-card">
            <div className="profile-billing-info">
              <span className="profile-billing-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </span>
              <span className="profile-billing-text">Payment method on file</span>
            </div>
            <button className="profile-stripe-btn billing" onClick={openBillingPortal}>
              Manage Billing
            </button>
          </div>
        ) : (
          <div className="profile-billing-card">
            <div className="profile-billing-info">
              <span className="profile-billing-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </span>
              <span className="profile-billing-text">No payment method on file</span>
            </div>
            <span className="profile-billing-hint">A payment method will be saved when you make your first purchase.</span>
          </div>
        )}
      </div>

      {/* Active Courses */}
      <h2 className="profile-section-title">Courses</h2>
      {activeCourses.length === 0 ? (
        <div className="profile-empty">No courses are currently active.</div>
      ) : (
        <div className="profile-course-list">
          {/* In-progress courses first */}
          {inProgress.map(course => (
            <CourseCard key={course.id} course={course} status="in-progress" />
          ))}
          {/* Completed courses */}
          {completed.map(course => (
            <CourseCard key={course.id} course={course} status="completed" onDownloadCert={handleDownloadCertificate} certDownloading={certDownloading} />
          ))}
          {/* Not started */}
          {notStarted.map(course => (
            <CourseCard key={course.id} course={course} status="not-started" />
          ))}
        </div>
      )}

      {/* Friends Section */}
      <FriendsSection />

      {/* My Sacred Sites (Pilgrimages) */}
      <h2 className="profile-section-title">My Sacred Sites</h2>
      {pilgrimagesLoaded && (() => {
        const entries = Object.values(pilgrimages || {}).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        const catLabels = { 'sacred-site': 'Sacred Site', 'mythic-location': 'Mythic Location', 'literary-location': 'Literary Location', temple: 'Temple', library: 'Library' };
        if (entries.length === 0) {
          return (
            <div className="profile-empty">
              No sacred sites saved yet. Visit <button className="profile-update-btn" style={{ display: 'inline', padding: '4px 12px', fontSize: '0.85em' }} onClick={() => navigate('/mythic-earth')}>Mythic Earth</button> to begin your pilgrimage.
            </div>
          );
        }
        return (
          <div className="profile-course-list">
            {entries.map(site => (
              <div key={site.siteId} className="profile-course-card" onClick={() => navigate('/mythic-earth')} style={{ cursor: 'pointer' }}>
                <div className="profile-course-header">
                  <span className="profile-course-name">{site.name}</span>
                  <span className="profile-course-badge completed">
                    {catLabels[site.category] || site.category}
                  </span>
                </div>
                <div className="profile-course-desc">
                  {site.region}{site.pantheons?.length > 0 ? ` \u00B7 ${site.pantheons.join(', ')}` : ''} {'\u00B7'} Added {new Date(site.addedAt).toLocaleDateString()}
                </div>
                <button
                  className="profile-update-btn"
                  style={{ marginTop: '6px', fontSize: '0.75rem', padding: '3px 10px' }}
                  onClick={(e) => { e.stopPropagation(); removePilgrimage(site.siteId); }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      })()}

      {/* AI Settings (BYOK) */}
      <h2 className="profile-section-title">AI Settings</h2>
      <div className="profile-ai-settings">
        <p className="profile-ai-settings-desc">
          Add your own API keys to use premium AI models with no rate limits. Keys are stored securely and only accessible by you.
        </p>

        {/* Anthropic Key */}
        <div className="profile-api-key-row">
          <div className="profile-api-key-label">Anthropic</div>
          {hasAnthropicKey ? (
            <div className="profile-api-key-saved">
              <span className="profile-api-key-masked">
                {apiKeys.anthropicKey.slice(0, 7)}{'•'.repeat(8)}{apiKeys.anthropicKey.slice(-4)}
              </span>
              <button
                className="profile-api-key-remove-btn"
                disabled={keySaving === 'anthropicKey'}
                onClick={async () => {
                  setKeySaving('anthropicKey');
                  await removeApiKey('anthropicKey');
                  setKeySaving(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="profile-api-key-input-row">
              <input
                className="profile-api-key-input"
                type="password"
                placeholder="sk-ant-api03-..."
                value={anthropicKeyInput}
                onChange={e => setAnthropicKeyInput(e.target.value)}
              />
              <button
                className="profile-api-key-save-btn"
                disabled={!anthropicKeyInput.startsWith('sk-ant-') || keySaving === 'anthropicKey'}
                onClick={async () => {
                  setKeySaving('anthropicKey');
                  await saveApiKey('anthropicKey', anthropicKeyInput);
                  setAnthropicKeyInput('');
                  setKeySaving(null);
                }}
              >
                {keySaving === 'anthropicKey' ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* OpenAI Key */}
        <div className="profile-api-key-row">
          <div className="profile-api-key-label">OpenAI</div>
          {hasOpenaiKey ? (
            <div className="profile-api-key-saved">
              <span className="profile-api-key-masked">
                {apiKeys.openaiKey.slice(0, 5)}{'•'.repeat(8)}{apiKeys.openaiKey.slice(-4)}
              </span>
              <button
                className="profile-api-key-remove-btn"
                disabled={keySaving === 'openaiKey'}
                onClick={async () => {
                  setKeySaving('openaiKey');
                  await removeApiKey('openaiKey');
                  setKeySaving(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="profile-api-key-input-row">
              <input
                className="profile-api-key-input"
                type="password"
                placeholder="sk-..."
                value={openaiKeyInput}
                onChange={e => setOpenaiKeyInput(e.target.value)}
              />
              <button
                className="profile-api-key-save-btn"
                disabled={!openaiKeyInput.startsWith('sk-') || keySaving === 'openaiKey'}
                onClick={async () => {
                  setKeySaving('openaiKey');
                  await saveApiKey('openaiKey', openaiKeyInput);
                  setOpenaiKeyInput('');
                  setKeySaving(null);
                }}
              >
                {keySaving === 'openaiKey' ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Install App */}
      {!appInstalled && (
        <div className="profile-install-app-section">
          <h2 className="profile-section-title">Get the App</h2>

          <div className="profile-install-card">
            <div className="profile-install-card-header">
              <img src="/logo192.png" alt="Mythouse" className="profile-install-card-icon" />
              <div className="profile-install-card-info">
                <div className="profile-install-card-name">Mythouse</div>
                <div className="profile-install-card-tagline">The Story Atlas</div>
                <div className="profile-install-card-meta">Free &middot; Works offline &middot; Always up to date</div>
              </div>
            </div>

            {/* Primary action — native install or store links */}
            {installPrompt ? (
              <button className="profile-install-card-btn" onClick={handleInstallClick}>Install</button>
            ) : APP_STORE_URL || PLAY_STORE_URL ? (
              <div className="profile-install-card-stores">
                {APP_STORE_URL && (
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="profile-install-store-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    App Store
                  </a>
                )}
                {PLAY_STORE_URL && (
                  <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="profile-install-store-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3.61 1.84L13.73 12 3.61 22.16c-.36-.32-.61-.81-.61-1.41V3.25c0-.6.25-1.09.61-1.41m.72-.55l11.1 6.38L12.8 10.3 4.33 1.29m0 21.42l8.47-9.01 2.63 2.63-11.1 6.38m15.65-9.2l-3.53 2.03-2.9-2.9 2.9-2.9 3.53 2.03c.98.56.98 1.18 0 1.74z"/></svg>
                    Google Play
                  </a>
                )}
              </div>
            ) : (
              <button className="profile-install-card-btn" onClick={() => setShowInstallGuide(true)}>Install</button>
            )}

            <div className="profile-install-card-features">
              <span>Full-screen experience</span>
              <span>&middot;</span>
              <span>Home screen icon</span>
              <span>&middot;</span>
              <span>All devices</span>
            </div>
          </div>

          {/* Install guide popup */}
          {showInstallGuide && !installPrompt && (
            <div className="profile-install-guide-overlay" onClick={() => setShowInstallGuide(false)}>
              <div className="profile-install-guide" onClick={e => e.stopPropagation()}>
                <button className="profile-install-guide-close" onClick={() => setShowInstallGuide(false)}>&times;</button>

                <div className="profile-install-guide-header">
                  <img src="/logo192.png" alt="Mythouse" className="profile-install-guide-icon" />
                  <div>
                    <h3>Mythouse</h3>
                    <p className="profile-install-guide-intro">Install the app on this device</p>
                  </div>
                </div>

                <div className="profile-install-guide-section">
                  <div className="profile-install-guide-label">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                    Desktop
                  </div>
                  <div className="profile-install-guide-options">
                    <div className="profile-install-guide-option">
                      <span className="profile-install-guide-browser">Chrome / Edge</span>
                      <span>Click the <strong>install icon</strong> in the address bar, or menu &rarr; <strong>Install Mythouse</strong></span>
                    </div>
                    <div className="profile-install-guide-option">
                      <span className="profile-install-guide-browser">Safari</span>
                      <span><strong>File</strong> menu &rarr; <strong>Add to Dock</strong></span>
                    </div>
                  </div>
                </div>

                <div className="profile-install-guide-section">
                  <div className="profile-install-guide-label">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                    iPhone / iPad
                  </div>
                  <div className="profile-install-guide-options">
                    <div className="profile-install-guide-option">
                      <span>{APP_STORE_URL ? <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"><strong>Download from the App Store</strong></a> : <>In Safari, tap <strong>Share</strong> &rarr; <strong>Add to Home Screen</strong> &rarr; <strong>Add</strong></>}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-install-guide-section">
                  <div className="profile-install-guide-label">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                    Android
                  </div>
                  <div className="profile-install-guide-options">
                    <div className="profile-install-guide-option">
                      <span>{PLAY_STORE_URL ? <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"><strong>Download from Google Play</strong></a> : <>In Chrome, tap <strong>menu</strong> &rarr; <strong>Install app</strong></>}</span>
                    </div>
                  </div>
                </div>

                <p className="profile-install-guide-note">Same app everywhere. Always up to date — no store updates needed.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sign Out */}
      <div className="profile-signout-section">
        <button className="profile-signout-btn" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function MentorSection({ effectiveMentorStatus, mentorEligible, qualifiedMentorTypes, mentorData, mentorCoursesComplete, completedCourses, allCourses, showMentorChat, setShowMentorChat, showConsultingChat, setShowConsultingChat, pairingCategories, updateMentorBio, updateMentorCapacity, publishToDirectory, unpublishFromDirectory, respondToPairing, endPairing, consultingData, consultingCategories, onConsultingAccept, onConsultingDecline, consultingRespondingId }) {
  const display = getMentorDisplay(mentorData);
  const courseChecklist = getMentorCourseChecklist(completedCourses);
  const navigate = useNavigate();

  // Bio editor state
  const [bioText, setBioText] = useState(mentorData?.bio || '');
  const [bioSaving, setBioSaving] = useState(false);
  const [capValue, setCapValue] = useState(mentorData?.capacity || DEFAULT_MENTOR_CAPACITY);
  const [capSaving, setCapSaving] = useState(false);
  const [dirToggling, setDirToggling] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  // Sync bio/capacity from mentorData when it changes
  useEffect(() => {
    setBioText(mentorData?.bio || '');
    setCapValue(mentorData?.capacity || DEFAULT_MENTOR_CAPACITY);
  }, [mentorData?.bio, mentorData?.capacity]);

  const handleBioSave = async () => {
    setBioSaving(true);
    try { await updateMentorBio(bioText); } catch {}
    setBioSaving(false);
  };

  const handleCapSave = async () => {
    setCapSaving(true);
    try { await updateMentorCapacity(capValue); } catch {}
    setCapSaving(false);
  };

  const handleDirectoryToggle = async () => {
    setDirToggling(true);
    try {
      if (mentorData?.directoryListed) {
        await unpublishFromDirectory();
      } else {
        await publishToDirectory();
      }
    } catch {}
    setDirToggling(false);
  };

  const handleAccept = async (pairingId) => {
    setRespondingId(pairingId);
    try { await respondToPairing(pairingId, true); } catch {}
    setRespondingId(null);
  };

  const handleDecline = async (pairingId) => {
    setRespondingId(pairingId);
    try { await respondToPairing(pairingId, false); } catch {}
    setRespondingId(null);
  };

  const handleEnd = async (pairingId) => {
    setRespondingId(pairingId);
    try { await endPairing(pairingId); } catch {}
    setRespondingId(null);
  };

  return (
    <>
      <h2 id="section-mentorship" className="profile-section-title">Mentorship</h2>

      {effectiveMentorStatus === MENTOR_STATUS.NOT_QUALIFIED && !mentorEligible && (
        <div className="profile-empty">
          Mentor roles require Level 2+ credentials. Continue building your profile to unlock mentorship opportunities.
        </div>
      )}

      {effectiveMentorStatus === MENTOR_STATUS.NOT_QUALIFIED && mentorEligible && !mentorData && (
        <>
          <div className="mentor-eligible">
            <p>You qualify for the following mentor roles:</p>
            <div className="mentor-type-list">
              {qualifiedMentorTypes.map(mt => (
                <div key={mt.id} className="mentor-type-card">
                  <span className="mentor-badge-icon">{mt.icon}</span>
                  <div>
                    <div className="mentor-badge-title">{mt.title}</div>
                    <div className="profile-credential-details">
                      Based on {mt.credentialName} (Level {mt.credentialLevel})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {showMentorChat ? (
            <MentorApplicationChat
              onComplete={() => setShowMentorChat(false)}
              qualifiedMentorTypes={qualifiedMentorTypes}
            />
          ) : (
            <button className="profile-setup-btn" onClick={() => setShowMentorChat(true)}>
              Apply to Become a Mentor
            </button>
          )}
        </>
      )}

      {effectiveMentorStatus === MENTOR_STATUS.APPLIED && display && (
        <div className="mentor-status-card pending">
          <span className="mentor-badge-icon">{display.icon}</span>
          <div>
            <div className="mentor-badge-title">{display.title}</div>
            <div className="profile-credential-details">Application submitted. Atlas is reviewing your application.</div>
          </div>
        </div>
      )}

      {effectiveMentorStatus === MENTOR_STATUS.PENDING_ADMIN && display && (
        <div className="mentor-status-card pending">
          <span className="mentor-badge-icon">{display.icon}</span>
          <div>
            <div className="mentor-badge-title">{display.title}</div>
            <div className="profile-credential-details">Passed initial screening. Awaiting final review by administration.</div>
          </div>
        </div>
      )}

      {effectiveMentorStatus === MENTOR_STATUS.APPROVED && display && (
        <div className="mentor-status-card approved">
          <span className="mentor-badge-icon">{display.icon}</span>
          <div>
            <div className="mentor-badge-title">{display.title} — Approved</div>
            {!mentorData?.mentorContractAccepted && (
              <div className="profile-credential-details" style={{ color: 'var(--accent-gold)', marginBottom: 8 }}>
                Please review and accept the Mentor Agreement to continue.
              </div>
            )}
            {!mentorCoursesComplete && (
              <>
                <div className="profile-credential-details">Complete these courses to activate your mentor status:</div>
                <ul className="mentor-course-checklist">
                  {courseChecklist.map(item => {
                    const course = allCourses.find(c => c.id === item.id);
                    return (
                      <li key={item.id} className={item.complete ? 'done' : ''}>
                        {item.complete ? '\u2713' : '\u25CB'} {course?.name || item.id}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {effectiveMentorStatus === MENTOR_STATUS.ACTIVE && display && (
        <>
          <div className="mentor-status-card active">
            <span className="mentor-badge-icon">{display.icon}</span>
            <div>
              <div className="mentor-badge-title">{display.title}</div>
              <div className="profile-credential-details">Active mentor</div>
            </div>
          </div>

          {/* Bio editor */}
          <div className="mentor-bio-editor">
            <label className="mentor-bio-label">Public Bio</label>
            <textarea
              className="mentor-bio-textarea"
              value={bioText}
              onChange={e => setBioText(e.target.value)}
              maxLength={MAX_MENTOR_BIO_LENGTH}
              rows={4}
              placeholder="Write a short bio for students to see..."
            />
            <div className="mentor-bio-footer">
              <span className="mentor-bio-charcount">{bioText.length}/{MAX_MENTOR_BIO_LENGTH}</span>
              <button className="mentor-bio-save-btn" onClick={handleBioSave} disabled={bioSaving || bioText === (mentorData?.bio || '')}>
                {bioSaving ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          </div>

          {/* Capacity setter */}
          <div className="mentor-capacity-control">
            <label className="mentor-capacity-label">Max Students</label>
            <div className="mentor-capacity-row">
              <input
                type="number"
                className="mentor-capacity-input"
                value={capValue}
                min={1}
                max={MAX_MENTOR_CAPACITY}
                onChange={e => setCapValue(Math.max(1, Math.min(MAX_MENTOR_CAPACITY, parseInt(e.target.value, 10) || 1)))}
              />
              <button className="mentor-capacity-save-btn" onClick={handleCapSave} disabled={capSaving || capValue === (mentorData?.capacity || DEFAULT_MENTOR_CAPACITY)}>
                {capSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Directory toggle */}
          <div className="mentor-directory-toggle">
            <label className="profile-subscription-toggle" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!mentorData?.directoryListed}
                onChange={handleDirectoryToggle}
                disabled={dirToggling}
              />
              <span className="profile-subscription-slider" />
            </label>
            <span className="mentor-directory-toggle-label">
              {dirToggling ? 'Updating...' : 'List in Mentor Directory'}
            </span>
          </div>

          {/* Enter the Guild button */}
          <button className="profile-setup-btn" onClick={() => navigate('/guild')} style={{ marginTop: 12 }}>
            Enter the Guild
          </button>

          {/* Teacher Mode button */}
          {effectiveMentorStatus === MENTOR_STATUS.ACTIVE && (
            <button className="profile-setup-btn" onClick={() => navigate('/teacher')} style={{ marginTop: 8 }}>
              Teacher Mode
            </button>
          )}

          {/* Consulting Setup */}
          <div className="guild-consulting-section" style={{ marginTop: 16 }}>
            <h3 className="profile-subsection-title">Consulting</h3>
            {showConsultingChat ? (
              <ConsultingSetupChat onComplete={() => setShowConsultingChat(false)} />
            ) : consultingData ? (
              <div className="consulting-profile-summary">
                <div className="profile-credential-details">
                  {(consultingData.projects || []).length} project{(consultingData.projects || []).length !== 1 ? 's' : ''} registered
                  {(consultingData.consultingTypes || []).length > 0 && (
                    <span> in {consultingData.consultingTypes.map(t => t).join(', ')}</span>
                  )}
                </div>
              </div>
            ) : (
              <button className="profile-setup-btn" onClick={() => setShowConsultingChat(true)}>
                Set Up Consulting Profile
              </button>
            )}
          </div>

          {/* Consulting Requests (incoming) */}
          {consultingCategories.incomingPending.length > 0 && (
            <div className="mentor-pending-section" style={{ marginTop: 16 }}>
              <h3 className="profile-subsection-title">Consulting Requests</h3>
              {consultingCategories.incomingPending.map(r => (
                <div key={r.id} className="consulting-request-card">
                  <div className="mentor-request-card-header">
                    <span className="mentor-request-card-handle">@{r.requesterHandle || 'anonymous'}</span>
                    {r.consultingType && <span className="profile-credential-details"> ({r.consultingType})</span>}
                  </div>
                  {r.message && <div className="mentor-request-card-message">{r.message}</div>}
                  <div className="mentor-request-card-actions">
                    <button className="mentor-accept-btn" onClick={() => onConsultingAccept(r.id)} disabled={consultingRespondingId === r.id}>
                      {consultingRespondingId === r.id ? '...' : 'Accept'}
                    </button>
                    <button className="mentor-decline-btn" onClick={() => onConsultingDecline(r.id)} disabled={consultingRespondingId === r.id}>
                      {consultingRespondingId === r.id ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Requests */}
          {pairingCategories.pendingRequests.length > 0 && (
            <div className="mentor-pending-section">
              <h3 className="profile-subsection-title">Pending Student Requests</h3>
              {pairingCategories.pendingRequests.map(p => (
                <div key={p.id} className="mentor-request-card">
                  <div className="mentor-request-card-header">
                    <span className="mentor-request-card-handle">@{p.studentHandle || 'anonymous'}</span>
                  </div>
                  {p.requestMessage && (
                    <div className="mentor-request-card-message">{p.requestMessage}</div>
                  )}
                  <div className="mentor-request-card-actions">
                    <button className="mentor-accept-btn" onClick={() => handleAccept(p.id)} disabled={respondingId === p.id}>
                      {respondingId === p.id ? '...' : 'Accept'}
                    </button>
                    <button className="mentor-decline-btn" onClick={() => handleDecline(p.id)} disabled={respondingId === p.id}>
                      {respondingId === p.id ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Students */}
          {pairingCategories.activeStudents.length > 0 && (
            <div className="mentor-students-section">
              <h3 className="profile-subsection-title">Active Students</h3>
              {pairingCategories.activeStudents.map(p => (
                <div key={p.id} className="mentor-student-card">
                  <span className="mentor-student-card-handle">@{p.studentHandle || 'anonymous'}</span>
                  <button className="mentor-end-btn" onClick={() => handleEnd(p.id)} disabled={respondingId === p.id}>
                    {respondingId === p.id ? '...' : 'End Mentorship'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {effectiveMentorStatus === MENTOR_STATUS.REJECTED && display && (
        <>
          <div className="mentor-status-card rejected">
            <span className="mentor-badge-icon">{display.icon}</span>
            <div>
              <div className="mentor-badge-title">{display.title}</div>
              <div className="profile-credential-details">
                {mentorData?.rejectionReason || 'Your application was not approved at this time.'}
              </div>
            </div>
          </div>
          {mentorEligible && !showMentorChat && (
            <button className="profile-update-btn" onClick={() => setShowMentorChat(true)}>
              Re-Apply
            </button>
          )}
          {showMentorChat && (
            <MentorApplicationChat
              onComplete={() => setShowMentorChat(false)}
              qualifiedMentorTypes={qualifiedMentorTypes}
            />
          )}
        </>
      )}

      {/* My Mentors — for all users */}
      <div className="my-mentors-section">
        {pairingCategories.myMentors.length > 0 && (
          <>
            <h3 className="profile-subsection-title">My Mentors</h3>
            {pairingCategories.myMentors.map(p => (
              <div key={p.id} className="my-mentors-card">
                <span className="my-mentors-card-icon">{MENTOR_TYPES[p.mentorType]?.icon || ''}</span>
                <span className="my-mentors-card-handle">@{p.mentorHandle || 'anonymous'}</span>
                <span className="my-mentors-card-type">{MENTOR_TYPES[p.mentorType]?.title || p.mentorType}</span>
                <button className="mentor-end-btn" onClick={() => handleEnd(p.id)} disabled={respondingId === p.id}>
                  {respondingId === p.id ? '...' : 'End'}
                </button>
              </div>
            ))}
          </>
        )}
        {pairingCategories.pendingApplications.length > 0 && (
          <>
            <h3 className="profile-subsection-title">Pending Mentor Requests</h3>
            {pairingCategories.pendingApplications.map(p => (
              <div key={p.id} className="my-mentors-card pending">
                <span className="my-mentors-card-handle">@{p.mentorHandle || 'anonymous'}</span>
                <span className="my-mentors-card-status">Pending</span>
              </div>
            ))}
          </>
        )}
        <button className="profile-update-btn" onClick={() => navigate('/mentors')} style={{ marginTop: 12 }}>
          Browse Mentor Directory
        </button>
      </div>
    </>
  );
}

function CourseCard({ course, status, onDownloadCert, certDownloading }) {
  const pct = Math.round(course.progress * 100);

  return (
    <div className={`profile-course-card${status === 'completed' ? ' completed' : ''}`}>
      <div className="profile-course-header">
        <span className="profile-course-name">{course.name}</span>
        <span className={`profile-course-badge ${status}`}>
          {status === 'completed' ? 'Completed' : status === 'in-progress' ? `${pct}%` : 'Not Started'}
        </span>
      </div>
      <div className="profile-course-desc">{course.description}</div>

      {status !== 'completed' && (
        <>
          <div className="profile-progress-bar">
            <div
              className="profile-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="profile-progress-text">{pct}% complete</div>
        </>
      )}

      {status === 'completed' && (
        <div className="profile-progress-bar">
          <div className="profile-progress-fill complete" style={{ width: '100%' }} />
        </div>
      )}

      {/* Requirements breakdown */}
      <ul className="profile-req-list">
        {course.requirements.map(req => {
          const isComplete = !course.incompleteRequirements.find(r => r.id === req.id);
          const incomplete = course.incompleteRequirements.find(r => r.id === req.id);
          return (
            <li key={req.id} className={`profile-req-item${isComplete ? ' done' : ''}`}>
              {req.description}
              {!isComplete && incomplete && (
                <span className="profile-req-progress">
                  ({Math.round(incomplete.progress * 100)}%)
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {status === 'completed' && onDownloadCert && (
        <button
          className="profile-cert-download-btn"
          disabled={certDownloading === course.id}
          onClick={() => onDownloadCert(course)}
        >
          {certDownloading === course.id ? 'Generating...' : 'Download Certificate'}
        </button>
      )}
    </div>
  );
}

const ZODIAC_SYMBOLS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264A', Cancer: '\u264B',
  Leo: '\u264C', Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const PLANET_SYMBOLS = {
  Sun: '\u2609', Moon: '\u263D', Mercury: '\u263F', Venus: '\u2640',
  Mars: '\u2642', Jupiter: '\u2643', Saturn: '\u2644',
};

const PLANET_METALS = {
  Sun: 'Gold', Moon: 'Silver', Mercury: 'Quicksilver', Venus: 'Copper',
  Mars: 'Iron', Jupiter: 'Tin', Saturn: 'Lead',
};

const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function toSiderealSign(tropicalLon, birthYear) {
  const ayanamsa = 24.1 + (birthYear - 2024) * 0.0139;
  const siderealLon = ((tropicalLon - ayanamsa) % 360 + 360) % 360;
  const signIndex = Math.floor(siderealLon / 30);
  const degree = +(siderealLon % 30).toFixed(1);
  return { sign: SIGN_NAMES[signIndex], degree };
}

const CHINESE_ANIMAL_EMOJIS = {
  Rat: '🐀', Ox: '🐂', Tiger: '🐅', Rabbit: '🐇', Dragon: '🐉', Snake: '🐍',
  Horse: '🐎', Goat: '🐐', Monkey: '🐒', Rooster: '🐓', Dog: '🐕', Pig: '🐖',
};

const CHINESE_ELEMENT_COLORS = {
  Wood: '#4a9e5c', Fire: '#d4483b', Earth: '#c9a961', Metal: '#b0b8c4', Water: '#4a8fa8',
};

const CHINESE_COMPATIBLES = {
  Rat: ['Dragon', 'Monkey', 'Ox'], Ox: ['Snake', 'Rooster', 'Rat'],
  Tiger: ['Horse', 'Dog', 'Pig'], Rabbit: ['Goat', 'Pig', 'Dog'],
  Dragon: ['Rat', 'Monkey', 'Rooster'], Snake: ['Ox', 'Rooster', 'Monkey'],
  Horse: ['Tiger', 'Dog', 'Goat'], Goat: ['Rabbit', 'Horse', 'Pig'],
  Monkey: ['Rat', 'Dragon', 'Snake'], Rooster: ['Ox', 'Snake', 'Dragon'],
  Dog: ['Tiger', 'Rabbit', 'Horse'], Pig: ['Rabbit', 'Goat', 'Tiger'],
};

const CHINESE_INCOMPATIBLES = {
  Rat: 'Horse', Ox: 'Goat', Tiger: 'Monkey', Rabbit: 'Rooster',
  Dragon: 'Dog', Snake: 'Pig', Horse: 'Rat', Goat: 'Ox',
  Monkey: 'Tiger', Rooster: 'Rabbit', Dog: 'Dragon', Pig: 'Snake',
};

const CHINESE_TRAITS = {
  Rat: 'Quick-witted, resourceful, versatile, kind',
  Ox: 'Diligent, dependable, strong, determined',
  Tiger: 'Brave, competitive, unpredictable, confident',
  Rabbit: 'Quiet, elegant, kind, responsible',
  Dragon: 'Confident, intelligent, enthusiastic, ambitious',
  Snake: 'Enigmatic, intelligent, wise, graceful',
  Horse: 'Animated, active, energetic, free-spirited',
  Goat: 'Calm, gentle, creative, compassionate',
  Monkey: 'Sharp, smart, curious, mischievous',
  Rooster: 'Observant, hardworking, courageous, honest',
  Dog: 'Loyal, honest, amiable, prudent',
  Pig: 'Compassionate, generous, diligent, warm',
};

const CHINESE_ELEMENT_TRAITS = {
  Wood: 'Growth, creativity, flexibility, generosity',
  Fire: 'Passion, dynamism, warmth, leadership',
  Earth: 'Stability, patience, nurturing, practicality',
  Metal: 'Determination, strength, ambition, discipline',
  Water: 'Wisdom, intuition, adaptability, diplomacy',
};

const CHINESE_FIXED_ELEMENT = {
  Rat: 'Water', Ox: 'Earth', Tiger: 'Wood', Rabbit: 'Wood',
  Dragon: 'Earth', Snake: 'Fire', Horse: 'Fire', Goat: 'Earth',
  Monkey: 'Metal', Rooster: 'Metal', Dog: 'Earth', Pig: 'Water',
};

const CHINESE_LUCKY = {
  Rat:     { numbers: [2, 3], colors: ['Blue', 'Gold', 'Green'], flower: 'Lily' },
  Ox:      { numbers: [1, 4], colors: ['White', 'Yellow', 'Green'], flower: 'Tulip' },
  Tiger:   { numbers: [1, 3, 4], colors: ['Blue', 'Grey', 'Orange'], flower: 'Cineraria' },
  Rabbit:  { numbers: [3, 4, 6], colors: ['Red', 'Pink', 'Purple'], flower: 'Plantain Lily' },
  Dragon:  { numbers: [1, 6, 7], colors: ['Gold', 'Silver', 'Grey'], flower: 'Bleeding Heart' },
  Snake:   { numbers: [2, 8, 9], colors: ['Black', 'Red', 'Yellow'], flower: 'Orchid' },
  Horse:   { numbers: [2, 3, 7], colors: ['Yellow', 'Green', 'Purple'], flower: 'Jasmine' },
  Goat:    { numbers: [2, 7], colors: ['Brown', 'Red', 'Purple'], flower: 'Carnation' },
  Monkey:  { numbers: [4, 9], colors: ['White', 'Blue', 'Gold'], flower: 'Chrysanthemum' },
  Rooster: { numbers: [5, 7, 8], colors: ['Gold', 'Brown', 'Yellow'], flower: 'Gladiolus' },
  Dog:     { numbers: [3, 4, 9], colors: ['Red', 'Green', 'Purple'], flower: 'Rose' },
  Pig:     { numbers: [2, 5, 8], colors: ['Yellow', 'Grey', 'Brown'], flower: 'Hydrangea' },
};

const HEAVENLY_STEMS = [
  { name: 'Jiǎ', char: '甲', element: 'Wood', polarity: 'Yang' },
  { name: 'Yǐ',  char: '乙', element: 'Wood', polarity: 'Yin' },
  { name: 'Bǐng', char: '丙', element: 'Fire', polarity: 'Yang' },
  { name: 'Dīng', char: '丁', element: 'Fire', polarity: 'Yin' },
  { name: 'Wù',  char: '戊', element: 'Earth', polarity: 'Yang' },
  { name: 'Jǐ',  char: '己', element: 'Earth', polarity: 'Yin' },
  { name: 'Gēng', char: '庚', element: 'Metal', polarity: 'Yang' },
  { name: 'Xīn', char: '辛', element: 'Metal', polarity: 'Yin' },
  { name: 'Rén', char: '壬', element: 'Water', polarity: 'Yang' },
  { name: 'Guǐ', char: '癸', element: 'Water', polarity: 'Yin' },
];

const EARTHLY_BRANCHES = [
  { name: 'Zǐ',  char: '子', animal: 'Rat' },
  { name: 'Chǒu', char: '丑', animal: 'Ox' },
  { name: 'Yín', char: '寅', animal: 'Tiger' },
  { name: 'Mǎo', char: '卯', animal: 'Rabbit' },
  { name: 'Chén', char: '辰', animal: 'Dragon' },
  { name: 'Sì',  char: '巳', animal: 'Snake' },
  { name: 'Wǔ',  char: '午', animal: 'Horse' },
  { name: 'Wèi', char: '未', animal: 'Goat' },
  { name: 'Shēn', char: '申', animal: 'Monkey' },
  { name: 'Yǒu', char: '酉', animal: 'Rooster' },
  { name: 'Xū',  char: '戌', animal: 'Dog' },
  { name: 'Hài', char: '亥', animal: 'Pig' },
];

// Inner animal from birth month (approximate solar month mapping)
const MONTH_ANIMALS = ['Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig','Rat'];
// Secret animal from birth hour (2-hour periods starting at 23:00)
const HOUR_ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];

function getChineseDetails(birthData) {
  const year = birthData?.year || 2000;
  const month = birthData?.month || 1;
  const hour = birthData?.hour;

  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  const stem = HEAVENLY_STEMS[stemIdx];
  const branch = EARTHLY_BRANCHES[branchIdx];

  const innerAnimal = MONTH_ANIMALS[(month - 1) % 12];

  let secretAnimal = null;
  if (hour !== null && hour !== undefined && hour >= 0) {
    const hourIdx = Math.floor(((hour + 1) % 24) / 2);
    secretAnimal = HOUR_ANIMALS[hourIdx];
  }

  return { stem, branch, innerAnimal, secretAnimal };
}

function NumerologyDisplay({ savedName, displayName, onSave, luckyNumber, onSaveLucky }) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingLucky, setEditingLucky] = useState(false);
  const [luckyInput, setLuckyInput] = useState('');

  const activeName = savedName || displayName || '';
  const result = activeName ? computeNumerology(activeName) : null;

  const handleCalculate = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setEditing(false);
    setNameInput('');
  };

  const handleSaveLucky = () => {
    const val = parseInt(luckyInput, 10);
    if (isNaN(val) || val < 1) return;
    onSaveLucky(val);
    setEditingLucky(false);
    setLuckyInput('');
  };

  const luckyMeaning = luckyNumber ? NUMBER_MEANINGS[luckyNumber] || NUMBER_MEANINGS[((luckyNumber - 1) % 9) + 1] : null;

  return (
    <div className="numerology-display">
      {result ? (
        <>
          <div className="numerology-name-row">
            <span className="numerology-current-name">{activeName}</span>
            {!editing && (
              <button className="numerology-change-btn" onClick={() => { setEditing(true); setNameInput(activeName); }}>
                {savedName ? 'Change Name' : 'Enter Full Name'}
              </button>
            )}
          </div>
          {!savedName && !editing && (
            <div className="numerology-hint">Use your full desired name for accuracy.</div>
          )}
          {editing && (
            <div className="numerology-input-row">
              <input
                className="numerology-input-field"
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                placeholder="Full name..."
                autoFocus
              />
              <button className="numerology-calc-btn" onClick={handleCalculate} disabled={!nameInput.trim()}>Calculate</button>
              <button className="numerology-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
          <div className="numerology-cards">
            {['expression', 'soulUrge', 'personality'].map(key => (
              <div key={key} className="numerology-card">
                <div className="numerology-card-number">{result[key]}</div>
                <div className="numerology-card-label">{NUMBER_TYPES[key].label}</div>
                <div className="numerology-card-subtitle">{NUMBER_TYPES[key].subtitle}</div>
                <div className="numerology-card-meaning">{NUMBER_MEANINGS[result[key]]}</div>
              </div>
            ))}
            <div className="numerology-card numerology-card-lucky">
              {luckyNumber && !editingLucky ? (
                <>
                  <div className="numerology-card-number">{luckyNumber}</div>
                  <div className="numerology-card-label">Lucky Number</div>
                  <div className="numerology-card-subtitle">Your personal talisman</div>
                  <div className="numerology-card-meaning">{luckyMeaning}</div>
                  <button className="numerology-lucky-edit" onClick={() => { setEditingLucky(true); setLuckyInput(String(luckyNumber)); }}>Change</button>
                </>
              ) : editingLucky ? (
                <>
                  <div className="numerology-card-label" style={{ marginBottom: 6 }}>Lucky Number</div>
                  <div className="numerology-input-row" style={{ flexDirection: 'column', gap: 6 }}>
                    <input
                      className="numerology-input-field"
                      type="number"
                      min="1"
                      value={luckyInput}
                      onChange={e => setLuckyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveLucky()}
                      placeholder="Your number..."
                      autoFocus
                      style={{ textAlign: 'center' }}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button className="numerology-calc-btn" onClick={handleSaveLucky} disabled={!luckyInput || isNaN(parseInt(luckyInput, 10))}>Save</button>
                      <button className="numerology-cancel-btn" onClick={() => setEditingLucky(false)}>Cancel</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="numerology-card-number" style={{ opacity: 0.3 }}>?</div>
                  <div className="numerology-card-label">Lucky Number</div>
                  <div className="numerology-card-subtitle" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                    Got a number that follows you around? One that keeps showing up, or just feels like yours?
                  </div>
                  <button className="numerology-lucky-edit" onClick={() => setEditingLucky(true)}>Add yours</button>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="numerology-empty">
          <div className="numerology-hint">Enter your name to reveal your numerological profile.</div>
          <div className="numerology-input-row">
            <input
              className="numerology-input-field"
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCalculate()}
              placeholder="Full name..."
            />
            <button className="numerology-calc-btn" onClick={handleCalculate} disabled={!nameInput.trim()}>Calculate</button>
          </div>
        </div>
      )}
    </div>
  );
}

const CHINESE_INFO = {
  'heavenly-stem': 'The ten Heavenly Stems (天干 Tiān Gān) are the oldest cycle in Chinese cosmology, predating the zodiac animals. Each stem carries an element (Wood, Fire, Earth, Metal, Water) in either Yang or Yin polarity. Together with the Earthly Branches they form the 60-year sexagenary cycle — the backbone of Chinese calendrical reckoning. Your stem colors how your year element expresses itself: Yang stems are active and outward, Yin stems are receptive and inward.',
  'earthly-branch': 'The twelve Earthly Branches (地支 Dì Zhī) are the older, more abstract layer behind the twelve animal signs. Each branch maps to a two-hour period of the day, a month of the year, and a compass direction. When paired with a Heavenly Stem, the branch anchors you in the 60-year cycle. The animal associated with your branch is your Year Animal — the public face of your Chinese zodiac identity.',
  'year-animal': 'Your Year Animal (生肖 Shēng Xiào) is the most recognized part of the Chinese zodiac. It represents your outward personality — how others perceive you and the social qualities you project. The twelve animals cycle in a fixed order, each carrying distinct temperamental patterns. Your animal also has a fixed element (separate from the year element) that represents its innate nature.',
  'year-element': 'The Year Element (五行 Wǔ Xíng) comes from the Five Phases system that permeates Chinese philosophy. Each element governs a two-year period and layers onto your animal sign, modifying its expression. A Water Rat and a Fire Rat share core traits but channel them very differently. The elements cycle through Wood, Fire, Earth, Metal, and Water, creating 60 unique animal-element combinations.',
  'inner-animal': 'Your Inner Animal (内动物 Nèi Dòngwù) is determined by your birth month. While the Year Animal is your public face, the Inner Animal governs your private world — how you behave in close relationships, what you value when no one is watching, and your emotional default state. If your inner and outer animals differ, you may feel a tension between your public persona and your inner life.',
  'secret-animal': 'The Secret Animal (秘密动物 Mìmì Dòngwù) is determined by your birth hour, assigned in two-hour windows called shichen (時辰). This is considered the truest layer of your character — the self that even you may not fully recognize. It shapes unconscious motivations and deep drives. Traditional Chinese astrology considers the birth hour essential for a complete reading.',
  'lucky': 'Auspicious attributes in Chinese astrology are associations refined over centuries of folk practice. Lucky numbers, colors, and flowers correspond to your animal sign through elemental resonance, cultural symbolism, and traditional medicine. These aren\'t predictions — they\'re affinities, subtle alignments between your sign and the patterns of the world.',
  'compatibility': 'Chinese zodiac compatibility follows the principle of the "four trines" — groups of three animals that share elemental temperament and naturally harmonize. The challenging match (冲 Chōng) pairs animals that sit opposite each other on the zodiac wheel, six positions apart. Opposite signs can create dynamic tension that\'s productive in some relationships but requires conscious effort.',
};

const SIGN_TO_CONSTELLATION = {
  Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Cnc',
  Leo: 'Leo', Virgo: 'Vir', Libra: 'Lib', Scorpio: 'Sco',
  Sagittarius: 'Sgr', Capricorn: 'Cap', Aquarius: 'Aqr', Pisces: 'Psc',
};

const SYNTHESIS_INFO = {
  'seasonal-wheel': 'The Seasonal (Tropical) Wheel represents the Embodied Self — the mortal body, the lived experience, the cutting edge of existence where the soul makes choices and advances. Anchored to the Earth\'s axial tilt and the rhythm of the seasons, your tropical sign describes the frontier work your embodied self is doing right now. The tropical wheel is always about 24\u00B0 ahead of the stellar wheel — the mortal self leads the way, pioneering new ground that the timeless self has not yet reached.',
  'stellar-wheel': 'The Stellar (Sidereal) Wheel represents the Timeless Self — the essential being beyond the mortal frame, not limited to time the way the body is. Anchored to the actual constellations, your sidereal sign describes the deep momentum and direction that gives your mortal choices their meaning. The stellar wheel follows about 24\u00B0 behind, integrating what the embodied self is doing — your timeless nature is catching up to the ground your body has already broken.',
  'precession-gap': 'Around 285 CE, the two wheels were perfectly aligned: the Embodied Self and the Timeless Self pointed in the same direction. Since then, the vernal equinox has moved backward through the constellations at about 1\u00B0 every 72 years — a phenomenon called the precession of the equinoxes. Today the gap is roughly 24\u00B0, which means the mortal self (tropical) is one sign ahead of the timeless self (sidereal). This is not drift or error — it is the body leading the way. Your embodied self is always pioneering new archetypal ground, while your timeless self follows, integrating the mortal experience into something that endures beyond any single life. The Two-Wheel approach holds both: the self that leads and the self that follows.',
  'trad-seasonal': 'The seasonal tradition assigns each sign an element (Fire, Earth, Air, Water), a modality (Cardinal, Fixed, Mutable), and a ruling planet. These describe the quality of time and energy at work during that segment of the year. Polarity (diurnal/nocturnal) adds another layer based on whether you were born during daylight or nighttime hours, reflecting different expressions of the same sign energy.',
  'trad-stellar': 'The stellar tradition looks at the actual constellation — its shape, its mythology, its brightest stars. Where the tropical system abstracts the ecliptic into equal 30\u00B0 segments, the constellations are irregular in size and rich in cultural mythology. The stellar archetype connects you to the specific star stories that civilizations have told about your region of the sky for millennia.',
  'trad-chinese': 'The Chinese zodiac operates on a completely different axis: a 60-year cycle combining twelve animals with five elements. Instead of mapping your position along the ecliptic, it maps your position in time — your birth year, month, and hour each carry an animal archetype. The system emphasizes cyclical rhythm, generational patterns, and the interplay of Yin and Yang. Adding the Chinese layer to the Western two-wheel framework gives you three distinct perspectives on the same life.',
};

function buildSynthesisNarrative(tropSign, sidSign, chinese, birthMonth) {
  const tropData = chronosphaeraZodiac.find(z => z.sign === tropSign);
  const sidData = chronosphaeraZodiac.find(z => z.sign === sidSign);
  const monthData = birthMonth ? mythicCalendar.find(m => m.order === birthMonth) : null;
  const constAbbr = SIGN_TO_CONSTELLATION[sidSign];
  const constData = constAbbr ? constellationContent[constAbbr] : null;
  const sameSigns = tropSign === sidSign;

  const paragraphs = [];

  // 1. The Embodied Self (Tropical)
  let embodied = `Your seasonal Sun falls in ${tropSign} \u2014 ${tropData?.archetype || tropSign}.`;
  if (EMBODIED_READING[tropSign]) {
    embodied += ' ' + EMBODIED_READING[tropSign];
  }
  if (monthData) {
    embodied += ' ' + monthData.mood.split('.')[0] + '.';
  }
  paragraphs.push(embodied);

  // 2. The Timeless Self (Sidereal)
  let timeless = 'Behind the seasonal rhythm, the constellations trace a deeper pattern.';
  timeless += ` Your sidereal Sun falls in ${sidSign} \u2014 ${sidData?.archetype || sidSign}.`;
  if (TIMELESS_READING[sidSign]) {
    timeless += ' ' + TIMELESS_READING[sidSign];
  }
  if (constData) {
    timeless += ` Its brightest star, ${constData.brightestStar}, anchors this region of the sky.`;
  }
  paragraphs.push(timeless);

  // 3. The Pair Dynamic (or Same-Sign)
  let pair;
  if (sameSigns) {
    pair = SAME_SIGN_READING.replace('{sign}', tropSign);
  } else if (PAIR_DYNAMIC[tropSign]) {
    pair = 'The two wheels are about 24\u00B0 apart \u2014 the mortal self always slightly ahead, leading the way. ' + PAIR_DYNAMIC[tropSign].reading;
  } else {
    pair = `Your embodied self as ${tropSign} and your timeless self as ${sidSign} create a dialogue between two archetypes \u2014 the mortal body pioneering new ground while the essential being provides the deep current of momentum and meaning beneath the surface.`;
  }
  paragraphs.push(pair);

  // 4. Chinese layer
  if (chinese) {
    const { animal, element } = chinese;
    let chn = `The Chinese tradition adds a temporal dimension that Western astrology lacks entirely. As a ${element} ${animal}, you carry the ${CHINESE_TRAITS[animal]?.toLowerCase() || animal + "'s"} qualities, expressed through ${element}'s nature of ${CHINESE_ELEMENT_TRAITS[element]?.toLowerCase() || element}.`;
    chn += ' Where the Western wheels track spatial position along the ecliptic, the Chinese system tracks your position in a sixty-year cycle \u2014 a rhythm of generations, not seasons.';
    paragraphs.push(chn);
  }

  // 5. Closing Synthesis
  let closing = 'Three traditions, three lenses on the same moment of birth.';
  closing += ` The embodied self says ${tropSign}: the mortal work of ${tropData?.stageOfExperience?.toLowerCase() || 'its phase in the cycle'}.`;
  if (!sameSigns && sidData) {
    closing += ` The timeless self says ${sidSign}: the essential momentum of ${sidData.stageOfExperience?.toLowerCase() || 'its deeper phase'}.`;
  }
  if (chinese) {
    closing += ` The Chinese wheel says ${chinese.element} ${chinese.animal}.`;
  }
  closing += ' No single system tells the whole story. The Two-Wheel Zodiac holds both the embodied work and the essential momentum \u2014 the self that leads and the self that follows \u2014 and lets the Chinese tradition add a third axis of meaning. The contradictions between them are not errors to be resolved but tensions to be lived.';
  paragraphs.push(closing);

  return paragraphs;
}

const TRANSIT_ASPECT_MEANING = {
  Conjunction: 'amplifies and merges with',
  Sextile: 'gently supports',
  Square: 'challenges and pressures',
  Trine: 'flows harmoniously with',
  Opposition: 'confronts and illuminates',
};

function findCrossAspects(natalPlanets, transitPlanets) {
  const ASPECTS = [
    { name: 'Conjunction', angle: 0, orb: 8 },
    { name: 'Sextile', angle: 60, orb: 6 },
    { name: 'Square', angle: 90, orb: 8 },
    { name: 'Trine', angle: 120, orb: 8 },
    { name: 'Opposition', angle: 180, orb: 8 },
  ];
  const found = [];
  for (const natal of natalPlanets) {
    for (const transit of transitPlanets) {
      let sep = Math.abs(natal.longitude - transit.longitude);
      if (sep > 180) sep = 360 - sep;
      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= aspect.orb) {
          found.push({
            natalPlanet: natal.name,
            transitPlanet: transit.name,
            aspect: aspect.name,
            orb: +orb.toFixed(1),
          });
          break;
        }
      }
    }
  }
  return found;
}

function buildSkyNowNarrative(tropSign, sidSign) {
  const tropData = chronosphaeraZodiac.find(z => z.sign === tropSign);
  const sidData = chronosphaeraZodiac.find(z => z.sign === sidSign);
  const sameSigns = tropSign === sidSign;
  const paragraphs = [];

  // P1: The Current Embodied Energy
  let p1 = `Right now the Sun is in ${tropSign}`;
  if (tropData?.archetype) p1 += ` \u2014 ${tropData.archetype}`;
  p1 += '.';
  if (EMBODIED_READING[tropSign]) {
    const match = EMBODIED_READING[tropSign].match(/doing the work of (.+?)(?:\.|—)/);
    if (match) {
      p1 += ` The seasonal wheel is in its ${match[1].trim()} phase.`;
    }
  }
  p1 += ' This is the embodied work the world is collectively engaged in at this moment \u2014 the cutting edge of the cycle, the mortal frontier where choices are being made.';
  paragraphs.push(p1);

  // P2: The Current Timeless Current
  let p2 = `Behind the seasonal rhythm, the sidereal Sun falls in ${sidSign}`;
  if (sidData?.archetype) p2 += ` \u2014 ${sidData.archetype}`;
  p2 += '.';
  if (TIMELESS_READING[sidSign]) {
    const match = TIMELESS_READING[sidSign].match(/the essential momentum of (.+?)(?:\s\u2014)/);
    if (match) {
      p2 += ` The stellar wheel carries the essential momentum of ${match[1].trim()}.`;
    }
  }
  p2 += ' This is the deeper current underneath the surface \u2014 not bound to the season but to the stars themselves.';
  paragraphs.push(p2);

  // P3: The Pair Dynamic
  if (sameSigns) {
    paragraphs.push(`The tropical and sidereal Sun are both in ${tropSign} \u2014 the seasonal rhythm and the stellar current are pointing in the same direction. This alignment was the default roughly two thousand years ago. Right now, the embodied work and the timeless momentum reinforce each other \u2014 a moment of unusual coherence between the two wheels.`);
  } else if (PAIR_DYNAMIC[tropSign]) {
    paragraphs.push(`The two wheels are about 24\u00B0 apart \u2014 the seasonal wheel always slightly ahead, pioneering new archetypal ground. The embodied current of ${tropSign} leads, while the stellar current of ${sidSign} follows, integrating the lived experience into something that endures. This is not just a personal dynamic \u2014 it is the shape of the collective moment: everyone alive is navigating this same tension between the mortal frontier and the timeless undertow.`);
  } else {
    paragraphs.push(`The embodied current as ${tropSign} and the timeless current as ${sidSign} create a dialogue \u2014 the seasonal wheel pioneering new ground while the stellar wheel provides the deep current of momentum beneath the surface.`);
  }

  return paragraphs;
}

const PLANET_TRANSIT_VOICE = {
  Sun: { metal: 'gold', noun: 'conscious identity', verb: 'illuminates' },
  Moon: { metal: 'silver', noun: 'emotional instinct', verb: 'stirs' },
  Mercury: { metal: 'quicksilver', noun: 'perception and speech', verb: 'quickens' },
  Venus: { metal: 'copper', noun: 'value and connection', verb: 'draws toward' },
  Mars: { metal: 'iron', noun: 'will and action', verb: 'ignites' },
  Jupiter: { metal: 'tin', noun: 'meaning and opportunity', verb: 'expands' },
  Saturn: { metal: 'lead', noun: 'discipline and structure', verb: 'tests' },
};

function buildTransitNarrative(crossAspects) {
  if (!crossAspects || crossAspects.length === 0) {
    return ['The transit sky is quiet against your chart right now \u2014 no major cross-chart aspects forming between the current planets and your natal placements. These pauses have their own value. The sky is not pressing, not asking, not testing. It is giving your pattern room to breathe before the next weather system arrives.'];
  }

  const paragraphs = [];

  // Sort by significance: conjunctions/oppositions first, then squares, then soft
  const ASPECT_WEIGHT = { Conjunction: 0, Opposition: 1, Square: 2, Trine: 3, Sextile: 4 };
  const sorted = [...crossAspects].sort((a, b) => (ASPECT_WEIGHT[a.aspect] ?? 5) - (ASPECT_WEIGHT[b.aspect] ?? 5) || a.orb - b.orb);

  const hard = sorted.filter(a => ['Conjunction', 'Square', 'Opposition'].includes(a.aspect));
  const soft = sorted.filter(a => ['Trine', 'Sextile'].includes(a.aspect));

  // Opening \u2014 set the weather
  let opening;
  if (hard.length === 0 && soft.length > 0) {
    opening = 'The sky is working with you right now, not against you. The current transits are flowing into your natal pattern through soft aspects \u2014 trines and sextiles that support without demanding. This is a window where the wind is at your back.';
  } else if (hard.length > 0 && soft.length === 0) {
    opening = 'The transit weather is pressing against your chart. Every active aspect right now carries friction \u2014 conjunctions that amplify, squares that challenge, oppositions that confront. This is not punishment. This is the sky asking you to respond, to grow, to make choices under pressure.';
  } else if (hard.length > soft.length) {
    opening = `The transit sky is active against your chart \u2014 more friction than flow right now. ${hard.length} hard aspect${hard.length > 1 ? 's' : ''} pressing, ${soft.length} soft one${soft.length > 1 ? 's' : ''} supporting. The weather is asking for engagement, not passivity.`;
  } else {
    opening = `The transit weather is mixed \u2014 ${soft.length} flowing aspect${soft.length > 1 ? 's' : ''} and ${hard.length} frictional one${hard.length > 1 ? 's' : ''}. Some support, some pressure. This is the usual dialogue between the moving sky and the pattern you were born with.`;
  }
  paragraphs.push(opening);

  // Body \u2014 the loudest aspects
  const top = sorted.slice(0, Math.min(3, sorted.length));
  const lines = top.map(a => {
    const tv = PLANET_TRANSIT_VOICE[a.transitPlanet] || {};
    const nv = PLANET_TRANSIT_VOICE[a.natalPlanet] || {};

    if (a.aspect === 'Conjunction') {
      return `Transit ${a.transitPlanet} conjunct your natal ${a.natalPlanet}: ${tv.metal || 'the moving planet'} meeting ${nv.metal || 'your placement'} at the same degree. The sky\u2019s ${tv.noun || 'energy'} is merging directly with your own ${nv.noun || 'pattern'} \u2014 amplifying it, making it louder, harder to ignore.`;
    } else if (a.aspect === 'Opposition') {
      return `Transit ${a.transitPlanet} opposing your natal ${a.natalPlanet}: ${tv.metal || 'the sky'} facing ${nv.metal || 'your placement'} across the wheel. Oppositions are mirrors, not attacks. The sky\u2019s ${tv.noun || 'energy'} is showing you the other side of your own ${nv.noun || 'placement'} \u2014 the part you don\u2019t usually lead with.`;
    } else if (a.aspect === 'Square') {
      return `Transit ${a.transitPlanet} squaring your natal ${a.natalPlanet}: friction between the current ${tv.noun || 'energy'} and your natal ${nv.noun || 'placement'}. Squares build capacity through tension \u2014 the pressure is not something to escape but something to metabolize.`;
    } else if (a.aspect === 'Trine') {
      return `Transit ${a.transitPlanet} trine your natal ${a.natalPlanet}: the sky\u2019s ${tv.noun || 'energy'} flowing naturally into your ${nv.noun || 'pattern'}. Trines are support that arrives without being earned \u2014 use the ease, don\u2019t sleep through it.`;
    } else {
      return `Transit ${a.transitPlanet} sextile your natal ${a.natalPlanet}: a quiet opening between the current ${tv.noun || 'energy'} and your natal ${nv.noun || 'placement'}. Sextiles are invitations, not deliveries \u2014 they activate when you reach for them.`;
    }
  });
  paragraphs.push(lines.join(' '));

  // Closing
  if (sorted.length > top.length) {
    paragraphs.push(`${sorted.length - top.length} more aspect${sorted.length - top.length > 1 ? 's are' : ' is'} forming beneath the ones above \u2014 the full picture is richer than any summary. But the loudest transits set the weather, and the weather right now is: ${hard.length > soft.length ? 'engaged' : soft.length > hard.length ? 'supported' : 'in dialogue'}.`);
  } else {
    paragraphs.push('These are all the active transits to your chart right now. The sky writes a new sentence every day \u2014 come back and the pattern will have shifted.');
  }

  return paragraphs;
}

function NatalChartDisplay({ chart }) {
  const hasBirthData = chart?.planets?.length > 0;
  const [natalMode, setNatalMode] = useState('tropical');
  const [expandedInfo, setExpandedInfo] = useState(null);
  const [chartMode, setChartMode] = useState('live');
  const [liveSky, setLiveSky] = useState(null);
  const [liveMode, setLiveMode] = useState(hasBirthData ? 'transits' : 'sky-now');
  const hadBirthDataOnMount = useRef(hasBirthData);
  const birthYear = chart?.birthData?.year || 2000;
  const isSidereal = natalMode === 'sidereal';

  const handleLiveToggle = useCallback(async () => {
    setChartMode('live');
    if (!liveSky) {
      try {
        const res = await fetch('/api/celestial');
        const data = await res.json();
        if (data.planets) setLiveSky(data);
      } catch (err) {
        console.error('Failed to fetch current sky:', err);
      }
    }
  }, [liveSky]);

  // Auto-fetch sky data on mount (defaults to live view)
  useEffect(() => {
    handleLiveToggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When birth data first appears, switch to transits
  useEffect(() => {
    if (!hadBirthDataOnMount.current && chart?.planets?.length > 0) {
      setLiveMode('transits');
      hadBirthDataOnMount.current = true;
    }
  }, [chart]);

  // Live sky derived data
  const currentYear = new Date().getFullYear();
  const liveSkyDual = liveSky ? liveSky.planets.map(p => {
    const s = toSiderealSign(p.longitude, currentYear);
    return { ...p, sidSign: s.sign, sidDegree: s.degree };
  }) : [];
  const currentTropSun = liveSky?.planets?.find(p => p.name === 'Sun')?.sign || 'Unknown';
  const currentSidSun = liveSkyDual.find(p => p.name === 'Sun')?.sidSign || 'Unknown';
  const skyNowNarrative = liveSky ? buildSkyNowNarrative(currentTropSun, currentSidSun) : [];
  const crossAspects = liveSky && chart?.planets ? findCrossAspects(chart.planets, liveSky.planets) : [];
  const transitNarrative = crossAspects.length >= 0 && liveSky ? buildTransitNarrative(crossAspects) : [];

  const planets = isSidereal
    ? chart?.planets?.map(p => {
        const s = toSiderealSign(p.longitude, birthYear);
        return { ...p, sign: s.sign, degree: s.degree };
      })
    : chart?.planets;

  const asc = isSidereal && chart?.ascendant
    ? { ...chart.ascendant, ...toSiderealSign(chart.ascendant.longitude, birthYear) }
    : chart?.ascendant;

  const sun = planets?.find(p => p.name === 'Sun');
  const moon = planets?.find(p => p.name === 'Moon');

  return (
    <div className="natal-chart-display">
      {/* Birth Chart / Sky Now toggle */}
      <div className="natal-chart-mode-toggle">
        {hasBirthData && <button className={`natal-chart-mode-btn${chartMode === 'birth' ? ' active' : ''}`} onClick={() => setChartMode('birth')}>My Birth Chart</button>}
        <button className={`natal-chart-mode-btn${chartMode === 'live' ? ' active' : ''}`} onClick={handleLiveToggle}>The Sky Right Now</button>
      </div>

      {chartMode === 'birth' ? (<>
      {/* Tropical / Sidereal / Chinese tabs */}
      <div className="natal-mode-tabs">
        <button
          className={`natal-mode-tab${natalMode === 'tropical' ? ' active' : ''}`}
          onClick={() => setNatalMode('tropical')}
        >Tropical</button>
        <button
          className={`natal-mode-tab${natalMode === 'sidereal' ? ' active' : ''}`}
          onClick={() => setNatalMode('sidereal')}
        >Sidereal</button>
        <button
          className={`natal-mode-tab${natalMode === 'chinese' ? ' active' : ''}`}
          onClick={() => setNatalMode('chinese')}
        >Chinese</button>
        <button
          className={`natal-mode-tab${natalMode === 'synthesis' ? ' active' : ''}`}
          onClick={() => setNatalMode('synthesis')}
        >Synthesis</button>
      </div>

      {natalMode === 'chinese' ? (
        chart.chinese ? (() => {
          const { animal, element } = chart.chinese;
          const details = getChineseDetails(chart.birthData);
          const { stem, branch, innerAnimal, secretAnimal } = details;
          const fixedEl = CHINESE_FIXED_ELEMENT[animal];
          const lucky = CHINESE_LUCKY[animal];
          const compatibles = CHINESE_COMPATIBLES[animal] || [];
          const incompatible = CHINESE_INCOMPATIBLES[animal];
          const toggleInfo = (key) => setExpandedInfo(prev => prev === key ? null : key);
          return (
            <div className="natal-chinese-tab">
              <div className="natal-chinese-hero">
                <div className="natal-chinese-emoji">{CHINESE_ANIMAL_EMOJIS[animal] || ''}</div>
                <div className="natal-chinese-pillar">{element} {animal}</div>
                <div className="natal-chinese-polarity">{stem.polarity} &middot; {stem.char}{branch.char}</div>
              </div>

              {/* Year Pillar */}
              <div className="natal-chinese-pillar-row">
                <div className={`natal-chinese-pillar-card natal-chinese-clickable${expandedInfo === 'heavenly-stem' ? ' expanded' : ''}`} onClick={() => toggleInfo('heavenly-stem')}>
                  <div className="natal-chinese-card-label">Heavenly Stem <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-pillar-char">{stem.char}</div>
                  <div className="natal-chinese-card-value">{stem.name}</div>
                  <div className="natal-chinese-card-detail">{stem.element} {stem.polarity}</div>
                  {expandedInfo === 'heavenly-stem' && <div className="natal-chinese-info-text">{CHINESE_INFO['heavenly-stem']}</div>}
                </div>
                <div className={`natal-chinese-pillar-card natal-chinese-clickable${expandedInfo === 'earthly-branch' ? ' expanded' : ''}`} onClick={() => toggleInfo('earthly-branch')}>
                  <div className="natal-chinese-card-label">Earthly Branch <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-pillar-char">{branch.char}</div>
                  <div className="natal-chinese-card-value">{branch.name}</div>
                  <div className="natal-chinese-card-detail">{branch.animal}</div>
                  {expandedInfo === 'earthly-branch' && <div className="natal-chinese-info-text">{CHINESE_INFO['earthly-branch']}</div>}
                </div>
              </div>

              {/* Animal + Element cards */}
              <div className="natal-chinese-cards">
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'year-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('year-animal')}>
                  <div className="natal-chinese-card-label">Year Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value">{animal}</div>
                  <div className="natal-chinese-card-detail">{CHINESE_TRAITS[animal]}</div>
                  <div className="natal-chinese-card-sub">Fixed element: <span style={{ color: CHINESE_ELEMENT_COLORS[fixedEl] }}>{fixedEl}</span></div>
                  {expandedInfo === 'year-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['year-animal']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'year-element' ? ' expanded' : ''}`} onClick={() => toggleInfo('year-element')}>
                  <div className="natal-chinese-card-label">Year Element <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-value" style={{ color: CHINESE_ELEMENT_COLORS[element] }}>{element}</div>
                  <div className="natal-chinese-card-detail">{CHINESE_ELEMENT_TRAITS[element]}</div>
                  {expandedInfo === 'year-element' && <div className="natal-chinese-info-text">{CHINESE_INFO['year-element']}</div>}
                </div>
              </div>

              {/* Inner + Secret animals */}
              <div className="natal-chinese-cards">
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'inner-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('inner-animal')}>
                  <div className="natal-chinese-card-label">Inner Animal <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-card-emoji">{CHINESE_ANIMAL_EMOJIS[innerAnimal]}</div>
                  <div className="natal-chinese-card-value">{innerAnimal}</div>
                  <div className="natal-chinese-card-detail">From birth month — your private self</div>
                  {expandedInfo === 'inner-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['inner-animal']}</div>}
                </div>
                <div className={`natal-chinese-card natal-chinese-clickable${expandedInfo === 'secret-animal' ? ' expanded' : ''}`} onClick={() => toggleInfo('secret-animal')}>
                  <div className="natal-chinese-card-label">Secret Animal <span className="natal-chinese-info-hint">?</span></div>
                  {secretAnimal ? (
                    <>
                      <div className="natal-chinese-card-emoji">{CHINESE_ANIMAL_EMOJIS[secretAnimal]}</div>
                      <div className="natal-chinese-card-value">{secretAnimal}</div>
                      <div className="natal-chinese-card-detail">From birth hour — your truest self</div>
                    </>
                  ) : (
                    <>
                      <div className="natal-chinese-card-emoji" style={{ opacity: 0.3 }}>?</div>
                      <div className="natal-chinese-card-value" style={{ opacity: 0.4 }}>Unknown</div>
                      <div className="natal-chinese-card-detail">Requires birth time</div>
                    </>
                  )}
                  {expandedInfo === 'secret-animal' && <div className="natal-chinese-info-text">{CHINESE_INFO['secret-animal']}</div>}
                </div>
              </div>

              {/* Lucky attributes */}
              {lucky && (
                <div className={`natal-chinese-lucky natal-chinese-clickable${expandedInfo === 'lucky' ? ' expanded' : ''}`} onClick={() => toggleInfo('lucky')}>
                  <div className="natal-chinese-lucky-label">Auspicious Attributes <span className="natal-chinese-info-hint">?</span></div>
                  <div className="natal-chinese-lucky-grid">
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Numbers</span>
                      <span className="natal-chinese-lucky-val">{lucky.numbers.join(', ')}</span>
                    </div>
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Colors</span>
                      <span className="natal-chinese-lucky-val">{lucky.colors.join(', ')}</span>
                    </div>
                    <div className="natal-chinese-lucky-item">
                      <span className="natal-chinese-lucky-key">Flower</span>
                      <span className="natal-chinese-lucky-val">{lucky.flower}</span>
                    </div>
                  </div>
                  {expandedInfo === 'lucky' && <div className="natal-chinese-info-text">{CHINESE_INFO['lucky']}</div>}
                </div>
              )}

              {/* Compatibility */}
              <div className={`natal-chinese-compat natal-chinese-clickable${expandedInfo === 'compatibility' ? ' expanded' : ''}`} onClick={() => toggleInfo('compatibility')}>
                <div className="natal-chinese-compat-label">Most Compatible <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-chinese-compat-list">
                  {compatibles.map(a => (
                    <span key={a} className="natal-chinese-compat-tag">
                      {CHINESE_ANIMAL_EMOJIS[a]} {a}
                    </span>
                  ))}
                </div>
                {incompatible && (
                  <div className="natal-chinese-compat-clash">
                    Challenging match: {CHINESE_ANIMAL_EMOJIS[incompatible]} {incompatible}
                  </div>
                )}
                {expandedInfo === 'compatibility' && <div className="natal-chinese-info-text">{CHINESE_INFO['compatibility']}</div>}
              </div>
            </div>
          );
        })() : null
      ) : natalMode === 'synthesis' ? (() => {
        const tropPlanets = chart.planets || [];
        const sidPlanets = tropPlanets.map(p => {
          const s = toSiderealSign(p.longitude, birthYear);
          return { ...p, tropSign: p.sign, tropDegree: p.degree, sidSign: s.sign, sidDegree: s.degree };
        });
        const tropSun = tropPlanets.find(p => p.name === 'Sun');
        const sidSunInfo = tropSun ? toSiderealSign(tropSun.longitude, birthYear) : null;
        const tropSignName = tropSun?.sign || 'Unknown';
        const sidSignName = sidSunInfo?.sign || 'Unknown';

        const zodiacLookup = {};
        chronosphaeraZodiac.forEach(z => { zodiacLookup[z.sign] = z; });
        const tropZodiac = zodiacLookup[tropSignName];
        const sidZodiac = zodiacLookup[sidSignName];

        const constAbbr = SIGN_TO_CONSTELLATION[sidSignName];
        const constellation = constAbbr ? constellationContent[constAbbr] : null;

        const bMonth = chart.birthData?.month;
        const monthData = bMonth ? mythicCalendar.find(m => m.order === bMonth) : null;

        const ayanamsa = (24.1 + (birthYear - 2024) * 0.0139).toFixed(1);
        const sameSigns = tropSignName === sidSignName;

        const chinese = chart.chinese;
        const chineseDetails = chart.birthData ? getChineseDetails(chart.birthData) : null;

        const narrative = buildSynthesisNarrative(tropSignName, sidSignName, chinese, bMonth);

        const toggleInfo = (key) => setExpandedInfo(prev => prev === key ? null : key);

        return (
          <div className="natal-synthesis-tab">
            {/* 1. Two-Wheel Hero */}
            <div className="natal-synthesis-wheels">
              <div className={`natal-synthesis-wheel-card natal-chinese-clickable${expandedInfo === 'seasonal-wheel' ? ' expanded' : ''}`} onClick={() => toggleInfo('seasonal-wheel')}>
                <div className="natal-synthesis-wheel-label">Seasonal Wheel <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-synthesis-wheel-subtitle">The Embodied Self</div>
                <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[tropSignName] || ''}</div>
                <div className="natal-synthesis-wheel-sign">{tropSignName}</div>
                {tropZodiac && (
                  <>
                    <div className="natal-synthesis-wheel-archetype">{tropZodiac.archetype}</div>
                    <div className="natal-synthesis-wheel-detail">{tropZodiac.modality} {tropZodiac.element}</div>
                    <div className="natal-synthesis-wheel-detail">{tropZodiac.stageOfExperience}</div>
                  </>
                )}
                {monthData && <div className="natal-synthesis-wheel-mood">{monthData.month} \u2014 {monthData.stone.name}</div>}
                {expandedInfo === 'seasonal-wheel' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['seasonal-wheel']}</div>}
              </div>

              <div className={`natal-synthesis-wheel-card natal-chinese-clickable${expandedInfo === 'stellar-wheel' ? ' expanded' : ''}`} onClick={() => toggleInfo('stellar-wheel')}>
                <div className="natal-synthesis-wheel-label">Stellar Wheel <span className="natal-chinese-info-hint">?</span></div>
                <div className="natal-synthesis-wheel-subtitle">The Timeless Self</div>
                <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[sidSignName] || ''}</div>
                <div className="natal-synthesis-wheel-sign">{sidSignName}</div>
                {constellation && (
                  <>
                    <div className="natal-synthesis-wheel-archetype">{constellation.name}</div>
                    <div className="natal-synthesis-wheel-detail">{constellation.brightestStar}</div>
                    <div className="natal-synthesis-wheel-detail">Best seen: {constellation.bestSeen}</div>
                  </>
                )}
                {sidZodiac?.cultures?.vedic && <div className="natal-synthesis-wheel-mood">Vedic: {sidZodiac.cultures.vedic.name}</div>}
                {expandedInfo === 'stellar-wheel' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['stellar-wheel']}</div>}
              </div>
            </div>

            {/* 2. The Precession Gap */}
            <div className={`natal-synthesis-gap natal-chinese-clickable${expandedInfo === 'precession-gap' ? ' expanded' : ''}`} onClick={() => toggleInfo('precession-gap')}>
              <div className="natal-synthesis-gap-label">The Precession Gap <span className="natal-chinese-info-hint">?</span></div>
              <div className="natal-synthesis-gap-degrees">~{ayanamsa}\u00B0 offset</div>
              <div className="natal-synthesis-gap-text">
                Your embodied self is <strong>{tropSignName}</strong>. Your timeless self is <strong>{sidSignName}</strong>.
              </div>
              {sameSigns ? (
                <div className="natal-synthesis-gap-note">Your signs align \u2014 the embodied self and the timeless self are pointing in the same direction. This was the norm ~2,000 years ago when the two wheels coincided.</div>
              ) : (
                <div className="natal-synthesis-gap-note">The mortal self leads by about 24\u00B0 \u2014 your body as {tropSignName} is pioneering new ground, while your timeless being as {sidSignName} follows, integrating the lived experience into something that endures.</div>
              )}
              <div className="natal-synthesis-gap-age">We are currently in the transition from the Age of Pisces to the Age of Aquarius \u2014 the vernal equinox point is slowly precessing out of Pisces and into Aquarius.</div>
              {expandedInfo === 'precession-gap' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['precession-gap']}</div>}
            </div>

            {/* 3. Planetary Dual-Column Table */}
            <div className="natal-synthesis-planet-table">
              <div className="natal-synthesis-table-header">
                <span className="natal-synthesis-table-planet">Planet</span>
                <span className="natal-synthesis-table-col">Tropical</span>
                <span className="natal-synthesis-table-col">Sidereal</span>
              </div>
              {sidPlanets.map(p => (
                <div key={p.name} className="natal-synthesis-table-row">
                  <span className="natal-synthesis-table-planet">
                    <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                  </span>
                  <span className="natal-synthesis-table-col">
                    {ZODIAC_SYMBOLS[p.tropSign] || ''} {p.tropSign} {p.tropDegree}\u00B0
                  </span>
                  <span className="natal-synthesis-table-col">
                    {ZODIAC_SYMBOLS[p.sidSign] || ''} {p.sidSign} {p.sidDegree}\u00B0
                  </span>
                </div>
              ))}
            </div>

            {/* 4. Three Traditions Row */}
            <div className="natal-synthesis-traditions">
              <div className={`natal-synthesis-tradition-card natal-chinese-clickable${expandedInfo === 'trad-seasonal' ? ' expanded' : ''}`} onClick={() => toggleInfo('trad-seasonal')}>
                <div className="natal-synthesis-tradition-label">Seasonal <span className="natal-chinese-info-hint">?</span></div>
                {tropZodiac && (
                  <>
                    <div className="natal-synthesis-tradition-value">{tropZodiac.element} \u00B7 {tropZodiac.modality}</div>
                    <div className="natal-synthesis-tradition-detail">Ruler: {tropZodiac.rulingPlanet}</div>
                    <div className="natal-synthesis-tradition-detail">
                      {chart.birthData?.hour != null ? (chart.birthData.hour >= 6 && chart.birthData.hour < 18 ? 'Diurnal (Day birth)' : 'Nocturnal (Night birth)') : 'Polarity requires birth time'}
                    </div>
                  </>
                )}
                {expandedInfo === 'trad-seasonal' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['trad-seasonal']}</div>}
              </div>

              <div className={`natal-synthesis-tradition-card natal-chinese-clickable${expandedInfo === 'trad-stellar' ? ' expanded' : ''}`} onClick={() => toggleInfo('trad-stellar')}>
                <div className="natal-synthesis-tradition-label">Stellar <span className="natal-chinese-info-hint">?</span></div>
                {sidZodiac && (
                  <>
                    <div className="natal-synthesis-tradition-value">{sidZodiac.archetype}</div>
                    <div className="natal-synthesis-tradition-detail">{constellation?.name || sidSignName}</div>
                    <div className="natal-synthesis-tradition-detail">{constellation?.brightestStar || ''}</div>
                  </>
                )}
                {expandedInfo === 'trad-stellar' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['trad-stellar']}</div>}
              </div>

              <div className={`natal-synthesis-tradition-card natal-chinese-clickable${expandedInfo === 'trad-chinese' ? ' expanded' : ''}`} onClick={() => toggleInfo('trad-chinese')}>
                <div className="natal-synthesis-tradition-label">Chinese <span className="natal-chinese-info-hint">?</span></div>
                {chinese ? (
                  <>
                    <div className="natal-synthesis-tradition-value">{chinese.element} {chinese.animal}</div>
                    <div className="natal-synthesis-tradition-detail">{chineseDetails?.stem?.polarity || ''}</div>
                    <div className="natal-synthesis-tradition-detail">Inner: {chineseDetails?.innerAnimal || '\u2014'}</div>
                  </>
                ) : (
                  <div className="natal-synthesis-tradition-detail" style={{ opacity: 0.5 }}>No Chinese data</div>
                )}
                {expandedInfo === 'trad-chinese' && <div className="natal-chinese-info-text">{SYNTHESIS_INFO['trad-chinese']}</div>}
              </div>
            </div>

            {/* 5. Unified Narrative Reading */}
            <div className="natal-synthesis-narrative">
              <div className="natal-synthesis-narrative-title">Your Two-Wheel Reading</div>
              {narrative.map((para, i) => (
                <p key={i} className="natal-synthesis-narrative-para">{para}</p>
              ))}
            </div>
          </div>
        );
      })() : (
        <>
          {/* Big Three */}
          <div className="natal-big-three">
            {sun && (
              <div className="natal-big-three-card">
                <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[sun.sign] || ''}</div>
                <div className="natal-big-three-label">Sun</div>
                <div className="natal-big-three-sign">{sun.sign}</div>
                <div className="natal-big-three-degree">{sun.degree}\u00B0</div>
              </div>
            )}
            {moon && (
              <div className="natal-big-three-card">
                <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[moon.sign] || ''}</div>
                <div className="natal-big-three-label">Moon</div>
                <div className="natal-big-three-sign">{moon.sign}</div>
                <div className="natal-big-three-degree">{moon.degree}\u00B0</div>
              </div>
            )}
            {asc ? (
              <div className="natal-big-three-card">
                <div className="natal-big-three-symbol">{ZODIAC_SYMBOLS[asc.sign] || ''}</div>
                <div className="natal-big-three-label">Rising</div>
                <div className="natal-big-three-sign">{asc.sign}</div>
                <div className="natal-big-three-degree">{asc.degree}\u00B0</div>
              </div>
            ) : (
              <div className="natal-big-three-card natal-big-three-unknown">
                <div className="natal-big-three-symbol">?</div>
                <div className="natal-big-three-label">Rising</div>
                <div className="natal-big-three-sign">Unknown</div>
                <div className="natal-big-three-degree">&mdash;</div>
              </div>
            )}
          </div>

          {/* Planet positions */}
          <div className="natal-planets-grid">
            {planets?.map(p => (
              <div key={p.name} className="natal-planet-row">
                <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span>
                <span className="natal-planet-name">{p.name}</span>
                <span className="natal-planet-metal">{PLANET_METALS[p.name]}</span>
                <span className="natal-planet-sign">{ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}\u00B0</span>
                <span className="natal-planet-house">{p.house ? `House ${p.house}` : '\u2014'}</span>
              </div>
            ))}
          </div>

          {/* Time missing note */}
          {chart.timeMissing && (
            <div className="natal-time-note">
              Ascendant, Midheaven, and house placements require birth time.
            </div>
          )}
        </>
      )}
      </>) : (
        <>
          {/* Sky Now / Transits tabs */}
          <div className="natal-mode-tabs">
            <button
              className={`natal-mode-tab${liveMode === 'sky-now' ? ' active' : ''}`}
              onClick={() => setLiveMode('sky-now')}
            >Sky Now</button>
            {hasBirthData && <button
              className={`natal-mode-tab${liveMode === 'transits' ? ' active' : ''}`}
              onClick={() => setLiveMode('transits')}
            >Transits</button>}
          </div>

          {!liveSky ? (
            <div className="natal-sky-now-loading">Loading current sky...</div>
          ) : liveMode === 'sky-now' ? (
            <div className="natal-sky-now-tab">
              {/* Hero cards: current tropical + sidereal Sun */}
              <div className="natal-synthesis-wheels">
                <div className="natal-synthesis-wheel-card">
                  <div className="natal-synthesis-wheel-label">Current Sky</div>
                  <div className="natal-synthesis-wheel-subtitle">The Embodied Energy</div>
                  <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[currentTropSun] || ''}</div>
                  <div className="natal-synthesis-wheel-sign">{currentTropSun}</div>
                  {(() => {
                    const z = chronosphaeraZodiac.find(zz => zz.sign === currentTropSun);
                    return z ? (
                      <>
                        <div className="natal-synthesis-wheel-archetype">{z.archetype}</div>
                        <div className="natal-synthesis-wheel-detail">{z.modality} {z.element}</div>
                      </>
                    ) : null;
                  })()}
                </div>
                <div className="natal-synthesis-wheel-card">
                  <div className="natal-synthesis-wheel-label">Stellar Sky</div>
                  <div className="natal-synthesis-wheel-subtitle">The Timeless Current</div>
                  <div className="natal-synthesis-wheel-symbol">{ZODIAC_SYMBOLS[currentSidSun] || ''}</div>
                  <div className="natal-synthesis-wheel-sign">{currentSidSun}</div>
                  {(() => {
                    const constAbbr = SIGN_TO_CONSTELLATION[currentSidSun];
                    const constellation = constAbbr ? constellationContent[constAbbr] : null;
                    return constellation ? (
                      <>
                        <div className="natal-synthesis-wheel-archetype">{constellation.name}</div>
                        <div className="natal-synthesis-wheel-detail">{constellation.brightestStar}</div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Dual-column planetary table */}
              <div className="natal-synthesis-planet-table">
                <div className="natal-synthesis-table-header">
                  <span className="natal-synthesis-table-planet">Planet</span>
                  <span className="natal-synthesis-table-col">Tropical</span>
                  <span className="natal-synthesis-table-col">Sidereal</span>
                </div>
                {liveSkyDual.map(p => (
                  <div key={p.name} className="natal-synthesis-table-row">
                    <span className="natal-synthesis-table-planet">
                      <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                    </span>
                    <span className="natal-synthesis-table-col">
                      {ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}&deg;
                    </span>
                    <span className="natal-synthesis-table-col">
                      {ZODIAC_SYMBOLS[p.sidSign] || ''} {p.sidSign} {p.sidDegree}&deg;
                    </span>
                  </div>
                ))}
              </div>

              {/* Current aspects */}
              {liveSky.aspects?.length > 0 && (
                <div className="natal-transit-aspects">
                  <div className="natal-transit-aspects-title">Current Aspects</div>
                  {liveSky.aspects.map((a, i) => (
                    <div key={i} className="natal-transit-aspect">
                      <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.planet1]}</span> {a.planet1} {a.aspect.toLowerCase()} <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.planet2]}</span> {a.planet2} <span className="natal-transit-orb">(orb {a.orb}&deg;)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Narrative reading */}
              <div className="natal-synthesis-narrative">
                <div className="natal-synthesis-narrative-title">The Sky Right Now</div>
                {skyNowNarrative.map((para, i) => (
                  <p key={i} className="natal-synthesis-narrative-para">{para}</p>
                ))}
              </div>

              <div className="natal-sky-now-timestamp">
                Computed {new Date(liveSky.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="natal-transits-tab">
              {/* Three-column table: Planet | Natal | Transit */}
              <div className="natal-synthesis-planet-table">
                <div className="natal-synthesis-table-header">
                  <span className="natal-synthesis-table-planet">Planet</span>
                  <span className="natal-synthesis-table-col">Natal</span>
                  <span className="natal-synthesis-table-col">Transit</span>
                </div>
                {chart?.planets?.map(p => {
                  const transit = liveSky.planets.find(t => t.name === p.name);
                  return (
                    <div key={p.name} className="natal-synthesis-table-row">
                      <span className="natal-synthesis-table-planet">
                        <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span> {p.name}
                      </span>
                      <span className="natal-synthesis-table-col">
                        {ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}&deg;
                      </span>
                      <span className="natal-synthesis-table-col">
                        {transit ? <>{ZODIAC_SYMBOLS[transit.sign] || ''} {transit.sign} {transit.degree}&deg;</> : '\u2014'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cross-chart aspects */}
              {crossAspects.length > 0 && (
                <div className="natal-transit-aspects">
                  <div className="natal-transit-aspects-title">Transit Aspects to Your Chart</div>
                  {crossAspects.map((a, i) => (
                    <div key={i} className="natal-transit-aspect">
                      <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.transitPlanet]}</span> Transit {a.transitPlanet} {a.aspect.toLowerCase()} your <span className="natal-planet-symbol">{PLANET_SYMBOLS[a.natalPlanet]}</span> {a.natalPlanet} <span className="natal-transit-orb">(orb {a.orb}&deg;)</span>
                      {TRANSIT_ASPECT_MEANING[a.aspect] && (
                        <span className="natal-transit-meaning"> &mdash; {TRANSIT_ASPECT_MEANING[a.aspect]}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Transit narrative — Atlas reading */}
              {transitNarrative.length > 0 && (
                <div className="natal-synthesis-narrative">
                  <div className="natal-synthesis-narrative-title">Your Transit Weather</div>
                  {transitNarrative.map((para, i) => (
                    <p key={i} className="natal-synthesis-narrative-para">{para}</p>
                  ))}
                </div>
              )}

              <div className="natal-sky-now-timestamp">
                Computed {new Date(liveSky.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---- City lookup table for natal chart input, organized by country ---- */
const COUNTRY_CITIES = {
  US: {
    'new york': { lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    'nyc': { lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    'los angeles': { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
    'la': { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
    'chicago': { lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
    'houston': { lat: 29.7604, lon: -95.3698, tz: 'America/Chicago' },
    'phoenix': { lat: 33.4484, lon: -112.074, tz: 'America/Phoenix' },
    'philadelphia': { lat: 39.9526, lon: -75.1652, tz: 'America/New_York' },
    'san antonio': { lat: 29.4241, lon: -98.4936, tz: 'America/Chicago' },
    'san diego': { lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' },
    'dallas': { lat: 32.7767, lon: -96.797, tz: 'America/Chicago' },
    'san jose': { lat: 37.3382, lon: -121.8863, tz: 'America/Los_Angeles' },
    'san francisco': { lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
    'seattle': { lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
    'denver': { lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
    'boston': { lat: 42.3601, lon: -71.0589, tz: 'America/New_York' },
    'atlanta': { lat: 33.749, lon: -84.388, tz: 'America/New_York' },
    'miami': { lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
    'minneapolis': { lat: 44.9778, lon: -93.265, tz: 'America/Chicago' },
    'portland': { lat: 45.5152, lon: -122.6784, tz: 'America/Los_Angeles' },
    'detroit': { lat: 42.3314, lon: -83.0458, tz: 'America/New_York' },
    'nashville': { lat: 36.1627, lon: -86.7816, tz: 'America/Chicago' },
    'austin': { lat: 30.2672, lon: -97.7431, tz: 'America/Chicago' },
    'birmingham': { lat: 33.5186, lon: -86.8104, tz: 'America/Chicago' },
    'memphis': { lat: 35.1495, lon: -90.049, tz: 'America/Chicago' },
    'louisville': { lat: 38.2527, lon: -85.7585, tz: 'America/New_York' },
    'baltimore': { lat: 39.2904, lon: -76.6122, tz: 'America/New_York' },
    'milwaukee': { lat: 43.0389, lon: -87.9065, tz: 'America/Chicago' },
    'albuquerque': { lat: 35.0844, lon: -106.6504, tz: 'America/Denver' },
    'tucson': { lat: 32.2226, lon: -110.9747, tz: 'America/Phoenix' },
    'fresno': { lat: 36.7378, lon: -119.7871, tz: 'America/Los_Angeles' },
    'sacramento': { lat: 38.5816, lon: -121.4944, tz: 'America/Los_Angeles' },
    'mesa': { lat: 33.4152, lon: -111.8315, tz: 'America/Phoenix' },
    'kansas city': { lat: 39.0997, lon: -94.5786, tz: 'America/Chicago' },
    'omaha': { lat: 41.2565, lon: -95.9345, tz: 'America/Chicago' },
    'cleveland': { lat: 41.4993, lon: -81.6944, tz: 'America/New_York' },
    'columbus': { lat: 39.9612, lon: -82.9988, tz: 'America/New_York' },
    'cincinnati': { lat: 39.1031, lon: -84.512, tz: 'America/New_York' },
    'indianapolis': { lat: 39.7684, lon: -86.1581, tz: 'America/New_York' },
    'charlotte': { lat: 35.2271, lon: -80.8431, tz: 'America/New_York' },
    'raleigh': { lat: 35.7796, lon: -78.6382, tz: 'America/New_York' },
    'virginia beach': { lat: 36.8529, lon: -75.978, tz: 'America/New_York' },
    'richmond': { lat: 37.5407, lon: -77.436, tz: 'America/New_York' },
    'pittsburgh': { lat: 40.4406, lon: -79.9959, tz: 'America/New_York' },
    'tampa': { lat: 27.9506, lon: -82.4572, tz: 'America/New_York' },
    'orlando': { lat: 28.5383, lon: -81.3792, tz: 'America/New_York' },
    'jacksonville': { lat: 30.3322, lon: -81.6557, tz: 'America/New_York' },
    'st louis': { lat: 38.627, lon: -90.1994, tz: 'America/Chicago' },
    'saint louis': { lat: 38.627, lon: -90.1994, tz: 'America/Chicago' },
    'new orleans': { lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
    'las vegas': { lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
    'oklahoma city': { lat: 35.4676, lon: -97.5164, tz: 'America/Chicago' },
    'tulsa': { lat: 36.154, lon: -95.9928, tz: 'America/Chicago' },
    'salt lake city': { lat: 40.7608, lon: -111.891, tz: 'America/Denver' },
    'washington': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    'washington dc': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    'dc': { lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
    'fort worth': { lat: 32.7555, lon: -97.3308, tz: 'America/Chicago' },
    'el paso': { lat: 31.7619, lon: -106.485, tz: 'America/Denver' },
    'boise': { lat: 43.615, lon: -116.2023, tz: 'America/Boise' },
    'little rock': { lat: 34.7465, lon: -92.2896, tz: 'America/Chicago' },
    'jackson': { lat: 32.2988, lon: -90.1848, tz: 'America/Chicago' },
    'montgomery': { lat: 32.3668, lon: -86.3, tz: 'America/Chicago' },
    'mobile': { lat: 30.6954, lon: -88.0399, tz: 'America/Chicago' },
    'huntsville': { lat: 34.7304, lon: -86.5861, tz: 'America/Chicago' },
    'savannah': { lat: 32.0809, lon: -81.0912, tz: 'America/New_York' },
    'charleston': { lat: 32.7765, lon: -79.9311, tz: 'America/New_York' },
    'columbia': { lat: 34.0007, lon: -81.0348, tz: 'America/New_York' },
    'knoxville': { lat: 35.9606, lon: -83.9207, tz: 'America/New_York' },
    'chattanooga': { lat: 35.0456, lon: -85.3097, tz: 'America/New_York' },
    'lexington': { lat: 38.0406, lon: -84.5037, tz: 'America/New_York' },
    'des moines': { lat: 41.5868, lon: -93.625, tz: 'America/Chicago' },
    'madison': { lat: 43.0731, lon: -89.4012, tz: 'America/Chicago' },
    'green bay': { lat: 44.5133, lon: -88.0133, tz: 'America/Chicago' },
    'grand rapids': { lat: 42.9634, lon: -85.6681, tz: 'America/New_York' },
    'buffalo': { lat: 42.8864, lon: -78.8784, tz: 'America/New_York' },
    'rochester': { lat: 43.1566, lon: -77.6088, tz: 'America/New_York' },
    'hartford': { lat: 41.7658, lon: -72.6734, tz: 'America/New_York' },
    'providence': { lat: 41.824, lon: -71.4128, tz: 'America/New_York' },
    'wichita': { lat: 37.6872, lon: -97.3301, tz: 'America/Chicago' },
    'spokane': { lat: 47.6588, lon: -117.426, tz: 'America/Los_Angeles' },
    'tacoma': { lat: 47.2529, lon: -122.4443, tz: 'America/Los_Angeles' },
    'reno': { lat: 39.5296, lon: -119.8138, tz: 'America/Los_Angeles' },
    'colorado springs': { lat: 38.8339, lon: -104.8214, tz: 'America/Denver' },
    'bakersfield': { lat: 35.3733, lon: -119.0187, tz: 'America/Los_Angeles' },
    'oakland': { lat: 37.8044, lon: -122.2712, tz: 'America/Los_Angeles' },
    'long beach': { lat: 33.77, lon: -118.1937, tz: 'America/Los_Angeles' },
    'honolulu': { lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
    'anchorage': { lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' },
  },
  CA: {
    'toronto': { lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
    'vancouver': { lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver' },
    'montreal': { lat: 45.5017, lon: -73.5673, tz: 'America/Toronto' },
    'calgary': { lat: 51.0447, lon: -114.0719, tz: 'America/Edmonton' },
    'edmonton': { lat: 53.5461, lon: -113.4938, tz: 'America/Edmonton' },
    'ottawa': { lat: 45.4215, lon: -75.6972, tz: 'America/Toronto' },
    'winnipeg': { lat: 49.8951, lon: -97.1384, tz: 'America/Winnipeg' },
    'halifax': { lat: 44.6488, lon: -63.5752, tz: 'America/Halifax' },
  },
  MX: {
    'mexico city': { lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
    'guadalajara': { lat: 20.6597, lon: -103.3496, tz: 'America/Mexico_City' },
    'monterrey': { lat: 25.6866, lon: -100.3161, tz: 'America/Mexico_City' },
  },
  PR: {
    'san juan': { lat: 18.4655, lon: -66.1057, tz: 'America/Puerto_Rico' },
  },
  BR: {
    'sao paulo': { lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
    'rio de janeiro': { lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo' },
  },
  AR: {
    'buenos aires': { lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  },
  CO: {
    'bogota': { lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  },
  PE: {
    'lima': { lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  },
  CL: {
    'santiago': { lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  },
  VE: {
    'caracas': { lat: 10.4806, lon: -66.9036, tz: 'America/Caracas' },
  },
  GB: {
    'london': { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
    'edinburgh': { lat: 55.9533, lon: -3.1883, tz: 'Europe/London' },
    'manchester': { lat: 53.4808, lon: -2.2426, tz: 'Europe/London' },
    'birmingham': { lat: 52.4862, lon: -1.8904, tz: 'Europe/London' },
  },
  FR: {
    'paris': { lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  },
  DE: {
    'berlin': { lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
    'munich': { lat: 48.1351, lon: 11.582, tz: 'Europe/Berlin' },
    'hamburg': { lat: 53.5511, lon: 9.9937, tz: 'Europe/Berlin' },
  },
  IT: {
    'rome': { lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
    'milan': { lat: 45.4642, lon: 9.19, tz: 'Europe/Rome' },
    'naples': { lat: 40.8518, lon: 14.2681, tz: 'Europe/Rome' },
  },
  ES: {
    'madrid': { lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
    'barcelona': { lat: 41.3874, lon: 2.1686, tz: 'Europe/Madrid' },
  },
  NL: {
    'amsterdam': { lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam' },
  },
  AT: {
    'vienna': { lat: 48.2082, lon: 16.3738, tz: 'Europe/Vienna' },
  },
  IE: {
    'dublin': { lat: 53.3498, lon: -6.2603, tz: 'Europe/Dublin' },
  },
  PT: {
    'lisbon': { lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon' },
  },
  GR: {
    'athens': { lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens' },
  },
  RU: {
    'moscow': { lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  },
  TR: {
    'istanbul': { lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  },
  CZ: {
    'prague': { lat: 50.0755, lon: 14.4378, tz: 'Europe/Prague' },
  },
  PL: {
    'warsaw': { lat: 52.2297, lon: 21.0122, tz: 'Europe/Warsaw' },
  },
  HU: {
    'budapest': { lat: 47.4979, lon: 19.0402, tz: 'Europe/Budapest' },
  },
  RO: {
    'bucharest': { lat: 44.4268, lon: 26.1025, tz: 'Europe/Bucharest' },
  },
  SE: {
    'stockholm': { lat: 59.3293, lon: 18.0686, tz: 'Europe/Stockholm' },
  },
  NO: {
    'oslo': { lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' },
  },
  DK: {
    'copenhagen': { lat: 55.6761, lon: 12.5683, tz: 'Europe/Copenhagen' },
  },
  FI: {
    'helsinki': { lat: 60.1699, lon: 24.9384, tz: 'Europe/Helsinki' },
  },
  BE: {
    'brussels': { lat: 50.8503, lon: 4.3517, tz: 'Europe/Brussels' },
  },
  CH: {
    'zurich': { lat: 47.3769, lon: 8.5417, tz: 'Europe/Zurich' },
    'geneva': { lat: 46.2044, lon: 6.1432, tz: 'Europe/Zurich' },
  },
  UA: {
    'kiev': { lat: 50.4501, lon: 30.5234, tz: 'Europe/Kiev' },
    'kyiv': { lat: 50.4501, lon: 30.5234, tz: 'Europe/Kiev' },
  },
  JP: {
    'tokyo': { lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
    'osaka': { lat: 34.6937, lon: 135.5023, tz: 'Asia/Tokyo' },
  },
  CN: {
    'beijing': { lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
    'shanghai': { lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  },
  IN: {
    'mumbai': { lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
    'delhi': { lat: 28.7041, lon: 77.1025, tz: 'Asia/Kolkata' },
    'new delhi': { lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
    'bangalore': { lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
    'kolkata': { lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    'chennai': { lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  },
  SG: {
    'singapore': { lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  },
  TH: {
    'bangkok': { lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  },
  KR: {
    'seoul': { lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  },
  HK: {
    'hong kong': { lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  },
  AE: {
    'dubai': { lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  },
  IL: {
    'tel aviv': { lat: 32.0853, lon: 34.7818, tz: 'Asia/Jerusalem' },
    'jerusalem': { lat: 31.7683, lon: 35.2137, tz: 'Asia/Jerusalem' },
  },
  TW: {
    'taipei': { lat: 25.033, lon: 121.5654, tz: 'Asia/Taipei' },
  },
  PH: {
    'manila': { lat: 14.5995, lon: 120.9842, tz: 'Asia/Manila' },
  },
  ID: {
    'jakarta': { lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  },
  MY: {
    'kuala lumpur': { lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  },
  VN: {
    'hanoi': { lat: 21.0278, lon: 105.8342, tz: 'Asia/Ho_Chi_Minh' },
    'ho chi minh city': { lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  },
  PK: {
    'karachi': { lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  },
  IR: {
    'tehran': { lat: 35.6892, lon: 51.389, tz: 'Asia/Tehran' },
  },
  SA: {
    'riyadh': { lat: 24.7136, lon: 46.6753, tz: 'Asia/Riyadh' },
  },
  AU: {
    'sydney': { lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
    'melbourne': { lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
    'brisbane': { lat: -27.4698, lon: 153.0251, tz: 'Australia/Brisbane' },
    'perth': { lat: -31.9505, lon: 115.8605, tz: 'Australia/Perth' },
  },
  NZ: {
    'auckland': { lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
  },
  EG: {
    'cairo': { lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  },
  ZA: {
    'johannesburg': { lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
    'cape town': { lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  },
  NG: {
    'lagos': { lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  },
  KE: {
    'nairobi': { lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi' },
  },
  GH: {
    'accra': { lat: 5.6037, lon: -0.187, tz: 'Africa/Accra' },
  },
  MA: {
    'casablanca': { lat: 33.5731, lon: -7.5898, tz: 'Africa/Casablanca' },
  },
  ET: {
    'addis ababa': { lat: 9.025, lon: 38.7469, tz: 'Africa/Addis_Ababa' },
  },
};

const COUNTRY_LABELS = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', PR: 'Puerto Rico',
  BR: 'Brazil', AR: 'Argentina', CO: 'Colombia', PE: 'Peru', CL: 'Chile', VE: 'Venezuela',
  GB: 'United Kingdom', FR: 'France', DE: 'Germany', IT: 'Italy', ES: 'Spain',
  NL: 'Netherlands', AT: 'Austria', IE: 'Ireland', PT: 'Portugal', GR: 'Greece',
  RU: 'Russia', TR: 'Turkey', CZ: 'Czech Republic', PL: 'Poland', HU: 'Hungary',
  RO: 'Romania', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  BE: 'Belgium', CH: 'Switzerland', UA: 'Ukraine',
  JP: 'Japan', CN: 'China', IN: 'India', SG: 'Singapore', TH: 'Thailand',
  KR: 'South Korea', HK: 'Hong Kong', AE: 'UAE', IL: 'Israel', TW: 'Taiwan',
  PH: 'Philippines', ID: 'Indonesia', MY: 'Malaysia', VN: 'Vietnam',
  PK: 'Pakistan', IR: 'Iran', SA: 'Saudi Arabia',
  AU: 'Australia', NZ: 'New Zealand',
  EG: 'Egypt', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya',
  GH: 'Ghana', MA: 'Morocco', ET: 'Ethiopia',
};

const SORTED_COUNTRIES = Object.keys(COUNTRY_LABELS).sort((a, b) =>
  COUNTRY_LABELS[a].localeCompare(COUNTRY_LABELS[b])
);

const TZ_OFFSETS = {
  'America/New_York': { standard: -5, dst: -4 },
  'America/Chicago': { standard: -6, dst: -5 },
  'America/Denver': { standard: -7, dst: -6 },
  'America/Los_Angeles': { standard: -8, dst: -7 },
  'America/Phoenix': { standard: -7, dst: -7 },
  'America/Anchorage': { standard: -9, dst: -8 },
  'Pacific/Honolulu': { standard: -10, dst: -10 },
  'America/Toronto': { standard: -5, dst: -4 },
  'America/Vancouver': { standard: -8, dst: -7 },
  'America/Mexico_City': { standard: -6, dst: -5 },
  'America/Sao_Paulo': { standard: -3, dst: -3 },
  'America/Argentina/Buenos_Aires': { standard: -3, dst: -3 },
  'Europe/London': { standard: 0, dst: 1 },
  'Europe/Paris': { standard: 1, dst: 2 },
  'Europe/Berlin': { standard: 1, dst: 2 },
  'Europe/Rome': { standard: 1, dst: 2 },
  'Europe/Madrid': { standard: 1, dst: 2 },
  'Europe/Amsterdam': { standard: 1, dst: 2 },
  'Europe/Vienna': { standard: 1, dst: 2 },
  'Europe/Dublin': { standard: 0, dst: 1 },
  'Europe/Lisbon': { standard: 0, dst: 1 },
  'Europe/Athens': { standard: 2, dst: 3 },
  'Europe/Moscow': { standard: 3, dst: 3 },
  'Europe/Istanbul': { standard: 3, dst: 3 },
  'Asia/Tokyo': { standard: 9, dst: 9 },
  'Asia/Shanghai': { standard: 8, dst: 8 },
  'Asia/Kolkata': { standard: 5.5, dst: 5.5 },
  'Asia/Singapore': { standard: 8, dst: 8 },
  'Asia/Bangkok': { standard: 7, dst: 7 },
  'Asia/Seoul': { standard: 9, dst: 9 },
  'Asia/Hong_Kong': { standard: 8, dst: 8 },
  'Asia/Dubai': { standard: 4, dst: 4 },
  'Asia/Jerusalem': { standard: 2, dst: 3 },
  'Australia/Sydney': { standard: 11, dst: 10 },
  'Australia/Melbourne': { standard: 11, dst: 10 },
  'America/Boise': { standard: -7, dst: -6 },
  'America/Edmonton': { standard: -7, dst: -6 },
  'America/Winnipeg': { standard: -6, dst: -5 },
  'America/Halifax': { standard: -4, dst: -3 },
  'America/Puerto_Rico': { standard: -4, dst: -4 },
  'America/Bogota': { standard: -5, dst: -5 },
  'America/Lima': { standard: -5, dst: -5 },
  'America/Santiago': { standard: -4, dst: -3 },
  'America/Caracas': { standard: -4, dst: -4 },
  'Europe/Prague': { standard: 1, dst: 2 },
  'Europe/Warsaw': { standard: 1, dst: 2 },
  'Europe/Budapest': { standard: 1, dst: 2 },
  'Europe/Bucharest': { standard: 2, dst: 3 },
  'Europe/Stockholm': { standard: 1, dst: 2 },
  'Europe/Oslo': { standard: 1, dst: 2 },
  'Europe/Copenhagen': { standard: 1, dst: 2 },
  'Europe/Helsinki': { standard: 2, dst: 3 },
  'Europe/Brussels': { standard: 1, dst: 2 },
  'Europe/Zurich': { standard: 1, dst: 2 },
  'Europe/Kiev': { standard: 2, dst: 3 },
  'Asia/Taipei': { standard: 8, dst: 8 },
  'Asia/Manila': { standard: 8, dst: 8 },
  'Asia/Jakarta': { standard: 7, dst: 7 },
  'Asia/Kuala_Lumpur': { standard: 8, dst: 8 },
  'Asia/Ho_Chi_Minh': { standard: 7, dst: 7 },
  'Asia/Karachi': { standard: 5, dst: 5 },
  'Asia/Tehran': { standard: 3.5, dst: 4.5 },
  'Asia/Riyadh': { standard: 3, dst: 3 },
  'Australia/Brisbane': { standard: 10, dst: 10 },
  'Australia/Perth': { standard: 8, dst: 8 },
  'Pacific/Auckland': { standard: 13, dst: 12 },
  'Africa/Cairo': { standard: 2, dst: 2 },
  'Africa/Johannesburg': { standard: 2, dst: 2 },
  'Africa/Lagos': { standard: 1, dst: 1 },
  'Africa/Nairobi': { standard: 3, dst: 3 },
  'Africa/Accra': { standard: 0, dst: 0 },
  'Africa/Casablanca': { standard: 1, dst: 0 },
  'Africa/Addis_Ababa': { standard: 3, dst: 3 },
};

function lookupCity(countryCode, name) {
  const cities = COUNTRY_CITIES[countryCode];
  if (!cities) return null;
  const key = name.trim().toLowerCase();
  return cities[key] || null;
}

function isDST(year, month, day, tz) {
  if (tz.startsWith('America/') && tz !== 'America/Phoenix' && tz !== 'America/Argentina/Buenos_Aires' && tz !== 'America/Sao_Paulo') {
    const marchSecondSun = (() => { const d = new Date(year, 2, 1); const dow = d.getDay(); return dow === 0 ? 8 : 8 + (7 - dow); })();
    const novFirstSun = (() => { const d = new Date(year, 10, 1); const dow = d.getDay(); return dow === 0 ? 1 : 1 + (7 - dow); })();
    if (month > 3 && month < 11) return true;
    if (month === 3 && day >= marchSecondSun) return true;
    if (month === 11 && day < novFirstSun) return true;
    return false;
  }
  if (tz.startsWith('Europe/') && tz !== 'Europe/Moscow' && tz !== 'Europe/Istanbul') {
    const marchLastSun = (() => { const d = new Date(year, 2, 31); return 31 - d.getDay(); })();
    const octLastSun = (() => { const d = new Date(year, 9, 31); return 31 - d.getDay(); })();
    if (month > 3 && month < 10) return true;
    if (month === 3 && day >= marchLastSun) return true;
    if (month === 10 && day < octLastSun) return true;
    return false;
  }
  if (tz.startsWith('Australia/')) {
    const octFirstSun = (() => { const d = new Date(year, 9, 1); const dow = d.getDay(); return dow === 0 ? 1 : 1 + (7 - dow); })();
    const aprFirstSun = (() => { const d = new Date(year, 3, 1); const dow = d.getDay(); return dow === 0 ? 1 : 1 + (7 - dow); })();
    if (month > 10 || month < 4) return true;
    if (month === 10 && day >= octFirstSun) return true;
    if (month === 4 && day < aprFirstSun) return true;
    return false;
  }
  return false;
}

function getUTCOffset(tz, year, month, day) {
  const tzData = TZ_OFFSETS[tz];
  if (!tzData) return 0;
  const dst = isDST(year, month, day, tz);
  return dst ? tzData.dst : tzData.standard;
}

function NatalChartInput({ existingChart, onSave }) {
  const [expanded, setExpanded] = useState(!existingChart);
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cityMatch, setCityMatch] = useState(null);

  const handleCountryChange = useCallback((code) => {
    setCountry(code);
    setCityInput('');
    setCityMatch(null);
  }, []);

  const handleCityChange = useCallback((value) => {
    setCityInput(value);
    if (country) {
      setCityMatch(lookupCity(country, value));
    } else {
      setCityMatch(null);
    }
  }, [country]);

  const handleCompute = async () => {
    setError('');
    if (!country) { setError('Please select a country.'); return; }
    if (!birthDate) { setError('Please enter your birth date.'); return; }
    if (!cityInput.trim()) { setError('Please enter your birth city.'); return; }

    const city = lookupCity(country, cityInput);
    if (!city) { setError('City not found. Try a major city name in ' + COUNTRY_LABELS[country] + '.'); return; }

    const [yearStr, monthStr, dayStr] = birthDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    let hour = -1;
    let minute = 0;
    if (birthTime) {
      const [hStr, mStr] = birthTime.split(':');
      hour = parseInt(hStr, 10);
      minute = parseInt(mStr, 10);
    }

    const utcOffset = getUTCOffset(city.tz, year, month, day);

    setLoading(true);
    try {
      const res = await apiFetch('/api/celestial?type=natal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year, month, day, hour, minute,
          latitude: city.lat,
          longitude: city.lon,
          city: cityInput.trim(),
          utcOffset,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to compute chart.'); setLoading(false); return; }
      await onSave(data.chart);
      setExpanded(false);
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="natal-input-section">
      <button className="natal-input-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Cancel' : existingChart ? 'Update Birth Data' : 'Enter Birth Data'}
      </button>
      {expanded && (
        <div className="natal-input-form">
          <div className="natal-input-row">
            <label className="natal-input-label">
              Country
              <select
                className="natal-input-field natal-input-select"
                value={country}
                onChange={e => handleCountryChange(e.target.value)}
              >
                <option value="">Select country...</option>
                {SORTED_COUNTRIES.map(code => (
                  <option key={code} value={code}>{COUNTRY_LABELS[code]}</option>
                ))}
              </select>
            </label>
          </div>
          {country && (
            <div className="natal-input-row">
              <label className="natal-input-label">
                Birth City
                <input
                  type="text"
                  className="natal-input-field"
                  placeholder="e.g. Birmingham, Nashville..."
                  value={cityInput}
                  onChange={e => handleCityChange(e.target.value)}
                />
                {cityInput.trim() && cityMatch && (
                  <span className="natal-input-hint natal-city-found">
                    {cityMatch.lat.toFixed(2)}, {cityMatch.lon.toFixed(2)}
                  </span>
                )}
                {cityInput.trim() && !cityMatch && (
                  <span className="natal-input-hint natal-city-not-found">City not recognized</span>
                )}
              </label>
            </div>
          )}
          <div className="natal-input-row">
            <label className="natal-input-label">
              Birth Date
              <input
                type="date"
                className="natal-input-field"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </label>
          </div>
          <div className="natal-input-row">
            <label className="natal-input-label">
              Birth Time <span className="natal-input-optional">(optional)</span>
              <input
                type="time"
                className="natal-input-field"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
              />
              <span className="natal-input-hint">For Rising sign and house placements</span>
            </label>
          </div>
          {error && <div className="natal-input-error">{error}</div>}
          <button
            className="natal-input-compute"
            onClick={handleCompute}
            disabled={loading}
          >
            {loading ? 'Computing...' : 'Compute Chart'}
          </button>
        </div>
      )}
    </div>
  );
}
