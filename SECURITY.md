# Security Review (Pre–Vercel Deployment)

This document summarizes security findings from a user-perspective and codebase review before public deployment.

---

## Summary

- **Overall:** The app is low-risk: no auth, no API routes, no user input in server logic, read-only Supabase with anon key. Main issues are **preview route exposure** and a few hardening steps.
- **Critical:** `/__preview` must not be reachable in production (see below).
- **Recommended:** Rely on proxy for `/__preview` blocking, add security headers, and follow Supabase/secret practices.

---

## 1. Critical: `/__preview` Route Exposure

**Risk:** The “Prompt Preview” page (`/__preview`) is intended for development only but is currently **not** protected in production.

- **Current behavior:**
  - In **Next.js 16**, request interception uses **`proxy.ts`** (not `middleware.ts`). Your `proxy.ts` correctly rewrites `/__preview` to `/404` in production, so the preview route is blocked at the proxy layer.
  - The preview page also had only a **client-side** check and redirect. In production the server could still render and send prompt content before the client redirect. So a server-side guard was added as defense in depth.

**Fix (applied):**

1. **Proxy:** `proxy.ts` is the correct convention in Next.js 16; it already blocks `/__preview` in production (rewrite to `/404`).
2. **Server-side guard:** In `app/__preview/page.tsx`, when `NODE_ENV === "production"`, the page now redirects to `/` before loading any questions or prompt data, so prompt content is never sent even if the proxy were misconfigured.

---

## 2. Secrets and Environment Variables

- **Supabase**
  - App uses **anon (publishable) key** only, from `lib/supabase/server.ts`. Supabase client is used **only on the server** (loaders, Server Components). No Supabase calls from the client.
  - Prefer **server-only** env vars: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The code already prefers these over `NEXT_PUBLIC_*`. If you use `NEXT_PUBLIC_*`, the anon key will be in the client bundle (unused but visible); for minimal exposure, set the non‑public vars in Vercel and leave `NEXT_PUBLIC_*` unset for production.
  - **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) is used only in **pipeline scripts** (e.g. `pipeline/lib/supabase/supabase-worker.ts`, `pipeline/seed-supabase.ts`). Never use it in app code or in any HTTP route. Keep pipeline runs to CLI / secure automation (e.g. Vercel cron that runs a script), not from public API routes.

- **LLM / API keys** (for future pipeline): Store in Vercel env only; never in repo or client. Pipeline already uses server-side env; when you add API routes for “Mode B,” keep all keys server-side.

- **`.env.example`** documents only Supabase; no secrets in repo. Continue to avoid committing real keys.

---

## 3. Supabase and Database

- **Queries:** All access is via Supabase client (`.from().select().eq()`, etc.). No raw SQL. Parameterization is handled by the client; no SQL injection from current code paths.
- **RLS (confirmed):** RLS is enabled on the Supabase project. Only the **service role** (used by the pipeline / “service worker” scripts) can **write**; the app uses the **anon key** and has **read-only** access. Pipeline (e.g. `pipeline/lib/supabase/supabase-worker.ts`, `seed-supabase.ts`) is the only code that inserts/updates/upserts; the web app only runs SELECTs via `lib/content/loader.ts`. Keep the service role out of the Next.js app and any public HTTP routes.
- **`getQuestionById(id)`:** Takes a string `id` and passes it to Supabase. It is not used by any route today. If you later add a dynamic route that uses it with user-provided input (e.g. from the URL), validate/sanitize `id` (e.g. UUID format) before calling.

---

## 4. Input and Output

- **App:** No API routes; no query params, request body, or headers used for business logic. Pages only consume server-loaded data. No user-controlled input to the server beyond navigation.
- **XSS:** No `dangerouslySetInnerHTML`, `innerHTML`, or `eval`/`new Function` found. Question text is validated with Zod (e.g. `simple_text` max length) and rendered through React; normal React escaping applies.
- **Pipeline:** Date from CLI is validated with `validateDateString()`; LLM output is parsed with Zod. Good practice to keep.

---

## 5. Authentication and Authorization

- **None.** The app is unauthenticated and public. No login, sessions, or cookies. This is acceptable for a public “today’s question” app; just be aware that any future sensitive features will require adding auth and protecting routes accordingly.

---

## 6. Rate Limiting (Supabase Calls)

- **Do you need it?** For this app, **optional**. The app only reads from Supabase at page load (a few SELECTs per request); there are no write endpoints and RLS already enforces read-only for the anon key. Abuse would mostly mean extra read traffic.
- **When to consider it:** If you see sustained abuse (e.g. bots hammering pages and approaching Supabase plan limits) or you want a hard cap per IP for cost control. Supabase has its own quotas and connection limits; check your plan.
- **Where to rate limit (if you do):**
  - **Supabase:** Use any rate/usage limits or connection pooling options in the Supabase dashboard for your project.
  - **Vercel:** Edge or serverless rate limiting (e.g. by IP) in front of the app, so excess requests never reach your server or Supabase. Simpler than in-app logic and works well for read-heavy pages.
- **In-app rate limiting:** Not required for the current design; add only if you introduce write APIs or auth and need per-user limits.

---

## 7. Optional Hardening (Next.js / Vercel)

- **Security headers:** Consider adding in `next.config.js` (or via Vercel/edge) for production:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (or `SAMEORIGIN` if you need iframes)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - CSP only if you have specific requirements (can be strict once you audit scripts/sources).
- **Dependencies:** Run `bun audit` (or equivalent) periodically and address high/critical issues. Keep Next.js and Supabase client up to date.

---

## 8. Checklist Before Public Deploy

- [x] **Proxy:** Next.js 16 uses `proxy.ts` (not `middleware.ts`). Your `proxy.ts` blocks `/__preview` in production (rewrite to 404).
- [x] **Guard preview page on server:** In `app/__preview/page.tsx`, in production the page redirects before loading prompt content.
- [x] **Supabase RLS:** RLS enabled; anon key read-only, service role (pipeline only) can write.
- [ ] **Env in Vercel:** Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_*` if you prefer); never set `SUPABASE_SERVICE_ROLE_KEY` in Vercel env used by the Next.js app.
- [ ] **Pipeline:** Run pipeline/seed only from local or trusted automation (e.g. secure cron); do not expose via public HTTP.
- [ ] (Optional) Add security headers and run `bun audit`.

---

*Last updated: pre–Vercel deployment review.*
