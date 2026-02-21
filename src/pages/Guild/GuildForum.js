import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot } from 'firebase/firestore';
import { db, firebaseConfigured } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../auth/firebase';

const POSTS_PER_PAGE = 20;
const MAX_NESTING = 3;

function renderMarkdown(text) {
  if (!text) return '';
  // Minimal markdown: bold, italic, links, line breaks
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br />');
}

function TimeAgo({ timestamp }) {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="guild-time-ago">just now</span>;
  if (mins < 60) return <span className="guild-time-ago">{mins}m ago</span>;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return <span className="guild-time-ago">{hours}h ago</span>;
  const days = Math.floor(hours / 24);
  if (days < 30) return <span className="guild-time-ago">{days}d ago</span>;
  return <span className="guild-time-ago">{date.toLocaleDateString()}</span>;
}

export default function GuildForum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [posting, setPosting] = useState(false);
  const [userVotes, setUserVotes] = useState({}); // { targetId: value }
  const fileInputRef = useRef(null);

  // Fetch posts
  useEffect(() => {
    if (!firebaseConfigured || !db) return;

    async function fetchPosts() {
      try {
        const postsRef = collection(db, 'guild-posts');
        const q = query(
          postsRef,
          where('deleted', '==', false),
          orderBy('pinned', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE),
        );
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setPosts(results);
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.size === POSTS_PER_PAGE);
      } catch (err) {
        console.error('Failed to fetch guild posts:', err);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  // Load user's votes
  useEffect(() => {
    if (!user || !firebaseConfigured || !db) return;

    const votesRef = collection(db, 'guild-votes');
    const q = query(votesRef, where('voterUid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const votes = {};
      snap.forEach(d => { votes[d.data().targetId] = d.data().value; });
      setUserVotes(votes);
    });

    return unsub;
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!lastDoc || !hasMore) return;
    try {
      const postsRef = collection(db, 'guild-posts');
      const q = query(
        postsRef,
        where('deleted', '==', false),
        orderBy('pinned', 'desc'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE),
      );
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      setPosts(prev => [...prev, ...results]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.size === POSTS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    }
  }, [lastDoc, hasMore]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || newImages.length >= 4) return;
    if (file.size > 5 * 1024 * 1024) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;

    try {
      const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
      const path = `guild-images/${user.uid}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      setNewImages(prev => [...prev, url]);
    } catch (err) {
      console.error('Image upload failed:', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newBody.trim() || posting) return;
    setPosting(true);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create-post',
          title: newTitle.trim(),
          body: newBody.trim(),
          imageUrls: newImages,
        }),
      });
      if (resp.ok) {
        setNewTitle('');
        setNewBody('');
        setNewImages([]);
        setShowNewPost(false);
        // Refresh posts
        const postsRef = collection(db, 'guild-posts');
        const q = query(postsRef, where('deleted', '==', false), orderBy('pinned', 'desc'), orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setPosts(results);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    }
    setPosting(false);
  };

  const handleVote = async (targetId, targetType, postId, value) => {
    try {
      const token = await user.getIdToken();
      await fetch('/api/guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'vote', targetId, targetType, postId, value }),
      });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = await user.getIdToken();
      await fetch('/api/guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-post', postId }),
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete post failed:', err);
    }
  };

  if (loading) {
    return <div className="profile-empty">Loading forum...</div>;
  }

  return (
    <div className="guild-forum">
      {/* New post button / form */}
      {showNewPost ? (
        <div className="guild-post-form">
          <input
            className="guild-post-form-title"
            type="text"
            placeholder="Post title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            maxLength={200}
          />
          <textarea
            className="guild-post-form-body"
            placeholder="Write your post (markdown supported)..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            maxLength={10000}
            rows={6}
          />
          {newImages.length > 0 && (
            <div className="guild-post-form-images">
              {newImages.map((url, i) => (
                <div key={i} className="guild-post-form-image-thumb">
                  <img src={url} alt="" />
                  <button onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))}>x</button>
                </div>
              ))}
            </div>
          )}
          <div className="guild-post-form-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {newImages.length < 4 && (
              <button className="guild-post-form-image-btn" onClick={() => fileInputRef.current?.click()}>
                Add Image
              </button>
            )}
            <button className="guild-post-form-submit" onClick={handleCreatePost} disabled={posting || !newTitle.trim() || !newBody.trim()}>
              {posting ? 'Posting...' : 'Post'}
            </button>
            <button className="guild-post-form-cancel" onClick={() => { setShowNewPost(false); setNewTitle(''); setNewBody(''); setNewImages([]); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="guild-new-post-btn" onClick={() => setShowNewPost(true)}>
          New Post
        </button>
      )}

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="profile-empty">No posts yet. Be the first to start a discussion.</div>
      ) : (
        <div className="guild-posts-list">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              expanded={expandedPost === post.id}
              onToggle={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              userVotes={userVotes}
              onVote={handleVote}
              onDelete={handleDeletePost}
              currentUid={user?.uid}
            />
          ))}
        </div>
      )}

      {hasMore && posts.length > 0 && (
        <button className="guild-load-more" onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}

function PostCard({ post, expanded, onToggle, userVotes, onVote, onDelete, currentUid }) {
  const myVote = userVotes[post.id] || 0;
  const isAuthor = currentUid === post.authorUid;

  return (
    <div className={`guild-post-card${post.pinned ? ' pinned' : ''}`}>
      <div className="guild-post-votes">
        <button
          className={`guild-vote-btn up${myVote === 1 ? ' active' : ''}`}
          onClick={() => onVote(post.id, 'post', post.id, 1)}
        >
          &#9650;
        </button>
        <span className="guild-vote-score">{post.score || 0}</span>
        <button
          className={`guild-vote-btn down${myVote === -1 ? ' active' : ''}`}
          onClick={() => onVote(post.id, 'post', post.id, -1)}
        >
          &#9660;
        </button>
      </div>
      <div className="guild-post-content" onClick={onToggle}>
        <div className="guild-post-meta">
          <span className="guild-post-author-icon">{post.authorMentorIcon}</span>
          <span className="guild-post-author-handle">{post.authorHandle ? `@${post.authorHandle}` : 'Mentor'}</span>
          {post.pinned && <span className="guild-post-pin-badge">Pinned</span>}
          <TimeAgo timestamp={post.createdAt} />
        </div>
        <div className="guild-post-title">{post.title}</div>
        {!expanded && (
          <div className="guild-post-preview">
            {post.body.length > 200 ? post.body.slice(0, 200) + '...' : post.body}
          </div>
        )}
        {!expanded && (
          <div className="guild-post-footer">
            <span className="guild-post-reply-count">{post.replyCount || 0} replies</span>
          </div>
        )}
      </div>
      {expanded && (
        <ExpandedPost
          post={post}
          userVotes={userVotes}
          onVote={onVote}
          currentUid={currentUid}
        />
      )}
      {isAuthor && (
        <button className="guild-post-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}>
          Delete
        </button>
      )}
    </div>
  );
}

function ExpandedPost({ post, userVotes, onVote, currentUid }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // null = top-level reply, or replyId
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!firebaseConfigured || !db) return;

    async function fetchReplies() {
      try {
        const repliesRef = collection(db, `guild-posts/${post.id}/replies`);
        const q = query(repliesRef, where('deleted', '==', false), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setReplies(results);
      } catch (err) {
        console.error('Failed to fetch replies:', err);
      }
      setLoading(false);
    }

    fetchReplies();
  }, [post.id]);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create-reply',
          postId: post.id,
          body: replyText.trim(),
          parentReplyId: replyingTo || null,
        }),
      });
      if (resp.ok) {
        setReplyText('');
        setReplyingTo(null);
        // Refresh replies
        const repliesRef = collection(db, `guild-posts/${post.id}/replies`);
        const q = query(repliesRef, where('deleted', '==', false), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        const results = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setReplies(results);
      }
    } catch (err) {
      console.error('Failed to submit reply:', err);
    }
    setSubmitting(false);
  };

  // Build threaded reply tree
  const topLevel = replies.filter(r => !r.parentReplyId);
  const childMap = {};
  replies.forEach(r => {
    if (r.parentReplyId) {
      if (!childMap[r.parentReplyId]) childMap[r.parentReplyId] = [];
      childMap[r.parentReplyId].push(r);
    }
  });

  return (
    <div className="guild-post-expanded">
      <div className="guild-post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
      {post.imageUrls?.length > 0 && (
        <div className="guild-post-images">
          {post.imageUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="guild-post-image" />
          ))}
        </div>
      )}

      <div className="guild-replies-section">
        <h4 className="guild-replies-title">{replies.length} Replies</h4>
        {loading ? (
          <div className="profile-empty">Loading replies...</div>
        ) : (
          topLevel.map(reply => (
            <ReplyThread
              key={reply.id}
              reply={reply}
              childMap={childMap}
              depth={0}
              postId={post.id}
              userVotes={userVotes}
              onVote={onVote}
              onReply={(replyId) => setReplyingTo(replyId)}
              currentUid={currentUid}
            />
          ))
        )}

        {/* Reply form */}
        <div className="guild-reply-form">
          {replyingTo && (
            <div className="guild-reply-form-context">
              Replying to a comment <button onClick={() => setReplyingTo(null)}>Cancel</button>
            </div>
          )}
          <textarea
            className="guild-reply-textarea"
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            maxLength={10000}
            rows={3}
          />
          <button
            className="guild-reply-submit"
            onClick={handleSubmitReply}
            disabled={submitting || !replyText.trim()}
          >
            {submitting ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplyThread({ reply, childMap, depth, postId, userVotes, onVote, onReply, currentUid }) {
  const children = childMap[reply.id] || [];
  const myVote = userVotes[reply.id] || 0;
  const effectiveDepth = Math.min(depth, MAX_NESTING);

  return (
    <div className={`guild-reply${effectiveDepth > 0 ? ' guild-reply-nested' : ''}`} style={{ marginLeft: effectiveDepth * 20 }}>
      <div className="guild-reply-header">
        <span className="guild-reply-author-icon">{reply.authorMentorIcon}</span>
        <span className="guild-reply-author-handle">{reply.authorHandle ? `@${reply.authorHandle}` : 'Mentor'}</span>
        <TimeAgo timestamp={reply.createdAt} />
      </div>
      <div className="guild-reply-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.body) }} />
      <div className="guild-reply-actions">
        <button
          className={`guild-vote-btn up${myVote === 1 ? ' active' : ''}`}
          onClick={() => onVote(reply.id, 'reply', postId, 1)}
        >
          &#9650;
        </button>
        <span className="guild-vote-score">{reply.score || 0}</span>
        <button
          className={`guild-vote-btn down${myVote === -1 ? ' active' : ''}`}
          onClick={() => onVote(reply.id, 'reply', postId, -1)}
        >
          &#9660;
        </button>
        {depth < MAX_NESTING && (
          <button className="guild-reply-btn" onClick={() => onReply(reply.id)}>Reply</button>
        )}
      </div>
      {children.map(child => (
        <ReplyThread
          key={child.id}
          reply={child}
          childMap={childMap}
          depth={depth + 1}
          postId={postId}
          userVotes={userVotes}
          onVote={onVote}
          onReply={onReply}
          currentUid={currentUid}
        />
      ))}
    </div>
  );
}
