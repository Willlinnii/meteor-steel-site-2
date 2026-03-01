import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useFriendRequests } from '../../contexts/FriendRequestsContext';
import { useProfile } from '../../profile/ProfileContext';
import { searchHandles } from '../../multiplayer/handleService';
import { useFriendConversations } from '../../hooks/useFriendConversations';
import { getOrCreateFriendConversation } from '../../hooks/friendConversationService';
import FriendMessagesPanel from './FriendMessagesPanel';
import './FriendsSection.css';

export default function FriendsSection() {
  const { user } = useAuth();
  const { handle } = useProfile();
  const {
    friends, incomingRequests, outgoingRequests, connectedUids,
    sendRequest, acceptRequest, declineRequest, removeFriend, setRelationship,
  } = useFriendRequests();
  const { unreadCount } = useFriendConversations();

  const [sectionCollapsed, setSectionCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [activeConvId, setActiveConvId] = useState(null);
  const searchTimer = useRef(null);

  // Pending outgoing UIDs for disabling "Send Invite" on search results
  const pendingOutUids = useMemo(() =>
    new Set(outgoingRequests.map(r => r.recipientUid)),
    [outgoingRequests]
  );

  const handleSearch = useCallback((val) => {
    setSearchQuery(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchHandles(val.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
  }, []);

  const handleSendInvite = useCallback(async (result) => {
    setSendingTo(result.uid);
    await sendRequest(result.uid, result.handle, handle);
    setSendingTo(null);
  }, [sendRequest, handle]);

  const handleRemoveFriend = useCallback(async (requestId) => {
    await removeFriend(requestId);
    setConfirmRemove(null);
  }, [removeFriend]);

  const handleMessageFriend = useCallback(async (friend) => {
    if (!user) return;
    const convId = await getOrCreateFriendConversation({
      myUid: user.uid,
      myHandle: handle || '',
      myPhotoURL: user.photoURL || null,
      friendUid: friend.uid,
      friendHandle: friend.handle || '',
      friendPhotoURL: null,
    });
    setActiveConvId(convId);
  }, [user, handle]);

  // No handle set — prompt user
  if (!handle) {
    return (
      <>
        <h2 className="profile-section-title profile-section-toggle" onClick={() => setSectionCollapsed(v => !v)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSectionCollapsed(v => !v); }}>
          Friends
          <span className={`profile-section-chevron${!sectionCollapsed ? ' open' : ''}`}>&#9662;</span>
        </h2>
        {!sectionCollapsed && (
          <p className="friends-empty">
            Set a handle above to add friends and receive invites.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <h2 className="profile-section-title profile-section-toggle" onClick={() => setSectionCollapsed(v => !v)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSectionCollapsed(v => !v); }}>
        Friends
        {(incomingRequests.length + unreadCount) > 0 && (
          <span className="friends-badge">{incomingRequests.length + unreadCount}</span>
        )}
        <span className={`profile-section-chevron${!sectionCollapsed ? ' open' : ''}`}>&#9662;</span>
      </h2>

      {!sectionCollapsed && (
      <>
      {/* Messages */}
      <div className="friends-subsection">
        <h3 className="profile-subsection-title">
          Messages{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}
        </h3>
        <FriendMessagesPanel
          activeConversationId={activeConvId}
          onSelectConversation={setActiveConvId}
        />
      </div>

      {/* Find Friends */}
      <div className="friends-subsection">
        <h3 className="profile-subsection-title">Find Friends</h3>
        <input
          className="friends-search-input"
          type="text"
          placeholder="Search by handle, email, or name..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />
        {searching && <p className="friends-status-text">Searching...</p>}
        {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <p className="friends-status-text">No users found</p>
        )}
        {searchResults.length > 0 && (
          <div className="friends-results">
            {searchResults.map(r => {
              const isFriend = connectedUids.has(r.uid);
              const isPending = pendingOutUids.has(r.uid);
              return (
                <div key={r.uid} className="friends-result-row">
                  <span className="friends-handle">
                    @{r.handle}
                    {r.email && <span className="friends-email"> ({r.email})</span>}
                  </span>
                  {isFriend ? (
                    <span className="friends-status-badge friends-status-connected">Friends</span>
                  ) : isPending ? (
                    <span className="friends-status-badge friends-status-pending">Pending</span>
                  ) : (
                    <button
                      className="friends-action-btn friends-send-btn"
                      disabled={sendingTo === r.uid}
                      onClick={() => handleSendInvite(r)}
                    >
                      {sendingTo === r.uid ? 'Sending...' : 'Send Invite'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invites */}
      {incomingRequests.length > 0 && (
        <div className="friends-subsection">
          <h3 className="profile-subsection-title">
            Invites ({incomingRequests.length})
          </h3>
          {incomingRequests.map(req => (
            <div key={req.id} className="friends-invite-row">
              <span className="friends-handle">@{req.senderHandle}</span>
              <div className="friends-invite-actions">
                <button
                  className="friends-action-btn friends-accept-btn"
                  onClick={() => acceptRequest(req.id)}
                >
                  Accept
                </button>
                <button
                  className="friends-action-btn friends-decline-btn"
                  onClick={() => declineRequest(req.id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing requests */}
      {outgoingRequests.length > 0 && (
        <div className="friends-subsection">
          <h3 className="profile-subsection-title">
            Sent Invites ({outgoingRequests.length})
          </h3>
          {outgoingRequests.map(req => (
            <div key={req.id} className="friends-result-row">
              <span className="friends-handle">@{req.recipientHandle}</span>
              <span className="friends-status-badge friends-status-pending">Pending</span>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="friends-subsection">
        <h3 className="profile-subsection-title">
          Friends List ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="friends-empty">No friends yet — search for someone above!</p>
        ) : (
          friends.map(f => (
            <div key={f.requestId} className="friends-list-row">
              <span className="friends-handle">@{f.handle}</span>
              <div className="friends-list-actions">
                <button
                  className="friends-msg-btn"
                  onClick={() => handleMessageFriend(f)}
                >
                  Message
                </button>
                <button
                  className={`friends-rel-btn${f.relationship === 'family' ? ' friends-rel-family' : ''}`}
                  onClick={() => setRelationship(f.requestId, f.relationship === 'family' ? 'friend' : 'family')}
                  title={f.relationship === 'family' ? 'Change to Friend' : 'Mark as Family'}
                >
                  {f.relationship === 'family' ? 'Family' : 'Friend'}
                </button>
                {confirmRemove === f.requestId ? (
                  <div className="friends-invite-actions">
                    <button
                      className="friends-action-btn friends-decline-btn"
                      onClick={() => handleRemoveFriend(f.requestId)}
                    >
                      Confirm
                    </button>
                    <button
                      className="friends-action-btn"
                      onClick={() => setConfirmRemove(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="friends-action-btn friends-remove-btn"
                    onClick={() => setConfirmRemove(f.requestId)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Group management links */}
      <div className="friends-subsection" style={{ display: 'flex', gap: 12 }}>
        <Link to="/friend-groups" className="friends-action-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
          Manage Friend Groups
        </Link>
        <Link to="/family-groups" className="friends-action-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
          Manage Family Groups
        </Link>
      </div>
      </>
      )}
    </>
  );
}
