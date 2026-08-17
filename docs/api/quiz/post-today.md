# `POST /api/quiz-sessions/today`

선택한 카테고리로 오늘의 퀴즈 세션을 생성하거나 이미 존재하는 오늘 세션을 반환합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/topic`
- 홈의 이어서 풀기 진입

### 인증

필수입니다.

### 요청

```json
{
  "category_id": 1
}
```

| 필드 | 필수 | 설명 |
| --- | ---: | --- |
| `category_id` | 신규 세션 생성 시 예 | 활성 문제 카테고리 ID |

### 성공 응답

신규 생성과 기존 세션 반환 모두 `200`입니다. 프론트엔드는 생성 여부를 구분하지 않고 반환된 세션 상태를 사용합니다.

```json
{
  "data": {
    "id": 100,
    "session_date": "2026-07-05",
    "category": {
      "id": 1,
      "code": "web",
      "name": "웹 기초"
    },
    "status": "in_progress",
    "max_hearts": 3,
    "hearts_remaining": 3,
    "total_question_count": 5,
    "answered_count": 0,
    "correct_count": 0,
    "earned_exp": 0,
    "earned_coins": 0,
    "questions": [
      {
        "session_question_id": 1001,
        "sort_order": 1,
        "question_id": 20,
        "title": "HTML 기본",
        "question_text": "HTML의 의미는?",
        "difficulty": 1,
        "choices": [
          {
            "id": 201,
            "choice_text": "Hyper Text Markup Language",
            "sort_order": 1
          }
        ],
        "answer": null
      }
    ],
    "started_at": "2026-07-05T01:00:00.000Z",
    "all_answered_at": null,
    "completed_at": null
  }
}
```

응답의 선택지에는 `is_correct`를 포함하지 않습니다.

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 카테고리 ID 누락 또는 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 404 | `CATEGORY_NOT_FOUND` | 활성 카테고리가 없음 |
| 409 | `USER_NOT_INITIALIZED` | 사용자 서비스 데이터가 없음 |
| 409 | `NOT_ENOUGH_QUESTIONS` | 출제 가능한 문제가 5개 미만 |
| 500 | `INTERNAL` | 세션 생성 트랜잭션 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("start_today_quiz", {
  p_category_id: body.category_id,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `body.category_id` | `p_category_id` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

`start_today_quiz`가 하나의 DB 트랜잭션에서 처리합니다.

1. 인증 사용자와 초기화 상태를 확인합니다.
2. 서버에서 한국 기준 오늘 날짜를 계산합니다.
3. 지난 날짜에 풀다 만(`in_progress`) 세션이 있으면 `abandoned`로 폐기합니다.
   다 풀어둔(`ready_to_complete`) 과거 세션은 폐기하지 않으며 언제든 완료(보상)할 수 있습니다.
4. `(user_id, session_date)` 세션을 조회합니다.
5. 기존 세션이 있으면 요청 카테고리와 관계없이 기존 세션을 반환합니다.
6. 세션이 없으면 카테고리 활성 여부를 확인합니다.
7. 해당 카테고리의 `published` 문제 중 5개를 선택합니다.
8. `quiz_sessions`를 생성합니다.
9. 선택한 문제와 순서를 `quiz_session_questions`에 저장합니다.
10. 문제와 보기를 반환합니다.

### 동시성·멱등성

두 요청이 동시에 들어와도 오늘 세션은 하나만 생성되어야 합니다.

```text
UNIQUE(quiz_sessions.user_id, quiz_sessions.session_date)
```

UNIQUE 충돌이 발생하면 실패시키지 않고 이미 생성된 세션을 다시 조회해 반환합니다.

### 문제 고정 정책

- 세션 문제는 생성 시점에 고정합니다.
- 재접속하거나 문제은행 상태가 바뀌어도 `quiz_session_questions`는 변경하지 않습니다.
- 세션에 배정된 published 문제 버전은 직접 수정하지 않는 것을 전제로 합니다.

### 사용 테이블

- `question_categories`
- `questions`
- `question_choices`
- `quiz_sessions`
- `quiz_session_questions`
- `user_question_answers`
