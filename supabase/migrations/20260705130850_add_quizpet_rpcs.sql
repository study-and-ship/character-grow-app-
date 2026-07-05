begin;

-- =============================================================================
-- 공통: 로그인 사용자 서비스 초기화
-- =============================================================================

create or replace function public.initialize_user(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := btrim(p_nickname);
  v_character_type_id bigint;
  v_profile public.profiles;
  v_character public.characters;
  v_streak public.user_streaks;
  v_is_new boolean := false;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  if v_nickname is null or length(v_nickname) < 1 or length(v_nickname) > 20 then
    raise exception using errcode = 'P0001', message = 'INVALID_NICKNAME';
  end if;

  select p.*
  into v_profile
  from public.profiles p
  where p.id = v_user_id;

  if not found then
    insert into public.profiles (id, nickname)
    values (v_user_id, v_nickname)
    returning * into v_profile;
    v_is_new := true;
  else
    update public.profiles
    set nickname = v_nickname
    where id = v_user_id
    returning * into v_profile;
  end if;

  insert into public.user_streaks (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select s.*
  into strict v_streak
  from public.user_streaks s
  where s.user_id = v_user_id;

  select c.*
  into v_character
  from public.characters c
  where c.user_id = v_user_id;

  if not found then
    select ct.id
    into v_character_type_id
    from public.character_types ct
    where ct.is_active
    order by random()
    limit 1;

    if v_character_type_id is null then
      raise exception using
        errcode = 'P0001',
        message = 'NO_ACTIVE_CHARACTER_TYPE';
    end if;

    insert into public.characters (
      user_id,
      character_type_id
    )
    values (
      v_user_id,
      v_character_type_id
    )
    returning * into v_character;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'nickname', v_profile.nickname,
      'coins', v_profile.coins
    ),
    'character', jsonb_build_object(
      'id', v_character.id,
      'character_type_id', v_character.character_type_id,
      'level', v_character.level,
      'exp', v_character.exp,
      'total_exp', v_character.total_exp,
      'growth_stage', v_character.growth_stage,
      'hatched_at', v_character.hatched_at
    ),
    'streak', jsonb_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'last_completed_date', v_streak.last_completed_date
    ),
    'is_new_user', v_is_new
  );
end;
$$;

comment on function public.initialize_user(text) is
  '로그인 사용자의 프로필, streak, 최초 랜덤 캐릭터를 멱등하게 초기화한다.';

-- =============================================================================
-- 퀴즈 세션 안전 조회
-- 정답 컬럼은 미응답 문제에 노출하지 않는다.
-- =============================================================================

create or replace function public.get_quiz_session(p_session_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.quiz_sessions;
  v_category public.question_categories;
  v_answered_count integer;
  v_live_correct_count integer;
  v_questions jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select qs.*
  into v_session
  from public.quiz_sessions qs
  where qs.id = p_session_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'QUIZ_SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> v_user_id then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  select qc.*
  into strict v_category
  from public.question_categories qc
  where qc.id = v_session.category_id;

  select
    count(a.id)::integer,
    count(a.id) filter (where a.is_correct)::integer
  into
    v_answered_count,
    v_live_correct_count
  from public.quiz_session_questions qsq
  left join public.user_question_answers a
    on a.quiz_session_question_id = qsq.id
  where qsq.quiz_session_id = v_session.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'session_question_id', qsq.id,
        'sort_order', qsq.sort_order,
        'question_id', q.id,
        'title', q.title,
        'question_text', q.question_text,
        'difficulty', q.difficulty,
        'choices', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'id', choice.id,
                'choice_text', choice.choice_text,
                'sort_order', choice.sort_order
              )
              order by choice.sort_order
            ),
            '[]'::jsonb
          )
          from public.question_choices choice
          where choice.question_id = q.id
        ),
        'answer', case
          when answer.id is null then null
          else jsonb_build_object(
            'selected_choice_id', answer.selected_choice_id,
            'is_correct', answer.is_correct,
            'correct_choice_id', (
              select correct_choice.id
              from public.question_choices correct_choice
              where correct_choice.question_id = q.id
                and correct_choice.is_correct
              order by correct_choice.id
              limit 1
            ),
            'correct_choice_text', (
              select correct_choice.choice_text
              from public.question_choices correct_choice
              where correct_choice.question_id = q.id
                and correct_choice.is_correct
              order by correct_choice.id
              limit 1
            ),
            'explanation', q.explanation,
            'answered_at', answer.answered_at
          )
        end
      )
      order by qsq.sort_order
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.quiz_session_questions qsq
  join public.questions q
    on q.id = qsq.question_id
  left join public.user_question_answers answer
    on answer.quiz_session_question_id = qsq.id
  where qsq.quiz_session_id = v_session.id;

  return jsonb_build_object(
    'id', v_session.id,
    'session_date', v_session.session_date,
    'status', v_session.status,
    'category', jsonb_build_object(
      'id', v_category.id,
      'code', v_category.code,
      'name', v_category.name
    ),
    'max_hearts', v_session.max_hearts,
    'hearts_remaining', v_session.hearts_remaining,
    'total_question_count', v_session.total_question_count,
    'answered_count', v_answered_count,
    'correct_count', case
      when v_session.status = 'completed' then v_session.correct_count
      else v_live_correct_count
    end,
    'earned_exp', case
      when v_session.status = 'completed' then v_session.earned_exp
      else 0
    end,
    'earned_coins', case
      when v_session.status = 'completed' then v_session.earned_coins
      else 0
    end,
    'questions', v_questions,
    'started_at', v_session.started_at,
    'all_answered_at', v_session.all_answered_at,
    'completed_at', v_session.completed_at
  );
