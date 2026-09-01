"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse, InitializeUserData } from "@/types/api";
import EggSprite from "@/components/pixel/EggSprite";
import styles from "./page.module.scss";

export default function StartPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function start(event: FormEvent) {
    event.preventDefault();
    const value = nickname.trim() || "펫집사";
    setPending(true);
    setError("");
    const response = await fetch("/api/users/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: value }),
    });
    const body = (await response.json()) as ApiResponse<InitializeUserData>;
    if (!response.ok || "error" in body) {
      setPending(false);
      return setError("시작 정보를 저장하지 못했어요. 다시 시도해주세요.");
    }
    router.replace("/home");
    router.refresh();
  }

  return (
    <form className={styles.start} onSubmit={start}>
      <div className={styles.head}><h1 className={styles.title}>나만의 알 받기</h1><p className={styles.sub}>닉네임을 정하면 알이 도착해요</p></div>
      <div className={styles.egg}><EggSprite size={40} withQuestion /></div>
      <div className={styles.bubble}>어떤 친구가 나올지는 아직 비밀! 문제를 풀어 알을 깨면 랜덤으로 펫이 태어나요</div>
      <label className={styles.label} htmlFor="nickname">닉네임을 입력해주세요</label>
      <input id="nickname" className={styles.input} maxLength={20} placeholder="펫집사" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      {error && <p role="alert">{error}</p>}
      <div className={styles.spacer} />
      <button className={styles.btn} disabled={pending}>{pending ? "준비 중..." : "시작하기!"}</button>
    </form>
  );
}
