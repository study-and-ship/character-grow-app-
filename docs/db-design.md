# 퀴즈펫 최종 DB 설계

이 문서는 현재 프론트엔드 화면과 2026-07-05까지 논의한 정책을 기준으로 정리한 사용자 앱 목표 스키마입니다.

- DBML: [`quizpet-schema.dbml`](./quizpet-schema.dbml)
- 현재 Supabase 스키마를 그대로 설명하는 문서가 아니라, 앞으로 맞춰 갈 목표 설계입니다.
- 관리자 계정과 문제 파일 업로드 이력은 별도 관리자 영역이므로 이 핵심 스키마에서 제외했습니다.

## 1. 설계 원칙

### 인증 정보는 Supabase Auth가 관리한다

`auth.users`가 이메일과 암호화 비밀번호를 관리합니다. 사용자 앱의 `profiles`에는 닉네임과 코인처럼 서비스에서 필요한 정보만 저장합니다.

```text
auth.users 1 ─── 1 profiles
```

### 사용자당 캐릭터는 MVP에서 하나다

`characters.user_id`에 UNIQUE 제약을 둡니다.

```text
profiles 1 ─── 1 characters
character_types 1 ─── N characters
```

향후 여러 펫을 지원할 때 UNIQUE 제약을 제거하면 `profiles 1:N characters`로 확장할 수 있습니다.

### 오늘의 퀴즈 문제는 시작 시 고정한다

문제은행에서 선택한 문제를 `quiz_session_questions`에 저장합니다. 문제은행의 출제 대상이 바뀌어도 진행 중인 사용자는 같은 문제와 순서로 재개합니다.

```text
quiz_sessions 1 ─── N quiz_session_questions
questions     1 ─── N quiz_session_questions
```

### 답안을 제출할 때 보상하지 않는다

답안 제출은 다음 작업만 수행합니다.

1. 선택지가 해당 문제에 속하는지 검증
2. 서버에서 정답 여부 판정
3. `user_question_answers` 저장
4. 오답이면 `hearts_remaining` 감소
5. 모든 문제를 제출했으면 세션을 `ready_to_complete`로 변경

경험치, 코인, streak, 캐릭터 성장은 이 시점에 변경하지 않습니다.

### 결과 보기를 눌렀을 때 한 번만 보상한다

결과 보기 요청은 하나의 DB 트랜잭션에서 다음 작업을 수행합니다.

1. 세션 소유자와 상태 확인
2. 모든 세션 문제의 답안 존재 확인
3. 정답 수와 보상 계산
4. `quiz_sessions` 결과 확정
5. 캐릭터 경험치·레벨·성장 단계 갱신
6. 사용자 코인 갱신
7. streak 갱신
8. 성장 이력 생성
9. 세션을 `completed`로 변경

이미 `completed`인 세션은 기존 결과만 반환하고 보상을 다시 지급하지 않습니다.

## 2. 전체 관계

```text
auth.users
    │ 1:1
    ▼
profiles
    ├──── 1:1 ──── user_streaks
    ├──── 1:1 ──── characters ──── N:1 ──── character_types
    ├──── 1:N ───< quiz_sessions
    └──── 1:N ───< user_items >──── N:1 ──── shop_items

question_categories
    ├──── 1:N ───< questions ──── 1:N ───< question_choices
    └──── 1:N ───< quiz_sessions

quiz_sessions
    └──── 1:N ───< quiz_session_questions
                           │
                           ├──── N:1 ──── questions
                           └──── 1:0..1 ─ user_question_answers

characters
    └──── 1:N ───< character_equipment ──── 0..1:1 ──── user_items
```

`user_streaks`와 `characters`는 직접 연결되지 않습니다. 둘 다 사용자에 속합니다. `characters`와 `quiz_sessions`도 현재는 직접 연결하지 않습니다. 사용자당 캐릭터가 하나이므로 두 테이블의 `user_id`를 통해 대상을 결정합니다.

## 3. 사용자 영역

### `profiles`

사용자 앱의 기본 정보입니다.

| 컬럼 | 의미 |
| --- | --- |
| `id` | Supabase Auth 사용자 ID |
| `nickname` | 앱에 표시할 닉네임 |
| `coins` | 현재 사용 가능한 코인 |

이메일과 비밀번호는 저장하지 않습니다.

