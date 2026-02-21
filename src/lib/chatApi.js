/**
 * Authenticated fetch wrapper for /api/* endpoints.
 * Drop-in replacement for fetch() — same signature, but automatically
 * attaches the Firebase auth token as a Bearer header so the server
 * can identify the user for rate limiting and future BYOK.
 */
import { auth } from '../auth/firebase';

export async function apiFetch(url, options = {}) {
  let token = null;
  try {
    if (auth?.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
  } catch {
    // Proceed without token — server falls back to IP-based rate limiting
  }

  if (token) {
    options.headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return fetch(url, options);
}
