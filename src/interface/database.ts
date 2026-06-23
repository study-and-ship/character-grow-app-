import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "@/lib/supabase/database.types";

/**
 * DB 테이블/Enum 의 단축 타입 모음.
 * database.types.ts 는 gen:types 로 자동 생성되므로 직접 수정하지 않는다.
 * 컴포넌트/훅에서는 이 파일의 별칭을 import 해서 쓴다.
 *
 *   import type { Character } from "@/interface/database";
 */

// --- Row 타입 (조회 결과) ---
export type Profile = Tables<"profiles">;
export type AdminProfile = Tables<"admin_profiles">;
export type UserStreak = Tables<"user_streaks">;

export type CharacterType = Tables<"character_types">;
export type CharacterTypeStage = Tables<"character_type_stages">;
export type Character = Tables<"characters">;
export type CharacterGrowthHistory = Tables<"character_growth_histories">;

export type Question = Tables<"questions">;
export type QuestionChoice = Tables<"question_choices">;
export type QuestionUploadBatch = Tables<"question_upload_batches">;

export type QuizSession = Tables<"quiz_sessions">;
export type QuizSessionQuestion = Tables<"quiz_session_questions">;
export type UserQuestionAnswer = Tables<"user_question_answers">;

// --- Insert 타입 (생성 시) ---
export type CharacterInsert = TablesInsert<"characters">;
export type QuizSessionInsert = TablesInsert<"quiz_sessions">;
export type UserQuestionAnswerInsert = TablesInsert<"user_question_answers">;

// --- Update 타입 (수정 시) ---
export type CharacterUpdate = TablesUpdate<"characters">;
export type QuizSessionUpdate = TablesUpdate<"quiz_sessions">;

// --- Enum 타입 ---
export type AdminRole = Enums<"admin_role">;
export type CharacterGrowthStage = Enums<"character_growth_stage">;
export type QuestionStatus = Enums<"question_status">;
export type QuizSessionStatus = Enums<"quiz_session_status">;
