import React, { useState } from 'react';
import mythsData from '../../data/mythsEpisodes.json';
import './MythologyChannelPage.css';

const SHOWS = [
  {
    id: 'myths-tv',
    label: 'Myths: Greatest Mysteries',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLqal35qVo2sWWRcS9pRrR68YOgT4p4Ftm',
    description: 'The international TV series exploring humanity\'s greatest myths — featuring Will Linn as meta-expert.',
    isMythsTV: true,
  },
  {
    id: 'myth-salon',
    label: 'Myth Salon',
    playlist: 'https://www.youtube.com/embed/videoseries?list=PLX31T_KS3jtpmankurn1mE7-r3fHY4nAV',
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

function MythsEpisodeContent({ episode }) {
  return (
    <div className="myths-episode-content">
      <h3 className="myths-episode-title">{episode.title}</h3>
      {episode.summary && (
        <p className="myths-episode-summary">{episode.summary}</p>
      )}
      <div className="myths-entries">
        {episode.entries.map((entry, i) => (
          <div key={i} className="myths-entry">
            {entry.question && (
              <h4 className="myths-entry-question">{entry.question}</h4>
            )}
            <div className="myths-entry-text">
              {entry.text.split('\n\n').map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MythologyChannelPage() {
  const [activeShow, setActiveShow] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);

  const handleShowClick = (show) => {
    if (activeShow?.id === show.id) {
      // Toggle off
      setActiveShow(null);
      setVideoUrl(null);
      setActiveEpisode(null);
    } else {
      setActiveShow(show);
      setActiveEpisode(null);
      setVideoUrl(show.playlist || null);
    }
  };

  const handleTvClick = () => {
    if (videoUrl) {
      setActiveShow(null);
      setVideoUrl(null);
      setActiveEpisode(null);
    }
  };

  const handleEpisodeClick = (episode) => {
    setActiveEpisode(prev => prev?.id === episode.id ? null : episode);
  };

  const isMythsActive = activeShow?.isMythsTV;
  const isOn = !!videoUrl;

  return (
    <div className="mythology-channel-page">
      <div className={`tv-wrapper${isOn ? ' tv-on' : ''}`}>
        <img
          src={process.env.PUBLIC_URL + (isOn ? '/tv-frame.png' : '/tv-solid.png')}
          alt="Mythology Channel TV"
          className="tv-frame-img"
        />
        {isOn && (
          <div className="tv-screen-area" onClick={handleTvClick}>
            <iframe
              title={activeShow?.label || 'Video'}
              src={videoUrl}
              className="tv-video-player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        {isOn && (
          <button className="tv-power-btn" onClick={handleTvClick} title="Turn off">
            {'\u25A0'}
          </button>
        )}
      </div>

      {activeShow && (
        <div className="tv-now-playing">
          Now Playing: <strong>{activeShow.label}</strong>
        </div>
      )}

      <div className="mythology-channel-shows">
        <h2 className="shows-heading">Shows</h2>
        <div className="shows-grid">
          {SHOWS.map(show => (
            <button
              key={show.id}
              className={`show-card${activeShow?.id === show.id ? ' active' : ''}${show.isMythsTV ? ' myths-tv-card' : ''}`}
              onClick={() => handleShowClick(show)}
            >
              <span className="show-card-title">{show.label}</span>
              <span className="show-card-desc">{show.description}</span>
            </button>
          ))}
        </div>
      </div>

      {isMythsActive && (
        <div className="myths-section">
          <div className="myths-header">
            <h2 className="myths-show-title">{mythsData.show.title}</h2>
            <p className="myths-show-desc">{mythsData.show.description}</p>
            <a
              className="myths-roku-btn"
              href={mythsData.show.rokuUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              See Full Series on Roku
            </a>
          </div>

          <h3 className="myths-episodes-heading">Episodes &mdash; Will Linn Interviews</h3>
          <div className="myths-episodes-grid">
            {mythsData.episodes.map(ep => (
              <button
                key={ep.id}
                className={`myths-episode-btn${activeEpisode?.id === ep.id ? ' active' : ''}`}
                onClick={() => handleEpisodeClick(ep)}
              >
                {ep.title}
              </button>
            ))}
          </div>

          {activeEpisode && (
            <div className="myths-episode-panel">
              <MythsEpisodeContent episode={activeEpisode} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
