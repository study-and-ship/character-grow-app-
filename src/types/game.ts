// 공용 타입 정의 (가데이터 기반 목업)
export type PetKey = "bunny" | "cat" | "hamster";
export type Mood = "idle" | "happy" | "correct" | "angry" | "sulk" | "sleepy";

export interface PetData {
  base: string[];
  faces: Record<string, [number, number, string][]>;
}

export interface Question {
  q: string;
  o: string[];
  a: number;
  e: string;
}

export interface Topic {
  k: string;
  n: string;
  ico: string;
}

/** 펫 액세서리(모자·안경) */
export interface Accessory {
  slot: "hat" | "glasses";
  name: string;
  price: number;
  px: [number, number, string][];
}

/** 알 꾸미기 아이템(무늬·모자·둥지) */
export interface EggAccessory {
  slot: "pattern" | "hat" | "nest";
  name: string;
  price: number;
  px: [number, number, string][];
}

export interface PetEquip {
  hat: string | null;
  glasses: string | null;
}

export interface EggEquip {
  pattern: string | null;
  hat: string | null;
  nest: string | null;
}

/** 하루치 학습 기록 1건 */
export interface AttemptRecord {
  topic: string;
  q: string;
  correct: boolean;
  picked: string;
  answer: string;
}

export interface YMD {
  y: number;
  m: number;
  d: number;
}
