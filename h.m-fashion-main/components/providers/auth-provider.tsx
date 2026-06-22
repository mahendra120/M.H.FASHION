'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Role, UserProfile } from '@/types';
import {
  AUTH_TOKEN_STORAGE_KEY,
  mongoRoleToAppRole,
  getClientAuthToken as readStoredToken,
  type PublicUser,
} from '@/lib/auth/client';

/** Client-safe user shape compatible with existing account/admin UI. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  user_metadata?: { name: string };
}

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  token: string | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string, next?: string) => Promise<{ error: string | null; redirectTo?: string }>;
  signUp: (name: string, email: string, password: string, next?: string) => Promise<{ error: string | null; redirectTo?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function toAuthUser(publicUser: PublicUser): AuthUser {
  return {
    id: publicUser.id,
    email: publicUser.email,
    name: publicUser.name,
    created_at: publicUser.createdAt,
    user_metadata: { name: publicUser.name },
  };
}

function toUserProfile(publicUser: PublicUser): UserProfile {
  return {
    id: publicUser.id,
    email: publicUser.email,
    name: publicUser.name,
    role: mongoRoleToAppRole(publicUser.role),
    created_at: publicUser.createdAt,
  };
}

function persistToken(token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors (private browsing, etc.)
  }
}

async function applySession(
  publicUser: PublicUser,
  token: string,
  setUser: (u: AuthUser | null) => void,
  setProfile: (p: UserProfile | null) => void,
  setToken: (t: string | null) => void,
) {
  persistToken(token);
  setToken(token);
  setUser(toAuthUser(publicUser));
  setProfile(toUserProfile(publicUser));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = readStoredToken();
    if (!stored) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { authorization: `Bearer ${stored}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.user) {
        await applySession(data.user, stored, setUser, setProfile, setToken);
      }
    } catch {
      // session restore failed silently
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const stored = readStoredToken();
      if (!stored) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { authorization: `Bearer ${stored}` },
          credentials: 'include',
        });

        if (!mounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            await applySession(data.user, stored, setUser, setProfile, setToken);
          } else {
            persistToken(null);
            setToken(null);
          }
        } else {
          persistToken(null);
          setToken(null);
        }
      } catch {
        if (mounted) {
          persistToken(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, next?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error ?? 'Invalid email or password' };
      }
      await applySession(data.user, data.token, setUser, setProfile, setToken);
      return { error: null, redirectTo: data.redirectTo as string | undefined };
    } catch {
      return { error: 'Unable to sign in. Please check your connection.' };
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string, next?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error ?? 'Unable to create account' };
      }
      await applySession(data.user, data.token, setUser, setProfile, setToken);
      return { error: null, redirectTo: data.redirectTo as string | undefined };
    } catch {
      return { error: 'Unable to create account. Please check your connection.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // still clear local state
    }
    persistToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        role: profile?.role ?? 'customer',
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Used by admin API helpers to attach the JWT. */
export { getClientAuthToken } from '@/lib/auth/client';
