import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import {
  parseRpcResult,
  purchaseItemResultSchema,
} from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import { parseValue, positiveIdSchema } from "@/lib/api/validation";

type Context = { params: Promise<{ itemId: string }> };

export async function POST(_request: Request, { params }: Context) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const routeParams = await params;
  const itemId = parseValue(
    routeParams.itemId,
    positiveIdSchema,
    "아이템 ID가 올바르지 않습니다."
  );
  if (!itemId.ok) return itemId.response;

  const { data, error } = await auth.supabase.rpc("purchase_shop_item", {
    p_item_id: itemId.data,
  });
  if (error) return rpcErrorResponse(error, "purchase shop item");

  const result = parseRpcResult(
    purchaseItemResultSchema,
    data,
    "purchase shop item"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}
