"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.scss";

export default function QuestionRequest() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const requestId = useRef<string | null>(null);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const normalizedTopic = topic.trim();
    if (Array.from(normalizedTopic).length < 2) {
      setError("주제를 두 글자 이상 입력해 주세요.");
      return;
    }

    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const id = (requestId.current ??= crypto.randomUUID());
      const { error: submissionError } = await createClient().rpc("submit_question_request", {
        p_id: id,
        p_topic: normalizedTopic,
        p_details: details.trim(),
      });
      if (submissionError) {
        if (submissionError.message === "question_request_limit") {
          setError("24시간에 최대 3번까지 요청할 수 있어요.");
        } else if (submissionError.code === "42501") {
          setError("다시 로그인한 후 요청해 주세요.");
        } else {
          setError("접수를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }
      requestId.current = null;
      setTopic("");
      setDetails("");
      setOpen(false);
      setSubmitted(true);
    } catch {
      setError("접수를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className={styles.requestSection}>
      <button
        type="button"
        className={`${styles.tag} ${styles.tagAdd}`}
        aria-expanded={open}
        aria-controls={open ? "question-request-form" : undefined}
        disabled={pending}
        onClick={() => { setOpen(!open); setSubmitted(false); }}
      >
        문제 생성 요청
      </button>
      {open && (
        <form id="question-request-form" className={styles.requestForm} onSubmit={submit}>
          <label htmlFor="question-request-topic">원하는 주제</label>
          <input id="question-request-topic" required minLength={2} maxLength={100}
            value={topic} disabled={pending}
            onChange={(event) => { setTopic(event.target.value); requestId.current = null; }} />
          <label htmlFor="question-request-details">포함할 내용 (선택)</label>
          <textarea id="question-request-details" rows={3} maxLength={500}
            value={details} disabled={pending}
            onChange={(event) => { setDetails(event.target.value); requestId.current = null; }} />
          {error && <p role="alert">{error}</p>}
          <button type="submit" className={styles.startBtn} disabled={pending}>
            {pending ? "접수 중…" : "요청 보내기"}
          </button>
        </form>
      )}
      <div role="status">{submitted && "문제 생성 요청을 접수했어요."}</div>
    </section>
  );
}
