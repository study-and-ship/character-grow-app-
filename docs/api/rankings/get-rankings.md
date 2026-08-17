# `GET /api/rankings`

완료된 퀴즈 세션의 누적 정답 수 기준 전체 사용자 랭킹과 내 순위를 조회합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/ranking`
- `/home` (내 순위 타일)

### 인증

필수입니다. 랭킹 항목에는 사용자 ID 같은 식별자를 노출하지 않습니다.

### 요청

```text
GET /api/rankings?limit=5
```

| Query | 필수 | 설명 |
| --- | ---: | --- |
| `limit` | 아니요 | 상위 목록 개수. 1~50, 기본 5 |

### 성공 응답

```json
{
  "data": {
    "top": [
      {
        "rank": 1,
        "nickname": "별밤",
        "sprite_key": "cat",
        "level": 12,
        "growth_stage": "adult",
        "correct_total": 248,
        "current_streak": 21,
        "is_me": false
      },
      {
        "rank": 2,
        "nickname": "펫집사",
        "sprite_key": "bunny",
        "level": 8,
        "growth_stage": "teen",
        "correct_total": 162,
        "current_streak": 12,
        "is_me": true
      }
    ],
    "me": {
      "rank": 2,
      "nickname": "펫집사",
      "sprite_key": "bunny",
      "level": 8,
      "growth_stage": "teen",
      "correct_total": 162,
      "current_streak": 12,
      "is_me": true
    }
  }
}
```

- 순위 기준: 완료 세션의 누적 정답 수 내림차순, 동률이면 레벨 내림차순.
- `me`는 상위 목록 포함 여부와 무관하게 항상 내 순위를 담습니다.
- 초기화(`POST /api/users/init`) 전 사용자는 랭킹에 포함되지 않으며 `me`가 `null`입니다.

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | `limit` 범위 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 500 | `INTERNAL` | 랭킹 조회 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("get_rankings", { p_limit: query.limit ?? 5 });
```

RLS가 타인 `profiles` 조회를 막으므로 SECURITY DEFINER RPC가
공개 가능한 필드(닉네임·펫·레벨·누적 정답·streak)만 골라 반환합니다.

### 처리 순서

1. 인증 사용자를 확인합니다.
2. 캐릭터가 있는 전체 사용자를 대상으로 완료 세션의 `correct_count` 합계를 집계합니다.
3. 누적 정답 수 내림차순(동률 시 레벨 내림차순)으로 `rank()`를 매깁니다.
4. 상위 `limit`명과 요청 사용자 항목을 반환합니다.

### 사용 테이블

- `profiles`
- `characters`
- `character_types`
- `user_streaks`
- `quiz_sessions`