### `user_streaks`

학습 기록 전체를 매번 날짜별로 계산하지 않기 위한 집계 테이블입니다.

| 컬럼 | 의미 |
| --- | --- |
| `current_streak` | 현재 연속 학습일 |
| `longest_streak` | 최장 연속 학습일 |
| `last_completed_date` | 마지막으로 보상을 완료한 학습일 |

문제 하나를 풀 때마다 갱신하지 않고, 퀴즈 완료 트랜잭션에서 하루 한 번만 반영합니다.

## 4. 캐릭터 영역

### `character_types`

토끼, 고양이, 햄스터 같은 펫 종류의 기준 데이터입니다.

### `character_type_stages`

펫 종류별 성장 단계와 최소 레벨, 이미지를 정의합니다.

```text
토끼 + egg   + min_level 1
토끼 + baby  + min_level 2
토끼 + child + min_level 5
```

### `characters`

사용자가 실제로 키우는 펫의 현재 상태입니다.

| 컬럼 | 의미 |
| --- | --- |
| `level` | 현재 확정 레벨 |
| `exp` | 현재 레벨 안에서의 경험치 |
| `total_exp` | 지금까지 획득한 누적 경험치 |
| `growth_stage` | 현재 확정 성장 단계 |
| `hatched_at` | 실제 부화가 확정된 시각 |

`total_exp`를 경험치의 원본 값으로 봅니다. `level`, `exp`, `growth_stage`는 계산 가능한 값이지만 홈 조회와 현재 상태 보존을 위해 함께 저장합니다. 네 값은 퀴즈 완료 트랜잭션에서 동시에 갱신해야 합니다.

### `character_growth_histories`

퀴즈 완료 전후의 레벨과 성장 단계를 보존합니다. 결과 화면, 부화·레벨업 연출, 장애 분석에 사용할 수 있습니다.

## 5. 문제은행 영역

### `question_categories`

웹 기초, 자바스크립트, 컴퓨터 상식 같은 카테고리입니다.

### `questions`

실제 문제 본문과 해설을 저장합니다.

- `title`은 관리자 목록에서 문제를 식별하기 위한 선택 필드입니다.
- `question_text`가 사용자에게 표시되는 실제 문제입니다.
- 게시된 문제의 본문이나 정답을 수정해야 하면 기존 행을 직접 변경하지 않고 새 버전의 문제를 만드는 방식을 권장합니다.
- 새 문제의 `supersedes_question_id`는 교체한 이전 문제를 가리킵니다.

### `question_choices`

문제의 보기입니다. 문제당 정답 선택지는 정확히 하나가 되도록 관리 API나 DB 트리거에서 검증해야 합니다.

## 6. 퀴즈 세션 영역

### `quiz_sessions`

사용자의 하루 퀴즈 단위입니다.

```text
UNIQUE(user_id, session_date)
```

이 제약으로 같은 날 시작 요청을 여러 번 보내도 새 세션이 중복 생성되지 않습니다. `session_date`는 클라이언트 값이 아니라 서버가 `Asia/Seoul` 기준으로 결정합니다.

상태 흐름:

```text
in_progress
    │ 모든 세션 문제의 답안 제출
    ▼
ready_to_complete
    │ 결과 보기 + 보상 트랜잭션 성공
    ▼
completed
```

`abandoned`는 운영 정책상 세션을 폐기해야 할 때 사용합니다.

### `quiz_session_questions`

세션 시작 시 선택된 문제와 순서를 고정합니다.

```text
세션 100
├── 순서 1 → 문제 20
├── 순서 2 → 문제 51
├── 순서 3 → 문제 13
├── 순서 4 → 문제 82
└── 순서 5 → 문제 37
```

재접속 시 답안이 없는 가장 빠른 순서의 문제를 찾으면 진행 위치를 복원할 수 있으므로 `current_position`은 저장하지 않습니다.

### `user_question_answers`

문제별 제출 결과입니다.

| 컬럼 | 의미 |
| --- | --- |
| `quiz_session_question_id` | 세션에 배정된 문제 |
| `selected_choice_id` | 사용자가 선택한 보기 |
| `is_correct` | 제출 당시 서버가 판정한 정답 여부 |
| `answered_at` | 제출 일시 |

