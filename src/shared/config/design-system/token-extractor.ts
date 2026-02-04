/**
 * Design Token Extraction Utilities
 *
 * This module provides utilities to parse and extract design tokens from globals.css.
 * It supports extracting colors, typography, spacing, shadows, border radius, and animations.
 */

import fs from "fs"
import path from "path"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ColorShade {
  shade: number
  hex: string
  cssVariable: string
}

export interface ColorScale {
  name: string
  shades: ColorShade[]
}

export interface SemanticMapping {
  semantic: string
  mapsTo: string
  cssVariable: string
  value?: string
}

export interface TypographyToken {
  name: string
  fontSize: string
  lineHeight: string
  cssVariable: string
}

export interface AnimationToken {
  name: string
  cssVariable: string
  duration: string
  easing: string
  keyframes?: string
  usedIn: string[]
}

export interface SpacingToken {
  name: string
  value: string
  cssVariable: string
}

export interface ShadowToken {
  name: string
  value: string
  cssVariable: string
}

export interface RadiusToken {
  name: string
  value: string
  cssVariable: string
}

export interface DesignTokens {
  colors: {
    primary: ColorScale
    neutral: ColorScale
    success: ColorScale
    warning: ColorScale
    danger: ColorScale
    info: ColorScale
    semantic: {
      background: SemanticMapping[]
      text: SemanticMapping[]
      border: SemanticMapping[]
      status: SemanticMapping[]
      primary: SemanticMapping[]
    }
  }
  typography: TypographyToken[]
  animations: AnimationToken[]
  spacing: SpacingToken[]
  shadows: ShadowToken[]
  radius: RadiusToken[]
}

// ============================================================================
// CSS PARSING UTILITIES
// ============================================================================

/**
 * Reads and returns the content of globals.css
 * @throws Error if the file cannot be read
 */
export function readGlobalsCss(): string {
  try {
    const cssPath = path.join(process.cwd(), "src/app/globals.css")
    return fs.readFileSync(cssPath, "utf-8")
  } catch (error) {
    console.error("Error reading globals.css:", error)
    throw new Error(
      "Failed to read globals.css file. Please ensure the file exists at src/app/globals.css",
    )
  }
}

/**
 * Extracts CSS variable value from a line
 * Example: "  --primary-500: #007ff8;" -> { name: "primary-500", value: "#007ff8" }
 */
function parseCssVariable(
  line: string,
): { name: string; value: string } | null {
  // Updated regex to support camelCase in variable names (for animations like slideDownAndFade)
  const match = line.match(/--([a-zA-Z0-9-]+):\s*([^;]+);/)
  if (!match) return null
  return {
    name: match[1],
    value: match[2].trim(),
  }
}

/**
 * Extracts comment content from a line
 * Example: slash-star Main body text star-slash becomes "Main body text"
 */
