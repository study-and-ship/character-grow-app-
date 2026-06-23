import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { env } from "@/lib/env";

/**
 * 브라우저용 Supabase 클라이언트 (Client Component).
 *
 * publishable key 를 사용하며, 접근 제어는 RLS 로 보호한다.
 * 서버용(server.ts)과 쿠키 세션을 공유하도록 @supabase/ssr 의
 * createBrowserClient 로 생성한다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
