# 퀴즈펫 (QuizPet) 🐣

매일 퀴즈를 풀어 **알 하나를 부화시키고**, 나만의 픽셀 펫을 키우는 다마고치형 학습 앱입니다.
정답을 맞히면 EXP·코인이 쌓이고, 첫 레벨업에서 알이 부화해 랜덤 펫이 태어납니다.
모은 코인으로 알/펫을 꾸미고, 달력에서 연속 학습과 지난 기록을 확인할 수 있어요.

> 현재 단계는 **프론트엔드 목업**입니다. 문제·기록·코인 등 모든 데이터는 클라이언트 메모리에서
> 동작하는 가데이터이며, 새로고침하면 초기화됩니다. (백엔드 연동 전 UI/UX 확정용)

---

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | **Next.js 16.2.9** (App Router, Turbopack) |
| 런타임 | **React 19.2** |
| 언어 | **TypeScript** (strict) |
| 스타일 | **CSS Modules + Sass** (`*.module.scss`, 라우트별 분리) |
| 상태 관리 | **React Context** (`GameProvider`, 인메모리) |
| 린트 | ESLint 9 (flat config) + `eslint-config-next` |

---

## 시작하기

요구 사항: **Node.js 18.18 이상** (LTS 20+ 권장)

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버 (Turbopack)
npm run dev
# → http://localhost:3000  (자동으로 /login 으로 이동)
```

### 그 외 스크립트

```bash
npm run build   # 프로덕션 빌드
npm run start   # 빌드 결과 실행 (build 후)
npm run lint    # ESLint 검사
```

> 폰트(Gaegu)는 루트 레이아웃 `<head>`의 `<link>`로 불러옵니다.
> 빌드 시 외부 폰트를 받아오지 않으므로 어떤 CI 환경에서도 빌드가 통과합니다.

---

## 화면 흐름

```
/login ──▶ /start(닉네임) ──▶ /home ──▶ /quiz ──▶ /result ──▶ /home
   │                            │                               (부화/레벨업 연출)
   └─ /signup                   ├─ /shop     (알/펫 꾸미기)
                                ├─ /record   (달력·날짜별 학습 기록)
                                └─ /wardrobe (내 옷장 - 보유 아이템 착용/해제)
