"use client"

import { EmptyState } from "@/components/empty-state"
import { ProjectAvatar } from "@/components/project-avatar"
import { SegmentedControl } from "@/components/segmented-control"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiBookOpenLine,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiFileTextLine,
  RiNotification3Line,
  RiSearchLine,
  RiTimeLine,
  type RemixiconComponentType,
} from "@/shared/ui/lucide-icons"
import { CornerDownLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useRef, useState } from "react"
import {
  pushRecent,
  readRecent,
  useDebounced,
  useRecordSearch,
  type SearchHit,
  type SearchScope,
} from "../model/useGlobalSearch"

type ShellKey = MessageKey<"shell">

const SCOPES: { value: SearchScope; label: ShellKey; admin?: boolean }[] = [
  { value: "all", label: "searchScopeAll" },
  { value: "pages", label: "searchScopePages" },
  { value: "projects", label: "searchScopeProjects" },
  { value: "tasks", label: "searchScopeTasks" },
  { value: "files", label: "searchScopeFiles" },
  { value: "policies", label: "searchScopePolicies" },
  { value: "people", label: "searchScopePeople", admin: true },
]

const GROUPS: { kind: SearchHit["kind"]; label: ShellKey }[] = [
  { kind: "pages", label: "searchScopePages" },
  { kind: "projects", label: "searchScopeProjects" },
  { kind: "tasks", label: "searchScopeTasks" },
  { kind: "files", label: "searchGroupFiles" },
  { kind: "policies", label: "searchScopePolicies" },
  { kind: "people", label: "searchScopePeople" },
]

/**
 * Extra words people type for a page, matched on its href. Both languages,
 * so a page is found by either name whatever the UI language is.
 */
const PAGE_KEYWORDS: [string, string][] = [
  ["/dashboard", "home beranda dashboard"],
  ["/performance", "performance kinerja kpi nilai skor rating penilaian"],
  ["/performance/360-review", "rekan feedback"],
  ["/performance/one-on-one", "meeting 1on1"],
  ["/leave", "leave cuti izin absen absensi kehadiran clock attendance"],
  ["/calendar", "calendar jadwal kalender agenda schedule"],
  ["/teams", "team karyawan anggota tim direktori orang members"],
  ["/projects", "projects proyek klien client"],
  ["/finance", "finance keuangan langganan subscriptions"],
  ["/notifications", "notifications notif pemberitahuan"],
  ["/policies", "policies rules aturan kebijakan peraturan handbook sop"],
]

function pageKeywords(href: string) {
  return PAGE_KEYWORDS.filter(([h]) => href === h || href.startsWith(`${h}/`))
    .map(([, k]) => k)
    .join(" ")
}

