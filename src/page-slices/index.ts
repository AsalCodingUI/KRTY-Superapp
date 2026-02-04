/**
 * Pages Layer
 *
 * This layer contains full page compositions.
 *
 * FSD Rules:
 * - This layer can import from layers below it
 * - This layer cannot import from layers above it
 * - Slices in this layer should not directly import from each other
 */

export * from "./attendance"
export * from "./leave"
export * from "./performance"
export * from "./teams"
export * from "./calendar"
export * from "./calculator"
export * from "./payroll"
export * from "./settings"
