# `GET /api/users/me/study-records`

선택한 날짜의 완료 세션과 문제별 답안 기록을 반환합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/record`

### 인증

필수입니다.

### Query Parameter

```http
GET /api/users/me/study-records?date=2026-07-05
```

| 이름 | 필수 | 검증 |
| --- | ---: | --- |
| `date` | 예 | `YYYY-MM-DD` 형식 |

### 성공 응답

```json
{
  "data": {
    "date": "2026-07-05",
    "session": {
      "id": 100,
      "status": "completed",
      "category": {
        "id": 1,
        "code": "web",
        "name": "웹 기초"
      },
      "correct_count": 4,
      "total_question_count": 5,
      "earned_exp": 40,
      "earned_coins": 80,
      "completed_at": "2026-07-05T01:20:00.000Z",
      "questions": [
        {
          "sort_order": 1,
          "question_text": "HTML의 의미는?",
          "selected_choice": {
            "id": 201,
            "choice_text": "Hyper Text Markup Language"
          },
          "correct_choice": {
            "id": 201,
            "choice_text": "Hyper Text Markup Language"
          },
          "is_correct": true,
          "explanation": "HTML의 전체 이름입니다."
        }
      ]
    }
  }
}
```

기록이 없으면 `session`은 `null`입니다.

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 날짜 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 500 | `INTERNAL` | 날짜별 기록 조회 실패 |

## 서버 구현 참고

별도 RPC 없이 인증된 서버용 Supabase 클라이언트로 조회합니다.

### 처리 순서

1. 인증 사용자를 확인합니다.
2. `(user_id, session_date)`로 세션을 조회합니다.
3. 완료 세션인 경우 세션 문제와 답안을 순서대로 조회합니다.
4. 선택한 보기, 정답 보기, 해설을 조합합니다.
5. 세션의 확정 보상 값을 반환합니다.

진행 중 세션을 학습 완료 기록으로 보여주지 않습니다.

### 문제 교정과 기록

`is_correct`는 제출 당시 스냅샷을 사용합니다. published 문제를 직접 수정하지 않고 새 버전을 생성하는 정책을 지키면 당시 문제·보기·해설도 안정적으로 복원할 수 있습니다.

### 사용 테이블

- `quiz_sessions`
- `question_categories`
- `quiz_session_questions`
- `questions`
- `question_choices`
- `user_question_answers`
