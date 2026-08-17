import type {
  CharacterGrowthStage,
  EquipmentSlot,
  ItemTargetType,
} from "@/interface/database";

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "pattern",
  "hat",
  "glasses",
  "nest",
];

export function requiredExpForLevel(level: number) {
  return 20 + level * 30;
}

export function targetTypeForStage(
  growthStage: CharacterGrowthStage
): ItemTargetType {
  return growthStage === "egg" ? "egg" : "pet";
}

export function emptyEquipment<T>(): Record<EquipmentSlot, T | null> {
  return {
    pattern: null,
    hat: null,
    glasses: null,
    nest: null,
  };
}

export function todayInSeoul(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
