# `POST /api/users/init`

로그인 사용자의 프로필, streak, 최초 펫을 중복 없이 초기화합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/start`

### 인증

필수입니다.

### 요청

```json
{
  "nickname": "펫집사"
}
```

| 필드 | 필수 | 검증 |
| --- | ---: | --- |
| `nickname` | 예 | 공백 제거 후 1~20자 |

### 성공 응답

```json
{
  "data": {
    "profile": {
      "id": "user-uuid",
      "nickname": "펫집사",
      "coins": 300
    },
    "character": {
      "id": 1,
      "character_type_id": 2,
      "level": 1,
      "exp": 0,
      "total_exp": 0,
      "growth_stage": "egg"
    },
    "streak": {
      "current_streak": 0,
      "longest_streak": 0,
      "last_completed_date": null
    },
    "is_new_user": true
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 닉네임 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 409 | `NO_ACTIVE_CHARACTER_TYPE` | 배정 가능한 펫 종류가 없음 |
| 500 | `INTERNAL` | 초기화 트랜잭션 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다. Route Handler가 인증 세션을 전달한 상태로 호출합니다.

### 호출 RPC

```ts
supabase.rpc("initialize_user", {
  p_nickname: body.nickname,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `body.nickname` | `p_nickname` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

`initialize_user`가 하나의 DB 트랜잭션에서 처리합니다.

1. 인증 사용자를 확인합니다.
2. `profiles`를 생성하거나 기존 값을 조회합니다.
3. `user_streaks`를 생성하거나 기존 값을 조회합니다.
4. 활성 `character_types` 중 하나를 무작위 선택합니다.
5. 사용자 캐릭터가 없을 때만 `characters`를 생성합니다.
6. 최종 초기화 데이터를 반환합니다.

### 멱등성

같은 사용자가 여러 번 호출해도 프로필, streak, 캐릭터가 추가 생성되지 않아야 합니다.

필요 제약:

```text
profiles.id PRIMARY KEY
user_streaks.user_id PRIMARY KEY
characters.user_id UNIQUE
```

### 사용 테이블

- `profiles`
- `user_streaks`
- `character_types`
- `characters`