end;
$$;

comment on function public.get_quiz_session(bigint) is
  '본인 퀴즈 세션의 문제, 안전한 보기, 답안, 하트와 진행 상태를 반환한다.';

-- =============================================================================
-- 오늘의 퀴즈 생성 또는 기존 세션 반환
-- =============================================================================

create or replace function public.start_today_quiz(p_category_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_session_id bigint;
  v_question_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.characters c on c.user_id = p.id
    where p.id = v_user_id
  ) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_INITIALIZED';
  end if;

  -- 같은 사용자의 같은 날짜 시작 요청을 직렬화한다.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || v_today::text, 0)
  );

  select qs.id
  into v_session_id
  from public.quiz_sessions qs
  where qs.user_id = v_user_id
    and qs.session_date = v_today;

  if v_session_id is not null then
    return public.get_quiz_session(v_session_id);
  end if;

  if not exists (
    select 1
    from public.question_categories qc
    where qc.id = p_category_id
      and qc.is_active
  ) then
    raise exception using errcode = 'P0001', message = 'CATEGORY_NOT_FOUND';
  end if;

  select count(*)::integer
  into v_question_count
  from public.questions q
  where q.category_id = p_category_id
    and q.status = 'published';

  if v_question_count < 5 then
    raise exception using errcode = 'P0001', message = 'NOT_ENOUGH_QUESTIONS';
  end if;

  insert into public.quiz_sessions (
    user_id,
    category_id,
    session_date,
    total_question_count
  )
  values (
    v_user_id,
    p_category_id,
    v_today,
    5
  )
  returning id into v_session_id;

  with candidates as (
    select
      q.id,
      random() as random_order
    from public.questions q
    where q.category_id = p_category_id
      and q.status = 'published'
    order by random_order
    limit 5
  ),
  ordered as (
    select
      id,
      row_number() over (order by random_order)::integer as sort_order
    from candidates
  )
  insert into public.quiz_session_questions (
    quiz_session_id,
    question_id,
    sort_order
  )
  select
    v_session_id,
    ordered.id,
    ordered.sort_order
  from ordered;

  return public.get_quiz_session(v_session_id);
end;
$$;

comment on function public.start_today_quiz(bigint) is
  '선택 카테고리의 오늘 5문항 세션을 만들거나 이미 존재하는 오늘 세션을 반환한다.';

-- =============================================================================
-- 답안 제출과 하트 반영
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

  if v_answered_count = v_session.total_question_count then
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

  select
    qs.status,
    qs.hearts_remaining
  into
    v_status,
    v_hearts
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
  '세션 문제 답안을 한 번 저장하고 서버 채점과 오답 하트 감소를 원자적으로 처리한다.';

-- =============================================================================
-- 퀴즈 완료와 보상
-- 정답당 EXP 10, 코인 20
-- 다음 레벨 필요 EXP = 20 + 현재 레벨 * 30
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
  v_earned_exp integer;
  v_earned_coins integer;
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

  if v_answered_count <> v_session.total_question_count then
    raise exception using errcode = 'P0001', message = 'QUIZ_SESSION_NOT_READY';
  end if;

  v_earned_exp := v_correct_count * 10;
  v_earned_coins := v_correct_count * 20;

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
  v_level_exp := v_character.exp + v_earned_exp;
  v_total_exp := v_character.total_exp + v_earned_exp;

  loop
    v_required_exp := 20 + v_after_level * 30;
    exit when v_level_exp < v_required_exp;
    v_level_exp := v_level_exp - v_required_exp;
    v_after_level := v_after_level + 1;
  end loop;

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
  '결과 보기에서 퀴즈 결과, 경험치, 코인, 캐릭터 성장과 streak를 한 번만 확정한다.';

