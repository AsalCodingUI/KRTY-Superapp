/**
 * Component Registry Type Definitions
 *
 * This file defines the TypeScript interfaces for the component registry system
 * used in the design system showcase page.
 */

/**
 * Represents a single property/prop of a component
 */
export interface ComponentProp {
  /** The name of the prop */
  name: string
  /** The TypeScript type of the prop */
  type: string
  /** Whether this prop is required */
  required: boolean
  /** The default value if not required */
  default?: any
  /** Description of what this prop does */
  description: string
}

/**
 * Represents a variant of a component (e.g., different sizes, colors, styles)
 */
export interface ComponentVariant {
  /** The name of this variant */
  name: string
  /** Description of this variant */
  description: string
  /** The props that define this variant */
  props: Record<string, any>
  /** React node to preview this variant */
  preview: React.ReactNode
}

/**
 * Represents a code example for a component
 */
export interface ComponentExample {
  /** Title of the example */
  title: string
  /** Description of what this example demonstrates */
  description: string
  /** The code snippet */
  code: string
  /** React node to preview this example */
  preview: React.ReactNode
}

/**
 * Represents a single component entry in the registry
 */
export interface ComponentEntry {
  /** Unique identifier for the component */
  id: string
  /** Display name of the component */
  name: string
  /** Description of the component's purpose */
  description: string
  /** Import path for the component (e.g., "@/components/ui/Button") */
  importPath: string
  /** All available variants of this component */
  variants: ComponentVariant[]
  /** All props/properties this component accepts */
  props: ComponentProp[]
  /** Code examples demonstrating usage */
  examples: ComponentExample[]
  /** IDs of related components */
  relatedComponents: string[]
}

/**
 * Represents a category of components
 */
export interface ComponentCategory {
  /** Unique identifier for the category */
  id: string
  /** Display name of the category */
  name: string
  /** Description of this category */
  description: string
  /** All components in this category */
  components: ComponentEntry[]
}

/**
 * The complete component registry
 */
export interface ComponentRegistry {
  /** All component categories */
  categories: ComponentCategory[]
}
