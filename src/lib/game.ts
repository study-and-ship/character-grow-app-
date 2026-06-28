import type { AttemptRecord, Question, YMD } from "@/types/game";
import { QUESTIONS, TOPICS, START_STREAK } from "@/lib/data";

/** "YYYY-M-D" 형태의 날짜 키 */
export const dateKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

/** Date → 날짜 키 */
export const keyOf = (date: Date) =>
  dateKey(date.getFullYear(), date.getMonth(), date.getDate());

/** YMD → 날짜 키 */
export const ymdKey = ({ y, m, d }: YMD) => dateKey(y, m, d);

export const todayYMD = (): YMD => {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};

/** 정답률(%) 계산 */
export const accuracy = (correct: number, total: number) =>
  total ? Math.round((correct / total) * 100) : 0;

/** 하루 이동 (미래 방지) */
export function shiftDay({ y, m, d }: YMD, delta: number): YMD {
  const dt = new Date(y, m, d);
  dt.setDate(dt.getDate() + delta);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dt > today) return { y, m, d };
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}

/** 한 문제 풀이 결과를 기록 형태로 변환 */
export function buildAttempt(
  topic: string,
  q: Question,
  selected: number | null,
): AttemptRecord {
  const correct = selected === q.a;
  return {
    topic,
    q: q.q,
    correct,
    picked: selected != null ? q.o[selected] : "—",
    answer: q.o[q.a],
  };
}

/** 최근 연속 학습일 + 과거 가데이터 기록 생성 */
export function seedStudyData(streak = START_STREAK) {
  const studyDays: Record<string, boolean> = {};
  const records: Record<string, AttemptRecord[]> = {};
  const topicKeys = TOPICS.map((t) => t.k);
  const today = new Date();

  for (let i = 0; i < streak; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = keyOf(day);
    studyDays[key] = true;

    if (i === 0) continue; // 오늘은 실제 풀이로 채워짐
    const topic = topicKeys[i % topicKeys.length];
    const count = 3 + (i % 3);
    records[key] = Array.from({ length: count }, (_, j) => {
      const q = QUESTIONS[(i + j) % QUESTIONS.length];
      const correct = (i * 3 + j) % 4 !== 0;
      return {
        topic,
        q: q.q,
        correct,
        picked: correct ? q.o[q.a] : q.o[(q.a + 1) % q.o.length],
        answer: q.o[q.a],
      };
    });
  }
  return { studyDays, records };
}
