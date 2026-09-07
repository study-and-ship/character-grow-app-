"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthHeader from "../_components/AuthHeader";
import styles from "./page.module.scss";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function signup(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return setMessage("이메일을 입력해주세요.");
    if (password.length < 8) return setMessage("비밀번호는 8자 이상이어야 해요.");
    if (password !== confirmation) return setMessage("비밀번호가 일치하지 않아요.");
    setPending(true);
    setMessage("");
    const { data, error } = await createClient().auth.signUp({ email: email.trim(), password });
    if (error) {
      setPending(false);
      return setMessage("가입을 완료하지 못했어요. 입력 내용을 확인해주세요.");
    }
    if (!data.session) {
      setMessage("가입이 완료됐어요. 이메일 인증 후 로그인해주세요.");
      setTimeout(() => router.replace("/login"), 1200);
      return;
    }
    router.replace("/start");
    router.refresh();
  }

  return (
    <form className={styles.auth} onSubmit={signup}>
      <AuthHeader sub="회원가입하고 나만의 알을 받아요!" />
      <div className={styles.fields}>
        <input className={styles.input} type="email" autoComplete="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={styles.input} type="password" autoComplete="new-password" placeholder="비밀번호 (8자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className={styles.input} type="password" autoComplete="new-password" placeholder="비밀번호 확인" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      </div>
      {message && <p role="status">{message}</p>}
      <button className={styles.btn} disabled={pending}>{pending ? "가입 중..." : "가입하기"}</button>
      <Link href="/login" className={`${styles.btn} ${styles.ghost}`}>이미 계정이 있어요</Link>
    </form>
  );
}
