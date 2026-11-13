"use client"

import { DateField } from "@/components/date-field"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { RiCheckLine } from "@/shared/ui/lucide-icons"
import { useEffect, useState } from "react"
import type { PropOption, PropType, PropValue, WikiProp } from "../model/data"
import { evaluateFormula } from "../model/formula"

/** Notion's option colors on the app's badge tones. */
const COLOR_TONE: Record<string, BadgeVariant> = {
  default: "secondary",
  gray: "secondary",
  brown: "warning",
  orange: "warning",
  yellow: "warning",
  green: "success",
  blue: "info",
  purple: "default",
  pink: "destructive",
  red: "destructive",
}
const COLORS = Object.keys(COLOR_TONE).slice(1)
export const toneOf = (option?: PropOption) =>
  COLOR_TONE[option?.color ?? "default"] ?? "secondary"

export const PROP_TYPE_LABEL: Record<PropType, MessageKey<"wiki">> = {
  text: "propText",
  number: "propNumber",
  checkbox: "propCheckbox",
  date: "propDate",
  select: "propSelect",
  multi_select: "propMultiSelect",
  url: "propUrl",
  formula: "propFormula",
}

/**
 * A row's value for a column: stored, or computed for a formula (other
 * formula columns it names are computed too; a loop reads as null).
 */
export function cellValue(
  prop: WikiProp,
  props: Record<string, PropValue> | undefined,
  schema: WikiProp[],
  seen: Set<string> = new Set(),
): PropValue {
  if (prop.type !== "formula") return props?.[prop.id] ?? null
  if (seen.has(prop.id)) return null
  const next = new Set(seen).add(prop.id)
  return evaluateFormula(prop.formula ?? "", (name) => {
    const target = schema.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    )
    return target ? cellValue(target, props, schema, next) : null
  })
}

/** A value read as text (search, sort, the row's line). */
export function valueText(value: PropValue): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

/** A text-ish field that saves when left (or on Enter). */
function CommitInput({
  value,
  shown,
  onCommit,
  inputMode,
  placeholder,
  ariaLabel,
}: {
  value: string
  /** What it reads as while not being edited (a formatted number). */
  shown?: string
  onCommit: (value: string) => void
  inputMode?: "decimal" | "url"
  placeholder?: string
  ariaLabel: string
}) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  useEffect(() => setDraft(value), [value])
  return (
    <Input
      value={editing || shown === undefined ? draft : shown}
      onFocus={() => setEditing(true)}
      inputMode={inputMode}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) =>
        setDraft(
          inputMode === "decimal"
            ? e.target.value.replace(/[^\d.,-]/g, "")
            : e.target.value,
        )
      }
      onBlur={() => {
        setEditing(false)
        if (draft !== value) onCommit(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
        if (e.key === "Escape") {
          setDraft(value)
          e.currentTarget.blur()
        }
      }}
      className="hover:bg-muted/60 h-8 border-transparent bg-transparent shadow-none focus-visible:bg-transparent dark:bg-transparent"
    />
  )
}

