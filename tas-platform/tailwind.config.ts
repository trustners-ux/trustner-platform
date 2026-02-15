import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          50: "#E6F0FF",
          100: "#CCE0FF",
          200: "#99C1FF",
          300: "#66A3FF",
          400: "#3384FF",
          500: "#0052CC",
          600: "#003D99",
          700: "#0F172A",
          800: "#0B1120",
          900: "#070D17",
        },
        positive: {
          DEFAULT: "#00875A",
          light: "#E3FCEF",
        },
        negative: {
          DEFAULT: "#DE350B",
          light: "#FFEBE6",
        },
        accent: {
          DEFAULT: "#FF6B35",
          light: "#FFF0E6",
        },
        warning: {
          DEFAULT: "#FF991F",
          light: "#FFF7E6",
        },
        secondary: "#00B8D9",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-right": "slideR 0.5s ease-out",
        "slide-left": "slideL 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideR: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideL: {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
