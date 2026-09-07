import type { RankingsData } from "@/types/api";
import { apiRequest } from "@/lib/api/client";

export async function getRankings(): Promise<RankingsData> {
  return apiRequest<RankingsData>("/api/rankings");
}
