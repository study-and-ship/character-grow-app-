


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."admin_role" AS ENUM (
    'owner',
    'manager'
);


ALTER TYPE "public"."admin_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."admin_role" IS '관리자 역할';



CREATE TYPE "public"."character_growth_stage" AS ENUM (
    'egg',
    'baby',
    'child',
    'teen',
    'adult'
);


ALTER TYPE "public"."character_growth_stage" OWNER TO "postgres";


COMMENT ON TYPE "public"."character_growth_stage" IS '캐릭터 성장 단계';



CREATE TYPE "public"."question_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."question_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."question_status" IS '객관식 문제 상태';



CREATE TYPE "public"."quiz_session_status" AS ENUM (
    'in_progress',
    'completed',
    'abandoned'
);


ALTER TYPE "public"."quiz_session_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_quiz_sessions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION "public"."set_quiz_sessions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."admin_role" DEFAULT 'manager'::"public"."admin_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_profiles" IS '관리자 계정 프로필 테이블. is_admin()은 이 테이블의 존재 여부로 관리자 판정';



COMMENT ON COLUMN "public"."admin_profiles"."id" IS '관리자 사용자 ID. auth.users(id)를 참조하는 UUID이며, admin 권한 유무를 의미(존재 자체가 admin).';



COMMENT ON COLUMN "public"."admin_profiles"."role" IS '관리자 역할 enum 값(public.admin_role)';



COMMENT ON COLUMN "public"."admin_profiles"."created_at" IS '관리자 등록 시각';



COMMENT ON COLUMN "public"."admin_profiles"."updated_at" IS '관리자 프로필 갱신 시각';



CREATE TABLE IF NOT EXISTS "public"."character_growth_histories" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "character_id" bigint NOT NULL,
    "answer_id" bigint,
    "before_level" integer NOT NULL,
    "after_level" integer NOT NULL,
    "before_stage" "public"."character_growth_stage" NOT NULL,
    "after_stage" "public"."character_growth_stage" NOT NULL,
    "gained_exp" integer DEFAULT 0 NOT NULL,
    "reason" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quiz_session_id" bigint
);


ALTER TABLE "public"."character_growth_histories" OWNER TO "postgres";


COMMENT ON TABLE "public"."character_growth_histories" IS '캐릭터 성장 이력(로그) 테이블. 어떤 answer_id 때문에 레벨/단계가 어떻게 변했는지 기록하는 로그/이력';



COMMENT ON COLUMN "public"."character_growth_histories"."id" IS '성장 이력 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."character_growth_histories"."user_id" IS '성장 이력이 발생한 사용자 FK. auth.users(id)를 참조.';



COMMENT ON COLUMN "public"."character_growth_histories"."character_id" IS '성장 당시의 캐릭터 상태 FK. public.characters(id)를 참조합니다.';



COMMENT ON COLUMN "public"."character_growth_histories"."answer_id" IS '어떤 답안 제출(user_question_answers.id)로 인해 성장했는지 추적하는 FK. on delete set null.
(예: answer_correct, streak_bonus 등 reason에 따라 growth 이벤트 연결)';



COMMENT ON COLUMN "public"."character_growth_histories"."before_level" IS '성장 발생 직전 레벨';



COMMENT ON COLUMN "public"."character_growth_histories"."after_level" IS '성장 이후 레벨';



COMMENT ON COLUMN "public"."character_growth_histories"."before_stage" IS '성장 전 성장 단계(enum public.character_growth_stage).';



COMMENT ON COLUMN "public"."character_growth_histories"."after_stage" IS '성장 후 성장 단계(enum public.character_growth_stage).';



COMMENT ON COLUMN "public"."character_growth_histories"."gained_exp" IS '이번 성장 이벤트로 획득/반영된 경험치 합';



COMMENT ON COLUMN "public"."character_growth_histories"."reason" IS '성장 원인 코드/라벨';



COMMENT ON COLUMN "public"."character_growth_histories"."created_at" IS '성장 이력 생성 시각';



