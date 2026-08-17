import { z } from "zod";
import { internalError } from "./response";

const growthStageSchema = z.enum(["egg", "baby", "child", "teen", "adult"]);
const quizStatusSchema = z.enum([
  "in_progress",
  "ready_to_complete",
  "completed",
  "abandoned",
]);
const equipmentSlotSchema = z.enum(["pattern", "hat", "glasses", "nest"]);

const nullableTimestamp = z.string().nullable();

export const initializeUserResultSchema = z.object({
  profile: z.object({
    id: z.string().uuid(),
    nickname: z.string().nullable(),
    coins: z.number().int().nonnegative(),
  }),
  character: z.object({
    id: z.number().int().positive(),
    character_type_id: z.number().int().positive(),
    level: z.number().int().positive(),
    exp: z.number().int().nonnegative(),
    total_exp: z.number().int().nonnegative(),
    growth_stage: growthStageSchema,
    hatched_at: nullableTimestamp,
  }),
  streak: z.object({
    current_streak: z.number().int().nonnegative(),
    longest_streak: z.number().int().nonnegative(),
    last_completed_date: z.string().nullable(),
  }),
  is_new_user: z.boolean(),
});

const quizAnswerSchema = z.object({
  selected_choice_id: z.number().int().positive(),
  is_correct: z.boolean(),
  correct_choice_id: z.number().int().positive(),
  correct_choice_text: z.string(),
  explanation: z.string().nullable(),
  answered_at: z.string(),
});

export const quizSessionResultSchema = z.object({
  id: z.number().int().positive(),
  session_date: z.string(),
  status: quizStatusSchema,
  category: z.object({
    id: z.number().int().positive(),
    code: z.string(),
    name: z.string(),
  }),
  max_hearts: z.number().int().positive(),
  hearts_remaining: z.number().int().nonnegative(),
  total_question_count: z.number().int().positive(),
  answered_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
  // 오답 감점(-5)으로 세션 순 EXP는 음수일 수 있다.
  earned_exp: z.number().int(),
  earned_coins: z.number().int().nonnegative(),
  questions: z.array(
    z.object({
      session_question_id: z.number().int().positive(),
      sort_order: z.number().int().positive(),
      question_id: z.number().int().positive(),
      title: z.string().nullable(),
      question_text: z.string(),
      difficulty: z.number().int(),
      choices: z.array(
        z.object({
          id: z.number().int().positive(),
          choice_text: z.string(),
          sort_order: z.number().int().positive(),
        })
      ),
      answer: quizAnswerSchema.nullable(),
    })
  ),
  started_at: z.string(),
  all_answered_at: nullableTimestamp,
  completed_at: nullableTimestamp,
});

export const submitAnswerResultSchema = z.object({
  is_correct: z.boolean(),
  correct_choice_id: z.number().int().positive(),
  correct_choice_text: z.string(),
  explanation: z.string().nullable(),
  hearts_remaining: z.number().int().nonnegative(),
  answered_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
  total_question_count: z.number().int().positive(),
  status: quizStatusSchema,
  can_complete: z.boolean(),
});

export const completeQuizResultSchema = z.object({
  session: z.object({
    id: z.number().int().positive(),
    status: z.literal("completed"),
    total_question_count: z.number().int().positive(),
    correct_count: z.number().int().nonnegative(),
    completed_at: z.string(),
  }),
  rewards: z.object({
    exp: z.number().int(),
    coins: z.number().int().nonnegative(),
    level_up_bonus_coins: z.number().int().nonnegative(),
    current_coins: z.number().int().nonnegative(),
  }),
  character_growth: z.object({
    character_id: z.number().int().positive(),
    gained_exp: z.number().int(),
    before_level: z.number().int().positive(),
    after_level: z.number().int().positive(),
    before_stage: growthStageSchema,
    after_stage: growthStageSchema,
    hatched: z.boolean(),
  }),
  streak: z.object({
    current_streak: z.number().int().nonnegative(),
    longest_streak: z.number().int().nonnegative(),
    last_completed_date: z.string(),
  }),
});

export const purchaseItemResultSchema = z.object({
  user_item: z.object({
    id: z.number().int().positive(),
    item_id: z.number().int().positive(),
    name: z.string(),
    asset_key: z.string(),
    purchased_at: z.string(),
  }),
  spent_coins: z.number().int().nonnegative(),
  remaining_coins: z.number().int().nonnegative(),
});

export const equipmentResultSchema = z.object({
  slot: equipmentSlotSchema,
  equipment: z
    .object({
      user_item_id: z.number().int().positive(),
      item_id: z.number().int().positive(),
      name: z.string(),
      asset_key: z.string(),
      equipped_at: z.string(),
    })
    .nullable(),
});

const rankingEntrySchema = z.object({
  rank: z.number().int().positive(),
  nickname: z.string().nullable(),
  sprite_key: z.string(),
  level: z.number().int().positive(),
  growth_stage: growthStageSchema,
  correct_total: z.number().int().nonnegative(),
  current_streak: z.number().int().nonnegative(),
  is_me: z.boolean(),
});

export const rankingsResultSchema = z.object({
  top: z.array(rankingEntrySchema),
  // 초기화 전 사용자(캐릭터 없음)는 랭킹에 포함되지 않는다.
  me: rankingEntrySchema.nullable(),
});

export function parseRpcResult<T extends z.ZodType>(
  schema: T,
  value: unknown,
  context: string
):
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: Response } {
  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      response: internalError(`${context}: invalid RPC response`, result.error),
    };
  }
  return { ok: true, data: result.data };
}

export type InitializeUserData = z.infer<typeof initializeUserResultSchema>;
export type QuizSessionData = z.infer<typeof quizSessionResultSchema>;
export type SubmitAnswerData = z.infer<typeof submitAnswerResultSchema>;
export type CompleteQuizData = z.infer<typeof completeQuizResultSchema>;
export type PurchaseItemData = z.infer<typeof purchaseItemResultSchema>;
export type EquipmentData = z.infer<typeof equipmentResultSchema>;
export type RankingsData = z.infer<typeof rankingsResultSchema>;
