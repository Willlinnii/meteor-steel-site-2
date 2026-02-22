import React, { useState, useRef, useEffect } from 'react';

// Audio tracks mapped by stage ID
export const CHAPTER_AUDIO = {
  'golden-age': [
    { file: '/audio/golden-age-1.m4a', title: 'Palastra, Pyramid, Mysterion, Mya' },
  ],
  'falling-star': [
    { file: '/audio/falling-star-1.m4a', title: 'Jaq Wakes Up' },
    { file: '/audio/falling-star-2.m4a', title: 'Letter to House' },
  ],
  'impact-crater': [
    { file: '/audio/impact-crater-1.m4a', title: 'Library to Studio' },
    { file: '/audio/impact-crater-2.m4a', title: 'Mythouse Crossing' },
  ],
  'forge': [
    { file: '/audio/forge-1.m4a', title: 'Yellow Brick Road' },
    { file: '/audio/forge-2.m4a', title: 'Billiard' },
    { file: '/audio/forge-3.m4a', title: 'Out of Cave Oculus' },
    { file: '/audio/forge-4.m4a', title: 'Chapter 4.4' },
    { file: '/audio/forge-5.m4a', title: 'Getting Rolling' },
    { file: '/audio/forge-6.m4a', title: 'To Mars — Echoes' },
    { file: '/audio/forge-7.m4a', title: 'To Mars — Echoes II' },
    { file: '/audio/forge-8.m4a', title: 'Into Depths' },
    { file: '/audio/forge-9.m4a', title: 'Moon' },
    { file: '/audio/forge-10.m4a', title: 'Sun' },
    { file: '/audio/forge-11.m4a', title: 'Meteor Steel' },
    { file: '/audio/forge-12.m4a', title: 'Approaching Innermost Cave' },
  ],
  'quenching': [
    { file: '/audio/quenching-1.m4a', title: 'Nadir' },
    { file: '/audio/quenching-2.m4a', title: 'Death of Obsidian' },
    { file: '/audio/quenching-3.m4a', title: 'Dish' },
    { file: '/audio/quenching-4.m4a', title: 'Midnight at Mythouse' },
    { file: '/audio/quenching-5.m4a', title: 'Cupid' },
    { file: '/audio/quenching-6.m4a', title: 'Cupid II' },
    { file: '/audio/quenching-7.m4a', title: 'Obsidian Roots' },
  ],
  'integration': [
    { file: '/audio/integration-1.m4a', title: 'Return from the Summit' },
    { file: '/audio/integration-2.m4a', title: 'Return' },
    { file: '/audio/integration-3.m4a', title: 'Uranus to Earth' },
    { file: '/audio/integration-4.m4a', title: 'Return — Frozen' },
    { file: '/audio/integration-5.m4a', title: 'Garden Dance' },
  ],
  'drawing': [
    { file: '/audio/drawing-1.m4a', title: 'Garden Dance — Pan — Echo' },
  ],
  'new-age': [
    { file: '/audio/new-age-1.m4a', title: 'Lovers Reunite' },
    { file: '/audio/new-age-2.m4a', title: 'Echo Heals — Departure' },
  ],
};

export default function ChapterAudioPlayer({ tracks, stageId, trackElement }) {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const trackedRef = useRef(new Set());

  // Reset when stage changes
  useEffect(() => {
    setCurrentTrack(0);
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [stageId]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
      const key = `fallen-starlight.audio.${stageId}.${currentTrack}`;
      if (!trackedRef.current.has(key)) {
        trackedRef.current.add(key);
        if (trackElement) trackElement(key);
      }
    }
    setPlaying(!playing);
  };

  const selectTrack = (idx) => {
    if (idx === currentTrack && playing) { togglePlay(); return; }
    setCurrentTrack(idx);
    setProgress(0);
    setPlaying(true);
    const audio = audioRef.current;
    if (audio) {
      audio.src = tracks[idx].file;
      audio.play();
      const key = `fallen-starlight.audio.${stageId}.${idx}`;
      if (!trackedRef.current.has(key)) {
        trackedRef.current.add(key);
        if (trackElement) trackElement(key);
      }
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) setProgress(audio.currentTime / audio.duration);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) setDuration(audio.duration);
  };

  const handleEnded = () => {
    if (currentTrack < tracks.length - 1) {
      selectTrack(currentTrack + 1);
    } else {
      setPlaying(false);
      setProgress(0);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  };

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chapter-audio-player">
      <audio
        ref={audioRef}
        src={tracks[currentTrack].file}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {tracks.length > 1 && (
        <div className="chapter-audio-tracklist">
          {tracks.map((t, i) => (
            <button
              key={i}
              className={`chapter-audio-track-btn${i === currentTrack ? ' active' : ''}`}
              onClick={() => selectTrack(i)}
            >
              {i === currentTrack && playing ? '\u25A0' : '\u25B6'} {t.title}
            </button>
          ))}
        </div>
      )}
      <div className="chapter-audio-controls">
        <button className="chapter-audio-play" onClick={togglePlay}>
          {playing ? '\u25A0' : '\u25B6'}
        </button>
        <div className="chapter-audio-progress" onClick={handleSeek}>
          <div className="chapter-audio-bar" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="chapter-audio-time">
          {formatTime(duration * progress)} / {formatTime(duration)}
        </span>
      </div>
      {tracks.length === 1 && (
        <div className="chapter-audio-title">{tracks[0].title}</div>
      )}
    </div>
  );
}