-- =============================================================================
-- 상점 구매
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
  v_item public.shop_items;
  v_category public.item_categories;
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
    item.*,
    category.id,
    category.code,
    category.name,
    category.slot,
    category.target_type,
    category.created_at,
    category.updated_at
  into
    v_item.id,
    v_item.category_id,
    v_item.name,
    v_item.price,
    v_item.asset_key,
    v_item.is_active,
    v_item.created_at,
    v_item.updated_at,
    v_category.id,
    v_category.code,
    v_category.name,
    v_category.slot,
    v_category.target_type,
    v_category.created_at,
    v_category.updated_at
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

  if v_category.target_type <> v_expected_target then
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

  if v_profile.coins < v_item.price then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_COINS';
  end if;

  update public.profiles
  set coins = coins - v_item.price
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
      'item_id', v_item.id,
      'name', v_item.name,
      'asset_key', v_item.asset_key,
      'purchased_at', v_user_item.purchased_at
    ),
    'spent_coins', v_item.price,
    'remaining_coins', v_profile.coins
  );
end;
$$;

comment on function public.purchase_shop_item(bigint) is
  '코인을 한 번 차감하고 상점 아이템을 사용자 보유 아이템으로 지급한다.';

-- =============================================================================
-- 아이템 장착과 해제
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
  v_item public.shop_items;
  v_category public.item_categories;
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
    item.*,
    category.id,
    category.code,
    category.name,
    category.slot,
    category.target_type,
    category.created_at,
    category.updated_at
  into
    v_item.id,
    v_item.category_id,
    v_item.name,
    v_item.price,
    v_item.asset_key,
    v_item.is_active,
    v_item.created_at,
    v_item.updated_at,
    v_category.id,
    v_category.code,
    v_category.name,
    v_category.slot,
    v_category.target_type,
    v_category.created_at,
    v_category.updated_at
  from public.shop_items item
  join public.item_categories category
    on category.id = item.category_id
  where item.id = v_user_item.item_id;

  if v_category.slot <> p_slot then
    raise exception using
      errcode = 'P0001',
      message = 'EQUIPMENT_SLOT_MISMATCH';
  end if;

  v_expected_target := case
    when v_character.growth_stage = 'egg' then 'egg'::public.item_target_type
    else 'pet'::public.item_target_type
  end;

  if v_category.target_type <> v_expected_target then
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
      'item_id', v_item.id,
      'name', v_item.name,
      'asset_key', v_item.asset_key,
      'equipped_at', v_equipment.equipped_at
    )
  );
end;
$$;

comment on function public.equip_character_item(public.equipment_slot, bigint) is
  '보유권, 슬롯과 알/펫 대상을 확인하고 현재 캐릭터 아이템을 장착 또는 교체한다.';

create or replace function public.unequip_character_item(
  p_slot public.equipment_slot
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_character_id bigint;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select c.id
  into v_character_id
  from public.characters c
  where c.user_id = v_user_id;

  if v_character_id is null then
    raise exception using errcode = 'P0001', message = 'USER_NOT_INITIALIZED';
  end if;

  delete from public.character_equipment equipment
  where equipment.character_id = v_character_id
    and equipment.slot = p_slot;

  return jsonb_build_object(
    'slot', p_slot,
    'equipment', null
  );
end;
$$;

comment on function public.unequip_character_item(public.equipment_slot) is
  '현재 캐릭터의 지정 슬롯을 멱등하게 장착 해제한다.';

-- =============================================================================
-- 함수 실행 권한
-- =============================================================================

revoke all on function public.initialize_user(text) from public, anon;
revoke all on function public.get_quiz_session(bigint) from public, anon;
revoke all on function public.start_today_quiz(bigint) from public, anon;
revoke all on function public.submit_quiz_answer(bigint, bigint, bigint)
  from public, anon;
revoke all on function public.complete_quiz_session(bigint) from public, anon;
revoke all on function public.purchase_shop_item(bigint) from public, anon;
revoke all on function public.equip_character_item(
  public.equipment_slot,
  bigint
) from public, anon;
revoke all on function public.unequip_character_item(public.equipment_slot)
  from public, anon;

grant execute on function public.initialize_user(text) to authenticated;
grant execute on function public.get_quiz_session(bigint) to authenticated;
grant execute on function public.start_today_quiz(bigint) to authenticated;
grant execute on function public.submit_quiz_answer(bigint, bigint, bigint)
  to authenticated;
grant execute on function public.complete_quiz_session(bigint)
  to authenticated;
grant execute on function public.purchase_shop_item(bigint) to authenticated;
grant execute on function public.equip_character_item(
  public.equipment_slot,
  bigint
) to authenticated;
grant execute on function public.unequip_character_item(public.equipment_slot)
  to authenticated;

commit;
