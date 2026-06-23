# API 설계명세서 — 픽셀펫 키우기

> 프론트엔드 담당자와 공유하는 API 명세입니다.
> 기준: 현재 Supabase DB 스키마, `index.html` 프로토타입, 회의에서 확인된 MVP 정책을 반영한 초안입니다.

---

## 0. 공통 사항

### 0.1 베이스 경로

모든 API는 Next.js Route Handler로 제공합니다.

```text
/api/...
```

---

### 0.2 인증

MVP에는 Supabase Auth 기반 회원가입/로그인을 포함합니다.

현재 구현 후보는 다음 방식입니다.

```text
Supabase Auth — 이메일 + 비밀번호
```

클라이언트에서는 기본적으로 `supabase-js`를 사용합니다.

```ts
await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
```

단, 이메일은 개인정보에 해당하므로 최종 출시 전에는 개인정보 처리방침과 수집·이용 동의 여부를 확인해야 합니다.

인증이 필요한 API는 명세상 `🔒`로 표시합니다.

중요 원칙:

```text
user_id는 요청 바디나 쿼리로 받지 않는다.
서버가 Supabase Auth 세션에서 현재 로그인 사용자를 확인한다.
```

---

### 0.3 공통 응답 형식

성공 응답:

```json
{
  "data": {}
}
```

