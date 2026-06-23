import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type RouteSupabase = SupabaseClient<Database>;

/**
 * 🔒 라우트용: 현재 로그인 사용자 + 쿠키 바인딩된 Supabase 클라이언트를 반환.
 *
 * 사용 예:
 *   const auth = await requireUser();
 *   if (!auth.ok) return auth.response;   // 미인증 → 401 응답 반환
 *   const { user, supabase } = auth;       // 이후 user.id 로 작업
 *
 * user_id 는 요청 바디/쿼리가 아니라 세션에서만 얻는다(명세서 0.2 원칙).
 */
export async function requireUser(): Promise<
  | { ok: true; user: User; supabase: RouteSupabase }
  | { ok: false; response: Response }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const { fail } = await import("./response");
    return {
      ok: false,
      response: fail("UNAUTHORIZED", "로그인이 필요합니다."),
    };
  }

  return { ok: true, user, supabase };
}
