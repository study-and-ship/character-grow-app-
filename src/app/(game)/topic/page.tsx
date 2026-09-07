"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gameService } from "@/features/game/service";
import { quizService } from "@/features/quiz/service";
import type { QuestionCategoryData } from "@/types/api";
import styles from "./page.module.scss";

export default function TopicPage() {
  const router = useRouter();
  const [items, setItems] = useState<QuestionCategoryData[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);
  useEffect(() => { gameService.categories().then((v) => { setItems(v); setSelected(v[0]?.id ?? null); }).catch((e: Error) => setError(e.message)).finally(() => setPending(false)); }, []);
  async function start() {
    if (!selected || pending) return;
    setPending(true); setError("");
    try { const session = await quizService.start(selected); sessionStorage.setItem("quizSessionId", String(session.id)); router.push("/quiz"); }
    catch (e) { setError(e instanceof Error ? e.message : "퀴즈를 시작하지 못했어요."); setPending(false); }
  }
  return <>
    <div className={styles.topBar}><button className={styles.iconBtn} onClick={() => router.push("/home")}>←</button><b className={styles.heading}>주제 선택</b><span className={styles.spacer} /></div>
    <p className={styles.sub}>풀고 싶은 주제를 골라보세요</p>
    <div className={styles.tags}>
      {items.map((t) => <button key={t.id} className={`${styles.tag} ${selected === t.id ? styles.tagOn : ""}`} onClick={() => setSelected(t.id)}>{t.name}</button>)}
      <button className={`${styles.tag} ${styles.tagAdd}`} onClick={() => alert("새 주제 만들기는 추후 지원 예정이에요.")}>+ 새 주제 만들기</button>
    </div>
    {pending && !items.length && <p>주제를 불러오는 중...</p>}{!pending && !items.length && !error && <p>현재 학습 가능한 주제가 없어요.</p>}{error && <p role="alert">{error}</p>}
    <div className={styles.grow} /><button className={styles.startBtn} disabled={!selected || pending} onClick={start}>{pending && items.length ? "준비 중..." : "이 주제로 풀기 ▶"}</button>
  </>;
}
