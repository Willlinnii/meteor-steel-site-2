import React, { useState, useCallback, useRef, useEffect } from 'react';
import CircleNav from '../../components/CircleNav';
import data from '../../data/storyOfStoriesData';
import './StoryOfStoriesPage.css';

const BOOK_STAGES = [
  { id: 'golden-surface', label: 'Golden Age' },
  { id: 'calling-star', label: 'Calling Star' },
  { id: 'crater-crossing', label: 'Crater Crossing', flipLabel: true },
  { id: 'trials-forge', label: 'Trials of Forge' },
  { id: 'quenching', label: 'Quench' },
  { id: 'return-reflection', label: 'Integrate & Reflect' },
  { id: 'drawing-dawn', label: 'Drawing Dawn', flipLabel: true },
  { id: 'new-age', label: 'Age of Integration' },
];

const CHAPTER_NAMES = {
  'golden-surface': 'Chapter 1: Golden Age \u2014 The Setup',
  'calling-star': 'Chapter 2: Calling Star \u2014 From Stasis to Rupture',
  'crater-crossing': 'Chapter 3: Crater Crossing \u2014 Threshold',
  'trials-forge': 'Chapter 4: Tests of the Forge \u2014 The Road of Initiation',
  'quenching': 'Chapter 5: Quench \u2014 The Nadir',
  'return-reflection': 'Chapter 6: Integrate & Reflect \u2014 The Return',
  'drawing-dawn': 'Chapter 7: Drawing Dawn \u2014 The Return Threshold',
  'new-age': 'Chapter 8: Age of Integration \u2014 Renewal',
};

function MeteorShower({ active }) {
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    if (!active) { setMeteors([]); return; }
    const count = 35;
    const newMeteors = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 120 - 10,
      delay: Math.random() * 2.2,
      duration: 1.2 + Math.random() * 1.8,
      size: 1 + Math.random() * 2.5,
      tailLength: 40 + Math.random() * 80,
      angle: -(12 + Math.random() * 16),
      opacity: 0.4 + Math.random() * 0.6,
    }));
    setMeteors(newMeteors);
    const timer = setTimeout(() => setMeteors([]), 4500);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <div className="meteor-shower">
      {meteors.map(m => (
        <div
          key={m.id}
          className="meteor-streak"
          style={{
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            '--meteor-size': `${m.size}px`,
            '--meteor-tail': `${m.tailLength}px`,
            '--meteor-angle': `${m.angle}deg`,
            opacity: m.opacity,
          }}
        />
      ))}
    </div>
  );
}

function StoryOfStoriesPage() {
  const [currentStage, setCurrentStage] = useState('overview');
  const [clockwise, setClockwise] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMeteors, setShowMeteors] = useState(false);
  const [playIntroAnim, setPlayIntroAnim] = useState(0);
  const audioRef = useRef(null);

  const handleSelectStage = useCallback((stage) => {
    setCurrentStage(stage);
    setActiveSection(null);

    // Calling Star → meteor shower
    if (stage === 'calling-star') {
      setShowMeteors(false);
      requestAnimationFrame(() => setShowMeteors(true));
    } else {
      setShowMeteors(false);
    }

    // Overview (center click) → orbit animation
    if (stage === 'overview') {
      setPlayIntroAnim(prev => prev + 1);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Auto-play audio when lullaby section opens
  useEffect(() => {
    if (activeSection === 'lullaby' && audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentLabel = currentStage !== 'overview' && currentStage !== 'bio'
    ? BOOK_STAGES.find(s => s.id === currentStage)?.label
    : null;

  const chapterName = CHAPTER_NAMES[currentStage];
  const stageSummary = data.stageSummaries[currentStage];

  const proposalSections = data.proposalSections.filter(s => s.group === 'proposal');
  const writingSections = data.proposalSections.filter(s => s.group === 'writing');
  const currentSection = activeSection
    ? data.proposalSections.find(s => s.id === activeSection)
    : null;

  return (
    <div className="sos-page">
      <MeteorShower active={showMeteors} />

      <CircleNav
        stages={BOOK_STAGES}
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
        clockwise={clockwise}
        onToggleDirection={() => setClockwise(!clockwise)}
        centerLine1="Story"
        centerLine2="of"
        centerLine3="Stories"
        showAuthor={true}
        playIntroAnim={playIntroAnim}
      />

      <div className="sos-subtitle">{data.subtitle}</div>

      {currentLabel && (
        <h2 className="stage-heading">{currentLabel}</h2>
      )}

      <div className="container">
        <div id="content-container">
          {currentStage === 'overview' && (
            <div className="sos-overview">
              <div className="sos-section-group">
                <div className="sos-group-label">Proposal</div>
                <div className="sos-section-buttons">
                  {proposalSections.map(section => (
                    <button
                      key={section.id}
                      className={`sos-section-btn${activeSection === section.id ? ' active' : ''}`}
                      onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sos-section-group">
                <div className="sos-group-label">Writing Sample</div>
                <div className="sos-section-buttons">
                  {writingSections.map(section => (
                    <button
                      key={section.id}
                      className={`sos-section-btn${activeSection === section.id ? ' active' : ''}`}
                      onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    >
                      {section.label}
                      {section.id === 'lullaby' && (
                        <span className="figure-play-icon" onClick={(e) => { e.stopPropagation(); setActiveSection('lullaby'); }}>{'\u25B6'}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {currentSection && (
                <div className="sos-section-content" key={currentSection.id}>
                  <div className={`sos-section-body${currentSection.id === 'lullaby' ? ' sos-poem' : ''}`}>
                    {currentSection.id === 'lullaby' && (
                      <div className="sos-audio-control">
                        <button className="sos-play-btn" onClick={toggleAudio} aria-label={isPlaying ? 'Pause' : 'Play'}>
                          {isPlaying ? '\u275A\u275A' : '\u25B6'}
                        </button>
                        <audio
                          ref={audioRef}
                          src="/audio/fallen-starlight-duet.m4a"
                          onEnded={() => setIsPlaying(false)}
                        />
                      </div>
                    )}
                    {currentSection.content.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStage === 'bio' && (
            <div className="sos-bio">
              <div className="sos-bio-text">
                {(data.proposalSections.find(s => s.id === 'author')?.content || data.bio).split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {stageSummary && (
            <div className="sos-chapter">
              {chapterName && <h3 className="chapter-title">{chapterName}</h3>}
              <div className="sos-section-body">
                {stageSummary.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryOfStoriesPage;
