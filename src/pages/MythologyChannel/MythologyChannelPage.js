import React, { useState } from 'react';
import CircleNav from '../../components/CircleNav';
import './MythologyChannelPage.css';

const SHOWS = [
  {
    id: 'myth-salon',
    label: 'Myth Salon',
    playlist: 'https://www.youtube.com/embed/videoseries?list=UULFqVaWkjn_SaMEkvxDnSajOQ',
    description: 'Live conversations exploring myth, depth psychology, and the soul of culture.',
  },
  {
    id: 'mythosophia',
    label: 'Mythosophia',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtotNrVSEqO-Nq87oZBysW1a',
    description: 'Mythic wisdom and the philosophical dimensions of storytelling.',
  },
  {
    id: 'lionel-corbett',
    label: 'Lionel Corbett',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CNyqy5clgYGMmZ7RE2Kj7F-',
    description: 'Talks by Lionel Corbett on Jungian psychology and the numinous.',
  },
  {
    id: 'scholar-talks',
    label: 'Scholar Talks',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CO4EWIb9HnC6Zdx6NUQhTfL',
    description: 'Academic lectures on mythology, religion, and depth psychology.',
  },
  {
    id: 'the-tao',
    label: 'The Tao',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CMh5cYBmYMM8Mq_Q00uinNX',
    description: 'Explorations of Taoist philosophy and its mythic dimensions.',
  },
  {
    id: 'mastery-circle',
    label: 'Mastery Circle',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PL6ygcKvnP7CPCSA14Lzfm3uNlNBA_a0zi',
    description: 'Deep-dive sessions on mythological mastery and practice.',
  },
  {
    id: 'dennis-slattery',
    label: 'Dennis Slattery',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtqUrR_L1_fsxw0S4ugOMo50',
    description: 'Talks by Dennis Patrick Slattery on mythopoetics and literature.',
  },
  {
    id: 'deep-sight',
    label: 'Deep Sight',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtowPCw_QkXozvJzzTqvZozz',
    description: 'Visionary explorations of myth and the imaginal.',
  },
];

// Empty stages — show buttons handle selection, no labels on the ring
const CIRCLE_STAGES = [];

export default function MythologyChannelPage() {
  const [activeShow, setActiveShow] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [clockwise, setClockwise] = useState(true);

  const handleSelectStage = (id) => {
    if (id === 'overview') {
      setActiveShow(null);
      setVideoUrl(null);
      return;
    }
    const show = SHOWS.find(s => s.id === id);
    if (show) {
      setActiveShow(show);
      setVideoUrl(show.playlist);
    }
  };

  const handleCloseVideo = () => {
    setVideoUrl(null);
  };

  return (
    <div className="mythology-channel-page">
      <div className="mythology-channel-circle-area">
        <CircleNav
          stages={CIRCLE_STAGES}
          currentStage={activeShow?.id || 'overview'}
          onSelectStage={handleSelectStage}
          clockwise={clockwise}
          onToggleDirection={() => setClockwise(c => !c)}
          centerLine1="The Mythology"
          centerLine2=""
          centerLine3="Channel"
          showAuthor={false}
          videoUrl={videoUrl}
          onCloseVideo={handleCloseVideo}
        />
      </div>

      <div className="mythology-channel-shows">
        <h2 className="shows-heading">Shows</h2>
        <div className="shows-grid">
          {SHOWS.map(show => (
            <button
              key={show.id}
              className={`show-card${activeShow?.id === show.id ? ' active' : ''}`}
              onClick={() => handleSelectStage(show.id)}
            >
              <span className="show-card-title">{show.label}</span>
              <span className="show-card-desc">{show.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
