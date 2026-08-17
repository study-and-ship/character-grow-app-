# `GET /api/shop/items`

현재 캐릭터 성장 상태에 맞는 판매 아이템과 사용자의 보유·장착 여부를 반환합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/shop`

### 인증

필수입니다.

### Query Parameter

```http
GET /api/shop/items?target_type=pet&slot=hat
```

| 이름 | 필수 | 값 |
| --- | ---: | --- |
| `target_type` | 아니요 | `egg`, `pet` |
| `slot` | 아니요 | `pattern`, `hat`, `glasses`, `nest` |

Query를 생략하면 현재 캐릭터 상태에 맞는 활성 상품 전체를 반환할 수 있습니다.

### 성공 응답

```json
{
  "data": {
    "coins": 420,
    "character": {
      "id": 1,
      "growth_stage": "baby",
      "target_type": "pet"
    },
    "items": [
      {
        "id": 10,
        "category": {
          "id": 2,
          "code": "pet_hat",
          "name": "모자",
          "slot": "hat",
          "target_type": "pet"
        },
        "name": "빨간 모자",
        "price": 100,
        "asset_key": "red_hat",
        "owned": true,
        "user_item_id": 50,
        "equipped": true
      }
    ]
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 필터 Enum 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 409 | `USER_NOT_INITIALIZED` | 프로필 또는 캐릭터가 없음 |
| 500 | `INTERNAL` | 상점 목록 조회 실패 |

## 서버 구현 참고

별도 RPC 없이 인증된 서버용 Supabase 클라이언트의 여러 조회를 조합합니다.

### 처리 순서

1. 인증 사용자와 캐릭터를 확인합니다.
2. 캐릭터 성장 단계에서 현재 대상이 `egg`인지 `pet`인지 결정합니다.
3. 활성 `shop_items`와 `item_categories`를 조회합니다.
4. `target_type` 필터가 있으면 그 대상, 없으면 현재 대상의 상품을 선택하고 `slot` 필터를 적용합니다.
5. 사용자의 `user_items`와 `character_equipment`를 조합합니다.
6. 현재 코인, 보유 여부, 장착 여부를 반환합니다.

`target_type` 필터로 현재 단계와 다른 대상의 상품도 조회할 수 있지만,
구매는 구매 RPC가 현재 단계 기준 `ITEM_TARGET_MISMATCH`(409)로 막습니다.

### 사용 테이블

- `profiles`
- `characters`
- `item_categories`
- `shop_items`
- `user_items`
- `character_equipment`