function extractComment(line: string): string | null {
  const match = line.match(/\/\*\s*(.+?)\s*\*\//)
  return match ? match[1] : null
}

// ============================================================================
// COLOR EXTRACTION
// ============================================================================

/**
 * Extracts a color scale (e.g., primary, neutral, success) from CSS content
 */
export function extractColorScale(css: string, scaleName: string): ColorScale {
  const shades: ColorShade[] = []
  const lines = css.split("\n")

  for (const line of lines) {
    const variable = parseCssVariable(line)
    if (!variable) continue

    // Match pattern like "primary-500" or "neutral-100"
    const pattern = new RegExp(`^${scaleName}-(\\d+)$`)
    const match = variable.name.match(pattern)

    if (match) {
      const shade = parseInt(match[1], 10)
      shades.push({
        shade,
        hex: variable.value,
        cssVariable: `--${variable.name}`,
      })
    }
  }

  // Sort by shade number
  shades.sort((a, b) => a.shade - b.shade)

  return {
    name: scaleName,
    shades,
  }
}

/**
 * Extracts all color scales from CSS content
 */
export function extractColorScales(css: string): {
  primary: ColorScale
  neutral: ColorScale
  success: ColorScale
  warning: ColorScale
  danger: ColorScale
  info: ColorScale
} {
  return {
    primary: extractColorScale(css, "primary"),
    neutral: extractColorScale(css, "neutral"),
    success: extractColorScale(css, "success"),
    warning: extractColorScale(css, "warning"),
    danger: extractColorScale(css, "danger"),
    info: extractColorScale(css, "info"),
  }
}

/**
 * Extracts semantic color mappings (background, text, border, status)
 */
export function extractSemanticMappings(css: string): {
  background: SemanticMapping[]
  text: SemanticMapping[]
  border: SemanticMapping[]
  status: SemanticMapping[]
  primary: SemanticMapping[]
} {
  const lines = css.split("\n")
  const background: SemanticMapping[] = []
  const text: SemanticMapping[] = []
  const border: SemanticMapping[] = []
  const status: SemanticMapping[] = []
  const primary: SemanticMapping[] = []

  for (const line of lines) {
    const variable = parseCssVariable(line)
    if (!variable) continue

    // Background mappings
    if (variable.name.startsWith("bg-")) {
      background.push({
        semantic: variable.name,
        mapsTo: variable.value.replace("var(--", "").replace(")", ""),
        cssVariable: `--${variable.name}`,
        value: variable.value,
      })
    }

    // Text mappings
    if (variable.name.startsWith("text-")) {
      text.push({
        semantic: variable.name,
        mapsTo: variable.value.replace("var(--", "").replace(")", ""),
        cssVariable: `--${variable.name}`,
        value: variable.value,
      })
    }

    // Border mappings
    if (variable.name.startsWith("border-")) {
      border.push({
        semantic: variable.name,
        mapsTo: variable.value.replace("var(--", "").replace(")", ""),
        cssVariable: `--${variable.name}`,
        value: variable.value,
      })
    }

    // Status mappings
    if (variable.name.startsWith("status-")) {
      status.push({
        semantic: variable.name,
        mapsTo: variable.value.replace("var(--", "").replace(")", ""),
        cssVariable: `--${variable.name}`,
        value: variable.value,
      })
    }

    // Primary action mappings
    if (variable.name.startsWith("color-primary")) {
      primary.push({
        semantic: variable.name,
        mapsTo: variable.value.replace("var(--", "").replace(")", ""),
        cssVariable: `--${variable.name}`,
        value: variable.value,
      })
    }
  }

  return { background, text, border, status, primary }
}

// ============================================================================
// TYPOGRAPHY EXTRACTION
// ============================================================================

/**
 * Extracts typography tokens (font sizes, line heights)
 */
export function extractTypographyTokens(css: string): TypographyToken[] {
  const tokens: TypographyToken[] = []
  const lines = css.split("\n")

  // Track font size and line height pairs
  const fontSizes: Map<string, { fontSize: string; lineHeight?: string }> =
    new Map()

  for (const line of lines) {
    const variable = parseCssVariable(line)
    if (!variable) continue

    // Match font size variables
    if (
      variable.name.startsWith("text-tremor-") &&
      !variable.name.includes("line-height")
    ) {
      const baseName = variable.name
      fontSizes.set(baseName, {
        fontSize: variable.value,
        lineHeight: fontSizes.get(baseName)?.lineHeight,
      })
    }

    // Match line height variables
    if (variable.name.includes("--line-height")) {
      const baseName = variable.name.replace("--line-height", "")
      const existing = fontSizes.get(baseName)
      fontSizes.set(baseName, {
        fontSize: existing?.fontSize || "",
        lineHeight: variable.value,
      })
    }
  }

  // Convert to array
  for (const [name, values] of fontSizes.entries()) {
    if (values.fontSize) {
      tokens.push({
        name: name.replace("text-tremor-", ""),
        fontSize: values.fontSize,
        lineHeight: values.lineHeight || "normal",
        cssVariable: `--${name}`,
      })
    }
  }

  return tokens
}

// ============================================================================
// ANIMATION EXTRACTION
// ============================================================================

/**
 * Extracts animation tokens and keyframes
 */
export function extractAnimationTokens(css: string): AnimationToken[] {
  const tokens: AnimationToken[] = []
  const lines = css.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const variable = parseCssVariable(line)

    if (!variable) continue

    // Match animation variables
    if (variable.name.startsWith("animate-")) {
      // Parse animation value: "animationName duration easing"
      const parts = variable.value.split(/\s+/)
      const duration = parts[1] || ""
      const easing = parts.slice(2).join(" ")

      // Extract usage comment from previous lines
      let usedIn: string[] = []
      // Look back up to 3 lines for usage comment
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const comment = extractComment(lines[j])
        if (comment && comment.includes("Used in:")) {
          const usageText = comment.split("Used in:")[1]
          usedIn = usageText.split(",").map((s) => s.trim())
          break
        }
      }

      tokens.push({
        name: variable.name.replace("animate-", ""),
        cssVariable: `--${variable.name}`,
        duration,
        easing,
        usedIn,
      })
    }
  }

  return tokens
}