실패 응답:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "사람이 읽을 수 있는 에러 메시지"
  }
}
```

---

### 0.4 공통 에러 코드

| code           | HTTP | 의미             |
| -------------- | ---: | -------------- |
| `UNAUTHORIZED` |  401 | 로그인 필요 / 세션 없음 |
| `FORBIDDEN`    |  403 | 권한 없음          |
| `NOT_FOUND`    |  404 | 리소스 없음         |
| `VALIDATION`   |  400 | 입력값 오류         |
| `CONFLICT`     |  409 | 상태 충돌          |
| `INTERNAL`     |  500 | 서버 또는 DB 오류    |

---

### 0.5 Enum 값

| Enum                     | 값                                       |
| ------------------------ | --------------------------------------- |
| `character_growth_stage` | `egg`, `baby`, `child`, `teen`, `adult` |
| `question_status`        | `draft`, `published`, `archived`        |
| `quiz_session_status`    | `in_progress`, `completed`, `abandoned` |
| `admin_role`             | `owner`, `manager`                      |

---

### 0.6 1차 범위 제외

아래 기능은 현재 1차 백엔드 구현 범위에서 제외합니다.

```text
- 코인
- 상점
- 액세서리
- 아이템 구매
- 아이템 보유 목록
- 아이템 장착
- 주관식 문제
- 오답노트 전용 기능
- AI 문제 생성 자동화
- 푸시 알림
- 랭킹
- 친구 기능
```

---

### 0.7 구현 메모

1차 MVP에서는 답안 제출과 보상 지급을 명확히 분리합니다.

```text
문제 제출 = 답안 기록 저장
퀴즈 완료 = 경험치 지급 / 성장 처리 / streak 갱신
```

구현 기준은 다음과 같습니다.

* `user_question_answers.earned_exp`는 1차 MVP에서 항상 `0`으로 저장합니다.
* 실제 지급 경험치는 퀴즈 완료 시점에 `quiz_sessions.earned_exp`에 저장합니다.
* `quiz_sessions.correct_count`와 `quiz_sessions.earned_exp`는 퀴즈 완료 시점에 확정 저장합니다.
* 진행 중인 세션의 `answered_count`, `correct_count`는 `user_question_answers`를 기준으로 실시간 집계합니다.
* 완료된 세션의 `correct_count`, `earned_exp`는 `quiz_sessions` 값을 사용합니다.
* 캐릭터는 MVP에서 사용자당 1개만 사용합니다.
* `character_type_name`은 `characters`와 `character_types`를 조인하여 응답에 포함할 수 있습니다.

---

## 1. 헬스체크

### `GET /api/health`

서버와 Supabase 연결 상태를 확인합니다.

인증은 필요하지 않습니다.

#### 응답 200

```json
{
  "data": {
    "status": "ok",
    "supabase": "connected"
  }
}
```

---

## 2. 인증

인증 자체는 기본적으로 클라이언트에서 Supabase Auth를 직접 호출합니다.

### 회원가입

```ts
await supabase.auth.signUp({ email, password });
```

### 로그인

```ts
await supabase.auth.signInWithPassword({ email, password });
```

### 로그아웃

```ts
await supabase.auth.signOut();
```

회원가입 직후 서비스 데이터 생성은 `POST /api/users/init`에서 처리합니다.

---

## 3. 사용자 / 초기화 API

---

## 3.1 사용자 초기화

### `POST /api/users/init` 🔒

로그인한 사용자의 서비스 기본 데이터를 생성하거나 기존 데이터를 반환합니다.

프론트의 “시작하기” 버튼에서 호출합니다.

이 API는 여러 번 호출되어도 중복 데이터가 생기지 않도록 idempotent하게 구현합니다.

---

### 요청 Body

```json
{
  "nickname": "펫집사"
}
```

| 필드         | 타입     | 필수 | 설명                     |
| ---------- | ------ | -: | ---------------------- |
| `nickname` | string |  N | 사용자 닉네임. 없으면 기본값 사용 가능 |

---

### 동작

```text
1. 현재 로그인 사용자 확인
2. profiles가 없으면 생성
3. nickname이 있으면 profiles.nickname 저장
4. characters가 없으면 active character_types 중 하나를 랜덤 선택
5. 선택된 character_type_id로 characters 생성
6. user_streaks가 없으면 생성
7. 기존 데이터가 있으면 기존 데이터를 반환
```

---

### 중요 정책

```text
사용자는 최초 캐릭터를 직접 선택하지 않는다.
서버가 active character_types 중 하나를 랜덤 배정한다.
```

따라서 요청 Body에 `character_type_id`를 받지 않습니다.

---

### 응답 200 또는 201

```json
{
  "data": {
    "profile": {
      "id": "user-uuid",
      "nickname": "펫집사"
    },
    "character": {
      "id": 1,
      "character_type_id": 2,
      "character_type_name": "고양이",
      "level": 1,
      "exp": 0,
      "total_exp": 0,
      "growth_stage": "egg"
    },
    "streak": {
      "current_streak": 0,
      "longest_streak": 0,
      "last_answered_date": null
    },
    "is_new_user": true
  }
}
```

---

### 주요 에러

활성화된 캐릭터 타입이 없는 경우:

```json
{
  "error": {
    "code": "NO_ACTIVE_CHARACTER_TYPE",
    "message": "활성화된 캐릭터 타입이 없습니다."
  }
}
```

---

## 3.2 홈 데이터 조회

### `GET /api/users/me/home` 🔒

홈 화면에 필요한 데이터를 한 번에 반환합니다.

---

### 응답 포함 데이터

```text
- 프로필
- 캐릭터 상태
- streak 상태
- 오늘 퀴즈 진행 상태
- 오늘 풀이 수
- 오늘 정답 수
```

---

### 집계 기준

`today_quiz`의 집계 기준은 세션 상태에 따라 다릅니다.

```text
status = in_progress
→ answered_count, correct_count는 user_question_answers를 기준으로 실시간 집계한다.

