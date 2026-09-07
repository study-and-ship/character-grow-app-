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
  features/            Route Handler API clients
.env.example           환경변수 템플릿
.env                   실제 환경변수 (git 제외)
capacitor.config.ts    Vercel URL 기반 내부 테스트 설정
```

## 시작하기

```bash
npm install
cp .env.example .env         # Supabase URL / publishable key 채우기
npm run dev                  # http://localhost:3000
```

## 환경변수

| 키                                     | 설명                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 publishable key (`sb_publishable_...`, RLS로 보호) |

## 배포 (Vercel)

1. Vercel에서 이 GitHub 레포를 import
2. Environment Variables에 위 두 값 등록
3. push 시 자동 배포

상세한 Supabase/Vercel 절차는 [`docs/deployment.md`](docs/deployment.md), Android debug APK 절차는 [`docs/android-testing.md`](docs/android-testing.md)를 따른다. 현재 SSR 구조에서는 정적 export를 사용하지 않는다.
