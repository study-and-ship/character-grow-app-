import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import {
  parseRpcResult,
  quizSessionResultSchema,
} from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import { parseJsonBody, startQuizBodySchema } from "@/lib/api/validation";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request, startQuizBodySchema);
  if (!body.ok) return body.response;

  const { data, error } = await auth.supabase.rpc("start_today_quiz", {
    p_category_id: body.data.category_id,
  });
  if (error) return rpcErrorResponse(error, "start today quiz");

  const result = parseRpcResult(
    quizSessionResultSchema,
    data,
    "start today quiz"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}
