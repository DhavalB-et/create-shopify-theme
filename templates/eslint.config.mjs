import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores — ESLint won't touch these files at all
  {
    ignores: [
      "assets/**/*.min.js",
      "assets/**/*.min.css",
      // Don't lint Dawn's own JS files — we customize via new files, not by editing Dawn's
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
        // Dawn's cross-file globals — declared so our custom code can use them
        Shopify: "readonly",
        routes: "readonly",
        trapFocus: "readonly",
        removeTrapFocus: "readonly",
        onKeyUpEscape: "readonly",
        debounce: "readonly",
        throttle: "readonly",
        fetchConfig: "readonly",
        subscribe: "readonly",
        publish: "readonly",
        PUB_SUB_EVENTS: "readonly",
        ON_CHANGE_DEBOUNCE_TIMER: "readonly",
        CartPerformance: "readonly",
        CartItems: "readonly",
        HTMLUpdateUtility: "readonly",
        SectionId: "readonly",
        ModalDialog: "readonly",
        DetailsModal: "readonly",
        DetailsDisclosure: "readonly",
        DeferredMedia: "readonly",
        BulkAdd: "readonly",
        SearchForm: "readonly",
        CustomerAddresses: "readonly",
        pauseAllMedia: "readonly",
        initializeScrollAnimationTrigger: "readonly",
        enableZoomOnHover: "readonly",
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