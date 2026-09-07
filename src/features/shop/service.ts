import type { ApiResponse, PurchaseItemData, ShopItemsData } from "@/types/api";

export async function purchaseItem(itemId: number): Promise<PurchaseItemData> {
  const response = await fetch(`/api/shop/items/${itemId}/purchase`, { method: "POST" });
  const body = (await response.json()) as ApiResponse<PurchaseItemData>;
  if (!response.ok || "error" in body) throw new Error("error" in body ? body.error.message : "구매에 실패했습니다.");
  return body.data;
}

export type { ShopItemsData };
