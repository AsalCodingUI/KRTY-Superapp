import type { CtxTargetEntry, CtxTypeResolver } from "./types"

/*
 * The two ways an element gets domain actions:
 *  - a type resolver, for any element marked `data-ctx="<type>"`
 *    (`data-ctx-id="…"` names the record) — list rows rendered anywhere;
 *  - a React target (ContextTarget / useContextTarget) holding closures
 *    from the component that rendered it.
 */

const types = new Map<string, CtxTypeResolver>()

/**
 * Gives every `data-ctx="<type>"` element its items. Call at module level
 * (the file of the feature); returns an unregister function. A later call
 * for the same type replaces the earlier one.
 */
export function registerContextType(type: string, resolver: CtxTypeResolver) {
  types.set(type, resolver)
  return () => {
    if (types.get(type) === resolver) types.delete(type)
  }
}

export function typeResolver(type: string) {
  return types.get(type)
}

/** Targets registered on an element (useContextTarget). */
const byElement = new WeakMap<Element, CtxTargetEntry>()
/** Targets found by their `data-ctx-key` (ContextTarget). */
const byKey = new Map<string, CtxTargetEntry>()

export function setElementTarget(el: Element, entry: CtxTargetEntry) {
  byElement.set(el, entry)
  return () => {
    if (byElement.get(el) === entry) byElement.delete(el)
  }
}

export function setKeyedTarget(key: string, entry: CtxTargetEntry) {
  byKey.set(key, entry)
  return () => {
    if (byKey.get(key) === entry) byKey.delete(key)
  }
}

/** The React target registered on `el`, if any. */
export function targetOf(el: Element): CtxTargetEntry | null {
  const direct = byElement.get(el)
  if (direct) return direct
  const key = el.getAttribute("data-ctx-key")
  return key ? (byKey.get(key) ?? null) : null
}
