"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ApiResponse, UserMeData } from "@/types/api";
import AuthHeader from "../_components/AuthHeader";
import styles from "./page.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return setError("이메일과 비밀번호를 입력해주세요.");
    setPending(true);
    setError("");
    const { error: authError } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setPending(false);
      return setError("이메일 또는 비밀번호를 확인해주세요.");
    }

    const response = await fetch("/api/users/me", { cache: "no-store" });
    if (!response.ok) {
      setPending(false);
      return setError("로그인 정보를 불러오지 못했어요. 다시 시도해주세요.");
    }
    const body = (await response.json()) as ApiResponse<UserMeData>;
    if ("error" in body) {
      setPending(false);
      return setError("로그인 정보를 불러오지 못했어요. 다시 시도해주세요.");
    }
    router.replace(body.data.initialized ? "/home" : "/start");
    router.refresh();
  }

  return (
    <form className={styles.auth} onSubmit={login}>
      <AuthHeader sub="로그인하고 알을 깨러 가요!" />
      <div className={styles.fields}>
        <input className={styles.input} type="email" placeholder="이메일" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={styles.input} type="password" placeholder="비밀번호" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p role="alert">{error}</p>}
      <button className={styles.btn} disabled={pending}>{pending ? "로그인 중..." : "로그인하기"}</button>
      <Link href="/signup" className={`${styles.btn} ${styles.ghost}`}>회원가입</Link>
    </form>
  );
}
