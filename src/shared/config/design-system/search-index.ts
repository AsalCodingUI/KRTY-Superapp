/**
 * Search Index for Design System
 *
 * This module provides search functionality for components and design tokens.
 * It creates a searchable index and provides utilities for filtering results.
 */

import { componentRegistry } from "./component-registry"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SearchableItem {
  id: string
  type: "component" | "token"
  name: string
  description: string
  category: string
  keywords: string[]
  path?: string // For navigation
}

export interface SearchResult extends SearchableItem {
  score: number // Relevance score
  matchedFields: string[] // Which fields matched the query
}

// ============================================================================
// INDEX BUILDING
// ============================================================================

/**
 * Builds a searchable index of all components
 * Returns empty array if building fails
 */
export function buildComponentIndex(): SearchableItem[] {
  try {
    const items: SearchableItem[] = []

    for (const category of componentRegistry.categories) {
      for (const component of category.components) {
        // Extract keywords from component data
        const keywords = [
          component.name.toLowerCase(),
          component.description.toLowerCase(),
          category.name.toLowerCase(),
          ...component.variants.map((v) => v.name.toLowerCase()),
          ...component.relatedComponents,
        ]

        items.push({
          id: component.id,
          type: "component",
          name: component.name,
          description: component.description,
          category: category.name,
          keywords,
          path: `#${category.id}`, // Link to category section
        })
      }
    }

    return items
  } catch (error) {
    console.error("Error building component index:", error)
    return []
  }
}

/**
 * Builds a searchable index of all design tokens
 */
export function buildTokenIndex(): SearchableItem[] {
  const items: SearchableItem[] = []

  // Color tokens
  const colorScales = [
    "primary",
    "neutral",
    "success",
    "warning",
    "danger",
    "info",
  ]
  for (const scale of colorScales) {
    items.push({
      id: `token-color-${scale}`,
      type: "token",
      name: `${scale.charAt(0).toUpperCase() + scale.slice(1)} Colors`,
      description: `${scale} color scale with all shades`,
      category: "Colors",
      keywords: [scale, "color", "palette", "shade"],
      path: "#colors",
    })
  }

  // Semantic color tokens
  const semanticCategories = ["background", "text", "border", "status"]
  for (const semantic of semanticCategories) {
    items.push({
      id: `token-semantic-${semantic}`,
      type: "token",
      name: `${semantic.charAt(0).toUpperCase() + semantic.slice(1)} Colors`,
      description: `Semantic ${semantic} color mappings`,
      category: "Colors",
      keywords: [semantic, "semantic", "color", "mapping"],
      path: "#colors",
    })
  }

  // Typography tokens
  items.push({
    id: "token-typography",
    type: "token",
    name: "Typography",
    description: "Font sizes, weights, line heights, and text styles",
    category: "Typography",
    keywords: [
      "typography",
      "font",
      "text",
      "size",
      "weight",
      "heading",
      "body",
    ],
    path: "#typography",
  })

  // Spacing tokens
  items.push({
    id: "token-spacing",
    type: "token",
    name: "Spacing",
    description: "Consistent spacing scale based on 8-point grid system",
    category: "Spacing",
    keywords: ["spacing", "margin", "padding", "gap", "grid"],
    path: "#spacing",
  })

  // Shadow tokens
  items.push({
    id: "token-shadows",
    type: "token",
    name: "Shadows",
    description: "Elevation and depth through consistent shadow tokens",
    category: "Shadows",
    keywords: ["shadow", "elevation", "depth", "box-shadow"],
    path: "#shadows",
  })

  // Border radius tokens
  items.push({
    id: "token-radius",
    type: "token",
    name: "Border Radius",
    description: "Rounded corners for consistent component styling",
    category: "Border Radius",
    keywords: ["radius", "border", "rounded", "corner"],
    path: "#border-radius",
  })

  // Animation tokens
  items.push({
    id: "token-animations",
    type: "token",
    name: "Animations",
    description: "Motion and transitions for enhanced user experience",
    category: "Animations",
    keywords: ["animation", "transition", "motion", "keyframe", "easing"],
    path: "#animations",
  })

  return items
}

