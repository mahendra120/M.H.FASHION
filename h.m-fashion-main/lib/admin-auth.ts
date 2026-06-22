/** Server-only allowlist — admin role is assigned in MongoDB when email matches. */
export const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? 'gohilmahendra424@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
