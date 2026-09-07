"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { quizService } from "@/features/quiz/service";
import type { QuizSessionData, SubmitAnswerData } from "@/types/api";
import Creature from "@/components/pixel/Creature";
import Hearts from "@/components/pixel/Hearts";
import styles from "./page.module.scss";

export default function QuizPage() {
  const router = useRouter();
  const [session, setSession] = useState<QuizSessionData | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState<SubmitAnswerData | null>(null);
  const [showExp, setShowExp] = useState(false), [pending, setPending] = useState(true), [error, setError] = useState("");
  useEffect(() => { const id = Number(sessionStorage.getItem("quizSessionId")); if (!id) { router.replace("/topic"); return; } quizService.get(id).then(setSession).catch((e: Error) => setError(e.message)).finally(() => setPending(false)); }, [router]);
  const q = useMemo(() => session?.questions.find((item) => !item.answer) ?? null, [session]);
  useEffect(() => { if (session && !q) router.replace("/result"); }, [session, q, router]);
  async function submit() { if (!session || !q || !selected || pending) return; setPending(true); try { setAnswer(await quizService.answer(session.id, q.session_question_id, selected)); } catch (e) { setError(e instanceof Error ? e.message : "답을 제출하지 못했어요."); } finally { setPending(false); } }
  async function next() { if (!session || !answer) return; if (answer.can_complete) return router.push("/result"); setPending(true); try { setSession(await quizService.get(session.id)); setSelected(null); setAnswer(null); setShowExp(false); } catch (e) { setError(e instanceof Error ? e.message : "다음 문제를 불러오지 못했어요."); } finally { setPending(false); } }
  if (pending && !session) return <p>퀴즈를 불러오는 중...</p>;
  if (error && !session) return <><p role="alert">{error}</p><button onClick={() => router.push("/topic")}>주제로 돌아가기</button></>;
  if (!session || !q) return <p>결과를 준비하는 중...</p>;
  const optionClass = (id: number) => answer ? `${styles.opt} ${id === answer.correct_choice_id ? styles.correct : id === selected ? styles.wrong : ""}` : `${styles.opt} ${selected === id ? styles.sel : ""}`;
  return <>
    <div className={styles.topbar}><button className={styles.iconbtn} onClick={() => router.push("/home")}>←</button><b className={styles.count}>문제 {session.answered_count + 1} / {session.total_question_count}</b><Hearts hearts={answer?.hearts_remaining ?? session.hearts_remaining} /></div>
    <div className={styles.topicRow}><span className={styles.pill}>{session.category.name} 학습 중</span></div><div className={styles.qcard}>{q.question_text}</div>
    <div className={styles.creature}><Creature state={answer ? (answer.is_correct ? "correct" : "angry") : "idle"} size={76} /></div>
    <div className={styles.options}>{q.choices.map((choice, i) => <button key={choice.id} className={optionClass(choice.id)} disabled={!!answer || pending} onClick={() => setSelected(choice.id)}><span className={styles.num}>{i + 1}</span><span>{choice.choice_text}</span></button>)}</div>
    <div className={styles.grow} />{error && <p role="alert">{error}</p>}
    {!answer ? <button className={styles.btn} disabled={!selected || pending} onClick={submit}>{pending ? "제출 중..." : "제출하기"}</button> : <><div className={`${styles.feedback} ${answer.is_correct ? styles.fbCorrect : styles.fbWrong}`}>{answer.is_correct ? "정답이에요!" : "아쉬워요. 정답을 확인해보세요."}</div><button className={`${styles.minibtn} ${styles.sec}`} onClick={() => setShowExp(!showExp)}>{showExp ? "해설 닫기 ▲" : "해설 보기 ▾"}</button>{showExp && <div className={styles.expBox}><b>해설</b><span>{answer.explanation || "해설이 준비 중이에요."}</span></div>}<button className={styles.btn} onClick={next}>{answer.can_complete ? "결과 보기" : "다음 문제 ▶"}</button></>}
  </>;
}
