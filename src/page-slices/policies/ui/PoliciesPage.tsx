"use client"

import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiAddLine,
  RiFileTextLine,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import { Input } from "@/components/ui/input"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { useState } from "react"
import { format, type Locale } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  categoryLabel,
  POLICY_CATEGORIES,
  splitVersions,
  usePolicies,
  type PolicyListItem,
} from "../model/data"

// Viewer (react-markdown, history) and editor (TipTap/ProseMirror) only load
// once a rule is opened (?policy=).
const PolicyDialog = dynamic(
  () => import("./PolicyDialog").then((m) => m.PolicyDialog),
  { loading: () => null },
)
const PolicyEditorDialog = dynamic(
  () => import("./PolicyEditor").then((m) => m.PolicyEditorDialog),
  { loading: () => null },
)

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_auto_9rem]"

function categoryOrder(category: string) {
  const i = (POLICY_CATEGORIES as readonly string[]).indexOf(category)
  return i === -1 ? POLICY_CATEGORIES.length : i
}

type Tab = "all" | "published" | "draft" | "archived"

type PoliciesKey = MessageKey<"policies">

const TABS: { value: Tab; label: PoliciesKey }[] = [
  { value: "all", label: "tabAll" },
  { value: "published", label: "tabPublished" },
  { value: "draft", label: "tabDraft" },
  { value: "archived", label: "tabArchived" },
]

const EMPTY_TAB: Record<Tab, { title: PoliciesKey; description: PoliciesKey }> =
  {
    all: { title: "emptyAllTitle", description: "emptyAllDescription" },
    published: {
      title: "emptyPublishedTitle",
      description: "emptyPublishedDescription",
    },
    draft: { title: "emptyDraftTitle", description: "emptyDraftDescription" },
    archived: {
      title: "emptyArchivedTitle",
      description: "emptyArchivedDescription",
    },
  }

function matchesTab(p: PolicyListItem, tab: Tab) {
  const { latest, draft } = splitVersions(p.versions ?? [])
  if (tab === "archived") return Boolean(p.archived_at)
  if (p.archived_at) return false
  if (tab === "published") return Boolean(latest)
  if (tab === "draft") return Boolean(draft)
  return true
}

/**
 * Aturan kantor grouped by category. Stakeholders filter by status (drafts
 * open straight in the editor); employees only ever see published rules.
 */
