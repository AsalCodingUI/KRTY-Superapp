/**
 * Features Layer
 *
 * This layer contains user interactions and business features.
 *
 * FSD Rules:
 * - This layer can import from layers below it
 * - This layer cannot import from layers above it
 * - Slices in this layer should not directly import from each other
 */

export * from "./attendance-clock"
export * from "./leave-request"
