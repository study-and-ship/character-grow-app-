begin;

-- =============================================================================
-- 정책 변경 요약
-- 1. 하트가 0이 되면 남은 문제 없이 세션을 조기 완료(ready_to_complete)한다.
-- 2. 보상 규칙을 프론트 기준으로 확정한다:
--      정답 +10 EXP / +20 코인, 오답 -5 EXP, 레벨업당 보너스 +100 코인.
--    세션 순 EXP는 음수가 될 수 있으므로 관련 check 제약을 완화한다.
-- 3. 알이 부화하면 장착 중이던 알 아이템을 전부 해제한다.
-- 4. 전체 사용자 랭킹 조회 RPC를 추가한다.
-- =============================================================================

-- 오답 감점으로 세션 순 EXP가 음수가 될 수 있다.
alter table public.quiz_sessions
  drop constraint quiz_sessions_earned_exp_nonnegative;

alter table public.character_growth_histories
  drop constraint character_growth_histories_exp_nonnegative;

comment on column public.quiz_sessions.earned_exp is
  'completed 시점에 확정하는 세션 순 EXP. 오답 감점으로 음수일 수 있다.';

-- =============================================================================
-- 답안 제출: 하트 0 도달 시 조기 완료
-- =============================================================================

create or replace function public.submit_quiz_answer(
  p_session_id bigint,
  p_session_question_id bigint,
  p_selected_choice_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.quiz_sessions;
  v_question_id bigint;
  v_existing_answer public.user_question_answers;
  v_is_correct boolean;
  v_answered_count integer;
  v_correct_count integer;
  v_correct_choice_id bigint;
  v_correct_choice_text text;
  v_explanation text;
  v_status public.quiz_session_status;
  v_hearts integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select qs.*
  into v_session
  from public.quiz_sessions qs
  where qs.id = p_session_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'QUIZ_SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> v_user_id then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  select qsq.question_id
  into v_question_id
  from public.quiz_session_questions qsq
  where qsq.id = p_session_question_id
    and qsq.quiz_session_id = p_session_id;

  if v_question_id is null then
    raise exception using errcode = 'P0001', message = 'QUESTION_NOT_IN_SESSION';
  end if;

  select answer.*
  into v_existing_answer
  from public.user_question_answers answer
  where answer.quiz_session_question_id = p_session_question_id;

  if found and v_existing_answer.selected_choice_id <> p_selected_choice_id then
    raise exception using errcode = 'P0001', message = 'ANSWER_ALREADY_SUBMITTED';
  end if;

  if not found then
    if v_session.status <> 'in_progress' then
      raise exception using
        errcode = 'P0001',
        message = 'QUIZ_SESSION_NOT_IN_PROGRESS';
    end if;

    select choice.is_correct
    into v_is_correct
    from public.question_choices choice
    where choice.id = p_selected_choice_id
      and choice.question_id = v_question_id;

    if v_is_correct is null then
      raise exception using errcode = 'P0001', message = 'INVALID_CHOICE';
    end if;

    insert into public.user_question_answers (
      quiz_session_question_id,
      selected_choice_id,
      is_correct
    )
    values (
      p_session_question_id,
      p_selected_choice_id,
      v_is_correct
    );

    if not v_is_correct then
      update public.quiz_sessions
      set hearts_remaining = greatest(hearts_remaining - 1, 0)
      where id = p_session_id;
    end if;
  else
    v_is_correct := v_existing_answer.is_correct;
  end if;

  select
    count(answer.id)::integer,
    count(answer.id) filter (where answer.is_correct)::integer
  into
    v_answered_count,
    v_correct_count
  from public.quiz_session_questions qsq
  left join public.user_question_answers answer
    on answer.quiz_session_question_id = qsq.id
  where qsq.quiz_session_id = p_session_id;

  select qs.hearts_remaining
  into v_hearts
  from public.quiz_sessions qs
  where qs.id = p_session_id;

  -- 모든 문제를 제출했거나 하트를 다 쓰면 결과 확인 단계로 넘어간다.
  if v_answered_count = v_session.total_question_count or v_hearts = 0 then
    update public.quiz_sessions
    set
      status = 'ready_to_complete',
      all_answered_at = coalesce(all_answered_at, now())
    where id = p_session_id
      and status = 'in_progress';
  end if;

  select
    choice.id,
    choice.choice_text
  into
    v_correct_choice_id,
    v_correct_choice_text
  from public.question_choices choice
  where choice.question_id = v_question_id
    and choice.is_correct
  order by choice.id
  limit 1;

  if v_correct_choice_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'QUESTION_HAS_NO_CORRECT_CHOICE';
  end if;

  select q.explanation
  into v_explanation
  from public.questions q
  where q.id = v_question_id;

  select qs.status
  into v_status
  from public.quiz_sessions qs
  where qs.id = p_session_id;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_choice_id', v_correct_choice_id,
    'correct_choice_text', v_correct_choice_text,
    'explanation', v_explanation,
    'hearts_remaining', v_hearts,
    'answered_count', v_answered_count,
    'correct_count', v_correct_count,
    'total_question_count', v_session.total_question_count,
    'status', v_status,
    'can_complete', v_status = 'ready_to_complete'
  );
