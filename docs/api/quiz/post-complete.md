# `POST /api/quiz-sessions/:sessionId/complete`

결과 보기 버튼에서 세션 결과와 보상을 한 번만 확정합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/result`

### 인증

필수이며 세션 소유자만 완료할 수 있습니다.

### 요청

Body가 없습니다.

### 성공 응답

```json
{
  "data": {
    "session": {
      "id": 100,
      "status": "completed",
      "total_question_count": 5,
      "correct_count": 5,
      "completed_at": "2026-07-05T01:20:00.000Z"
    },
    "rewards": {
      "exp": 50,
      "coins": 200,
      "level_up_bonus_coins": 100,
      "current_coins": 500
    },
    "character_growth": {
      "character_id": 1,
      "gained_exp": 50,
      "before_level": 1,
      "after_level": 2,
      "before_stage": "egg",
      "after_stage": "baby",
      "hatched": true
    },
    "streak": {
      "current_streak": 6,
      "longest_streak": 8,
      "last_completed_date": "2026-07-05"
    }
  }
}
```

### 보상 규칙

- 순 EXP(`rewards.exp`) = 정답 수 × 10 − 오답 수 × 5. 오답이 많으면 음수일 수 있습니다.
- 캐릭터의 현재 레벨 EXP는 0 미만으로 내려가지 않고, 레벨 다운도 없습니다.
- `characters.total_exp`에는 획득분(정답 수 × 10)만 누적합니다.
- 코인(`rewards.coins`) = 정답 수 × 20 + 레벨업 횟수 × 100(`level_up_bonus_coins`).
- 하트 소진으로 조기 완료된 세션은 제출된 답안 기준으로만 집계합니다.
- 알에서 부화(`hatched: true`)하면 장착 중이던 알 아이템을 전부 해제합니다. 보유 목록에는 남습니다.

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 403 | `FORBIDDEN` | 다른 사용자의 세션 |
| 404 | `QUIZ_SESSION_NOT_FOUND` | 세션이 없음 |
| 409 | `QUIZ_SESSION_NOT_READY` | 세션이 `ready_to_complete` 상태가 아님 |
| 409 | `CHARACTER_NOT_FOUND` | 보상을 받을 캐릭터가 없음 |
| 500 | `INTERNAL` | 보상 완료 트랜잭션 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("complete_quiz_session", {
  p_session_id: params.sessionId,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `params.sessionId` | `p_session_id` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

`complete_quiz_session`이 하나의 DB 트랜잭션으로 처리합니다.

1. 세션 행을 잠그고 인증 사용자 소유인지 확인합니다.
2. 이미 `completed`면 저장된 기존 결과를 반환합니다.
3. 상태가 `ready_to_complete`인지 확인합니다. (전량 제출 또는 하트 0 조기 완료)
4. 제출된 답안의 `is_correct` 스냅샷으로 답안 수와 정답 수를 집계합니다.
5. 보상 규칙에 따라 순 EXP와 코인을 계산합니다.
6. `characters`의 경험치·레벨·성장 단계를 계산하고 갱신합니다.
7. 부화가 발생하면 `character_equipment`를 전부 삭제합니다.
8. `profiles.coins`를 증가시킵니다.
9. 한국 날짜 기준으로 `user_streaks`를 하루 한 번 갱신합니다.
10. `character_growth_histories`를 생성합니다.
11. 세션 결과와 `completed_at`을 저장하고 `completed`로 변경합니다.
12. 결과 요약을 반환합니다.

### 중복 보상 방지

```text
ready_to_complete → 보상 지급 → completed
completed         → 추가 지급 없이 기존 결과 반환
```

트랜잭션에서 세션 행 잠금과 상태 검사를 수행해야 합니다. `character_growth_histories.quiz_session_id`의 UNIQUE 제약도 동일 세션의 성장 이력 중복을 차단합니다.

### 확정값

완료 이후 다음 값은 당시 결과 스냅샷입니다.

- `quiz_sessions.correct_count`
- `quiz_sessions.earned_exp`
- `quiz_sessions.earned_coins`
- `quiz_sessions.completed_at`
- `character_growth_histories`

### 사용 테이블

- `quiz_sessions`
- `quiz_session_questions`
- `user_question_answers`
- `profiles`
- `characters`
- `character_type_stages`
- `user_streaks`
- `character_growth_histories`
- `character_equipment` (부화 시 전체 해제)
