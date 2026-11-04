"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/shared/api/supabase/client"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { projectHref } from "@/shared/lib/url-params"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { CornerDownRight, TriangleAlert } from "@/components/icons"
import Link from "next/link"
import { useState } from "react"
import { STATUS_LABEL_KEYS, type ProjectStatus } from "../lib/status"
import { ProjectStatusIcon } from "./ProjectStatusIcon"

export type ProjectOption = {
  id: string
  name: string
  status: ProjectStatus
  end_date: string
  client_name: string | null
}

/** Same name, ignoring case and spaces at the ends. */
export const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()

/** The projects the viewer can see, newest deadline first (form pickers). */
export function useProjectOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["projects", "options"],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("projects")
        .select("id, name, status, end_date, client_name")
        .order("end_date", { ascending: false })
      if (error) throw error
      return (data ?? []) as ProjectOption[]
    },
  })
}

function useWhen() {
  const dateLocale = useDateLocale()
  return (date: string) =>
    format(parseISO(date), "d MMM yyyy", { locale: dateLocale })
}

/**
 * Under the name: projects that already have it, each with "Buka" and (new
 * projects) "Jadikan lanjutan", so the same work isn't entered twice.
 */
export function NameTwinNotice({
  name,
  selfId,
  linkedId,
  onLink,
}: {
  name: string
  /** The project being edited (not its own twin). */
  selfId: string | null
  /** Already continued: that one isn't flagged. */
  linkedId: string | null
  /** New projects: continue the twin instead. */
  onLink?: (project: ProjectOption) => void
}) {
  const t = useT("projects")
  const when = useWhen()
  const needle = name.trim()
  // Asked of the database: a PM can't see projects they aren't on, and
  // those are the ones that get entered twice.
  const { data: found = [] } = useQuery({
    queryKey: ["projects", "name-twins", needle.toLocaleLowerCase()],
    enabled: Boolean(needle),
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await createClient().rpc("project_name_twins", {
        p_name: needle,
      })
      if (error) throw error
      return (data ?? []) as (ProjectOption & { can_open: boolean })[]
    },
  })
  const twins = found.filter(
    (p) => p.id !== selfId && p.id !== linkedId && sameName(p.name, name),
  )
  if (!twins.length) return null
  return (
    <div className="bg-amber-3 dark:bg-amber-9/10 text-meta flex flex-col gap-2 rounded-xl px-3 py-2.5">
      <p className="text-foreground flex items-center gap-2">
        <TriangleAlert className="text-warning-ink size-3.5 shrink-0" />
        {t("twinTitle", { name: twins[0].name })}
      </p>
      {twins.slice(0, 3).map((p) => (
        <div key={p.id} className="flex items-center gap-2 pl-5.5">
          <ProjectStatusIcon status={p.status} className="size-3.5" />
          <span className="text-muted-foreground min-w-0 flex-1 truncate">
            {t(STATUS_LABEL_KEYS[p.status])} · {when(p.end_date)}
            {p.client_name ? ` · ${p.client_name}` : ""}
          </span>
          {!p.can_open ? (
            <span className="text-muted-foreground shrink-0 text-xs">
              {t("twinNotOnTeam")}
            </span>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-meta h-7 px-2.5"
                nativeButton={false}
                render={
                  <Link
                    href={projectHref(p)}
                    target="_blank"
                    prefetch={false}
                  />
                }
              >
                {t("twinOpen")}
              </Button>
              {onLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-meta h-7 px-2.5"
                  onClick={() => onLink(p)}
                >
                  {t("twinContinue")}
                </Button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * "Lanjutan dari": the project this one continues, as a chip (× to drop
 * it), or a quiet button that opens a searchable list of projects.
 */
export function PreviousProjectField({
  value,
  selfId,
  onChange,
}: {
  value: string | null
  selfId: string | null
  onChange: (project: ProjectOption | null) => void
}) {
  const t = useT("projects")
  const when = useWhen()
  const [open, setOpen] = useState(false)
  const { data: options = [] } = useProjectOptions(Boolean(value) || open)
  const current = options.find((p) => p.id === value) ?? null

  if (value)
    return (
      <div className="bg-muted text-meta flex items-center gap-2 rounded-xl px-3 py-2">
        <CornerDownRight className="text-muted-foreground size-3.5 shrink-0" />
        <span className="text-muted-foreground shrink-0">
          {t("previousLabel")}
        </span>
        <span className="text-foreground min-w-0 truncate">
          {current?.name ?? "…"}
        </span>
        {current && (
          <span className="text-tertiary-foreground shrink-0">
            {t(STATUS_LABEL_KEYS[current.status])}
          </span>
        )}
        <span className="text-muted-foreground ml-auto hidden shrink-0 sm:inline">
          {t("previousCopied")}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground -mr-1.5 size-6"
          aria-label={t("previousRemove")}
          onClick={() => onChange(null)}
        >
          <RiCloseLine />
        </Button>
      </div>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-meta -ml-2.5 self-start px-2.5 font-normal"
          />
        }
      >
        <CornerDownRight data-icon="inline-start" />
        {t("previousPick")}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <Command loop>
          <CommandInput size="sm" placeholder={t("previousSearch")} />
          <CommandList>
            <CommandEmpty>{t("previousNone")}</CommandEmpty>
            <CommandGroup>
              {options
                .filter((p) => p.id !== selfId)
                .map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.client_name ?? ""} ${p.id}`}
                    onSelect={() => {
                      onChange(p)
                      setOpen(false)
                    }}
                  >
                    <ProjectStatusIcon status={p.status} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-tertiary-foreground shrink-0 text-xs tabular-nums">
                      {when(p.end_date)}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** The project this one continues, and the ones that continue it. */
function useProjectLineage(projectId: string, previousId: string | null) {
  return useQuery({
    queryKey: ["projects", "lineage", projectId, previousId],
    queryFn: async () => {
      const db = createClient()
      const [prev, next] = await Promise.all([
        previousId
          ? db
              .from("projects")
              .select("id, name, status, end_date, client_name")
              .eq("id", previousId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        db
          .from("projects")
          .select("id, name, status, end_date, client_name")
          .eq("previous_id", projectId)
          .order("start_date"),
      ])
      return {
        previous: (prev.data ?? null) as ProjectOption | null,
        next: (next.data ?? []) as ProjectOption[],
      }
    },
  })
}

/** For the properties line: "Lanjutan dari …" / "Dilanjutkan di …" links. */
export function ProjectLineageLinks({
  projectId,
  previousId,
  className,
}: {
  projectId: string
  previousId: string | null
  className?: string
}) {
  const t = useT("projects")
  const { data } = useProjectLineage(projectId, previousId)
  if (!data || (!data.previous && !data.next.length)) return null
  const link = (p: ProjectOption, label: string) => (
    <Link
      key={p.id}
      href={projectHref(p)}
      prefetch={false}
      className={className}
      title={label}
    >
      <CornerDownRight className="text-muted-foreground size-4" />
      <span className="truncate underline-offset-4 hover:underline">
        {label}
      </span>
    </Link>
  )
  return (
    <>
      {data.previous &&
        link(data.previous, t("previousOf", { name: data.previous.name }))}
      {data.next.map((p) => link(p, t("nextOf", { name: p.name })))}
    </>
  )
}
