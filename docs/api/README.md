# 퀴즈펫 화면별 API 목차

이 문서는 화면 구현에 필요한 API를 빠르게 찾기 위한 목차입니다. 요청·응답·처리 순서·DB 접근·오류 정의는 연결된 API별 상세 문서에서 관리합니다.

> 상태: 아래 API 엔드포인트 16개가 구현되어 있으며, 이 문서의 프론트엔드 API 명세를 공개 계약으로 사용합니다.
> 구현·검증 상태는 [`API 문서 구현·검증 체크리스트`](./implementation-checklist.md)에서,
> 아직 구현하지 않은 작업은 [`백엔드 백로그`](./backlog.md)에서 확인합니다.

## 문서 읽는 방법

각 API 상세 문서는 다음 두 영역을 분리해서 관리합니다.

1. `프론트엔드 API 명세`: URL, 인증, 요청, 응답, 오류처럼 프론트엔드가 의존하는 계약
2. `서버 구현 참고`: Route Handler가 호출할 RPC, 파라미터 변환, 트랜잭션과 사용 테이블

프론트엔드는 PostgreSQL RPC를 직접 호출하지 않고 이 문서의 `/api/...` Route Handler만 호출합니다. RPC나 테이블 구현이 바뀌더라도 프론트엔드 API 계약은 가능한 한 유지합니다.

## 공통 원칙

- `🔒` 표시는 Supabase Auth 로그인이 필요합니다.
- 사용자 ID는 요청 Body나 Query로 받지 않고 인증 세션에서 가져옵니다.
- 날짜 기준은 서버의 `Asia/Seoul` 날짜입니다.
- 성공 응답은 `{ "data": ... }`, 실패 응답은 `{ "error": { "code", "message" } }` 형식을 사용합니다.
- 화면 최초 조회는 화면 단위 API를 사용하고, 데이터 변경은 기능 단위 API로 분리합니다.
- RPC 오류는 Route Handler에서 문서에 정의된 HTTP 상태와 오류 코드로 변환합니다.

## 앱을 켰을 때 어느 화면으로 보낼지

로그인([Supabase Auth](./auth/supabase-auth.md)) 성공 후, 사용자 상태에 따라 첫 화면이 달라집니다.

```text
로그인 성공
  → GET /api/users/me
      initialized: false → /start 화면 → POST /api/users/init (닉네임) → /home
      initialized: true  → /home 화면 → GET /api/users/me/home
```

홈 응답의 `today_quiz`로 오늘 퀴즈 진입 상태를 분기합니다:
`null`이면 주제 선택(`/topic`)부터, `in_progress`/`ready_to_complete`면
`GET /api/quiz-sessions/:sessionId`로 복원, `completed`면 완료 요약을 표시합니다.

## 서버가 주는 이름표(키)와 픽셀 그림 연결하기 (중요)

서버는 이미지 파일이 아니라 `"cat"`, `"ribbon"` 같은 **이름표(키)** 만 내려줍니다.
프론트는 이 키로 어떤 픽셀 그림을 그릴지 찾습니다. DB의 키와 프론트 그림 키는 이름이 똑같아야 합니다.

| API 필드 | 값 | 프론트 대응 |
| --- | --- | --- |
| `character_type.sprite_key` | `bunny`, `cat`, `hamster` | `PetKey` (`src/lib/pixel/`의 펫 스프라이트) |
| `growth_stage` | `egg`, `baby`, `child`, `teen`, `adult` | 성장 단계별 렌더링 (egg = 부화 전) |
| 아이템 `asset_key` (펫용) | `ribbon`, `cap`, `crown`, `wizard`, `glasses`, `sun`, `heart_g` | `src/lib/pixel/accessories.ts`의 `ACCS` 키 |
| 아이템 `asset_key` (알용) | `pat_flower`, `pat_star`, `pat_heart`, `hat_bow`, `hat_crown`, `hat_party`, `nest_straw`, `nest_flower` | `src/lib/pixel/egg.ts`의 `EGG_ACCS` 키 |
| 캐릭터 `exp` / `required_exp` | 현재 레벨 내 경험치 / 다음 레벨까지 필요량(`20 + level × 30`) | 경험치 게이지 = `exp / required_exp` |

