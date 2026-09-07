import type { CharacterGrowthStage } from "@/types/database";

export type { CharacterGrowthStage };

export interface CharacterStatus {
  id: number;
  characterTypeName: string;
  level: number;
  exp: number;
  totalExp: number;
  growthStage: CharacterGrowthStage;
}

export interface GrowthStageInfo {
  stage: CharacterGrowthStage;
  label: string;
  requiredTotalExp: number;
}
