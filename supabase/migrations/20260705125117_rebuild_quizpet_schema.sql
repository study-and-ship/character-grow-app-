begin;

-- =============================================================================
-- 1. 기존 사용자 앱 객체 제거
-- Supabase가 관리하는 auth, storage 등의 시스템 스키마는 건드리지 않는다.
-- =============================================================================

drop table if exists public.character_equipment cascade;
drop table if exists public.user_items cascade;
drop table if exists public.shop_items cascade;
drop table if exists public.item_categories cascade;

drop table if exists public.character_growth_histories cascade;
drop table if exists public.user_question_answers cascade;
drop table if exists public.quiz_session_questions cascade;
drop table if exists public.quiz_sessions cascade;

drop table if exists public.question_choices cascade;
drop table if exists public.questions cascade;
drop table if exists public.question_categories cascade;
drop table if exists public.question_upload_batches cascade;

drop table if exists public.characters cascade;
drop table if exists public.character_type_stages cascade;
drop table if exists public.character_types cascade;
drop table if exists public.user_streaks cascade;
drop table if exists public.profiles cascade;
drop table if exists public.admin_profiles cascade;

drop function if exists public.is_admin();
drop function if exists public.set_quiz_sessions_updated_at();
drop function if exists public.set_updated_at();

drop type if exists public.equipment_slot cascade;
drop type if exists public.item_target_type cascade;
drop type if exists public.quiz_session_status cascade;
drop type if exists public.question_status cascade;
drop type if exists public.character_growth_stage cascade;
drop type if exists public.admin_role cascade;

-- =============================================================================
-- 2. Enum
-- =============================================================================

create type public.character_growth_stage as enum (
  'egg',
  'baby',
  'child',
  'teen',
  'adult'
);

comment on type public.character_growth_stage is
  '캐릭터 성장 단계: 알, 아기, 어린이, 청소년, 성체';

create type public.question_status as enum (
  'draft',
  'published',
  'archived'
);

comment on type public.question_status is
  '문제 상태: 초안, 출제 가능, 보관';

create type public.quiz_session_status as enum (
  'in_progress',
  'ready_to_complete',
  'completed',
  'abandoned'
);

comment on type public.quiz_session_status is
  '퀴즈 세션 상태: 풀이 중, 결과 준비, 보상 완료, 폐기';

create type public.item_target_type as enum (
  'egg',
  'pet'
);

comment on type public.item_target_type is
  '아이템 적용 대상: 부화 전 알 또는 부화 후 펫';

create type public.equipment_slot as enum (
  'pattern',
  'hat',
  'glasses',
  'nest'
);

comment on type public.equipment_slot is
  '아이템 장착 부위: 무늬, 모자, 안경, 둥지';

-- =============================================================================
-- 3. 공통 updated_at Trigger
-- =============================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 4. 사용자
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname varchar(20),
  coins integer not null default 300,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_coins_nonnegative check (coins >= 0),
  constraint profiles_nickname_not_blank check (
    nickname is null or length(btrim(nickname)) between 1 and 20
  )
);

comment on table public.profiles is
  '사용자 앱 프로필. 이메일과 비밀번호는 Supabase Auth에서 관리한다.';
comment on column public.profiles.id is 'Supabase Auth 사용자 ID';
comment on column public.profiles.nickname is '앱에 표시할 사용자 닉네임';
comment on column public.profiles.coins is '현재 사용 가능한 코인 잔액';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.user_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_streaks_current_nonnegative check (current_streak >= 0),
  constraint user_streaks_longest_valid check (
    longest_streak >= 0 and longest_streak >= current_streak
  )
);

comment on table public.user_streaks is
  '퀴즈 완료 시 갱신하는 사용자별 연속 학습 집계';
comment on column public.user_streaks.last_completed_date is
  '마지막으로 퀴즈 완료 보상을 받은 Asia/Seoul 기준 날짜';

create trigger user_streaks_set_updated_at
before update on public.user_streaks
for each row execute function public.set_updated_at();

-- =============================================================================
-- 5. 캐릭터
-- =============================================================================

create table public.character_types (
  id bigint generated by default as identity primary key,
  name varchar(50) not null,
  sprite_key varchar(50) not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint character_types_name_not_blank check (length(btrim(name)) > 0),
  constraint character_types_sprite_key_not_blank check (
    length(btrim(sprite_key)) > 0
  )
);

comment on table public.character_types is
  '토끼, 고양이, 햄스터 같은 펫 종류 기준 정보';
comment on column public.character_types.sprite_key is
  '프론트엔드 픽셀 그래픽과 연결하는 고유 키';

create trigger character_types_set_updated_at
before update on public.character_types
for each row execute function public.set_updated_at();

