# API 문서 구현·검증 체크리스트

기준일: 2026-08-18 (abandoned 세션 정책·경계 케이스 테스트 추가. 이전: 랭킹 API, 하트 0 조기 완료, 보상 규칙, 부화 장비 해제, 상점 필터)

이 문서는 API 상세 문서가 실제 Next.js Route Handler와 테스트에 반영되어 있는지 확인하기 위한 체크리스트입니다.

## 검증 기준

- `문서 계약`: `docs/api/**/*.md`의 프론트엔드 API 명세
- `구현 위치`: `src/app/api/**/route.ts`
- `공개 타입`: `src/interface/api.ts`
- `공통 검증/오류 처리`: `src/lib/api/*`
- `실제 호출 검증`: `tests/integration/api-flow.test.ts`
- `단위 검증`: `tests/unit/*.test.ts`

## 전체 결론

16개 Next.js API Route Handler는 모두 구현되어 있고, 로컬 Supabase + 실제 Next 서버를 사용한 HTTP 통합 테스트에 포함되어 있습니다.
미구현으로 남긴 작업은 [`백엔드 백로그`](./backlog.md)에 기록합니다.

통합 테스트로 실제 HTTP 검증된 경계 케이스 (`tests/integration/api-flow.test.ts`):

- 하트 0 조기 완료 → 완료 보상 → 홈/기록 반영 (오답 강제 선택으로 결정적 검증)
- 지난 날짜 `in_progress` 세션의 `abandoned` 전환과 이후 제출·완료 차단
- 닉네임 20자/21자 경계, 다른 사용자 세션 접근 403, 코인 부족 409
- 상점 `target_type` × `slot` 필터 조합과 잘못된 필터 400
- 다른 선택지 재제출 409, 없는 세션 404, `ITEM_TARGET_MISMATCH`,
  `EQUIPMENT_SLOT_MISMATCH`, `USER_ITEM_NOT_FOUND`, 빈 슬롯 해제 멱등성
- 인벤토리 필터 조합, 달력 잘못된 월 400, 기록 없는 날짜 `session: null`

다만 아래 항목은 아직 HTTP로 호출하지 않았으므로, 필요 시 추가합니다.

- 존재하지 않는 카테고리 ID로 퀴즈 시작, 존재하지 않는 아이템 ID 구매

현재 도메인 오류 매핑 자체는 단위 테스트로 검증되어 있습니다.

## API별 대조표

| 화면/기능 | API 문서 | 구현 위치 | 실제 HTTP 검증 | 추가 확인 권장 |
| --- | --- | --- | --- | --- |
| 사용자 초기화 | [`POST /api/users/init`](./users/post-init.md) | `src/app/api/users/init/route.ts` | 확인됨: 최초 생성, 재요청 멱등성, 닉네임 검증 실패 | 닉네임 20자 경계값 |
| 내 정보 확인 | [`GET /api/users/me`](./users/get-me.md) | `src/app/api/users/me/route.ts` | 확인됨: 미인증 401, 초기화 전 `initialized: false`, 초기화 후 `true` | 없음 |
| 홈 데이터 | [`GET /api/users/me/home`](./users/get-home.md) | `src/app/api/users/me/home/route.ts` | 확인됨: 완료된 오늘 퀴즈 요약, 코인 반영 | 초기화 누락 상태의 `USER_NOT_INITIALIZED` |
| 문제 카테고리 | [`GET /api/question-categories`](./questions/get-categories.md) | `src/app/api/question-categories/route.ts` | 확인됨: 활성 카테고리 목록 조회 | 비활성 카테고리 제외 여부는 seed 변경 시 재확인 |
| 오늘 퀴즈 시작 | [`POST /api/quiz-sessions/today`](./quiz/post-today.md) | `src/app/api/quiz-sessions/today/route.ts` | 확인됨: 생성, 동일 날짜 재호출 시 기존 세션 반환 | 존재하지 않는 카테고리 |
| 퀴즈 세션 조회 | [`GET /api/quiz-sessions/:sessionId`](./quiz/get-session.md) | `src/app/api/quiz-sessions/[sessionId]/route.ts` | 확인됨: 답변 후 세션 복원, `answered_count` 반영 | 미응답 문제의 정답/해설 비노출 샘플 확인 |
| 답안 제출 | [`POST /api/quiz-sessions/:sessionId/answers`](./quiz/post-answer.md) | `src/app/api/quiz-sessions/[sessionId]/answers/route.ts` | 확인됨: 전체 문제 답안 제출, 하트 반영, 동일 선택지 재요청 멱등성 | 다른 선택지 재제출 `ANSWER_ALREADY_SUBMITTED` |
| 퀴즈 완료 | [`POST /api/quiz-sessions/:sessionId/complete`](./quiz/post-complete.md) | `src/app/api/quiz-sessions/[sessionId]/complete/route.ts` | 확인됨: 보상 지급, 세션 완료, 재요청 보상 중복 방지 | 미완료 세션 완료 요청 |
| 학습 달력 | [`GET /api/users/me/study-calendar`](./records/get-calendar.md) | `src/app/api/users/me/study-calendar/route.ts` | 확인됨: 완료된 세션 날짜 포함 | 잘못된 연/월 검증 |
| 날짜별 학습 기록 | [`GET /api/users/me/study-records`](./records/get-day.md) | `src/app/api/users/me/study-records/route.ts` | 확인됨: 완료 세션의 문제·선택답·정답·해설 조회 | 기록 없는 날짜 `session: null` |
| 상점 목록 | [`GET /api/shop/items`](./shop/get-items.md) | `src/app/api/shop/items/route.ts` | 확인됨: 현재 성장 상태 기준 상품 조회, 보유/장착 상태 계산 | `target_type`, `slot` 필터 조합 |
| 아이템 구매 | [`POST /api/shop/items/:itemId/purchase`](./shop/post-purchase.md) | `src/app/api/shop/items/[itemId]/purchase/route.ts` | 확인됨: 구매 성공, 코인 차감, 중복 구매 409 | 코인 부족, 대상 불일치 |
| 인벤토리 | [`GET /api/users/me/inventory`](./inventory/get-inventory.md) | `src/app/api/users/me/inventory/route.ts` | 확인됨: 구매 아이템 표시, 장착 상태 반영 | `target_type`, `slot` 필터 조합 |
| 아이템 장착 | [`PUT /api/users/me/character/equipment/:slot`](./inventory/put-equipment.md) | `src/app/api/users/me/character/equipment/[slot]/route.ts` | 확인됨: 구매 아이템 장착, 인벤토리 반영 | 슬롯 불일치 |
| 아이템 해제 | [`DELETE /api/users/me/character/equipment/:slot`](./inventory/delete-equipment.md) | `src/app/api/users/me/character/equipment/[slot]/route.ts` | 확인됨: 장착 해제, `equipment: null` 반환 | 빈 슬롯 재해제 멱등성 |
| 랭킹 | [`GET /api/rankings`](./rankings/get-rankings.md) | `src/app/api/rankings/route.ts` | 확인됨: 완료 후 내 순위·누적 정답 수 조회 | 다중 사용자 동률 정렬, `limit` 경계값 |

