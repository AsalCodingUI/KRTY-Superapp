"use client"

import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type RefObject,
} from "react"
import { setElementTarget, setKeyedTarget } from "./registry"
import type { CtxContext, CtxItems, CtxTargetEntry } from "./types"

type TargetProps = {
  /** What it is ("project", "task", …): its data-ctx type. */
  type?: string
  /** The record's id (data-ctx-id). */
  id?: string
  /** Group label in the menu (the record's name). */
  label?: string
  /** Its page: adds Buka / Buka di tab baru / Salin link. */
  href?: string
  /** Built when the menu opens (keep it cheap: no fetching). */
  items?: (ctx: CtxContext) => CtxItems | null | undefined
  /** Generic layers of these kinds inside it are dropped ("image", …). */
  suppress?: string[]
}

/** An entry whose fields always read the latest props. */
function useLiveEntry(props: TargetProps): CtxTargetEntry {
  const latest = useRef(props)
  latest.current = props
  const entry = useRef<CtxTargetEntry | null>(null)
  if (!entry.current)
    entry.current = {
      get type() {
        return latest.current.type
      },
      get id() {
        return latest.current.id
      },
      get label() {
        return latest.current.label
      },
      get href() {
        return latest.current.href
      },
      get suppress() {
        return latest.current.suppress
      },
      items: (ctx) => latest.current.items?.(ctx),
    }
  return entry.current
}

/**
 * Gives its child (one element that passes `data-*` props to the DOM) a
 * section in the right-click menu:
 *
 *   <ContextTarget type="project" id={p.id} label={p.name}
 *     href={projectHref(p)} items={() => [{ id: "edit", label: "Ubah", … }]}>
 *     <ListRow>…</ListRow>
 *   </ContextTarget>
 */
export function ContextTarget({
  children,
  ...props
}: TargetProps & { children: ReactElement<Record<string, unknown>> }) {
  const key = useId()
  const entry = useLiveEntry(props)
  useEffect(() => setKeyedTarget(key, entry), [key, entry])
  return cloneElement(children, {
    "data-ctx-key": key,
    ...(props.type && { "data-ctx": props.type }),
    ...(props.id && { "data-ctx-id": props.id }),
  })
}

/**
 * Same as <ContextTarget>, for an element you hold (a ref, or the element):
 * a third-party root (the editor's DOM), a component that won't take props.
 *
 *   useContextTarget(rowRef, (ctx) => [...items], { label: name })
 */
export function useContextTarget(
  target: RefObject<Element | null> | Element | null | undefined,
  items: TargetProps["items"],
  options: Omit<TargetProps, "items"> = {},
) {
  const entry = useLiveEntry({ ...options, items })
  const el = target && "current" in target ? target.current : (target ?? null)
  useEffect(() => {
    const node =
      target && "current" in target ? target.current : (target ?? null)
    if (!node) return
    return setElementTarget(node, entry)
    // `el` re-runs it when a ref's element changes between renders.
  }, [target, el, entry])
}
