import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Veklom brand — Sovereign AI Hub. Amber orange on deep black.
        // Deep black #0A0A0A · Amber orange #FFB800 · White #FFFFFF · Muted gray #A1A1A6
        bg: {
          900: "#0A0A0A",
          800: "#101010",
          700: "#171717",
          600: "#1F1F1F",
        },
        ink: {
          50: "#FFFFFF",
          200: "#E6E6E9",
          400: "#A1A1A6",
          600: "#6E6E73",
        },
        brand: {
          400: "#FFC94D",
          500: "#FFB800",
          600: "#E0A100",
          700: "#B37F00",
        },
        accent: {
          green: "#3EE7A2",
          amber: "#FFB800",
          red: "#FF5C6C",
          violet: "#FFB800",
        },
        border: {
          DEFAULT: "#242424",
          strong: "#333333",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
