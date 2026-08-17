import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import { parseRpcResult, rankingsResultSchema } from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import { parseValue } from "@/lib/api/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const limitSchema = z.coerce.number().int().min(1).max(50).optional();

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limit = parseValue(
    request.nextUrl.searchParams.get("limit") ?? undefined,
    limitSchema,
    "랭킹 조회 개수가 올바르지 않습니다."
  );
  if (!limit.ok) return limit.response;

  const { data, error } = await auth.supabase.rpc("get_rankings", {
    p_limit: limit.data ?? 5,
  });
  if (error) return rpcErrorResponse(error, "get rankings");

  const result = parseRpcResult(rankingsResultSchema, data, "get rankings");
  if (!result.ok) return result.response;

  return ok(result.data);
}
