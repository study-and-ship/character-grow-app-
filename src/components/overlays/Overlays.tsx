"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { PET_NAME } from "@/lib/data";
import { dateKey } from "@/lib/game";
import Icon from "@/components/pixel/Icon";
import EggSprite from "@/components/pixel/EggSprite";
import PetSprite from "@/components/pixel/PetSprite";
import styles from "./overlays.module.scss";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

function CalendarModal() {
  const g = useGame();
  const router = useRouter();
  const { y, m } = g.calView;
  const firstDay = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const isThisMonth = today.getFullYear() === y && today.getMonth() === m;
  const monthCount = Object.keys(g.studyDays).filter((k) => k.startsWith(`${y}-${m}-`)).length;

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className={`${styles.cell} ${styles.empty}`} />);
  for (let d = 1; d <= days; d++) {
    const done = g.studyDays[dateKey(y, m, d)];
    const isToday = isThisMonth && today.getDate() === d;
    const isFocus = g.recordDate.y === y && g.recordDate.m === m && g.recordDate.d === d;
    const cls = [styles.cell, done && styles.done, isToday && styles.today, isFocus && styles.focus]
      .filter(Boolean)
      .join(" ");
    cells.push(
      <div
        key={d}
        className={cls}
        onClick={done ? () => { g.pickRecordDate({ y, m, d }); router.push("/record"); } : undefined}
      >
        {done ? <Icon name="fire" size={18} /> : d}
      </div>,
    );
  }

  return (
    <div className={styles.modal} onClick={g.closeOverlay}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.row} style={{ marginBottom: 10 }}>
          <button className={styles.iconbtn} onClick={() => g.moveCalendar(-1)}>‹</button>
          <b style={{ fontSize: 22 }}>{y}년 {MONTHS[m]}</b>
          <button className={styles.iconbtn} onClick={() => g.moveCalendar(1)}>›</button>
        </div>
        <div className={styles.calhead}>
          {WEEK.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className={styles.calgrid}>{cells}</div>
        <p className={styles.label} style={{ marginTop: 12 }}>
          이번 달 {monthCount}일 학습 · <Icon name="fire" size={16} /> 연속 {g.streak}일
        </p>
        <button className={styles.btn} onClick={g.closeOverlay}>닫기</button>
      </div>
    </div>
  );
}

const SPARK_COUNT = 10;

function HatchModal() {
  const g = useGame();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.modal}>
      <div className={styles.box}>
        <h2 className={styles.title}>{revealed ? "알이 부화했어요!" : "알이 흔들흔들..."}</h2>
        <p className={styles.sub}>
          {revealed ? `${PET_NAME[g.pet]} 친구가 태어났어요!` : "곧 무언가 나올 것 같아요!"}
        </p>
        <div className={styles.hatchStage}>
          {revealed ? (
            <>
              <div className={styles.hatchPet}>
                <PetSprite pet={g.pet} state="correct" size={104} equipped={g.equipped} />
              </div>
              {Array.from({ length: SPARK_COUNT }, (_, i) => {
                const angle = (Math.PI * 2 * i) / SPARK_COUNT;
                const radius = 58 + (i % 2 ? 14 : 0);
                return (
                  <span
                    key={i}
                    className={styles.spark}
                    style={{
                      "--sx": `${Math.round(Math.cos(angle) * radius)}px`,
                      "--sy": `${Math.round(Math.sin(angle) * radius)}px`,
                      background: i % 2 ? "var(--blush)" : "var(--sunny)",
                      animationDelay: `${i * 20}ms`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </>
          ) : (
            <div className={styles.hatchEgg}>
              <EggSprite size={84} equip={g.eggEquip} />
            </div>
          )}
        </div>
        {revealed && (
          <button className={styles.btn} onClick={g.closeOverlay}>반가워!</button>
        )}
      </div>
    </div>
  );
}

function LevelUpModal() {
  const g = useGame();
  return (
    <div className={styles.modal}>
      <div className={styles.box}>
        <h2 className={styles.title} style={{ fontSize: 34 }}>레벨업!</h2>
        <p className={styles.sub}>Lv.{g.level} 달성!</p>
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <PetSprite pet={g.pet} state="correct" size={96} equipped={g.equipped} />
        </div>
        <p style={{ fontSize: 20 }}>보상으로 코인 {g.overlay.reward} 획득!</p>
        <button className={styles.btn} onClick={g.closeOverlay}>좋아!</button>
      </div>
    </div>
  );
}

export default function Overlays() {
  const { overlay } = useGame();
  switch (overlay.type) {
    case "calendar": return <CalendarModal />;
    case "hatch": return <HatchModal />;
    case "levelup": return <LevelUpModal />;
    default: return null;
  }
}
