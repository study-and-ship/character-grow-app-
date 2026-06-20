import ApiTester from "../_components/ApiTester";

export default function DevHealthPage() {
  return (
    <div>
      <h2>GET /api/health</h2>
      <p style={{ color: "#666" }}>Supabase 연결 상태 점검. 인증이 필요 없습니다.</p>
      <ApiTester label="호출" method="GET" path="/api/health" />
    </div>
  );
}
