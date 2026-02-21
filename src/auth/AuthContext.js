import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const syncKey = `auth-synced-v2-${firebaseUser.uid}`;
        if (!localStorage.getItem(syncKey)) {
          // Short delay so updateProfile() in sign-up flow can complete first
          setTimeout(async () => {
            try {
              const token = await firebaseUser.getIdToken(true);
              await fetch('/api/auth-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              });
              localStorage.setItem(syncKey, '1');
            } catch (err) {
              console.error('Auth sync failed:', err);
            }
          }, 500);
        }
      }
    });
    return unsub;
  }, []);

  const signOut = () => {
    if (auth) return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, firebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}
