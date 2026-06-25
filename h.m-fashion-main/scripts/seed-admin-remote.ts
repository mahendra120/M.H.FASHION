import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

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

const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://m-h-fashion.vercel.app';
const secret = process.env.ADMIN_SEED_PASSWORD?.trim();

if (!secret) {
  console.error('Set ADMIN_SEED_PASSWORD in .env.local');
  process.exit(1);
}

async function main() {
  console.log(`Seeding admin via ${site}/api/admin/seed ...`);
  const res = await fetch(`${site}/api/admin/seed`, {
    method: 'POST',
    headers: { 'x-admin-seed-secret': secret },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Seed failed:', data.error ?? res.status);
    process.exit(1);
  }
  console.log(data.message ?? 'Admin seeded successfully');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
