import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // module.scss 에서 `@use "mixins"` 처럼 styles 폴더를 직접 참조할 수 있게 함
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
