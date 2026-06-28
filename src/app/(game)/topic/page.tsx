"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TOPICS } from "@/lib/data";
import styles from "./page.module.scss";

export default function TopicPage() {
  const router = useRouter();
  const g = useGame();
  const [custom, setCustom] = useState("");

  const customTopic = custom.trim();
  const hasCustom = customTopic.length > 0;

  const start = () => {
    if (hasCustom) g.setTopic(customTopic);
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

      <div className={styles.optList}>
        {TOPICS.map((t) => (
          <button
            key={t.k}
            className={`${styles.opt} ${!hasCustom && g.topic === t.k ? styles.sel : ""}`}
            onClick={() => { setCustom(""); g.setTopic(t.k); }}
          >
            <span>{t.n}</span>
          </button>
        ))}
      </div>

      <div className={styles.customWrap}>
        <p className={styles.customLabel}>직접 주제 만들기</p>
        <input
          className={styles.customInput}
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") start(); }}
          placeholder="예: 한국사, 영어 회화..."
          maxLength={20}
        />
      </div>

      <div className={styles.grow} />
      <button className={styles.startBtn} onClick={start}>이 주제로 풀기 ▶</button>
    </>
  );
}
