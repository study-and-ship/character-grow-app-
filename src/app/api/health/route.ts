import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/health
 * Supabase 연결 상태를 점검한다.
 * auth.getSession() 은 테이블이 없어도 항상 응답하므로
 * "서버 도달 + 키 유효성"만 검증하는 데 적합하다.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return Response.json(
        { status: "error", supabase: "unreachable", message: error.message },
        { status: 503 }
      );
    }

    return Response.json({ status: "ok", supabase: "connected" });
  } catch (e) {
    return Response.json(
      {
        status: "error",
        supabase: "init_failed",
        message: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
