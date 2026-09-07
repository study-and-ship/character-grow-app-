# Production deployment

## Supabase

1. Link the intended project with `npx supabase link --project-ref <ref>`.
2. Review migrations in timestamp order and run `npx supabase db push`. Load `supabase/seed.sql` only for the intended environment.
3. Run `npx supabase db lint --linked`, then verify RLS with two separate normal users. Do not use a service-role key in the browser or Vercel public variables.
4. In Auth URL Configuration, set **Site URL** to the production Vercel HTTPS origin and add production/preview callback origins that the team intends to support. Configure email confirmation before testing signup.

Required runtime variables are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `PROJECT_REF` is needed only for type generation. No service-role key is required by the application Route Handlers.

## Vercel

Import the repository without changing the Next.js build settings, set the two public Supabase variables for Production (and intentionally selected Preview environments), and deploy. This application requires SSR, Proxy, Server Components, and Route Handlers: **never configure `output: "export"`**.

After deployment, verify signup/email confirmation, login cookie refresh, `/start`, refresh on every protected route, quiz completion idempotency, logout, and `/privacy`. Confirm the browser never receives a service-role or third-party secret.
