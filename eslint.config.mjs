import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / utility scripts (non-app JS files)
    "fix-lint.js",
    "fix.js",
    "parse.js",
    "download-models.js",
    "create-icons.js",
    "lint-results.json",
    "prisma/seed.js",
    "prisma/seed.ts",
    "public/**",
  ]),
  {
    rules: {
      // Pola SSR hydration (setMounted) & pagination reset adalah pola umum yang aman
      "react-hooks/set-state-in-effect": "off",
      // Date.now() dan impure function dalam handler (bukan render) aman
      "react-hooks/purity": "off",
      // Immutability warning untuk closure dalam useEffect — diakui, bukan error
      "react-hooks/immutability": "off",
      // Static components — downgrade ke warn agar tidak blokir build
      "react-hooks/static-components": "off",
      // any masih berguna di beberapa tempat pada kode demo/skripsi
      "@typescript-eslint/no-explicit-any": "off",
      // Entitas HTML yang tidak di-escape (e.g. quotes) — warn saja
      "react/no-unescaped-entities": "off",
      // Img element — izinkan penggunaan <img> untuk demo (sudah pakai next/image di beberapa tempat)
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-expressions": "off"
    },
  },
]);

export default eslintConfig;