end;
$$;

comment on function public.submit_quiz_answer(bigint, bigint, bigint) is
  '답안을 한 번 저장하고 채점·하트 감소를 처리한다. 전량 제출 또는 하트 0이면 조기 완료 대기 상태로 전환한다.';

-- =============================================================================
-- 퀴즈 완료와 보상 (프론트 규칙 정본)
--   순 EXP = 정답 * 10 - 오답 * 5 (캐릭터 exp는 0 미만으로 내리지 않는다)
--   코인 = 정답 * 20 + 레벨업 횟수 * 100
--   total_exp에는 획득분(정답 * 10)만 누적한다.
--   부화 시 장착 중이던 알 아이템을 전부 해제한다.
-- =============================================================================

create or replace function public.complete_quiz_session(p_session_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.quiz_sessions;
  v_character public.characters;
  v_history public.character_growth_histories;
  v_streak public.user_streaks;
  v_answered_count integer;
  v_correct_count integer;
  v_wrong_count integer;
  v_earned_exp integer;
  v_earned_coins integer;
  v_level_up_bonus integer := 0;
  v_before_level integer;
  v_after_level integer;
  v_before_stage public.character_growth_stage;
  v_after_stage public.character_growth_stage;
  v_level_exp integer;
  v_required_exp integer;
  v_total_exp integer;
  v_current_coins integer;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_new_streak integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select qs.*
  into v_session
  from public.quiz_sessions qs
  where qs.id = p_session_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'QUIZ_SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> v_user_id then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  if v_session.status = 'completed' then
    select history.*
    into strict v_history
    from public.character_growth_histories history
    where history.quiz_session_id = p_session_id;

    select streak.*
    into strict v_streak
    from public.user_streaks streak
    where streak.user_id = v_user_id;

    select p.coins
    into strict v_current_coins
    from public.profiles p
    where p.id = v_user_id;

    return jsonb_build_object(
      'session', jsonb_build_object(
        'id', v_session.id,
        'status', v_session.status,
        'total_question_count', v_session.total_question_count,
        'correct_count', v_session.correct_count,
        'completed_at', v_session.completed_at
      ),
      'rewards', jsonb_build_object(
        'exp', v_session.earned_exp,
        'coins', v_session.earned_coins,
        'level_up_bonus_coins',
          (v_history.after_level - v_history.before_level) * 100,
        'current_coins', v_current_coins
      ),
      'character_growth', jsonb_build_object(
        'character_id', v_history.character_id,
        'gained_exp', v_history.gained_exp,
        'before_level', v_history.before_level,
        'after_level', v_history.after_level,
        'before_stage', v_history.before_stage,
        'after_stage', v_history.after_stage,
        'hatched',
          v_history.before_stage = 'egg'
          and v_history.after_stage <> 'egg'
      ),
      'streak', jsonb_build_object(
        'current_streak', v_streak.current_streak,
        'longest_streak', v_streak.longest_streak,
        'last_completed_date', v_streak.last_completed_date
      )
    );
  end if;

  if v_session.status <> 'ready_to_complete' then
    raise exception using errcode = 'P0001', message = 'QUIZ_SESSION_NOT_READY';
  end if;

  -- 하트 0 조기 완료를 허용하므로 제출된 답안 기준으로만 집계한다.
  select
    count(answer.id)::integer,
    count(answer.id) filter (where answer.is_correct)::integer
  into
    v_answered_count,
    v_correct_count
  from public.quiz_session_questions qsq
  left join public.user_question_answers answer
    on answer.quiz_session_question_id = qsq.id
  where qsq.quiz_session_id = p_session_id;

  v_wrong_count := v_answered_count - v_correct_count;
  v_earned_exp := v_correct_count * 10 - v_wrong_count * 5;

  select c.*
  into v_character
  from public.characters c
  where c.user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'CHARACTER_NOT_FOUND';
  end if;

  v_before_level := v_character.level;
  v_before_stage := v_character.growth_stage;
  v_after_level := v_character.level;
  v_level_exp := greatest(v_character.exp + v_earned_exp, 0);
  v_total_exp := v_character.total_exp + v_correct_count * 10;

  loop
    v_required_exp := 20 + v_after_level * 30;
    exit when v_level_exp < v_required_exp;
    v_level_exp := v_level_exp - v_required_exp;
    v_after_level := v_after_level + 1;
  end loop;

  v_level_up_bonus := (v_after_level - v_before_level) * 100;
  v_earned_coins := v_correct_count * 20 + v_level_up_bonus;

  select stage.growth_stage
  into v_after_stage
  from public.character_type_stages stage
  where stage.character_type_id = v_character.character_type_id
    and stage.min_level <= v_after_level
  order by stage.min_level desc
  limit 1;

  v_after_stage := coalesce(v_after_stage, v_before_stage);

  update public.characters
  set
    level = v_after_level,
    exp = v_level_exp,
    total_exp = v_total_exp,
    growth_stage = v_after_stage,
    hatched_at = case
      when v_before_stage = 'egg' and v_after_stage <> 'egg'
        then coalesce(hatched_at, now())
      else hatched_at
    end
  where id = v_character.id;

  -- 부화하면 알 전용 장비(hat 슬롯 포함)를 전부 해제한다.
  if v_before_stage = 'egg' and v_after_stage <> 'egg' then
    delete from public.character_equipment equipment
    where equipment.character_id = v_character.id;
  end if;

  update public.profiles
  set coins = coins + v_earned_coins
  where id = v_user_id
  returning coins into v_current_coins;

  select streak.*
  into v_streak
  from public.user_streaks streak
  where streak.user_id = v_user_id
  for update;

  if not found then
    insert into public.user_streaks (
      user_id,
      current_streak,
      longest_streak,
      last_completed_date
    )
    values (
      v_user_id,
      1,
      1,
      v_today
    )
    returning * into v_streak;
  elsif v_streak.last_completed_date = v_today then
    null;
  else
    v_new_streak := case
      when v_streak.last_completed_date = v_today - 1
        then v_streak.current_streak + 1
      else 1
    end;

    update public.user_streaks
    set
      current_streak = v_new_streak,
      longest_streak = greatest(longest_streak, v_new_streak),
      last_completed_date = v_today
    where user_id = v_user_id
    returning * into v_streak;
  end if;

  insert into public.character_growth_histories (
    character_id,
    quiz_session_id,
    gained_exp,
    before_level,
    after_level,
    before_stage,
    after_stage
  )
  values (
    v_character.id,
    p_session_id,
    v_earned_exp,
    v_before_level,
    v_after_level,
    v_before_stage,
    v_after_stage
  )
  returning * into v_history;

  update public.quiz_sessions
  set
    status = 'completed',
    correct_count = v_correct_count,
    earned_exp = v_earned_exp,
    earned_coins = v_earned_coins,
    completed_at = now()
  where id = p_session_id
  returning * into v_session;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'status', v_session.status,
      'total_question_count', v_session.total_question_count,
      'correct_count', v_session.correct_count,
      'completed_at', v_session.completed_at
    ),
    'rewards', jsonb_build_object(
      'exp', v_earned_exp,
      'coins', v_earned_coins,
      'level_up_bonus_coins', v_level_up_bonus,
      'current_coins', v_current_coins
    ),
    'character_growth', jsonb_build_object(
      'character_id', v_character.id,
      'gained_exp', v_earned_exp,
      'before_level', v_before_level,
      'after_level', v_after_level,
      'before_stage', v_before_stage,
      'after_stage', v_after_stage,
      'hatched', v_before_stage = 'egg' and v_after_stage <> 'egg'
    ),
    'streak', jsonb_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'last_completed_date', v_streak.last_completed_date
    )
  );
