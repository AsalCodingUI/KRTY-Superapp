"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ListFilter } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ALL_STATUSES,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "../lib/status"
import type { ProjectListRow } from "./ProjectList"
import { ProjectStatusIcon } from "./ProjectStatusIcon"

export const SORT_KEYS = [
  "deadline",
  "start",
  "updated",
  "name",
  "manual",
] as const
export type SortKey = (typeof SORT_KEYS)[number]

/** Sort + filters for the projects page, remembered per device. */
export type ListOptions = {
  sort: SortKey
  statuses: ProjectStatus[]
  clients: string[]
  processes: string[]
  categories: string[]
  mine: boolean
}

const DEFAULTS: ListOptions = {
  sort: "deadline",
  statuses: [],
  clients: [],
  processes: [],
  categories: [],
  mine: false,
}

const STORAGE_KEY = "projects:list-options"

const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === "string") : []

/** Reads a saved choice, dropping anything it no longer understands. */
function parse(raw: string | null): ListOptions {
  if (!raw) return DEFAULTS
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof ListOptions, unknown>>
    return {
      sort: SORT_KEYS.includes(v.sort as SortKey)
        ? (v.sort as SortKey)
        : DEFAULTS.sort,
      statuses: strings(v.statuses).filter((s): s is ProjectStatus =>
        (ALL_STATUSES as readonly string[]).includes(s),
      ),
      clients: strings(v.clients),
      processes: strings(v.processes),
      categories: strings(v.categories),
      mine: v.mine === true,
    }
  } catch {
    return DEFAULTS
  }
}

/** Like useViewMode: defaults on the server and first visit, then saved. */
export function useListOptions() {
  const [options, setOptions] = useState<ListOptions>(DEFAULTS)
  useEffect(() => {
    try {
      setOptions(parse(window.localStorage.getItem(STORAGE_KEY)))
    } catch {
      // Storage blocked: keep the defaults.
    }
  }, [])
  const update = useCallback((patch: Partial<ListOptions>) => {
    setOptions((current) => {
      const next = { ...current, ...patch }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage blocked: the choice lasts for this visit only.
      }
      return next
    })
  }, [])
  return [options, update] as const
}

/** How many filters narrow the list (sort doesn't count). */
export function activeFilterCount(o: ListOptions) {
  return (
    (o.statuses.length > 0 ? 1 : 0) +
    (o.clients.length > 0 ? 1 : 0) +
    (o.processes.length > 0 ? 1 : 0) +
    (o.categories.length > 0 ? 1 : 0) +
    (o.mine ? 1 : 0)
  )
}

/**
 * Drops saved picks that match none of the loaded projects (a renamed client,
 * a deleted category), so they can't hide everything unseen.
 */
export function pruneListOptions(
  o: ListOptions,
  projects: ProjectListRow[],
): ListOptions {
  const has = (pick: (p: ProjectListRow) => string | null | undefined) => {
    const ids = new Set(projects.map(pick))
    return (id: string) => ids.has(id)
  }
  return {
    ...o,
    clients: o.clients.filter(has((p) => p.client_name)),
    processes: o.processes.filter(has((p) => p.process?.id)),
    categories: o.categories.filter(has((p) => p.category?.id)),
  }
}

const time = (value?: string | null) => (value ? Date.parse(value) || 0 : 0)

/** Filters, then sorts (each key in its natural direction). */
export function applyListOptions(
  projects: ProjectListRow[],
  o: ListOptions,
  viewerId: string | null,
) {
  const keep = projects.filter(
    (p) =>
      (o.statuses.length === 0 || o.statuses.includes(p.status)) &&
      (o.clients.length === 0 ||
        (p.client_name != null && o.clients.includes(p.client_name))) &&
      (o.processes.length === 0 ||
        (p.process != null && o.processes.includes(p.process.id))) &&
      (o.categories.length === 0 ||
        (p.category != null && o.categories.includes(p.category.id))) &&
      (!o.mine ||
        (p.project_assignments ?? []).some((a) => a.user_id === viewerId)),
  )
  const byName = (a: ProjectListRow, b: ProjectListRow) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  const compare: Record<
    SortKey,
    (a: ProjectListRow, b: ProjectListRow) => number
  > = {
    name: byName,
    // Newest start first.
    start: (a, b) => b.start_date.localeCompare(a.start_date) || byName(a, b),
    // Soonest deadline first.
    deadline: (a, b) => a.end_date.localeCompare(b.end_date) || byName(a, b),
    // Most recently changed first.
    updated: (a, b) => time(b.updated_at) - time(a.updated_at) || byName(a, b),
    // Dragged in the list (never-dragged ones last, by deadline).
    manual: (a, b) =>
      (a.position ?? Infinity) - (b.position ?? Infinity) ||
      a.end_date.localeCompare(b.end_date) ||
      byName(a, b),
  }
  return keep.sort(compare[o.sort])
}

