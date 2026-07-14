"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TOPICS } from "@/lib/data";
import styles from "./page.module.scss";

export default function TopicPage() {
  const router = useRouter();
  const g = useGame();

  const [selected, setSelected] = useState(() =>
    TOPICS.some((t) => t.k === g.topic) ? g.topic : TOPICS[0].k,
  );

  const start = () => {
    g.setTopic(selected);
    g.startQuiz();
    router.push("/quiz");
  };

  return (
    <>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => router.push("/home")}>←</button>
        <b className={styles.heading}>주제 선택</b>
        <span className={styles.spacer} />
      </div>
      <p className={styles.sub}>풀고 싶은 주제를 골라보세요</p>

      <div className={styles.tags}>
        {TOPICS.map((t) => (
          <button
            key={t.k}
            className={`${styles.tag} ${selected === t.k ? styles.tagOn : ""}`}
            onClick={() => setSelected(t.k)}
          >
            {t.n}
          </button>
        ))}
        <button className={`${styles.tag} ${styles.tagAdd}`} onClick={g.openCustomTopic}>
          + 새 주제 만들기
        </button>
      </div>

      <div className={styles.grow} />
      <button className={styles.startBtn} onClick={start}>이 주제로 풀기 ▶</button>
    </>
  );
}