end;
$$;

comment on function public.complete_quiz_session(bigint) is
  '퀴즈 결과를 한 번만 확정한다. 순 EXP(정답*10-오답*5), 코인(정답*20+레벨업*100), 부화 시 장비 해제와 streak를 처리한다.';

-- =============================================================================
-- 상점 구매: 컬럼 순서 의존 select 제거 (동작 동일)
-- =============================================================================

create or replace function public.purchase_shop_item(p_item_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_character public.characters;
  v_item_name text;
  v_item_price integer;
  v_item_asset_key text;
  v_item_target public.item_target_type;
  v_user_item public.user_items;
  v_expected_target public.item_target_type;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select p.*
  into v_profile
  from public.profiles p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'USER_NOT_INITIALIZED';
  end if;

  select c.*
  into v_character
  from public.characters c
  where c.user_id = v_user_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'USER_NOT_INITIALIZED';
  end if;

  select
    item.name,
    item.price,
    item.asset_key,
    category.target_type
  into
    v_item_name,
    v_item_price,
    v_item_asset_key,
    v_item_target
  from public.shop_items item
  join public.item_categories category
    on category.id = item.category_id
  where item.id = p_item_id
    and item.is_active;

  if not found then
    raise exception using errcode = 'P0001', message = 'ITEM_NOT_FOUND';
  end if;

  v_expected_target := case
    when v_character.growth_stage = 'egg' then 'egg'::public.item_target_type
    else 'pet'::public.item_target_type
  end;

  if v_item_target <> v_expected_target then
    raise exception using errcode = 'P0001', message = 'ITEM_TARGET_MISMATCH';
  end if;

  if exists (
    select 1
    from public.user_items owned
    where owned.user_id = v_user_id
      and owned.item_id = p_item_id
  ) then
    raise exception using errcode = 'P0001', message = 'ITEM_ALREADY_OWNED';
  end if;

  if v_profile.coins < v_item_price then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_COINS';
  end if;

  update public.profiles
  set coins = coins - v_item_price
  where id = v_user_id
  returning * into v_profile;

  insert into public.user_items (
    user_id,
    item_id
  )
  values (
    v_user_id,
    p_item_id
  )
  returning * into v_user_item;

  return jsonb_build_object(
    'user_item', jsonb_build_object(
      'id', v_user_item.id,
      'item_id', p_item_id,
      'name', v_item_name,
      'asset_key', v_item_asset_key,
      'purchased_at', v_user_item.purchased_at
    ),
    'spent_coins', v_item_price,
    'remaining_coins', v_profile.coins
  );
end;
$$;

-- =============================================================================
-- 아이템 장착: 컬럼 순서 의존 select 제거 (동작 동일)
-- =============================================================================

create or replace function public.equip_character_item(
  p_slot public.equipment_slot,
  p_user_item_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_character public.characters;
  v_user_item public.user_items;
  v_item_id bigint;
  v_item_name text;
  v_item_asset_key text;
  v_item_slot public.equipment_slot;
  v_item_target public.item_target_type;
  v_expected_target public.item_target_type;
  v_equipment public.character_equipment;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select c.*
  into v_character
  from public.characters c
  where c.user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'USER_NOT_INITIALIZED';
  end if;

  select owned.*
  into v_user_item
  from public.user_items owned
  where owned.id = p_user_item_id
    and owned.user_id = v_user_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'USER_ITEM_NOT_FOUND';
  end if;

  select
    item.id,
    item.name,
    item.asset_key,
    category.slot,
    category.target_type
  into strict
    v_item_id,
    v_item_name,
    v_item_asset_key,
    v_item_slot,
    v_item_target
  from public.shop_items item
  join public.item_categories category
    on category.id = item.category_id
  where item.id = v_user_item.item_id;

  if v_item_slot <> p_slot then
    raise exception using
      errcode = 'P0001',
      message = 'EQUIPMENT_SLOT_MISMATCH';
  end if;

  v_expected_target := case
    when v_character.growth_stage = 'egg' then 'egg'::public.item_target_type
    else 'pet'::public.item_target_type
  end;

  if v_item_target <> v_expected_target then
    raise exception using errcode = 'P0001', message = 'ITEM_TARGET_MISMATCH';
  end if;

  insert into public.character_equipment (
    character_id,
    slot,
    user_item_id,
    equipped_at
  )
  values (
    v_character.id,
    p_slot,
    p_user_item_id,
    now()
  )
  on conflict (character_id, slot) do update
  set
    user_item_id = excluded.user_item_id,
    equipped_at = excluded.equipped_at
  returning * into v_equipment;

  return jsonb_build_object(
    'slot', v_equipment.slot,
    'equipment', jsonb_build_object(
      'user_item_id', v_user_item.id,
      'item_id', v_item_id,
      'name', v_item_name,
      'asset_key', v_item_asset_key,
      'equipped_at', v_equipment.equipped_at
    )
  );
end;
$$;

-- =============================================================================
-- 랭킹 조회
-- 기준: 완료 세션의 누적 정답 수 내림차순, 동률이면 레벨 내림차순.
-- RLS가 타인 프로필 조회를 막으므로 공개 가능한 필드만 골라 반환한다.
-- =============================================================================

create or replace function public.get_rankings(p_limit integer default 5)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 5), 1), 50);
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  with ranked as (
    select
      entry.user_id,
      entry.nickname,
      entry.sprite_key,
      entry.level,
      entry.growth_stage,
      entry.correct_total,
      entry.current_streak,
      rank() over (
        order by entry.correct_total desc, entry.level desc, entry.user_id
      )::integer as rank
    from (
      select
        p.id as user_id,
        p.nickname,
        ct.sprite_key,
        c.level,
        c.growth_stage,
        coalesce(totals.correct_total, 0) as correct_total,
        coalesce(s.current_streak, 0) as current_streak
      from public.profiles p
      join public.characters c on c.user_id = p.id
      join public.character_types ct on ct.id = c.character_type_id
      left join public.user_streaks s on s.user_id = p.id
      left join (
        select qs.user_id, sum(qs.correct_count)::integer as correct_total
        from public.quiz_sessions qs
        where qs.status = 'completed'
        group by qs.user_id
      ) totals on totals.user_id = p.id
    ) entry
  )
  select jsonb_build_object(
    'top', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'rank', top_row.rank,
            'nickname', top_row.nickname,
            'sprite_key', top_row.sprite_key,
            'level', top_row.level,
            'growth_stage', top_row.growth_stage,
            'correct_total', top_row.correct_total,
            'current_streak', top_row.current_streak,
            'is_me', top_row.user_id = v_user_id
          )
          order by top_row.rank, top_row.user_id
        )
        from (
          select *
          from ranked
          order by rank, user_id
          limit v_limit
        ) top_row
      ),
      '[]'::jsonb
    ),
    'me', (
      select jsonb_build_object(
        'rank', me_row.rank,
        'nickname', me_row.nickname,
        'sprite_key', me_row.sprite_key,
        'level', me_row.level,
        'growth_stage', me_row.growth_stage,
        'correct_total', me_row.correct_total,
        'current_streak', me_row.current_streak,
        'is_me', true
      )
      from ranked me_row
      where me_row.user_id = v_user_id
    )
  )
  into v_result;

  return v_result;
end;
$$;

comment on function public.get_rankings(integer) is
  '누적 정답 수(동률 시 레벨) 기준 상위 랭킹과 요청 사용자 순위를 반환한다. 초기화 전 사용자는 me가 null이다.';

revoke all on function public.get_rankings(integer) from public, anon;
grant execute on function public.get_rankings(integer) to authenticated;

commit;
