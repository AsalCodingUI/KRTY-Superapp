"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListChip, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCanonicalParam } from "@/shared/hooks/useCanonicalParam"
import { findByLinkKey, linkKey, projectHref } from "@/shared/lib/url-params"
import {
  setClientArchived,
  deleteClient,
} from "@/app/(main)/clients/actions/client-actions"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { waNumber } from "@/shared/context-menu/detect"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { ProjectStatusIcon } from "@/page-slices/projects/ui/ProjectStatusIcon"
import type { ProjectStatus } from "@/page-slices/projects/lib/status"
import {
  Archive,
  ArchiveRestore,
  Copy,
  FolderKanban,
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { rupiah } from "@/entities/finance/lib/money"
import { useFxRates } from "@/entities/finance/model/useFxRates"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import { accessLevel, type AccessLevel } from "@/shared/config/access"
import {
  RiAddLine,
  RiBuildingLine,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { clientKeys, useClients, type ClientRow } from "../model/data"
import { summarize } from "../model/summary"
import { ClientDialog } from "./ClientDialog"
import { ClientFormDialog } from "./ClientFormDialog"

type Tab = "active" | "archived"

const NO_RATES: Record<string, number> = {}

const inTab = (c: ClientRow, value: Tab) =>
  value === "archived" ? Boolean(c.archived_at) : !c.archived_at

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_6rem_9rem]"

/**
 * The client book (PMs and stakeholders): who we work for and what each
 * brought in. PMs add, edit and archive; deleting stays with stakeholders.
 */
export function ClientsPage() {
  const t = useT("clients")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile, loading: profileLoading } = useUserProfile()
  // Stakeholders; PMs manage clients too, but don't delete them.
  const isAdmin = canManageByRole(profile?.role)
  const canEdit = isAdmin || accessLevel(profile) === "pm"
  const { data: clients = [], isLoading } = useClients(canEdit)
  const { data: rates = NO_RATES } = useFxRates()

  const tab: Tab =
    searchParams.get("status") === "archived" ? "archived" : "active"
  const openId = searchParams.get("client")
  const withParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    return params.size ? `${pathname}?${params}` : pathname
  }
  const go = (patch: Record<string, string | null>) =>
    router.replace(withParams(patch), { scroll: false })

  const [view, setView] = useViewMode("clients", "grid")
  const [query, setQuery] = useState("")
  // null: closed; "new": add; otherwise the client being edited.
  const [form, setForm] = useState<ClientRow | "new" | null>(null)
  const [deleting, setDeleting] = useState<ClientRow | null>(null)
  const queryClient = useQueryClient()
  const tm = useT("ctxmenu")
  const tp = useT("projects")
  const needle = query.trim().toLowerCase()

  const shown = useMemo(
    () =>
      clients.filter(
        (c) =>
          inTab(c, tab) &&
          (!needle ||
            [c.name, c.contact_name, c.email, c.country]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(needle)),
      ),
    [clients, tab, needle],
  )
  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { active: 0, archived: 0 }
    for (const c of clients)
      counts[inTab(c, "archived") ? "archived" : "active"]++
    return counts
  }, [clients])
  const open = findByLinkKey(clients, openId)
  useCanonicalParam("client", openId, open && linkKey(open.name, open.id))

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: clientKeys.all })
  const copy = async (text: string) => {
    if (await copyText(text)) toast.success(tm("copied"))
    else toast.error(tm("copyFailed"))
  }
  /**
   * Right-click on a card or row (Buka / tab baru / Salin link come from
   * its href): projects, reach the contact, edit, archive, delete — the
   * same actions as the client's dialog.
   */
  const clientItems = (c: ClientRow): CtxItem[] => {
    const statusIcon = (status: ProjectStatus) =>
      function StatusIcon({ className }: { className?: string }) {
        return <ProjectStatusIcon status={status} className={className} />
      }
    const projects = [...c.projects].sort((a, b) =>
      b.end_date.localeCompare(a.end_date),
    )
    const contact = [c.contact_name, c.email, c.phone]
      .filter(Boolean)
      .join("\n")
    const website =
      c.website &&
      (/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`)
    const items: CtxItem[] = [
      {
        id: "projects",
        label: t("ctxProjects"),
        icon: FolderKanban,
        hint: String(projects.length),
        disabled: projects.length === 0,
        submenu: projects.map((p) => ({
          id: p.id,
          label: p.name,
          icon: statusIcon(p.status),
          hint: tp(STATUS_LABEL_KEYS[p.status]),
          onSelect: () => router.push(projectHref(p)),
        })),
      },
      {
        id: "copy-contact",
        label: t("ctxCopyContact"),
        icon: Copy,
        hidden: !contact,
        onSelect: () => copy(contact),
      },
      {
        id: "email",
        label: tm("sendEmail"),
        icon: Mail,
        hint: c.email ?? undefined,
        hidden: !c.email,
        onSelect: () => {
          window.location.href = `mailto:${c.email}`
        },
      },
      {
        id: "whatsapp",
        label: tm("whatsapp"),
        icon: MessageCircle,
        hidden: !c.phone,
        onSelect: () =>
          void window.open(
            `https://wa.me/${waNumber(c.phone ?? "")}`,
            "_blank",
            "noopener",
          ),
      },
      {
        id: "call",
        label: tm("call"),
        icon: Phone,
        hint: c.phone ?? undefined,
        hidden: !c.phone,
        onSelect: () => {
          window.location.href = `tel:${c.phone}`
        },
      },
      {
        id: "website",
        label: t("ctxOpenWebsite"),
        icon: Globe,
        hidden: !website,
        onSelect: () => void window.open(website || "", "_blank", "noopener"),
      },
      {
        id: "edit",
        label: t("edit"),
        icon: Pencil,
        onSelect: () => setForm(c),
      },
      {
        id: "archive",
        label: c.archived_at ? t("restore") : t("archive"),
        icon: c.archived_at ? ArchiveRestore : Archive,
        onSelect: async () => {
          const result = await setClientArchived(c.id, !c.archived_at)
          if (!result.success) return void toast.error(result.error)
          toast.success(c.archived_at ? t("restored") : t("archivedToast"))
          refresh()
        },
      },
      {
        id: "delete",
        label: t("delete"),
        icon: Trash2,
        destructive: true,
        // The dialog asks first.
        onSelect: () => setDeleting(c),
      },
    ]
    return items
      .filter((item) => !item.hidden)
      .map((item) => ({
        ...item,
        access:
          item.id === "delete"
            ? (["stakeholder"] as AccessLevel[])
            : (["pm", "stakeholder"] as AccessLevel[]),
      }))
  }
  const target = (
    c: ClientRow,
    child: React.ReactElement<Record<string, unknown>>,
  ) => (
    <ContextTarget
      key={c.id}
      type="client"
      id={c.id}
      label={c.name}
      href={withParams({ client: linkKey(c.name, c.id) })}
      items={() => clientItems(c)}
    >
      {child}
    </ContextTarget>
  )

  if (profileLoading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!canEdit)
    return (
      <EmptyState
        className="py-16"
        title={t("noAccessTitle")}
        description={t("noAccessDescription")}
        icon={<RiBuildingLine />}
      />
    )

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("title")}
        actions={
          <>
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["grid", "list"]}
            />
            <Button onClick={() => setForm("new")}>
              <RiAddLine data-icon="inline-start" />
              {t("newClient")}
            </Button>
          </>
        }
      />

      <TabNavigation className="mb-4">
        {(["active", "archived"] as const).map((value) => {
          const count = tabCounts[value]
          return (
            <TabNavigationLink
              key={value}
              active={tab === value}
              onClick={() => go({ status: value === "active" ? null : value })}
              showLeadingIcon={false}
            >
              {value === "active" ? t("tabActive") : t("tabArchived")}
              {count > 0 && (
                <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                  {count}
                </span>
              )}
            </TabNavigationLink>
          )
        })}
      </TabNavigation>

      <div className="relative mb-4 w-full sm:max-w-sm">
        <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="pb-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            title={
              needle
                ? t("noMatch", { query: query.trim() })
                : tab === "archived"
                  ? t("emptyArchivedTitle")
                  : t("emptyTitle")
            }
            description={
              needle
                ? t("noMatchHint")
                : tab === "archived"
                  ? t("emptyArchivedDescription")
                  : t("emptyDescription")
            }
            icon={<RiBuildingLine />}
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) =>
              target(
                c,
                <ClientCard
                  client={c}
                  href={withParams({ client: linkKey(c.name, c.id) })}
                  rates={rates}
                />,
              ),
            )}
          </div>
        ) : (
          <GroupedList>
            {shown.map((c) =>
              target(
                c,
                <ClientListRow
                  client={c}
                  href={withParams({ client: linkKey(c.name, c.id) })}
                  rates={rates}
                />,
              ),
            )}
          </GroupedList>
        )}
      </div>

      {open && (
        <ClientDialog
          key={open.id}
          client={open}
          rates={rates}
          onEdit={() => setForm(open)}
          canDelete={isAdmin}
          onClose={() => go({ client: null })}
        />
      )}
      <ClientFormDialog
        client={form === "new" ? null : form}
        open={form !== null}
        onOpenChange={(next) => !next && setForm(null)}
        onSaved={(id) => form === "new" && go({ client: id, status: null })}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={t("deleteTitle", { name: deleting?.name ?? "" })}
        description={t("deleteDescription")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          const result = await deleteClient(deleting.id)
          if (!result.success) return void toast.error(result.error)
          toast.success(t("deleted"))
          refresh()
          queryClient.invalidateQueries({ queryKey: ["projects"] })
          if (open?.id === deleting.id) go({ client: null })
          setDeleting(null)
        }}
      />
    </div>
  )
}

