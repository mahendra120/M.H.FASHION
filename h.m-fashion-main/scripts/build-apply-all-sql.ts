import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
const parts = [
  '-- M.H.Fashion — run once in Supabase Dashboard → SQL Editor → New query\n',
];
for (const file of files) {
  parts.push(`\n-- ========== ${file} ==========\n\n`);
  parts.push(readFileSync(join(migrationsDir, file), 'utf-8'));
}
writeFileSync(join(process.cwd(), 'supabase', 'APPLY_ALL.sql'), parts.join(''), 'utf-8');
console.log(`Wrote supabase/APPLY_ALL.sql (${files.length} migrations)`);
