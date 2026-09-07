# QuizPet Play Store readiness

## Current architecture

QuizPet remains a server-rendered Next.js 16 App Router application on Vercel. Supabase Auth cookies are refreshed by `proxy.ts`; protected game routes are verified again in the `(game)` server layout. Route Handlers authenticate every mutation and call transactional Supabase RPCs. Browser code only uses the publishable key. Never expose `SUPABASE_SERVICE_ROLE_KEY`, an OpenAI API key, or other server secrets through `NEXT_PUBLIC_*` variables.

Quiz answers, EXP, coins, level changes, purchases, and ranking values are server-owned. The quiz answer and completion endpoints call RPCs that derive values from database rows. `purchase_shop_item` locks/checks the current profile and catalog item and relies on the unique inventory constraint for idempotency. Rankings are calculated from stored answers and character rows rather than submitted scores. User-owned tables use `auth.uid()` RLS policies; the hardening migration also removes direct writes to reward-bearing tables and direct question/choice reads.

## Capacitor deployment choices

### A. Local web bundle with Vercel backend (recommended long term)

Extract the interactive shell into a statically bundleable client while retaining authenticated API Route Handlers on Vercel. Configure an explicit API origin, CORS allow-list, deep-link auth callback, secure token storage, and offline/error behavior. This provides predictable native assets and startup behavior without discarding the server security boundary.

### B. Vercel URL in the Capacitor WebView (internal testing only)

Point the WebView at the deployed HTTPS URL. This is quickest for internal tests and preserves SSR/cookie behavior, but requires network access at launch and has WebView cookie/navigation lifecycle concerns.

Do **not** add `output: "export"` to the current app: SSR auth, Proxy, Server Components, and Route Handlers require a server runtime.

## Android release TODO

- [ ] Add `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`
- [ ] Add and review `capacitor.config.ts`
- [ ] Generate the Android native project
- [ ] Handle Android hardware/app back button behavior
- [ ] Configure verified Deep Links and the Supabase Auth callback
- [ ] Add network status and offline UX
- [ ] Configure status bar and splash screen plugins
- [ ] Produce adaptive launcher icon and store graphics
- [ ] Configure secrets and create a signed release AAB
- [ ] Run Play Console internal testing, data-safety, and privacy-policy review

## Operational checklist

Set only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in browser-visible configuration. Keep service-role and third-party keys server-only. Apply all Supabase migrations before deployment, verify RLS with two distinct test accounts, configure Vercel production origins in Supabase Auth, and replace the draft privacy contact details before public release.
