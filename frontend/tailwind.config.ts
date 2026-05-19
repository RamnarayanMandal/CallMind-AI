import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },

      /* ── All tokens resolve to hsl(var(--...)) ── */
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        /* Primary = Blue */
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          /* Blue tint shades for hover/glow helpers */
          50:  "hsl(221 83% 97%)",
          100: "hsl(221 83% 93%)",
          200: "hsl(221 83% 85%)",
          300: "hsl(221 83% 75%)",
          400: "hsl(221 83% 65%)",
          500: "hsl(221 83% 58%)",
          600: "hsl(221 83% 53%)",  /* brand blue */
          700: "hsl(221 83% 44%)",
          800: "hsl(221 83% 35%)",
          900: "hsl(221 83% 25%)",
          950: "hsl(221 83% 14%)",
        },

        /* Secondary = Purple */
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          /* Purple tint shades */
          50:  "hsl(262 83% 97%)",
          100: "hsl(262 83% 93%)",
          200: "hsl(262 83% 85%)",
          300: "hsl(262 83% 75%)",
          400: "hsl(262 83% 68%)",
          500: "hsl(262 83% 62%)",
          600: "hsl(262 83% 58%)",  /* brand purple */
          700: "hsl(262 83% 48%)",
          800: "hsl(262 83% 38%)",
          900: "hsl(262 83% 28%)",
          950: "hsl(262 83% 14%)",
        },

        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* Sidebar tokens */
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },

        /* ── success / warning reused as blue / purple variants ─
           (so badge variant="success" renders in brand blue-green
           and variant="warning" renders in brand purple tint)     */
        success: {
          DEFAULT:    "hsl(221 83% 53%)",   /* same as primary */
          foreground: "hsl(210 40% 98%)",
        },
        warning: {
          DEFAULT:    "hsl(262 83% 58%)",   /* same as secondary */
          foreground: "hsl(210 40% 98%)",
        },

        /* Full neutral scale for dark UI */
        neutral: {
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          850: "#1c1c1c",
          900: "#171717",
          950: "#0a0a0a",
        },
      },

      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1.25rem",
        xl:    "1rem",
        lg:    "var(--radius)",
        md:    "calc(var(--radius) - 2px)",
        sm:    "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        /* Elevated card */
        card:       "0 1px 4px 0 hsl(222 47% 11% / 0.06), 0 1px 2px -1px hsl(222 47% 11% / 0.04)",
        "card-md":  "0 4px 16px -4px hsl(221 83% 53% / 0.12)",
        /* Blue glow */
        glow:       "0 0 24px hsl(221 83% 53% / 0.35)",
        "glow-sm":  "0 0 12px hsl(221 83% 53% / 0.25)",
        /* Purple glow */
        "glow-purple": "0 0 24px hsl(262 83% 58% / 0.35)",
        /* Dialog elevation */
        dialog:     "0 25px 60px -12px hsl(222 47% 6% / 0.55)",
      },

      backgroundImage: {
        /* Blue → Purple gradient — use as bg-gradient-brand */
        "gradient-brand": "linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(262 83% 58%) 100%)",
        /* Subtle card gradient */
        "gradient-card":  "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
      },

      gridTemplateColumns: {
        dashboard: "280px 1fr",
      },

      animation: {
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-out",
        "fade-in":          "fade-in 0.4s ease-out",
        "slide-up":         "slide-up 0.35s ease-out",
        "scale-in":         "scale-in 0.2s ease-out",
        "pulse-slow":       "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer":          "shimmer 2s linear infinite",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
