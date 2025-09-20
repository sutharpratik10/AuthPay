/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "slide-out-to-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" }
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)", opacity: "0.3" },
          "30%": { transform: "translateX(70%)", opacity: "0.5" },
          "60%": { transform: "translateX(20%)", opacity: "0.7" },
          "85%": { transform: "translateX(5%)", opacity: "0.9" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        "slide-out-to-right": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "20%": { transform: "translateX(5%)", opacity: "0.9" },
          "50%": { transform: "translateX(20%)", opacity: "0.7" },
          "80%": { transform: "translateX(60%)", opacity: "0.5" },
          "100%": { transform: "translateX(100%)", opacity: "0" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "40%": { opacity: "0.6" },
          "100%": { opacity: "1" }
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        }
      },      animation: {
        "accordion-down": "accordion-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.3, 0.1, 0.1, 1)",
        "fade-in": "fade-in 700ms cubic-bezier(0.2, 0.5, 0.3, 1)",
        "fade-out": "fade-out 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-from-left": "slide-in-from-left 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-out-to-left": "slide-out-to-left 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-from-right": "slide-in-from-right 1000ms cubic-bezier(0.1, 0.5, 0.1, 1.0)",
        "slide-out-to-right": "slide-out-to-right 800ms cubic-bezier(0.3, 0, 0.1, 1)"
      },
    },
  },
  plugins: [],
}
