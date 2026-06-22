const AUTH_DEBUG =
  process.env.AUTH_DEBUG === 'true' || process.env.NODE_ENV === 'development';

/** Structured auth debug logging — enabled in development by default. */
export function authLog(step: string, detail?: Record<string, unknown>): void {
  if (!AUTH_DEBUG) return;
  if (detail) {
    console.log(`[auth] ${step}`, detail);
  } else {
    console.log(`[auth] ${step}`);
  }
}
