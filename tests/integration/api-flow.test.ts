import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type {
  ApiResponse,
  CompleteQuizData,
  EquipmentData,
  HomeData,
  InitializeUserData,
  InventoryData,
  PurchaseItemData,
  QuestionCategoryData,
  QuizSessionData,
  RankingsData,
  ShopItemsData,
  StudyCalendarData,
  StudyRecordData,
  SubmitAnswerData,
  UserMeData,
} from "@/interface/api";
import type { Database } from "@/lib/supabase/database.types";

const root = path.resolve(__dirname, "../..");
const baseUrl = "http://127.0.0.1:3100";

let server: ChildProcess | undefined;
let serverLogs = "";
let cookieHeader = "";
let supabaseUrl = "";
let publishableKey = "";
/** RLS를 우회하는 테스트 전용 클라이언트. 오답 선택 등 검증 준비에만 사용한다. */
let admin: SupabaseClient<Database>;

function parseCliEnv(output: string) {
  const values: Record<string, string> = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    try {
      values[key] = JSON.parse(rawValue);
    } catch {
      values[key] = rawValue;
    }
  }
  return values;
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null) {
      throw new Error(`Next server stopped unexpectedly:\n${serverLogs}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // 서버가 포트를 열 때까지 재시도한다.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next server did not become ready:\n${serverLogs}`);
}

async function signUpTestUser(label: string) {
  const cookies = new Map<string, string>();
  const authClient = createServerClient<Database>(
    supabaseUrl,
    publishableKey,
    {
      realtime: {
        transport: WebSocket as unknown as WebSocketLikeConstructor,
      },
      cookies: {
        getAll() {
          return Array.from(cookies, ([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet: Array<{ name: string; value: string }>) {
          for (const cookie of cookiesToSet) {
            cookies.set(cookie.name, cookie.value);
          }
        },
      },
    }
  );
  const email = `api-test-${label}-${Date.now()}@example.com`;
  const { data, error } = await authClient.auth.signUp({
    email,
    password: "QuizPet-test-1234!",
  });
  if (error || !data.session) {
    throw new Error(`Local test user sign-up failed: ${error?.message}`);
  }
  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join(
    "; "
  );
}

async function api<T>(
  pathname: string,
  init?: RequestInit,
  authenticated = true,
  cookie = cookieHeader
) {
  const headers = new Headers(init?.headers);
  if (authenticated && cookie) headers.set("Cookie", cookie);
  if (init?.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers,
  });
  const body = (await response.json()) as ApiResponse<T>;
  return { response, body };
}

function expectData<T>(result: ApiResponse<T>): T {
  if ("error" in result) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.data;
}

beforeAll(async () => {
  const statusOutput = execFileSync(
    "npx",
    ["supabase", "status", "-o", "env"],
    {
      cwd: root,
      encoding: "utf8",
    }
  );
  const localEnv = parseCliEnv(statusOutput);
  supabaseUrl = localEnv.API_URL;
  publishableKey = localEnv.PUBLISHABLE_KEY || localEnv.ANON_KEY;
  const secretKey = localEnv.SECRET_KEY || localEnv.SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !publishableKey ||
    !secretKey ||
    !/^http:\/\/(127\.0\.0\.1|localhost):/.test(supabaseUrl)
  ) {
    throw new Error(
      "Integration tests require a running local Supabase instance."
    );
  }

  admin = createClient<Database>(supabaseUrl, secretKey, {
    auth: { persistSession: false },
    realtime: {
      transport: WebSocket as unknown as WebSocketLikeConstructor,
    },
  });

  execFileSync("npx", ["supabase", "db", "reset"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });

  const nextBin = path.join(root, "node_modules/next/dist/bin/next");
  server = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3100"],
    {
      cwd: root,
      env: {
        ...process.env,
        NEXT_DIST_DIR: ".next-integration",
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  server.stdout?.on("data", (chunk) => {
    serverLogs = `${serverLogs}${chunk.toString()}`.slice(-30_000);
  });
  server.stderr?.on("data", (chunk) => {
    serverLogs = `${serverLogs}${chunk.toString()}`.slice(-30_000);
  });
  await waitForServer();

  cookieHeader = await signUpTestUser("main");
});

afterAll(async () => {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      server?.once("exit", () => resolve());
      setTimeout(resolve, 5_000);
    });
  }
});

