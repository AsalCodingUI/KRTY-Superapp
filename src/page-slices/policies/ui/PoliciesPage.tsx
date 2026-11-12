"use client"

import {
  deletePolicy,
  setPolicyArchived,
} from "@/app/(main)/policies/actions/policy-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SectionTitle } from "@/components/section-title"
import { EmptyState } from "@/components/empty-state"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  ArchiveRestore,
  Copy,
  Pencil,
  Trash2,
} from "@/components/icons"
import { toast } from "sonner"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCanonicalParam } from "@/shared/hooks/useCanonicalParam"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiAddLine,
  RiFileTextLine,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { useState } from "react"
import { format, type Locale } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import dynamic from "next/dynamic"
import { ParamLink } from "@/components/param-link"
import { replaceUrl } from "@/shared/lib/url-params"
import { usePathname, useSearchParams } from "next/navigation"
import {
  categoryLabel,
  POLICY_CATEGORIES,
  policyKeys,
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    replaceUrl(params.size ? `${pathname}?${params}` : pathname)
  }

  // RLS already hides drafts from employees; this also covers "view as".
  // The open rule (?policy=) shows as a modal over the list; ?edit=1 edits it.
  // Links carry the rule's slug (?policy=aturan-cuti); ids from older links
  // and notifications still open it, and are swapped for the slug.
  const openParam = searchParams.get("policy")
  const openPolicy = policies.find(
    (p) => p.slug === openParam || p.id === openParam,
  )
  const openId =
    openParam === "new" || (openParam && UUID.test(openParam))
      ? openParam
      : (openPolicy?.id ?? null)
  const editing = isAdmin && searchParams.get("edit") === "1" && Boolean(openId)
  const withParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    return params.size ? `${pathname}?${params}` : pathname
  }
  const slugOf = (id: string | null) =>
    id && (policies.find((p) => p.id === id)?.slug ?? id)
  useCanonicalParam("policy", openParam, openPolicy?.slug)
  const closeModal = () =>
    replaceUrl(withParams({ policy: null, v: null, edit: null }))

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
    withParams({ policy: p.slug, edit: tab === "draft" ? "1" : null, v: null })

  const tc = useT("common")
  const tm = useT("ctxmenu")
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<PolicyListItem | null>(null)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: policyKeys.all })
  /**
   * Right-click on a rule (Buka / tab baru / Salin link come from its
   * href): copy the title; stakeholders also edit, archive, delete — the
   * rule dialog's own actions.
   */
  const policyItems = (p: PolicyListItem): CtxItem[] => {
    const { latest, draft } = splitVersions(p.versions ?? [])
    const items: (CtxItem & { hidden?: boolean })[] = [
      {
        id: "copy-title",
        label: t("ctxCopyTitle"),
        icon: Copy,
        onSelect: async () => {
          if (await copyText(titleOf(p))) toast.success(tm("copied"))
          else toast.error(tm("copyFailed"))
        },
      },
      {
        id: "edit",
        label: draft ? t("continueDraft") : tc("edit"),
        icon: Pencil,
        hidden: !isAdmin,
        onSelect: () =>
          replaceUrl(withParams({ policy: p.slug, edit: "1", v: null }), true),
      },
      {
        id: "archive",
        label: p.archived_at ? t("restore") : t("archive"),
        icon: p.archived_at ? ArchiveRestore : Archive,
        // Only published rules are archived (as in the rule's ⋯ menu).
        hidden: !isAdmin || !latest,
        onSelect: async () => {
          const archived = !p.archived_at
          const result = await setPolicyArchived(p.id, archived)
          if (!result.success) return void toast.error(result.error)
          toast.success(archived ? t("ruleArchived") : t("ruleRestored"))
          await refresh()
        },
      },
      {
        id: "delete",
        label: t("deleteRule"),
        icon: Trash2,
        destructive: true,
        hidden: !isAdmin,
        // The dialog asks first.
        onSelect: () => setDeleting(p),
      },
    ]
    return items.filter((item) => !item.hidden)
  }
  const target = (
    p: PolicyListItem,
    child: React.ReactElement<Record<string, unknown>>,
  ) => (
    <ContextTarget
      key={p.id}
      type="policy"
      id={p.id}
      label={titleOf(p)}
      href={hrefFor(p)}
      items={() => policyItems(p)}
    >
      {child}
    </ContextTarget>
  )
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
        title={t("titleWithUpdates")}
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
                  <ParamLink
                    href={withParams({ policy: "new", edit: "1", v: null })}
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
                count={count}
                showLeadingIcon={false}
              >
                {t(item.label)}
              </TabNavigationLink>
            )
          })}
        </TabNavigation>
      )}

      <InputGroup className="mb-4 w-full sm:max-w-sm">
        <InputGroupAddon>
          <RiSearchLine />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div>
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
          <div className="gap-section flex flex-col">
            {categories.map((category) => {
              const items = shown.filter((p) => p.category === category)
              return (
                <section key={category} className="flex flex-col">
                  <SectionTitle extra={items.length} className="pt-0">
                    {categoryLabel(t, category)}
                  </SectionTitle>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) =>
                      target(
                        p,
                        <PolicyCard
                          policy={p}
                          isAdmin={isAdmin}
                          href={hrefFor(p)}
                        />,
                      ),
                    )}
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
                  {items.map((p) =>
                    target(
                      p,
                      <PolicyRow
                        policy={p}
                        isAdmin={isAdmin}
                        href={hrefFor(p)}
                      />,
                    ),
                  )}
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
              replaceUrl(
                withParams({ policy: slugOf(id), edit: null, v: null }),
              )
            }
          />
        ) : openId !== "new" ? (
          <PolicyDialog
            key={openId}
            id={openId}
            version={searchParams.get("v")}
            onVersion={(v) => replaceUrl(withParams({ v }))}
            onEdit={() => replaceUrl(withParams({ edit: "1", v: null }))}
            onClose={closeModal}
          />
        ) : null)}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        confirmText={t("deletePermanently")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          const result = await deletePolicy(deleting.id)
          if (!result.success) return void toast.error(result.error)
          toast.success(t("ruleDeleted"))
          if (openId === deleting.id) closeModal()
          setDeleting(null)
          await refresh()
        }}
      />
    </div>
  )
}

