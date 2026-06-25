import { NextResponse } from 'next/server';
import { getMissingProductionEnv, isProductionRuntime } from '@/lib/env';
import { isMongoConfigured } from '@/lib/mongodb';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Public health check — no secrets exposed. */
export async function GET() {
  const missing = getMissingProductionEnv();
  const checks = {
    mongodb: isMongoConfigured(),
    supabase: isSupabaseConfigured,
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    jwt: Boolean(process.env.JWT_SECRET?.trim()),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    adminEmails: Boolean(process.env.ADMIN_EMAILS?.trim()),
    rateLimit:
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? 'upstash'
        : 'memory',
  };

  const ready = missing.length === 0 && checks.mongodb && checks.supabase;

  return NextResponse.json({
    ok: ready,
    environment: isProductionRuntime() ? 'production' : process.env.NODE_ENV ?? 'unknown',
    checks,
    missingEnv: missing,
    timestamp: new Date().toISOString(),
  });
}
