"use client";

import { useRouter } from "next/navigation";
import type { Mood } from "@/types/game";
import { useGame, useTodayAccuracy } from "@/context/GameContext";
import { MOOD_MSG, expForLevel } from "@/lib/data";
import { todayYMD } from "@/lib/game";
import Creature from "@/components/pixel/Creature";
import Icon from "@/components/pixel/Icon";
import BottomNav from "@/components/layout/BottomNav";
import styles from "./page.module.scss";

const MOODS: { key: Mood; label: string }[] = [
  { key: "idle", label: "기본" },
  { key: "happy", label: "기쁨" },
  { key: "correct", label: "정답" },
  { key: "angry", label: "오답" },
  { key: "sulk", label: "시무룩" },
  { key: "sleepy", label: "졸림" },
];

export default function HomePage() {
  const router = useRouter();
  const g = useGame();
  const acc = useTodayAccuracy();
  const max = expForLevel(g.level);

  return (
    <>
      <div className={styles.topbar}>
        <span className={styles.pill}>Lv.{g.level} <b>{g.nick || "펫집사"}</b></span>
        <span className={`${styles.pill} ${styles.coin}`}><Icon name="coin" size={18} /> {g.coins}</span>
      </div>

      <div className={styles.expCard}>
        <div className={styles.expRow}>
          <span className={styles.label}>EXP</span>
          <span className={styles.label}>{g.exp} / {max}</span>
        </div>
        <div className={styles.bar}>
          <i style={{ width: `${Math.min(100, (g.exp / max) * 100)}%` }} />
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.bubble}>
          {g.hatched ? MOOD_MSG[g.mood] : "문제를 풀어 레벨업하면 알이 부화해요! 🥚"}
        </div>
        <Creature state={g.mood} size={130} petSize={96} />
        {g.hatched ? (
          <div className={styles.seg}>
            {MOODS.map((m) => (
              <button
                key={m.key}
                className={g.mood === m.key ? styles.on : undefined}
                onClick={() => g.setMood(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.hatchHint}>레벨업하면 알이 부화해요 🥚 → 🐣</p>
        )}
      </div>

      <div className={styles.stats}>
        <button className={styles.stat} onClick={() => g.openCalendar(todayYMD())}>
          <div className={styles.ico}><Icon name="fire" size={26} /></div>
          <div className={styles.label}>연속 학습</div>
          <div className={styles.big}>{g.streak}일</div>
        </button>
        <button
          className={styles.stat}
          onClick={() => { g.openTodayRecord(); router.push("/record"); }}
        >
          <div className={styles.ico}><Icon name="book" size={26} /></div>
          <div className={styles.label}>푼 문제</div>
          <div className={styles.big}>{g.solved}개</div>
        </button>
        <div className={styles.stat}>
          <div className={styles.ico}><Icon name="star" size={26} /></div>
          <div className={styles.label}>오늘의 정답률</div>
          <div className={styles.big}>{acc}%</div>
        </div>
      </div>

      <div className={styles.grow} />
      <button className={styles.quizBtn} onClick={g.openTopicPicker}>오늘의 문제 풀기 ▶</button>
      <BottomNav />
    </>
  );
}
