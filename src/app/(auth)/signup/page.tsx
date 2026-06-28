"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import AuthHeader from "../_components/AuthHeader";
import styles from "./page.module.scss";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useGame();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const signup = () => {
    if (id.trim().length < 4) return showToast("아이디는 4자 이상이에요");
    if (pw.length < 4) return showToast("비밀번호는 4자 이상이에요");
    if (pw !== pw2) return showToast("비밀번호가 일치하지 않아요");
    showToast("회원가입 완료!");
    router.push("/start");
  };

  return (
    <div className={styles.auth}>
      <AuthHeader sub="회원가입하고 나만의 알을 받아요!" />
      <div className={styles.fields}>
        <input className={styles.input} placeholder="아이디 (4자 이상)" value={id} onChange={(e) => setId(e.target.value)} />
        <input className={styles.input} type="password" placeholder="비밀번호 (4자 이상)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input
          className={styles.input}
          type="password"
          placeholder="비밀번호 확인"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signup()}
        />
      </div>
      <button className={styles.btn} onClick={signup}>가입하기</button>
      <Link href="/login" className={`${styles.btn} ${styles.ghost}`}>이미 계정이 있어요</Link>
    </div>
  );
}
