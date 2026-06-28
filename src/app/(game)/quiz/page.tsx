"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { QUESTIONS, TOPICS } from "@/lib/data";
import Creature from "@/components/pixel/Creature";
import Hearts from "@/components/pixel/Hearts";
import styles from "./page.module.scss";

export default function QuizPage() {
  const router = useRouter();
  const g = useGame();
  const q = QUESTIONS[g.qi];
  const topic = TOPICS.find((t) => t.k === g.topic) ?? TOPICS[0];
  const petState = g.answered ? (g.lastOk ? "correct" : "angry") : "idle";
  const isLast = g.qi >= QUESTIONS.length - 1 || g.hearts <= 0;

  const optionClass = (i: number) => {
    if (g.answered) {
      if (i === q.a) return `${styles.opt} ${styles.correct}`;
      if (i === g.selected) return `${styles.opt} ${styles.wrong}`;
      return styles.opt;
    }
    return `${styles.opt} ${g.selected === i ? styles.sel : ""}`;
  };

  const handleNext = () => {
    const finished = g.nextQuestion();
    if (finished) router.push("/result");
  };

  return (
    <>
      <div className={styles.topbar}>
        <button className={styles.iconbtn} onClick={() => router.push("/home")}>←</button>
        <b className={styles.count}>문제 {g.qi + 1} / {QUESTIONS.length}</b>
        <Hearts hearts={g.hearts} />
      </div>

      <div className={styles.topicRow}>
        <span className={styles.pill}>{topic.n} 학습 중</span>
      </div>

      <div className={styles.qcard}>{q.q}</div>

      <div className={styles.creature}>
        <Creature state={petState} size={76} />
      </div>

      <div className={styles.options}>
        {q.o.map((text, i) => (
          <button
            key={i}
            className={optionClass(i)}
            disabled={g.answered}
            onClick={() => g.selectAnswer(i)}
          >
            <span className={styles.num}>{i + 1}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>

      <div className={styles.grow} />

      {!g.answered ? (
        <button className={styles.btn} disabled={g.selected === null} onClick={g.submitAnswer}>
          제출하기
        </button>
      ) : (
        <>
          <div className={`${styles.feedback} ${g.lastOk ? styles.fbCorrect : styles.fbWrong}`}>
            {g.lastOk ? "정답! +10 EXP · +20 코인" : "틀렸어! −5 EXP · 하트 −1"}
          </div>
          <button className={`${styles.minibtn} ${styles.sec}`} onClick={g.toggleExplanation}>
            {g.showExp ? "해설 닫기 ▲" : "해설 보기 ▾"}
          </button>
          {g.showExp && (
            <div className={styles.expBox}>
              <b>해설</b>
              <span>{q.e || "해설이 준비 중이에요."}</span>
            </div>
          )}
          <button className={styles.btn} onClick={handleNext}>
            {isLast ? "결과 보기" : "다음 문제 ▶"}
          </button>
        </>
      )}
    </>
  );
}
