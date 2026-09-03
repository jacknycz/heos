const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Semantic aliases onto Tailwind's own scales — swap the underlying family here
        // (e.g. primary: colors.indigo) without touching any component.
        primary: colors.blue,
        danger: colors.red,
        success: colors.green,
        warning: colors.amber,
        neutral: colors.slate,
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
