import Link from "next/link";

/** dev 테스트 허브: 테스트 페이지 목록. */
export default function DevHubPage() {
  const items = [
    {
      href: "/dev/auth",
      title: "인증 (로그인/세션)",
      desc: "테스트 계정 로그인 → 쿠키 세션 저장. 🔒 API 테스트의 전제.",
    },
    {
      href: "/dev/health",
      title: "GET /api/health",
      desc: "Supabase 연결 상태 점검. 인증 불필요.",
    },
    {
      href: "/dev/users-init",
      title: "POST /api/users/init 🔒",
      desc: "프로필/캐릭터/streak 생성(idempotent). 로그인 필요.",
    },
  ];

  return (
    <div>
      <p style={{ color: "#666", marginTop: 0 }}>
        API를 브라우저에서 바로 호출해 응답을 확인하는 개발용 도구입니다.
        <br />
        🔒 API는 먼저 <strong>인증</strong> 페이지에서 로그인하세요.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            style={{
              display: "block",
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 10,
              textDecoration: "none",
              color: "#222",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>{it.title}</div>
            <div style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
              {it.desc}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
