# `POST /api/quiz-sessions/:sessionId/answers`

세션에 배정된 문제 하나의 답안을 제출하고 서버에서 채점합니다. 경험치와 코인은 지급하지 않습니다.

## 프론트엔드 API 명세

### 사용 화면

- `/quiz`

### 인증

필수이며 세션 소유자만 제출할 수 있습니다.

### 요청

```json
{
  "quiz_session_question_id": 1002,
  "selected_choice_id": 205
}
```

| 필드 | 필수 | 설명 |
| --- | ---: | --- |
| `quiz_session_question_id` | 예 | 세션에 배정된 문제 ID |
| `selected_choice_id` | 예 | 사용자가 선택한 보기 ID |

### 성공 응답

```json
{
  "data": {
    "is_correct": false,
    "correct_choice_id": 206,
    "correct_choice_text": "정답 보기",
    "explanation": "문제 해설",
    "hearts_remaining": 1,
    "answered_count": 3,
    "correct_count": 2,
    "total_question_count": 5,
    "status": "in_progress",
    "can_complete": false
  }
}
```

마지막 답안 제출 후:

```json
{
  "data": {
    "is_correct": true,
    "correct_choice_id": 220,
    "correct_choice_text": "정답 보기",
    "explanation": "문제 해설",
    "hearts_remaining": 1,
    "answered_count": 5,
    "correct_count": 4,
    "total_question_count": 5,
    "status": "ready_to_complete",
    "can_complete": true
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 요청 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 403 | `FORBIDDEN` | 다른 사용자의 세션 |
| 404 | `QUIZ_SESSION_NOT_FOUND` | 세션이 없음 |
| 409 | `QUIZ_SESSION_NOT_IN_PROGRESS` | 제출 가능한 상태가 아님 |
| 409 | `QUESTION_NOT_IN_SESSION` | 세션에 배정되지 않은 문제 |
| 409 | `INVALID_CHOICE` | 해당 문제에 속하지 않는 보기 |
| 409 | `ANSWER_ALREADY_SUBMITTED` | 이미 답안을 제출함 |
| 500 | `INTERNAL` | 답안 저장 트랜잭션 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("submit_quiz_answer", {
  p_session_id: params.sessionId,
  p_session_question_id: body.quiz_session_question_id,
  p_selected_choice_id: body.selected_choice_id,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `params.sessionId` | `p_session_id` |
| `body.quiz_session_question_id` | `p_session_question_id` |
| `body.selected_choice_id` | `p_selected_choice_id` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

`submit_quiz_answer`가 하나의 DB 트랜잭션에서 처리합니다.

1. 인증 사용자와 세션 소유권을 확인합니다.
2. 세션 상태가 `in_progress`인지 확인합니다.
3. `quiz_session_question_id`가 해당 세션에 속하는지 확인합니다.
4. 선택지가 배정된 문제에 속하는지 확인합니다.
5. 기존 답안이 있는지 확인합니다.
6. 서버가 `question_choices.is_correct`로 채점합니다.
7. `user_question_answers`에 선택과 당시 정답 여부를 저장합니다.
8. 오답이면 `hearts_remaining`을 1 감소시키되 0 미만으로 만들지 않습니다.
9. 답안 수와 정답 수를 다시 집계합니다.
10. 모든 문제가 제출됐다면 `ready_to_complete`와 `all_answered_at`을 저장합니다.

### 멱등성

네트워크 재시도로 같은 답안이 다시 제출되더라도 하트가 두 번 감소하면 안 됩니다.

```text
UNIQUE(user_question_answers.quiz_session_question_id)
```

동일한 선택으로 재호출하면 기존 결과를 반환할 수 있고, 다른 선택으로 재호출하면 `ANSWER_ALREADY_SUBMITTED`를 반환합니다.

### 사용 테이블

- `quiz_sessions`
- `quiz_session_questions`
- `questions`
- `question_choices`
- `user_question_answers`

### 변경하지 않는 데이터

- `profiles.coins`
- `characters.exp`
- `characters.total_exp`
- `user_streaks`
- `quiz_sessions.correct_count`
- `quiz_sessions.earned_exp`
- `quiz_sessions.earned_coins`

위 값들은 완료 API에서만 변경합니다.
