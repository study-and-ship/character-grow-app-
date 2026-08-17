import { requireUser } from "@/lib/api/auth";
import {
  queryErrorResponse,
  userNotInitializedResponse,
} from "@/lib/api/errors";
import {
  emptyEquipment,
  requiredExpForLevel,
  todayInSeoul,
} from "@/lib/api/game";
import { internalError, ok } from "@/lib/api/response";
import type { HomeData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const today = todayInSeoul();
  const [profileResult, characterResult, streakResult, sessionResult] =
    await Promise.all([
      auth.supabase
        .from("profiles")
        .select("nickname, coins")
        .eq("id", auth.user.id)
        .maybeSingle(),
      auth.supabase
        .from("characters")
        .select(
          "id, level, exp, total_exp, growth_stage, character_types(id, name, sprite_key)"
        )
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      auth.supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_completed_date")
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      auth.supabase
        .from("quiz_sessions")
        .select(
          "id, status, total_question_count, hearts_remaining"
        )
        .eq("user_id", auth.user.id)
        .eq("session_date", today)
        .maybeSingle(),
    ]);

  for (const [context, result] of [
    ["get home profile", profileResult],
    ["get home character", characterResult],
    ["get home streak", streakResult],
    ["get home session", sessionResult],
  ] as const) {
    if (result.error) return queryErrorResponse(result.error, context);
  }

  const profile = profileResult.data;
  const character = characterResult.data;
  const streak = streakResult.data;
  if (!profile || !character || !streak || !character.character_types) {
    return userNotInitializedResponse();
  }

  const equipmentResult = await auth.supabase
    .from("character_equipment")
    .select("slot, user_item_id, user_items(item_id, shop_items(asset_key))")
    .eq("character_id", character.id);
  if (equipmentResult.error) {
    return queryErrorResponse(equipmentResult.error, "get home equipment");
  }

  const equipment = emptyEquipment<{
    user_item_id: number;
    asset_key: string;
  }>();
  for (const row of equipmentResult.data) {
    const assetKey = row.user_items?.shop_items?.asset_key;
    if (!assetKey) {
      return internalError("get home equipment: invalid relation", row);
    }
    equipment[row.slot] = {
      user_item_id: row.user_item_id,
      asset_key: assetKey,
    };
  }

  let todayQuiz: HomeData["today_quiz"] = null;
  const session = sessionResult.data;
  if (session) {
    // 하트 소진 조기 완료 세션은 completed여도 answered < total일 수 있어
    // 상태와 무관하게 실제 제출 수를 센다.
    const questionsResult = await auth.supabase
      .from("quiz_session_questions")
      .select("id, user_question_answers(id)")
      .eq("quiz_session_id", session.id);
    if (questionsResult.error) {
      return queryErrorResponse(
        questionsResult.error,
        "get home quiz progress"
      );
    }
    const answeredCount = questionsResult.data.filter(
      (question) => question.user_question_answers !== null
    ).length;

    todayQuiz = {
      session_id: session.id,
      status: session.status,
      answered_count: answeredCount,
      total_question_count: session.total_question_count,
      hearts_remaining: session.hearts_remaining,
    };
  }

  const data: HomeData = {
    profile,
    character: {
      id: character.id,
      character_type: character.character_types,
      level: character.level,
      exp: character.exp,
      required_exp: requiredExpForLevel(character.level),
      total_exp: character.total_exp,
      growth_stage: character.growth_stage,
      equipment,
    },
    streak,
    today_quiz: todayQuiz,
  };

  return ok(data);
}
