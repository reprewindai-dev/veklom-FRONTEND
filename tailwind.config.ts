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
        void: {
          black: "#030303",
          deep: "#060608",
          charcoal: "#0a0a0c",
          metal: "#121215",
        },
        electric: {
          cyan: "#00E5FF",
        },
        matrix: {
          emerald: "#00FF66",
        },
        hazard: {
          amber: "#FFAB00",
        },
        laser: {
          red: "#FF003C",
        },
        cos: {
          bg: "#0A0E1A",
          surface: "#111827",
          surface2: "#0D1220",
          border: "rgba(255,255,255,0.08)",
          accent: "#00E5FF",
          steel: "#8A9BB0",
          text: "rgba(255,255,255,0.92)",
          muted: "rgba(255,255,255,0.55)",
          verified: "#00FF66",
          warn: "#FFAB00",
          danger: "#FF4D4D",
          info: "#00E5FF",
          unknown: "#6B7280",
          // Covenant Trace Rail. Colour carries meaning here, never decoration:
          // cyan = verified/evidence, amber = pending/policy/cost, red = denied/revoked,
          // violet = identity and cryptographic binding (PGL).
          obsidian: "#030303",
          panel: "#090B0F",
          ledger: "#F4F7FA",
          identity: "#7C5CFF",
          deny: "#FF003C",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)",
        "cos-card": "0 1px 0 rgba(255,255,255,0.06) inset, 0 22px 70px -38px rgba(0,229,255,0.38), 0 14px 35px -22px rgba(0,0,0,0.85)",
        "cos-glow": "0 0 0 1px rgba(0,229,255,0.18), 0 18px 70px -28px rgba(0,229,255,0.5)",
      },
      backgroundImage: {
        "cos-grid": "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        "cos-sheen": "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.015) 42%, transparent 70%)",
        "cos-border": "linear-gradient(135deg, rgba(0,229,255,0.52), rgba(255,255,255,0.10) 42%, rgba(0,229,255,0.12))",
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.15)',
            borderColor: 'rgba(0, 229, 255, 0.2)'
          },
          '50%': {
            boxShadow: '0 0 24px rgba(0, 229, 255, 0.35)',
            borderColor: 'rgba(0, 229, 255, 0.5)'
          }
        },
        'fast-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' }
        },
        'liquid-fill': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'matrix-green': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' }
        }
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'fast-pulse': 'fast-pulse 1s ease-in-out infinite',
        'liquid-fill': 'liquid-fill 2s ease-in-out infinite',
        'matrix-green': 'matrix-green 20s linear infinite'
      }
    },
  },
  plugins: [],
};
export default config;
