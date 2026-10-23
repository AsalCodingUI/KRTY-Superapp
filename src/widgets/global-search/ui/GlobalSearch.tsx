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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  pushRecent,
  readRecent,
  useDebounced,
  useRecordSearch,
  type SearchHit,
  type SearchScope,
} from "../model/useGlobalSearch"

const SCOPES: { value: SearchScope; label: string; admin?: boolean }[] = [
  { value: "all", label: "Semua" },
  { value: "pages", label: "Halaman" },
  { value: "projects", label: "Project" },
  { value: "tasks", label: "Tugas" },
  { value: "files", label: "File" },
  { value: "policies", label: "Aturan" },
  { value: "people", label: "Orang", admin: true },
]

const GROUPS: { kind: SearchHit["kind"]; label: string }[] = [
  { kind: "pages", label: "Halaman" },
  { kind: "projects", label: "Project" },
  { kind: "tasks", label: "Tugas" },
  { kind: "files", label: "File & dokumen" },
  { kind: "policies", label: "Aturan" },
  { kind: "people", label: "Orang" },
]

/** Extra words people type for a page, matched on its href. */
const PAGE_KEYWORDS: [string, string][] = [
  ["/performance", "kpi nilai skor rating penilaian"],
  ["/performance/360-review", "rekan feedback"],
  ["/performance/one-on-one", "meeting 1on1"],
  ["/leave", "cuti izin absen absensi kehadiran clock attendance"],
  ["/calendar", "jadwal kalender agenda"],
  ["/teams", "karyawan anggota tim direktori orang"],
  ["/projects", "proyek klien client"],
  ["/notifications", "notif pemberitahuan"],
  ["/policies", "aturan kebijakan peraturan handbook sop"],
]

function pageKeywords(href: string) {
  return PAGE_KEYWORDS.filter(([h]) => href === h || href.startsWith(`${h}/`))
    .map(([, k]) => k)
    .join(" ")
}

/** Opens with ⌘K / Ctrl+K from anywhere, or from the top bar field. */
export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent))
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className={cn(
          "text-muted-foreground hover:text-foreground flex h-8 w-full items-center gap-2 rounded-lg bg-white/[0.07] px-2.5 text-sm transition-colors hover:bg-white/10",
          className,
        )}
      >
        <RiSearchLine className="size-4" />
        <span>Cari</span>
        <KbdGroup className="ml-auto">
          <Kbd className="bg-white/10">{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd className="bg-white/10">K</Kbd>
        </KbdGroup>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Cari"
        description="Cari halaman, project, tugas, file, atau orang."
      >
        {open && <SearchPanel onClose={() => setOpen(false)} />}
      </CommandDialog>
    </>
  )
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { visible } = useWorkspaceNav()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<SearchScope>("all")
  const [recent] = useState(readRecent)
  const debounced = useDebounced(query)
  const trimmed = query.trim()

  const scopes = SCOPES.filter((s) => !s.admin || isAdmin)
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
        add({ title: item.name, meta: ws.name, href: item.href }, item.icon)
        for (const child of item.children ?? []) {
          if (child.can && !(profile && child.can(profile))) continue
          add(
            { title: child.name, meta: item.name, href: child.href },
            item.icon,
          )
        }
      }
    }
    add(
      { title: "Notifikasi", meta: "Akun", href: "/notifications" },
      RiNotification3Line,
    )
    return { pages: out, pageIcons: icons }
  }, [visible, profile])

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

  const showRecent = !trimmed && scope === "all" && recent.length > 0
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
        placeholder="Cari halaman, project, tugas, file…"
        trailing={
          <>
            {searching && <Spinner className="text-muted-foreground size-4" />}
            {query && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Hapus pencarian"
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
          <CommandGroup heading="Terakhir dibuka">
            {recent.map((hit) => (
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
              heading={!trimmed && kind === "pages" ? "Buka halaman" : label}
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
                  ? "Ketik minimal 2 huruf"
                  : `Tidak ada hasil untuk “${trimmed}”`
              }
              description={
                scope === "all"
                  ? "Coba kata lain, atau cek ejaannya."
                  : "Coba kata lain, atau cari di Semua."
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
          Pilih
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>
            <CornerDownLeft />
          </Kbd>
          Buka
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Tab</Kbd>
          Filter
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Kbd>Esc</Kbd>
          Tutup
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
