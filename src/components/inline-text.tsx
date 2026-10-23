"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

/**
 * Text that edits in place: saves on blur or Enter when changed, Escape
 * reverts. Looks like plain text until hovered or focused.
 */
export function InlineText({
  value,
  onSave,
  required,
  placeholder,
  className,
  disabled,
  ...props
}: {
  value: string
  onSave: (value: string) => unknown
  required?: boolean
  placeholder?: string
  className?: string
  /** Read-only: plain text for people who can't edit. */
  disabled?: boolean
  "aria-label"?: string
}) {
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const next = draft.trim()
    if (next === value.trim()) return setDraft(value)
    if (required && !next) return setDraft(value)
    onSave(next)
  }

  return (
    <input
      ref={ref}
      value={draft}
      readOnly={disabled}
      tabIndex={disabled ? -1 : undefined}
      placeholder={placeholder}
      aria-label={props["aria-label"] ?? placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") ref.current?.blur()
        if (e.key === "Escape") {
          setDraft(value)
          requestAnimationFrame(() => ref.current?.blur())
        }
      }}
      className={cn(
        "placeholder:text-tertiary-foreground -mx-1.5 min-w-0 flex-1 truncate rounded-md border-0 bg-transparent px-1.5 py-0.5 shadow-none outline-hidden focus:shadow-none focus:ring-0 focus:outline-hidden",
        !disabled && "hover:bg-muted/60 focus:bg-muted/60",
        className,
      )}
    />
  )
}
