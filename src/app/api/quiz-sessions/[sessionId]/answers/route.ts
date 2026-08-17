import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import {
  parseRpcResult,
  submitAnswerResultSchema,
} from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import {
  parseJsonBody,
  parseValue,
  positiveIdSchema,
  submitAnswerBodySchema,
} from "@/lib/api/validation";

type Context = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Context) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const routeParams = await params;
  const sessionId = parseValue(
    routeParams.sessionId,
    positiveIdSchema,
    "세션 ID가 올바르지 않습니다."
  );
  if (!sessionId.ok) return sessionId.response;

  const body = await parseJsonBody(request, submitAnswerBodySchema);
  if (!body.ok) return body.response;

  const { data, error } = await auth.supabase.rpc("submit_quiz_answer", {
    p_session_id: sessionId.data,
    p_session_question_id: body.data.quiz_session_question_id,
    p_selected_choice_id: body.data.selected_choice_id,
  });
  if (error) return rpcErrorResponse(error, "submit quiz answer");

  const result = parseRpcResult(
    submitAnswerResultSchema,
    data,
    "submit quiz answer"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}
