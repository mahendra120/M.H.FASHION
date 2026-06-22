import type { Role } from '@/types';

/** Browser localStorage key for JWT (used alongside httpOnly cookie). */
export const AUTH_TOKEN_STORAGE_KEY = 'mhf_auth_token';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export function mongoRoleToAppRole(role: 'user' | 'admin'): Role {
  return role === 'admin' ? 'admin' : 'customer';
}

export function getClientAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}
