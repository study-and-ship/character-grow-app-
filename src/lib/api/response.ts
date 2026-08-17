import { NextResponse } from "next/server";

/**
 * 공통 API 응답 헬퍼 (명세서 0.3 / 0.4 기준).
 *
 *   성공: { "data": ... }
 *   실패: { "error": { "code": ..., "message": ... } }
 */

/** 공통 에러 코드 → 기본 HTTP 상태 매핑 (명세서 0.4). */
export const ERROR_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

/**
 * 클라이언트에 노출하는 공개 오류 코드의 전체 집합.
 * 새 도메인 오류를 추가할 때 여기에도 등록해야 fail()에서 사용할 수 있다.
 */
export type ApiErrorCode =
  | ErrorCode
  | "USER_NOT_INITIALIZED"
  | "QUIZ_SESSION_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "ITEM_NOT_FOUND"
  | "USER_ITEM_NOT_FOUND"
  | "NO_ACTIVE_CHARACTER_TYPE"
  | "NOT_ENOUGH_QUESTIONS"
  | "QUIZ_SESSION_NOT_IN_PROGRESS"
  | "QUIZ_SESSION_NOT_READY"
  | "QUESTION_NOT_IN_SESSION"
  | "INVALID_CHOICE"
  | "ANSWER_ALREADY_SUBMITTED"
  | "CHARACTER_NOT_FOUND"
  | "ITEM_ALREADY_OWNED"
  | "ITEM_TARGET_MISMATCH"
  | "INSUFFICIENT_COINS"
  | "EQUIPMENT_SLOT_MISMATCH";

/** 오류 응답에 함께 내려줄 수 있는 추가 정보 (VALIDATION의 필드별 상세). */
export type FailExtra = {
  fields?: Record<string, string[] | undefined>;
};

/** 성공 응답. status 기본 200. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * 실패 응답.
 * code 가 ERROR_STATUS 에 있으면 해당 HTTP 상태를 자동 적용하고,
 * 도메인 전용 코드(NOT_ENOUGH_QUESTIONS 등)는 status 를 직접 넘긴다.
 */
export function fail(
  code: ApiErrorCode,
  message: string,
  status?: number,
  extra?: FailExtra
) {
  const baseStatus =
    code in ERROR_STATUS ? ERROR_STATUS[code as ErrorCode] : 400;
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status: status ?? baseStatus }
  );
}

/** 예상하지 못한 서버 오류는 상세 내용을 노출하지 않고 서버 로그에만 남긴다. */
export function internalError(context: string, error?: unknown) {
  console.error(`[api] ${context}`, error);
  return fail("INTERNAL", "요청을 처리하지 못했습니다.", 500);
}
