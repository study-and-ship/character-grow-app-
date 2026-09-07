import type { PurchaseItemData, ShopItemsData } from "@/types/api";
import { apiRequest } from "@/lib/api/client";

export async function purchaseItem(itemId: number): Promise<PurchaseItemData> {
  return apiRequest<PurchaseItemData>(`/api/shop/items/${itemId}/purchase`, { method: "POST" });
}

export async function getShopItems(): Promise<ShopItemsData> { return apiRequest<ShopItemsData>("/api/shop/items"); }

export type { ShopItemsData };
