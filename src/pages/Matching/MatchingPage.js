import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import DiscoverTab from './DiscoverTab';
import MessagesTab from './MessagesTab';
import { useMatchConversations } from '../../storyMatching/useMatchConversations';
import './MatchingPage.css';

const TABS = [
  { key: 'discover', label: 'Discover' },
  { key: 'messages', label: 'Messages' },
];

export default function MatchingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const { unreadCount } = useMatchConversations();

  if (!user) return null;

  return (
    <div className="matching-page">
      <h1 className="matching-page-title">Story Matching</h1>

      <div className="matching-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`matching-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'messages' && unreadCount > 0 && (
              <span className="matching-tab-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="matching-tab-content">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'messages' && <MessagesTab />}
      </div>
    </div>
  );
}
