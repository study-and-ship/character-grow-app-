import { describe, expect, it, vi } from "vitest";
import {
  initializeUserResultSchema,
  parseRpcResult,
} from "@/lib/api/rpc-schemas";

const validInitializeResult = {
  profile: {
    id: "117c2a54-8b70-4520-89f6-4bf17dc410c1",
    nickname: "펫집사",
    coins: 300,
  },
  character: {
    id: 1,
    character_type_id: 2,
    level: 1,
    exp: 0,
    total_exp: 0,
    growth_stage: "egg",
    hatched_at: null,
  },
  streak: {
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
  },
  is_new_user: true,
};

describe("RPC response validation", () => {
  it("accepts the documented initialize_user response", () => {
    expect(initializeUserResultSchema.parse(validInitializeResult)).toEqual(
      validInitializeResult
    );
  });

  it("returns an internal error for a malformed RPC response", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = parseRpcResult(
      initializeUserResultSchema,
      { profile: null },
      "test"
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toMatchObject({
        error: { code: "INTERNAL" },
      });
    }
    consoleSpy.mockRestore();
  });
});
