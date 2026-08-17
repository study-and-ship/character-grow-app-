import type { PostgrestError } from "@supabase/supabase-js";
import { fail, internalError, type ApiErrorCode } from "./response";

/** PostgreSQL raise exception의 errcode. RPC 도메인 오류는 전부 이 코드로 발생한다. */
export const PG_RAISE_ERROR_CODE = "P0001";

type DomainError = {
  publicCode: ApiErrorCode;
  message: string;
  status: number;
};

/** RPC가 raise exception의 message로 사용하는 도메인 오류 코드. */
type RpcErrorMessage =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_NICKNAME"
  | "QUIZ_SESSION_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "ITEM_NOT_FOUND"
  | "USER_ITEM_NOT_FOUND"
  | "USER_NOT_INITIALIZED"
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

const DOMAIN_ERRORS = {
  UNAUTHORIZED: {
    publicCode: "UNAUTHORIZED",
    message: "로그인이 필요합니다.",
    status: 401,
  },
  FORBIDDEN: {
    publicCode: "FORBIDDEN",
    message: "해당 데이터에 접근할 수 없습니다.",
    status: 403,
  },
  INVALID_NICKNAME: {
    publicCode: "VALIDATION",
    message: "닉네임 형식이 올바르지 않습니다.",
    status: 400,
  },
  QUIZ_SESSION_NOT_FOUND: {
    publicCode: "QUIZ_SESSION_NOT_FOUND",
    message: "퀴즈 세션을 찾을 수 없습니다.",
    status: 404,
  },
  CATEGORY_NOT_FOUND: {
    publicCode: "CATEGORY_NOT_FOUND",
    message: "활성 문제 카테고리를 찾을 수 없습니다.",
    status: 404,
  },
  ITEM_NOT_FOUND: {
    publicCode: "ITEM_NOT_FOUND",
    message: "판매 중인 아이템을 찾을 수 없습니다.",
    status: 404,
  },
  USER_ITEM_NOT_FOUND: {
    publicCode: "USER_ITEM_NOT_FOUND",
    message: "보유 아이템을 찾을 수 없습니다.",
    status: 404,
  },
  USER_NOT_INITIALIZED: {
    publicCode: "USER_NOT_INITIALIZED",
    message: "사용자 초기화가 필요합니다.",
    status: 409,
  },
  NO_ACTIVE_CHARACTER_TYPE: {
    publicCode: "NO_ACTIVE_CHARACTER_TYPE",
    message: "배정 가능한 펫 종류가 없습니다.",
    status: 409,
  },
  NOT_ENOUGH_QUESTIONS: {
    publicCode: "NOT_ENOUGH_QUESTIONS",
    message: "출제 가능한 문제가 부족합니다.",
    status: 409,
  },
  QUIZ_SESSION_NOT_IN_PROGRESS: {
    publicCode: "QUIZ_SESSION_NOT_IN_PROGRESS",
    message: "답안을 제출할 수 없는 세션 상태입니다.",
    status: 409,
  },
  QUIZ_SESSION_NOT_READY: {
    publicCode: "QUIZ_SESSION_NOT_READY",
    message: "모든 문제의 답안을 먼저 제출해야 합니다.",
    status: 409,
  },
  QUESTION_NOT_IN_SESSION: {
    publicCode: "QUESTION_NOT_IN_SESSION",
    message: "세션에 포함되지 않은 문제입니다.",
    status: 409,
  },
  INVALID_CHOICE: {
    publicCode: "INVALID_CHOICE",
    message: "해당 문제에 속하지 않는 보기입니다.",
    status: 409,
  },
  ANSWER_ALREADY_SUBMITTED: {
    publicCode: "ANSWER_ALREADY_SUBMITTED",
    message: "이미 다른 답안을 제출했습니다.",
    status: 409,
  },
  CHARACTER_NOT_FOUND: {
    publicCode: "CHARACTER_NOT_FOUND",
    message: "보상을 받을 캐릭터가 없습니다.",
    status: 409,
  },
  ITEM_ALREADY_OWNED: {
    publicCode: "ITEM_ALREADY_OWNED",
    message: "이미 보유한 아이템입니다.",
    status: 409,
  },
  ITEM_TARGET_MISMATCH: {
    publicCode: "ITEM_TARGET_MISMATCH",
    message: "현재 캐릭터 상태에서 사용할 수 없는 아이템입니다.",
    status: 409,
  },
  INSUFFICIENT_COINS: {
    publicCode: "INSUFFICIENT_COINS",
    message: "코인이 부족합니다.",
    status: 409,
  },
  EQUIPMENT_SLOT_MISMATCH: {
    publicCode: "EQUIPMENT_SLOT_MISMATCH",
    message: "요청 슬롯과 아이템 슬롯이 다릅니다.",
    status: 409,
  },
} satisfies Record<RpcErrorMessage, DomainError>;

export function rpcErrorResponse(error: PostgrestError, context: string) {
  const domain =
    error.code === PG_RAISE_ERROR_CODE &&
    Object.hasOwn(DOMAIN_ERRORS, error.message)
      ? DOMAIN_ERRORS[error.message as RpcErrorMessage]
      : null;
  if (domain) {
    return fail(domain.publicCode, domain.message, domain.status);
  }
  return internalError(context, error);
}

export function queryErrorResponse(error: PostgrestError, context: string) {
  return internalError(context, error);
}

/** 조회형 라우트에서 프로필/캐릭터가 없을 때 공통으로 쓰는 응답. */
export function userNotInitializedResponse() {
  return fail("USER_NOT_INITIALIZED", "사용자 초기화가 필요합니다.", 409);
}

export const domainErrorMap = DOMAIN_ERRORS;
