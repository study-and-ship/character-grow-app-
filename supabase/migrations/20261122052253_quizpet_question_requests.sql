create schema if not exists quizpet_private;
revoke all on schema quizpet_private from public, anon, authenticated;

create table quizpet_private.question_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (char_length(topic) between 2 and 100),
  details text not null check (char_length(details) <= 500),
  created_at timestamptz not null default now()
);
alter table quizpet_private.question_requests enable row level security;
create index question_requests_user_created_idx
  on quizpet_private.question_requests (user_id, created_at desc);

create function public.submit_question_request(p_id uuid, p_topic text, p_details text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := auth.uid();
  normalized_topic text := btrim(coalesce(p_topic, ''));
  normalized_details text := btrim(coalesce(p_details, ''));
begin
  if requester is null or coalesce(auth.jwt()->>'is_anonymous', 'false') = 'true' then
    raise exception using errcode = '42501', message = 'login_required';
  end if;
  if p_id is null or char_length(normalized_topic) not between 2 and 100
    or char_length(normalized_details) > 500 then
    raise exception using errcode = '22023', message = 'invalid_question_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(requester::text, 4821));
  if exists (select 1 from quizpet_private.question_requests where id = p_id and user_id = requester) then
    return p_id;
  end if;

  if (select count(*) from quizpet_private.question_requests
      where user_id = requester and created_at >= now() - interval '24 hours') >= 3 then
    raise exception using errcode = 'P0001', message = 'question_request_limit';
  end if;

  insert into quizpet_private.question_requests (id, user_id, topic, details)
  values (p_id, requester, normalized_topic, normalized_details);
  return p_id;
end;
$$;
revoke all on function public.submit_question_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_question_request(uuid, text, text) to authenticated;

