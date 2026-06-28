import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // App Router에서는 루트 layout의 <head>에 폰트 <link>를 두는 것이 정석.
      // (이 규칙은 Pages Router의 _document 기준이라 해당되지 않음)
      "@next/next/no-page-custom-font": "off",
    },
  },
  { ignores: [".next/**", "node_modules/**"] },
];

export default config;
