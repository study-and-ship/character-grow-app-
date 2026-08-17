import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { queryErrorResponse, rpcErrorResponse } from "@/lib/api/errors";
import {
  parseRpcResult,
  quizSessionResultSchema,
} from "@/lib/api/rpc-schemas";
import { internalError, ok } from "@/lib/api/response";
import {
  dateSchema,
  parseValue,
  searchParamsToObject,
} from "@/lib/api/validation";
import type { StudyRecordData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const rawQuery = searchParamsToObject(request.nextUrl.searchParams);
  const date = parseValue(
    rawQuery.date,
    dateSchema,
    "날짜 형식이 올바르지 않습니다."
  );
  if (!date.ok) return date.response;

  const { data: session, error: sessionError } = await auth.supabase
    .from("quiz_sessions")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("session_date", date.data)
    .eq("status", "completed")
    .maybeSingle();
  if (sessionError) {
    return queryErrorResponse(sessionError, "get study record session");
  }

  if (!session) {
    const empty: StudyRecordData = { date: date.data, session: null };
    return ok(empty);
  }

  const { data: rpcData, error: rpcError } = await auth.supabase.rpc(
    "get_quiz_session",
    { p_session_id: session.id }
  );
  if (rpcError) return rpcErrorResponse(rpcError, "get study record details");

  const parsed = parseRpcResult(
    quizSessionResultSchema,
    rpcData,
    "get study record details"
  );
  if (!parsed.ok) return parsed.response;

  const questions: NonNullable<
    StudyRecordData["session"]
  >["questions"] = [];
  for (const question of parsed.data.questions) {
    const answer = question.answer;
    // 하트 소진 조기 완료 세션은 미제출 문제가 남는다. 기록에는 제출한 답만 담는다.
    if (!answer) continue;
    const selectedChoice = question.choices.find(
      (choice) => choice.id === answer.selected_choice_id
    );
    if (!selectedChoice) {
      return internalError(
        "get study record details: selected choice missing",
        question
      );
    }
    questions.push({
      sort_order: question.sort_order,
      question_text: question.question_text,
      selected_choice: {
        id: selectedChoice.id,
        choice_text: selectedChoice.choice_text,
      },
      correct_choice: {
        id: answer.correct_choice_id,
        choice_text: answer.correct_choice_text,
      },
      is_correct: answer.is_correct,
      explanation: answer.explanation,
    });
  }

  if (parsed.data.status !== "completed" || !parsed.data.completed_at) {
    return internalError(
      "get study record details: session is not completed",
      parsed.data
    );
  }

  const result: StudyRecordData = {
    date: date.data,
    session: {
      id: parsed.data.id,
      status: "completed",
      category: parsed.data.category,
      correct_count: parsed.data.correct_count,
      total_question_count: parsed.data.total_question_count,
      earned_exp: parsed.data.earned_exp,
      earned_coins: parsed.data.earned_coins,
      completed_at: parsed.data.completed_at,
      questions,
    },
  };

  return ok(result);
}