create table public.character_type_stages (
  id bigint generated by default as identity primary key,
  character_type_id bigint not null
    references public.character_types(id) on delete cascade,
  growth_stage public.character_growth_stage not null,
  min_level integer not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint character_type_stages_min_level_positive check (min_level >= 1),
  constraint character_type_stages_type_stage_unique
    unique (character_type_id, growth_stage),
  constraint character_type_stages_type_level_unique
    unique (character_type_id, min_level)
);

comment on table public.character_type_stages is
  '펫 종류별 성장 단계의 최소 레벨과 이미지';

create index character_type_stages_lookup_idx
  on public.character_type_stages(character_type_id, min_level desc);

create trigger character_type_stages_set_updated_at
before update on public.character_type_stages
for each row execute function public.set_updated_at();

create table public.characters (
  id bigint generated by default as identity primary key,
  user_id uuid not null unique
    references public.profiles(id) on delete cascade,
  character_type_id bigint not null
    references public.character_types(id) on delete restrict,
  level integer not null default 1,
  exp integer not null default 0,
  total_exp integer not null default 0,
  growth_stage public.character_growth_stage not null default 'egg',
  hatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint characters_level_positive check (level >= 1),
  constraint characters_exp_nonnegative check (exp >= 0),
  constraint characters_total_exp_nonnegative check (total_exp >= 0)
);

comment on table public.characters is
  '사용자가 실제로 키우는 현재 펫 상태. MVP에서는 사용자당 하나';
comment on column public.characters.exp is '현재 레벨 안에서의 경험치';
comment on column public.characters.total_exp is '누적 경험치의 원본 값';
comment on column public.characters.growth_stage is '현재 확정된 성장 단계';

create index characters_character_type_id_idx
  on public.characters(character_type_id);

create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

-- =============================================================================
-- 6. 문제은행
-- =============================================================================

create table public.question_categories (
  id bigint generated by default as identity primary key,
  code varchar(50) not null unique,
  name varchar(100) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint question_categories_code_not_blank check (length(btrim(code)) > 0),
  constraint question_categories_name_not_blank check (length(btrim(name)) > 0)
);

comment on table public.question_categories is
  '웹 기초, 자바스크립트 같은 문제 카테고리';

create trigger question_categories_set_updated_at
before update on public.question_categories
for each row execute function public.set_updated_at();

create table public.questions (
  id bigint generated by default as identity primary key,
  category_id bigint not null
    references public.question_categories(id) on delete restrict,
  supersedes_question_id bigint unique
    references public.questions(id) on delete set null,
  version integer not null default 1,
  title varchar(200),
  question_text text not null,
  explanation text,
  difficulty integer not null default 1,
  status public.question_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint questions_version_positive check (version >= 1),
  constraint questions_difficulty_valid check (difficulty between 1 and 5),
  constraint questions_text_not_blank check (length(btrim(question_text)) > 0),
  constraint questions_not_self_superseding check (
    supersedes_question_id is null or supersedes_question_id <> id
  )
);

comment on table public.questions is
  '사용자에게 출제할 문제 버전. published 행은 직접 수정하지 않고 교정본을 새 행으로 생성한다.';
comment on column public.questions.title is
  '관리자 목록에서 사용하는 선택적 문제 이름';
comment on column public.questions.supersedes_question_id is
  '이 문제 버전이 교체한 직전 문제 ID';

create index questions_category_status_idx
  on public.questions(category_id, status);

create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create table public.question_choices (
  id bigint generated by default as identity primary key,
  question_id bigint not null
    references public.questions(id) on delete cascade,
  choice_text text not null,
  sort_order integer not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint question_choices_sort_order_positive check (sort_order >= 1),
  constraint question_choices_text_not_blank check (
    length(btrim(choice_text)) > 0
  ),
  constraint question_choices_question_order_unique
    unique (question_id, sort_order)
);

comment on table public.question_choices is
  '객관식 문제 보기. 문제당 정답 하나 조건은 관리 API 또는 별도 트리거에서 검증한다.';

create index question_choices_question_id_idx
  on public.question_choices(question_id);

create trigger question_choices_set_updated_at
before update on public.question_choices
for each row execute function public.set_updated_at();

-- =============================================================================
-- 7. 퀴즈 세션과 답안
-- =============================================================================

