/**
 * Server-side environment validation.
 * Call from API routes or server startup — never import in client components.
 */

export type EnvVar = {
  key: string;
  requiredInProduction: boolean;
  description: string;
};

export const ENV_SCHEMA: EnvVar[] = [
  { key: 'MONGODB_URI', requiredInProduction: true, description: 'MongoDB Atlas connection string' },
  { key: 'JWT_SECRET', requiredInProduction: true, description: 'JWT signing secret (32+ chars)' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', requiredInProduction: true, description: 'Supabase project URL' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', requiredInProduction: true, description: 'Supabase anon key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', requiredInProduction: true, description: 'Supabase service role (server only)' },
  { key: 'NEXT_PUBLIC_SITE_URL', requiredInProduction: true, description: 'Canonical site URL' },
  { key: 'RESEND_API_KEY', requiredInProduction: true, description: 'Resend API key for transactional email' },
  { key: 'EMAIL_FROM', requiredInProduction: false, description: 'Sender address for Resend' },
  { key: 'ADMIN_EMAILS', requiredInProduction: true, description: 'Comma-separated admin email allowlist' },
];

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function getMissingProductionEnv(): string[] {
  if (!isProductionRuntime()) return [];
  return ENV_SCHEMA.filter((v) => v.requiredInProduction && !process.env[v.key]?.trim()).map((v) => v.key);
}

export function assertProductionEnv(): void {
  const missing = getMissingProductionEnv();
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

/** True when local JSON / demo fallbacks are allowed (development only). */
export function allowDevFallbacks(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}
