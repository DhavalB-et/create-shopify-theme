import globals from "globals";
import pluginJs from "@eslint/js";

export default [
   {
    ignores: [
      "assets/**/*.min.js",
      "assets/**/*.min.css",
      "assets/application.css.liquid",
      "assets/global.js",
      "assets/custom.js",
      "assets/facets.js",
      "assets/cart.js"
    ],
  },
  {
    files: ["**/*.js"],
    ignores: ["assets/**/*.min.js", "assets/**/*.min.css", "assets/application.css.liquid", "assets/global.js"],
    languageOptions: { sourceType: "module", ecmaVersion: "latest" },
    rules: {
      "no-unused-vars": "error", // Disallows variables that are declared but never used in the code
      "no-console": "error", // error about console logs
      "no-debugger": "error", // Disallows debugger statements
      "no-alert": "error", // Discourages use of alert, confirm, and prompt
      eqeqeq: ["error", "always"], // Enforces strict equality (=== and !==)
      curly: "error", // Requires curly braces for all control statements
      "no-undef": "error", // Disallows use of undeclared variables
      "no-use-before-define": ["error", { functions: false, classes: true }], // Prevents usage before declaration
      "no-shadow": "error", // Disallows variable shadowing
      "prefer-const": "error", // Enforces use of const where possible
      "no-var": "error", // Enforces let/const over var
      "prefer-template": "error", // Encourages template literals instead of string concatenation
      "no-loop-func": "error", // Disallows function definitions inside loops
      "max-depth": ["error", 4], // Limits nesting depth
      "no-duplicate-imports": "error", // Prevents duplicate imports
      "no-implied-eval": "error", // Prevents use of `setTimeout` and `setInterval` with string arguments
      "no-self-compare": "error", // Prevents `x == x` which is usually a mistake
      "no-useless-return": "error", // Disallows redundant `return` statements
      "no-unsafe-optional-chaining": "error", // Avoids errors from unsafe `?.` operations
      "array-callback-return": "error", // Ensures `.map()`, `.filter()`, and `.reduce()` have return statements
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-self-assign": "off",
      "no-unreachable": "off",
    },
  },
];