// ============================================================================
// SPACING, SHADOW, AND RADIUS EXTRACTION
// ============================================================================

/**
 * Extracts spacing tokens
 */
export function extractSpacingTokens(css: string): SpacingToken[] {
  const tokens: SpacingToken[] = []
  const lines = css.split("\n")

  for (const line of lines) {
    const variable = parseCssVariable(line)
    if (!variable) continue

    // Match spacing-related variables (you can extend this based on your needs)
    if (
      variable.name.startsWith("spacing-") ||
      variable.name.startsWith("space-")
    ) {
      tokens.push({
        name: variable.name,
        value: variable.value,
        cssVariable: `--${variable.name}`,
      })
    }
  }

  return tokens
}

/**
 * Extracts shadow tokens, handling multi-line values
 */
export function extractShadowTokens(css: string): ShadowToken[] {
  const tokens: ShadowToken[] = []
  const lines = css.split("\n")

  let currentShadow: { name: string; value: string } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check if this is the start of a shadow variable
    if (line.includes("--shadow-") && line.includes(":")) {
      // If we have a pending shadow, save it
      if (currentShadow) {
        tokens.push({
          name: currentShadow.name,
          value: currentShadow.value,
          cssVariable: `--${currentShadow.name}`,
        })
      }

      // Start new shadow
      const match = line.match(/--([a-z0-9-]+):\s*(.+)/)
      if (match) {
        const name = match[1]
        let value = match[2]

        // Check if value ends with semicolon (single line)
        if (value.endsWith(";")) {
          tokens.push({
            name,
            value: value.replace(";", "").trim(),
            cssVariable: `--${name}`,
          })
          currentShadow = null
        } else {
          // Multi-line value
          currentShadow = { name, value: value.trim() }
        }
      }
    } else if (currentShadow && line) {
      // Continue multi-line value
      currentShadow.value += " " + line.trim()

      // Check if this line ends the value
      if (line.endsWith(";")) {
        currentShadow.value = currentShadow.value.replace(";", "").trim()
        tokens.push({
          name: currentShadow.name,
          value: currentShadow.value,
          cssVariable: `--${currentShadow.name}`,
        })
        currentShadow = null
      }
    }
  }

  // Save any pending shadow
  if (currentShadow) {
    tokens.push({
      name: currentShadow.name,
      value: currentShadow.value,
      cssVariable: `--${currentShadow.name}`,
    })
  }

  return tokens
}

/**
 * Extracts border radius tokens
 */
export function extractRadiusTokens(css: string): RadiusToken[] {
  const tokens: RadiusToken[] = []
  const lines = css.split("\n")

  for (const line of lines) {
    const variable = parseCssVariable(line)
    if (!variable) continue

    if (variable.name.startsWith("radius-")) {
      tokens.push({
        name: variable.name,
        value: variable.value,
        cssVariable: `--${variable.name}`,
      })
    }
  }

  return tokens
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extracts all design tokens from globals.css
 * Returns empty structures if extraction fails
 */
export function extractAllDesignTokens(): DesignTokens {
  try {
    const css = readGlobalsCss()
    const colorScales = extractColorScales(css)
    const semanticMappings = extractSemanticMappings(css)

    return {
      colors: {
        ...colorScales,
        semantic: semanticMappings,
      },
      typography: extractTypographyTokens(css),
      animations: extractAnimationTokens(css),
      spacing: extractSpacingTokens(css),
      shadows: extractShadowTokens(css),
      radius: extractRadiusTokens(css),
    }
  } catch (error) {
    console.error("Error extracting design tokens:", error)
    // Return empty structures to allow the page to render
    return {
      colors: {
        primary: { name: "primary", shades: [] },
        neutral: { name: "neutral", shades: [] },
        success: { name: "success", shades: [] },
        warning: { name: "warning", shades: [] },
        danger: { name: "danger", shades: [] },
        info: { name: "info", shades: [] },
        semantic: {
          background: [],
          text: [],
          border: [],
          status: [],
          primary: [],
        },
      },
      typography: [],
      animations: [],
      spacing: [],
      shadows: [],
      radius: [],
    }
  }
}
