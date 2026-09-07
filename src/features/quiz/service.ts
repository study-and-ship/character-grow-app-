import type { CompleteQuizData, QuizSessionData, SubmitAnswerData } from "@/types/api";
import { apiRequest } from "@/lib/api/client";

export const quizService = {
  start(categoryId: number) {
    return apiRequest<QuizSessionData>("/api/quiz-sessions/today", { method: "POST", body: JSON.stringify({ category_id: categoryId }) });
  },
  get(sessionId: number) { return apiRequest<QuizSessionData>(`/api/quiz-sessions/${sessionId}`); },
  answer(sessionId: number, sessionQuestionId: number, choiceId: number) {
    return apiRequest<SubmitAnswerData>(`/api/quiz-sessions/${sessionId}/answers`, { method: "POST", body: JSON.stringify({ quiz_session_question_id: sessionQuestionId, selected_choice_id: choiceId }) });
  },
  complete(sessionId: number) {
    return apiRequest<CompleteQuizData>(`/api/quiz-sessions/${sessionId}/complete`, { method: "POST" });
  },
};
