# `GET /api/users/me/inventory`

사용자가 보유한 전체 아이템과 캐릭터의 현재 슬롯별 장착 상태를 반환합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/wardrobe`

### 인증

필수입니다.

### Query Parameter

선택적으로 필터를 지원할 수 있습니다.

```http
GET /api/users/me/inventory?target_type=pet&slot=hat
```

### 성공 응답

```json
{
  "data": {
    "character": {
      "id": 1,
      "growth_stage": "baby",
      "target_type": "pet"
    },
    "items": [
      {
        "user_item_id": 50,
        "item_id": 10,
        "name": "빨간 모자",
        "asset_key": "red_hat",
        "slot": "hat",
        "target_type": "pet",
        "purchased_at": "2026-07-05T02:00:00.000Z",
        "equipped": true
      }
    ],
    "equipment": {
      "pattern": null,
      "hat": {
        "user_item_id": 50,
        "item_id": 10,
        "asset_key": "red_hat"
      },
      "glasses": null,
      "nest": null
    }
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 필터 Enum 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 409 | `USER_NOT_INITIALIZED` | 캐릭터가 없음 |
| 500 | `INTERNAL` | 인벤토리 조회 실패 |

## 서버 구현 참고

별도 RPC 없이 인증된 서버용 Supabase 클라이언트의 여러 조회를 조합합니다.

### 처리 순서

1. 인증 사용자와 캐릭터를 확인합니다.
2. 사용자의 `user_items`를 구매 시각 또는 카테고리 순으로 조회합니다.
3. `shop_items`, `item_categories`를 조인합니다.
4. 캐릭터의 `character_equipment`를 조회합니다.
5. 아이템별 `equipped`와 슬롯별 장착 요약을 반환합니다.

### 사용 테이블

- `characters`
- `user_items`
- `shop_items`
- `item_categories`
- `character_equipment`