describe("QuizPet API flow", () => {
  // 소유권 경계 테스트에서 다른 사용자의 세션 ID로 사용한다.
  let heartsSessionId = 0;

  it("rejects unauthenticated access", async () => {
    const { response, body } = await api<UserMeData>(
      "/api/users/me",
      undefined,
      false
    );
    expect(response.status).toBe(401);
    expect(body).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("initializes a user idempotently and exposes bootstrap data", async () => {
    const before = await api<UserMeData>("/api/users/me");
    expect(before.response.status).toBe(200);
    expect(expectData(before.body).initialized).toBe(false);

    const invalid = await api<InitializeUserData>("/api/users/init", {
      method: "POST",
      body: JSON.stringify({ nickname: "   " }),
    });
    expect(invalid.response.status).toBe(400);
    expect(invalid.body).toMatchObject({ error: { code: "VALIDATION" } });

    const first = await api<InitializeUserData>("/api/users/init", {
      method: "POST",
      body: JSON.stringify({ nickname: "통합테스트" }),
    });
    expect(first.response.status).toBe(200);
    const firstData = expectData(first.body);
    expect(firstData.is_new_user).toBe(true);
    expect(firstData.profile.coins).toBe(300);

    const repeated = await api<InitializeUserData>("/api/users/init", {
      method: "POST",
      body: JSON.stringify({ nickname: "통합테스트" }),
    });
    expect(repeated.response.status).toBe(200);
    const repeatedData = expectData(repeated.body);
    expect(repeatedData.is_new_user).toBe(false);
    expect(repeatedData.character.id).toBe(firstData.character.id);

    const after = await api<UserMeData>("/api/users/me");
    expect(expectData(after.body).initialized).toBe(true);
  });

  it("runs quiz, reward, shop, equipment and record APIs end-to-end", async () => {
    const categoriesResponse = await api<QuestionCategoryData[]>(
      "/api/question-categories"
    );
    const categories = expectData(categoriesResponse.body);
    expect(categories.length).toBeGreaterThan(0);

    const startResponse = await api<QuizSessionData>(
      "/api/quiz-sessions/today",
      {
        method: "POST",
        body: JSON.stringify({ category_id: categories[0].id }),
      }
    );
    const session = expectData(startResponse.body);
    expect(session.questions).toHaveLength(5);
    expect(session.answered_count).toBe(0);

    const repeatedStart = await api<QuizSessionData>(
      "/api/quiz-sessions/today",
      {
        method: "POST",
        body: JSON.stringify({ category_id: categories[0].id }),
      }
    );
    expect(expectData(repeatedStart.body).id).toBe(session.id);

    let latestAnswer: SubmitAnswerData | undefined;
    let firstHearts: number | undefined;
    for (const [index, question] of session.questions.entries()) {
      const selectedChoiceId = question.choices[0].id;
      const answerResponse = await api<SubmitAnswerData>(
        `/api/quiz-sessions/${session.id}/answers`,
        {
          method: "POST",
          body: JSON.stringify({
            quiz_session_question_id: question.session_question_id,
            selected_choice_id: selectedChoiceId,
          }),
        }
      );
      latestAnswer = expectData(answerResponse.body);

      if (index === 0) {
        firstHearts = latestAnswer.hearts_remaining;
        const duplicate = await api<SubmitAnswerData>(
          `/api/quiz-sessions/${session.id}/answers`,
          {
            method: "POST",
            body: JSON.stringify({
              quiz_session_question_id: question.session_question_id,
              selected_choice_id: selectedChoiceId,
            }),
          }
        );
        expect(expectData(duplicate.body).hearts_remaining).toBe(firstHearts);
      }

      // 하트를 다 쓰면 조기 완료되므로 남은 문제는 제출하지 않는다.
      if (latestAnswer.status === "ready_to_complete") break;
    }
    expect(latestAnswer?.status).toBe("ready_to_complete");
    expect(latestAnswer?.can_complete).toBe(true);
    const answeredCount = latestAnswer?.answered_count ?? 0;

    const restored = await api<QuizSessionData>(
      `/api/quiz-sessions/${session.id}`
    );
    expect(expectData(restored.body).answered_count).toBe(answeredCount);

    const completeResponse = await api<CompleteQuizData>(
      `/api/quiz-sessions/${session.id}/complete`,
      { method: "POST" }
    );
    const completed = expectData(completeResponse.body);
    expect(completed.session.status).toBe("completed");

    // 보상 규칙: 정답 +10 EXP / 오답 -5 EXP, 정답 +20 코인 + 레벨업당 100 코인
    const wrongCount = answeredCount - completed.session.correct_count;
    expect(completed.rewards.exp).toBe(
      completed.session.correct_count * 10 - wrongCount * 5
    );
    expect(completed.rewards.coins).toBe(
      completed.session.correct_count * 20 +
        completed.rewards.level_up_bonus_coins
    );

    const repeatedComplete = await api<CompleteQuizData>(
      `/api/quiz-sessions/${session.id}/complete`,
      { method: "POST" }
    );
    expect(expectData(repeatedComplete.body)).toEqual(completed);

    const homeResponse = await api<HomeData>("/api/users/me/home");
    const home = expectData(homeResponse.body);
    expect(home.today_quiz?.status).toBe("completed");
    expect(home.profile.coins).toBe(completed.rewards.current_coins);

    const shopResponse = await api<ShopItemsData>("/api/shop/items");
    const shop = expectData(shopResponse.body);
    expect(shop.items.length).toBeGreaterThan(0);
    const purchasable = [...shop.items].sort((a, b) => a.price - b.price)[0];

    const purchaseResponse = await api<PurchaseItemData>(
      `/api/shop/items/${purchasable.id}/purchase`,
      { method: "POST" }
    );
    const purchase = expectData(purchaseResponse.body);
    expect(purchase.remaining_coins).toBe(shop.coins - purchasable.price);

    const duplicatePurchase = await api<PurchaseItemData>(
      `/api/shop/items/${purchasable.id}/purchase`,
      { method: "POST" }
    );
    expect(duplicatePurchase.response.status).toBe(409);
    expect(duplicatePurchase.body).toMatchObject({
      error: { code: "ITEM_ALREADY_OWNED" },
    });

    const equipResponse = await api<EquipmentData>(
      `/api/users/me/character/equipment/${purchasable.category.slot}`,
      {
        method: "PUT",
        body: JSON.stringify({ user_item_id: purchase.user_item.id }),
      }
    );
    expect(expectData(equipResponse.body).equipment?.user_item_id).toBe(
      purchase.user_item.id
    );

    const inventoryResponse = await api<InventoryData>(
      "/api/users/me/inventory"
    );
    const inventory = expectData(inventoryResponse.body);
    expect(
      inventory.items.find(
        (item) => item.user_item_id === purchase.user_item.id
      )?.equipped
    ).toBe(true);

    const unequipResponse = await api<EquipmentData>(
      `/api/users/me/character/equipment/${purchasable.category.slot}`,
      { method: "DELETE" }
    );
    expect(expectData(unequipResponse.body).equipment).toBeNull();

    const [year, month] = session.session_date.split("-").map(Number);
    const calendarResponse = await api<StudyCalendarData>(
      `/api/users/me/study-calendar?year=${year}&month=${month}`
    );
    expect(
      expectData(calendarResponse.body).days.some(
        (day) => day.date === session.session_date
      )
    ).toBe(true);

    const recordResponse = await api<StudyRecordData>(
      `/api/users/me/study-records?date=${session.session_date}`
    );
    const record = expectData(recordResponse.body);
    expect(record.session?.questions).toHaveLength(answeredCount);
    expect(record.session?.earned_coins).toBe(completed.rewards.coins);

    const rankingsResponse = await api<RankingsData>("/api/rankings");
    const rankings = expectData(rankingsResponse.body);
    expect(rankings.me?.rank).toBe(1);
    expect(rankings.me?.correct_total).toBe(completed.session.correct_count);
    expect(rankings.top.some((entry) => entry.is_me)).toBe(true);
  });

  it("completes a session early when hearts run out", async () => {
    // 별도 사용자로 진행한다. (사용자당 하루 한 세션 제약)
    const heartsCookie = await signUpTestUser("hearts");
    const heartsApi = <T,>(pathname: string, init?: RequestInit) =>
      api<T>(pathname, init, true, heartsCookie);

    expectData(
      (
        await heartsApi<InitializeUserData>("/api/users/init", {
          method: "POST",
          body: JSON.stringify({ nickname: "하트테스트" }),
        })
      ).body
    );

    const categories = expectData(
      (await heartsApi<QuestionCategoryData[]>("/api/question-categories"))
        .body
    );
    const session = expectData(
      (
        await heartsApi<QuizSessionData>("/api/quiz-sessions/today", {
          method: "POST",
          body: JSON.stringify({ category_id: categories[0].id }),
        })
      ).body
    );
    expect(session.max_hearts).toBe(3);
    heartsSessionId = session.id;

    // API 응답은 정답을 숨기므로, 확실한 오답 선택은 DB에서 직접 고른다.
    const questionIds = session.questions.map(
      (question) => question.question_id
    );
    const { data: wrongChoices, error: wrongChoicesError } = await admin
      .from("question_choices")
      .select("id, question_id")
      .in("question_id", questionIds)
      .eq("is_correct", false);
    if (wrongChoicesError || !wrongChoices) {
      throw new Error(
        `Failed to load wrong choices: ${wrongChoicesError?.message}`
      );
    }
    const wrongChoiceByQuestion = new Map<number, number>();
    for (const choice of wrongChoices) {
      if (!wrongChoiceByQuestion.has(choice.question_id)) {
        wrongChoiceByQuestion.set(choice.question_id, choice.id);
      }
    }

    // 오답 3개 → 하트 0 → 조기 완료 대기 상태
    let latestAnswer: SubmitAnswerData | undefined;
    for (const question of session.questions.slice(0, 3)) {
      const answerResponse = await heartsApi<SubmitAnswerData>(
        `/api/quiz-sessions/${session.id}/answers`,
        {
          method: "POST",
          body: JSON.stringify({
            quiz_session_question_id: question.session_question_id,
            selected_choice_id: wrongChoiceByQuestion.get(
              question.question_id
            ),
          }),
        }
      );
      latestAnswer = expectData(answerResponse.body);
      expect(latestAnswer.is_correct).toBe(false);
    }
    expect(latestAnswer?.hearts_remaining).toBe(0);
    expect(latestAnswer?.status).toBe("ready_to_complete");
    expect(latestAnswer?.can_complete).toBe(true);
    expect(latestAnswer?.answered_count).toBe(3);

    // 조기 완료 후 남은 문제 제출은 거부된다.
    const fourthQuestion = session.questions[3];
    const blocked = await heartsApi<SubmitAnswerData>(
      `/api/quiz-sessions/${session.id}/answers`,
      {
        method: "POST",
        body: JSON.stringify({
          quiz_session_question_id: fourthQuestion.session_question_id,
          selected_choice_id: wrongChoiceByQuestion.get(
            fourthQuestion.question_id
          ),
        }),
      }
    );
    expect(blocked.response.status).toBe(409);
    expect(blocked.body).toMatchObject({
      error: { code: "QUIZ_SESSION_NOT_IN_PROGRESS" },
    });

    // 제출된 3문제 기준으로만 보상: 정답 0 → EXP -15, 코인 0, 레벨 유지
    const completed = expectData(
      (
        await heartsApi<CompleteQuizData>(
          `/api/quiz-sessions/${session.id}/complete`,
          { method: "POST" }
        )
      ).body
    );
    expect(completed.session.correct_count).toBe(0);
    expect(completed.rewards.exp).toBe(-15);
    expect(completed.rewards.coins).toBe(0);
    expect(completed.rewards.level_up_bonus_coins).toBe(0);
    expect(completed.character_growth.after_level).toBe(
      completed.character_growth.before_level
    );

    const homeResponse = await heartsApi<HomeData>("/api/users/me/home");
    const home = expectData(homeResponse.body);
    expect(home.today_quiz?.status).toBe("completed");
    expect(home.today_quiz?.answered_count).toBe(3);
    expect(home.profile.coins).toBe(300);
    expect(home.character.exp).toBe(0);

    // 학습 기록에는 제출한 3문제만 내려온다.
    const recordResponse = await heartsApi<StudyRecordData>(
      `/api/users/me/study-records?date=${session.session_date}`
    );
    const record = expectData(recordResponse.body);
    expect(record.session?.questions).toHaveLength(3);
    expect(
      record.session?.questions.every((question) => !question.is_correct)
    ).toBe(true);
  });

  it("marks yesterday's in-progress session as abandoned on next start", async () => {
    const staleCookie = await signUpTestUser("stale");
    const staleApi = <T,>(pathname: string, init?: RequestInit) =>
      api<T>(pathname, init, true, staleCookie);

    expectData(
      (
        await staleApi<InitializeUserData>("/api/users/init", {
          method: "POST",
          body: JSON.stringify({ nickname: "어제사용자" }),
        })
      ).body
    );
    const categories = expectData(
      (await staleApi<QuestionCategoryData[]>("/api/question-categories"))
        .body
    );
    const first = expectData(
      (
        await staleApi<QuizSessionData>("/api/quiz-sessions/today", {
          method: "POST",
          body: JSON.stringify({ category_id: categories[0].id }),
        })
      ).body
    );

    // 문제 하나만 풀고 방치한 상태를 만든다.
    expectData(
      (
        await staleApi<SubmitAnswerData>(
          `/api/quiz-sessions/${first.id}/answers`,
          {
            method: "POST",
            body: JSON.stringify({
              quiz_session_question_id:
                first.questions[0].session_question_id,
              selected_choice_id: first.questions[0].choices[0].id,
            }),
          }
        )
      ).body
    );

    // 세션 날짜를 어제로 되돌려 "지난 날짜의 풀다 만 세션"을 재현한다.
    const [year, month, day] = first.session_date.split("-").map(Number);
    const yesterday = new Date(Date.UTC(year, month - 1, day - 1))
      .toISOString()
      .slice(0, 10);
    const { error: rewindError } = await admin
      .from("quiz_sessions")
      .update({ session_date: yesterday })
      .eq("id", first.id);
    if (rewindError) {
      throw new Error(`Failed to rewind session date: ${rewindError.message}`);
    }

    // 오늘 세션을 새로 시작하면 어제의 in_progress 세션은 abandoned가 된다.
    const second = expectData(
      (
        await staleApi<QuizSessionData>("/api/quiz-sessions/today", {
          method: "POST",
          body: JSON.stringify({ category_id: categories[0].id }),
        })
      ).body
    );
    expect(second.id).not.toBe(first.id);
    expect(second.status).toBe("in_progress");

    const abandoned = expectData(
      (await staleApi<QuizSessionData>(`/api/quiz-sessions/${first.id}`))
        .body
    );
    expect(abandoned.status).toBe("abandoned");

    // abandoned 세션에는 답안 제출과 완료가 모두 막힌다.
    const blockedAnswer = await staleApi<SubmitAnswerData>(
      `/api/quiz-sessions/${first.id}/answers`,
      {
        method: "POST",
        body: JSON.stringify({
          quiz_session_question_id: first.questions[1].session_question_id,
          selected_choice_id: first.questions[1].choices[0].id,
        }),
      }
    );
    expect(blockedAnswer.response.status).toBe(409);
    expect(blockedAnswer.body).toMatchObject({
      error: { code: "QUIZ_SESSION_NOT_IN_PROGRESS" },
    });

    const blockedComplete = await staleApi<CompleteQuizData>(
      `/api/quiz-sessions/${first.id}/complete`,
      { method: "POST" }
    );
    expect(blockedComplete.response.status).toBe(409);
    expect(blockedComplete.body).toMatchObject({
      error: { code: "QUIZ_SESSION_NOT_READY" },
    });
  });

  it("enforces validation, ownership, and coin boundaries", async () => {
    const boundaryCookie = await signUpTestUser("boundary");
    const boundaryApi = <T,>(pathname: string, init?: RequestInit) =>
      api<T>(pathname, init, true, boundaryCookie);

    // 닉네임 경계: 21자는 거부, 20자는 그대로 저장된다.
    const tooLong = await boundaryApi<InitializeUserData>("/api/users/init", {
      method: "POST",
      body: JSON.stringify({ nickname: "가".repeat(21) }),
    });
    expect(tooLong.response.status).toBe(400);
    expect(tooLong.body).toMatchObject({ error: { code: "VALIDATION" } });

    const maxNickname = "가".repeat(20);
    const initialized = expectData(
      (
        await boundaryApi<InitializeUserData>("/api/users/init", {
          method: "POST",
          body: JSON.stringify({ nickname: maxNickname }),
        })
      ).body
    );
    expect(initialized.profile.nickname).toBe(maxNickname);

    // 다른 사용자의 세션은 조회할 수 없다.
    expect(heartsSessionId).toBeGreaterThan(0);
    const foreign = await boundaryApi<QuizSessionData>(
      `/api/quiz-sessions/${heartsSessionId}`
    );
    expect(foreign.response.status).toBe(403);
    expect(foreign.body).toMatchObject({ error: { code: "FORBIDDEN" } });

    // 상점 필터: 잘못된 slot은 400, 조합 필터는 조건에 맞는 상품만 반환한다.
    const badFilter = await boundaryApi<ShopItemsData>(
      "/api/shop/items?slot=shoes"
    );
    expect(badFilter.response.status).toBe(400);
    expect(badFilter.body).toMatchObject({ error: { code: "VALIDATION" } });

    const eggHats = expectData(
      (
        await boundaryApi<ShopItemsData>(
          "/api/shop/items?target_type=egg&slot=hat"
        )
      ).body
    );
    expect(eggHats.items.length).toBeGreaterThan(0);
    expect(
      eggHats.items.every(
        (item) =>
          item.category.target_type === "egg" && item.category.slot === "hat"
      )
    ).toBe(true);

    // 알 단계 사용자도 target_type=pet으로 펫 상품을 미리 볼 수 있다.
    const petItems = expectData(
      (await boundaryApi<ShopItemsData>("/api/shop/items?target_type=pet"))
        .body
    );
    expect(petItems.character.target_type).toBe("egg");
    expect(petItems.items.length).toBeGreaterThan(0);
    expect(
      petItems.items.every((item) => item.category.target_type === "pet")
    ).toBe(true);

    // 인벤토리 필터 검증도 동일한 규칙을 따른다.
    const badInventoryFilter = await boundaryApi<InventoryData>(
      "/api/users/me/inventory?target_type=plant"
    );
    expect(badInventoryFilter.response.status).toBe(400);

    // 코인 부족: 잔액을 10코인으로 만들고 구매를 시도한다.
    const { error: coinError } = await admin
      .from("profiles")
      .update({ coins: 10 })
      .eq("id", initialized.profile.id);
    if (coinError) {
      throw new Error(`Failed to adjust coins: ${coinError.message}`);
    }

    const shop = expectData(
      (await boundaryApi<ShopItemsData>("/api/shop/items")).body
    );
    const target = shop.items[0];
    const poorPurchase = await boundaryApi<PurchaseItemData>(
      `/api/shop/items/${target.id}/purchase`,
      { method: "POST" }
    );
    expect(poorPurchase.response.status).toBe(409);
    expect(poorPurchase.body).toMatchObject({
      error: { code: "INSUFFICIENT_COINS" },
    });
  });

  it("covers answer, item target, slot, and record edge cases", async () => {
    const edgeCookie = await signUpTestUser("edge");
    const edgeApi = <T,>(pathname: string, init?: RequestInit) =>
      api<T>(pathname, init, true, edgeCookie);

    expectData(
      (
        await edgeApi<InitializeUserData>("/api/users/init", {
          method: "POST",
          body: JSON.stringify({ nickname: "엣지테스트" }),
        })
      ).body
    );

    // 다른 선택지로 재제출하면 답을 바꿀 수 없다.
    const categories = expectData(
      (await edgeApi<QuestionCategoryData[]>("/api/question-categories")).body
    );
    const session = expectData(
      (
        await edgeApi<QuizSessionData>("/api/quiz-sessions/today", {
          method: "POST",
          body: JSON.stringify({ category_id: categories[0].id }),
        })
      ).body
    );
    const firstQuestion = session.questions[0];
    expectData(
      (
        await edgeApi<SubmitAnswerData>(
          `/api/quiz-sessions/${session.id}/answers`,
          {
            method: "POST",
            body: JSON.stringify({
              quiz_session_question_id: firstQuestion.session_question_id,
              selected_choice_id: firstQuestion.choices[0].id,
            }),
          }
        )
      ).body
    );
    const changedAnswer = await edgeApi<SubmitAnswerData>(
      `/api/quiz-sessions/${session.id}/answers`,
      {
        method: "POST",
        body: JSON.stringify({
          quiz_session_question_id: firstQuestion.session_question_id,
          selected_choice_id: firstQuestion.choices[1].id,
        }),
      }
    );
    expect(changedAnswer.response.status).toBe(409);
    expect(changedAnswer.body).toMatchObject({
      error: { code: "ANSWER_ALREADY_SUBMITTED" },
    });

    // 존재하지 않는 세션은 404.
    const missingSession = await edgeApi<QuizSessionData>(
      "/api/quiz-sessions/999999"
    );
    expect(missingSession.response.status).toBe(404);
    expect(missingSession.body).toMatchObject({
      error: { code: "QUIZ_SESSION_NOT_FOUND" },
    });

    // 알 단계 사용자는 펫 아이템을 구매할 수 없다.
    const petItems = expectData(
      (await edgeApi<ShopItemsData>("/api/shop/items?target_type=pet")).body
    );
    const petItem = petItems.items[0];
    const mismatchPurchase = await edgeApi<PurchaseItemData>(
      `/api/shop/items/${petItem.id}/purchase`,
      { method: "POST" }
    );
    expect(mismatchPurchase.response.status).toBe(409);
    expect(mismatchPurchase.body).toMatchObject({
      error: { code: "ITEM_TARGET_MISMATCH" },
    });

    // 알 무늬 아이템을 사서 다른 슬롯에 장착하면 거부된다.
    const eggPatterns = expectData(
      (
        await edgeApi<ShopItemsData>(
          "/api/shop/items?target_type=egg&slot=pattern"
        )
      ).body
    );
    const patternItem = eggPatterns.items[0];
    const purchase = expectData(
      (
        await edgeApi<PurchaseItemData>(
          `/api/shop/items/${patternItem.id}/purchase`,
          { method: "POST" }
        )
      ).body
    );

    const wrongSlot = await edgeApi<EquipmentData>(
      "/api/users/me/character/equipment/hat",
      {
        method: "PUT",
        body: JSON.stringify({ user_item_id: purchase.user_item.id }),
      }
    );
    expect(wrongSlot.response.status).toBe(409);
    expect(wrongSlot.body).toMatchObject({
      error: { code: "EQUIPMENT_SLOT_MISMATCH" },
    });

    const equipped = expectData(
      (
        await edgeApi<EquipmentData>(
          "/api/users/me/character/equipment/pattern",
          {
            method: "PUT",
            body: JSON.stringify({ user_item_id: purchase.user_item.id }),
          }
        )
      ).body
    );
    expect(equipped.equipment?.user_item_id).toBe(purchase.user_item.id);

    // 보유하지 않은 아이템 장착은 404.
    const missingItem = await edgeApi<EquipmentData>(
      "/api/users/me/character/equipment/pattern",
      {
        method: "PUT",
        body: JSON.stringify({ user_item_id: 999999 }),
      }
    );
    expect(missingItem.response.status).toBe(404);
    expect(missingItem.body).toMatchObject({
      error: { code: "USER_ITEM_NOT_FOUND" },
    });

    // 빈 슬롯 해제는 멱등하게 성공한다.
    const emptyUnequip = expectData(
      (
        await edgeApi<EquipmentData>(
          "/api/users/me/character/equipment/glasses",
          { method: "DELETE" }
        )
      ).body
    );
    expect(emptyUnequip.equipment).toBeNull();

    // 인벤토리 필터 조합: 슬롯 일치만 남고 다른 대상은 빈 목록.
    const patternInventory = expectData(
      (await edgeApi<InventoryData>("/api/users/me/inventory?slot=pattern"))
        .body
    );
    expect(patternInventory.items).toHaveLength(1);
    expect(patternInventory.items[0].equipped).toBe(true);

    const petInventory = expectData(
      (await edgeApi<InventoryData>("/api/users/me/inventory?target_type=pet"))
        .body
    );
    expect(petInventory.items).toHaveLength(0);

    // 달력 파라미터 검증과 기록 없는 날짜 조회.
    const badMonth = await edgeApi<StudyCalendarData>(
      "/api/users/me/study-calendar?year=2026&month=13"
    );
    expect(badMonth.response.status).toBe(400);
    expect(badMonth.body).toMatchObject({ error: { code: "VALIDATION" } });

    const emptyRecord = expectData(
      (
        await edgeApi<StudyRecordData>(
          "/api/users/me/study-records?date=1999-01-01"
        )
      ).body
    );
    expect(emptyRecord.session).toBeNull();
  });
});
