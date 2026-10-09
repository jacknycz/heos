const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["dist", "drizzle", "node_modules"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: "module" },
      globals: { process: "readonly", console: "readonly", Buffer: "readonly" },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Request handlers pass unused (req, res, next) all the time — the signature shape
      // matters more than using every parameter.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // `declare global { namespace Express { ... } }` is the standard way to augment
      // Express's Request type (see lib/auth.ts) — not the kind of namespace this rule
      // means to discourage.
      "@typescript-eslint/no-namespace": "off",
    },
  },
  prettierConfig,
];
