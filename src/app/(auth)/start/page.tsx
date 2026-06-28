"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import EggSprite from "@/components/pixel/EggSprite";
import styles from "./page.module.scss";

export default function StartPage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [nick, setNick] = useState("");

  const start = () => {
    startGame(nick);
    router.push("/home");
  };

  return (
    <div className={styles.start}>
      <div className={styles.head}>
        <h1 className={styles.title}>나만의 알 받기</h1>
        <p className={styles.sub}>닉네임을 정하면 알이 도착해요</p>
      </div>
      <div className={styles.egg}>
        <EggSprite size={40} withQuestion />
      </div>
      <div className={styles.bubble}>
        어떤 친구가 나올지는 아직 비밀! 문제를 풀어 알을 깨면 랜덤으로 펫이 태어나요
      </div>
      <p className={styles.label}>닉네임을 입력해주세요</p>
      <input
        className={styles.input}
        maxLength={8}
        placeholder="펫집사"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && start()}
      />
      <div className={styles.spacer} />
      <button className={styles.btn} onClick={start}>시작하기!</button>
    </div>
  );
}
