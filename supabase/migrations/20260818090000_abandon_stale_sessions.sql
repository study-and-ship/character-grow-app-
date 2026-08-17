begin;

-- =============================================================================
-- 지난 날짜 미완료 세션 정리 정책
--   - in_progress(답안을 다 제출하지 못한 세션)만 다음 세션 시작 시 abandoned로 전환한다.
--   - ready_to_complete(다 풀고 결과만 확인하지 않은 세션)는 날짜가 지나도
--     complete_quiz_session으로 결과 확인과 보상 수령이 가능하다. (자정 직전 풀이 보호)
--   - abandoned 세션은 답안 제출(QUIZ_SESSION_NOT_IN_PROGRESS)과
--     완료(QUIZ_SESSION_NOT_READY)가 기존 상태 검사로 자연히 차단된다.
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

  -- 지난 날짜에 풀다 만 세션은 폐기한다.
  update public.quiz_sessions
  set status = 'abandoned'
  where user_id = v_user_id
    and session_date < v_today
    and status = 'in_progress';

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
  '오늘 세션을 만들거나 반환한다. 지난 날짜의 in_progress 세션은 abandoned로 폐기한다.';

commit;