/** The ⌘K dialog body; loaded on first open so cmdk stays off every page. */
export default function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("shell")
  const tc = useT("common")
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={tc("search")}
      description={t("searchDescription")}
    >
      {open && <SearchPanel onClose={() => onOpenChange(false)} />}
    </CommandDialog>
  )
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const t = useT("shell")
  const tNav = useT("nav")
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { visible } = useWorkspaceNav()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<SearchScope>("all")
  const [recent] = useState(readRecent)
  const debounced = useDebounced(query)
  const trimmed = query.trim()

  const scopes = SCOPES.filter((s) => !s.admin || isAdmin).map((s) => ({
    value: s.value,
    label: t(s.label),
  }))
  const { data: records = [], isFetching } = useRecordSearch(debounced, {
    people: isAdmin,
  })

  // Every page and tab the viewer can open, with the sidebar icon of its page.
  const { pages, pageIcons } = useMemo(() => {
    const icons = new Map<string, RemixiconComponentType>()
    const out: SearchHit[] = []
    const add = (
      hit: Omit<SearchHit, "id" | "kind">,
      icon: RemixiconComponentType,
    ) => {
      if (icons.has(hit.href)) return
      icons.set(hit.href, icon)
      out.push({ ...hit, id: `page:${hit.href}`, kind: "pages" })
    }
    for (const ws of visible) {
      for (const item of ws.items) {
        add(
          { title: tNav(item.name), meta: tNav(ws.name), href: item.href },
          item.icon,
        )
        for (const child of item.children ?? []) {
          if (child.can && !(profile && child.can(profile))) continue
          add(
            {
              title: tNav(child.name),
              meta: tNav(item.name),
              href: child.href,
            },
            item.icon,
          )
        }
      }
    }
    add(
      {
        title: tNav("notifications"),
        meta: tNav("account"),
        href: "/notifications",
      },
      RiNotification3Line,
    )
    return { pages: out, pageIcons: icons }
  }, [visible, profile, tNav])

  // Recent pages were saved with the names of the language at the time.
  const recentHits = useMemo(
    () =>
      recent.map((hit) =>
        hit.kind === "pages"
          ? (pages.find((p) => p.href === hit.href) ?? hit)
          : hit,
      ),
    [recent, pages],
  )

  const results = useMemo(() => {
    const needle = trimmed.toLowerCase()
    const pageHits = needle
      ? pages.filter((p) =>
          `${p.title} ${p.meta ?? ""} ${pageKeywords(p.href)}`
            .toLowerCase()
            .includes(needle),
        )
      : pages
    // Records only once the debounced query catches up, so stale hits never
    // sit under a newer query.
    const recordHits =
      trimmed.length >= 2 && debounced.trim() === trimmed ? records : []
    const all = [...pageHits, ...recordHits]
    return scope === "all" ? all : all.filter((h) => h.kind === scope)
  }, [pages, records, trimmed, debounced, scope])

  const showRecent = !trimmed && scope === "all" && recentHits.length > 0
  const searching =
    trimmed.length >= 2 && (isFetching || debounced.trim() !== trimmed)

  const open = useCallback(
    (hit: SearchHit) => {
      pushRecent(hit)
      onClose()
      router.push(hit.href)
    },
    [onClose, router],
  )

  const cycleScope = (dir: 1 | -1) => {
    const i = scopes.findIndex((s) => s.value === scope)
    setScope(scopes[(i + dir + scopes.length) % scopes.length].value)
  }

  return (
    <Command
      shouldFilter={false}
      loop
      className="min-h-0 flex-1 rounded-none bg-transparent p-0"
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          e.preventDefault()
          cycleScope(e.shiftKey ? -1 : 1)
        }
      }}
    >
      <CommandInput
        ref={inputRef}
        autoFocus
        value={query}
        onValueChange={setQuery}
        placeholder={t("searchPlaceholder")}
        trailing={
          <>
            {searching && <Spinner className="text-muted-foreground size-4" />}
            {query && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("searchClear")}
                className="text-muted-foreground"
                onClick={() => {
                  setQuery("")
                  inputRef.current?.focus()
                }}
              >
                <RiCloseLine />
              </Button>
            )}
          </>
        }
      />

      <div className="border-border border-b px-3 pb-3">
        <SegmentedControl
          fitContent
          value={scope}
          onChange={(value) => {
            setScope(value)
            inputRef.current?.focus()
          }}
          items={scopes}
        />
      </div>

      <CommandList className="max-h-none min-h-0 flex-1 scroll-py-2 p-2">
        {showRecent && (
          <CommandGroup heading={t("searchRecent")}>
            {recentHits.map((hit) => (
              <ResultItem
                key={`recent-${hit.id}`}
                value={`recent-${hit.id}`}
                hit={hit}
                icon={hit.kind === "pages" ? RiTimeLine : undefined}
                onSelect={open}
              />
            ))}
          </CommandGroup>
        )}
        {GROUPS.map(({ kind, label }) => {
          const hits = results.filter((h) => h.kind === kind)
          if (hits.length === 0) return null
          return (
            <CommandGroup
              key={kind}
              heading={
                !trimmed && kind === "pages" ? t("searchOpenPage") : t(label)
              }
            >
              {hits.map((hit) => (
                <ResultItem
                  key={hit.id}
                  value={hit.id}
                  hit={hit}
                  query={trimmed}
                  icon={pageIcons.get(hit.href)}
                  onSelect={open}
                />
              ))}
            </CommandGroup>
          )
        })}
        {!searching && (
          <CommandEmpty className="p-0">
            <EmptyState
              placement="inner"
              className="py-10"
              icon={<RiSearchLine />}
              title={
                trimmed.length === 1 && scope !== "pages"
                  ? t("searchMinChars")
                  : t("searchNoResults", { query: trimmed })
              }
              description={
                scope === "all" ? t("searchTryOther") : t("searchTryAll")
              }
            />
          </CommandEmpty>
        )}
      </CommandList>

      <footer className="bg-muted/40 border-border text-muted-foreground flex shrink-0 items-center gap-4 border-t px-4 py-2.5 text-xs">
        <span className="flex items-center gap-1.5">
          <KbdGroup>
            <Kbd>
              <RiArrowUpLine />
            </Kbd>
            <Kbd>
              <RiArrowDownLine />
            </Kbd>
          </KbdGroup>
          {t("searchKeySelect")}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>
            <CornerDownLeft />
          </Kbd>
          {t("searchKeyOpen")}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Tab</Kbd>
          {t("searchKeyFilter")}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd>Esc</Kbd>
          {t("searchKeyClose")}
        </span>
      </footer>
    </Command>
  )
}

function ResultItem({
  hit,
  value,
  query,
  icon: Icon,
  onSelect,
}: {
  hit: SearchHit
  value: string
  query?: string
  icon?: RemixiconComponentType
  onSelect: (hit: SearchHit) => void
}) {
  return (
    <CommandItem
      value={value}
      onSelect={() => onSelect(hit)}
      className="gap-2.5 py-2"
    >
      <HitIcon hit={hit} icon={Icon} />
      <span
        className={cn(
          "text-foreground truncate",
          hit.kind === "tasks" &&
            hit.done &&
            "text-muted-foreground line-through",
        )}
      >
        <Highlight text={hit.title} query={query} />
      </span>
      {hit.meta && (
        <span className="text-muted-foreground min-w-0 shrink truncate">
          {hit.meta}
        </span>
      )}
    </CommandItem>
  )
}

function HitIcon({
  hit,
  icon: Icon,
}: {
  hit: SearchHit
  icon?: RemixiconComponentType
}) {
  if (Icon) return <Icon className="text-muted-foreground" />
  switch (hit.kind) {
    case "projects":
      return <ProjectAvatar id={hit.projectId ?? hit.id} name={hit.title} />
    case "people":
      return (
        <Avatar className="size-5">
          <AvatarImage src={hit.avatarUrl || undefined} alt="" />
          <AvatarFallback className="text-[9px]">
            {hit.title.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )
    case "tasks":
      return hit.done ? (
        <RiCheckboxCircleLine className="text-success" />
      ) : (
        <RiCheckboxBlankCircleLine className="text-muted-foreground" />
      )
    case "files":
      return <RiFileTextLine className="text-muted-foreground" />
    case "policies":
      return <RiBookOpenLine className="text-muted-foreground" />
    default:
      return <RiTimeLine className="text-muted-foreground" />
  }
}

/** Bolds the first match, like the reference. */
function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="text-foreground bg-transparent font-semibold">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  )
}
