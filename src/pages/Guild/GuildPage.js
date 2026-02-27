import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProfile } from '../../profile/ProfileContext';
import GuildForum from './GuildForum';
import GuildDirectory from './GuildDirectory';
import MenteeFeed from './MenteeFeed';
import { usePageTracking } from '../../coursework/CourseworkContext';
import './GuildPage.css';

const TABS = [
  { id: 'directory', label: 'Directory' },
  { id: 'forum', label: 'Forum' },
  { id: 'mentees', label: 'My Mentees', mentorOnly: true },
];

export default function GuildPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { effectiveMentorStatus } = useProfile();
  const { track } = usePageTracking('guild');
  const tabParam = searchParams.get('tab');
  const isMentor = effectiveMentorStatus === 'active';
  const visibleTabs = TABS.filter(t => !t.mentorOnly || isMentor);
  const [activeTab, setActiveTab] = useState(visibleTabs.find(t => t.id === tabParam)?.id || 'directory');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    track(`tab.${tabId}`);
  };

  return (
    <div className="guild-page">
      <h1 className="profile-section-title">The Guild</h1>

      <div className="guild-tabs">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className={`guild-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'forum' && (
        isMentor ? (
          <GuildForum />
        ) : (
          <div className="guild-members-only">
            <p>The Guild Forum is available to active mentors only.</p>
            <p>Complete your mentor application and coursework to gain access.</p>
          </div>
        )
      )}

      {activeTab === 'directory' && (
        <GuildDirectory />
      )}

      {activeTab === 'mentees' && isMentor && (
        <MenteeFeed />
      )}
    </div>
  );
}
