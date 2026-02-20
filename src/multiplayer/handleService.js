import { doc, getDoc } from 'firebase/firestore';
import { db } from '../auth/firebase';
import { auth } from '../auth/firebase';

export async function checkAvailability(handle) {
  const handleLower = handle.toLowerCase();
  const ref = doc(db, 'handles', handleLower);
  const snap = await getDoc(ref);
  return !snap.exists();
}

export async function registerHandle(handle) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const res = await fetch('/api/register-handle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, handle }),
  });

  // Handle non-JSON responses (e.g. HTML error pages, 404s)
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}): expected JSON but got ${contentType || 'unknown'}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register handle');
  return data;
}

export async function searchHandles(query) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const res = await fetch(`/api/search-handles?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Search failed');
  return data.results;
}
