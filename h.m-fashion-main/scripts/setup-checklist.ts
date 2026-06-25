/**
 * Post-setup reminders — run after production deploy.
 * Usage: npm run setup:checklist
 */
console.log(`
=== M.H.Fashion — Post-setup checklist ===

[1] Admin in MongoDB
    npm run seed:admin          (local, needs Atlas IP whitelist)
    npm run seed:admin:remote   (via Vercel — after deploy)

[2] Resend API key security
    If your key was shared in chat/screenshot:
    → resend.com → API Keys → Revoke old key → Create new key
    → Update RESEND_API_KEY on Vercel → Redeploy

[3] Custom email domain (optional)
    → resend.com → Domains → Add your domain → verify DNS
    → Vercel EMAIL_FROM=M.H.Fashion <noreply@yourdomain.com>
    → Redeploy

[4] Scale rate limiting (optional, when traffic grows)
    → Create free Upstash Redis database
    → Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN on Vercel
    → Redeploy (app uses distributed limits when vars are set)

[5] Verify
    ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://m-h-fashion.vercel.app'}/api/health → ok: true
`);
