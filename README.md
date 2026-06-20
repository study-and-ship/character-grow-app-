# character-grow-app

성장형 캐릭터 키우기 앱 — **사용자 앱**.
사용자의 작은 행동이 귀여운 캐릭터의 성장으로 이어지는 모바일 앱이다.

## 스택

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS**
- **Capacitor** — 웹앱을 안드로이드 네이티브로 래핑 (Play Store 출시)
- **Supabase** — DB / Storage (publishable key, RLS 기반 접근 제어)
- 배포: **Vercel**

> 문제은행 데이터 생성/업로드는 별도 레포 `character-grow-admin`(Python, 로컬 전용)에서 담당한다.
> 이 앱은 Supabase에서 **읽기** 위주로 동작한다.

## 폴더 구조

```
src/
  app/                 라우트 (App Router)
  lib/supabase/
    client.ts          브라우저용 Supabase 클라이언트 (publishable key)
.env.example           환경변수 템플릿
.env.local             실제 환경변수 (git 제외)
capacitor.config.ts    안드로이드 래핑 설정 (예정)
```

## 시작하기

```bash
npm install
cp .env.example .env.local   # Supabase URL / publishable key 채우기
npm run dev                  # http://localhost:3000
```

## 환경변수

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 publishable key (`sb_publishable_...`, RLS로 보호) |

## 배포 (Vercel)

1. Vercel에서 이 GitHub 레포를 import
2. Environment Variables에 위 두 값 등록
3. push 시 자동 배포

## 안드로이드 (Capacitor)

```bash
# 정적 export 방식 사용 시 next.config 에 output: "export" 설정 후
npm run build
npx cap add android
npx cap sync
npx cap open android
```
