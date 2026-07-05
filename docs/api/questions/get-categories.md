# `GET /api/question-categories`

신규 퀴즈 세션에서 선택할 수 있는 활성 문제 카테고리를 반환합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/topic`

### 인증

필수입니다.

### 요청

Body와 Query Parameter가 없습니다.

### 성공 응답

```json
{
  "data": [
    {
      "id": 1,
      "code": "web",
      "name": "웹 기초"
    },
    {
      "id": 2,
      "code": "javascript",
      "name": "자바스크립트"
    }
  ]
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 500 | `INTERNAL` | 카테고리 조회 실패 |

## 서버 구현 참고

별도 RPC 없이 인증된 서버용 Supabase 클라이언트로 조회합니다.

### 처리 순서

1. 인증 사용자를 확인합니다.
2. `question_categories.is_active = true`인 행을 조회합니다.
3. 표시 순서가 필요하면 별도 `sort_order` 컬럼을 추가합니다.

### 사용 테이블

- `question_categories`

### 캐시

변경 빈도가 낮아 사용자별 비공개 캐시 또는 짧은 서버 캐시를 적용할 수 있습니다.
