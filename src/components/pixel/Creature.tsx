"use client";

import type { Mood } from "@/types/game";
import { useGame } from "@/context/GameContext";
import PetSprite from "./PetSprite";
import EggSprite from "./EggSprite";

interface CreatureProps {
  state: Mood;
  /** 알 기준 크기 */
  size: number;
  /** 부화 후 캐릭터 크기 (미지정 시 size) */
  petSize?: number;
}

/** 부화 전이면 알, 부화 후면 캐릭터를 보여준다. */
export default function Creature({ state, size, petSize }: CreatureProps) {
  const { hatched, pet, equipped, eggEquip } = useGame();

  if (hatched) {
    return <PetSprite pet={pet} state={state} size={petSize ?? size} equipped={equipped} />;
  }
  return <EggSprite size={Math.round(size * 0.4)} equip={eggEquip} />;
}
