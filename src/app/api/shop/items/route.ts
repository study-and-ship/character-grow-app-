import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  queryErrorResponse,
  userNotInitializedResponse,
} from "@/lib/api/errors";
import { targetTypeForStage } from "@/lib/api/game";
import { internalError, ok } from "@/lib/api/response";
import {
  itemFilterSchema,
  parseValue,
  searchParamsToObject,
} from "@/lib/api/validation";
import type { ShopItemsData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const filters = parseValue(
    searchParamsToObject(request.nextUrl.searchParams),
    itemFilterSchema,
    "상점 필터가 올바르지 않습니다."
  );
  if (!filters.ok) return filters.response;

  const [profileResult, characterResult] = await Promise.all([
    auth.supabase
      .from("profiles")
      .select("coins")
      .eq("id", auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from("characters")
      .select("id, growth_stage")
      .eq("user_id", auth.user.id)
      .maybeSingle(),
  ]);
  if (profileResult.error) {
    return queryErrorResponse(profileResult.error, "get shop profile");
  }
  if (characterResult.error) {
    return queryErrorResponse(characterResult.error, "get shop character");
  }
  if (!profileResult.data || !characterResult.data) {
    return userNotInitializedResponse();
  }

  const character = characterResult.data;
  const targetType = targetTypeForStage(character.growth_stage);
  const [itemsResult, ownedResult, equipmentResult] = await Promise.all([
    auth.supabase
      .from("shop_items")
      .select(
        "id, name, price, asset_key, item_categories(id, code, name, slot, target_type)"
      )
      .eq("is_active", true)
      .order("id"),
    auth.supabase
      .from("user_items")
      .select("id, item_id")
      .eq("user_id", auth.user.id),
    auth.supabase
      .from("character_equipment")
      .select("user_item_id")
      .eq("character_id", character.id),
  ]);

  for (const [context, result] of [
    ["get shop items", itemsResult],
    ["get owned shop items", ownedResult],
    ["get equipped shop items", equipmentResult],
  ] as const) {
    if (result.error) return queryErrorResponse(result.error, context);
  }

  const ownedByItem = new Map(
    (ownedResult.data ?? []).map((owned) => [owned.item_id, owned.id])
  );
  const equippedIds = new Set(
    (equipmentResult.data ?? []).map((equipment) => equipment.user_item_id)
  );
  // 필터를 지정하지 않으면 현재 성장 단계 상품을 보여준다.
  // 구매 가능 여부는 구매 RPC가 ITEM_TARGET_MISMATCH로 별도 검증한다.
  const requestedTarget = filters.data.target_type ?? targetType;

  const mappedItems: ShopItemsData["items"] = [];
  for (const item of itemsResult.data ?? []) {
    const category = item.item_categories;
    if (!category) {
      return internalError("get shop items: category missing", item);
    }
    if (category.target_type !== requestedTarget) continue;
    if (filters.data.slot && category.slot !== filters.data.slot) continue;
    const userItemId = ownedByItem.get(item.id) ?? null;
    mappedItems.push({
      id: item.id,
      category,
      name: item.name,
      price: item.price,
      asset_key: item.asset_key,
      owned: userItemId !== null,
      user_item_id: userItemId,
      equipped: userItemId !== null && equippedIds.has(userItemId),
    });
  }

  const data: ShopItemsData = {
    coins: profileResult.data.coins,
    character: {
      id: character.id,
      growth_stage: character.growth_stage,
      target_type: targetType,
    },
    items: mappedItems,
  };

  return ok(data);
}
