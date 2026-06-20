import { requireUser, type RouteSupabase } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/response";

/**
 * POST /api/users/init  🔒
 *
 * 로그인 사용자의 서비스 기본 데이터를 생성하거나 기존 데이터를 반환한다.
 * 여러 번 호출해도 중복이 생기지 않도록 idempotent 하게 동작한다(명세서 3.1).
 *
 * 1. 로그인 사용자 확인
 * 2. profiles 없으면 생성 (+ nickname 반영)
 * 3. characters 없으면 active character_types 중 랜덤 배정해 생성
 * 4. user_streaks 없으면 생성
 * 5. 기존 데이터가 있으면 그대로 반환
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  // ---- 요청 바디 (nickname 선택) ----
  let nickname: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.nickname === "string" && body.nickname.trim()) {
      nickname = body.nickname.trim();
    }
  } catch {
    // 바디 없음/파싱 실패 → nickname 미지정으로 진행
  }

  // ---- 신규 여부 판정용: 기존 캐릭터 존재 확인 ----
  const { data: existingChar, error: charReadErr } = await supabase
    .from("characters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (charReadErr) {
    return fail("INTERNAL", charReadErr.message);
  }
  const isNewUser = !existingChar;

  // ---- 2. profiles upsert ----
  const profilePatch: { id: string; nickname?: string } = { id: user.id };
  if (nickname) profilePatch.nickname = nickname;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .upsert(profilePatch, { onConflict: "id" })
    .select("id, nickname")
    .single();
  if (profileErr) {
    return fail("INTERNAL", profileErr.message);
  }

  // ---- 3. characters 없으면 랜덤 캐릭터 배정해 생성 ----
  let character = existingChar
    ? await loadCharacter(supabase, existingChar.id)
    : null;

  if (!character) {
    const { data: types, error: typesErr } = await supabase
      .from("character_types")
      .select("id, name")
      .eq("is_active", true);
    if (typesErr) {
      return fail("INTERNAL", typesErr.message);
    }
    if (!types || types.length === 0) {
      return fail(
        "NO_ACTIVE_CHARACTER_TYPE",
        "활성화된 캐릭터 타입이 없습니다.",
        409
      );
    }

    const picked = types[Math.floor(Math.random() * types.length)];

    const { data: created, error: createErr } = await supabase
      .from("characters")
      .insert({
        user_id: user.id,
        character_type_id: picked.id,
        // level/exp/total_exp/growth_stage 는 DB 기본값(1/0/0/egg) 사용
      })
      .select(
        "id, character_type_id, level, exp, total_exp, growth_stage"
      )
      .single();
    if (createErr) {
      return fail("INTERNAL", createErr.message);
    }
    character = { ...created, character_type_name: picked.name };
  }

  // ---- 4. user_streaks 없으면 생성 ----
  const { data: streak, error: streakErr } = await supabase
    .from("user_streaks")
    .upsert({ user_id: user.id }, { onConflict: "user_id" })
    .select("current_streak, longest_streak, last_answered_date")
    .single();
  if (streakErr) {
    return fail("INTERNAL", streakErr.message);
  }

  return ok(
    {
      profile: { id: profile.id, nickname: profile.nickname },
      character,
      streak,
      is_new_user: isNewUser,
    },
    isNewUser ? 201 : 200
  );
}

/** 기존 캐릭터를 종류 이름과 함께 로드. */
async function loadCharacter(supabase: RouteSupabase, characterId: number) {
  const { data } = await supabase
    .from("characters")
    .select(
      "id, character_type_id, level, exp, total_exp, growth_stage, character_types(name)"
    )
    .eq("id", characterId)
    .single();
  if (!data) return null;
  const { character_types, ...rest } = data;
  return {
    ...rest,
    character_type_name: character_types?.name ?? null,
  };
}
