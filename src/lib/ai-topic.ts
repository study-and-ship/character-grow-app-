/**
 * 커스텀 주제로 AI 퀴즈 생성을 요청하는 프론트엔드 시임(seam).
 *
 * TODO(backend): `POST /api/quiz-sessions/custom` 로 교체.
 *   1. 입력 정규화(trim·소문자)·모더레이션
 *   2. 정규화된 주제로 캐시 조회 → 히트면 기존 문제 재사용 (비용·지연 절감)
 *   3. 미스면 LLM 구조화 출력으로 N문항 생성(보기 4개·정답 1개·안전성 검증)
 *   4. questions / question_choices 에 source='ai' 로 저장
 *   5. 저장한 문제로 세션 생성 → post-today 와 동일한 세션 응답 반환
 *   6. 지연이 커지면 { status:'generating', jobId } 로 바꿔 폴링/Realtime 전환
 *      (프론트는 이미 로딩 상태를 그리므로 화면 변경 불필요)
 *
 * 지금은 목업이라 잠시 대기 후 하드코딩 문제로 세션을 시작한다.
 */
export function requestCustomQuiz(topic: string): Promise<void> {
  const ms = Math.min(1600, 700 + topic.length * 40);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
