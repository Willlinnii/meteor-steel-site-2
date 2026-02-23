import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

const SUBSCRIPTIONS = [
  {
    id: 'developer-api', name: 'Secret Weapon API',
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
    id: 'master-key', name: 'Mythouse Master Key',
    isBundle: true,
    bundleSubscriptions: ['ybr', 'forge', 'coursework'],
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
    details: 'The Master Key unlocks the full Mythouse experience: all Yellow Brick Road journeys, the Story Forge, full Coursework tracking (Monomyth Explorer, Celestial Clocks Explorer, Meteor Steel Initiate, Atlas Conversationalist, Mythic Gamer, Starlight Reader, Ouroboros Walker), and the complete Starlight Bundle (Fallen Starlight + Story of Stories).',
  },
  {
    id: 'ybr', name: 'Yellow Brick Road',
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
    id: 'forge', name: 'Story Forge',
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
    id: 'coursework', name: 'Coursework',
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
];

const PURCHASES = [
  {
    id: 'fallen-starlight', name: 'Fallen Starlight',
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
    id: 'medicine-wheel', name: 'Medicine Wheel',
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
  const { earnedRanks, highestRank, activeCredentials, hasProfile, loaded: profileLoaded, handle, natalChart, updateNatalChart, numerologyName, updateNumerologyName, luckyNumber, updateLuckyNumber, subscriptions, updateSubscription, updateSubscriptions, purchases, updatePurchase, updatePurchases, refreshProfile, mentorData, qualifiedMentorTypes, mentorEligible, mentorCoursesComplete, effectiveMentorStatus, pairingCategories, updateMentorBio, updateMentorCapacity, publishToDirectory, unpublishFromDirectory, respondToPairing, endPairing, photoURL, consultingData, consultingCategories, updateProfilePhoto, respondToConsulting, apiKeys, saveApiKey, removeApiKey, hasAnthropicKey, hasOpenaiKey, mythouseApiKey, hasMythouseKey, generateMythouseKey, regenerateMythouseKey, social, updateSocial, pilgrimages, pilgrimagesLoaded, removePilgrimage, personalStory, savePersonalStory, curatorApproved } = useProfile();
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
      <h2 id="section-natal-chart" className="profile-section-title">Natal Chart</h2>
      {natalChart && <NatalChartDisplay chart={natalChart} />}
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
                  <label className="profile-subscription-toggle" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => {
                        const newVal = !enabled;
                        if (isBundle && sub.bundleSubscriptions) {
                          const subUpdates = { [sub.id]: newVal };
                          sub.bundleSubscriptions.forEach(id => { subUpdates[id] = newVal; });
                          updateSubscriptions(subUpdates);
                          if (sub.bundlePurchases) {
                            const purUpdates = {};
                            sub.bundlePurchases.forEach(id => { purUpdates[id] = newVal; });
                            updatePurchases(purUpdates);
                          }
                        } else {
                          updateSubscription(sub.id, newVal);
                        }
                      }}
                    />
                    <span className="profile-subscription-slider" />
                  </label>
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
                                </div>
                              ) : (
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
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tier 2: Ambient Generation */}
                        <div className="profile-api-tier coming-soon">
                          <div className="profile-api-tier-title">
                            Ambient Generation
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
                  <label className="profile-subscription-toggle" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => {
                        const newVal = !enabled;
                        if (isBundle && p.bundleItems) {
                          const updates = { [p.id]: newVal };
                          p.bundleItems.forEach(itemId => { updates[itemId] = newVal; });
                          updatePurchases(updates);
                        } else {
                          updatePurchase(p.id, newVal);
                        }
                      }}
                    />
                    <span className="profile-subscription-slider" />
                  </label>
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
                  {site.region}{site.tradition ? ` \u00B7 ${site.tradition}` : ''} {'\u00B7'} Added {new Date(site.addedAt).toLocaleDateString()}
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

function NatalChartDisplay({ chart }) {
  const sun = chart.planets?.find(p => p.name === 'Sun');
  const moon = chart.planets?.find(p => p.name === 'Moon');
  const asc = chart.ascendant;

  return (
    <div className="natal-chart-display">
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
        {chart.planets?.map(p => (
          <div key={p.name} className="natal-planet-row">
            <span className="natal-planet-symbol">{PLANET_SYMBOLS[p.name] || ''}</span>
            <span className="natal-planet-name">{p.name}</span>
            <span className="natal-planet-metal">{PLANET_METALS[p.name]}</span>
            <span className="natal-planet-sign">{ZODIAC_SYMBOLS[p.sign] || ''} {p.sign} {p.degree}\u00B0</span>
            <span className="natal-planet-house">{p.house ? `House ${p.house}` : '\u2014'}</span>
          </div>
        ))}
      </div>

      {/* Chinese Zodiac */}
      {chart.chinese && (
        <div className="natal-chinese">
          {chart.chinese.element} {chart.chinese.animal}
        </div>
      )}

      {/* Time missing note */}
      {chart.timeMissing && (
        <div className="natal-time-note">
          Ascendant, Midheaven, and house placements require birth time.
        </div>
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
      const res = await apiFetch('/api/natal-chart', {
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
        {expanded ? 'Cancel' : existingChart ? 'Update Birth Info' : 'Enter Birth Info'}
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
