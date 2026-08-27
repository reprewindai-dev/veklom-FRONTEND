import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        theme: {
          bg: "var(--theme-bg)",
          surface: "var(--theme-surface)",
          surface2: "var(--theme-surface-2)",
          border: "var(--theme-border)",
          
          accent: "rgb(var(--theme-accent) / <alpha-value>)",
          steel: "rgb(var(--theme-accent-steel) / <alpha-value>)",
          verified: "rgb(var(--theme-verified) / <alpha-value>)",
          warn: "rgb(var(--theme-warn) / <alpha-value>)",
          danger: "rgb(var(--theme-danger) / <alpha-value>)",
          info: "rgb(var(--theme-info) / <alpha-value>)",
          unknown: "rgb(var(--theme-unknown) / <alpha-value>)",

          ink: "var(--theme-text)",
          inkDim: "var(--theme-text-muted)",
          raised: "var(--theme-raised)",
          midGray: "var(--theme-mid-gray)",
          white: "var(--theme-white)",
          black: "var(--theme-black)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
