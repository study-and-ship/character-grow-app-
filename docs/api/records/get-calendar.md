# `GET /api/users/me/study-calendar`

선택한 월에 퀴즈 보상을 완료한 날짜와 일별 요약을 반환합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/home` 달력 오버레이
- `/record`

### 인증

필수입니다.

### Query Parameter

```http
GET /api/users/me/study-calendar?year=2026&month=7
```

| 이름 | 필수 | 검증 |
| --- | ---: | --- |
| `year` | 예 | 4자리 연도 |
| `month` | 예 | 1~12 |

### 성공 응답

```json
{
  "data": {
    "year": 2026,
    "month": 7,
    "days": [
      {
        "date": "2026-07-01",
        "completed": true,
        "correct_count": 4,
        "total_question_count": 5
      },
      {
        "date": "2026-07-03",
        "completed": true,
        "correct_count": 3,
        "total_question_count": 5
      }
    ]
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 연도 또는 월 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 500 | `INTERNAL` | 달력 조회 실패 |

## 서버 구현 참고

별도 RPC 없이 인증된 서버용 Supabase 클라이언트로 조회합니다.

### 처리 순서

1. 인증 사용자를 확인합니다.
2. 요청 월의 시작·종료 시각을 한국 시간 기준으로 계산합니다.
3. 사용자의 `completed` 세션만 조회합니다.
4. `session_date` 기준으로 일별 요약을 반환합니다.

### 사용 테이블

- `quiz_sessions`

### 캐시

사용자별 응답입니다. 과거 월은 짧은 클라이언트 캐시가 가능하며 해당 날짜 세션 완료 후 현재 월 캐시를 무효화합니다.
