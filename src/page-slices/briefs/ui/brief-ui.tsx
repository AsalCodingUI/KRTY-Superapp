"use client"

import { cn } from "@/lib/utils"
import { Check } from "@/components/icons"
import type * as React from "react"

/**
 * The questionnaire's look, shared by the client's form and the team's
 * builder so what you build is what they see: our type scale and field
 * styles, laid out like a form (numbered sections, a star for required,
 * stacked lettered choices).
 */

export const briefTitleClass =
  "text-heading text-2xl font-medium tracking-tight text-balance"

export const sectionTitleClass =
  "text-heading text-lg font-medium tracking-tight"

export const questionLabelClass = "text-foreground text-[15px] font-medium"

export const questionHelpClass = "text-muted-foreground text-[13px]"

/** Text edited in place (the builder): no field chrome at all. */
export const inlineInputClass =
  "placeholder:text-tertiary-foreground appearance-none rounded-none border-0 bg-transparent p-0 shadow-none outline-none focus:border-0 focus:shadow-none focus:ring-0 focus:outline-none"

/**
 * Fields on the frosted card: see-through in light mode too (the token's
 * white is near opaque there), like dark mode's.
 */
export const glassFieldClass =
  "bg-white/35 hover:bg-white/55 dark:bg-field dark:hover:bg-field-hover"

/** The small "required" star after a label. */
export function RequiredMark() {
  return (
    <span
      aria-hidden
      className="text-muted-foreground ml-1 align-top text-[13px] leading-none"
    >
      *
    </span>
  )
}

export const choiceLetter = (index: number) =>
  index < 26 ? String.fromCharCode(65 + index) : String(index + 1)

/** Under a choice question's label: one, or as many as they like. */
export function ChoiceHint({
  multi,
  label,
}: {
  multi: boolean
  label?: string
}) {
  return (
    <p className="text-tertiary-foreground text-xs">
      {label ?? (multi ? "Choose all that apply" : "Choose one")}
    </p>
  )
}

/**
 * A choice's key: its letter (A, B, C…) in a circle, the same for pick-one
 * and pick-several; once picked it inverts on the filled (neutral) choice (a
 * check for pick-several).
 */
export function ChoiceBadge({
  index,
  multi,
  selected,
}: {
  index: number
  multi?: boolean
  selected?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums transition-colors",
        selected
          ? "text-foreground bg-background border-transparent"
          : "border-foreground/15 text-muted-foreground dark:bg-foreground/[0.04] bg-white/40",
      )}
    >
      {multi && selected ? (
        <Check className="size-3.5" strokeWidth={3} />
      ) : (
        choiceLetter(index)
      )}
    </span>
  )
}

/** One choice: its key and text, sized to the text; filled when picked. */
export function ChoiceButton({
  index,
  selected,
  multi,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  index: number
  selected?: boolean
  multi?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "focus-visible:ring-focus-ring flex min-h-11 w-fit max-w-full items-center gap-3 rounded-full border py-2 pr-5 pl-2.5 text-left text-[15px] transition-colors outline-none focus-visible:ring-2",
        selected
          ? "border-foreground bg-foreground text-background"
          : cn("border-field-border", glassFieldClass),
        className,
      )}
      {...props}
    >
      <ChoiceBadge index={index} multi={multi} selected={selected} />
      <span className="min-w-0 break-words">{children}</span>
    </button>
  )
}