function ClientCard({
  client,
  href,
  rates,
  ...rest
}: {
  client: ClientRow
  href: string
  rates: Record<string, number>
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("clients")
  const sum = useMemo(() => summarize(client, rates), [client, rates])

  return (
    <Link
      {...rest}
      data-slot="client-card"
      href={href}
      scroll={false}
      prefetch={false}
      className="bg-card border-foreground/10 hover:border-foreground/20 focus-visible:border-primary/50 focus-visible:ring-primary/20 flex flex-col overflow-hidden rounded-xl border transition-[border-color] duration-200 outline-none focus-visible:ring-2"
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="border-border rounded-full border px-2 py-0.5 text-xs">
            {client.currency}
          </span>
          {client.country && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              {client.country}
            </span>
          )}
        </div>
        <span className="text-foreground truncate font-medium">
          {client.name}
        </span>
        <p className="text-muted-foreground truncate text-sm">
          {[client.contact_name, client.email].filter(Boolean).join(" · ") ||
            t("noContact")}
        </p>
      </div>
      <div className="bg-muted/40 border-border text-muted-foreground flex items-center justify-between gap-3 border-t px-5 py-3 text-[13px]">
        <span className="truncate">
          {t("projectCount", { n: sum.projects })}
          {sum.running > 0 && ` · ${t("runningCount", { n: sum.running })}`}
        </span>
        <span className="shrink-0 tabular-nums">{rupiah(sum.received)}</span>
      </div>
    </Link>
  )
}

function ClientListRow({
  client,
  href,
  rates,
  ...rest
}: {
  client: ClientRow
  href: string
  rates: Record<string, number>
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("clients")
  const sum = useMemo(() => summarize(client, rates), [client, rates])

  return (
    <ListRow {...rest} className={`${ROW_GRID} min-h-14`}>
      <div className="flex min-w-0 items-center gap-3">
        <RiBuildingLine className="text-muted-foreground size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <Link
            href={href}
            scroll={false}
            prefetch={false}
            className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {client.name}
          </Link>
          <span className="text-tertiary-foreground truncate text-[13px]">
            {[client.contact_name, client.email].filter(Boolean).join(" · ") ||
              t("noContact")}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <ListChip>{client.currency}</ListChip>
        <span className="text-muted-foreground text-[13px] tabular-nums">
          {sum.projects}
        </span>
      </div>
      <span className="text-muted-foreground hidden text-right text-[13px] tabular-nums md:block">
        {rupiah(sum.received)}
      </span>
    </ListRow>
  )
}
