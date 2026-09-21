/**
 * Build-only compatibility module for Next/Vercel.
 *
 * The Vercel deployment proxies /api to Cloudflare before local route matching,
 * so these bindings are never used at runtime. No database credentials or
 * secrets are copied into the frontend deployment.
 */
export const env: Record<string, never> = {};
