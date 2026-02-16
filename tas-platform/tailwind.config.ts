import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A1628",
          50: "#EEF2FF",
          100: "#D8E2FF",
          200: "#B4C6FF",
          300: "#8DA6FF",
          400: "#5E7FE6",
          500: "#1E40AF",
          600: "#1A3A9E",
          700: "#0A1628",
          800: "#070F1C",
          900: "#040A12",
        },
        trustBlue: {
          DEFAULT: "#1E40AF",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        positive: {
          DEFAULT: "#059669",
          50: "#ECFDF5",
          100: "#D1FAE5",
          light: "#ECFDF5",
        },
        negative: {
          DEFAULT: "#DC2626",
          50: "#FEF2F2",
          100: "#FEE2E2",
          light: "#FEF2F2",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FFFBEB",
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FFFBEB",
        },
        secondary: {
          DEFAULT: "#0EA5E9",
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          500: "#0EA5E9",
          600: "#0284C7",
        },
        surface: {
          DEFAULT: "#FAFBFC",
          50: "#FFFFFF",
          100: "#FAFBFC",
          200: "#F1F5F9",
          300: "#E2E8F0",
        },
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
      fontSize: {
        "display-xl": [
          "4rem",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.025em",
            fontWeight: "800",
          },
        ],
        display: [
          "3rem",
          {
            lineHeight: "1.15",
            letterSpacing: "-0.02em",
            fontWeight: "800",
          },
        ],
        "display-sm": [
          "2.25rem",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
      },
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        "card-hover":
          "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        elevated: "0 20px 40px -12px rgba(0, 0, 0, 0.12)",
        modal: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        dropdown:
          "0 10px 40px -10px rgba(0, 0, 0, 0.12), 0 2px 6px -2px rgba(0, 0, 0, 0.05)",
        "glow-blue": "0 0 20px rgba(30, 64, 175, 0.15)",
        "glow-green": "0 0 20px rgba(5, 150, 105, 0.15)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in-slow": "fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-right": "slideR 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-left": "slideL 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-down": "slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        ticker: "ticker 40s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
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
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":
          "linear-gradient(135deg, #0A1628 0%, #1E3A5F 40%, #0A1628 100%)",
        "cta-gradient": "linear-gradient(135deg, #1E40AF 0%, #0EA5E9 100%)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
