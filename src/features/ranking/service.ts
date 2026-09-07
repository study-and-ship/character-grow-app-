import type { ApiResponse, RankingsData } from "@/types/api";

export async function getRankings(): Promise<RankingsData> {
  const response = await fetch("/api/rankings", { cache: "no-store" });
  const body = (await response.json()) as ApiResponse<RankingsData>;
  if (!response.ok || "error" in body) throw new Error("error" in body ? body.error.message : "랭킹을 불러오지 못했습니다.");
  return body.data;
}
