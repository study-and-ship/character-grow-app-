# `POST /api/shop/items/:itemId/purchase`

코인을 차감하고 상점 아이템을 사용자 보유 아이템으로 지급합니다.

> 구매는 **장착을 포함하지 않습니다.** "구매 즉시 장착" UX가 필요하면 구매 성공 후
> 응답의 `user_item.id`로 [`PUT /api/users/me/character/equipment/:slot`](../inventory/put-equipment.md)을 이어서 호출합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/shop`

### 인증

필수입니다.

### Path Parameter

| 이름 | 설명 |
| --- | --- |
| `itemId` | 구매할 `shop_items.id` |

### 요청

Body가 없습니다.

### 성공 응답

```json
{
  "data": {
    "user_item": {
      "id": 50,
      "item_id": 10,
      "name": "빨간 모자",
      "asset_key": "red_hat",
      "purchased_at": "2026-07-05T02:00:00.000Z"
    },
    "spent_coins": 100,
    "remaining_coins": 320
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 아이템 ID 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 404 | `ITEM_NOT_FOUND` | 상품이 없거나 판매 중이 아님 |
| 409 | `USER_NOT_INITIALIZED` | 프로필 또는 캐릭터가 없음 |
| 409 | `ITEM_ALREADY_OWNED` | 이미 보유한 아이템 |
| 409 | `ITEM_TARGET_MISMATCH` | 현재 알/펫 상태에서 사용할 수 없음 |
| 409 | `INSUFFICIENT_COINS` | 코인이 부족함 |
| 500 | `INTERNAL` | 구매 트랜잭션 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("purchase_shop_item", {
  p_item_id: params.itemId,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `params.itemId` | `p_item_id` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

`purchase_shop_item`이 하나의 DB 트랜잭션에서 처리합니다.

1. 인증 사용자의 `profiles` 행을 잠급니다.
2. 상품이 존재하고 `is_active = true`인지 확인합니다.
3. 캐릭터의 알/펫 상태와 상품 대상이 맞는지 확인합니다.
4. 같은 `user_id`, `item_id` 보유 행이 있는지 확인합니다.
5. 코인이 가격 이상인지 확인합니다.
6. `profiles.coins`에서 가격을 차감합니다.
7. `user_items`를 생성합니다.
8. 남은 코인과 지급 아이템을 반환합니다.

### 멱등성·동시성

```text
UNIQUE(user_items.user_id, user_items.item_id)
```

같은 구매 요청이 동시에 들어와도 다음이 보장되어야 합니다.

- 코인은 한 번만 차감
- 보유 아이템은 한 번만 생성
- 이미 보유한 경우 추가 차감 없이 `ITEM_ALREADY_OWNED`

### 사용 테이블

- `profiles`
- `characters`
- `item_categories`
- `shop_items`
- `user_items`
