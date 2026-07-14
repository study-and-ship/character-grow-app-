import type { PetKey } from "@/types/game";

/** 랭킹 참가자 1명 (라이벌은 가데이터, 나는 실제 게임 상태로 채운다) */
export interface Ranker {
  id: string;
  name: string;
  pet: PetKey;
  level: number;
  /** 누적 정답 수 — 랭킹 기준 */
  correct: number;
  /** 연속 학습일 */
  streak: number;
}

/** 순위가 매겨진 참가자 */
export interface RankedEntry extends Ranker {
  rank: number;
  me: boolean;
}

/** 함께 겨루는 친구들 (가데이터 목업) */
export const RIVALS: Ranker[] = [
  { id: "byeolbam", name: "별밤", pet: "cat", level: 12, correct: 248, streak: 21 },
  { id: "oguogu", name: "오구오구", pet: "hamster", level: 10, correct: 205, streak: 15 },
  { id: "codingnyang", name: "코딩냥", pet: "cat", level: 9, correct: 187, streak: 30 },
  { id: "mungchi", name: "뭉치", pet: "bunny", level: 8, correct: 162, streak: 12 },
  { id: "hayang", name: "하양이", pet: "hamster", level: 7, correct: 140, streak: 9 },
  { id: "choco", name: "초코", pet: "bunny", level: 5, correct: 96, streak: 7 },
];

/** 누적 정답(동점 시 레벨) 순으로 정렬해 순위를 매긴다. */
function rankAll(me: Ranker): RankedEntry[] {
  return [...RIVALS, me]
    .sort((a, b) => b.correct - a.correct || b.level - a.level)
    .map((r, i) => ({ ...r, rank: i + 1, me: r.id === me.id }));
}

/** 상위 5명 + 내 순위(항상 포함) */
export function buildBoard(me: Ranker): { top: RankedEntry[]; mine: RankedEntry } {
  const ranked = rankAll(me);
  return { top: ranked.slice(0, 5), mine: ranked.find((r) => r.me)! };
}

/** 내 현재 순위만 필요할 때 (홈 타일용) */
export function myRank(me: Ranker): number {
  return rankAll(me).find((r) => r.me)!.rank;
}
