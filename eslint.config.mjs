import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import vueScopedCss from "eslint-plugin-vue-scoped-css";
import jsdoc from "eslint-plugin-jsdoc";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

// Flat config (ESLint 9+). Migrated from the legacy .eslintrc.js.
export default [
    {
        ignores: [
            "test/*.js",
            "server/modules/**",
            "src/util.js",
            "dist/**",
            "dist-ssr/**",
            "node_modules/**",
            "data*/**",
            "tmp/**",
        ],
    },

    js.configs.recommended,
    ...pluginVue.configs["flat/recommended"],
    ...vueScopedCss.configs["flat/recommended"],
    jsdoc.configs["flat/recommended-error"],

    // Base language options + project rules (applies to JS/Vue/TS)
    {
        files: [ "**/*.js", "**/*.mjs", "**/*.cjs", "**/*.vue", "**/*.ts" ],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.commonjs,
            },
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                sourceType: "module",
                requireConfigFile: false,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            yoda: "error",
            eqeqeq: [ "warn", "smart" ],
            camelcase: [
                "warn",
                {
                    properties: "never",
                    ignoreImports: true,
                },
            ],
            "no-unused-vars": [
                "warn",
                {
                    args: "none",
                },
            ],
            "vue/max-attributes-per-line": "off",
            "vue/singleline-html-element-content-newline": "off",
            "vue/html-self-closing": "off",
            "vue/require-component-is": "off", // not allow is="style" https://github.com/vuejs/eslint-plugin-vue/issues/462#issuecomment-430234675
            "vue/attribute-hyphenation": "off", // This change noNL to "no-n-l" unexpectedly
            "vue/multi-word-component-names": "off",
            "vue-scoped-css/no-unused-selector": "warn",
            curly: "error",
            "no-var": "error",
            "no-throw-literal": "error",
            "no-constant-condition": [
                "error",
                {
                    checkLoops: false,
                },
            ],
            //"no-console": "warn",
            "no-extra-boolean-cast": "off",
            "no-unneeded-ternary": "error",
            //"prefer-template": "error",
            "no-empty": [
                "error",
                {
                    allowEmptyCatch: true,
                },
            ],
            "no-control-regex": "off",
            "one-var": [ "error", "never" ],
            "max-statements-per-line": [ "error", { max: 1 } ],
            "jsdoc/check-tag-names": [
                "error",
                {
                    definedTags: [ "link" ],
                },
            ],
            "jsdoc/no-undefined-types": "off",
            "jsdoc/no-defaults": [ "error", { noOptionalParamNames: true } ],
            "jsdoc/require-throws": "warn",
            "jsdoc/require-jsdoc": [
                "error",
                {
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                    },
                },
            ],
            "jsdoc/no-blank-block-descriptions": "error",
            "jsdoc/require-returns-description": "warn",
            "jsdoc/require-returns-check": [ "error", { reportMissingReturnForUndefinedTypes: false } ],
            "jsdoc/require-returns": [
                "warn",
                {
                    forceRequireReturn: true,
                    forceReturnsWithAsync: true,
                },
            ],
            "jsdoc/require-param-type": "warn",
            "jsdoc/require-param-description": "warn",
        },
    },

    // Override for TypeScript
    {
        files: [ "**/*.ts" ],
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "jsdoc/require-returns-type": "off",
            "jsdoc/require-param-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "prefer-const": "off",
        },
    },

    // Preserve the project's pre-upgrade lint policy. The ESLint 9/10 and plugin
    // major bumps added these rules to their "recommended" presets; the codebase
    // predates them and never opted in. Turned off to avoid large, semantics-changing
    // churn during the dependency upgrade — they can be adopted individually later.
    {
        rules: {
            "preserve-caught-error": "off", // new in ESLint 10 core recommended
            "no-useless-assignment": "off", // new in ESLint 9.x core recommended
            "@typescript-eslint/no-require-imports": "off", // replaces the old no-var-requires; src/util.ts requires intentionally
            "vue/no-reserved-component-names": "off", // e.g. vue-chartjs "Line" component
            "jsdoc/reject-any-type": "off",
            "jsdoc/require-throws-type": "off",
            "jsdoc/valid-types": "off",
            "jsdoc/ts-no-empty-object-type": "off",
            "jsdoc/reject-function-type": "off",
        },
    },

    // Disables ESLint formatting rules that conflict with Prettier (must be last)
    prettier,
];
