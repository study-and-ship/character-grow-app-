import { requireUser } from "@/lib/api/auth";
import { rpcErrorResponse } from "@/lib/api/errors";
import {
  equipmentResultSchema,
  parseRpcResult,
} from "@/lib/api/rpc-schemas";
import { ok } from "@/lib/api/response";
import {
  equipItemBodySchema,
  equipmentSlotSchema,
  parseJsonBody,
  parseValue,
} from "@/lib/api/validation";

type Context = { params: Promise<{ slot: string }> };

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const routeParams = await params;
  const slot = parseValue(
    routeParams.slot,
    equipmentSlotSchema,
    "장착 슬롯이 올바르지 않습니다."
  );
  if (!slot.ok) return slot.response;

  const body = await parseJsonBody(request, equipItemBodySchema);
  if (!body.ok) return body.response;

  const { data, error } = await auth.supabase.rpc("equip_character_item", {
    p_slot: slot.data,
    p_user_item_id: body.data.user_item_id,
  });
  if (error) return rpcErrorResponse(error, "equip character item");

  const result = parseRpcResult(
    equipmentResultSchema,
    data,
    "equip character item"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const routeParams = await params;
  const slot = parseValue(
    routeParams.slot,
    equipmentSlotSchema,
    "장착 슬롯이 올바르지 않습니다."
  );
  if (!slot.ok) return slot.response;

  const { data, error } = await auth.supabase.rpc("unequip_character_item", {
    p_slot: slot.data,
  });
  if (error) return rpcErrorResponse(error, "unequip character item");

  const result = parseRpcResult(
    equipmentResultSchema,
    data,
    "unequip character item"
  );
  if (!result.ok) return result.response;

  return ok(result.data);
}
