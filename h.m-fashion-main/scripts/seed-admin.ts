import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { seedAdminAccount } from '../lib/seed-admin';

function loadEnvFile() {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

if (!process.env.MONGODB_URI && !process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'development';
}

const email = process.env.ADMIN_SEED_EMAIL;
const password = process.env.ADMIN_SEED_PASSWORD;
const name = process.env.ADMIN_SEED_NAME ?? 'Admin';

if (!email || !password) {
  console.error('Missing credentials. Set in .env.local:');
  console.error('  ADMIN_SEED_EMAIL=your-admin@email.com');
  console.error('  ADMIN_SEED_PASSWORD=your-secure-password');
  console.error('  ADMIN_SEED_NAME=Your Name (optional)');
  process.exit(1);
}

seedAdminAccount({ name, email, password })
  .then(() => {
    console.log(`Admin account ready for ${email.toLowerCase()}`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
