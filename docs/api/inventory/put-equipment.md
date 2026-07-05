# `PUT /api/users/me/character/equipment/:slot`

현재 캐릭터의 특정 슬롯에 보유 아이템을 장착하거나 기존 아이템을 교체합니다.

## 프론트엔드 API 명세

### 사용 화면

- `/wardrobe`

### 인증

필수입니다.

### Path Parameter

| 이름 | 값 |
| --- | --- |
| `slot` | `pattern`, `hat`, `glasses`, `nest` |

### 요청

```json
{
  "user_item_id": 50
}
```

### 성공 응답

```json
{
  "data": {
    "slot": "hat",
    "equipment": {
      "user_item_id": 50,
      "item_id": 10,
      "name": "빨간 모자",
      "asset_key": "red_hat",
      "equipped_at": "2026-07-05T02:10:00.000Z"
    }
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 슬롯 또는 Body 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 404 | `USER_ITEM_NOT_FOUND` | 해당 보유 아이템이 없음 |
| 409 | `USER_NOT_INITIALIZED` | 캐릭터가 없음 |
| 409 | `EQUIPMENT_SLOT_MISMATCH` | 아이템 슬롯이 요청 슬롯과 다름 |
| 409 | `ITEM_TARGET_MISMATCH` | 알/펫 상태에 맞지 않는 아이템 |
| 500 | `INTERNAL` | 장착 트랜잭션 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("equip_character_item", {
  p_slot: params.slot,
  p_user_item_id: body.user_item_id,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `params.slot` | `p_slot` |
| `body.user_item_id` | `p_user_item_id` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

`equip_character_item`이 하나의 DB 트랜잭션에서 처리합니다.

1. 인증 사용자의 캐릭터를 조회합니다.
2. `user_item_id`가 로그인 사용자 소유인지 확인합니다.
3. 보유 아이템의 카테고리 슬롯이 Path의 `slot`과 같은지 확인합니다.
4. 아이템 대상이 현재 캐릭터의 알/펫 상태와 맞는지 확인합니다.
5. 동일 슬롯의 `character_equipment`를 upsert합니다.
6. 변경된 장착 정보를 반환합니다.

### 제약

```text
PRIMARY KEY(character_id, slot)
UNIQUE(user_item_id)
```

- 캐릭터의 한 슬롯에는 하나만 장착됩니다.
- 하나의 보유 아이템을 여러 슬롯이나 캐릭터에 동시에 장착할 수 없습니다.

### 멱등성

이미 같은 아이템이 같은 슬롯에 장착된 경우 성공으로 처리하고 기존 상태를 반환합니다.

### 사용 테이블

- `characters`
- `user_items`
- `shop_items`
- `item_categories`
- `character_equipment`
