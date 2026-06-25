import { isAdminEmail } from '@/lib/admin-auth';
import { authLog } from '@/lib/auth/debug';
import { type PublicUser } from '@/lib/auth/client';
import { isMongoConfigured } from '@/lib/mongodb';
import { upsertAdminUser } from '@/lib/auth/user-store';

/** Stable id for admin sessions bootstrapped from env when MongoDB is not configured. */
export const ENV_BOOTSTRAP_ADMIN_ID = 'env-bootstrap-admin';

export function getSeedCredentials(): { email: string; password: string; name: string } | null {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME?.trim() || 'Admin';

  if (!email || !password) return null;
  return { email, password, name };
}

/** In-memory admin profile when ADMIN_SEED_* env vars are set but MONGODB_URI is not. */
export function getEnvBootstrapAdminUser(): PublicUser | null {
  const seed = getSeedCredentials();
  if (!seed || !isAdminEmail(seed.email)) return null;
  const now = new Date().toISOString();
  return {
    id: ENV_BOOTSTRAP_ADMIN_ID,
    name: seed.name,
    email: seed.email,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  };
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

  authLog('tryBootstrapAdminLogin: seed credentials matched', { email: normalized });

  if (!isMongoConfigured()) {
    authLog('tryBootstrapAdminLogin: using env-bootstrap admin (no MONGODB_URI)');
  // #region agent log
  fetch('http://127.0.0.1:7900/ingest/090f6d38-5b88-4583-9648-35b5d5060acb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e47377'},body:JSON.stringify({sessionId:'e47377',location:'ensure-admin.ts:bootstrap',message:'env bootstrap admin',data:{hasMongo:false,hasAdminEmails:isAdminEmail(normalized)},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
  // #endregion
    return getEnvBootstrapAdminUser();
  }

  authLog('tryBootstrapAdminLogin: upserting admin in MongoDB', { email: normalized });
  return upsertAdminUser(seed);
}
