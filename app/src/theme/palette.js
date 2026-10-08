const colors = require("tailwindcss/colors");

// Single source of truth for color values needed outside className strings. Native `color=`
// props (Ionicons, ActivityIndicator) and gradient `colors` arrays aren't styleable with
// NativeWind's className/dark: system, so anywhere that needs a literal hex reads it from here
// instead of a hand-copied string. tailwind.config.js requires this same file for its `primary`
// scale, so the two can't drift apart — change a shade once, here.
const primary = {
  50: "#fff6f0",
  100: "#ffebdb",
  200: "#ffd6b8",
  300: "#ffb680",
  400: "#ff931a",
  500: "#ff6d00",
  600: "#d65b00",
  700: "#ad4a00",
  800: "#8a3b00",
  900: "#6b2e00",
  950: "#421c00",
};

module.exports = {
  primary,
  // Re-exported from Tailwind's own scales — the same families tailwind.config.js aliases these
  // to — rather than retyped, so they can't drift from the className-driven colors either.
  neutral: colors.stone,
  danger: colors.red,
  warning: colors.yellow,
};
