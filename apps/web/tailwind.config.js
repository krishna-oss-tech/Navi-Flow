/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#070a0f",
        surface: {
          DEFAULT: "#0d1117",
          raised: "#131920",
          overlay: "#1a2230",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.1)",
          strong: "rgba(255,255,255,0.18)",
        },
        status: {
          normal: "#22c55e",
          moderate: "#eab308",
          high: "#f97316",
          critical: "#ef4444",
        },
        accent: {
          blue: "#38bdf8",
          cyan: "#22d3ee",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          purple: "#a855f7",
          indigo: "#818cf8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      spacing: {
        "header": "48px",
        "iconbar": "52px",
        "drawer": "380px",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(56,189,248,0.15), 0 0 60px rgba(56,189,248,0.05)",
        "glow-emerald": "0 0 20px rgba(16,185,129,0.2)",
        "glow-rose": "0 0 25px rgba(244,63,94,0.25)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.2)",
        "float": "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
        "panel": "0 4px 24px rgba(0,0,0,0.5)",
      },
      backdropBlur: {
        xs: "4px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(56,189,248,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(56,189,248,0.6)" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.5)", opacity: "0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "breathe": "breathe 2s ease-in-out infinite",
        "scale-in": "scale-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
