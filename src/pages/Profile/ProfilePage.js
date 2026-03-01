import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useCoursework } from '../../coursework/CourseworkContext';
import { useProfile } from '../../profile/ProfileContext';
import { RANKS, rankProgress } from '../../profile/profileEngine';
import ProfileChat from '../../profile/ProfileChat';
import GuildApplicationChat from '../../profile/GuildApplicationChat';
import ConsultingSetupChat from '../../profile/ConsultingSetupChat';
import { GUILD_STATUS, GUILD_TYPES, getGuildDisplay, getGuildCourseChecklist, DEFAULT_GUILD_CAPACITY, MAX_GUILD_BIO_LENGTH, MAX_GUILD_CAPACITY } from '../../profile/guildEngine';
import { PARTNER_STATUS, MAX_ENTITY_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_MYTHIC_RELATION_LENGTH } from '../../profile/partnerEngine';
import { validatePhoto, uploadProfilePhoto } from '../../profile/photoUpload';
import { checkAvailability, registerHandle } from '../../multiplayer/handleService';
import { apiFetch } from '../../lib/chatApi';
import { computeNumerology, NUMBER_MEANINGS, NUMBER_TYPES } from '../../profile/numerologyEngine';
import FriendsSection from './FriendsSection';
import MyStoryArc from './MyStoryArc';
import StoryCardDeck from './StoryCardDeck';
import { useFellowship } from '../../contexts/FellowshipContext';
import FellowshipPost from '../../components/fellowship/FellowshipPost';
import { useStoryCardSync } from '../../storyCards/useStoryCardSync';
import { NatalChartDisplay, NatalChartInput, ZODIAC_SYMBOLS } from '../Divination/natalChartComponents';
import './ProfilePage.css';

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
    details: 'The Yellow Brick Road is a guided, stage-by-stage journey through the monomyth. Atlas walks alongside you as you encounter mythic figures at each threshold \u2014 gods, tricksters, guides, and shadow guardians drawn from world mythology. Answer their challenges through conversation to advance along the path.',
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
  {
    id: 'teaching', name: 'Teaching', price: '$25/mo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    ),
    description: 'Map your syllabus to Mythouse content and build course footprints for your students.',
    hasCustomContent: true,
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
  const { earnedRanks, highestRank, activeCredentials, hasProfile, loaded: profileLoaded, handle, natalChart, updateNatalChart, numerologyName, updateNumerologyName, luckyNumber, updateLuckyNumber, subscriptions, purchases, hasStripeAccount, initiateCheckout, openBillingPortal, refreshProfile, guildData, qualifiedGuildTypes, guildEligible, guildCoursesComplete, effectiveGuildStatus, pairingCategories, updateGuildBio, updateGuildCapacity, publishToDirectory, unpublishFromDirectory, respondToPairing, endPairing, photoURL, consultingData, consultingCategories, updateProfilePhoto, respondToConsulting, apiKeys, saveApiKey, removeApiKey, hasAnthropicKey, hasOpenaiKey, mythouseApiKey, hasMythouseKey, generateMythouseKey, regenerateMythouseKey, social, updateSocial, pilgrimages, pilgrimagesLoaded, removePilgrimage, personalStory, savePersonalStory, curatorApproved, ringSize, updateRingSize, partnerData, partnerStatus, partnerDisplay, partnerMembershipCategories, submitPartnerApplication, updatePartnerProfile, publishPartnerDirectory, unpublishPartnerDirectory, inviteRepresentative, requestJoinPartner, respondToPartnerMembership, endPartnerMembership, userTier, tierConfig, usageData, messagesUsed, messagesRemaining, isByok } = useProfile();
const { cards: storyCards, loaded: storyCardsLoaded, vaultCardIds, toggleVaultCard } = useStoryCardSync();
  const { myVaultPosts, myProfilePosts, deletePost: deleteFellowshipPost } = useFellowship();
  const navigate = useNavigate();
  const location = useLocation();
  const [showVault, setShowVault] = useState(false);
  const [showProfilePosts, setShowProfilePosts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showGuildChat, setShowGuildChat] = useState(false);
  const [showConsultingChat, setShowConsultingChat] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); // 'ybr' | 'forge' | etc.
  const [showSocial, setShowSocial] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    story: true, astrology: true, credentials: true, curator: true,
    certificates: true, ranks: true, addons: true, courses: true,
    sites: true, ai: true, app: true,
  });
  const toggleSection = useCallback((key) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] })), []);
  const openSection = useCallback((key) => setCollapsedSections(prev => ({ ...prev, [key]: false })), []);
  const [consultingRespondingId, setConsultingRespondingId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // itemId being checked out
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [donationAmount, setDonationAmount] = useState(''); // for pay-what-you-want items
  const [launchKey, setLaunchKey] = useState(''); // sales key to activate items for free
  const [showFullBio, setShowFullBio] = useState(false);

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

  // Open section + scroll when navigated with hash
  const HASH_TO_SECTION = useMemo(() => ({
    subscriptions: 'addons', purchases: 'addons',
    'section-natal-chart': 'astrology', 'section-numerology': 'astrology',
    'section-credentials': 'credentials', 'section-ranks': 'ranks',
    'section-guild': null, // handled by GuildSection's own state
  }), []);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const sectionKey = HASH_TO_SECTION[id];
    if (sectionKey) openSection(sectionKey);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [location.hash, HASH_TO_SECTION, openSection]);
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

  // Guild display for basics card
  const guildDisplay = effectiveGuildStatus === 'active' ? getGuildDisplay(guildData) : null;

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

    // Line 2: Guild + astrology
    const parts2 = [];
    if (effectiveGuildStatus === 'active' && guildData?.type) {
      const mt = GUILD_TYPES[guildData.type];
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
  }, [highestRank, activeCredentials, effectiveGuildStatus, guildData, sunSign, moonSign, risingSign, luckyNumber, completed.length, pilgrimages]);

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

        {/* Profile Summary — first line always visible, rest expandable */}
        {summaryLines.length > 0 && (
          <div className="profile-summary">
            <div className="profile-summary-line">{summaryLines[0]}</div>
            {showFullBio && summaryLines.slice(1).map((line, i) => (
              <div key={i} className="profile-summary-line">{line}</div>
            ))}
          </div>
        )}

        {!showFullBio ? (
          <button className="profile-bio-toggle" onClick={() => setShowFullBio(true)}>
            More <span className="profile-section-chevron">&#9662;</span>
          </button>
        ) : (
          <>
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
            {(earnedRanks.length > 0 || activeCredentials.length > 0 || sunSymbol || luckyNumber != null || guildDisplay) && (
              <div className="profile-badges-row">
                {earnedRanks.map(rank => (
                  <span key={rank.id} className="profile-badge" title={rank.name} onClick={() => { openSection('ranks'); setTimeout(() => document.getElementById('section-ranks')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
                    {rank.icon}
                  </span>
                ))}
                {activeCredentials.map(cred => (
                  <span key={cred.category} className="profile-badge credential" title={`${cred.display.name} (L${cred.level})`} onClick={() => { openSection('credentials'); setTimeout(() => document.getElementById('section-credentials')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
                    {cred.display.icon}
                  </span>
                ))}
                {guildDisplay && (
                  <span className="profile-badge guild-member" title={guildDisplay.title} onClick={() => { setTimeout(() => document.getElementById('section-guild')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
                    {guildDisplay.icon}
                  </span>
                )}
                {sunSymbol && (
                  <span className="profile-badge sun-sign" title={`Sun in ${sunSign.sign}`} onClick={() => { openSection('astrology'); setTimeout(() => document.getElementById('section-natal-chart')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
                    {sunSymbol}
                  </span>
                )}
                {luckyNumber != null && (
                  <span className="profile-badge lucky-number" title={`Lucky Number ${luckyNumber}`} onClick={() => { openSection('astrology'); setTimeout(() => document.getElementById('section-natal-chart')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
                    {luckyNumber}
                  </span>
                )}
              </div>
            )}

            <button className="profile-bio-toggle" onClick={() => setShowFullBio(false)}>
              Less <span className="profile-section-chevron open">&#9662;</span>
            </button>
          </>
        )}
      </div>

      {/* ── Usage & Plan ── */}
      <div className="profile-usage-dashboard">
        <div className="profile-usage-header">
          <div className="profile-usage-plan">
            <span className="profile-usage-plan-name">{tierConfig.label}</span>
            <span className="profile-usage-plan-price">
              {userTier === 'free' ? 'Free' : userTier === 'journeyer' ? '$12/mo' : '$49/mo'}
            </span>
          </div>
          {isByok && <span className="profile-usage-byok-badge">BYOK — Unlimited</span>}
        </div>

        {/* Messages progress */}
        <div className="profile-usage-meter">
          <div className="profile-usage-meter-label">
            <span>Messages</span>
            <span className={`profile-usage-meter-count${messagesRemaining <= Math.ceil(tierConfig.monthlyMessages * 0.2) ? (messagesRemaining <= 0 ? ' at-limit' : ' low') : ''}`}>
              {isByok ? `${messagesUsed} used (unlimited)` : `${messagesUsed} / ${tierConfig.monthlyMessages} this month`}
            </span>
          </div>
          {!isByok && (
            <div className="profile-usage-bar">
              <div
                className={`profile-usage-bar-fill${messagesRemaining <= 0 ? ' at-limit' : messagesRemaining <= Math.ceil(tierConfig.monthlyMessages * 0.2) ? ' low' : ''}`}
                style={{ width: `${Math.min(100, (messagesUsed / tierConfig.monthlyMessages) * 100)}%` }}
              />
            </div>
          )}
          {!isByok && (
            <div className="profile-usage-meter-sub">
              Resets on the 1st of each month
            </div>
          )}
        </div>

        {/* Storage estimate */}
        {usageData?.storageEstimateMB != null && (
          <div className="profile-usage-meter">
            <div className="profile-usage-meter-label">
              <span>Storage</span>
              <span>~{usageData.storageEstimateMB} MB / {tierConfig.storageMB >= 1000 ? `${tierConfig.storageMB / 1000} GB` : `${tierConfig.storageMB} MB`}</span>
            </div>
            <div className="profile-usage-bar">
              <div
                className={`profile-usage-bar-fill${usageData.storageEstimateMB >= tierConfig.storageMB * 0.9 ? ' low' : ''}`}
                style={{ width: `${Math.min(100, (usageData.storageEstimateMB / tierConfig.storageMB) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tier selection cards */}
        {userTier !== 'keeper' && !isByok && (
          <div className="profile-tier-cards">
            {userTier === 'free' && (
              <button
                className="profile-tier-card upgrade"
                onClick={() => { setCheckoutLoading('tier-journeyer'); initiateCheckout('tier-journeyer').finally(() => setCheckoutLoading(null)); }}
                disabled={checkoutLoading === 'tier-journeyer'}
              >
                <span className="profile-tier-card-name">Journeyer</span>
                <span className="profile-tier-card-price">$12/mo</span>
                <span className="profile-tier-card-detail">500 messages/mo, 500 MB storage</span>
                {checkoutLoading === 'tier-journeyer' ? 'Loading...' : 'Upgrade'}
              </button>
            )}
            <button
              className="profile-tier-card upgrade"
              onClick={() => { setCheckoutLoading('tier-keeper'); initiateCheckout('tier-keeper').finally(() => setCheckoutLoading(null)); }}
              disabled={checkoutLoading === 'tier-keeper'}
            >
              <span className="profile-tier-card-name">Keeper</span>
              <span className="profile-tier-card-price">$49/mo</span>
              <span className="profile-tier-card-detail">3,000 messages/mo, 5 GB storage</span>
              {checkoutLoading === 'tier-keeper' ? 'Loading...' : 'Upgrade'}
            </button>
          </div>
        )}

        {/* BYOK tip */}
        {!isByok && (
          <div className="profile-usage-tip" onClick={() => { openSection('ai'); setTimeout(() => document.getElementById('section-ai')?.scrollIntoView({ behavior: 'smooth' }), 50); }}>
            Add your own API key below for unlimited messages on any plan.
          </div>
        )}

        {/* Billing portal */}
        {hasStripeAccount && (
          <button className="profile-billing-link" onClick={openBillingPortal}>
            Manage billing &amp; subscriptions
          </button>
        )}
      </div>

      {/* My Story */}
      <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('story')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('story'); }}>
        My Story
        <span className={`profile-section-chevron${!collapsedSections.story ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.story && (!storyEditing && personalStory?.transmuted ? (
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
      ))}

      {/* Astrology Section — wraps Natal Chart + Numerology */}
      <h2 id="section-natal-chart" className="profile-section-title profile-section-toggle" onClick={() => toggleSection('astrology')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('astrology'); }}>
        Astrology
        <span className={`profile-section-chevron${!collapsedSections.astrology ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.astrology && (
        <>
          {/* Natal Chart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 className="profile-subsection-title" style={{ margin: 0 }}>Natal Chart</h3>
            {natalChart?.birthData && (
              <button
                className="profile-ring-btn"
                title="My Rings"
                onClick={() => {
                  const bd = natalChart.birthData;
                  const mm = String(bd.month).padStart(2, '0');
                  const dd = String(bd.day).padStart(2, '0');
                  navigate(`/ring?birthday=${bd.year}-${mm}-${dd}`);
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <defs>
                    <linearGradient id="crGold" x1="4" y1="4" x2="20" y2="20">
                      <stop offset="0%" stopColor="#f5e6a8" />
                      <stop offset="35%" stopColor="#d4a830" />
                      <stop offset="65%" stopColor="#8a6e1e" />
                      <stop offset="100%" stopColor="#c9a040" />
                    </linearGradient>
                    <radialGradient id="crRuby" cx="50%" cy="35%">
                      <stop offset="0%" stopColor="#ff3050" />
                      <stop offset="100%" stopColor="#a00820" />
                    </radialGradient>
                  </defs>
                  <circle cx="12" cy="12" r="7.5" stroke="url(#crGold)" strokeWidth="2.2" />
                  <circle cx="12" cy="4.2" r="2" fill="url(#crRuby)" />
                  <circle cx="12" cy="4.2" r="2" fill="none" stroke="#f5e6a8" strokeWidth="0.3" opacity="0.5" />
                  <circle cx="17.3" cy="7.5" r="1.15" fill="#1ba34a" />
                  <circle cx="19.1" cy="13.5" r="1.15" fill="#d8deff" />
                  <circle cx="15" cy="18.4" r="1.15" fill="#e05030" />
                  <circle cx="9" cy="18.4" r="1.15" fill="#e8b820" />
                  <circle cx="4.9" cy="13.5" r="1.15" fill="#1838a0" />
                  <circle cx="6.7" cy="7.5" r="1.15" fill="#eae6de" />
                </svg>
                <span className="profile-ring-btn-label">My Rings</span>
              </button>
            )}
            {natalChart?.birthData && (
              <span className="profile-ring-size-inline">
                <label className="profile-ring-size-label">Ring size</label>
                <input
                  type="number"
                  className="profile-ring-size-input"
                  min="1"
                  max="16"
                  step="0.5"
                  placeholder="—"
                  value={ringSize ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateRingSize(v === '' ? null : parseFloat(v));
                  }}
                />
              </span>
            )}
          </div>
          <NatalChartDisplay chart={natalChart} />
          <NatalChartInput existingChart={natalChart} onSave={updateNatalChart} />

          {/* Numerology */}
          <h3 className="profile-subsection-title">Numerology</h3>
          <NumerologyDisplay
            savedName={numerologyName}
            displayName={user?.displayName}
            onSave={updateNumerologyName}
            luckyNumber={luckyNumber}
            onSaveLucky={updateLuckyNumber}
          />
        </>
      )}

      {/* My Story Cards (with Story Matching pop-down) */}
      <StoryCardDeck cards={storyCards} loaded={storyCardsLoaded} vaultCardIds={vaultCardIds} onToggleVault={toggleVaultCard} />

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
      <h2 id="section-credentials" className="profile-section-title profile-section-toggle" onClick={() => toggleSection('credentials')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('credentials'); }}>
        Credentials
        <span className={`profile-section-chevron${!collapsedSections.credentials ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.credentials && (
        <>
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
        </>
      )}

      {/* Curator Section */}
      {profileLoaded && curatorApproved && (
        <>
          <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('curator')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('curator'); }}>
            Curator
            <span className={`profile-section-chevron${!collapsedSections.curator ? ' open' : ''}`}>&#9662;</span>
          </h2>
          {!collapsedSections.curator && (
            <>
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
        </>
      )}

      {/* Guild Section */}
      {profileLoaded && (
        <GuildSection
          effectiveGuildStatus={effectiveGuildStatus}
          guildEligible={guildEligible}
          qualifiedGuildTypes={qualifiedGuildTypes}
          guildData={guildData}
          guildCoursesComplete={guildCoursesComplete}
          completedCourses={completedCourses}
          allCourses={allCourses}
          showGuildChat={showGuildChat}
          setShowGuildChat={setShowGuildChat}
          showConsultingChat={showConsultingChat}
          setShowConsultingChat={setShowConsultingChat}
          pairingCategories={pairingCategories}
          updateGuildBio={updateGuildBio}
          updateGuildCapacity={updateGuildCapacity}
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

      {/* Partner Section */}
      {profileLoaded && (
        <PartnerSection
          partnerStatus={partnerStatus}
          partnerData={partnerData}
          partnerDisplay={partnerDisplay}
          partnerMembershipCategories={partnerMembershipCategories}
          submitPartnerApplication={submitPartnerApplication}
          updatePartnerProfile={updatePartnerProfile}
          publishPartnerDirectory={publishPartnerDirectory}
          unpublishPartnerDirectory={unpublishPartnerDirectory}
          inviteRepresentative={inviteRepresentative}
          respondToPartnerMembership={respondToPartnerMembership}
          endPartnerMembership={endPartnerMembership}
        />
      )}

      {/* Certificates */}
      <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('certificates')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('certificates'); }}>
        Certificates
        <span className={`profile-section-chevron${!collapsedSections.certificates ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.certificates && (certificates.length === 0 ? (
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
      ))}

      {/* Ranks Section */}
      <h2 id="section-ranks" className="profile-section-title profile-section-toggle" onClick={() => toggleSection('ranks')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('ranks'); }}>
        Ranks
        <span className={`profile-section-chevron${!collapsedSections.ranks ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.ranks && (
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
      )}

      {/* Membership Add-Ons */}
      <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('addons')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('addons'); }}>
        Membership Add-Ons
        <span className={`profile-section-chevron${!collapsedSections.addons ? ' open' : ''}`}>&#9662;</span>
      </h2>

      {!collapsedSections.addons && (
      <>
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
                    ) : sub.hasCustomContent && sub.id === 'teaching' ? (
                      <>
                        <p>Upload or paste a syllabus and Mythouse will match your course topics to its content — myths, archetypes, planetary correspondences, games, and more. Save the resulting footprint so your students can follow along on the site as they study.</p>
                        <button
                          className="profile-stripe-btn subscribe"
                          style={{ marginTop: 12, display: 'inline-block' }}
                          onClick={() => navigate('/teacher')}
                        >
                          Open Teacher Mode &rarr;
                        </button>
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
      </>
      )}

      {/* Active Courses */}
      <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('courses')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('courses'); }}>
        Courses
        <span className={`profile-section-chevron${!collapsedSections.courses ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.courses && (activeCourses.length === 0 ? (
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
      ))}

      {/* Friends Section */}
      <FriendsSection />

      {/* Secret Vault */}
      {myVaultPosts.length > 0 && (
        <>
          <h2
            className="profile-section-title profile-section-toggle"
            onClick={() => setShowVault(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowVault(v => !v); }}
          >
            Secret Vault ({myVaultPosts.length})
            <span className={`profile-section-chevron${showVault ? ' open' : ''}`}>&#9662;</span>
          </h2>
          {showVault && (
            <div className="profile-vault-posts">
              {myVaultPosts.map(post => (
                <FellowshipPost key={post.id} post={post} currentUid={user?.uid} onDelete={deleteFellowshipPost} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Profile Posts */}
      {myProfilePosts.length > 0 && (
        <>
          <h2
            className="profile-section-title profile-section-toggle"
            onClick={() => setShowProfilePosts(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowProfilePosts(v => !v); }}
          >
            Profile Posts ({myProfilePosts.length})
            <span className={`profile-section-chevron${showProfilePosts ? ' open' : ''}`}>&#9662;</span>
          </h2>
          {showProfilePosts && (
            <div className="profile-profile-posts">
              {myProfilePosts.map(post => (
                <FellowshipPost key={post.id} post={post} currentUid={user?.uid} onDelete={deleteFellowshipPost} />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Story Arc */}
      <MyStoryArc />

      {/* My Sacred Sites (Pilgrimages) */}
      <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('sites')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('sites'); }}>
        My Sacred Sites
        <span className={`profile-section-chevron${!collapsedSections.sites ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.sites && pilgrimagesLoaded && (() => {
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
      <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('ai')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('ai'); }}>
        AI Settings
        <span className={`profile-section-chevron${!collapsedSections.ai ? ' open' : ''}`}>&#9662;</span>
      </h2>
      {!collapsedSections.ai && (
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
      )}

      {/* Install App */}
      {!appInstalled && (
        <div className="profile-install-app-section">
          <h2 className="profile-section-title profile-section-toggle" onClick={() => toggleSection('app')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSection('app'); }}>
            Get the App
            <span className={`profile-section-chevron${!collapsedSections.app ? ' open' : ''}`}>&#9662;</span>
          </h2>

          {!collapsedSections.app && (
          <>
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
        </>
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

function GuildSection({ effectiveGuildStatus, guildEligible, qualifiedGuildTypes, guildData, guildCoursesComplete, completedCourses, allCourses, showGuildChat, setShowGuildChat, showConsultingChat, setShowConsultingChat, pairingCategories, updateGuildBio, updateGuildCapacity, publishToDirectory, unpublishFromDirectory, respondToPairing, endPairing, consultingData, consultingCategories, onConsultingAccept, onConsultingDecline, consultingRespondingId }) {
  const display = getGuildDisplay(guildData);
  const courseChecklist = getGuildCourseChecklist(completedCourses);
  const navigate = useNavigate();
  const [sectionCollapsed, setSectionCollapsed] = useState(true);

  // Bio editor state
  const [bioText, setBioText] = useState(guildData?.bio || '');
  const [bioSaving, setBioSaving] = useState(false);
  const [capValue, setCapValue] = useState(guildData?.capacity || DEFAULT_GUILD_CAPACITY);
  const [capSaving, setCapSaving] = useState(false);
  const [dirToggling, setDirToggling] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  // Sync bio/capacity from guildData when it changes
  useEffect(() => {
    setBioText(guildData?.bio || '');
    setCapValue(guildData?.capacity || DEFAULT_GUILD_CAPACITY);
  }, [guildData?.bio, guildData?.capacity]);

  const handleBioSave = async () => {
    setBioSaving(true);
    try { await updateGuildBio(bioText); } catch {}
    setBioSaving(false);
  };

  const handleCapSave = async () => {
    setCapSaving(true);
    try { await updateGuildCapacity(capValue); } catch {}
    setCapSaving(false);
  };

  const handleDirectoryToggle = async () => {
    setDirToggling(true);
    try {
      if (guildData?.directoryListed) {
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
      <h2 id="section-guild" className="profile-section-title profile-section-toggle" onClick={() => setSectionCollapsed(v => !v)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSectionCollapsed(v => !v); }}>
        Guild Membership
        <span className={`profile-section-chevron${!sectionCollapsed ? ' open' : ''}`}>&#9662;</span>
      </h2>

      {!sectionCollapsed && (
      <>
      {effectiveGuildStatus === GUILD_STATUS.NOT_QUALIFIED && !guildEligible && (
        <div className="profile-empty">
          Guild roles require Level 2+ credentials. Continue building your profile to unlock guild membership opportunities.
        </div>
      )}

      {effectiveGuildStatus === GUILD_STATUS.NOT_QUALIFIED && guildEligible && !guildData && (
        <>
          <div className="guild-member-eligible">
            <p>You qualify for the following guild roles:</p>
            <div className="guild-member-type-list">
              {qualifiedGuildTypes.map(mt => (
                <div key={mt.id} className="guild-member-type-card">
                  <span className="guild-member-badge-icon">{mt.icon}</span>
                  <div>
                    <div className="guild-member-badge-title">{mt.title}</div>
                    <div className="profile-credential-details">
                      Based on {mt.credentialName} (Level {mt.credentialLevel})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {showGuildChat ? (
            <GuildApplicationChat
              onComplete={() => setShowGuildChat(false)}
              qualifiedGuildTypes={qualifiedGuildTypes}
            />
          ) : (
            <button className="profile-setup-btn" onClick={() => setShowGuildChat(true)}>
              Apply to Become a Guild Member
            </button>
          )}
        </>
      )}

      {effectiveGuildStatus === GUILD_STATUS.APPLIED && display && (
        <div className="guild-member-status-card pending">
          <span className="guild-member-badge-icon">{display.icon}</span>
          <div>
            <div className="guild-member-badge-title">{display.title}</div>
            <div className="profile-credential-details">Application submitted. Atlas is reviewing your application.</div>
          </div>
        </div>
      )}

      {effectiveGuildStatus === GUILD_STATUS.PENDING_ADMIN && display && (
        <div className="guild-member-status-card pending">
          <span className="guild-member-badge-icon">{display.icon}</span>
          <div>
            <div className="guild-member-badge-title">{display.title}</div>
            <div className="profile-credential-details">Passed initial screening. Awaiting final review by administration.</div>
          </div>
        </div>
      )}

      {effectiveGuildStatus === GUILD_STATUS.APPROVED && display && (
        <div className="guild-member-status-card approved">
          <span className="guild-member-badge-icon">{display.icon}</span>
          <div>
            <div className="guild-member-badge-title">{display.title} — Approved</div>
            {!guildData?.guildContractAccepted && (
              <div className="profile-credential-details" style={{ color: 'var(--accent-gold)', marginBottom: 8 }}>
                Please review and accept the Guild Agreement to continue.
              </div>
            )}
            {!guildCoursesComplete && (
              <>
                <div className="profile-credential-details">Complete these courses to activate your guild status:</div>
                <ul className="guild-member-course-checklist">
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

      {effectiveGuildStatus === GUILD_STATUS.ACTIVE && display && (
        <>
          <div className="guild-member-status-card active">
            <span className="guild-member-badge-icon">{display.icon}</span>
            <div>
              <div className="guild-member-badge-title">{display.title}</div>
              <div className="profile-credential-details">Active Guild Member</div>
            </div>
          </div>

          {/* Bio editor */}
          <div className="guild-member-bio-editor">
            <label className="guild-member-bio-label">Public Bio</label>
            <textarea
              className="guild-member-bio-textarea"
              value={bioText}
              onChange={e => setBioText(e.target.value)}
              maxLength={MAX_GUILD_BIO_LENGTH}
              rows={4}
              placeholder="Write a short bio for students to see..."
            />
            <div className="guild-member-bio-footer">
              <span className="guild-member-bio-charcount">{bioText.length}/{MAX_GUILD_BIO_LENGTH}</span>
              <button className="guild-member-bio-save-btn" onClick={handleBioSave} disabled={bioSaving || bioText === (guildData?.bio || '')}>
                {bioSaving ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          </div>

          {/* Capacity setter */}
          <div className="guild-member-capacity-control">
            <label className="guild-member-capacity-label">Max Students</label>
            <div className="guild-member-capacity-row">
              <input
                type="number"
                className="guild-member-capacity-input"
                value={capValue}
                min={1}
                max={MAX_GUILD_CAPACITY}
                onChange={e => setCapValue(Math.max(1, Math.min(MAX_GUILD_CAPACITY, parseInt(e.target.value, 10) || 1)))}
              />
              <button className="guild-member-capacity-save-btn" onClick={handleCapSave} disabled={capSaving || capValue === (guildData?.capacity || DEFAULT_GUILD_CAPACITY)}>
                {capSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Directory toggle */}
          <div className="guild-member-directory-toggle">
            <label className="profile-subscription-toggle" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={!!guildData?.directoryListed}
                onChange={handleDirectoryToggle}
                disabled={dirToggling}
              />
              <span className="profile-subscription-slider" />
            </label>
            <span className="guild-member-directory-toggle-label">
              {dirToggling ? 'Updating...' : 'List in Guild Directory'}
            </span>
          </div>

          {/* Enter the Guild button */}
          <button className="profile-setup-btn" onClick={() => navigate('/guild')} style={{ marginTop: 12 }}>
            Enter the Guild
          </button>

          {/* Teacher Mode button */}
          {effectiveGuildStatus === GUILD_STATUS.ACTIVE && (
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
            <div className="guild-member-pending-section" style={{ marginTop: 16 }}>
              <h3 className="profile-subsection-title">Consulting Requests</h3>
              {consultingCategories.incomingPending.map(r => (
                <div key={r.id} className="consulting-request-card">
                  <div className="guild-member-request-card-header">
                    <span className="guild-member-request-card-handle">@{r.requesterHandle || 'anonymous'}</span>
                    {r.consultingType && <span className="profile-credential-details"> ({r.consultingType})</span>}
                  </div>
                  {r.message && <div className="guild-member-request-card-message">{r.message}</div>}
                  <div className="guild-member-request-card-actions">
                    <button className="guild-member-accept-btn" onClick={() => onConsultingAccept(r.id)} disabled={consultingRespondingId === r.id}>
                      {consultingRespondingId === r.id ? '...' : 'Accept'}
                    </button>
                    <button className="guild-member-decline-btn" onClick={() => onConsultingDecline(r.id)} disabled={consultingRespondingId === r.id}>
                      {consultingRespondingId === r.id ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Requests */}
          {pairingCategories.pendingRequests.length > 0 && (
            <div className="guild-member-pending-section">
              <h3 className="profile-subsection-title">Pending Student Requests</h3>
              {pairingCategories.pendingRequests.map(p => (
                <div key={p.id} className="guild-member-request-card">
                  <div className="guild-member-request-card-header">
                    <span className="guild-member-request-card-handle">@{p.studentHandle || 'anonymous'}</span>
                  </div>
                  {p.requestMessage && (
                    <div className="guild-member-request-card-message">{p.requestMessage}</div>
                  )}
                  <div className="guild-member-request-card-actions">
                    <button className="guild-member-accept-btn" onClick={() => handleAccept(p.id)} disabled={respondingId === p.id}>
                      {respondingId === p.id ? '...' : 'Accept'}
                    </button>
                    <button className="guild-member-decline-btn" onClick={() => handleDecline(p.id)} disabled={respondingId === p.id}>
                      {respondingId === p.id ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Students */}
          {pairingCategories.activeStudents.length > 0 && (
            <div className="guild-member-students-section">
              <h3 className="profile-subsection-title">Active Students</h3>
              {pairingCategories.activeStudents.map(p => (
                <div key={p.id} className="guild-member-student-card">
                  <span className="guild-member-student-card-handle">@{p.studentHandle || 'anonymous'}</span>
                  <button className="guild-member-end-btn" onClick={() => handleEnd(p.id)} disabled={respondingId === p.id}>
                    {respondingId === p.id ? '...' : 'End Membership'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {effectiveGuildStatus === GUILD_STATUS.REJECTED && display && (
        <>
          <div className="guild-member-status-card rejected">
            <span className="guild-member-badge-icon">{display.icon}</span>
            <div>
              <div className="guild-member-badge-title">{display.title}</div>
              <div className="profile-credential-details">
                {guildData?.rejectionReason || 'Your application was not approved at this time.'}
              </div>
            </div>
          </div>
          {guildEligible && !showGuildChat && (
            <button className="profile-update-btn" onClick={() => setShowGuildChat(true)}>
              Re-Apply
            </button>
          )}
          {showGuildChat && (
            <GuildApplicationChat
              onComplete={() => setShowGuildChat(false)}
              qualifiedGuildTypes={qualifiedGuildTypes}
            />
          )}
        </>
      )}

      {/* My Guild Members — for all users */}
      <div className="my-guild-members-section">
        {pairingCategories.myGuildMembers.length > 0 && (
          <>
            <h3 className="profile-subsection-title">My Guild Members</h3>
            {pairingCategories.myGuildMembers.map(p => (
              <div key={p.id} className="my-guild-members-card">
                <span className="my-guild-members-card-icon">{GUILD_TYPES[p.guildType || p.mentorType]?.icon || ''}</span>
                <span className="my-guild-members-card-handle">@{p.guildMemberHandle || p.mentorHandle || 'anonymous'}</span>
                <span className="my-guild-members-card-type">{GUILD_TYPES[p.guildType || p.mentorType]?.title || p.guildType || p.mentorType}</span>
                <button className="guild-member-end-btn" onClick={() => handleEnd(p.id)} disabled={respondingId === p.id}>
                  {respondingId === p.id ? '...' : 'End'}
                </button>
              </div>
            ))}
          </>
        )}
        {pairingCategories.pendingApplications.length > 0 && (
          <>
            <h3 className="profile-subsection-title">Pending Guild Requests</h3>
            {pairingCategories.pendingApplications.map(p => (
              <div key={p.id} className="my-guild-members-card pending">
                <span className="my-guild-members-card-handle">@{p.guildMemberHandle || p.mentorHandle || 'anonymous'}</span>
                <span className="my-guild-members-card-status">Pending</span>
              </div>
            ))}
          </>
        )}
        <button className="profile-update-btn" onClick={() => navigate('/guild-directory')} style={{ marginTop: 12 }}>
          Browse Guild Directory
        </button>
      </div>
      </>
      )}
    </>
  );
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

// ═══════════════════════════════════════════════════════════════
// PARTNER SECTION
// ═══════════════════════════════════════════════════════════════

// Shared form for both apply and edit — the only difference is the submit handler and button label
function PartnerEntityForm({ initial, onSubmit, onCancel, submitLabel, submitting }) {
  const [entityName, setEntityName] = useState(initial?.entityName || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [websiteUrl, setWebsiteUrl] = useState(initial?.websiteUrl || '');
  const [mythicRelation, setMythicRelation] = useState(initial?.mythicRelation || '');

  return (
    <div className="profile-credential-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
      <input type="text" placeholder="Entity name *" value={entityName} onChange={e => setEntityName(e.target.value)} maxLength={MAX_ENTITY_NAME_LENGTH} className="profile-handle-input" />
      <textarea placeholder="Description — what does this entity do?" value={description} onChange={e => setDescription(e.target.value)} maxLength={MAX_DESCRIPTION_LENGTH} rows={3} className="profile-handle-input" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
      <input type="url" placeholder="Website URL (optional)" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="profile-handle-input" />
      <textarea placeholder="Mythic relation — how does this connect to myth, story, or the hero's journey? (optional)" value={mythicRelation} onChange={e => setMythicRelation(e.target.value)} maxLength={MAX_MYTHIC_RELATION_LENGTH} rows={3} className="profile-handle-input" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="profile-update-btn" onClick={() => onSubmit({ entityName, description, websiteUrl, mythicRelation })} disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button className="profile-update-btn" onClick={onCancel} style={{ opacity: 0.7 }}>Cancel</button>
      </div>
    </div>
  );
}

// Renders a titled list of membership cards with optional actions
function MembershipListSection({ title, items, nameKey, actionButtons, loadingId }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div className="profile-credential-details" style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>
      {items.map(m => {
        const label = nameKey === 'rep' ? `@${m.representativeHandle || 'unknown'}` : m.partnerEntityName;
        return (
          <div key={m.id} className="profile-credential-card" style={{ marginBottom: 8, flexDirection: actionButtons ? 'column' : 'row', alignItems: actionButtons ? 'stretch' : 'center' }}>
            {nameKey === 'partner' && <span className="profile-credential-icon">{'\u{1F91D}'}</span>}
            <div className="profile-credential-info">
              <div className="profile-credential-name">{nameKey === 'partner' && actionButtons === 'leave' ? `Representing ${label}` : label}</div>
              {m.message && actionButtons && <div className="profile-credential-details" style={{ marginTop: 4 }}>{m.message}</div>}
              {!actionButtons && <div className="profile-credential-details">Awaiting response</div>}
            </div>
            {actionButtons === 'accept-decline' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="profile-update-btn" onClick={() => m.onAccept()} disabled={loadingId === m.id}>Accept</button>
                <button className="profile-update-btn" onClick={() => m.onDecline()} disabled={loadingId === m.id} style={{ opacity: 0.7 }}>Decline</button>
              </div>
            )}
            {actionButtons === 'remove' && (
              <button className="profile-update-btn" onClick={() => m.onEnd()} disabled={loadingId === m.id} style={{ opacity: 0.7 }}>Remove</button>
            )}
            {actionButtons === 'leave' && (
              <button className="profile-update-btn" onClick={() => m.onEnd()} disabled={loadingId === m.id} style={{ opacity: 0.7 }}>Leave</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PartnerSection({ partnerStatus, partnerData, partnerDisplay, partnerMembershipCategories, submitPartnerApplication, updatePartnerProfile, publishPartnerDirectory, unpublishPartnerDirectory, inviteRepresentative, respondToPartnerMembership, endPartnerMembership }) {
  const [sectionCollapsed, setSectionCollapsed] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [inviteHandle, setInviteHandle] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [membershipActionId, setMembershipActionId] = useState(null);

  const handleApply = async (fields) => {
    if (!fields.entityName.trim()) { setError('Entity name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await submitPartnerApplication({ entityName: fields.entityName.trim(), description: fields.description.trim(), websiteUrl: fields.websiteUrl.trim(), mythicRelation: fields.mythicRelation.trim() });
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    }
    setSubmitting(false);
  };

  const handleUpdate = async (fields) => {
    setSubmitting(true);
    setError(null);
    try {
      await updatePartnerProfile({ entityName: fields.entityName.trim() || undefined, description: fields.description.trim(), websiteUrl: fields.websiteUrl.trim(), mythicRelation: fields.mythicRelation.trim() });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update');
    }
    setSubmitting(false);
  };

  const handleInvite = async () => {
    const raw = inviteHandle.trim().replace(/^@/, '');
    if (!raw) return;
    setInviting(true);
    setError(null);
    try {
      await inviteRepresentative(raw, inviteMessage.trim() || null);
      setInviteHandle('');
      setInviteMessage('');
    } catch (err) {
      setError(err.message || 'Failed to invite');
    }
    setInviting(false);
  };

  const withMembershipAction = async (membershipId, fn) => {
    setMembershipActionId(membershipId);
    try { await fn(); } catch (err) { setError(err.message || 'Action failed'); }
    setMembershipActionId(null);
  };

  const { pendingInvites, pendingRequests, activeReps, myPartnerships, pendingMyInvites, pendingMyRequests } = partnerMembershipCategories;

  // Attach callbacks to membership items for the list helper
  const withActions = (items, { accept, decline, end } = {}) =>
    items.map(m => ({
      ...m,
      ...(accept && { onAccept: () => withMembershipAction(m.id, () => respondToPartnerMembership(m.id, true)) }),
      ...(decline && { onDecline: () => withMembershipAction(m.id, () => respondToPartnerMembership(m.id, false)) }),
      ...(end && { onEnd: () => withMembershipAction(m.id, () => endPartnerMembership(m.id)) }),
    }));

  return (
    <>
      <h2 className="profile-section-title profile-section-toggle" onClick={() => setSectionCollapsed(v => !v)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSectionCollapsed(v => !v); }}>
        Partner
        <span className={`profile-section-chevron${!sectionCollapsed ? ' open' : ''}`}>&#9662;</span>
      </h2>

      {!sectionCollapsed && (
      <>
      {error && <div className="profile-empty" style={{ color: '#d95b5b', marginBottom: 12 }}>{error}</div>}

      {/* NONE: Apply button */}
      {partnerStatus === PARTNER_STATUS.NONE && !showForm && (
        <div>
          <div className="profile-empty">Represent an organization, brand, or practice on Mythouse.</div>
          <button className="profile-update-btn" onClick={() => { setShowForm(true); setError(null); }}>
            Apply to Become a Partner
          </button>
        </div>
      )}

      {/* Application form (new or re-apply) */}
      {(partnerStatus === PARTNER_STATUS.NONE || partnerStatus === PARTNER_STATUS.REJECTED) && showForm && (
        <PartnerEntityForm onSubmit={handleApply} onCancel={() => setShowForm(false)} submitLabel="Submit Application" submitting={submitting} />
      )}

      {/* PENDING_ADMIN: Status card */}
      {partnerStatus === PARTNER_STATUS.PENDING_ADMIN && (
        <div className="profile-credential-card">
          <span className="profile-credential-icon">{'\u{1F4E8}'}</span>
          <div className="profile-credential-info">
            <div className="profile-credential-name">{partnerDisplay?.entityName}</div>
            <div className="profile-credential-details">Your application is under review.</div>
          </div>
        </div>
      )}

      {/* REJECTED: Status card with re-apply */}
      {partnerStatus === PARTNER_STATUS.REJECTED && !showForm && (
        <div>
          <div className="profile-credential-card">
            <span className="profile-credential-icon">{'\u{274C}'}</span>
            <div className="profile-credential-info">
              <div className="profile-credential-name">{partnerData?.entityName || 'Partner Application'}</div>
              <div className="profile-credential-details">
                Not approved{partnerData?.rejectionReason ? `: ${partnerData.rejectionReason}` : '.'}
              </div>
            </div>
          </div>
          <button className="profile-update-btn" onClick={() => { setShowForm(true); setError(null); }}>Re-Apply</button>
        </div>
      )}

      {/* APPROVED: Management panel */}
      {partnerStatus === PARTNER_STATUS.APPROVED && (
        <div>
          <div className="profile-credential-card">
            <span className="profile-credential-icon">{'\u{1F91D}'}</span>
            <div className="profile-credential-info">
              <div className="profile-credential-name">{partnerDisplay?.entityName}</div>
              <div className="profile-credential-details">{partnerDisplay?.statusLabel}</div>
            </div>
          </div>

          {editing ? (
            <div style={{ marginTop: 12 }}>
              <PartnerEntityForm initial={partnerData} onSubmit={handleUpdate} onCancel={() => setEditing(false)} submitLabel="Save" submitting={submitting} />
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {partnerData?.description && <div className="profile-credential-details" style={{ marginBottom: 8 }}>{partnerData.description}</div>}
              {partnerData?.websiteUrl && <div className="profile-credential-details" style={{ marginBottom: 8 }}><a href={partnerData.websiteUrl} target="_blank" rel="noopener noreferrer">{partnerData.websiteUrl}</a></div>}
              {partnerData?.mythicRelation && <div className="profile-credential-details" style={{ marginBottom: 8, fontStyle: 'italic' }}>{partnerData.mythicRelation}</div>}
              <button className="profile-update-btn" onClick={() => { setEditing(true); setError(null); }}>Edit Entity Info</button>
            </div>
          )}

          {/* Directory toggle */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            {partnerData?.directoryListed ? (
              <>
                <span className="profile-credential-details" style={{ color: '#5bd97a' }}>Listed in Partner Directory</span>
                <button className="profile-update-btn" onClick={unpublishPartnerDirectory}>Unpublish</button>
              </>
            ) : (
              <button className="profile-update-btn" onClick={publishPartnerDirectory}>Publish to Directory</button>
            )}
          </div>

          {/* Invite representative */}
          <div style={{ marginTop: 16 }}>
            <div className="profile-credential-details" style={{ marginBottom: 8, fontWeight: 600 }}>Invite a Representative</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="@handle" value={inviteHandle} onChange={e => setInviteHandle(e.target.value)} className="profile-handle-input" style={{ flex: 1, minWidth: 150 }} />
              <button className="profile-update-btn" onClick={handleInvite} disabled={inviting || !inviteHandle.trim()}>{inviting ? 'Inviting...' : 'Invite'}</button>
            </div>
            <textarea placeholder="Optional message..." value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} maxLength={500} rows={2} className="profile-handle-input" style={{ resize: 'vertical', fontFamily: 'inherit', marginTop: 8, width: '100%' }} />
          </div>

          <MembershipListSection title="Pending Invites Sent" items={pendingInvites} nameKey="rep" />
          <MembershipListSection title="Pending Join Requests" items={withActions(pendingRequests, { accept: true, decline: true })} nameKey="rep" actionButtons="accept-decline" loadingId={membershipActionId} />
          <MembershipListSection title={`Active Representatives (${activeReps.length})`} items={withActions(activeReps, { end: true })} nameKey="rep" actionButtons="remove" loadingId={membershipActionId} />
        </div>
      )}

      {/* My Partnerships — shown for all users regardless of partner status */}
      <MembershipListSection title="Partner Invitations" items={withActions(pendingMyInvites, { accept: true, decline: true })} nameKey="partner" actionButtons="accept-decline" loadingId={membershipActionId} />
      <MembershipListSection title="Pending Join Requests" items={pendingMyRequests} nameKey="partner" />
      <MembershipListSection title="My Partnerships" items={withActions(myPartnerships, { end: true })} nameKey="partner" actionButtons="leave" loadingId={membershipActionId} />
      </>
      )}
    </>
  );
}
