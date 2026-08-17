import type { PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { domainErrorMap, rpcErrorResponse } from "@/lib/api/errors";

function rpcError(message: string, code = "P0001"): PostgrestError {
  return {
    code,
    message,
    details: "",
    hint: "",
  } as unknown as PostgrestError;
}

describe("RPC error mapping", () => {
  it.each([
    ["UNAUTHORIZED", 401, "UNAUTHORIZED"],
    ["FORBIDDEN", 403, "FORBIDDEN"],
    ["INVALID_NICKNAME", 400, "VALIDATION"],
    ["QUIZ_SESSION_NOT_FOUND", 404, "QUIZ_SESSION_NOT_FOUND"],
    ["CATEGORY_NOT_FOUND", 404, "CATEGORY_NOT_FOUND"],
    ["ITEM_NOT_FOUND", 404, "ITEM_NOT_FOUND"],
    ["USER_ITEM_NOT_FOUND", 404, "USER_ITEM_NOT_FOUND"],
    ["USER_NOT_INITIALIZED", 409, "USER_NOT_INITIALIZED"],
    ["NO_ACTIVE_CHARACTER_TYPE", 409, "NO_ACTIVE_CHARACTER_TYPE"],
    ["NOT_ENOUGH_QUESTIONS", 409, "NOT_ENOUGH_QUESTIONS"],
    [
      "QUIZ_SESSION_NOT_IN_PROGRESS",
      409,
      "QUIZ_SESSION_NOT_IN_PROGRESS",
    ],
    ["QUIZ_SESSION_NOT_READY", 409, "QUIZ_SESSION_NOT_READY"],
    ["QUESTION_NOT_IN_SESSION", 409, "QUESTION_NOT_IN_SESSION"],
    ["INVALID_CHOICE", 409, "INVALID_CHOICE"],
    ["ANSWER_ALREADY_SUBMITTED", 409, "ANSWER_ALREADY_SUBMITTED"],
    ["CHARACTER_NOT_FOUND", 409, "CHARACTER_NOT_FOUND"],
    ["ITEM_ALREADY_OWNED", 409, "ITEM_ALREADY_OWNED"],
    ["ITEM_TARGET_MISMATCH", 409, "ITEM_TARGET_MISMATCH"],
    ["INSUFFICIENT_COINS", 409, "INSUFFICIENT_COINS"],
    ["EQUIPMENT_SLOT_MISMATCH", 409, "EQUIPMENT_SLOT_MISMATCH"],
  ])("maps %s to HTTP %i", async (source, status, publicCode) => {
    const response = rpcErrorResponse(rpcError(source), "test");
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: publicCode },
    });
  });

  it("defines every public domain error with a valid status", () => {
    for (const error of Object.values(domainErrorMap)) {
      expect(error.status).toBeGreaterThanOrEqual(400);
      expect(error.status).toBeLessThan(600);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });

  it("hides unexpected database details", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = rpcErrorResponse(
      rpcError("sensitive database details", "XX000"),
      "unexpected"
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL",
        message: "요청을 처리하지 못했습니다.",
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
