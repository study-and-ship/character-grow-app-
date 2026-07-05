# `GET /api/users/me`

로그인한 사용자의 서비스 초기화 여부를 확인합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/login`
- 앱 최초 부트스트랩

### 인증

필수입니다.

### 요청

Body와 Query Parameter가 없습니다.

### 성공 응답

초기화 완료:

```json
{
  "data": {
    "initialized": true,
    "profile": {
      "id": "user-uuid",
      "nickname": "펫집사"
    }
  }
}
```

초기화 전:

```json
{
  "data": {
    "initialized": false,
    "profile": null
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 500 | `INTERNAL` | DB 조회 실패 |

## 서버 구현 참고

별도 RPC 없이 인증된 서버용 Supabase 클라이언트로 조회합니다.

### 처리 순서

1. 인증 사용자를 확인합니다.
2. `profiles.id = auth.user.id`인 행을 조회합니다.
3. 프로필 존재 여부를 `initialized`로 반환합니다.

### 사용 테이블

- `auth.users`
- `profiles`