status = completed
→ correct_count, earned_exp는 quiz_sessions에 저장된 확정값을 사용한다.
```

진행 중인 세션에서는 `quiz_sessions.correct_count`를 신뢰하지 않습니다.
`quiz_sessions.correct_count`는 퀴즈 완료 시점에만 확정 저장합니다.

---

### 응답 200

```json
{
  "data": {
    "profile": {
      "id": "user-uuid",
      "nickname": "펫집사"
    },
    "character": {
      "id": 1,
      "character_type_id": 2,
      "character_type_name": "고양이",
      "level": 1,
      "exp": 20,
      "total_exp": 20,
      "growth_stage": "egg"
    },
    "streak": {
      "current_streak": 3,
      "longest_streak": 5,
      "last_answered_date": "2026-06-21"
    },
    "today_quiz": {
      "has_session": true,
      "quiz_session_id": 10,
      "status": "in_progress",
      "answered_count": 2,
      "total_question_count": 5,
      "correct_count": 1,
      "earned_exp": 0
    }
  }
}
```

---

### 완료된 세션 응답 예시

```json
{
  "data": {
    "profile": {
      "id": "user-uuid",
      "nickname": "펫집사"
    },
    "character": {
      "id": 1,
      "character_type_id": 2,
      "character_type_name": "고양이",
      "level": 2,
      "exp": 10,
      "total_exp": 130,
      "growth_stage": "baby"
    },
    "streak": {
      "current_streak": 4,
      "longest_streak": 7,
      "last_answered_date": "2026-06-21"
    },
    "today_quiz": {
      "has_session": true,
      "quiz_session_id": 10,
      "status": "completed",
      "answered_count": 5,
      "total_question_count": 5,
      "correct_count": 3,
      "earned_exp": 30
    }
  }
}
```

---

### 신규 사용자 상태

아직 초기화되지 않은 사용자는 다음처럼 반환할 수 있습니다.

```json
{
  "data": {
    "profile": null,
    "character": null,
    "streak": null,
    "today_quiz": {
      "has_session": false,
      "quiz_session_id": null,
      "status": null,
      "answered_count": 0,
      "total_question_count": 0,
      "correct_count": 0,
      "earned_exp": 0
    }
  }
}
```

프론트는 `character === null`이면 시작 화면으로 유도합니다.

---

### 오늘 기준

현재 DB에 `session_date` 컬럼이 없으므로, 오늘 여부는 서버에서 KST 기준 날짜 범위로 계산합니다.

```text
오늘 00:00:00 KST <= started_at < 내일 00:00:00 KST
```

---

## 3.3 학습 날짜 조회

### `GET /api/users/me/learning-dates?from=2026-06-01&to=2026-06-30` 🔒

캘린더 또는 streak UI에서 사용할 학습 완료 날짜 목록을 조회합니다.

---

### Query Parameters

| 이름     | 타입     | 필수 | 설명                   |
| ------ | ------ | -: | -------------------- |
| `from` | string |  Y | 조회 시작일. `YYYY-MM-DD` |
| `to`   | string |  Y | 조회 종료일. `YYYY-MM-DD` |

---

### 응답 200

```json
{
  "data": {
    "dates": [
      "2026-06-01",
      "2026-06-02",
      "2026-06-05"
    ]
  }
}
```

---

### 기준

완료된 퀴즈 세션의 `completed_at`을 KST 날짜로 변환하여 반환합니다.

---

### 우선순위

2순위입니다.
초기 퀴즈 플로우 구현 이후 진행합니다.

---

## 4. 퀴즈 API

---

## 4.1 오늘의 퀴즈 시작 / 조회

### `POST /api/quiz-sessions/today` 🔒

오늘 진행할 5문항 퀴즈 세트를 생성하거나 기존 세트를 반환합니다.

---

### 요청 Body

없음.

1차 MVP에서는 문제 수를 클라이언트가 정하지 않습니다.

```text
서버가 항상 5문항 세트를 생성한다.
```

---

### 동작

```text
1. 현재 로그인 사용자 확인
2. 오늘 진행 중인 quiz_session 조회
3. 진행 중인 세션이 있으면 기존 세션 반환
4. 오늘 완료된 세션이 있으면 완료 상태 반환
5. 오늘 세션이 없으면 새 quiz_session 생성
6. published 상태 문제 중 5개 선택
7. quiz_session_questions에 문제와 순서 저장
8. 문제와 선택지를 반환
```

---

### 문제 출제 정책

1차 MVP에서는 단순 랜덤 출제를 사용합니다.

추후 아래 정책을 추가할 수 있습니다.

```text
- 안 푼 문제 우선
- 난이도별 분배
- 카테고리별 분배
- 오답 문제 재출제
```

---

### 집계 기준

진행 중인 세션을 반환할 때는 `user_question_answers`를 기준으로 집계합니다.

```text
answered_count = 해당 quiz_session_id의 답안 수
correct_count = 해당 quiz_session_id의 is_correct = true 답안 수
```

완료된 세션을 반환할 때는 `quiz_sessions`에 저장된 확정값을 사용합니다.

```text
correct_count = quiz_sessions.correct_count
earned_exp = quiz_sessions.earned_exp
```

---

### 응답 201 — 새 세션 생성

```json
{
  "data": {
    "quiz_session_id": 10,
    "status": "in_progress",
    "total_question_count": 5,
    "answered_count": 0,
    "correct_count": 0,
    "earned_exp": 0,
    "questions": [
      {
        "quiz_session_question_id": 100,
        "question_id": 7,
        "sort_order": 1,
        "category": "web",
        "difficulty": 1,
        "question_text": "HTML의 의미는?",
        "choices": [
          {
            "id": 31,
            "choice_text": "Hyper Text Markup Language",
            "sort_order": 1
          },
          {
            "id": 32,
            "choice_text": "High Tech Modern Language",
            "sort_order": 2
          }
        ],
        "answer": null
      }
    ]
  }
}
```

---

### 응답 200 — 기존 진행 중 세션 반환

```json
{
  "data": {
    "quiz_session_id": 10,
    "status": "in_progress",
    "total_question_count": 5,
    "answered_count": 2,
    "correct_count": 1,
    "earned_exp": 0,
    "questions": [
      {
        "quiz_session_question_id": 100,
        "question_id": 7,
        "sort_order": 1,
        "category": "web",
        "difficulty": 1,
        "question_text": "HTML의 의미는?",
        "choices": [
          {
            "id": 31,
            "choice_text": "Hyper Text Markup Language",
            "sort_order": 1
          },
          {
            "id": 32,
            "choice_text": "High Tech Modern Language",
            "sort_order": 2
          }
        ],
        "answer": {
          "selected_choice_id": 31,
          "is_correct": true,
          "answered_at": "2026-06-21T10:00:00.000Z"
        }
      }
    ]
  }
}
```

---

### 응답 200 — 오늘 이미 완료된 경우

```json
{
  "data": {
    "quiz_session_id": 10,
    "status": "completed",
    "total_question_count": 5,
    "answered_count": 5,
    "correct_count": 3,
    "earned_exp": 30,
    "completed_at": "2026-06-21T10:10:00.000Z",
    "questions": []
  }
}
```

---

### 주의

응답에 `question_choices.is_correct`를 포함하지 않습니다.

---

### 주요 에러

출제 가능한 문제가 부족한 경우:

```json
{
  "error": {
    "code": "NOT_ENOUGH_QUESTIONS",
    "message": "출제 가능한 문제가 부족합니다."
  }
}
```

---

## 4.2 퀴즈 세션 상세 조회

### `GET /api/quiz-sessions/:sessionId` 🔒

특정 퀴즈 세션의 상세 정보를 조회합니다.

앱을 껐다가 다시 들어왔을 때 진행 중인 퀴즈를 복원하는 용도로 사용할 수 있습니다.

---

### 집계 기준

진행 중인 세션이면 `user_question_answers`를 기준으로 `answered_count`, `correct_count`를 계산합니다.

완료된 세션이면 `quiz_sessions.correct_count`, `quiz_sessions.earned_exp`를 사용합니다.

---

### 응답 200

```json
{
  "data": {
    "quiz_session_id": 10,
    "status": "in_progress",
    "total_question_count": 5,
    "answered_count": 2,
    "correct_count": 1,
    "earned_exp": 0,
    "questions": [
      {
        "quiz_session_question_id": 100,
        "question_id": 7,
        "sort_order": 1,
        "question_text": "HTML의 의미는?",
        "choices": [
          {
            "id": 31,
            "choice_text": "Hyper Text Markup Language",
            "sort_order": 1
          }
        ],
        "answer": {
          "selected_choice_id": 31,
          "is_correct": true,
          "answered_at": "2026-06-21T10:00:00.000Z"
        }
      }
    ]
  }
}
```

---

### 우선순위

2순위입니다.

초기 MVP에서는 `POST /api/quiz-sessions/today` 응답으로 대체 가능하면 생략할 수 있습니다.

---

## 4.3 답안 제출

### `POST /api/quiz-sessions/:sessionId/answers` 🔒

퀴즈 세션에 포함된 문제 하나에 대해 답안을 제출합니다.

이 API는 답안 기록만 저장합니다.

```text
경험치, 캐릭터 성장, streak는 처리하지 않는다.
```

---

### 요청 Body

```json
{
  "question_id": 7,
  "selected_choice_id": 31
}
```

---

### 동작

```text
1. 현재 로그인 사용자 확인
2. quizSession이 본인 소유인지 확인
3. quizSession 상태가 in_progress인지 확인
4. question_id가 해당 세션에 포함된 문제인지 확인
5. selected_choice_id가 해당 question_id의 선택지인지 확인
6. 이미 같은 세션에서 해당 문제를 제출했는지 확인
7. question_choices.is_correct로 정답 여부 판정
8. user_question_answers에 기록
9. 정답/오답 결과 반환
```

---

### DB 저장

`user_question_answers`에 저장합니다.

```text
quiz_session_id
quiz_session_question_id
user_id
question_id
selected_choice_id
is_correct
earned_exp = 0
answered_at
```

1차 MVP에서는 `user_question_answers.earned_exp`를 항상 `0`으로 저장합니다.

실제 지급 경험치는 답안별로 저장하지 않고, 퀴즈 완료 시점에 `quiz_sessions.earned_exp`에 총합으로 저장합니다.

---

### 집계 기준

답안 제출 응답의 `answered_count`, `correct_count`는 저장 직후 `user_question_answers`를 기준으로 다시 계산합니다.

```text
answered_count = 해당 quiz_session_id의 답안 수
correct_count = 해당 quiz_session_id의 is_correct = true 답안 수
can_complete = answered_count === total_question_count
```

이 API에서는 `quiz_sessions.correct_count`, `quiz_sessions.earned_exp`를 갱신하지 않습니다.

---

### 응답 200 — 정답

```json
{
  "data": {
    "is_correct": true,
    "correct_choice_id": 31,
    "correct_choice_text": "Hyper Text Markup Language",
    "explanation": null,
    "answered_count": 3,
    "correct_count": 2,
    "total_question_count": 5,
    "can_complete": false
  }
}
```

---

### 응답 200 — 오답

```json
{
  "data": {
    "is_correct": false,
    "correct_choice_id": 31,
    "correct_choice_text": "Hyper Text Markup Language",
    "explanation": "HTML은 Hyper Text Markup Language의 약자입니다.",
    "answered_count": 3,
    "correct_count": 1,
    "total_question_count": 5,
    "can_complete": false
  }
}
```

---

### 응답 200 — 마지막 문제 제출 후

```json
{
  "data": {
    "is_correct": true,
    "correct_choice_id": 31,
    "correct_choice_text": "Hyper Text Markup Language",
    "explanation": null,
    "answered_count": 5,
    "correct_count": 3,
    "total_question_count": 5,
    "can_complete": true
  }
}
```

프론트는 `can_complete: true`일 때 결과 보기 버튼을 활성화할 수 있습니다.

---

### 주요 에러

이미 제출한 문제인 경우:

```json
{
  "error": {
    "code": "ANSWER_ALREADY_SUBMITTED",
    "message": "이미 제출한 문제입니다."
  }
}
```

진행 중인 세션이 아닌 경우:

```json
{
  "error": {
    "code": "QUIZ_SESSION_NOT_IN_PROGRESS",
    "message": "진행 중인 퀴즈 세션이 아닙니다."
  }
}
```

선택지가 문제에 속하지 않는 경우:

```json
{
  "error": {
    "code": "INVALID_CHOICE",
    "message": "해당 문제의 선택지가 아닙니다."
  }
}
```

세션에 포함되지 않은 문제인 경우:

```json
{
  "error": {
    "code": "QUESTION_NOT_IN_SESSION",
    "message": "해당 퀴즈 세션에 포함된 문제가 아닙니다."
  }
}
```

---

## 4.4 퀴즈 세트 완료

### `POST /api/quiz-sessions/:sessionId/complete` 🔒

5문항 세트를 모두 제출한 뒤 결과 보기를 눌렀을 때 호출합니다.

이 API에서 경험치, 캐릭터 성장, streak를 한 번에 처리합니다.

---

### 요청 Body

없음.

---

### 동작

```text
1. 현재 로그인 사용자 확인
2. quizSession이 본인 소유인지 확인
3. quizSession 상태가 in_progress인지 확인
4. 모든 문제가 제출됐는지 확인
5. user_question_answers 기준으로 정답 개수 계산
6. 경험치 계산
7. quiz_sessions.correct_count, earned_exp, completed_at 확정 저장
8. quiz_sessions.status를 completed로 변경
9. characters 경험치/레벨/성장 단계 업데이트
10. user_streaks 업데이트
11. character_growth_histories 생성
12. 결과 요약 반환
```

---

### 확정 저장 기준

`complete` API가 성공하면 아래 값이 확정됩니다.

```text
quiz_sessions.status = completed
quiz_sessions.correct_count = user_question_answers 기준 정답 수
quiz_sessions.earned_exp = correct_count * 10
quiz_sessions.completed_at = now()
```

완료 이후에는 `quiz_sessions.correct_count`, `quiz_sessions.earned_exp`를 확정값으로 사용합니다.

---

### 임시 경험치 정책

1차 MVP에서는 아래 임시 공식을 사용합니다.

```text
earned_exp = correct_count * 10
```

오답 패널티는 1차 MVP에서는 적용하지 않습니다.

---

### 레벨업 정책

초기 구현에서는 프로토타입의 임시 공식을 사용할 수 있습니다.

```text
next_level_required_exp = 80 + level * 40
```

예시:

```text
Lv1 → Lv2 필요 EXP = 120
Lv2 → Lv3 필요 EXP = 160
```

레벨업 후 남은 경험치는 다음 레벨의 현재 경험치로 이월합니다.

---

### 성장 단계 정책

`character_type_stages.min_level`을 기준으로 현재 레벨에 맞는 가장 높은 성장 단계를 적용합니다.

예시:

```text
egg   min_level = 1
baby  min_level = 3
child min_level = 5
teen  min_level = 8
adult min_level = 10
```

정확한 단계별 레벨 기준은 seed 데이터에서 조정할 수 있습니다.

---

### character_growth_histories 저장 기준

퀴즈 완료로 경험치 또는 성장 상태가 바뀐 경우 `character_growth_histories`에 기록합니다.

```text
quiz_session_id = 완료된 quiz_sessions.id
answer_id = null
reason = "quiz_complete"
gained_exp = earned_exp
before_level / after_level
before_stage / after_stage
```

현재 정책에서는 성장 처리가 문제별 답안이 아니라 퀴즈 세션 완료 단위로 발생하므로 `answer_id`는 사용하지 않아도 됩니다.

---

### 응답 200

```json
{
  "data": {
    "quiz_session_id": 10,
    "total_question_count": 5,
    "correct_count": 3,
    "wrong_count": 2,
    "earned_exp": 30,
    "character": {
      "id": 1,
      "level": 2,
      "exp": 10,
      "total_exp": 130,
      "growth_stage": "baby",
      "leveled_up": true,
      "stage_changed": true
    },
    "streak": {
      "current_streak": 4,
      "longest_streak": 7,
      "last_answered_date": "2026-06-21"
    }
  }
}
```

---

### 주요 에러

모든 문제를 제출하지 않은 경우:

```json
{
  "error": {
    "code": "QUIZ_SESSION_NOT_FULLY_ANSWERED",
    "message": "아직 모든 문제를 제출하지 않았습니다.",
    "answered_count": 3,
    "total_question_count": 5
  }
}
```

이미 완료된 세션인 경우:

```json
{
  "error": {
    "code": "QUIZ_SESSION_ALREADY_COMPLETED",
    "message": "이미 완료된 퀴즈 세션입니다."
  }
}
```

---

## 5. 캐릭터 마스터 데이터 API

현재 1차 MVP에서는 사용자가 캐릭터를 선택하지 않으므로 필수 API는 아닙니다.

다만 프론트에서 캐릭터 표시용 데이터를 별도로 조회해야 한다면 아래 API를 후순위로 추가할 수 있습니다.

---

## 5.1 캐릭터 타입 목록 조회

### `GET /api/character-types`

활성화된 캐릭터 타입 목록을 조회합니다.

---

### 응답 200

```json
{
  "data": [
    {
      "id": 1,
      "name": "토끼",
      "description": "귀여운 토끼 캐릭터",
      "is_active": true
    }
  ]
}
```

---

### 우선순위

2순위입니다.

1차에서는 `GET /api/users/me/home` 응답에 필요한 캐릭터 정보를 포함하면 생략할 수 있습니다.

---

## 5.2 캐릭터 성장 단계 조회

### `GET /api/character-types/:id/stages`

특정 캐릭터 타입의 성장 단계 정보를 조회합니다.

---

### 응답 200

```json
{
  "data": [
    {
      "growth_stage": "egg",
      "min_level": 1,
      "image_url": "https://..."
    },
    {
      "growth_stage": "baby",
      "min_level": 3,
      "image_url": "https://..."
    }
  ]
}
```

---

### 우선순위

2순위입니다.

---

## 6. 관리자 API

관리자 API는 사용자 앱 1차 연동 범위에서는 제외합니다.

단, Backend 전체 작업에서는 추후 별도 명세로 작성합니다.

예상 범위:

```text
- 문제 JSON 업로드
- 문제 목록 조회
- 문제 수정
- 문제 보관 또는 삭제
- 선택지 수정
- 캐릭터 타입 관리
- 캐릭터 성장 단계 관리
```

---

## 7. 통계 API

초기 MVP에서는 별도 통계 API를 만들지 않습니다.

홈 화면에 필요한 통계는 `GET /api/users/me/home`에 포함합니다.

추후 고도화 시 아래 API를 추가할 수 있습니다.

```text
GET /api/users/me/stats
```

---

## 8. 미해결 / 결정 필요 항목

| 항목          | 내용                                             |
| ----------- | ---------------------------------------------- |
| 인증 방식 최종 확정 | 이메일+비밀번호 사용 시 개인정보 처리 필요                       |
| 문제 출제 로직    | 랜덤 출제에서 시작, 추후 안 푼 문제 우선 등 추가 가능               |
| 경험치 공식      | 현재는 `correct_count * 10` 임시 적용                 |
| 레벨업 공식      | 현재는 `80 + level * 40` 임시 적용                    |
| 성장 단계 기준    | seed 데이터의 `character_type_stages.min_level` 기준 |
| 하루 재시도 정책   | 1차는 하루 1세트 완료 기준 권장                            |
| 완료 후 다시 풀기  | 1차는 불가 권장                                      |
| 학습 날짜 조회 범위 | 월 단위 또는 기간 지정 방식 중 선택                          |
| 관리자 API     | 사용자 앱 API 이후 별도 명세 작성                          |

---

## 9. 엔드포인트 요약

### 9.1 1순위 API

| 메서드    | 경로                                       | 인증 | 설명                           |
| ------ | ---------------------------------------- | -: | ---------------------------- |
| `GET`  | `/api/health`                            |    | 헬스체크                         |
| `POST` | `/api/users/init`                        | 🔒 | 사용자 초기화 / 랜덤 캐릭터 배정          |
| `GET`  | `/api/users/me/home`                     | 🔒 | 홈 화면 데이터 조회                  |
| `POST` | `/api/quiz-sessions/today`               | 🔒 | 오늘 퀴즈 세션 생성 또는 조회            |
| `POST` | `/api/quiz-sessions/:sessionId/answers`  | 🔒 | 답안 제출 / 채점 / 답안 기록           |
| `POST` | `/api/quiz-sessions/:sessionId/complete` | 🔒 | 퀴즈 완료 / 경험치 / 성장 / streak 처리 |

---

### 9.2 2순위 API

| 메서드   | 경로                                | 인증 | 설명              |
| ----- | --------------------------------- | -: | --------------- |
| `GET` | `/api/quiz-sessions/:sessionId`   | 🔒 | 퀴즈 세션 상세 / 이어풀기 |
| `GET` | `/api/users/me/learning-dates`    | 🔒 | 학습 완료 날짜 목록     |
| `GET` | `/api/character-types`            |    | 캐릭터 타입 목록       |
| `GET` | `/api/character-types/:id/stages` |    | 캐릭터 성장 단계 목록    |

---

### 9.3 현재 만들지 않는 API

```text
/api/me
/api/onboarding
/api/stats
/api/shop
/api/items
/api/coins
/api/wallet
/api/equipments
/api/wrong-notes
/api/ai/questions
```

---

## 10. 핵심 플로우 요약

### 10.1 최초 시작

```text
회원가입 또는 로그인
→ POST /api/users/init
→ 서버에서 랜덤 캐릭터 배정
→ GET /api/users/me/home
```

---

### 10.2 홈 진입

```text
GET /api/users/me/home
→ 프로필, 캐릭터, streak, 오늘 퀴즈 상태 표시
```

---

### 10.3 오늘의 퀴즈 시작

```text
POST /api/quiz-sessions/today
→ 오늘 세션이 없으면 생성
→ published 문제 5개 배정
→ 문제와 선택지 반환
→ is_correct는 반환하지 않음
```

---

### 10.4 답안 제출

```text
POST /api/quiz-sessions/:sessionId/answers
→ 정답 판정
→ user_question_answers 저장
→ 정답/오답 결과 반환
→ 경험치/성장/streak 처리하지 않음
```

---

### 10.5 결과 보기

```text
POST /api/quiz-sessions/:sessionId/complete
→ 모든 답안 제출 여부 확인
→ user_question_answers 기준 correct_count 계산
→ earned_exp 계산
→ quiz_sessions에 correct_count, earned_exp 확정 저장
→ character 업데이트
→ user_streaks 업데이트
→ character_growth_histories 저장
→ 결과 요약 반환
```

---

## 11. 현재 기준 요약

```text
- API 경로는 users 기준을 사용한다.
- 사용자는 캐릭터를 직접 선택하지 않는다.
- 서버가 최초 초기화 시 랜덤 캐릭터를 배정한다.
- 문제는 객관식만 지원한다.
- 오늘의 퀴즈는 5문항 세트로 진행한다.
- question_choices.is_correct는 프론트에 노출하지 않는다.
- 문제 제출 시점에는 답안 기록만 저장한다.
- user_question_answers.earned_exp는 1차 MVP에서 항상 0으로 저장한다.
- quiz_sessions.correct_count와 earned_exp는 complete API에서 확정 저장한다.
- 진행 중 세션의 answered_count와 correct_count는 user_question_answers를 기준으로 실시간 집계한다.
- 완료된 세션의 correct_count와 earned_exp는 quiz_sessions 값을 사용한다.
- 경험치, 캐릭터 성장, streak는 퀴즈 완료 시점에 처리한다.
- 코인, 상점, 아이템은 현재 구현하지 않는다.
```
