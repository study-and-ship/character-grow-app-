import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import {
  initializeUserResultSchema,
  parseRpcResult,
} from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import { initUserBodySchema, parseJsonBody } from "@/lib/api/validation";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request, initUserBodySchema);
  if (!body.ok) return body.response;

  const { data, error } = await auth.supabase.rpc("initialize_user", {
    p_nickname: body.data.nickname,
  });
  if (error) return rpcErrorResponse(error, "initialize user");

  const result = parseRpcResult(
    initializeUserResultSchema,
    data,
    "initialize user"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}
