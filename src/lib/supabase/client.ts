import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "@/lib/env";

/**
 * 브라우저용 Supabase 클라이언트 (publishable key, sb_publishable_...).
 * 접근 제어는 Supabase RLS 정책으로 보호한다. 이 앱은 읽기 위주로 동작한다.
 */
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