function PolicyRow({
  policy,
  isAdmin,
  href,
  ...rest
}: {
  policy: PolicyListItem
  isAdmin: boolean
  href: string
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("policies")
  const dateLocale = useDateLocale()
  const { latest, draft } = splitVersions(policy.versions ?? [])
  const title = titleOf(policy)
  const updated = latest?.published_at

  return (
    <ListRow {...rest} desc className={ROW_GRID}>
      <div className="flex min-w-0 items-center gap-3">
        <RiFileTextLine className="text-muted-foreground size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <ParamLink
            href={href}
            className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {title}
          </ParamLink>
          {policy.summary && (
            <span className="text-tertiary-foreground text-meta truncate">
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
      <span className="text-muted-foreground text-meta hidden text-right tabular-nums md:block">
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

/** Unpublished changes want a look; a draft or an archived policy is
 *  neutral. */
const POLICY_STATUS_VARIANT = {
  draft: "secondary",
  hasDraft: "warning",
  archived: "secondary",
} as const

/** Grid card: title, summary, then when it took effect (the section names its category). */
function PolicyCard({
  policy,
  isAdmin,
  href,
  ...rest
}: {
  policy: PolicyListItem
  isAdmin: boolean
  href: string
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("policies")
  const dateLocale = useDateLocale()
  const { latest, draft } = splitVersions(policy.versions ?? [])
  const status = policy.archived_at
    ? "archived"
    : isAdmin && draft
      ? latest
        ? "hasDraft"
        : "draft"
      : null

  return (
    <ParamLink
      {...rest}
      data-slot="policy-card"
      href={href}
      className="bg-card border-field-border hover:border-field-border focus-visible:border-primary/50 focus-visible:ring-focus-ring rounded-card flex flex-col gap-1.5 border p-5 transition-[border-color] duration-200 outline-none focus-visible:ring-2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="text-foreground truncate font-medium">
          {titleOf(policy)}
        </span>
        {status && (
          <Badge variant={POLICY_STATUS_VARIANT[status]}>{t(status)}</Badge>
        )}
      </span>
      <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
        {policy.summary || t("noSummary")}
      </p>
      {/* One quiet line: when it took effect, when it last changed. */}
      <span className="text-tertiary-foreground text-meta mt-2 flex items-center justify-between gap-3 tabular-nums">
        <span className="truncate">
          {latest
            ? t("effectiveSince", {
                date: shortDate(latest.effective_at, dateLocale),
              })
            : t("notPublished")}
        </span>
        <span className="shrink-0">
          {latest
            ? t("updatedOn", {
                date: dayMonth(latest.published_at, dateLocale),
              })
            : draft
              ? t("savedOn", { date: dayMonth(draft.updated_at, dateLocale) })
              : ""}
        </span>
      </span>
    </ParamLink>
  )
}
