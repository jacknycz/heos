const colors = require("tailwindcss/colors");
// "burnt orange" isn't a stock Tailwind family, so it's defined once in src/theme/palette.js —
// the same file every component reads from for the handful of hardcoded hex values a native
// `color=` prop needs (icons, ActivityIndicator, gradients) — instead of being retyped here too.
const palette = require("./src/theme/palette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // "class" instead of the default "media" — lets the Settings toggle (see ThemeContext)
  // override the OS setting instead of only ever following it.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic aliases onto Tailwind's own scales — swap the underlying family here
        // (e.g. primary: colors.indigo) without touching any component.
        primary: palette.primary,
        danger: colors.red,
        success: colors.green,
        // Amber sits too close to burnt-orange primary to read as a distinct semantic color —
        // yellow keeps "warning" visually separate from "brand/accent".
        warning: colors.yellow,
        // stone (warm gray) instead of slate (cool blue-gray) — a cool gray fights a warm
        // orange primary everywhere it borders it (cards, inputs, dividers).
        neutral: colors.stone,
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
