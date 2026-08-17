# `GET /api/users/me/home`

홈 첫 렌더링에 필요한 작은 요약 데이터를 한 번에 반환하는 화면 전용 조회 API입니다.

## 프론트엔드 API 명세

### 사용 화면

- `/home`
- 전역 부화·레벨업 오버레이 초기 상태

### 인증

필수입니다.

### 요청

Body와 Query Parameter가 없습니다.

### 성공 응답

```json
{
  "data": {
    "profile": {
      "nickname": "펫집사",
      "coins": 420
    },
    "character": {
      "id": 1,
      "character_type": {
        "id": 2,
        "name": "토끼",
        "sprite_key": "bunny"
      },
      "level": 2,
      "exp": 30,
      "required_exp": 80,
      "total_exp": 150,
      "growth_stage": "baby",
      "equipment": {
        "pattern": null,
        "hat": {
          "user_item_id": 50,
          "asset_key": "red_hat"
        },
        "glasses": null,
        "nest": null
      }
    },
    "streak": {
      "current_streak": 5,
      "longest_streak": 8,
      "last_completed_date": "2026-07-04"
    },
    "today_quiz": {
      "session_id": 100,
      "status": "in_progress",
      "answered_count": 2,
      "total_question_count": 5,
      "hearts_remaining": 2
    }
  }
}
```

오늘 세션이 없으면 `today_quiz`는 `null`입니다.

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 409 | `USER_NOT_INITIALIZED` | 프로필 또는 캐릭터 초기화가 안 됨 |
| 500 | `INTERNAL` | 홈 데이터 조회 실패 |

## 서버 구현 참고

현재 전용 RPC는 없습니다. 인증된 서버용 Supabase 클라이언트의 여러 조회를 조합합니다.

### 처리 순서

1. 인증 사용자와 초기화 여부를 확인합니다.
2. 프로필과 코인을 조회합니다.
3. 캐릭터·펫 종류·현재 장착을 조회합니다.
4. streak를 조회합니다.
5. 한국 날짜 기준 오늘 세션을 조회합니다.
6. `answered_count`는 세션 상태와 무관하게 실제 제출된 답안 수를 집계합니다.
   하트 소진으로 조기 완료된 세션은 `completed`여도 `total_question_count`보다 작을 수 있습니다.

서버 내부 조회는 병렬 실행하거나 전용 SQL/RPC로 묶을 수 있습니다.

### 포함하지 않는 데이터

- 월 전체 달력
- 과거 문제별 답안
- 전체 인벤토리
- 상점 전체 상품
- 전체 성장 이력

이 데이터는 해당 화면 진입 시 별도 API로 조회합니다.

### 사용 테이블

- `profiles`
- `characters`
- `character_types`
- `character_equipment`
- `user_items`
- `shop_items`
- `user_streaks`
- `quiz_sessions`
- `quiz_session_questions`
- `user_question_answers`

### 캐시

사용자별 동적 응답이므로 공유 캐시를 사용하지 않습니다. 퀴즈 완료, 구매, 장착 후에는 클라이언트 홈 캐시를 무효화합니다.
