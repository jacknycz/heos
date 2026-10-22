const colors = require("tailwindcss/colors");

// Single source of truth for color values needed outside className strings. Native `color=`
// props (Ionicons, ActivityIndicator) and gradient `colors` arrays aren't styleable with
// NativeWind's className/dark: system, so anywhere that needs a literal hex reads it from here
// instead of a hand-copied string. tailwind.config.js requires this same file for its `primary`
// scale, so the two can't drift apart — change a shade once, here.
// Matches the Daly Organics logo: a muted sage-olive green for the badge, deepening toward the
// near-black forest green of the pine silhouette and wordmark.
const primary = {
  50: "#f5f6ef",
  100: "#e7ebdb",
  200: "#d1d8b9",
  300: "#b2bf8d",
  400: "#8e9c66",
  500: "#6b7a4a",
  600: "#55623c",
  700: "#424c30",
  800: "#333a26",
  900: "#262b1c",
  950: "#171a11",
};

module.exports = {
  primary,
  // Re-exported from Tailwind's own scales — the same families tailwind.config.js aliases these
  // to — rather than retyped, so they can't drift from the className-driven colors either.
  neutral: colors.stone,
  danger: colors.red,
  warning: colors.yellow,
  // Plain white, for icons/text sitting on a filled or colored surface regardless of light/dark
  // mode — not part of the neutral scale (stone-50 isn't true white), so it needs its own token
  // rather than another inlined "#fff".
  white: "#ffffff",
};
