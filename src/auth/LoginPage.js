import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfigured } from './firebase';
import './LoginPage.css';

const FRIENDLY_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email. Try signing up.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
};

function friendlyError(err) {
  return FRIENDLY_ERRORS[err.code] || err.message;
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleGoogle() {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-browser') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          setError(friendlyError(redirectErr));
        }
      } else if (err.code !== 'auth/cancelled-popup-request') {
        setError(friendlyError(err));
      }
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseConfigured) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Mythouse</h1>
          <p className="login-subtitle">Enter the mythic archive</p>
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>
            Firebase is not configured yet. Set the <code>REACT_APP_FIREBASE_*</code> environment variables in <code>.env.local</code> and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Mythouse</h1>
        <p className="login-subtitle">Enter the mythic archive</p>

        <label className="login-agree">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I acknowledge that all content on this site is the intellectual property of Glinter LLC. All rights reserved. Unauthorized reproduction, distribution, or use of any materials is prohibited.
          </span>
        </label>

        <button className="login-google-btn" onClick={handleGoogle} type="button" disabled={!agreed}>
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="login-divider">or</div>

        <form className="login-form" onSubmit={handleEmailSubmit}>
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          <button className="login-submit-btn" type="submit" disabled={busy || !agreed}>
            {busy ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <p className="login-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