## 공통 계약 대조

| 항목 | 문서 요구사항 | 구현 상태 |
| --- | --- | --- |
| 인증 | 사용자 API는 Supabase 쿠키 세션과 `supabase.auth.getUser()` 사용 | 구현됨 |
| 프론트 호출 경로 | 프론트는 PostgreSQL RPC를 직접 호출하지 않고 `/api/...`만 호출 | 구현됨 |
| 성공 응답 | `{ "data": ... }` | 구현됨 |
| 실패 응답 | `{ "error": { "code", "message" } }` | 구현됨 |
| 예상 외 DB 오류 | 서버 로그에만 상세 기록, 클라이언트에는 `INTERNAL` | 구현됨 |
| RPC 도메인 오류 변환 | `P0001 + message`를 HTTP 상태와 공개 오류 코드로 변환 | 단위 테스트로 검증됨 |
| 동적 Route params | Next.js 16 규칙에 맞게 `params`를 `Promise`로 처리 | 구현됨 |
| Route 응답 타입 | 프론트가 `src/interface/api.ts`에서 가져다 쓸 수 있음 | 구현됨 |
| Health API | 운영 점검용 기존 형식 유지 | 유지됨 |

## 검증 명령

최근 확인 결과:

```bash
npm run test:integration
```

결과:

```txt
Test Files  1 passed (1)
Tests       3 passed (3)
```

전체 완료 기준으로는 아래 명령도 함께 통과해야 합니다.

```bash
npm run test
npm run test:integration
npx supabase db lint --local
npx tsc --noEmit
npm run lint
NEXT_DIST_DIR=.next-build npm run build
```

## 프론트 개발 전 확인 포인트

프론트 개발자는 API 상세 문서와 `src/interface/api.ts`의 DTO 타입을 같이 보면 됩니다.

개발 중 실제 응답을 빠르게 확인하려면 로컬 Supabase를 켠 상태에서 다음 순서로 확인합니다.

1. Supabase Auth로 회원가입 또는 로그인
2. `POST /api/users/init`
3. `GET /api/users/me/home`
4. `GET /api/question-categories`
5. `POST /api/quiz-sessions/today`
6. `GET /api/quiz-sessions/:sessionId`
7. 답안 제출과 완료 API 호출

필터나 오류 케이스까지 확정해야 하는 화면에서는 위 대조표의 “추가 확인 권장” 항목을 기준으로 테스트 케이스를 추가합니다.
