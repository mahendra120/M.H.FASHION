/**
 * Run: npm run verify:production
 * Loads .env.local then reports missing production configuration.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ENV_SCHEMA, getMissingProductionEnv } from '../lib/env';
import { isMongoConfigured } from '../lib/mongodb';
import { isSupabaseConfigured } from '../lib/supabase';

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

console.log('\n=== M.H.Fashion Production Readiness ===\n');

for (const v of ENV_SCHEMA) {
  const set = Boolean(process.env[v.key]?.trim());
  const mark = set ? '✓' : v.requiredInProduction ? '✗' : '○';
  console.log(`  ${mark} ${v.key}${v.requiredInProduction ? '' : ' (optional)'}`);
  if (!set && v.requiredInProduction) console.log(`      → ${v.description}`);
}

const missing = getMissingProductionEnv();
console.log('\n--- Service checks ---');
console.log(`  MongoDB URI:  ${isMongoConfigured() ? 'configured' : 'MISSING'}`);
console.log(`  Supabase:     ${isSupabaseConfigured ? 'configured' : 'MISSING'}`);
console.log(`  Resend:       ${process.env.RESEND_API_KEY?.trim() ? 'configured' : 'MISSING'}`);

if (missing.length) {
  console.log(`\n✗ Missing ${missing.length} required variable(s): ${missing.join(', ')}`);
  console.log('\nCopy .env.production.example → Vercel Environment Variables');
  process.exit(1);
}

console.log('\n✓ All required production variables are set locally.');
console.log('  Next: apply supabase/APPLY_ALL.sql in Supabase SQL Editor, then deploy.\n');