새 상점 아이템을 DB에 추가할 때는 같은 `asset_key`의 픽셀 에셋을 프론트에도 함께 추가해야 합니다.

## 퀴즈 세션 상태 요약

**세션 = 오늘 하루치 퀴즈 한 판**입니다. 하루에 한 판만 만들 수 있고, 5문제가 한 세트입니다.
세션의 진행 상태(`status`)는 이렇게 흘러갑니다:

`in_progress`(풀이 중) → `ready_to_complete`(전량 제출 또는 하트 0 조기 완료) → `completed`(보상 확정).
지난 날짜의 `in_progress` 세션은 다음 세션 시작 시 `abandoned`로 폐기됩니다.
상세 규칙은 [세션 조회](./quiz/get-session.md)와 [퀴즈 완료](./quiz/post-complete.md)를 참고합니다.

## 보상·연출 규칙 요약

채점과 보상 계산은 전부 서버가 하므로, 프론트는 목업의 로컬 계산 대신 응답 값을 그대로 표시합니다.

- 답안 응답(`is_correct`, `correct_choice_*`, `explanation`)으로 정답/오답 피드백과 해설을 그립니다.
- `can_complete: true`가 되는 즉시 결과 화면으로 이동해 완료 API를 호출합니다.
- 완료 응답의 `rewards.exp`는 오답 감점(−5) 때문에 **음수일 수 있습니다.**
- 레벨업 연출은 `character_growth.before_level`/`after_level`과 `rewards.level_up_bonus_coins`(레벨업당 100)를 사용합니다.
- 부화 연출은 `character_growth.hatched`로 판단하며, 부화 시 장착 아이템은 서버가 전부 해제합니다.
- 구매는 장착을 포함하지 않습니다. "구매 즉시 장착" UX는 구매 → 장착 API를 이어서 호출합니다.

## 프론트엔드 공통 호출 예제

같은 출처의 Next.js API를 호출하므로 Supabase 세션 쿠키가 함께 전달됩니다. 프론트엔드는 Supabase RPC를 직접 호출하지 않습니다.

```ts
import type { ApiResponse } from "@/interface/api";

export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers,
  });
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || "error" in result) {
    const error = "error" in result
      ? result.error
      : { code: "INTERNAL", message: "요청에 실패했습니다." };
    throw Object.assign(new Error(error.message), { code: error.code });
  }

  return result.data;
}
```

요청 예시:

```ts
const session = await apiFetch("/api/quiz-sessions/today", {
  method: "POST",
  body: JSON.stringify({ category_id: 1 }),
});
```

## 1. 로그인 화면 `/login`