export function PoliciesPage() {
  const t = useT("policies")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: policies = [], isLoading } = usePolicies()

  const requested = searchParams.get("status") as Tab | null
  const tab: Tab =
    isAdmin && requested && TABS.some((item) => item.value === requested)
      ? requested
      : "all"
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "all") params.delete("status")
    else params.set("status", next)
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    })
  }

  // RLS already hides drafts from employees; this also covers "view as".
  // The open rule (?policy=) shows as a modal over the list; ?edit=1 edits it.
  const openId = searchParams.get("policy")
  const editing = isAdmin && searchParams.get("edit") === "1" && Boolean(openId)
  const withParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    return params.size ? `${pathname}?${params}` : pathname
  }
  const closeModal = () =>
    router.replace(withParams({ aturan: null, v: null, edit: null }), {
      scroll: false,
    })

  const [view, setView] = useViewMode("policies", "grid")
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const shown = policies.filter(
    (p) =>
      (isAdmin ? matchesTab(p, tab) : matchesTab(p, "published")) &&
      (!needle ||
        `${titleOf(p)} ${p.summary ?? ""} ${p.category} ${categoryLabel(t, p.category)}`
          .toLowerCase()
          .includes(needle)),
  )
  const hrefFor = (p: PolicyListItem) =>
    withParams({ aturan: p.id, edit: tab === "draft" ? "1" : null, v: null })
  const categories = [...new Set(shown.map((p) => p.category))].sort(
    (a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b),
  )
  const empty = isAdmin
    ? {
        title: t(EMPTY_TAB[tab].title),
        description: t(EMPTY_TAB[tab].description),
      }
    : {
        title: t("emptyAllTitle"),
        description: t("emptyEmployeeDescription"),
      }

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
            {isAdmin && (
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={withParams({ aturan: "new", edit: "1", v: null })}
                    scroll={false}
                    prefetch={false}
                  />
                }
              >
                <RiAddLine data-icon="inline-start" />
                {t("newRule")}
              </Button>
            )}
          </>
        }
      />

      {isAdmin && (
        <TabNavigation className="mb-4">
          {TABS.map((item) => {
            const count = policies.filter((p) =>
              matchesTab(p, item.value),
            ).length
            return (
              <TabNavigationLink
                key={item.value}
                active={tab === item.value}
                onClick={() => setTab(item.value)}
                showLeadingIcon={false}
              >
                {t(item.label)}
                {count > 0 && (
                  <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                    {count}
                  </span>
                )}
              </TabNavigationLink>
            )
          })}
        </TabNavigation>
      )}

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
            title={needle ? t("noMatch", { query: query.trim() }) : empty.title}
            description={needle ? t("noMatchHint") : empty.description}
            icon={<RiFileTextLine />}
          />
        ) : view === "grid" ? (
          <div className="flex flex-col gap-8">
            {categories.map((category) => {
              const items = shown.filter((p) => p.category === category)
              return (
                <section key={category} className="flex flex-col gap-3">
                  <h2 className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="text-foreground font-medium">
                      {categoryLabel(t, category)}
                    </span>
                    <span className="tabular-nums">{items.length}</span>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) => (
                      <PolicyCard
                        key={p.id}
                        policy={p}
                        isAdmin={isAdmin}
                        href={hrefFor(p)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <GroupedList>
            {categories.map((category) => {
              const items = shown.filter((p) => p.category === category)
              return (
                <ListGroup
                  key={category}
                  label={categoryLabel(t, category)}
                  count={items.length}
                >
                  {items.map((p) => (
                    <PolicyRow
                      key={p.id}
                      policy={p}
                      isAdmin={isAdmin}
                      href={hrefFor(p)}
                    />
                  ))}
                </ListGroup>
              )
            })}
          </GroupedList>
        )}
      </div>

      {openId &&
        (editing ? (
          <PolicyEditorDialog
            key="editor"
            id={openId === "new" ? null : openId}
            onExit={({ id }) =>
              router.replace(withParams({ aturan: id, edit: null, v: null }), {
                scroll: false,
              })
            }
          />
        ) : openId !== "new" ? (
          <PolicyDialog
            key={openId}
            id={openId}
            version={searchParams.get("v")}
            onVersion={(v) =>
              router.replace(withParams({ v }), { scroll: false })
            }
            onEdit={() =>
              router.replace(withParams({ edit: "1", v: null }), {
                scroll: false,
              })
            }
            onClose={closeModal}
          />
        ) : null)}
    </div>
  )
}

function PolicyRow({
  policy,
  isAdmin,
  href,
}: {
  policy: PolicyListItem
  isAdmin: boolean
  href: string
}) {
  const t = useT("policies")
  const dateLocale = useDateLocale()
  const { latest, draft } = splitVersions(policy.versions ?? [])
  const title = titleOf(policy)
  const updated = latest?.published_at

  return (
    <ListRow className={`${ROW_GRID} min-h-14`}>
      <div className="flex min-w-0 items-center gap-3">
        <RiFileTextLine className="text-muted-foreground size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <Link
            href={href}
            scroll={false}
            prefetch={false}
            className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {title}
          </Link>
          {policy.summary && (
            <span className="text-tertiary-foreground truncate text-[13px]">
              {policy.summary}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isAdmin && draft && (
          <ListChip>{latest ? t("hasDraft") : t("draft")}</ListChip>
        )}
        {policy.archived_at && <ListChip>{t("archived")}</ListChip>}
      </div>
      <span className="text-muted-foreground hidden text-right text-[13px] tabular-nums md:block">
        {updated
          ? format(new Date(updated), "d MMM yyyy", { locale: dateLocale })
          : t("notPublished")}
      </span>
    </ListRow>
  )
}

function titleOf(policy: PolicyListItem) {
  const { latest, draft } = splitVersions(policy.versions ?? [])
  return latest?.title ?? draft?.title ?? policy.title
}

function shortDate(value: string | null, locale: Locale) {
  return value ? format(new Date(value), "d MMM yyyy", { locale }) : ""
}

function dayMonth(value: string | null, locale: Locale) {
  return value ? format(new Date(value), "d MMM", { locale }) : ""
}

/** Grid card (Cloudflare catalog style): what it is up top, when in the footer. */
function PolicyCard({
  policy,
  isAdmin,
  href,
}: {
  policy: PolicyListItem
  isAdmin: boolean
  href: string
}) {
  const t = useT("policies")
  const dateLocale = useDateLocale()
  const { latest, draft } = splitVersions(policy.versions ?? [])
  const status = policy.archived_at
    ? t("archived")
    : isAdmin && draft
      ? latest
        ? t("hasDraft")
        : t("draft")
      : null

  return (
    <Link
      data-slot="policy-card"
      href={href}
      scroll={false}
      prefetch={false}
      className="bg-card border-foreground/10 hover:border-foreground/20 focus-visible:border-primary/50 focus-visible:ring-primary/20 flex flex-col overflow-hidden rounded-xl border transition-[border-color] duration-200 outline-none focus-visible:ring-2"
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="border-border rounded-full border px-2 py-0.5 text-xs">
            {categoryLabel(t, policy.category)}
          </span>
          {status && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              {status}
            </span>
          )}
        </div>
        <span className="text-foreground truncate font-medium">
          {titleOf(policy)}
        </span>
        <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
          {policy.summary || t("noSummary")}
        </p>
      </div>
      <div className="bg-muted/40 border-border text-muted-foreground flex items-center justify-between gap-3 border-t px-5 py-3 text-[13px]">
        <span className="truncate">
          {latest
            ? t("effectiveSince", {
                date: shortDate(latest.effective_at, dateLocale),
              })
            : t("notPublished")}
        </span>
        <span className="shrink-0 tabular-nums">
          {latest
            ? t("updatedOn", {
                date: dayMonth(latest.published_at, dateLocale),
              })
            : draft
              ? t("savedOn", { date: dayMonth(draft.updated_at, dateLocale) })
              : ""}
        </span>
      </div>
    </Link>
  )
}
