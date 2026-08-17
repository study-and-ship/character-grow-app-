# 백엔드 백로그 (미구현 작업 상세 기록)

기준일: 2026-08-17

2026-08-17 코드 리뷰에서 결정했지만 아직 구현하지 않은 작업을 기록합니다.
이미 반영된 결정(하트 0 조기 완료, 보상 규칙 확정, 부화 시 장비 해제, 상점 필터,
랭킹 API)은 각 API 문서와 `implementation-checklist.md`를 참고합니다.

## 1. 커스텀 주제(AI 새 주제 만들기) API

### 결정 사항

- MVP에서는 `/topic` 화면이 `GET /api/question-categories` 목록만 표시합니다.
- "새 주제 만들기" 버튼은 유지하되, 클릭 시 "추후 지원 예정" 안내(알럿/토스트)만 노출합니다.
- 생성 API는 이후 별도 설계로 진행합니다.

### 필요한 설계 항목

- 사용자별 커스텀 카테고리 테이블 (공용 `question_categories`와 분리 여부 결정)
- AI 문제 생성 파이프라인: 프롬프트 → 문제·보기·해설 생성 → 검수 상태(`draft` → `published`)
- 생성 요청 API: `POST /api/question-categories` (인증 필수, 사용자당 생성 한도)
- 생성 비용·남용 방지: 하루 생성 횟수 제한, 생성 실패 시 재시도 정책
- 커스텀 카테고리 문제로 시작한 세션의 보상 규칙(공용과 동일 여부)
- 프론트 `src/lib/ai-topic.ts`의 로컬 생성 로직 대체

## 2. 프론트엔드 API 연결

현재 프론트(`src/context/GameContext.tsx`)는 전부 로컬 목업 상태입니다.
아래 순서로 실제 API로 전환합니다. 공통 호출 헬퍼는 `docs/api/README.md`의 `apiFetch` 예제를 사용합니다.

### 화면별 연결 작업

| 화면 | 교체 대상 | 사용 API | 주의 사항 |
| --- | --- | --- | --- |
| `/login`, `/signup` | — | Supabase Auth | 로그인 후 `GET /api/users/me`로 초기화 여부 분기 |
| `/start` | `startGame()` | `POST /api/users/init` | 닉네임 1~20자. 캐릭터는 서버가 랜덤 배정 (`PETS` 로컬 랜덤 제거) |
| `/home` | `createInitialState()` 목업 | `GET /api/users/me/home`, `GET /api/rankings` | `answered_count`는 조기 완료 시 `total`보다 작을 수 있음 |
| `/topic` | `TOPICS` 상수 | `GET /api/question-categories` | 20개 프리셋 제거. "새 주제 만들기"는 추후 지원 알럿 |
| `/quiz` | `QUESTIONS` 상수, `submitAnswer()` | `POST /api/quiz-sessions/today`, `GET /api/quiz-sessions/:id`, `POST .../answers` | 채점·하트는 서버 응답 사용. `can_complete`가 `true`면 즉시 결과로 이동 (하트 0 조기 완료 포함). 새로고침 시 세션 복원 |
| `/result` | `finishSession()` | `POST /api/quiz-sessions/:id/complete` | `rewards.exp`는 음수 가능. `level_up_bonus_coins`로 레벨업 연출, `hatched`로 부화 연출 |
| `/record` | `seedStudyData()` 목업 | `GET /api/users/me/study-calendar`, `GET /api/users/me/study-records` | 조기 완료 세션은 제출한 답안만 내려옴 |
| `/shop` | `buy()` | `GET /api/shop/items`, `POST /api/shop/items/:id/purchase` | 구매 성공 후 장착 API를 이어서 호출해 "구매 즉시 장착" UX 유지 |
| `/wardrobe` | `equip()` | `GET /api/users/me/inventory`, `PUT`/`DELETE .../equipment/:slot` | 장착 상태는 서버 단일 기록. 프론트의 알/펫 분리 상태(`eggEquip`/`equipped`) 제거 |
| `/ranking` | `RIVALS` 목업 | `GET /api/rankings` | `me`가 `null`이면 초기화 전 사용자 |

### 정리할 프론트 상수·로직

- `src/lib/data.ts`: `QUESTIONS`, `TOPICS`, `START_STREAK`(가짜 streak seed), `PETS` 랜덤 배정 제거.
  `EXP_WRONG(-5)`, `LEVELUP_COIN(100)`, `EXP_CORRECT`, `COIN_CORRECT`, `expForLevel`은 서버 규칙과 일치하므로 표시용으로 유지 가능.
- `src/lib/game.ts`: `seedStudyData()` 제거, 날짜 키를 서버의 `YYYY-MM-DD`(Asia/Seoul) 기준으로 통일.
- `src/lib/ranking.ts`: `RIVALS`·`buildBoard`를 API 응답 렌더링으로 교체.

### 추가로 늘릴 테스트 (체크리스트의 "추가 확인 권장" 포함)

- ~~하트 0 조기 완료 → complete → 기록 조회 HTTP 시나리오~~ → 완료 (2026-08-17)
- ~~코인 부족, 타인 세션 접근 403, 필터 조합, 닉네임 경계값~~ → 완료 (2026-08-18,
  "enforces validation, ownership, and coin boundaries")
- ~~abandoned 세션 정책~~ → 완료 (2026-08-18): 지난 날짜 `in_progress`만 다음 세션 시작 시 폐기,
  `ready_to_complete`는 언제든 완료 가능. 마이그레이션 `20260818090000_abandon_stale_sessions.sql`
- ~~장착 도메인 오류, 답안 재제출, 404류, 기록·달력 경계~~ → 완료 (2026-08-18,
  "covers answer, item target, slot, and record edge cases")
- 남은 것: 존재하지 않는 카테고리 ID로 퀴즈 시작, 존재하지 않는 아이템 ID 구매 (우선순위 낮음)
