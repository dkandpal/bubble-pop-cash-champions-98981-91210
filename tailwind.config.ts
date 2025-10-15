import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        helvetica: ['Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        bubble: {
          red: "hsl(var(--bubble-red))",
          orange: "hsl(var(--bubble-orange))",
          yellow: "hsl(var(--bubble-yellow))",
          green: "hsl(var(--bubble-green))",
          blue: "hsl(var(--bubble-blue))",
          purple: "hsl(var(--bubble-purple))",
          pink: "hsl(var(--bubble-pink))",
        },
      },
      backgroundImage: {
        'gradient-sky': 'var(--gradient-sky)',
        'gradient-button': 'var(--gradient-button)',
        'gradient-game': 'var(--gradient-game-bg)',
      },
      boxShadow: {
        bubble: 'var(--shadow-bubble)',
        glow: 'var(--glow-button)',
        card: 'var(--shadow-card)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "pop": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.3)", opacity: "0.8" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(270 80% 60% / 0.4)" },
          "50%": { boxShadow: "0 0 40px hsl(270 80% 60% / 0.8)" },
        },
        "pulse-danger": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-up": {
          "0%": { transform: "translateY(0) scale(0.8)", opacity: "1" },
          "50%": { transform: "translateY(-30px) scale(1.2)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(1)", opacity: "0" },
        },
        "wobble": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(5deg)" },
          "75%": { transform: "rotate(-5deg)" },
        },
      },
      animation: {
        "pop": "pop 0.2s ease-out forwards",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "sparkle": "sparkle 0.6s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-danger": "pulse-danger 0.5s ease-in-out infinite",
        "fade-up": "fade-up 0.8s ease-out forwards",
        "wobble": "wobble 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
