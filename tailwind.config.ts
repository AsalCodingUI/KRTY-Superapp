import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "selector",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      keyframes: {
        hide: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        slideDownAndFade: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideLeftAndFade: {
          from: { opacity: "0", transform: "translateX(6px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideUpAndFade: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRightAndFade: {
          from: { opacity: "0", transform: "translateX(-6px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        dialogOverlayShow: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        dialogContentShow: {
          from: {
            opacity: "0",
            transform: "translate(-50%, -45%) scale(0.95)",
          },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        drawerSlideLeftAndFade: {
          from: { opacity: "0", transform: "translateX(50%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        // --- KEYFRAMES BARU UNTUK ACCORDION ---
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 2px)",
      },
      fontSize: {
        sm: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px instead of 14px
      },
      boxShadow: {
        xs: "0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.02), 0 1px 3px 0 rgba(0, 0, 0, 0.03)",
        md: "0 8px 16px -4px rgba(0, 0, 0, 0.04), 0 4px 8px -4px rgba(0, 0, 0, 0.04)",
        lg: "0 12px 24px -6px rgba(0, 0, 0, 0.05), 0 8px 16px -8px rgba(0, 0, 0, 0.05)",
        xl: "0 24px 48px -12px rgba(0, 0, 0, 0.1), 0 12px 24px -12px rgba(0, 0, 0, 0.05)",
        "2xl": "0 32px 64px -12px rgba(0, 0, 0, 0.15)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
      },
      animation: {
        hide: "hide 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideDownAndFade: "slideDownAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideLeftAndFade: "slideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideUpAndFade: "slideUpAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideRightAndFade: "slideRightAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        drawerSlideLeftAndFade: "drawerSlideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        dialogOverlayShow: "dialogOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        dialogContentShow: "dialogContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        // Backgrounds
        background: "var(--bg-background)",
        surface: "var(--bg-surface)",
        muted: "var(--bg-muted)",
        hover: "var(--bg-hover)",
        accent: "var(--bg-accent)",

        // Primary
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          foreground: "var(--color-primary-fg)",
        },

        // Text Colors
        content: {
          DEFAULT: "var(--text-primary)",
          subtle: "var(--text-secondary)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },

        // Borders
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          input: "var(--border-input)",
          strong: "var(--border-strong)",
        },
        input: "var(--border-input)",

        // Status
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",

        // Chart Colors (PENTING! Ini yang kurang tadi)
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
          6: "var(--chart-6)",
          7: "var(--chart-7)",
          8: "var(--chart-8)",
        },

        // Nav Active
        "nav-active": {
          bg: "var(--nav-active-bg)",
          text: "var(--nav-active-text)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config