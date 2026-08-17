import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  queryErrorResponse,
  userNotInitializedResponse,
} from "@/lib/api/errors";
import { emptyEquipment, targetTypeForStage } from "@/lib/api/game";
import { internalError, ok } from "@/lib/api/response";
import {
  itemFilterSchema,
  parseValue,
  searchParamsToObject,
} from "@/lib/api/validation";
import type { InventoryData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const filters = parseValue(
    searchParamsToObject(request.nextUrl.searchParams),
    itemFilterSchema,
    "인벤토리 필터가 올바르지 않습니다."
  );
  if (!filters.ok) return filters.response;

  const { data: character, error: characterError } = await auth.supabase
    .from("characters")
    .select("id, growth_stage")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (characterError) {
    return queryErrorResponse(characterError, "get inventory character");
  }
  if (!character) {
    return userNotInitializedResponse();
  }

  const [ownedResult, equipmentResult] = await Promise.all([
    auth.supabase
      .from("user_items")
      .select(
        "id, item_id, purchased_at, shop_items(name, asset_key, item_categories(slot, target_type))"
      )
      .eq("user_id", auth.user.id)
      .order("purchased_at"),
    auth.supabase
      .from("character_equipment")
      .select("slot, user_item_id")
      .eq("character_id", character.id),
  ]);
  if (ownedResult.error) {
    return queryErrorResponse(ownedResult.error, "get inventory items");
  }
  if (equipmentResult.error) {
    return queryErrorResponse(
      equipmentResult.error,
      "get inventory equipment"
    );
  }

  const equippedIds = new Set(
    equipmentResult.data.map((equipment) => equipment.user_item_id)
  );
  const allItems: InventoryData["items"] = [];
  for (const owned of ownedResult.data) {
    const shopItem = owned.shop_items;
    const category = shopItem?.item_categories;
    if (!shopItem || !category) {
      return internalError("get inventory: item relation missing", owned);
    }
    allItems.push({
      user_item_id: owned.id,
      item_id: owned.item_id,
      name: shopItem.name,
      asset_key: shopItem.asset_key,
      slot: category.slot,
      target_type: category.target_type,
      purchased_at: owned.purchased_at,
      equipped: equippedIds.has(owned.id),
    });
  }

  const byUserItem = new Map(allItems.map((item) => [item.user_item_id, item]));
  const equipment = emptyEquipment<{
    user_item_id: number;
    item_id: number;
    asset_key: string;
  }>();
  for (const row of equipmentResult.data) {
    const item = byUserItem.get(row.user_item_id);
    if (!item) {
      return internalError("get inventory: equipped item missing", row);
    }
    equipment[row.slot] = {
      user_item_id: item.user_item_id,
      item_id: item.item_id,
      asset_key: item.asset_key,
    };
  }

  const items = allItems.filter(
    (item) =>
      (!filters.data.target_type ||
        item.target_type === filters.data.target_type) &&
      (!filters.data.slot || item.slot === filters.data.slot)
  );
  const data: InventoryData = {
    character: {
      id: character.id,
      growth_stage: character.growth_stage,
      target_type: targetTypeForStage(character.growth_stage),
    },
    items,
    equipment,
  };

  return ok(data);
}
