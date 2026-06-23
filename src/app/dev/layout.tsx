import Link from "next/link";
// import { notFound } from "next/navigation";

/**
 * dev 테스트 도구 공통 레이아웃.
 *
 * ⚠️ 운영 배포 시 노출을 막으려면 아래 가드를 활성화한다(현재는 동작 우선이라 비활성):
 *   if (process.env.NODE_ENV !== "development") notFound();
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/dev", label: "허브" },
    { href: "/dev/auth", label: "인증" },
    { href: "/dev/health", label: "헬스체크" },
    { href: "/dev/users-init", label: "users/init" },
  ];

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px 64px",
        fontFamily: "system-ui, sans-serif",
        color: "#222",
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>🛠️ Dev API 테스트</h1>
        <nav style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 14,
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <hr style={{ marginTop: 14, border: "none", borderTop: "1px solid #eee" }} />
      </header>
      {children}
    </div>
  );
}