ALTER TABLE "public"."character_growth_histories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."character_growth_histories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."character_type_stages" (
    "id" bigint NOT NULL,
    "character_type_id" bigint NOT NULL,
    "growth_stage" "public"."character_growth_stage" NOT NULL,
    "image_url" "text",
    "min_level" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."character_type_stages" OWNER TO "postgres";


COMMENT ON TABLE "public"."character_type_stages" IS '캐릭터 종류별 성장 단계 정보(단계 정의) 테이블. 예: egg->baby->... 단계별 시작 조건/표시 정보 characters 및 character_growth_histories의 단계 표현에 사용.';



COMMENT ON COLUMN "public"."character_type_stages"."id" IS '캐릭터 타입 스테이지 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."character_type_stages"."character_type_id" IS '해당 성장 단계가 속한 캐릭터 종류 FK. public.character_types.id를 참조합니다.';



COMMENT ON COLUMN "public"."character_type_stages"."growth_stage" IS '성장 단계 enum 값( public.character_growth_stage ). 값 의미:
- egg: 알 상태
- baby: 아기
- child: 어린이
- teen: 청소년
- adult: 성인';



COMMENT ON COLUMN "public"."character_type_stages"."image_url" IS '단계별 이미지 URL 예: "https://.../stage_egg.png".';



COMMENT ON COLUMN "public"."character_type_stages"."min_level" IS '해당 growth_stage가 시작되는 최소 레벨. characters.growth_stage 및 성장 로직에서 사용(예: level이 min_level 이상이면 해당 단계로 승격).';



COMMENT ON COLUMN "public"."character_type_stages"."created_at" IS '생성 시각';



COMMENT ON COLUMN "public"."character_type_stages"."updated_at" IS '업데이트 시각';



ALTER TABLE "public"."character_type_stages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."character_type_stages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."character_types" (
    "id" bigint NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."character_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."character_types" IS '캐릭터 종류 마스터 테이블. 여러 캐릭터 중 사용자가 배정받는 대상(상태: is_active=true)';



COMMENT ON COLUMN "public"."character_types"."id" IS '캐릭터 종류 식별자. bigint identity(PK)';



COMMENT ON COLUMN "public"."character_types"."name" IS '캐릭터 종류 이름';



COMMENT ON COLUMN "public"."character_types"."description" IS '캐릭터 설명';



COMMENT ON COLUMN "public"."character_types"."is_active" IS '활성화 여부';



COMMENT ON COLUMN "public"."character_types"."created_at" IS '생성 시각';



COMMENT ON COLUMN "public"."character_types"."updated_at" IS '갱신 시각';



ALTER TABLE "public"."character_types" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."character_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "character_type_id" bigint NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "exp" integer DEFAULT 0 NOT NULL,
    "total_exp" integer DEFAULT 0 NOT NULL,
    "growth_stage" "public"."character_growth_stage" DEFAULT 'egg'::"public"."character_growth_stage" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


COMMENT ON TABLE "public"."characters" IS '사용자별 실제 캐릭터 상태(레벨/경험치/현재 성장 단계) 테이블. characters는 사용자 상태 데이터(원본). 사용자는 1명당 1개의 캐릭터';



COMMENT ON COLUMN "public"."characters"."id" IS '캐릭터 상태 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."characters"."user_id" IS '해당 캐릭터 소유자 FK';



COMMENT ON COLUMN "public"."characters"."character_type_id" IS '사용자가 배정받은 캐릭터 종류 FK';



COMMENT ON COLUMN "public"."characters"."level" IS '현재 레벨. 예: 1,2,3...';



COMMENT ON COLUMN "public"."characters"."exp" IS '현재 레벨 내 경험치(레벨 승급까지 누적되는 부분 경험치)';



COMMENT ON COLUMN "public"."characters"."total_exp" IS '누적 경험치 합계';



COMMENT ON COLUMN "public"."characters"."growth_stage" IS '현재 성장 단계 enum 값. public.character_growth_stage';



COMMENT ON COLUMN "public"."characters"."created_at" IS '생성 시각';



COMMENT ON COLUMN "public"."characters"."updated_at" IS '업데이트 시각';



ALTER TABLE "public"."characters" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."characters_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nickname" character varying(30),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS '서비스 사용자 프로필(닉네임 등) 저장 테이블. 인증 주체는 auth.users 이며, profiles.id는 auth.users.id를 1:1로 참조하는 사용자 상태 데이터(원본)';



COMMENT ON COLUMN "public"."profiles"."id" IS '프로필 소유자 ID. Supabase Auth의 auth.users.id와 동일한 UUID이며, FK로 auth.users(id)를 참조';



COMMENT ON COLUMN "public"."profiles"."nickname" IS '사용자가 표시하는 닉네임';



COMMENT ON COLUMN "public"."profiles"."created_at" IS '생성 시각';



COMMENT ON COLUMN "public"."profiles"."updated_at" IS '업데이트 시각';



CREATE TABLE IF NOT EXISTS "public"."question_choices" (
    "id" bigint NOT NULL,
    "question_id" bigint NOT NULL,
    "choice_text" "text" NOT NULL,
    "is_correct" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."question_choices" OWNER TO "postgres";


COMMENT ON TABLE "public"."question_choices" IS '객관식 보기(선택지) 테이블. questions와 1:N 관계. is_correct는 정답 여부';



COMMENT ON COLUMN "public"."question_choices"."id" IS '선택지 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."question_choices"."question_id" IS '해당 선택지가 속한 문제 FK. public.questions(id)를 참조하며 on delete cascade.';



COMMENT ON COLUMN "public"."question_choices"."choice_text" IS '선택지 표시 텍스트';



COMMENT ON COLUMN "public"."question_choices"."is_correct" IS '정답 여부';



COMMENT ON COLUMN "public"."question_choices"."sort_order" IS '보기 표시 순서';



COMMENT ON COLUMN "public"."question_choices"."created_at" IS '선택지 생성 시각';



COMMENT ON COLUMN "public"."question_choices"."updated_at" IS '선택지 갱신 시각';



ALTER TABLE "public"."question_choices" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."question_choices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."question_upload_batches" (
    "id" bigint NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "file_name" character varying(255),
    "total_count" integer DEFAULT 0 NOT NULL,
    "success_count" integer DEFAULT 0 NOT NULL,
    "fail_count" integer DEFAULT 0 NOT NULL,
    "failed_items" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."question_upload_batches" OWNER TO "postgres";


COMMENT ON TABLE "public"."question_upload_batches" IS 'JSON 문제 업로드 이력';



COMMENT ON COLUMN "public"."question_upload_batches"."id" IS '업로드 배치 식별자. bigint identity(PK)';



COMMENT ON COLUMN "public"."question_upload_batches"."admin_user_id" IS '업로드를 수행한 관리자 FK. public.admin_profiles(id)';



COMMENT ON COLUMN "public"."question_upload_batches"."file_name" IS '업로드 파일명(또는 입력 소스 이름)';



COMMENT ON COLUMN "public"."question_upload_batches"."total_count" IS '전체 문제 수(업로드 시도 기준)';



COMMENT ON COLUMN "public"."question_upload_batches"."success_count" IS '성공적으로 등록된 문제 수';



COMMENT ON COLUMN "public"."question_upload_batches"."fail_count" IS '실패로 인해 등록되지 못한 문제 수';



COMMENT ON COLUMN "public"."question_upload_batches"."failed_items" IS '실패한 항목과 실패 사유를 저장하는 jsonb';



COMMENT ON COLUMN "public"."question_upload_batches"."created_at" IS '업로드 생성 시각';



ALTER TABLE "public"."question_upload_batches" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."question_upload_batches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" bigint NOT NULL,
    "category" character varying(50),
    "difficulty" integer DEFAULT 1 NOT NULL,
    "question_text" "text" NOT NULL,
    "explanation" "text",
    "status" "public"."question_status" DEFAULT 'draft'::"public"."question_status" NOT NULL,
    "created_by_admin_id" "uuid",
    "upload_batch_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."questions" IS '객관식 문제 본문 테이블. 문제 상태(status: draft/published/archived)에 따라 일반 사용자가 조회';



COMMENT ON COLUMN "public"."questions"."id" IS '문제 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."questions"."category" IS '문제 카테고리';



COMMENT ON COLUMN "public"."questions"."difficulty" IS '난이도';



COMMENT ON COLUMN "public"."questions"."question_text" IS '문제 지문';



COMMENT ON COLUMN "public"."questions"."explanation" IS '정답/해설 텍스트';



COMMENT ON COLUMN "public"."questions"."status" IS '문제 상태';



COMMENT ON COLUMN "public"."questions"."created_by_admin_id" IS '문제를 생성한 관리자 FK. public.admin_profiles(id)를 참조하며, on delete set null로 인해 관리자 삭제 시 null 가능.';



COMMENT ON COLUMN "public"."questions"."upload_batch_id" IS 'JSON 업로드 배치 FK. public.question_upload_batches(id)를 참조합니다.';



COMMENT ON COLUMN "public"."questions"."created_at" IS '문제 생성 시각.';



COMMENT ON COLUMN "public"."questions"."updated_at" IS '문제 갱신 시각';



ALTER TABLE "public"."questions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_session_questions" (
    "id" bigint NOT NULL,
    "quiz_session_id" bigint NOT NULL,
    "question_id" bigint NOT NULL,
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quiz_session_questions" OWNER TO "postgres";


ALTER TABLE "public"."quiz_session_questions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."quiz_session_questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_sessions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."quiz_session_status" DEFAULT 'in_progress'::"public"."quiz_session_status" NOT NULL,
    "total_question_count" integer DEFAULT 5 NOT NULL,
    "correct_count" integer DEFAULT 0 NOT NULL,
    "earned_exp" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quiz_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."quiz_sessions" IS '퀴즈 세트 문제 제출 시점에는 user_question_answers에 기록만 저장하고, 세트 완료 시점에 correct_count/earned_exp/completed_at 갱신 및 캐릭터 성장/streak 관련 이력 생성';



ALTER TABLE "public"."quiz_sessions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."quiz_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_question_answers" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" bigint NOT NULL,
    "selected_choice_id" bigint NOT NULL,
    "is_correct" boolean NOT NULL,
    "earned_exp" integer DEFAULT 0 NOT NULL,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quiz_session_id" bigint NOT NULL,
    "quiz_session_question_id" bigint
);


ALTER TABLE "public"."user_question_answers" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_question_answers" IS '사용자의 문제 제출 기록(정답 여부/획득 경험치 포함) 테이블';



COMMENT ON COLUMN "public"."user_question_answers"."id" IS '답안 제출 기록 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."user_question_answers"."user_id" IS '답안을 제출한 사용자 FK. auth.users(id)를 참조합니다.';



COMMENT ON COLUMN "public"."user_question_answers"."question_id" IS '어떤 문제에 대한 답인지 FK. public.questions(id)를 참조합니다.';



COMMENT ON COLUMN "public"."user_question_answers"."selected_choice_id" IS '사용자가 선택한 보기 FK';



COMMENT ON COLUMN "public"."user_question_answers"."is_correct" IS '제출 시점의 정답 여부';



COMMENT ON COLUMN "public"."user_question_answers"."earned_exp" IS '해당 답안 제출로 획득한 경험치';



COMMENT ON COLUMN "public"."user_question_answers"."answered_at" IS '답안 제출 시각';



ALTER TABLE "public"."user_question_answers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_question_answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_streaks" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "last_answered_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_streaks" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_streaks" IS '사용자 streak 요약 테이블. user_question_answers에서 정답 여부가 아니라 “하루에 1개 이상 풀이했는지” 기준으로 계산되며, 현재/최고 streak를 빠르게 조회하기 위한 테이블';



COMMENT ON COLUMN "public"."user_streaks"."id" IS '연속 학습일 요약 식별자. bigint identity(PK).';



COMMENT ON COLUMN "public"."user_streaks"."user_id" IS '해당 사용자 FK';



COMMENT ON COLUMN "public"."user_streaks"."current_streak" IS '현재 연속 학습일 수(예: 1,2,3...). “정답”이 아니라 “해당 날짜에 1개 이상 풀었는지”로 증가/유지';



COMMENT ON COLUMN "public"."user_streaks"."longest_streak" IS '최고 연속 학습일 수(역대 최고값).';



COMMENT ON COLUMN "public"."user_streaks"."last_answered_date" IS '한국 시간 기준 “마지막으로 문제를 푼 날짜”(date 타입). streak 계산에서 기준점으로 사용.';



COMMENT ON COLUMN "public"."user_streaks"."created_at" IS '생성 시각';



COMMENT ON COLUMN "public"."user_streaks"."updated_at" IS '업데이트 시각';



ALTER TABLE "public"."user_streaks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_streaks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_growth_histories"
    ADD CONSTRAINT "character_growth_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_type_stages"
    ADD CONSTRAINT "character_type_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_types"
    ADD CONSTRAINT "character_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_choices"
    ADD CONSTRAINT "question_choices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_upload_batches"
    ADD CONSTRAINT "question_upload_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_session_questions"
    ADD CONSTRAINT "quiz_session_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_session_questions"
    ADD CONSTRAINT "quiz_session_questions_unique_session_question" UNIQUE ("quiz_session_id", "question_id");



ALTER TABLE ONLY "public"."quiz_session_questions"
    ADD CONSTRAINT "quiz_session_questions_unique_session_sort" UNIQUE ("quiz_session_id", "sort_order");



ALTER TABLE ONLY "public"."quiz_sessions"
    ADD CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_type_stages"
    ADD CONSTRAINT "uq_character_type_stages" UNIQUE ("character_type_id", "growth_stage");



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_unique_quiz_session_question" UNIQUE ("quiz_session_id", "question_id");



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_character_growth_histories_answer_id" ON "public"."character_growth_histories" USING "btree" ("answer_id");



CREATE INDEX "idx_character_growth_histories_character_id" ON "public"."character_growth_histories" USING "btree" ("character_id");



CREATE INDEX "idx_character_growth_histories_created_at" ON "public"."character_growth_histories" USING "btree" ("created_at");



CREATE INDEX "idx_character_growth_histories_quiz_session_id" ON "public"."character_growth_histories" USING "btree" ("quiz_session_id");



CREATE INDEX "idx_character_growth_histories_user_id" ON "public"."character_growth_histories" USING "btree" ("user_id");



CREATE INDEX "idx_character_type_stages_character_type_id" ON "public"."character_type_stages" USING "btree" ("character_type_id");



CREATE INDEX "idx_character_types_is_active" ON "public"."character_types" USING "btree" ("is_active");



CREATE INDEX "idx_characters_character_type_id" ON "public"."characters" USING "btree" ("character_type_id");



CREATE INDEX "idx_characters_growth_stage" ON "public"."characters" USING "btree" ("growth_stage");



CREATE INDEX "idx_question_choices_question_id" ON "public"."question_choices" USING "btree" ("question_id");



CREATE INDEX "idx_question_choices_question_is_correct" ON "public"."question_choices" USING "btree" ("question_id", "is_correct");



CREATE INDEX "idx_question_choices_question_sort" ON "public"."question_choices" USING "btree" ("question_id", "sort_order");



CREATE INDEX "idx_question_upload_batches_admin_user_id" ON "public"."question_upload_batches" USING "btree" ("admin_user_id");



CREATE INDEX "idx_question_upload_batches_created_at" ON "public"."question_upload_batches" USING "btree" ("created_at");



CREATE INDEX "idx_questions_category" ON "public"."questions" USING "btree" ("category");



CREATE INDEX "idx_questions_created_by_admin_id" ON "public"."questions" USING "btree" ("created_by_admin_id");



CREATE INDEX "idx_questions_difficulty" ON "public"."questions" USING "btree" ("difficulty");



CREATE INDEX "idx_questions_status" ON "public"."questions" USING "btree" ("status");



CREATE INDEX "idx_questions_upload_batch_id" ON "public"."questions" USING "btree" ("upload_batch_id");



CREATE INDEX "idx_quiz_session_questions_question_id" ON "public"."quiz_session_questions" USING "btree" ("question_id");



CREATE INDEX "idx_quiz_session_questions_quiz_session_id" ON "public"."quiz_session_questions" USING "btree" ("quiz_session_id");



CREATE INDEX "idx_quiz_sessions_completed_at" ON "public"."quiz_sessions" USING "btree" ("completed_at");



CREATE INDEX "idx_quiz_sessions_started_at" ON "public"."quiz_sessions" USING "btree" ("started_at");



CREATE INDEX "idx_quiz_sessions_status" ON "public"."quiz_sessions" USING "btree" ("status");



CREATE INDEX "idx_quiz_sessions_user_id" ON "public"."quiz_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_user_question_answers_answered_at" ON "public"."user_question_answers" USING "btree" ("answered_at");



CREATE INDEX "idx_user_question_answers_question_id" ON "public"."user_question_answers" USING "btree" ("question_id");



CREATE INDEX "idx_user_question_answers_quiz_session_id" ON "public"."user_question_answers" USING "btree" ("quiz_session_id");



CREATE INDEX "idx_user_question_answers_quiz_session_question_id" ON "public"."user_question_answers" USING "btree" ("quiz_session_question_id");



CREATE INDEX "idx_user_question_answers_selected_choice_id" ON "public"."user_question_answers" USING "btree" ("selected_choice_id");



CREATE INDEX "idx_user_question_answers_user_id" ON "public"."user_question_answers" USING "btree" ("user_id");



CREATE INDEX "idx_user_streaks_last_answered_date" ON "public"."user_streaks" USING "btree" ("last_answered_date");



CREATE OR REPLACE TRIGGER "set_quiz_sessions_updated_at" BEFORE UPDATE ON "public"."quiz_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_quiz_sessions_updated_at"();



CREATE OR REPLACE TRIGGER "tr_admin_profiles_updated_at" BEFORE UPDATE ON "public"."admin_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_character_type_stages_updated_at" BEFORE UPDATE ON "public"."character_type_stages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_character_types_updated_at" BEFORE UPDATE ON "public"."character_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_characters_updated_at" BEFORE UPDATE ON "public"."characters" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_question_choices_updated_at" BEFORE UPDATE ON "public"."question_choices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_questions_updated_at" BEFORE UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_user_streaks_updated_at" BEFORE UPDATE ON "public"."user_streaks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_growth_histories"
    ADD CONSTRAINT "character_growth_histories_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "public"."user_question_answers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."character_growth_histories"
    ADD CONSTRAINT "character_growth_histories_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_growth_histories"
    ADD CONSTRAINT "character_growth_histories_quiz_session_id_fkey" FOREIGN KEY ("quiz_session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."character_growth_histories"
    ADD CONSTRAINT "character_growth_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_type_stages"
    ADD CONSTRAINT "character_type_stages_character_type_id_fkey" FOREIGN KEY ("character_type_id") REFERENCES "public"."character_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_character_type_id_fkey" FOREIGN KEY ("character_type_id") REFERENCES "public"."character_types"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_choices"
    ADD CONSTRAINT "question_choices_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_upload_batches"
    ADD CONSTRAINT "question_upload_batches_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_upload_batch_id_fkey" FOREIGN KEY ("upload_batch_id") REFERENCES "public"."question_upload_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quiz_session_questions"
    ADD CONSTRAINT "quiz_session_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."quiz_session_questions"
    ADD CONSTRAINT "quiz_session_questions_quiz_session_id_fkey" FOREIGN KEY ("quiz_session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_sessions"
    ADD CONSTRAINT "quiz_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_quiz_session_id_fkey" FOREIGN KEY ("quiz_session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_quiz_session_question_id_fkey" FOREIGN KEY ("quiz_session_question_id") REFERENCES "public"."quiz_session_questions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_selected_choice_id_fkey" FOREIGN KEY ("selected_choice_id") REFERENCES "public"."question_choices"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_question_answers"
    ADD CONSTRAINT "user_question_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."admin_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_profiles_admin_rw" ON "public"."admin_profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."character_growth_histories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "character_growth_histories_select_own" ON "public"."character_growth_histories" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."character_type_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "character_type_stages_admin_crud" ON "public"."character_type_stages" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "character_type_stages_select_all_user" ON "public"."character_type_stages" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."character_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "character_types_admin_crud" ON "public"."character_types" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "character_types_select_active_user" ON "public"."character_types" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "characters_select_own" ON "public"."characters" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "own answers" ON "public"."user_question_answers" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "own characters" ON "public"."characters" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "own growth histories" ON "public"."character_growth_histories" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "own profile" ON "public"."profiles" TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "own quiz_sessions" ON "public"."quiz_sessions" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "own session questions" ON "public"."quiz_session_questions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."quiz_sessions" "s"
  WHERE (("s"."id" = "quiz_session_questions"."quiz_session_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."quiz_sessions" "s"
  WHERE (("s"."id" = "quiz_session_questions"."quiz_session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "own streaks" ON "public"."user_streaks" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."question_choices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "question_choices_admin_crud" ON "public"."question_choices" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."question_upload_batches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "question_upload_batches_admin_rw" ON "public"."question_upload_batches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "questions_admin_crud" ON "public"."questions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "questions_select_published_user" ON "public"."questions" FOR SELECT TO "authenticated" USING (("status" = 'published'::"public"."question_status"));



ALTER TABLE "public"."quiz_session_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_session_questions_select_own_session" ON "public"."quiz_session_questions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."quiz_sessions" "qs"
  WHERE (("qs"."id" = "quiz_session_questions"."quiz_session_id") AND ("qs"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."quiz_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_sessions_select_own" ON "public"."quiz_sessions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "read character_type_stages" ON "public"."character_type_stages" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "read character_types" ON "public"."character_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "read choices of published questions" ON "public"."question_choices" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questions" "q"
  WHERE (("q"."id" = "question_choices"."question_id") AND ("q"."status" = 'published'::"public"."question_status")))));



CREATE POLICY "read published questions" ON "public"."questions" FOR SELECT TO "authenticated" USING (("status" = 'published'::"public"."question_status"));



ALTER TABLE "public"."user_question_answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_question_answers_select_own" ON "public"."user_question_answers" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_streaks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_streaks_select_own" ON "public"."user_streaks" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."set_quiz_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_quiz_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_quiz_sessions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."admin_profiles" TO "anon";
GRANT ALL ON TABLE "public"."admin_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."admin_profiles" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."character_growth_histories" TO "anon";
GRANT ALL ON TABLE "public"."character_growth_histories" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."character_growth_histories" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."character_growth_histories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."character_growth_histories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."character_growth_histories_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."character_type_stages" TO "anon";
GRANT ALL ON TABLE "public"."character_type_stages" TO "service_role";
GRANT ALL ON TABLE "public"."character_type_stages" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."character_type_stages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."character_type_stages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."character_type_stages_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."character_types" TO "anon";
GRANT ALL ON TABLE "public"."character_types" TO "service_role";
GRANT ALL ON TABLE "public"."character_types" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."character_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."character_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."character_types_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."characters" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."characters_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."characters_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."characters_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."question_choices" TO "anon";
GRANT ALL ON TABLE "public"."question_choices" TO "service_role";
GRANT ALL ON TABLE "public"."question_choices" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."question_choices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_choices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_choices_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."question_upload_batches" TO "anon";
GRANT ALL ON TABLE "public"."question_upload_batches" TO "service_role";
GRANT ALL ON TABLE "public"."question_upload_batches" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."question_upload_batches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_upload_batches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_upload_batches_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."questions" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."quiz_session_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_session_questions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."quiz_session_questions" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."quiz_session_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_session_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_session_questions_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."quiz_sessions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_sessions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."quiz_sessions" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."quiz_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_sessions_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."user_question_answers" TO "anon";
GRANT ALL ON TABLE "public"."user_question_answers" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_question_answers" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."user_question_answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_question_answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_question_answers_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."user_streaks" TO "anon";
GRANT ALL ON TABLE "public"."user_streaks" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_streaks" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."user_streaks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_streaks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_streaks_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke truncate on table "public"."admin_profiles" from "anon";

revoke truncate on table "public"."character_growth_histories" from "anon";

revoke references on table "public"."character_growth_histories" from "authenticated";

revoke trigger on table "public"."character_growth_histories" from "authenticated";

revoke truncate on table "public"."character_growth_histories" from "authenticated";

revoke truncate on table "public"."character_type_stages" from "anon";

revoke truncate on table "public"."character_types" from "anon";

revoke truncate on table "public"."characters" from "anon";

revoke references on table "public"."characters" from "authenticated";

revoke trigger on table "public"."characters" from "authenticated";

revoke truncate on table "public"."characters" from "authenticated";

revoke truncate on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."question_choices" from "anon";

revoke truncate on table "public"."question_upload_batches" from "anon";

revoke truncate on table "public"."questions" from "anon";

revoke references on table "public"."questions" from "authenticated";

revoke trigger on table "public"."questions" from "authenticated";

revoke truncate on table "public"."questions" from "authenticated";

revoke truncate on table "public"."quiz_session_questions" from "anon";

revoke references on table "public"."quiz_session_questions" from "authenticated";

revoke trigger on table "public"."quiz_session_questions" from "authenticated";

revoke truncate on table "public"."quiz_session_questions" from "authenticated";

revoke truncate on table "public"."quiz_sessions" from "anon";

revoke references on table "public"."quiz_sessions" from "authenticated";

revoke trigger on table "public"."quiz_sessions" from "authenticated";

revoke truncate on table "public"."quiz_sessions" from "authenticated";

revoke truncate on table "public"."user_question_answers" from "anon";

revoke references on table "public"."user_question_answers" from "authenticated";

revoke trigger on table "public"."user_question_answers" from "authenticated";

revoke truncate on table "public"."user_question_answers" from "authenticated";

revoke truncate on table "public"."user_streaks" from "anon";

revoke references on table "public"."user_streaks" from "authenticated";

revoke trigger on table "public"."user_streaks" from "authenticated";

revoke truncate on table "public"."user_streaks" from "authenticated";


