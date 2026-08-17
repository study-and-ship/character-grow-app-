# `GET /api/quiz-sessions/:sessionId`

특정 퀴즈 세션의 문제, 기존 답안, 하트와 진행 상태를 조회합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/quiz`
- `/result`
- 새로고침 및 앱 재실행 후 진행 복원

### 인증

필수이며 세션 소유자만 조회할 수 있습니다.

### Path Parameter

| 이름 | 설명 |
| --- | --- |
| `sessionId` | 조회할 퀴즈 세션 ID |

### 성공 응답

```json
{
  "data": {
    "id": 100,
    "session_date": "2026-07-05",
    "status": "in_progress",
    "category": {
      "id": 1,
      "code": "web",
      "name": "웹 기초"
    },
    "max_hearts": 3,
    "hearts_remaining": 2,
    "total_question_count": 5,
    "answered_count": 2,
    "correct_count": 1,
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
        "answer": {
          "selected_choice_id": 201,
          "is_correct": true,
          "correct_choice_id": 201,
          "correct_choice_text": "Hyper Text Markup Language",
          "explanation": "HTML의 전체 이름입니다.",
          "answered_at": "2026-07-05T01:10:00.000Z"
        }
      }
    ],
    "started_at": "2026-07-05T01:00:00.000Z",
    "all_answered_at": null,
    "completed_at": null
  }
}
```

### 세션 상태 수명주기

| `status` | 의미 | 프론트 동작 |
| --- | --- | --- |
| `in_progress` | 풀이 중 | 진행 위치 복원 후 퀴즈 계속 |
| `ready_to_complete` | 전량 제출 **또는 하트 0 조기 완료** 로 결과 확인 대기 | 결과 화면으로 이동해 완료 API 호출 |
| `completed` | 보상까지 확정됨 | 결과 요약 표시. 조기 완료였다면 `answered_count < total_question_count`일 수 있음 |
| `abandoned` | 지난 날짜에 풀다 만 세션 (새 세션 시작 시 자동 폐기) | 진입 불가 처리. 답안 제출·완료 요청은 409 |

### 진행 위치 복원

프론트는 `sort_order` 순서로 정렬한 뒤 `answer = null`인 첫 문제를 현재 문제로 사용합니다.
모든 답안이 있거나 `status`가 `ready_to_complete`(하트 0 조기 완료 포함)면 결과 화면으로 이동합니다.

### 정답 노출 규칙

- 미응답 문제: 정답 여부, 정답 보기, 해설을 노출하지 않습니다.
- 답변한 문제: 해당 문제의 정답 보기와 해설을 반환할 수 있습니다.
- 완료 세션: 전체 답안과 당시 채점 결과를 반환할 수 있습니다.

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 세션 ID 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 403 | `FORBIDDEN` | 다른 사용자의 세션 |
| 404 | `QUIZ_SESSION_NOT_FOUND` | 세션이 없음 |
| 500 | `INTERNAL` | 상세 조회 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("get_quiz_session", {
  p_session_id: params.sessionId,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `params.sessionId` | `p_session_id` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 집계 기준

```text
in_progress / ready_to_complete
→ user_question_answers를 기준으로 answered_count와 correct_count 계산

completed
→ quiz_sessions.correct_count, earned_exp, earned_coins 확정값 사용
```

### 사용 테이블

- `quiz_sessions`
- `question_categories`
- `quiz_session_questions`
- `questions`
- `question_choices`
- `user_question_answers`
