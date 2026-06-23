import { isAdminEmail } from '@/lib/admin-auth';
import { authLog } from '@/lib/auth/debug';
import { type PublicUser } from '@/lib/auth/client';
import { upsertAdminUser } from '@/lib/auth/user-store';

function getSeedCredentials(): { email: string; password: string; name: string } | null {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME?.trim() || 'Admin';

  if (!email || !password) return null;
  return { email, password, name };
}

/**
 * Create or update the admin account from ADMIN_SEED_* env vars.
 * Safe to call on every login attempt — upserts with a fresh bcrypt hash.
 */
export async function ensureAdminFromEnv(): Promise<PublicUser | null> {
  const seed = getSeedCredentials();
  if (!seed) {
    authLog('ensureAdminFromEnv: skipped — ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set');
    return null;
  }

  if (!isAdminEmail(seed.email)) {
    authLog('ensureAdminFromEnv: skipped — email not in ADMIN_EMAILS allowlist', {
      email: seed.email,
    });
    return null;
  }

  authLog('ensureAdminFromEnv: upserting admin account', { email: seed.email });
  return upsertAdminUser(seed);
}

/**
 * When login fails because the user does not exist, auto-create the admin
 * account if the submitted credentials match ADMIN_SEED_* env vars.
 */
export async function tryBootstrapAdminLogin(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const normalized = email.toLowerCase();
  if (!isAdminEmail(normalized)) return null;

  const seed = getSeedCredentials();
  if (!seed) return null;

  if (normalized !== seed.email || password !== seed.password) {
    authLog('tryBootstrapAdminLogin: credentials do not match seed env vars', {
      email: normalized,
    });
    return null;
  }

  authLog('tryBootstrapAdminLogin: creating admin account from env credentials', {
    email: normalized,
  });
  return upsertAdminUser(seed);
}
