import type { ApiResponse, CompleteQuizData, QuizSessionData, SubmitAnswerData } from "@/types/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || "error" in body) throw new Error("error" in body ? body.error.message : "요청에 실패했습니다.");
  return body.data;
}

export const quizService = {
  start(categoryId: number) {
    return request<QuizSessionData>("/api/quiz-sessions/today", { method: "POST", body: JSON.stringify({ category_id: categoryId }) });
  },
  answer(sessionId: number, sessionQuestionId: number, choiceId: number) {
    return request<SubmitAnswerData>(`/api/quiz-sessions/${sessionId}/answers`, { method: "POST", body: JSON.stringify({ quiz_session_question_id: sessionQuestionId, selected_choice_id: choiceId }) });
  },
  complete(sessionId: number) {
    return request<CompleteQuizData>(`/api/quiz-sessions/${sessionId}/complete`, { method: "POST" });
  },
};
