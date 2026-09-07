import type { ApiResponse } from "@/types/api";

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(userMessage(code, status));
    this.name = "ApiClientError";
  }
}

function userMessage(code: string, status: number) {
  if (status === 401) return "로그인이 만료되었어요. 다시 로그인해주세요.";
  if (code === "INSUFFICIENT_COINS") return "코인이 부족해요.";
  if (code === "ALREADY_OWNED") return "이미 보유한 아이템이에요.";
  if (code === "TARGET_TYPE_MISMATCH") return "현재 캐릭터에는 사용할 수 없는 아이템이에요.";
  if (code === "ALREADY_ANSWERED") return "이미 제출한 답이에요.";
  if (status === 404) return "요청한 정보를 찾을 수 없어요.";
  if (status === 409) return "현재 상태에서는 처리할 수 없어요. 화면을 새로고침해주세요.";
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.";
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  let body: ApiResponse<T> | null = null;
  try { body = (await response.json()) as ApiResponse<T>; } catch { /* normalized below */ }
  if (!response.ok || !body || "error" in body) {
    const code = body && "error" in body ? body.error.code : "REQUEST_FAILED";
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.assign(`/login?next=${encodeURIComponent(location.pathname)}`);
    }
    throw new ApiClientError(response.status, code);
  }
  return body.data;
}
