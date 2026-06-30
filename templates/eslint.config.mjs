import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    ignores: [
      "assets/**/*.min.js",
      "assets/**/*.min.css",
      "assets/jquery-3.7.1.min.js",
    ],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
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
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
];