/** Options of a select / multi-select: pick, or type a new one. */
function OptionsPicker({
  prop,
  value,
  multi,
  onChange,
  onAddOption,
  emptyText,
}: {
  prop: WikiProp
  value: string[]
  multi: boolean
  emptyText: string
  onChange: (value: string[]) => void
  onAddOption: (option: PropOption) => void
}) {
  const t = useT("wiki")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const options = prop.options ?? []
  const q = query.trim()
  const shown = options.filter((o) =>
    o.name.toLowerCase().includes(q.toLowerCase()),
  )
  const exists = options.some((o) => o.name.toLowerCase() === q.toLowerCase())
  const toggle = (name: string) => {
    const next = multi
      ? value.includes(name)
        ? value.filter((v) => v !== name)
        : [...value, name]
      : value[0] === name
        ? []
        : [name]
    onChange(next)
    if (!multi) setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={prop.name}
            className="hover:bg-muted/60 rounded-control flex min-h-8 w-full flex-wrap items-center gap-1 px-2.5 py-1 text-left"
          />
        }
      >
        {value.length ? (
          value.map((name) => (
            <Badge
              key={name}
              variant={toneOf(options.find((o) => o.name === name))}
            >
              {name}
            </Badge>
          ))
        ) : (
          <span className="text-tertiary-foreground text-sm">{emptyText}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 p-1.5">
        <Input
          autoFocus
          value={query}
          placeholder={t("optionSearch")}
          aria-label={t("optionSearch")}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !q) return
            e.preventDefault()
            if (!exists) {
              onAddOption({
                name: q,
                color: COLORS[options.length % COLORS.length],
              })
            }
            const name = exists
              ? options.find((o) => o.name.toLowerCase() === q.toLowerCase())!
                  .name
              : q
            if (!value.includes(name)) toggle(name)
            setQuery("")
          }}
          className="h-8"
        />
        <div className="no-scrollbar flex max-h-60 flex-col overflow-y-auto">
          {shown.map((option) => (
            <button
              key={option.name}
              type="button"
              onClick={() => toggle(option.name)}
              className="hover:bg-muted rounded-nested flex min-h-8 items-center gap-2 px-2 text-left"
            >
              <Badge variant={toneOf(option)}>{option.name}</Badge>
              {value.includes(option.name) && (
                <RiCheckLine className="text-muted-foreground ml-auto size-4" />
              )}
            </button>
          ))}
          {q && !exists && (
            <p className="text-muted-foreground text-meta px-2 py-1.5">
              {t("optionCreate", { name: q })}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * One property's value, edited in place (a database cell, or a row page's
 * property line). `onAddOption` adds a select option to the schema.
 */
export function PropCell({
  prop,
  value,
  onChange,
  onAddOption,
  quiet = false,
}: {
  prop: WikiProp
  value: PropValue | undefined
  onChange: (value: PropValue) => void
  onAddOption: (option: PropOption) => void
  /** A table cell: empty reads as nothing (not "Kosong"). */
  quiet?: boolean
}) {
  const t = useT("wiki")
  const emptyText = quiet ? "" : t("emptyValue")
  switch (prop.type) {
    case "checkbox":
      return (
        <div className="flex h-8 items-center px-2.5">
          <Checkbox
            aria-label={prop.name}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
        </div>
      )
    case "number":
      return (
        <CommitInput
          ariaLabel={prop.name}
          inputMode="decimal"
          value={typeof value === "number" ? String(value) : ""}
          shown={
            typeof value === "number"
              ? new Intl.NumberFormat("id-ID", {
                  maximumFractionDigits: 2,
                }).format(value)
              : ""
          }
          placeholder={emptyText}
          onCommit={(raw) => {
            const n = Number(raw.replace(",", "."))
            onChange(raw.trim() === "" || Number.isNaN(n) ? null : n)
          }}
        />
      )
    case "date":
      return (
        <DateField
          aria-label={prop.name}
          value={typeof value === "string" ? value : null}
          onChange={(v) => onChange(v || null)}
          placeholder={emptyText}
          className="hover:bg-muted/60 h-8 border-transparent bg-transparent shadow-none dark:bg-transparent"
        />
      )
    case "select":
    case "multi_select": {
      const list = Array.isArray(value)
        ? value
        : typeof value === "string" && value
          ? [value]
          : []
      return (
        <OptionsPicker
          prop={prop}
          value={list}
          multi={prop.type === "multi_select"}
          emptyText={emptyText}
          onAddOption={onAddOption}
          onChange={(next) =>
            onChange(prop.type === "multi_select" ? next : (next[0] ?? null))
          }
        />
      )
    }
    case "formula":
      // Computed (cellValue): read only, a number as the others.
      return (
        <div className="text-foreground flex h-8 items-center px-2.5 tabular-nums">
          {typeof value === "number"
            ? new Intl.NumberFormat("id-ID", {
                maximumFractionDigits: 2,
              }).format(value)
            : quiet
              ? ""
              : "—"}
        </div>
      )
    case "url":
      return (
        <div className="group/url relative">
          <CommitInput
            ariaLabel={prop.name}
            inputMode="url"
            value={typeof value === "string" ? value : ""}
            placeholder={emptyText}
            onCommit={(v) => onChange(v.trim() || null)}
          />
          {typeof value === "string" && /^https?:\/\//.test(value) && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "text-primary text-meta absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover/url:opacity-100",
              )}
            >
              {t("openLink")}
            </a>
          )}
        </div>
      )
    default:
      return (
        <CommitInput
          ariaLabel={prop.name}
          value={typeof value === "string" ? value : valueText(value ?? null)}
          placeholder={emptyText}
          onCommit={(v) => onChange(v || null)}
        />
      )
  }
}
