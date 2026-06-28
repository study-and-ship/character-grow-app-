"use client";

import { useRouter } from "next/navigation";
import { useGame, ymdKey } from "@/context/GameContext";
import { TOPICS } from "@/lib/data";
import { accuracy } from "@/lib/game";
import Icon from "@/components/pixel/Icon";
import styles from "./page.module.scss";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export default function RecordPage() {
  const router = useRouter();
  const g = useGame();
  const { y, m, d } = g.recordDate;
  const recs = g.records[ymdKey(g.recordDate)] ?? [];
  const today = new Date();
  const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const weekday = WEEK[new Date(y, m, d).getDay()];

  const total = recs.length;
  const ok = recs.filter((r) => r.correct).length;
  const acc = accuracy(ok, total);
  const topics = [...new Set(recs.map((r) => r.topic))]
    .map((tk) => TOPICS.find((t) => t.k === tk))
    .filter(Boolean);

  return (
    <>
      <div className={styles.topbar}>
        <button className={styles.iconbtn} onClick={() => router.push("/home")}>←</button>
        <b className={styles.heading}>학습 기록</b>
        <button className={`${styles.minibtn} ${styles.sec} ${styles.calBtn}`} onClick={() => g.openCalendar()}>
          달력
        </button>
      </div>

      <div className={styles.dayNav}>
        <button className={styles.iconbtn} onClick={() => g.shiftRecord(-1)}>‹</button>
        <b className={styles.dayLabel}>{y}년 {m + 1}월 {d}일 ({weekday}){isToday ? " · 오늘" : ""}</b>
        <button
          className={styles.iconbtn}
          onClick={() => g.shiftRecord(1)}
          disabled={isToday}
          style={isToday ? { opacity: 0.25, pointerEvents: "none" } : undefined}
        >
          ›
        </button>
      </div>

      {total ? (
        <>
          <div className={styles.topicRow}>
            {topics.map((t) => (
              <span key={t!.k} className={styles.pill}>{t!.ico} {t!.n}</span>
            ))}
          </div>
          <div className={styles.summary}>
            <p className={styles.label}>정답</p>
            <p className={styles.bignum}>{ok} <span>/ {total}문제</span></p>
            <div className={styles.bar}><i style={{ width: `${acc}%` }} /></div>
            <p className={styles.accText}>정답률 {acc}%</p>
          </div>
          <p className={styles.sectionLabel}>푼 문제</p>
          <div className={styles.recList}>
            {recs.map((r, i) => (
              <div key={i} className={styles.recItem}>
                <span className={`${styles.mark} ${r.correct ? styles.ok : styles.no}`}>
                  {r.correct ? "O" : "X"}
                </span>
                <div className={styles.recBody}>
                  <div className={styles.recQ}>{r.q}</div>
                  {!r.correct && (
                    <div className={styles.recAnswer}>내 답: {r.picked} · 정답: {r.answer}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIco}><Icon name="empty" size={58} /></div>
          <p>{isToday ? "오늘은 아직 푼 문제가 없어요" : "이 날은 학습 기록이 없어요"}</p>
        </div>
      )}

      <div className={styles.grow} />
    </>
  );
}
