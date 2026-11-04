import type { Namespace } from "./messages"

// No dictionaries imported here (types only): the client imports this file.

/** Read only on the server (getT), so never sent to the browser. */
export const SERVER_ONLY_NAMESPACES = ["api"] as const satisfies Namespace[]

/**
 * Used under one route only: left out of the root layout's messages and
 * sent by that route's layout instead (<I18nScope>), so other pages don't
 * carry them. A namespace used anywhere else must not be listed here; if
 * one is missing where it's used anyway, useT loads it lazily (client.tsx,
 * which needs a loader per entry).
 */
export const ROUTE_NAMESPACES = [
  // src/app/(main)/dashboard/layout.tsx
  "dashboard",
] as const satisfies Namespace[]

export type RouteNamespace = (typeof ROUTE_NAMESPACES)[number]
