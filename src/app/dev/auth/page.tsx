"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * dev 전용: 테스트 계정으로 회원가입/로그인/로그아웃 + 현재 세션 확인.
 * 로그인하면 브라우저 쿠키에 세션이 저장되어, 이후 🔒 API 테스트가 가능해진다.
 */
export default function DevAuthPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("test1234");
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  async function refreshSession() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  }

  useEffect(() => {
    // 마운트 시 1회 + 이후 인증 상태 변화 구독으로 세션 표시 갱신.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signUp() {
    setMsg("처리 중…");
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? `회원가입 실패: ${error.message}` : "회원가입 성공");
    refreshSession();
  }

  async function signIn() {
    setMsg("처리 중…");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMsg(error ? `로그인 실패: ${error.message}` : "로그인 성공");
    refreshSession();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMsg("로그아웃됨");
    refreshSession();
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <h2>인증 (로그인/세션)</h2>
      <p style={{ color: "#666" }}>
        로그인하면 쿠키 세션이 저장되어 🔒 API 테스트가 가능합니다.
      </p>

      <div
        style={{
          padding: 12,
          background: userId ? "#ecfdf5" : "#fef2f2",
          border: `1px solid ${userId ? "#16a34a" : "#dc2626"}`,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        현재 세션:{" "}
        <strong>{userId ? `로그인됨 (user_id: ${userId})` : "비로그인"}</strong>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          style={inputStyle}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={signUp} style={btn("#6b7280")}>
            회원가입
          </button>
          <button onClick={signIn} style={btn("#2563eb")}>
            로그인
          </button>
          <button onClick={signOut} style={btn("#dc2626")}>
            로그아웃
          </button>
        </div>
      </div>

      {msg && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 14,
};

function btn(bg: string): React.CSSProperties {
  return {
    flex: 1,
    padding: "8px 0",
    borderRadius: 8,
    border: "none",
    background: bg,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };
}
