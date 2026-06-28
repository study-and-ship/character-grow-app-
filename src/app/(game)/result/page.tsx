"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { accuracy } from "@/lib/game";
import Creature from "@/components/pixel/Creature";
import Icon from "@/components/pixel/Icon";
import styles from "./page.module.scss";

export default function ResultPage() {
  const router = useRouter();
  const g = useGame();
  const { total, correct, exp, coins } = g.session;
  const acc = accuracy(correct, total);
  const petState = correct >= Math.ceil(total / 2) ? "correct" : "sulk";
  const msg = acc === 100 ? "완벽해요!" : acc >= 60 ? "잘했어요!" : "다음엔 더 잘할 수 있어요";
  const expSign = exp >= 0 ? "+" : "";

  const goHome = () => {
    g.finishSession();
    router.push("/home");
  };

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>학습 완료!</h1>
        <p className={styles.sub}>{msg}</p>
      </div>

      <div className={styles.creature}>
        <Creature state={petState} size={100} />
      </div>

      <div className={styles.card}>
        <p className={styles.label}>정답</p>
        <p className={styles.bignum}>{correct} <span>/ {total}문제</span></p>
        <div className={styles.bar}><i style={{ width: `${acc}%` }} /></div>
        <p className={styles.label}>정답률 {acc}%</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.ico}><Icon name="star" size={26} /></div>
          <div className={styles.label}>획득 EXP</div>
          <div className={styles.big}>{expSign}{exp}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.ico}><Icon name="coin" size={26} /></div>
          <div className={styles.label}>획득 코인</div>
          <div className={styles.big}>+{coins}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.ico}><Icon name="fire" size={26} /></div>
          <div className={styles.label}>연속 학습</div>
          <div className={styles.big}>{g.streak}일</div>
        </div>
      </div>

      <div className={styles.grow} />
      <button className={styles.btn} onClick={goHome}>홈으로 돌아가기</button>
    </>
  );
}
