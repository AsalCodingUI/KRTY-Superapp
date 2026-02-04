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
    boxShadow: {
      // Strict Shadow System
      "regular-md": "var(--shadow-regular-md)",
      "regular-xs": "var(--shadow-regular-xs)",

      brand: "var(--shadow-brand)",
      neutral: "var(--shadow-neutral)",
      danger: "var(--shadow-danger)",

      "outline-brand": "var(--shadow-outline-brand)",
      "outline-neutral": "var(--shadow-outline-neutral)",
      "outline-dialog": "var(--shadow-outline-dialog)",
      "outline-danger": "var(--shadow-outline-danger)",

      // Form shadows
      input: "var(--shadow-outline-neutral)",
      "input-error": "var(--shadow-outline-danger)",
      "input-focus": "var(--shadow-outline-brand)",
    },
    fontFamily: {
      sans: ['"Inter Variable"', "sans-serif"],
      display: ['"Switzer Variable"', "sans-serif"],
      heading: ['"Switzer Variable"', "sans-serif"],
      body: ['"Inter Variable"', "sans-serif"],
      label: ['"Inter Variable"', "sans-serif"],
    },
    fontSize: {
      // Display - Switzer Variable, 500
      "display-lg": ["44px", { lineHeight: "52px", letterSpacing: "-1%", fontWeight: "500" }],
      "display-md": ["40px", { lineHeight: "48px", letterSpacing: "-1%", fontWeight: "500" }],
      "display-sm": ["36px", { lineHeight: "44px", letterSpacing: "-1%", fontWeight: "500" }],
      "display-xs": ["32px", { lineHeight: "40px", letterSpacing: "-1%", fontWeight: "500" }],
      "display-xxs": ["24px", { lineHeight: "32px", letterSpacing: "-1.5%", fontWeight: "500" }],

      // Heading - Switzer Variable, 500
      "heading-lg": ["20px", { lineHeight: "28px", letterSpacing: "-2%", fontWeight: "500" }],
      "heading-md": ["18px", { lineHeight: "24px", letterSpacing: "0%", fontWeight: "500" }],
      "heading-sm": ["16px", { lineHeight: "24px", letterSpacing: "0%", fontWeight: "500" }],

      // Label - Inter Variable, 500
      "label-lg": ["16px", { lineHeight: "24px", letterSpacing: "-0.8%", fontWeight: "500" }],
      "label-md": ["14px", { lineHeight: "20px", letterSpacing: "-0.8%", fontWeight: "500" }],
      "label-sm": ["13px", { lineHeight: "20px", letterSpacing: "-0.8%", fontWeight: "500" }],
      "label-xs": ["12px", { lineHeight: "16px", letterSpacing: "0%", fontWeight: "500" }],

      // Body - Inter Variable, 400
      "body-lg": ["18px", { lineHeight: "28px", letterSpacing: "0.5%", fontWeight: "400" }],
      "body-md": ["16px", { lineHeight: "24px", letterSpacing: "0.5%", fontWeight: "400" }],
      "body-sm": ["13px", { lineHeight: "20px", letterSpacing: "0.5%", fontWeight: "400" }],
      "body-xs": ["12px", { lineHeight: "16px", letterSpacing: "0%", fontWeight: "400" }],
    },
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
        none: "var(--radius-none)",
        xxs: "var(--radius-xxs)",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        xxl: "var(--radius-xxl)",
        full: "var(--radius-full)",
      },
      padding: {
        // Semantic Padding Tokens (Mapped)
        xs: "var(--padding-xs)",
        sm: "var(--padding-sm)",
        md: "var(--padding-md)",
        lg: "var(--padding-lg)",
        xl: "var(--padding-xl)",
        "2xl": "var(--padding-2xl)",
        "3xl": "var(--padding-3xl)",
        "5xl": "var(--padding-5xl)",
        "6xl": "var(--padding-6xl)",
        "7xl": "var(--padding-7xl)",
        "8xl": "var(--padding-8xl)",
      },
      gap: {
        // Semantic Gap Tokens (Mapped)
        xs: "var(--gap-xs)",
        sm: "var(--gap-sm)",
        md: "var(--gap-md)",
        lg: "var(--gap-lg)",
        xl: "var(--gap-xl)",
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
      borderColor: {
        neutral: {
          secondary: "var(--border-neutral-secondary)",
          primary: "var(--border-neutral-primary)",
          white: "var(--border-neutral-white)",
          tertiary: "var(--border-neutral-tertiary)",
          disable: "var(--border-neutral-disable)",
          strong: "var(--border-neutral-strong)",
        },
        brand: {
          light: "var(--border-brand-light)",
          DEFAULT: "var(--border-brand)",
          dark: "var(--border-brand-dark)",
        },
        success: {
          subtle: "var(--border-success-subtle)",
          DEFAULT: "var(--border-success)",
        },
        danger: {
          subtle: "var(--border-danger-subtle)",
          DEFAULT: "var(--border-danger)",
        },
        warning: {
          DEFAULT: "var(--border-warning)",
          subtle: "var(--border-warning-subtle)",
        },
        // Legacy/Compat
        DEFAULT: "var(--border-neutral-primary)",
        default: "var(--border-neutral-primary)",
        border: "var(--border-neutral-primary)",
        input: "var(--border-input)",
      },
      colors: {
        // --- ⌘ ・ MAPPED - COLORS ---

        // Background
        background: "var(--bg-background)",
        muted: "var(--bg-muted)",
        hover: "var(--bg-hover)",
        accent: "var(--bg-accent)",
        inverted: "var(--bg-inverted)",

        // Surface
        surface: {
          DEFAULT: "var(--bg-surface)", // Default surface
          neutral: {
            primary: "var(--surface-neutral-primary)",
            secondary: "var(--surface-neutral-secondary)",
            tertiary: "var(--surface-neutral-tertiary)",
            overlay: "var(--surface-neutral-overlay)",
          },
          brand: {
            DEFAULT: "var(--surface-brand)",
            light: "var(--surface-brand-light)",
            hover: "var(--surface-brand-hov)",
            press: "var(--surface-brand-press)",
          },
          success: {
            DEFAULT: "var(--surface-success)",
            light: "var(--surface-success-light)",
            hover: "var(--surface-success-hov)",
          },
          danger: {
            DEFAULT: "var(--surface-danger)",
            light: "var(--surface-danger-light)",
            hover: "var(--surface-danger-hov)",
            press: "var(--surface-danger-press)",
          },
          warning: {
            DEFAULT: "var(--surface-warning)",
            light: "var(--surface-warning-light)",
          },
          state: {
            neutral: {
              "light-disable": "var(--surface-state-neutral-light-disable)",
              "light-hover": "var(--surface-state-neutral-light-hover)",
              "light-press": "var(--surface-state-neutral-light-press)",
              "dark-hover": "var(--surface-state-neutral-dark-hover)",
              "dark-press": "var(--surface-state-neutral-dark-press)",
              "dark-disable": "var(--surface-state-neutral-dark-disable)",
            },
          },
          inverse: {
            primary: "var(--surface-inverse-primary)",
            secondary: "var(--surface-inverse-secondary)",
          },
          chart: {
            1: "var(--surface-chart-1)",
            2: "var(--surface-chart-2)",
            3: "var(--surface-chart-3)",
            4: "var(--surface-chart-4)",
            5: "var(--surface-chart-5)",
            6: "var(--surface-chart-6)",
            7: "var(--surface-chart-7)",
            8: "var(--surface-chart-8)",
          },
        },

        // Foreground
        foreground: {
          DEFAULT: "var(--foreground-primary)", // Default text color
          primary: "var(--foreground-primary)",
          secondary: "var(--foreground-secondary)",
          tertiary: "var(--foreground-tertiary)",
          disable: "var(--foreground-disable)",
          "on-color": "var(--foreground-on-color)",

          brand: {
            DEFAULT: "var(--foreground-brand)",
            light: "var(--foreground-brand-light)",
            dark: "var(--foreground-brand-dark)",
          },

          success: {
            DEFAULT: "var(--foreground-success)",
            light: "var(--foreground-success-light)",
            dark: "var(--foreground-success-dark)",
          },

          danger: {
            DEFAULT: "var(--foreground-danger)",
            light: "var(--foreground-danger-light)",
            dark: "var(--foreground-danger-dark)",
          },

          warning: {
            DEFAULT: "var(--foreground-warning)",
            light: "var(--foreground-warning-light)",
            dark: "var(--foreground-warning-dark)",
            "on-color": "var(--foreground-warning-on-color)",
          },

          state: {
            neutral: {
              "dark-disable": "var(--foreground-state-neutral-dark-disable)",
            },
          },

          chart: {
            1: "var(--foreground-chart-1)",
            2: "var(--foreground-chart-2)",
            3: "var(--foreground-chart-3)",
            4: "var(--foreground-chart-4)",
            5: "var(--foreground-chart-5)",
            6: "var(--foreground-chart-6)",
            7: "var(--foreground-chart-7)",
            8: "var(--foreground-chart-8)",
          },
        },

        // Legacy/Backwards Compat - Mapping to new Token System
        primary: {
          DEFAULT: "var(--surface-brand)",
          foreground: "var(--foreground-on-color)",
          hover: "var(--surface-brand-hov)",
        },

        // Content/Text aliases
        content: {
          DEFAULT: "var(--text-primary)",
          subtle: "var(--text-secondary)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },

        // Status aliases
        success: {
          DEFAULT: "var(--surface-success)",
          hover: "var(--surface-success-hov)",
        },
        warning: {
          DEFAULT: "var(--surface-warning)",
          // hover: not defined in surface-warning
        },
        danger: {
          DEFAULT: "var(--surface-danger)",
          hover: "var(--surface-danger-hov)",
        },

      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config
