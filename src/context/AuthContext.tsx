import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { checkIsAdmin, syncUserProfileOnLogin } from '../services/userService';
import type { UserProfile } from '../types/user';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  authLoading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUserDetails = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      setIsAdmin(false);
      setAuthLoading(false);
      return;
    }
    try {
      const [userProfile, adminStatus] = await Promise.all([
        syncUserProfileOnLogin(firebaseUser),
        checkIsAdmin(firebaseUser),
      ]);
      setProfile(userProfile);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error('Failed to sync user profile:', err);
      setProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Customer',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
      });
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      void loadUserDetails(firebaseUser);
    });
    return () => unsubscribe();
  }, [loadUserDetails]);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserDetails(user);
    }
  }, [user, loadUserDetails]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        authLoading,
        signInWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
