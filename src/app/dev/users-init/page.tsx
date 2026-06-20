import ApiTester from "../_components/ApiTester";

export default function DevUsersInitPage() {
  return (
    <div>
      <h2>POST /api/users/init 🔒</h2>
      <p style={{ color: "#666" }}>
        로그인 사용자의 프로필/캐릭터/streak를 생성하거나 반환합니다(idempotent).
        <br />
        먼저 <strong>인증</strong> 페이지에서 로그인하세요. 미로그인 시 401이
        반환됩니다.
      </p>
      <ApiTester
        label="호출"
        method="POST"
        path="/api/users/init"
        defaultBody={'{\n  "nickname": "펫집사"\n}'}
      />
    </div>
  );
}
