"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import AuthHeader from "../_components/AuthHeader";
import styles from "./page.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const { setNick, showToast } = useGame();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const login = () => {
    if (!id.trim() || !pw) {
      showToast("아이디와 비밀번호를 입력해주세요");
      return;
    }
    setNick(id.trim());
    router.push("/start");
  };

  return (
    <div className={styles.auth}>
      <AuthHeader sub="로그인하고 알을 깨러 가요!" />
      <div className={styles.fields}>
        <input
          className={styles.input}
          placeholder="아이디"
          autoComplete="username"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
      </div>
      <button className={styles.btn} onClick={login}>로그인하기</button>
      <Link href="/signup" className={`${styles.btn} ${styles.ghost}`}>회원가입</Link>
    </div>
  );
}
