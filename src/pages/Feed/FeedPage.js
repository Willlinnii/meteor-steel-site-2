import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, where, serverTimestamp, updateDoc, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../auth/firebase';
import { useAuth } from '../../auth/AuthContext';
import { useScope } from '../../contexts/ScopeContext';
import FeedPost from '../../components/feed/FeedPost';
import './FeedPage.css';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const COLLECTION = 'community-posts';

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function FeedPage() {
  const { user } = useAuth();
  const { activeScope, allScopes } = useScope();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState('personal');

  // Composer state
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [postToGroup, setPostToGroup] = useState(false);
  const fileInputRef = useRef(null);

  const hasGroups = allScopes.length > 0;

  // Subscribe to community-posts based on feedMode
  useEffect(() => {
    if (!db || !user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, COLLECTION);
    let q;

    if (feedMode === 'personal') {
      q = query(colRef, where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
    } else if (feedMode === 'group' && activeScope) {
      q = query(colRef, where('scopeId', '==', activeScope.id), orderBy('createdAt', 'desc'), limit(50));
    } else {
      // community mode (or group with no activeScope — fallback to community)
      q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    }

    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setPosts(items);
      setLoading(false);
    }, (err) => {
      console.error('Feed listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, [feedMode, user, activeScope]);

  // Handle image selection
  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) return false;
      if (f.size > MAX_IMAGE_SIZE) return false;
      return true;
    });

    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = valid.slice(0, remaining);

    setImageFiles(prev => [...prev, ...toAdd]);

    // Create previews
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, { name: f.name, url: ev.target.result }]);
      };
      reader.readAsDataURL(f);
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [imageFiles.length]);

  const removeImage = useCallback((index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Submit post
  const handleSubmit = async () => {
    const trimmedText = text.trim();
    const trimmedLink = link.trim();

    if (!trimmedText && imageFiles.length === 0 && !trimmedLink) return;
    if (trimmedLink && !isValidUrl(trimmedLink)) {
      setError('Please enter a valid URL (https://...)');
      return;
    }

    setPosting(true);
    setError(null);

    try {
      // Upload images if any
      let uploadedImages = [];
      if (imageFiles.length > 0 && storage) {
        for (const file of imageFiles) {
          const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
          const timestamp = Date.now();
          const storagePath = `community-posts/${user.uid}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, file, { contentType: file.type });
          const url = await getDownloadURL(storageRef);
          uploadedImages.push({ url, storagePath, name: file.name });
        }
      }

      const shouldTagGroup = postToGroup && hasGroups && activeScope;

      const postData = {
        text: trimmedText || '',
        images: uploadedImages,
        link: trimmedLink || null,
        createdBy: user.uid,
        createdByName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdByPhoto: null,
        createdAt: serverTimestamp(),
        scopeId: shouldTagGroup ? activeScope.id : null,
        scopeType: shouldTagGroup ? activeScope.type : null,
      };

      await addDoc(collection(db, COLLECTION), postData);

      // Clear composer
      setText('');
      setLink('');
      setImageFiles([]);
      setImagePreviews([]);
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    }

    setPosting(false);
  };

  // Delete post
  const handleDelete = async (postId) => {
    try {
      await deleteDoc(doc(db, COLLECTION, postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Circle / uncircle post
  const handleCircle = async (postId) => {
    if (!user) return;
    const postRef = doc(db, COLLECTION, postId);
    const post = posts.find(p => p.id === postId);
    const alreadyCircled = post?.circledBy?.includes(user.uid);
    try {
      await updateDoc(postRef, {
        circledBy: alreadyCircled ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (err) {
      console.error('Failed to circle post:', err);
    }
  };

  const hasContent = text.trim() || imageFiles.length > 0 || link.trim();

  const emptyMessages = {
    personal: "You haven't posted anything yet.",
    group: 'No posts in this group yet.',
    community: 'No posts yet. Be the first to share something!',
  };

  const titleLabels = {
    personal: 'My Posts',
    group: activeScope?.name ? `${activeScope.name} Feed` : 'Group Feed',
    community: 'Community Feed',
  };

  return (
    <div className="feed-page">
      <h1 className="feed-page-title">{titleLabels[feedMode]}</h1>

      {/* Mode Toggle */}
      <div className="feed-mode-toggle">
        <button
          className={`feed-mode-btn${feedMode === 'personal' ? ' active' : ''}`}
          onClick={() => setFeedMode('personal')}
        >
          My Posts
        </button>
        {hasGroups && (
          <button
            className={`feed-mode-btn${feedMode === 'group' ? ' active' : ''}`}
            onClick={() => setFeedMode('group')}
          >
            {activeScope?.name || 'Group'}
          </button>
        )}
        <button
          className={`feed-mode-btn${feedMode === 'community' ? ' active' : ''}`}
          onClick={() => setFeedMode('community')}
        >
          Community
        </button>
      </div>

      {/* Post Composer */}
      <div className="feed-composer">
        <textarea
          className="feed-composer-input"
          placeholder="Share your story with those who walk beside you..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />

        <input
          className="feed-composer-link"
          type="text"
          placeholder="Add a link (optional)"
          value={link}
          onChange={e => { setLink(e.target.value); setError(null); }}
        />

        {/* Image previews */}
        {imagePreviews.length > 0 && (
          <div className="feed-composer-previews">
            {imagePreviews.map((img, i) => (
              <div key={i} className="feed-composer-preview">
                <img src={img.url} alt={img.name} />
                <button className="feed-composer-preview-remove" onClick={() => removeImage(i)}>&times;</button>
              </div>
            ))}
          </div>
        )}

        {error && <div className="feed-composer-error">{error}</div>}

        <div className="feed-composer-actions">
          <div className="feed-composer-actions-left">
            <button
              className="feed-composer-image-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageFiles.length >= MAX_IMAGES}
              title="Add image"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            {hasGroups && activeScope && (
              <label className="feed-composer-group-toggle">
                <input
                  type="checkbox"
                  checked={postToGroup}
                  onChange={e => setPostToGroup(e.target.checked)}
                />
                <span>Post to {activeScope.name}</span>
              </label>
            )}
          </div>
          <button
            className="feed-composer-submit"
            disabled={!hasContent || posting}
            onClick={handleSubmit}
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="feed-loading">
          <span className="celestial-loading-spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          {emptyMessages[feedMode]}
        </div>
      ) : (
        <div className="feed-list">
          {posts.map(post => (
            <FeedPost
              key={post.id}
              post={post}
              currentUid={user?.uid}
              onDelete={handleDelete}
              onCircle={handleCircle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
