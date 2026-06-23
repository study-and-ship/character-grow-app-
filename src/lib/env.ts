import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Single, type-safe entry point for environment variables.
 *
 * - `client`: variables exposed to the browser. MUST be prefixed NEXT_PUBLIC_.
 * - `server`: server-only secrets. Accessing these from client code throws.
 * - `runtimeEnv`: maps each var to process.env by its FULL name, because
 *   Next.js only statically inlines NEXT_PUBLIC_ vars referenced literally.
 */
export const env = createEnv({
  server: {
    // Add server-only secrets here, e.g.:
    // SUPABASE_SECRET_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  // Treat empty strings as undefined so blank .env entries fail validation.
  emptyStringAsUndefined: true,
});
