import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFellowship } from '../../contexts/FellowshipContext';
import { useFriendRequests } from '../../contexts/FriendRequestsContext';
import FellowshipPost from '../../components/fellowship/FellowshipPost';
import ActivityItem from '../../components/fellowship/ActivityItem';
import FeedPage from '../Feed/FeedPage';
import './FellowshipPage.css';

export default function FellowshipPage() {
  const { user } = useAuth();
  const { feedItems, loading, deletePost } = useFellowship();
  const { friends } = useFriendRequests();
  const [activeTab, setActiveTab] = useState('achievements');

  return (
    <div className="fellowship-page">
      <h1 className="fellowship-heading">Fellowship</h1>
      <p className="fellowship-prompt">Know thyself and be known</p>

      <div className="fellowship-tabs">
        <button
          className={`fellowship-tab${activeTab === 'achievements' ? ' active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button
          className={`fellowship-tab${activeTab === 'community' ? ' active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Community
        </button>
      </div>

      {activeTab === 'achievements' && (
        <>
          <p className="fellowship-subtitle">Shared achievements from you and your fellows</p>

          {loading && (
            <div className="fellowship-loading">
              <div className="fellowship-spinner" />
            </div>
          )}

          {!loading && feedItems.length === 0 && (
            <div className="fellowship-empty">
              <p>No posts yet.</p>
              {friends.length === 0 ? (
                <p>
                  <Link to="/profile" className="fellowship-link">Connect with friends</Link> to see their achievements here.
                </p>
              ) : (
                <p>Complete a journey, reading, or game and share it with your fellows!</p>
              )}
            </div>
          )}

          <div className="fellowship-feed">
            {feedItems.map(post => (
              post.type === 'activity' ? (
                <ActivityItem key={post.id} post={post} />
              ) : (
                <FellowshipPost
                  key={post.id}
                  post={post}
                  currentUid={user?.uid}
                  onDelete={deletePost}
                />
              )
            ))}
          </div>
        </>
      )}

      {activeTab === 'community' && <FeedPage />}
    </div>
  );
}
