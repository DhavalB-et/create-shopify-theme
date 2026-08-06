import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores — ESLint won't touch these files at all
  {
    ignores: [
      "assets/**/*.min.js",
      "assets/**/*.min.css",
      // Don't lint Horizon's own JS files — we customize via new files, not by editing Horizon's
      "assets/*.js",
      // ...but DO lint files we create with the `custom-` prefix
      "!assets/custom-*.js",
    ],
  },
  // Rules and globals for the JS we actually write
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        // Horizon's theme.liquid exposes this global for analytics/tracking
        Shopify: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-console": "error",
      "no-debugger": "error",
      "no-alert": "error",
      "eqeqeq": ["error", "always"],
      "curly": "error",
      "no-undef": "error",
      "no-use-before-define": ["error", { functions: false, classes: true }],
      "no-shadow": "error",
      "prefer-const": "error",
      "no-var": "error",
      "prefer-template": "error",
      "no-loop-func": "error",
      "max-depth": ["error", 4],
      "no-duplicate-imports": "error",
      "no-implied-eval": "error",
      "no-self-compare": "error",
      "no-useless-return": "error",
      "no-unsafe-optional-chaining": "error",
      "array-callback-return": "error",
    },
  },
  pluginJs.configs.recommended,
];