type Option = { id: string; label: string }

/** Distinct, sorted options from the loaded projects. */
function distinct(items: (Option | null | undefined)[]) {
  const map = new Map<string, string>()
  for (const item of items) if (item) map.set(item.id, item.label)
  return [...map]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

const toggle = <T,>(list: T[], value: T, on: boolean) =>
  on ? [...list, value] : list.filter((v) => v !== value)

/** "Filter" button: sort, then status / client / process / category / mine. */
export function ProjectsFilterMenu({
  projects,
  options,
  onChange,
}: {
  projects: ProjectListRow[]
  options: ListOptions
  onChange: (patch: Partial<ListOptions>) => void
}) {
  const t = useT("projects")
  const active = activeFilterCount(options)

  const choices = useMemo(
    () => ({
      clients: distinct(
        projects.map((p) =>
          p.client_name ? { id: p.client_name, label: p.client_name } : null,
        ),
      ),
      processes: distinct(
        projects.map((p) =>
          p.process ? { id: p.process.id, label: p.process.name } : null,
        ),
      ),
      categories: distinct(
        projects.map((p) =>
          p.category ? { id: p.category.id, label: p.category.name } : null,
        ),
      ),
    }),
    [projects],
  )

  const sortLabels: Record<SortKey, string> = {
    deadline: t("sortDeadline"),
    start: t("sortStart"),
    updated: t("sortUpdated"),
    name: t("sortName"),
    manual: t("sortManual"),
  }

  const facet = (
    key: "clients" | "processes" | "categories",
    label: string,
  ) => {
    const all = choices[key]
    if (all.length === 0) return null
    const picked = options[key].length
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span className="flex-1">{label}</span>
          {picked > 0 && (
            <span className="text-muted-foreground tabular-nums">{picked}</span>
          )}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-h-80 min-w-48">
          {all.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.id}
              checked={options[key].includes(o.id)}
              onCheckedChange={(on) =>
                onChange({ [key]: toggle(options[key], o.id, on) })
              }
            >
              <span className="truncate">{o.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            aria-label={
              active > 0
                ? t("filterLabelActive", { n: active })
                : t("filterLabel")
            }
            className={cn(
              "relative max-sm:w-8 max-sm:px-0",
              active > 0 && "sm:pr-2.5",
            )}
          />
        }
      >
        <ListFilter data-icon="inline-start" />
        <span className="hidden sm:inline">{t("filter")}</span>
        {active > 0 && (
          <span className="bg-primary text-primary-foreground grid size-4 place-items-center rounded-full text-[10px] font-medium tabular-nums max-sm:absolute max-sm:-top-1 max-sm:-right-1">
            {active}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("sortBy")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={options.sort}
            onValueChange={(value) => onChange({ sort: value as SortKey })}
          >
            {SORT_KEYS.map((key) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {sortLabels[key]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("filter")}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={options.mine}
            onCheckedChange={(on) => onChange({ mine: on })}
          >
            {t("filterMyProjects")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="flex-1">{t("colStatus")}</span>
              {options.statuses.length > 0 && (
                <span className="text-muted-foreground tabular-nums">
                  {options.statuses.length}
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-44">
              {ALL_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={options.statuses.includes(status)}
                  onCheckedChange={(on) =>
                    onChange({
                      statuses: toggle(options.statuses, status, on),
                    })
                  }
                >
                  <ProjectStatusIcon status={status} />
                  {t(STATUS_LABEL_KEYS[status])}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {facet("clients", t("filterClient"))}
          {facet("processes", t("filterProcess"))}
          {facet("categories", t("colCategory"))}
        </DropdownMenuGroup>
        {active > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                onChange({
                  statuses: [],
                  clients: [],
                  processes: [],
                  categories: [],
                  mine: false,
                })
              }
            >
              {t("filterReset")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
