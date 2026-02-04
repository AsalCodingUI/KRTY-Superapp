import plugin from "tailwindcss/plugin"

/**
 * Custom Typography Plugin for Amerta Design System
 * Maps the CSS variables defined in globals.css to Tailwind utility classes.
 * Usage: `text-display-lg`, `text-body-sm`, etc.
 */
export const amertaTypography = plugin(({ addUtilities }) => {
  addUtilities({
    // Display
    ".text-display-lg": { font: "var(--text-display-lg)" },
    ".text-display-md": { font: "var(--text-display-md)" },
    ".text-display-sm": { font: "var(--text-display-sm)" },
    ".text-display-xs": { font: "var(--text-display-xs)" },
    ".text-display-xxs": { font: "var(--text-display-xxs)" },

    // Heading
    ".text-heading-lg": { font: "var(--text-heading-lg)" },
    ".text-heading-md": { font: "var(--text-heading-md)" },
    ".text-heading-sm": { font: "var(--text-heading-sm)" },

    // Label
    ".text-label-lg": { font: "var(--text-label-lg)" },
    ".text-label-md": { font: "var(--text-label-md)" },
    ".text-label-sm": { font: "var(--text-label-sm)" },
    ".text-label-xs": { font: "var(--text-label-xs)" },

    // Body
    ".text-body-lg": { font: "var(--text-body-lg)" },
    ".text-body-md": { font: "var(--text-body-md)" },
    ".text-body-sm": { font: "var(--text-body-sm)" },
    ".text-body-xs": { font: "var(--text-body-xs)" },
  })
})
