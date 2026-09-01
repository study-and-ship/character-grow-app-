import Link from "next/link";

export const metadata = { title: "개인정보 처리방침 | QuizPet" };

export default function PrivacyPage() {
  return (
    <main>
      <h1>QuizPet 개인정보 처리방침</h1>
      <p>QuizPet은 학습 서비스 제공을 위해 필요한 최소한의 개인정보를 처리합니다.</p>
      <h2>수집하는 데이터</h2>
      <p>계정 이메일, 사용자가 정한 닉네임, 퀴즈 답안·정답 수·학습 일자 등의 학습 기록을 수집합니다.</p>
      <h2>처리 목적과 보관</h2>
      <p>로그인, 학습 진행 저장, 캐릭터 성장, 랭킹 제공과 서비스 보안 목적으로 사용합니다. 계정이 유지되는 동안 또는 법적 의무가 있는 기간 동안 보관합니다.</p>
      <h2>처리 위탁</h2>
      <p>인증과 데이터 저장을 위해 Supabase를 사용하며, 서비스 호스팅을 위해 Vercel을 사용할 수 있습니다.</p>
      <h2>삭제 및 문의</h2>
      <p>계정 및 데이터 삭제 요청은 서비스 운영자에게 문의해주세요. 운영 연락처는 출시 전 이 페이지에 게시됩니다.</p>
      <p><strong>이 문서는 출시 준비용 초안이며 실제 서비스 운영 전에 법률 및 운영 정책 검토가 필요합니다.</strong></p>
      <Link href="/login">로그인으로 돌아가기</Link>
    </main>
  );
}
