import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 통합 테스트 서버는 실행 중인 개발 서버와 빌드 잠금을 공유하지 않는다.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // module.scss 에서 `@use "mixins"` 처럼 styles 폴더를 직접 참조할 수 있게 함
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