/**
 * Builds the complete search index
 */
export function buildSearchIndex(): SearchableItem[] {
  return [...buildComponentIndex(), ...buildTokenIndex()]
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

/**
 * Normalizes a search query for matching
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim()
}

/**
 * Calculates relevance score for a search result
 * Higher score = more relevant
 */
function calculateScore(
  item: SearchableItem,
  query: string,
  matchedFields: string[],
): number {
  let score = 0
  const normalizedQuery = normalizeQuery(query)

  // Exact name match gets highest score
  if (item.name.toLowerCase() === normalizedQuery) {
    score += 100
  }

  // Name starts with query gets high score
  if (item.name.toLowerCase().startsWith(normalizedQuery)) {
    score += 50
  }

  // Name contains query gets medium score
  if (item.name.toLowerCase().includes(normalizedQuery)) {
    score += 25
  }

  // Description contains query gets lower score
  if (item.description.toLowerCase().includes(normalizedQuery)) {
    score += 10
  }

  // Category match gets bonus
  if (item.category.toLowerCase().includes(normalizedQuery)) {
    score += 15
  }

  // Keyword matches get bonus
  for (const keyword of item.keywords) {
    if (keyword.includes(normalizedQuery)) {
      score += 5
    }
  }

  // Bonus for multiple field matches
  score += matchedFields.length * 3

  return score
}

/**
 * Checks if an item matches the search query
 */
function matchesQuery(
  item: SearchableItem,
  query: string,
): { matches: boolean; matchedFields: string[] } {
  const normalizedQuery = normalizeQuery(query)
  const matchedFields: string[] = []

  if (!normalizedQuery) {
    return { matches: true, matchedFields: [] }
  }

  // Check name
  if (item.name.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push("name")
  }

  // Check description
  if (item.description.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push("description")
  }

  // Check category
  if (item.category.toLowerCase().includes(normalizedQuery)) {
    matchedFields.push("category")
  }

  // Check keywords
  for (const keyword of item.keywords) {
    if (keyword.includes(normalizedQuery)) {
      matchedFields.push("keywords")
      break // Only count keywords once
    }
  }

  return {
    matches: matchedFields.length > 0,
    matchedFields,
  }
}

/**
 * Searches the index and returns matching results
 * Returns empty array if search fails
 */
export function search(query: string, index: SearchableItem[]): SearchResult[] {
  try {
    if (!query || query.trim() === "") {
      return []
    }

    const results: SearchResult[] = []

    for (const item of index) {
      const { matches, matchedFields } = matchesQuery(item, query)

      if (matches) {
        const score = calculateScore(item, query, matchedFields)
        results.push({
          ...item,
          score,
          matchedFields,
        })
      }
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score)

    return results
  } catch (error) {
    console.error("Error performing search:", error)
    return []
  }
}

/**
 * Filters results by type
 */
export function filterByType(
  results: SearchResult[],
  type: "component" | "token",
): SearchResult[] {
  return results.filter((result) => result.type === type)
}

/**
 * Filters results by category
 */
export function filterByCategory(
  results: SearchResult[],
  category: string,
): SearchResult[] {
  return results.filter(
    (result) => result.category.toLowerCase() === category.toLowerCase(),
  )
}

/**
 * Gets the top N results
 */
export function getTopResults(
  results: SearchResult[],
  limit: number,
): SearchResult[] {
  return results.slice(0, limit)
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Performs a complete search with all features
 * Returns empty array if search fails
 */
export function performSearch(
  query: string,
  options?: {
    type?: "component" | "token"
    category?: string
    limit?: number
  },
): SearchResult[] {
  try {
    const index = buildSearchIndex()
    let results = search(query, index)

    // Apply filters
    if (options?.type) {
      results = filterByType(results, options.type)
    }

    if (options?.category) {
      results = filterByCategory(results, options.category)
    }

    // Apply limit
    if (options?.limit) {
      results = getTopResults(results, options.limit)
    }

    return results
  } catch (error) {
    console.error("Error performing search:", error)
    return []
  }
}