`quiz_session_question_id` 하나로 사용자, 세션, 문제를 모두 찾을 수 있으므로 `user_id`, `quiz_session_id`, `question_id`를 답안 테이블에 중복 저장하지 않습니다.

`is_correct`는 선택지에서 계산할 수 있지만 다음 이유로 스냅샷을 저장합니다.

- 당시 채점 결과 보존
- 이미 지급된 보상과 과거 정답률 유지
- 문제 교정 이후에도 기록이 변하지 않음

정답 판정은 클라이언트가 보내지 않고 서버가 수행합니다.

## 7. 하트와 진행 복원

`max_hearts`와 `hearts_remaining`은 세션 상태입니다. 오답 저장과 하트 차감은 같은 트랜잭션에서 수행합니다.

본 설계는 사용자가 명시한 정책대로 모든 배정 문제를 제출해야 `ready_to_complete`가 되는 것으로 정의합니다. 하트가 0일 때 조기 종료시키려면 완료 조건을 다음처럼 변경할 수 있습니다.

```text
모든 문제 제출
OR hearts_remaining = 0
```

이 정책 변경은 테이블 구조를 바꾸지 않고 완료 검증 로직만 변경하면 됩니다.

## 8. 상점과 장착

### `item_categories`와 `shop_items`

아이템 종류와 실제 판매 상품을 분리합니다.

```text
item_categories 1 ─── N shop_items
```

카테고리는 장착 슬롯과 알/펫 대상을 정의합니다.

### `user_items`

사용자가 실제로 구매한 아이템입니다.

```text
profiles   1 ─── N user_items
shop_items 1 ─── N user_items
```

`UNIQUE(user_id, item_id)`로 동일 아이템 중복 구매를 막습니다.

### `character_equipment`

현재 장착 상태입니다.

```text
characters 1 ─── N character_equipment
user_items  1 ─── 0..1 character_equipment
```

복합 기본키 `(character_id, slot)`으로 같은 슬롯에는 하나만 장착할 수 있습니다. 장착 시 다음 조건을 서버 트랜잭션에서 검증해야 합니다.

1. `user_item`이 캐릭터 소유자의 아이템인가
2. 아이템 카테고리의 슬롯과 요청 슬롯이 같은가
3. 알/펫 대상이 현재 성장 상태와 맞는가

`character_equipment.user_item_id`에도 UNIQUE 제약을 두므로 하나의 보유 아이템을 여러 캐릭터나 여러 슬롯에 동시에 장착할 수 없습니다.

## 9. 트랜잭션 경계

다음 작업은 각각 하나의 DB 트랜잭션 또는 PostgreSQL RPC로 구현해야 합니다.

### 오늘 퀴즈 생성

```text
quiz_sessions 생성
+ quiz_session_questions 5개 생성
```

### 답안 제출

```text
답안 중복 검사
+ 서버 정답 판정
+ user_question_answers 생성
+ 오답 하트 차감
+ 마지막 답안이면 ready_to_complete 전환
```

### 퀴즈 완료

```text
정답 수 집계
+ 보상 계산
+ quiz_sessions 결과 확정
+ profiles.coins 갱신
+ characters 성장 갱신
+ user_streaks 갱신
+ character_growth_histories 생성
+ completed 전환
```

### 아이템 구매

```text
코인 잔액 검사
+ profiles.coins 차감
+ user_items 생성
```

### 아이템 장착

```text
소유권과 슬롯 검사
+ 기존 슬롯 장착 교체
```

## 10. 현재 스키마와 달라지는 주요 부분

현재 생성된 Supabase 타입과 비교하면 목표 스키마에는 다음 변경이 필요합니다.

- `quiz_session_status`에 `ready_to_complete` 추가
- `quiz_sessions`에 `session_date`, 하트, 코인 보상, `all_answered_at` 추가
- `questions.category` 문자열을 `question_categories` FK로 변경
- `questions.title`, 버전 교체 관계 추가
- `user_question_answers`에서 중복된 사용자·세션·문제 FK와 답안별 경험치 제거
- `profiles.coins` 추가
- 상점, 보유 아이템, 장착 테이블 추가
- `characters.hatched_at`과 `character_types.sprite_key` 추가

이는 설명용 문서 작성만으로 DB에 적용되지 않습니다. 실제 적용 시 별도 Supabase migration과 타입 재생성이 필요합니다.
