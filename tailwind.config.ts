import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "selector",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/entities/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-heading)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-sans)", "sans-serif"],
        label: ["var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        // Display - Switzer Variable, 500
        "display-lg": [
          "2.75rem",
          { lineHeight: "3.25rem", letterSpacing: "-1%", fontWeight: "500" },
        ],
        "display-md": [
          "2.5rem",
          { lineHeight: "3rem", letterSpacing: "-1%", fontWeight: "500" },
        ],
        "display-sm": [
          "2.25rem",
          { lineHeight: "2.75rem", letterSpacing: "-1%", fontWeight: "500" },
        ],
        "display-xs": [
          "2rem",
          { lineHeight: "2.5rem", letterSpacing: "-1%", fontWeight: "500" },
        ],
        "display-xxs": [
          "1.5rem",
          { lineHeight: "2rem", letterSpacing: "-1.5%", fontWeight: "500" },
        ],

        // Heading - Switzer Variable, 500
        "heading-lg": [
          "1.25rem",
          { lineHeight: "1.75rem", letterSpacing: "-2%", fontWeight: "500" },
        ],
        "heading-md": [
          "1.125rem",
          { lineHeight: "1.5rem", letterSpacing: "0%", fontWeight: "500" },
        ],
        "heading-sm": [
          "1rem",
          { lineHeight: "1.5rem", letterSpacing: "0%", fontWeight: "500" },
        ],

        // Label - Inter Variable, 500
        "label-lg": [
          "1rem",
          { lineHeight: "1.5rem", letterSpacing: "-0.8%", fontWeight: "500" },
        ],
        "label-md": [
          "0.875rem",
          { lineHeight: "1.25rem", letterSpacing: "-0.8%", fontWeight: "500" },
        ],
        "label-sm": [
          "0.8125rem",
          { lineHeight: "1.25rem", letterSpacing: "-0.8%", fontWeight: "500" },
        ],
        "label-xs": [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0%", fontWeight: "500" },
        ],

        // Body - Inter Variable, 400
        "body-lg": [
          "1.125rem",
          { lineHeight: "1.75rem", letterSpacing: "0.5%", fontWeight: "400" },
        ],
        "body-md": [
          "1rem",
          { lineHeight: "1.5rem", letterSpacing: "0.5%", fontWeight: "400" },
        ],
        "body-sm": [
          "0.8125rem",
          { lineHeight: "1.25rem", letterSpacing: "0.5%", fontWeight: "400" },
        ],
        "body-xs": [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0%", fontWeight: "400" },
        ],
      },
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
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      zIndex: {
        base: "var(--z-base)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
      },
      transitionDuration: {
        fast: "var(--transition-fast-duration, 150ms)",
        base: "var(--transition-base-duration, 200ms)",
        slow: "var(--transition-slow-duration, 300ms)",
        slower: "var(--transition-slower-duration, 500ms)",
      },

      animation: {
        hide: "hide 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideDownAndFade:
          "slideDownAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideLeftAndFade:
          "slideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideUpAndFade: "slideUpAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideRightAndFade:
          "slideRightAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        drawerSlideLeftAndFade:
          "drawerSlideLeftAndFade 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        dialogOverlayShow:
          "dialogOverlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        dialogContentShow:
          "dialogContentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config
