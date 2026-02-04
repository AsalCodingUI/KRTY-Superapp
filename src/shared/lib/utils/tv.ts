import { createTV } from "tailwind-variants"

/**
 * Custom instance of tailwind-variants with twMerge disabled.
 * We disable internal merging because we use a custom 'cx' function
 * (in ./cn.ts) that handles tailwind-merge with our custom design system configuration.
 *
 * If we let tv merge, it uses default configuration and strips our custom classes.
 */
export const tv = createTV({
  twMerge: false,
})
