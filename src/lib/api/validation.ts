import { z } from "zod";
import { fail } from "./response";

export const positiveIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .safe();

export const nicknameSchema = z.string().trim().min(1).max(20);

export const equipmentSlotSchema = z.enum([
  "pattern",
  "hat",
  "glasses",
  "nest",
]);

export const itemTargetTypeSchema = z.enum(["egg", "pet"]);

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  },
  { message: "유효한 날짜가 아닙니다." }
);

export const yearMonthSchema = z.object({
  year: z.coerce.number().int().min(1000).max(9999),
  month: z.coerce.number().int().min(1).max(12),
});

export const initUserBodySchema = z
  .object({
    nickname: nicknameSchema,
  })
  .strict();

export const startQuizBodySchema = z
  .object({
    category_id: positiveIdSchema,
  })
  .strict();

export const submitAnswerBodySchema = z
  .object({
    quiz_session_question_id: positiveIdSchema,
    selected_choice_id: positiveIdSchema,
  })
  .strict();

export const equipItemBodySchema = z
  .object({
    user_item_id: positiveIdSchema,
  })
  .strict();

export const itemFilterSchema = z.object({
  target_type: itemTargetTypeSchema.optional(),
  slot: equipmentSlotSchema.optional(),
});

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: Response }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: fail("VALIDATION", "올바른 JSON 요청 본문이 필요합니다.", 400),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: fail("VALIDATION", "요청 값이 올바르지 않습니다.", 400, {
        fields: z.flattenError(result.error).fieldErrors,
      }),
    };
  }

  return { ok: true, data: result.data };
}

export function parseValue<T extends z.ZodType>(
  value: unknown,
  schema: T,
  message = "요청 값이 올바르지 않습니다."
):
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: Response } {
  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      response: fail("VALIDATION", message, 400),
    };
  }
  return { ok: true, data: result.data };
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}

export function monthRange(year: number, month: number) {
  const start = `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endExclusive = `${nextYear.toString().padStart(4, "0")}-${nextMonth
    .toString()
    .padStart(2, "0")}-01`;
  return { start, endExclusive };
}
