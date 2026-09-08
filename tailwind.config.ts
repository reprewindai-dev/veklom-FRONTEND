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
          bg: "rgb(var(--theme-bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--theme-surface-rgb) / <alpha-value>)",
          surface2: "rgb(var(--theme-surface-2-rgb) / <alpha-value>)",
          border: "var(--theme-border)",
          present: "rgb(var(--theme-present) / <alpha-value>)",
          
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
        cos: {
          bg: "rgb(var(--theme-bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--theme-surface-rgb) / <alpha-value>)",
          surface2: "rgb(var(--theme-surface-2-rgb) / <alpha-value>)",
          raised: "var(--theme-raised)",
          border: "var(--theme-border)",
          text: "var(--theme-text)",
          mono: "var(--theme-text)",
          muted: "var(--theme-text-muted)",
          accent: "rgb(var(--theme-accent) / <alpha-value>)",
          steel: "rgb(var(--theme-accent-steel) / <alpha-value>)",
          present: "rgb(var(--theme-present) / <alpha-value>)",
          verified: "rgb(var(--theme-verified) / <alpha-value>)",
          warn: "rgb(var(--theme-warn) / <alpha-value>)",
          danger: "rgb(var(--theme-danger) / <alpha-value>)",
          info: "rgb(var(--theme-info) / <alpha-value>)",
          unknown: "rgb(var(--theme-unknown) / <alpha-value>)",
        },
      },
      boxShadow: {
        "cos-card": "0 1px 0 var(--theme-border) inset, 0 22px 70px -38px rgb(var(--theme-accent) / 0.38), 0 14px 35px -22px rgba(0,0,0,0.45)",
        "cos-glow": "0 0 0 1px rgb(var(--theme-accent) / 0.18), 0 18px 70px -28px rgb(var(--theme-accent) / 0.5)",
      },
      backgroundImage: {
        "cos-grid": "linear-gradient(var(--theme-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--theme-grid-line) 1px, transparent 1px)",
        "cos-sheen": "linear-gradient(135deg, var(--theme-sheen) , transparent 70%)",
        "cos-border": "linear-gradient(135deg, rgb(var(--theme-accent) / 0.52), var(--theme-border) 42%, rgb(var(--theme-accent) / 0.12))",
      },
    },
  },
  plugins: [],
};
export default config;