로그인 후 서비스 초기화 여부를 확인해 `/start` 또는 `/home`으로 이동합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 로그인 | [Supabase Auth `signInWithPassword`](./auth/supabase-auth.md#로그인) | 이메일과 비밀번호로 세션 생성 |
| 초기화 여부 확인 | [`GET /api/users/me`](./users/get-me.md) 🔒 | 프로필 존재 여부 확인 |

## 2. 회원가입 화면 `/signup`

Supabase Auth 계정을 만들고 닉네임·펫 초기화를 위해 `/start`로 이동합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 회원가입 | [Supabase Auth `signUp`](./auth/supabase-auth.md#회원가입) | 이메일 계정 생성 |

## 3. 최초 시작 화면 `/start`

닉네임, streak, 랜덤 펫을 중복 없이 초기화합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 사용자 초기화 | [`POST /api/users/init`](./users/post-init.md) 🔒 | 프로필·streak·최초 펫 생성 |

## 4. 홈 화면 `/home`

홈 첫 렌더링에 필요한 사용자·펫·streak·오늘 퀴즈 요약을 한 번에 조회합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 홈 데이터 조회 | [`GET /api/users/me/home`](./users/get-home.md) 🔒 | 홈 화면용 통합 조회 |
| 학습 달력 열기 | [`GET /api/users/me/study-calendar`](./records/get-calendar.md) 🔒 | 월별 완료 날짜 조회 |
| 내 순위 타일 | [`GET /api/rankings`](./rankings/get-rankings.md) 🔒 | 내 순위 요약 조회 |
| 로그아웃 | [Supabase Auth `signOut`](./auth/supabase-auth.md#로그아웃) | 인증 세션 종료 |

## 5. 문제 카테고리 화면 `/topic`

출제 가능한 카테고리를 보여주고, 선택한 카테고리로 오늘 세션을 생성합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 카테고리 조회 | [`GET /api/question-categories`](./questions/get-categories.md) 🔒 | 활성 문제 카테고리 조회 |
| 오늘 퀴즈 시작 | [`POST /api/quiz-sessions/today`](./quiz/post-today.md) 🔒 | 오늘 세션 생성 또는 기존 세션 반환 |

## 6. 퀴즈 화면 `/quiz`

고정된 세션 문제와 기존 답안을 불러오고, 답안과 하트를 서버에 저장합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 세션 복원 | [`GET /api/quiz-sessions/:sessionId`](./quiz/get-session.md) 🔒 | 문제·답안·하트·진행 상태 조회 |
| 답안 제출 | [`POST /api/quiz-sessions/:sessionId/answers`](./quiz/post-answer.md) 🔒 | 서버 채점, 답안 저장, 하트 반영 |

## 7. 결과 화면 `/result`

모든 답안 제출 후 결과 보기 버튼에서 보상을 한 번만 확정합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 보상 확정 | [`POST /api/quiz-sessions/:sessionId/complete`](./quiz/post-complete.md) 🔒 | 경험치·코인·streak·성장 일괄 반영 |
| 완료 결과 재조회 | [`GET /api/quiz-sessions/:sessionId`](./quiz/get-session.md) 🔒 | 완료된 세션 결과 복원 |

## 8. 학습 기록 화면 `/record`

월별 완료 날짜와 선택 날짜의 문제별 기록을 조회합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 월별 달력 | [`GET /api/users/me/study-calendar`](./records/get-calendar.md) 🔒 | 완료 세션이 있는 날짜 조회 |
| 날짜별 기록 | [`GET /api/users/me/study-records`](./records/get-day.md) 🔒 | 문제·선택 답안·정답·보상 조회 |

## 9. 상점 화면 `/shop`

현재 성장 상태에 맞는 상품을 보여주고 코인 차감과 아이템 지급을 함께 처리합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 상점 목록 | [`GET /api/shop/items`](./shop/get-items.md) 🔒 | 상품·보유·장착 여부 조회 |
| 아이템 구매 | [`POST /api/shop/items/:itemId/purchase`](./shop/post-purchase.md) 🔒 | 코인 차감과 보유 아이템 생성 |

## 10. 옷장 화면 `/wardrobe`

보유 아이템과 현재 장착 상태를 조회하고 슬롯별로 장착하거나 해제합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 인벤토리 조회 | [`GET /api/users/me/inventory`](./inventory/get-inventory.md) 🔒 | 보유 아이템·장착 상태 조회 |
| 장착·교체 | [`PUT /api/users/me/character/equipment/:slot`](./inventory/put-equipment.md) 🔒 | 슬롯 아이템 장착 또는 교체 |
| 장착 해제 | [`DELETE /api/users/me/character/equipment/:slot`](./inventory/delete-equipment.md) 🔒 | 슬롯의 현재 장착 제거 |

## 11. 랭킹 화면 `/ranking`

완료 세션의 누적 정답 수 기준 상위 랭킹과 내 순위를 조회합니다.

| 기능 | API | 설명 |
| --- | --- | --- |
| 랭킹 조회 | [`GET /api/rankings`](./rankings/get-rankings.md) 🔒 | 상위 목록 + 내 순위 조회 |

## 전체 Route Handler 목록

```text
GET    /api/users/me
POST   /api/users/init
GET    /api/users/me/home

GET    /api/question-categories

POST   /api/quiz-sessions/today
GET    /api/quiz-sessions/:sessionId
POST   /api/quiz-sessions/:sessionId/answers
POST   /api/quiz-sessions/:sessionId/complete

GET    /api/users/me/study-calendar
GET    /api/users/me/study-records

GET    /api/shop/items
POST   /api/shop/items/:itemId/purchase

GET    /api/users/me/inventory
PUT    /api/users/me/character/equipment/:slot
DELETE /api/users/me/character/equipment/:slot

GET    /api/rankings
```

## 관련 설계 문서

- [최종 DB 설계](../db-design.md)
- [DBML](../quizpet-schema.dbml)
- [기존 통합 API 초안](../api-spec.md)
