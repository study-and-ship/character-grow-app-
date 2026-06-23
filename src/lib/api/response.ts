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
  code: ErrorCode | (string & {}),
  message: string,
  status?: number,
  extra?: Record<string, unknown>
) {
  const httpStatus =
    status ?? ERROR_STATUS[code as ErrorCode] ?? 400;
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status: httpStatus }
  );
}
