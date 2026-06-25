export function auditLog(event: string, data: Record<string, unknown>): void {
  console.info(JSON.stringify({ audit: true, event, at: new Date().toISOString(), ...data }));
}
