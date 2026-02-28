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
  { id: 'mentees', label: 'My Mentees', guildOnly: true },
];

export default function GuildPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { effectiveGuildStatus } = useProfile();
  const { track } = usePageTracking('guild');
  const tabParam = searchParams.get('tab');
  const isGuildMember = effectiveGuildStatus === 'active';
  const visibleTabs = TABS.filter(t => !t.guildOnly || isGuildMember);
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
        isGuildMember ? (
          <GuildForum />
        ) : (
          <div className="guild-members-only">
            <p>The Guild Forum is available to active guild members only.</p>
            <p>Complete your guild application and coursework to gain access.</p>
          </div>
        )
      )}

      {activeTab === 'directory' && (
        <GuildDirectory />
      )}

      {activeTab === 'mentees' && isGuildMember && (
        <MenteeFeed />
      )}
    </div>
  );
}
