"use client"

import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListChip, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { rupiah } from "@/entities/finance/lib/money"
import { useFxRates } from "@/entities/finance/model/useFxRates"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiAddLine,
  RiBuildingLine,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useClients, type ClientRow } from "../model/data"
import { summarize } from "../model/summary"
import { ClientDialog } from "./ClientDialog"
import { ClientFormDialog } from "./ClientFormDialog"

type Tab = "active" | "archived"

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_6rem_9rem]"

/** Stakeholders' client book: who we work for and what each brought in. */
export function ClientsPage() {
  const t = useT("clients")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile, loading: profileLoading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: clients = [], isLoading } = useClients(isAdmin)
  const { data: rates = {} } = useFxRates()

  const tab: Tab =
    searchParams.get("status") === "archived" ? "archived" : "active"
  const openId = searchParams.get("klien")
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
  const needle = query.trim().toLowerCase()

  const inTab = (c: ClientRow, value: Tab) =>
    value === "archived" ? Boolean(c.archived_at) : !c.archived_at
  const shown = clients.filter(
    (c) =>
      inTab(c, tab) &&
      (!needle ||
        [c.name, c.contact_name, c.email, c.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)),
  )
  const open = openId ? clients.find((c) => c.id === openId) : undefined

  if (profileLoading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!isAdmin)
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
          const count = clients.filter((c) => inTab(c, value)).length
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
            {shown.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                href={withParams({ klien: c.id })}
                rates={rates}
              />
            ))}
          </div>
        ) : (
          <GroupedList>
            {shown.map((c) => (
              <ClientListRow
                key={c.id}
                client={c}
                href={withParams({ klien: c.id })}
                rates={rates}
              />
            ))}
          </GroupedList>
        )}
      </div>

      {open && (
        <ClientDialog
          key={open.id}
          client={open}
          rates={rates}
          onEdit={() => setForm(open)}
          onClose={() => go({ klien: null })}
        />
      )}
      <ClientFormDialog
        client={form === "new" ? null : form}
        open={form !== null}
        onOpenChange={(next) => !next && setForm(null)}
        onSaved={(id) => form === "new" && go({ klien: id, status: null })}
      />
    </div>
  )
}

function ClientCard({
  client,
  href,
  rates,
}: {
  client: ClientRow
  href: string
  rates: Record<string, number>
}) {
  const t = useT("clients")
  const sum = summarize(client, rates)

  return (
    <Link
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
}: {
  client: ClientRow
  href: string
  rates: Record<string, number>
}) {
  const t = useT("clients")
  const sum = summarize(client, rates)

  return (
    <ListRow className={`${ROW_GRID} min-h-14`}>
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
