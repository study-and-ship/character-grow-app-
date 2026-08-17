import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import {
  parseRpcResult,
  quizSessionResultSchema,
} from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import { parseValue, positiveIdSchema } from "@/lib/api/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const routeParams = await params;
  const sessionId = parseValue(
    routeParams.sessionId,
    positiveIdSchema,
    "세션 ID가 올바르지 않습니다."
  );
  if (!sessionId.ok) return sessionId.response;

  const { data, error } = await auth.supabase.rpc("get_quiz_session", {
    p_session_id: sessionId.data,
  });
  if (error) return rpcErrorResponse(error, "get quiz session");

  const result = parseRpcResult(
    quizSessionResultSchema,
    data,
    "get quiz session"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}