create table public.quiz_sessions (
  id bigint generated by default as identity primary key,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  category_id bigint not null
    references public.question_categories(id) on delete restrict,
  session_date date not null
    default ((now() at time zone 'Asia/Seoul')::date),
  status public.quiz_session_status not null default 'in_progress',
  max_hearts integer not null default 3,
  hearts_remaining integer not null default 3,
  total_question_count integer not null default 5,
  correct_count integer not null default 0,
  earned_exp integer not null default 0,
  earned_coins integer not null default 0,
  started_at timestamptz not null default now(),
  all_answered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quiz_sessions_user_date_unique unique (user_id, session_date),
  constraint quiz_sessions_max_hearts_positive check (max_hearts > 0),
  constraint quiz_sessions_hearts_valid check (
    hearts_remaining between 0 and max_hearts
  ),
  constraint quiz_sessions_total_questions_positive check (
    total_question_count > 0
  ),
  constraint quiz_sessions_correct_count_valid check (
    correct_count between 0 and total_question_count
  ),
  constraint quiz_sessions_earned_exp_nonnegative check (earned_exp >= 0),
  constraint quiz_sessions_earned_coins_nonnegative check (earned_coins >= 0),
  constraint quiz_sessions_ready_has_answered_at check (
    status not in ('ready_to_complete', 'completed')
    or all_answered_at is not null
  ),
  constraint quiz_sessions_completed_has_completed_at check (
    status <> 'completed' or completed_at is not null
  )
);

comment on table public.quiz_sessions is
  '사용자별 하루 퀴즈 세트, 하트, 진행 상태와 완료 보상 스냅샷';
comment on column public.quiz_sessions.correct_count is
  'completed 시점에만 확정하는 정답 수';
comment on column public.quiz_sessions.earned_exp is
  'completed 시점에만 확정하고 지급하는 경험치';
comment on column public.quiz_sessions.earned_coins is
  'completed 시점에만 확정하고 지급하는 코인';

create index quiz_sessions_user_status_idx
  on public.quiz_sessions(user_id, status);

create trigger quiz_sessions_set_updated_at
before update on public.quiz_sessions
for each row execute function public.set_updated_at();

create table public.quiz_session_questions (
  id bigint generated by default as identity primary key,
  quiz_session_id bigint not null
    references public.quiz_sessions(id) on delete cascade,
  question_id bigint not null
    references public.questions(id) on delete restrict,
  sort_order integer not null,
  created_at timestamptz not null default now(),

  constraint quiz_session_questions_sort_order_positive check (sort_order >= 1),
  constraint quiz_session_questions_session_order_unique
    unique (quiz_session_id, sort_order),
  constraint quiz_session_questions_session_question_unique
    unique (quiz_session_id, question_id)
);

comment on table public.quiz_session_questions is
  '세션 시작 시 고정한 오늘의 문제와 표시 순서';

create index quiz_session_questions_question_id_idx
  on public.quiz_session_questions(question_id);

