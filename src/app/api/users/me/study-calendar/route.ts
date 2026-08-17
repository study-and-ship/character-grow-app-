import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { queryErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import {
  monthRange,
  parseValue,
  searchParamsToObject,
  yearMonthSchema,
} from "@/lib/api/validation";
import type { StudyCalendarData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const query = parseValue(
    searchParamsToObject(request.nextUrl.searchParams),
    yearMonthSchema,
    "연도와 월이 올바르지 않습니다."
  );
  if (!query.ok) return query.response;

  const range = monthRange(query.data.year, query.data.month);
  const { data: sessions, error } = await auth.supabase
    .from("quiz_sessions")
    .select("session_date, correct_count, total_question_count")
    .eq("user_id", auth.user.id)
    .eq("status", "completed")
    .gte("session_date", range.start)
    .lt("session_date", range.endExclusive)
    .order("session_date");
  if (error) return queryErrorResponse(error, "get study calendar");

  const data: StudyCalendarData = {
    year: query.data.year,
    month: query.data.month,
    days: sessions.map((session) => ({
      date: session.session_date,
      completed: true,
      correct_count: session.correct_count,
      total_question_count: session.total_question_count,
    })),
  };

  return ok(data);
}
