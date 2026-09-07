import { apiRequest } from "@/lib/api/client";
import type { EquipmentData, HomeData, InventoryData, QuestionCategoryData, ShopItemsData, StudyCalendarData, StudyRecordData } from "@/types/api";

export const gameService = {
  home: () => apiRequest<HomeData>("/api/users/me/home"),
  categories: () => apiRequest<QuestionCategoryData[]>("/api/question-categories"),
  calendar: (year: number, month: number) => apiRequest<StudyCalendarData>(`/api/users/me/study-calendar?year=${year}&month=${month}`),
  record: (date: string) => apiRequest<StudyRecordData>(`/api/users/me/study-records?date=${date}`),
  shop: () => apiRequest<ShopItemsData>("/api/shop/items"),
  inventory: () => apiRequest<InventoryData>("/api/users/me/inventory"),
  equip: (slot: string, userItemId: number) => apiRequest<EquipmentData>(`/api/users/me/character/equipment/${slot}`, { method: "PUT", body: JSON.stringify({ user_item_id: userItemId }) }),
  unequip: (slot: string) => apiRequest<EquipmentData>(`/api/users/me/character/equipment/${slot}`, { method: "DELETE" }),
};
