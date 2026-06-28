"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AttemptRecord, EggEquip, Mood, PetEquip, PetKey, YMD } from "@/types/game";
import {
  QUESTIONS,
  PETS,
  expForLevel,
  EXP_CORRECT,
  EXP_WRONG,
  COIN_CORRECT,
  LEVELUP_COIN,
  START_COINS,
  START_STREAK,
  MAX_HEARTS,
} from "@/lib/data";
import { ACCS } from "@/lib/pixel/accessories";
import { EGG_ACCS } from "@/lib/pixel/egg";
import {
  accuracy,
  buildAttempt,
  keyOf,
  seedStudyData,
  shiftDay,
  todayYMD,
  ymdKey,
} from "@/lib/game";

type OverlayType = "calendar" | "topic" | "hatch" | "levelup" | null;
type ShopTab = "hat" | "glasses";
type EggTab = "pattern" | "hat" | "nest";

interface Session {
  total: number;
  correct: number;
  exp: number;
  coins: number;
  leveled: boolean;
  reward: number;
  pendingHatch: boolean;
}

interface GameState {
  pet: PetKey;
  nick: string;
  mood: Mood;
  level: number;
  exp: number;
  totalExp: number;
  coins: number;
  hatched: boolean;
  streak: number;
  solved: number;
  correct: number;
  todaySolved: number;
  todayCorrect: number;
  topic: string;
  hearts: number;
  qi: number;
  selected: number | null;
  answered: boolean;
  lastOk: boolean | null;
  showExp: boolean;
  session: Session;
  shopTab: ShopTab;
  eggTab: EggTab;
  owned: Record<string, boolean>;
  equipped: PetEquip;
  eggEquip: EggEquip;
  studyDays: Record<string, boolean>;
  records: Record<string, AttemptRecord[]>;
  recordDate: YMD;
  calView: { y: number; m: number };
  overlay: { type: OverlayType; reward: number };
  toast: string | null;
}

const emptySession: Session = {
  total: 0,
  correct: 0,
  exp: 0,
  coins: 0,
  leveled: false,
  reward: 0,
  pendingHatch: false,
};

function createInitialState(): GameState {
  const { studyDays, records } = seedStudyData();
  const today = todayYMD();
  return {
    pet: "bunny",
    nick: "",
    mood: "idle",
    level: 1,
    exp: 0,
    totalExp: 0,
    coins: START_COINS,
    hatched: false,
    streak: START_STREAK,
    solved: 0,
    correct: 0,
    todaySolved: 0,
    todayCorrect: 0,
    topic: "web",
    hearts: MAX_HEARTS,
    qi: 0,
    selected: null,
    answered: false,
    lastOk: null,
    showExp: false,
    session: { ...emptySession },
    shopTab: "hat",
    eggTab: "pattern",
    owned: {},
    equipped: { hat: null, glasses: null },
    eggEquip: { pattern: null, hat: null, nest: null },
    studyDays,
    records,
    recordDate: today,
    calView: { y: today.y, m: today.m },
    overlay: { type: null, reward: 0 },
    toast: null,
  };
}

/** EXP 획득 + 레벨업 처리 (부화/연출은 미루고 세션 플래그만 기록) */
function applyGain(s: GameState, delta: number): GameState {
  let exp = Math.max(0, s.exp + delta);
  let level = s.level;
  let coins = s.coins;
  let leveled = false;
  let reward = 0;
  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level);
    level += 1;
    leveled = true;
    reward += LEVELUP_COIN;
    coins += LEVELUP_COIN;
  }
  const session = leveled
    ? {
        ...s.session,
        leveled: true,
        reward: s.session.reward + reward,
        pendingHatch: s.session.pendingHatch || !s.hatched,
      }
    : s.session;
  return {
    ...s,
    exp,
    level,
    coins,
    totalExp: delta > 0 ? s.totalExp + delta : s.totalExp,
    session,
  };
}

