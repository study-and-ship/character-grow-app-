import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { env } from "@/lib/env";

/**
 * 서버용 Supabase 클라이언트 (Server Component / Server Action / Route Handler).
 *
 * 요청 쿠키에서 Supabase Auth 세션을 읽어 "현재 로그인 사용자" 컨텍스트로
 * 동작한다. RLS 가 auth.uid() 로 본인 데이터만 통과시키므로, 이 클라이언트의
 * 쿼리는 자동으로 로그인 사용자 권한으로 실행된다.
 *
 * 쿠키는 요청마다 다르므로 매 요청 새로 생성한다(함수형).
 * Next.js 16: cookies() 는 async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 쓰기 불가 컨텍스트(예: Server Component)에서는 무시.
            // 세션 갱신은 미들웨어/응답 경로에서 처리된다.
          }
        },
      },
    }
  );
}
