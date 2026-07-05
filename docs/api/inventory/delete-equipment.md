# `DELETE /api/users/me/character/equipment/:slot`

현재 캐릭터의 특정 슬롯에 장착된 아이템을 해제합니다. 보유 아이템 자체는 삭제하지 않습니다.

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

Body가 없습니다.

### 성공 응답

```json
{
  "data": {
    "slot": "hat",
    "equipment": null
  }
}
```

### 오류 응답

| HTTP | 코드 | 조건 |
| ---: | --- | --- |
| 400 | `VALIDATION` | 슬롯 Enum 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 세션이 없음 |
| 409 | `USER_NOT_INITIALIZED` | 캐릭터가 없음 |
| 500 | `INTERNAL` | 장착 해제 실패 |

## 서버 구현 참고

프론트엔드는 이 RPC를 직접 호출하지 않습니다.

### 호출 RPC

```ts
supabase.rpc("unequip_character_item", {
  p_slot: params.slot,
});
```

| API 값 | RPC 파라미터 |
| --- | --- |
| `params.slot` | `p_slot` |

RPC의 JSON 반환값을 `{ "data": rpcData }`로 감싸서 응답합니다.

### 처리 순서

1. 인증 사용자의 캐릭터를 확인합니다.
2. `(character_id, slot)` 장착 행을 삭제합니다.
3. 슬롯이 비어 있는 상태를 반환합니다.

### 멱등성

이미 슬롯이 비어 있어도 성공으로 처리합니다. 해제 요청을 여러 번 보내도 결과는 동일합니다.

### 사용 테이블

- `characters`
- `character_equipment`