interface GameContextValue extends GameState {
  setNick(name: string): void;
  startGame(nick: string): void;
  setTopic(topic: string): void;
  startQuiz(): void;
  selectAnswer(index: number): void;
  submitAnswer(): void;
  toggleExplanation(): void;
  /** 다음 문제로 이동. 세션 종료 시 true 반환 */
  nextQuestion(): boolean;
  finishSession(): void;
  setMood(mood: Mood): void;
  setShopTab(tab: ShopTab): void;
  setEggTab(tab: EggTab): void;
  buy(key: string): void;
  equip(key: string): void;
  openCalendar(focus?: YMD): void;
  moveCalendar(delta: number): void;
  pickRecordDate(date: YMD): void;
  openTodayRecord(): void;
  shiftRecord(delta: number): void;
  openTopicPicker(): void;
  closeOverlay(): void;
  showToast(message: string): void;
  clearToast(): void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);
  const patch = useCallback(
    (fn: (s: GameState) => GameState) => setState((prev) => fn(prev)),
    [],
  );

  const showToast = useCallback(
    (message: string) => setState((s) => ({ ...s, toast: message })),
    [],
  );
  const clearToast = useCallback(() => setState((s) => ({ ...s, toast: null })), []);

  const actions = useMemo<Omit<GameContextValue, keyof GameState>>(() => {
    const setNick = (name: string) => patch((s) => ({ ...s, nick: name }));

    const startGame = (nick: string) =>
      patch((s) => ({
        ...s,
        nick: nick.trim() || "펫집사",
        pet: PETS[Math.floor(Math.random() * PETS.length)],
      }));

    const setTopic = (topic: string) => patch((s) => ({ ...s, topic }));

    const startQuiz = () =>
      patch((s) => ({
        ...s,
        qi: 0,
        selected: null,
        answered: false,
        showExp: false,
        hearts: MAX_HEARTS,
        mood: "idle",
        session: { ...emptySession },
      }));

    const selectAnswer = (index: number) =>
      patch((s) => (s.answered ? s : { ...s, selected: index }));

    const submitAnswer = () =>
      patch((s) => {
        if (s.answered || s.selected === null) return s;
        const q = QUESTIONS[s.qi];
        const ok = s.selected === q.a;
        const todayKey = keyOf(new Date());
        const attempt = buildAttempt(s.topic, q, s.selected);

        let next: GameState = {
          ...s,
          answered: true,
          showExp: false,
          lastOk: ok,
          solved: s.solved + 1,
          todaySolved: s.todaySolved + 1,
          records: {
            ...s.records,
            [todayKey]: [...(s.records[todayKey] ?? []), attempt],
          },
          session: { ...s.session, total: s.session.total + 1 },
        };

        if (ok) {
          next = {
            ...next,
            correct: next.correct + 1,
            todayCorrect: next.todayCorrect + 1,
            coins: next.coins + COIN_CORRECT,
            session: {
              ...next.session,
              correct: next.session.correct + 1,
              coins: next.session.coins + COIN_CORRECT,
              exp: next.session.exp + EXP_CORRECT,
            },
          };
          next = applyGain(next, EXP_CORRECT);
        } else {
          next = {
            ...next,
            hearts: next.hearts - 1,
            session: { ...next.session, exp: next.session.exp + EXP_WRONG },
          };
          next = applyGain(next, EXP_WRONG);
        }
        return next;
      });

    const toggleExplanation = () =>
      patch((s) => ({ ...s, showExp: !s.showExp }));

    const setMood = (mood: Mood) => patch((s) => ({ ...s, mood }));
    const setShopTab = (shopTab: ShopTab) => patch((s) => ({ ...s, shopTab }));
    const setEggTab = (eggTab: EggTab) => patch((s) => ({ ...s, eggTab }));

    const buy = (key: string) => {
      const pet = ACCS[key];
      const egg = EGG_ACCS[key];
      const item = pet ?? egg;
      if (!item) return;
      patch((s) => {
        if (s.coins < item.price) return { ...s, toast: "코인이 부족해요" };
        const equipped = pet ? { ...s.equipped, [pet.slot]: key } : s.equipped;
        const eggEquip = egg ? { ...s.eggEquip, [egg.slot]: key } : s.eggEquip;
        return {
          ...s,
          coins: s.coins - item.price,
          owned: { ...s.owned, [key]: true },
          equipped,
          eggEquip,
          toast: `${item.name} 구매 완료!`,
        };
      });
    };

    const equip = (key: string) => {
      const pet = ACCS[key];
      const egg = EGG_ACCS[key];
      patch((s) => {
        if (pet) {
          const cur = s.equipped[pet.slot];
          return { ...s, equipped: { ...s.equipped, [pet.slot]: cur === key ? null : key } };
        }
        if (egg) {
          const cur = s.eggEquip[egg.slot];
          return { ...s, eggEquip: { ...s.eggEquip, [egg.slot]: cur === key ? null : key } };
        }
        return s;
      });
    };

    const nextQuestion = () => {
      let finished = false;
      patch((s) => {
        finished = s.qi >= QUESTIONS.length - 1 || s.hearts <= 0;
        if (finished) return s;
        return { ...s, qi: s.qi + 1, selected: null, answered: false, showExp: false };
      });
      return finished;
    };

    const finishSession = () =>
      patch((s) => {
        const today = keyOf(new Date());
        const overlay: GameState["overlay"] = s.session.leveled
          ? s.session.pendingHatch
            ? { type: "hatch", reward: 0 }
            : { type: "levelup", reward: s.session.reward }
          : { type: null, reward: 0 };
        return {
          ...s,
          studyDays: { ...s.studyDays, [today]: true },
          qi: 0,
          selected: null,
          answered: false,
          hearts: MAX_HEARTS,
          overlay,
          toast: s.session.leveled ? s.toast : "오늘 학습 완료! 🎉",
        };
      });

    const openCalendar = (focus?: YMD) =>
      patch((s) => {
        const date = focus ?? s.recordDate;
        return {
          ...s,
          recordDate: date,
          calView: { y: date.y, m: date.m },
          overlay: { type: "calendar", reward: 0 },
        };
      });

    const moveCalendar = (delta: number) =>
      patch((s) => {
        let { y, m } = s.calView;
        m += delta;
        if (m < 0) { m = 11; y -= 1; }
        if (m > 11) { m = 0; y += 1; }
        return { ...s, calView: { y, m } };
      });

    const pickRecordDate = (date: YMD) =>
      patch((s) => ({ ...s, recordDate: date, overlay: { type: null, reward: 0 } }));

    const openTodayRecord = () => patch((s) => ({ ...s, recordDate: todayYMD() }));

    const shiftRecord = (delta: number) =>
      patch((s) => ({ ...s, recordDate: shiftDay(s.recordDate, delta) }));

    const openTopicPicker = () =>
      patch((s) => ({ ...s, overlay: { type: "topic", reward: 0 } }));

    const closeOverlay = () =>
      patch((s) => ({
        ...s,
        hatched: s.overlay.type === "hatch" ? true : s.hatched,
        session:
          s.overlay.type === "hatch" || s.overlay.type === "levelup"
            ? { ...s.session, leveled: false, pendingHatch: false }
            : s.session,
        overlay: { type: null, reward: 0 },
      }));

    return {
      setNick,
      startGame,
      setTopic,
      startQuiz,
      selectAnswer,
      submitAnswer,
      toggleExplanation,
      nextQuestion,
      finishSession,
      setMood,
      setShopTab,
      setEggTab,
      buy,
      equip,
      openCalendar,
      moveCalendar,
      pickRecordDate,
      openTodayRecord,
      shiftRecord,
      openTopicPicker,
      closeOverlay,
      showToast,
      clearToast,
    };
  }, [patch, showToast, clearToast]);

  const value = useMemo<GameContextValue>(() => ({ ...state, ...actions }), [state, actions]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}

/** 오늘 정답률 */
export const useTodayAccuracy = () => {
  const { todayCorrect, todaySolved } = useGame();
  return accuracy(todayCorrect, todaySolved);
};

export { ymdKey };
