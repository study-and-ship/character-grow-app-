# Supabase Auth 인증

로그인·회원가입·로그아웃은 별도 Route Handler를 만들지 않고 브라우저용 Supabase 클라이언트를 사용합니다.

## 프론트엔드 인증 명세

이 문서만 예외적으로 프론트엔드가 Supabase Auth SDK를 직접 사용합니다. PostgreSQL RPC를 직접 호출하는 것은 아닙니다.

### 회원가입

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});
```

성공 후 `/start`로 이동합니다. `profiles`, `user_streaks`, `characters`는 [`POST /api/users/init`](../users/post-init.md)에서 생성합니다.

이메일 확인 기능을 활성화한 경우 세션이 즉시 생성되지 않을 수 있으므로 확인 메일 안내 화면 또는 메시지가 필요합니다.

### 로그인

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

성공 후 [`GET /api/users/me`](../users/get-me.md)를 호출합니다.

```text
initialized = false → /start
initialized = true  → /home
```

### 로그아웃

```ts
const { error } = await supabase.auth.signOut();
```

성공 후 `/login`으로 이동하고 클라이언트 게임 상태와 캐시를 비웁니다.

## 서버 구현 참고

### 보안 원칙

- 비밀번호를 애플리케이션 DB에 저장하지 않습니다.
- 액세스 토큰이나 사용자 ID를 임의의 요청 Body로 전달하지 않습니다.
- 보호된 Route Handler는 서버에서 `supabase.auth.getUser()`로 현재 사용자를 확인합니다.
- 인증 오류 메시지는 계정 존재 여부를 과도하게 노출하지 않도록 처리합니다.