create table public.user_question_answers (
  id bigint generated by default as identity primary key,
  quiz_session_question_id bigint not null unique
    references public.quiz_session_questions(id) on delete cascade,
  selected_choice_id bigint not null
    references public.question_choices(id) on delete restrict,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

comment on table public.user_question_answers is
  '세션 문제별 사용자 답안과 제출 당시 정답 여부 스냅샷';
comment on column public.user_question_answers.is_correct is
  '답안 제출 시 서버가 판정한 당시 정답 여부';

create index user_question_answers_selected_choice_id_idx
  on public.user_question_answers(selected_choice_id);

create table public.character_growth_histories (
  id bigint generated by default as identity primary key,
  character_id bigint not null
    references public.characters(id) on delete cascade,
  quiz_session_id bigint not null unique
    references public.quiz_sessions(id) on delete cascade,
  gained_exp integer not null,
  before_level integer not null,
  after_level integer not null,
  before_stage public.character_growth_stage not null,
  after_stage public.character_growth_stage not null,
  created_at timestamptz not null default now(),

  constraint character_growth_histories_exp_nonnegative check (gained_exp >= 0),
  constraint character_growth_histories_before_level_positive check (
    before_level >= 1
  ),
  constraint character_growth_histories_after_level_positive check (
    after_level >= 1
  )
);

comment on table public.character_growth_histories is
  '퀴즈 완료로 발생한 캐릭터 경험치와 성장 변경 감사 기록';

create index character_growth_histories_character_id_idx
  on public.character_growth_histories(character_id);

-- =============================================================================
-- 8. 상점과 장착
-- =============================================================================

create table public.item_categories (
  id bigint generated by default as identity primary key,
  code varchar(50) not null unique,
  name varchar(100) not null,
  slot public.equipment_slot not null,
  target_type public.item_target_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint item_categories_code_not_blank check (length(btrim(code)) > 0),
  constraint item_categories_name_not_blank check (length(btrim(name)) > 0)
);

comment on table public.item_categories is
  '상점 아이템의 장착 부위와 알/펫 적용 대상 기준 정보';

create trigger item_categories_set_updated_at
before update on public.item_categories
for each row execute function public.set_updated_at();

create table public.shop_items (
  id bigint generated by default as identity primary key,
  category_id bigint not null
    references public.item_categories(id) on delete restrict,
  name varchar(100) not null,
  price integer not null,
  asset_key varchar(100) not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shop_items_name_not_blank check (length(btrim(name)) > 0),
  constraint shop_items_price_nonnegative check (price >= 0),
  constraint shop_items_asset_key_not_blank check (
    length(btrim(asset_key)) > 0
  )
);

comment on table public.shop_items is
  '사용자가 코인으로 구매할 수 있는 상점 상품';

create index shop_items_category_active_idx
  on public.shop_items(category_id, is_active);

create trigger shop_items_set_updated_at
before update on public.shop_items
for each row execute function public.set_updated_at();

create table public.user_items (
  id bigint generated by default as identity primary key,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  item_id bigint not null
    references public.shop_items(id) on delete restrict,
  purchased_at timestamptz not null default now(),

  constraint user_items_user_item_unique unique (user_id, item_id)
);

comment on table public.user_items is
  '사용자가 구매해 실제로 보유한 상점 아이템';

create index user_items_item_id_idx
  on public.user_items(item_id);

create table public.character_equipment (
  character_id bigint not null
    references public.characters(id) on delete cascade,
  slot public.equipment_slot not null,
  user_item_id bigint not null unique
    references public.user_items(id) on delete cascade,
  equipped_at timestamptz not null default now(),

  primary key (character_id, slot)
);

comment on table public.character_equipment is
  '사용자 펫의 슬롯별 현재 장착 상태';

-- =============================================================================
-- 9. RLS
-- 사용자 소유 데이터는 읽기만 직접 허용한다.
-- 생성·채점·보상·구매·장착은 이후 SECURITY DEFINER RPC로 제공한다.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.user_streaks enable row level security;
alter table public.character_types enable row level security;
alter table public.character_type_stages enable row level security;
alter table public.characters enable row level security;
alter table public.question_categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_choices enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_session_questions enable row level security;
alter table public.user_question_answers enable row level security;
alter table public.character_growth_histories enable row level security;
alter table public.item_categories enable row level security;
alter table public.shop_items enable row level security;
alter table public.user_items enable row level security;
alter table public.character_equipment enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy user_streaks_select_own
on public.user_streaks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy character_types_select_authenticated
on public.character_types
for select
to authenticated
using (true);

create policy character_type_stages_select_authenticated
on public.character_type_stages
for select
to authenticated
using (true);

create policy characters_select_own
on public.characters
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy question_categories_select_authenticated
on public.question_categories
for select
to authenticated
using (true);

create policy questions_select_available
on public.questions
for select
to authenticated
using (status in ('published', 'archived'));

-- question_choices에는 정답 컬럼이 있으므로 authenticated 직접 조회 정책을
-- 만들지 않는다. 안전한 보기 조회와 채점은 이후 RPC를 통해 제공한다.

create policy quiz_sessions_select_own
on public.quiz_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy quiz_session_questions_select_own
on public.quiz_session_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_sessions qs
    where qs.id = quiz_session_questions.quiz_session_id
      and qs.user_id = (select auth.uid())
  )
);

create policy user_question_answers_select_own
on public.user_question_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_session_questions qsq
    join public.quiz_sessions qs on qs.id = qsq.quiz_session_id
    where qsq.id = user_question_answers.quiz_session_question_id
      and qs.user_id = (select auth.uid())
  )
);

create policy character_growth_histories_select_own
on public.character_growth_histories
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_growth_histories.character_id
      and c.user_id = (select auth.uid())
  )
);

create policy item_categories_select_authenticated
on public.item_categories
for select
to authenticated
using (true);

create policy shop_items_select_authenticated
on public.shop_items
for select
to authenticated
using (true);

create policy user_items_select_own
on public.user_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy character_equipment_select_own
on public.character_equipment
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_equipment.character_id
      and c.user_id = (select auth.uid())
  )
);

-- =============================================================================
-- 10. 권한
-- =============================================================================

grant usage on schema public to authenticated, service_role;

grant select on table
  public.profiles,
  public.user_streaks,
  public.character_types,
  public.character_type_stages,
  public.characters,
  public.question_categories,
  public.questions,
  public.question_choices,
  public.quiz_sessions,
  public.quiz_session_questions,
  public.user_question_answers,
  public.character_growth_histories,
  public.item_categories,
  public.shop_items,
  public.user_items,
  public.character_equipment
to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

commit;
