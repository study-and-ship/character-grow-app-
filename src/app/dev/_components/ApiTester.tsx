"use client";

import { useState } from "react";

interface ApiTesterProps {
  /** 버튼 라벨 */
  label: string;
  /** 요청 메서드 */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** 호출 경로 (예: /api/users/init) */
  path: string;
  /** POST 등에서 보낼 기본 바디(JSON). 편집 가능한 텍스트로 노출. */
  defaultBody?: string;
}

/**
 * dev 테스트용: 버튼을 누르면 path 로 fetch 하고 응답을 화면에 표시한다.
 * 쿠키 세션은 브라우저가 자동 첨부하므로 🔒 API 도 로그인 상태면 통과한다.
 */
export default function ApiTester({
  label,
  method,
  path,
  defaultBody,
}: ApiTesterProps) {
  const [body, setBody] = useState(defaultBody ?? "");
  const [status, setStatus] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function call() {
    setLoading(true);
    setResult("");
    setStatus(null);
    try {
      const init: RequestInit = { method };
      if (method !== "GET" && body.trim()) {
        init.headers = { "Content-Type": "application/json" };
        init.body = body;
      }
      const res = await fetch(path, init);
      setStatus(res.status);
      const text = await res.text();
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResult(text);
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const statusColor =
    status === null
      ? "#888"
      : status < 300
        ? "#16a34a"
        : status < 500
          ? "#d97706"
          : "#dc2626";

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
      >
        <code
          style={{
            background: "#f3f3f3",
            padding: "2px 8px",
            borderRadius: 6,
            fontWeight: 700,
          }}
        >
          {method}
        </code>
        <code style={{ color: "#555" }}>{path}</code>
        <button
          onClick={call}
          disabled={loading}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "호출 중…" : label}
        </button>
      </div>

      {method !== "GET" && (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="요청 바디 (JSON)"
          rows={3}
          style={{
            width: "100%",
            marginTop: 10,
            fontFamily: "monospace",
            fontSize: 13,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ddd",
          }}
        />
      )}

      {status !== null && (
        <div style={{ marginTop: 10 }}>
          <strong style={{ color: statusColor }}>HTTP {status}</strong>
          <pre
            style={{
              background: "#1e1e1e",
              color: "#e6e6e6",
              padding: 12,
              borderRadius: 6,
              overflowX: "auto",
              fontSize: 13,
              marginTop: 6,
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