```

- **부화 규칙**: EXP가 차서 **처음 레벨업**하는 순간 알이 부화합니다. 스포일러 방지를 위해
  퀴즈·결과 화면에서는 계속 알로 보이다가, 결과 → 홈으로 돌아갈 때 부화 연출이 재생됩니다.
- **상점**: 부화 전에는 *알 꾸미기*(무늬·모자·둥지)만, 부화 후에는 *펫 아이템*(모자·안경)이 열립니다.
- **주제 선택**: 퀴즈 시작 시 프리셋 주제(웹 기초·자바스크립트 등) 외에 **텍스트 입력으로 커스텀 주제**도 지정할 수 있습니다.
- **옷장**: 홈의 옷장 버튼(`/wardrobe`)에서 구매한 아이템을 **카테고리(무늬·모자·안경·둥지)별로** 모아 보고 착용/해제합니다.

---

## 프로젝트 구조

```
quizpet/
├─ src/
│  ├─ app/                          # 라우트 + 레이아웃 전용 (App Router)
│  │  ├─ layout.tsx                 # 루트 레이아웃(서버 컴포넌트): 폰트 link, Providers 주입
│  │  ├─ page.tsx                   # "/" → /login 리다이렉트
│  │  ├─ globals.scss               # 디자인 토큰(:root)·리셋·모바일 대응만 (전역 최소화)
│  │  │
│  │  ├─ (auth)/                    # 인증 라우트 그룹 (URL 에는 노출되지 않음)
│  │  │  ├─ _components/
│  │  │  │  ├─ AuthHeader.tsx        #   로그인·회원가입 공용 헤더(타이틀 + 물음표 알)
│  │  │  │  └─ AuthHeader.module.scss
│  │  │  ├─ login/   (page.tsx + page.module.scss)
│  │  │  ├─ signup/  (page.tsx + page.module.scss)
│  │  │  └─ start/   (page.tsx + page.module.scss)   # 닉네임 입력 → 게임 시작
│  │  │
│  │  └─ (game)/                    # 게임 라우트 그룹
│  │     ├─ home/      # 메인: EXP·기분·통계(연속학습·옷장·정답률), 퀴즈 시작
│  │     ├─ quiz/      # 4지선다 풀이 + 해설
│  │     ├─ result/    # 세션 결과(정답률·획득 보상)
│  │     ├─ record/    # 날짜별 학습 기록
│  │     ├─ shop/      # 알/펫 꾸미기 상점
│  │     └─ wardrobe/  # 내 옷장: 보유 아이템 카테고리별 착용/해제
│  │        (각 폴더 = page.tsx + page.module.scss)
│  │
│  ├─ components/                   # 재사용 UI (라우트 비종속)
│  │  ├─ pixel/                     # 픽셀 그래픽
│  │  │  ├─ PetSprite.tsx            #   펫(32×32) + 표정 + 액세서리 + 기분 이펙트
│  │  │  ├─ EggSprite.tsx            #   알 + 꾸미기(무늬·모자·둥지)
│  │  │  ├─ Creature.tsx             #   부화 여부에 따라 알/펫 전환
│  │  │  ├─ Icon.tsx                 #   픽셀 아이콘(fire·coin·book·shirt…)
│  │  │  ├─ Hearts.tsx               #   남은 목숨 하트
│  │  │  └─ pixel.module.scss        #   스프라이트 애니메이션
│  │  ├─ overlays/                  # 전역 오버레이
│  │  │  ├─ Overlays.tsx             #   달력 / 주제선택 / 부화 / 레벨업 모달
│  │  │  ├─ Toast.tsx                #   토스트
│  │  │  └─ overlays.module.scss
│  │  ├─ layout/
│  │  │  ├─ PhoneFrame.tsx           #   앱 셸(폰 프레임 + 스크롤 영역 + 오버레이)
│  │  │  └─ BottomNav.tsx            #   홈/상점 하단 탭
│  │  └─ providers/Providers.tsx     # GameProvider + PhoneFrame 묶음("use client")
│  │
│  ├─ context/
│  │  └─ GameContext.tsx            # 전역 상태 + 액션(useGame 훅). 순수 로직은 lib/game.ts 호출
│  │
│  ├─ lib/
│  │  ├─ data.ts                    # 문제·주제·기분 문구·게임 상수(EXP/코인 등)
│  │  ├─ game.ts                    # 순수 헬퍼: 날짜키·정답률·하루이동·기록시드
│  │  └─ pixel/
│  │     ├─ pet.ts / egg.ts / accessories.ts / icons.ts  # 픽셀 데이터 + 팔레트
│  │     └─ render.ts               #   그리드→SVG rect 변환 공용 유틸(중복 제거 핵심)
│  │
│  ├─ styles/
│  │  └─ _mixins.scss               # 라우트 공용 스타일 믹스인(버튼·카드·칩·옵션…)
│  │
│  └─ types/
│     └─ game.ts                    # 공용 타입 정의
│
├─ next.config.ts                   # sassOptions.loadPaths 로 `@use "mixins"` 해석
├─ eslint.config.mjs                # ESLint 9 flat config
├─ tsconfig.json                    # paths: "@/*" → "./src/*"
└─ package.json
```

---

## 설계 원칙 (코드 리뷰 포인트)

**1. 라우트별 컴포넌트/스타일 분리**
화면마다 `page.tsx` + `page.module.scss`가 한 폴더에 함께 있습니다(colocation).
스타일을 한 파일에 몰지 않고 라우트 단위로 쪼개, 한 화면을 고치면 그 화면 파일만 보면 됩니다.

**2. 스타일 중복 제거 (믹스인)**
버튼·카드·칩·선택지처럼 여러 화면이 공유하는 프리미티브는 `styles/_mixins.scss`에
**한 번만** 정의하고, 각 라우트 모듈이 `@use "mixins" as m;` 후 `@include` 해서 사용합니다.
디자인 토큰은 `globals.scss`의 `:root` CSS 변수로 단일 관리합니다.

**3. 서버/클라이언트 경계 최소화**
레이아웃은 **서버 컴포넌트**로 유지하고, 상호작용이 필요한 잎(leaf) 컴포넌트에만
`"use client"`를 둡니다. 상태는 루트에 한 번 마운트되는 `GameProvider`가 보관하므로
클라이언트 라우팅 사이에도 상태가 유지됩니다.

**4. 픽셀 렌더 로직 단일화**
펫·알·아이콘·하트가 제각각 SVG를 만들지 않고, `lib/pixel/render.ts`의
`gridRects()`·`coordRects()` **하나의 유틸**을 공유합니다. (중복 함수 제거)

**5. 상태와 순수 로직 분리**
부수효과 없는 계산(날짜 키, 정답률, 기록 시드 등)은 `lib/game.ts`의 순수 함수로 빼고,
`GameContext`는 그 함수들을 조합해 상태만 갱신합니다 → 테스트·추적이 쉬움.

---

## 데이터 저장 위치 (중요)

현재 모든 게임 상태(닉네임·레벨·코인·보유 아이템 등)는 **React 상태(`useState`)에만** 들어있습니다.
즉 브라우저 탭이 실행되는 동안 **메모리(RAM)에 떠 있는 임시 변수**일 뿐, localStorage·sessionStorage·쿠키·DB **어디에도 저장하지 않습니다.**

- **화면 이동**(홈↔퀴즈↔상점): `GameProvider`가 최상단에 한 번만 마운트되어 안 죽으므로 **유지됨** ✅
- **새로고침(F5)·탭 종료**: JS가 처음부터 다시 실행 → `createInitialState()`로 **값 초기화** ❌
- 단, 라우트 가드가 없어 새로고침해도 **URL(현재 화면)은 그대로** 유지됨 (로그인으로 튕기지 않음). 리다이렉트는 `/` → `/login` 하나뿐.

> 영속화가 필요하면 localStorage 동기화(기기 저장) 또는 Supabase 연동(서버 저장)을 붙여야 합니다.

---

## 백엔드 연동 시 (다음 단계 가이드)

- 데이터 진입점이 `lib/data.ts`(문제·주제)와 `GameContext`(진행 상태)로 모여 있어,
  이 둘을 API 호출로 교체하면 됩니다.
- 영속화가 필요하면 `GameProvider`의 초기 상태/액션에서 서버 fetch 또는
  localStorage 동기화를 추가하세요. (현재는 의도적으로 인메모리)
