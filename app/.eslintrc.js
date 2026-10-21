// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "plugin:tailwindcss/recommended", "prettier"],
  plugins: ["tailwindcss"],
  settings: {
    tailwindcss: {
      // NativeWind components (Text, View, etc. re-exported from ../ui) aren't named
      // className/style the plugin recognizes by default — "classnames" is the prop
      // every component in this kit actually uses, same as the real DOM className.
      classRegex: "^(className)$",
    },
  },
  rules: {
    // Palette-driven custom classes (rounded-card, bg-primary-600, etc.) aren't in the
    // plugin's shipped Tailwind class list, so it can't verify they're "real" — only
    // the contradicting-classname check (two classes from the same family) matters here.
    "tailwindcss/no-custom-classname": "off",
    // The one rule this setup actually exists for: two classes from the same family (two
    // bg-*, two border widths, two text sizes) in one string — off by default even under
    // "recommended". This replaces the ad hoc regex script used earlier in the project.
    "tailwindcss/no-contradicting-classname": "error",
    // Prettier (prettier-plugin-tailwindcss) owns class ordering on every format — no need
    // for lint to also flag it.
    "tailwindcss/classnames-order": "off",
    // eslint-config-expo added React Compiler-awareness rules at SDK 56. This project doesn't
    // run React Compiler (no babel plugin for it, not in scope here), so these are pure false
    // positives against patterns that are actually correct for us: react-native-reanimated's
    // SharedValue.value = ... is its documented mutation API (Accordion.tsx), not an accidental
    // state mutation, and react-hook-form's watch() isn't memoizable by design — neither matters
    // without the compiler actually running.
    "react-hooks/immutability": "off",
    "react-hooks/incompatible-library": "off",
    "react-hooks/preserve-manual-memoization": "off",
  },
  overrides: [
    {
      // Plain Node CommonJS config files, not app/bundle source — they run under Node,
      // not the RN/browser globals the rest of the app lints against.
      files: ["babel.config.js", "metro.config.js", "tailwind.config.js"],
      env: { node: true },
    },
  ],
};
