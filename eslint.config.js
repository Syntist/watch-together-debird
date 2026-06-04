import js from "@eslint/js";
import solid from "eslint-plugin-solid";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const solidTypescript = solid.configs["flat/typescript"];

export default defineConfig([
  {
    ignores: [
      ".nitro/**",
      ".output/**",
      "dist/**",
      "node_modules/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: solidTypescript.plugins,
    rules: solidTypescript.rules,
  },
  {
    rules: {
      "no-console": "off",
    },
  },
]);
