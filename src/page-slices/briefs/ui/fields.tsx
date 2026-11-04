"use client"

import { DateField } from "@/components/date-field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { BriefAnswers, BriefQuestion } from "@/shared/lib/briefs/types"
import { AtSign, Hash, Link2, Phone, Star } from "@/components/icons"
import { ChoiceButton, glassFieldClass } from "./brief-ui"

/** The form's fields are a size up (easier to read and tap). */
const large = cn("h-11 px-4 text-[15px] md:text-[15px]", glassFieldClass)

/**
 * One answer field per block type, as the client sees it. The builder
 * shows the same field (`preview`: looks the same, does nothing).
 */
export function BriefField({
  question: q,
  answers,
  onChange,
  flagged = false,
  preview = false,
  inputId,
}: {
  question: BriefQuestion
  answers: BriefAnswers
  onChange: (id: string, value: string | string[]) => void
  flagged?: boolean
  preview?: boolean
  inputId?: string
}) {
  const value = answers[q.id]
  const text = typeof value === "string" ? value : ""
  const list = Array.isArray(value) ? value : text ? [text] : []
  const set = (next: string | string[]) => !preview && onChange(q.id, next)
  const placeholder = q.example ? `e.g. ${q.example}` : undefined
  const invalid = flagged || undefined

  switch (q.type) {
    case "text":
      return (
        <Input
          id={inputId}
          value={text}
          placeholder={placeholder}
          aria-invalid={invalid}
          readOnly={preview}
          className={large}
          onChange={(e) => set(e.target.value)}
        />
      )
    case "textarea":
      return (
        <Textarea
          id={inputId}
          value={text}
          rows={3}
          placeholder={placeholder}
          aria-invalid={invalid}
          readOnly={preview}
          className={cn(
            "min-h-32 px-4 py-3 text-[15px] md:text-[15px]",
            glassFieldClass,
          )}
          onChange={(e) => set(e.target.value)}
        />
      )
    case "email":
    case "phone":
    case "url":
    case "number": {
      const Icon = { email: AtSign, phone: Phone, url: Link2, number: Hash }[
        q.type
      ]
      return (
        <div className="relative">
          <Input
            id={inputId}
            type={
              { email: "email", phone: "tel", url: "url", number: "number" }[
                q.type
              ]
            }
            inputMode={q.type === "number" ? "decimal" : undefined}
            value={text}
            placeholder={
              placeholder ??
              {
                email: "name@company.com",
                phone: "+62 812 3456 7890",
                url: "https://",
                number: "0",
              }[q.type]
            }
            aria-invalid={invalid}
            readOnly={preview}
            className={cn(large, "pr-10")}
            onChange={(e) => set(e.target.value)}
          />
          <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" />
        </div>
      )
    }
    case "date":
      return (
        <DateField
          id={inputId}
          value={text || null}
          aria-invalid={invalid}
          disabled={preview}
          onChange={(v) => set(v)}
          className={cn("h-11 w-full text-[15px] sm:w-72", glassFieldClass)}
        />
      )
    case "dropdown":
      return (
        <Select
          value={text || null}
          onValueChange={(v) => typeof v === "string" && set(v)}
          disabled={preview}
        >
          <SelectTrigger
            id={inputId}
            aria-invalid={invalid}
            className={cn(
              "h-11! w-full px-4 text-[15px] sm:w-80",
              glassFieldClass,
            )}
          >
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(q.options ?? [])
              .filter((o) => o.trim())
              .map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )
    case "yesno":
      return (
        <div
          role="radiogroup"
          aria-label={q.label}
          className="flex flex-col items-start gap-2"
        >
          {["Yes", "No"].map((option, i) => (
            <ChoiceButton
              key={option}
              index={i}
              role="radio"
              aria-checked={text === option}
              selected={text === option}
              tabIndex={preview ? -1 : undefined}
              onClick={() => set(text === option ? "" : option)}
              className={cn(
                flagged && text !== option && "border-destructive/50",
              )}
            >
              {option}
            </ChoiceButton>
          ))}
        </div>
      )
    case "single":
    case "multi": {
      const choices = [...(q.options ?? []), ...(q.other ? ["Other"] : [])]
      const toggle = (option: string) =>
        q.type === "single"
          ? set(text === option ? "" : option)
          : set(
              list.includes(option)
                ? list.filter((v) => v !== option)
                : [...list, option],
            )
      const otherKey = `${q.id}__other`
      const otherOn =
        q.type === "single" ? text === "Other" : list.includes("Other")
      return (
        <>
          <div
            className="flex flex-col items-start gap-2"
            role={q.type === "single" ? "radiogroup" : "group"}
            aria-label={q.label}
          >
            {choices.map((option, i) => {
              const on =
                q.type === "single" ? text === option : list.includes(option)
              return (
                <ChoiceButton
                  key={`${i}:${option}`}
                  index={i}
                  selected={on}
                  multi={q.type === "multi"}
                  role={q.type === "single" ? "radio" : "checkbox"}
                  aria-checked={on}
                  tabIndex={preview ? -1 : undefined}
                  onClick={() => toggle(option)}
                  className={cn(flagged && !on && "border-destructive/50")}
                >
                  {option}
                </ChoiceButton>
              )
            })}
          </div>
          {q.other && otherOn && (
            <Input
              className={large}
              value={
                typeof answers[otherKey] === "string"
                  ? (answers[otherKey] as string)
                  : ""
              }
              placeholder="Tell us more"
              aria-label={`${q.label}: other`}
              onChange={(e) => !preview && onChange(otherKey, e.target.value)}
            />
          )}
        </>
      )
    }
    case "scale": {
      const max = q.max ?? 10
      return (
        <div
          className="flex flex-col gap-1.5"
          role="radiogroup"
          aria-label={q.label}
        >
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: max }, (_, i) => String(i + 1)).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={text === n}
                tabIndex={preview ? -1 : undefined}
                onClick={() => set(text === n ? "" : n)}
                className={cn(
                  "focus-visible:ring-focus-ring flex size-10 items-center justify-center rounded-full border text-sm tabular-nums transition-colors outline-none focus-visible:ring-2",
                  text === n
                    ? "border-foreground bg-foreground text-background"
                    : cn("border-field-border", glassFieldClass),
                  flagged && text !== n && "border-destructive/50",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {(q.minLabel || q.maxLabel) && (
            <div
              className="text-muted-foreground flex justify-between text-xs"
              style={{ maxWidth: `${max * 2.875}rem` }}
            >
              <span>{q.minLabel}</span>
              <span>{q.maxLabel}</span>
            </div>
          )}
        </div>
      )
    }
    case "rating": {
      const max = q.max ?? 5
      const current = Number(text) || 0
      return (
        <div className="flex gap-1" role="radiogroup" aria-label={q.label}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={current === n}
              aria-label={`${n} / ${max}`}
              tabIndex={preview ? -1 : undefined}
              onClick={() => set(current === n ? "" : String(n))}
              className="focus-visible:ring-focus-ring rounded-md p-0.5 outline-none focus-visible:ring-2"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  n <= current
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40 hover:text-amber-300",
                )}
              />
            </button>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}
