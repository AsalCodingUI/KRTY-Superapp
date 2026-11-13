"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { MarkdownDocEditor } from "@/page-slices/policies/ui/doc-editor-lazy"
import { PageLinkContext } from "@/page-slices/policies/ui/page-link-context"
import {
  uploadDocFile,
  uploadReportImage,
} from "@/page-slices/projects/ui/workspace/reports-data"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiAddLine,
  RiBookClosedLine,
  RiDeleteBinLine,
  RiMoreFill,
  RiTableLine,
} from "@/shared/ui/lucide-icons"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  WIKI_FILES_FOLDER,
  canEditPage,
  childrenOf,
  newPropId,
  rememberPage,
  trailOf,
  useWikiPage,
  useWikiPages,
  useWikiWriter,
  wikiHref,
  wikiIdOf,
  type WikiPage,
  type WikiPatch,
} from "../model/data"
import { PageHead } from "./PageHead"
import { WikiCrumbs } from "./WikiCrumbs"
import { useWikiPageLinks } from "./WikiPageLink"
import { RowProps, WikiDatabase } from "./WikiDatabase"
import { WikiPageRows } from "./WikiPageRows"
import { WikiShare } from "./WikiShare"
import { Lock } from "@/components/icons"

/** Typing pauses this long before the page saves itself. */
const AUTOSAVE_MS = 800

/**
 * One wiki page: its title and body edited in place (saved as you type, for
 * everyone), its subpages under it. ← goes to the parent page.
 */
export function WikiPageView({ id: param }: { id: string }) {
  const t = useT("wiki")
  const list = useWikiPages()
  const pages = useMemo(() => list.data ?? [], [list.data])
  // The address: "<slug>-<8 of the id>", or a full id (older links).
  const id = wikiIdOf(param, pages)
  const { data: page, isLoading, isError } = useWikiPage(id ?? "", Boolean(id))

  if (list.isLoading || (id && isLoading))
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (isError || list.isError || !page)
    return (
      <EmptyState
        icon={<RiBookClosedLine className="size-5" />}
        title={isError || list.isError ? t("loadFailed") : t("notFound")}
      />
    )
  // Keyed: another page starts from its own saved text.
  return <WikiPageEditor key={page.id} page={page} pages={pages} />
}

function WikiPageEditor({
  page,
  pages,
}: {
  page: WikiPage
  pages: ReturnType<typeof useWikiPages>["data"] & object
}) {
  const t = useT("wiki")
  const tc = useT("common")
  const locale = useDateLocale()
  const router = useRouter()
  const writer = useWikiWriter()
  const [title, setTitle] = useState(page.title)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // What's not saved yet, saved after a pause or when leaving.
  const pending = useRef<{ title?: string; body?: string }>({})
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const patch = pending.current
    if (patch.title === undefined && patch.body === undefined) return
    pending.current = {}
    setSaving(true)
    try {
      await writer.save(page.id, patch)
    } catch {
      toast.error(t("saveFailed"))
    } finally {
      setSaving(false)
    }
    // writer is a new object each render; its functions don't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, t])
  const queue = (patch: { title?: string; body?: string }) => {
    pending.current = { ...pending.current, ...patch }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS)
  }
  // Leaving the page (or the app) saves what's left.
  const flushRef = useRef(flush)
  flushRef.current = flush
  useEffect(() => {
    const save = () => void flushRef.current()
    window.addEventListener("beforeunload", save)
    return () => {
      window.removeEventListener("beforeunload", save)
      save()
    }
  }, [])

  const trail = useMemo(() => trailOf(pages, page.id), [pages, page.id])
  const parent = trail.length > 1 ? trail[trail.length - 2] : null
  const subpages = useMemo(() => childrenOf(pages, page.id), [pages, page.id])
  const under = useMemo(() => {
    const ids = new Set([page.id])
    let grew = true
    while (grew) {
      grew = false
      for (const p of pages)
        if (p.parent_id && ids.has(p.parent_id) && !ids.has(p.id)) {
          ids.add(p.id)
          grew = true
        }
    }
    return ids.size - 1
  }, [pages, page.id])

  // The list's copy is fresher (someone else's edit comes in there).
  const meta = pages.find((p) => p.id === page.id) ?? page
  const edited = formatDistanceToNow(new Date(meta.updated_at), {
    addSuffix: true,
    locale,
  })

  // Locked, or shared with the viewer to read only: nothing edits here.
  const editable = canEditPage(meta)
  const canManage = meta.access === "edit"
  const toggleLock = () =>
    void flush()
      .then(() => writer.setLocked(page.id, !meta.locked))
      .catch(() => toast.error(t("lockFailed")))

  const isDatabase = meta.kind === "database"
  // A row of a database: its properties under the title.
  const database = parent?.kind === "database" ? parent : null
  const saveNow = (patch: WikiPatch) =>
    void writer.save(page.id, patch).catch(() => toast.error(t("saveFailed")))

  const createSubpage = async (kind: "page" | "database" = "page") => {
    setCreating(true)
    try {
      await flush()
      router.push(
        wikiHref(
          await writer.create(
            page.id,
            kind === "database"
              ? {
                  kind,
                  schema: [
                    { id: newPropId(), name: t("propText"), type: "text" },
                  ],
                }
              : {},
          ),
        ),
      )
    } catch {
      toast.error(t("createFailed"))
      setCreating(false)
    }
  }

  const pageLinks = useWikiPageLinks(pages)

  // Home's "Baru dibuka".
  useEffect(() => rememberPage(page.id), [page.id])
  // The readable address (an older full-id link, or a new title): swapped
  // in place, no navigation (the editor stays as it is).
  const href = wikiHref({ id: page.id, title: meta.title })
  useEffect(() => {
    if (window.location.pathname !== href)
      window.history.replaceState(window.history.state, "", href)
  }, [href])

  const name = title.trim() || t("untitled")
  // The tab is named after the page (as it's typed).
  useBreadcrumbs([{ label: name }])

  return (
    <div className="flex flex-col">
      <PageHeader
        // Stays on top while the page scrolls (a solid bar, no blur: the
        // sheet's own fill), the breadcrumb in it as Notion's.
        className="dark:bg-surface bg-background sticky -top-3 z-20 mx-[calc(var(--page-gutter)*-1)] -mt-3 px-(--page-gutter) pt-3"
        title={
          <WikiCrumbs
            trail={trail.slice(0, -1)}
            current={{ icon: meta.icon, kind: meta.kind, title: name }}
          />
        }
        actions={
          <>
            {meta.locked && (
              <span className="text-muted-foreground text-meta flex items-center gap-1.5">
                <Lock className="size-3.5" />
                {t("locked")}
              </span>
            )}
            {!canManage && (
              <span className="text-muted-foreground text-meta">
                {t("viewOnly")}
              </span>
            )}
            <WikiShare page={meta} pages={pages} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("more")}
                    className={canManage ? "text-muted-foreground" : "hidden"}
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onClick={toggleLock}>
                  <Lock />
                  {meta.locked ? t("unlock") : t("lock")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!editable}
                  onClick={() => void createSubpage("database")}
                >
                  <RiTableLine />
                  {t("newDatabase")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!editable}
                  onClick={() => setDeleting(true)}
                >
                  <RiDeleteBinLine />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              onClick={() => void createSubpage()}
              disabled={creating}
              // A database adds rows from its table (+ Baru).
              className={isDatabase || !editable ? "hidden" : undefined}
            >
              {creating ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RiAddLine data-icon="inline-start" />
              )}
              {t("newSubpage")}
            </Button>
          </>
        }
      />

      <div className="flex w-full flex-col pb-24">
        <PageHead
          icon={meta.icon}
          cover={meta.cover}
          kind={meta.kind}
          onChange={saveNow}
          readOnly={!editable}
        >
          <textarea
            rows={1}
            maxLength={200}
            autoFocus={!page.title && editable}
            readOnly={!editable}
            placeholder={t("titlePlaceholder")}
            aria-label={t("titlePlaceholder")}
            value={title}
            onChange={(e) => {
              const next = e.target.value.replace(/\n/g, " ")
              setTitle(next)
              queue({ title: next })
            }}
            onKeyDown={(e) => {
              // Enter: on to the body.
              if (e.key === "Enter") {
                e.preventDefault()
                document
                  .querySelector<HTMLElement>("[data-wiki-body] .ProseMirror")
                  ?.focus()
              }
            }}
            className="text-heading placeholder:text-tertiary-foreground field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-4xl leading-tight font-medium tracking-tight shadow-none outline-none focus:ring-0"
          />
          <p className="text-muted-foreground text-meta mt-3">
            {saving
              ? t("saving")
              : meta.updated_by_name
                ? t("editedBy", { time: edited, name: meta.updated_by_name })
                : t("edited", { time: edited })}
          </p>
          {database && (
            <RowProps db={database} row={meta} readOnly={!editable} />
          )}
        </PageHead>

        {isDatabase ? (
          // The table is wider than the text column, as in Notion.
          <div className="mx-auto mt-6 w-full max-w-5xl px-6 sm:px-16">
            <WikiDatabase db={meta} pages={pages} readOnly={!editable} />
          </div>
        ) : (
          <div data-wiki-body className="mt-6">
            {/* Links to pages read as chips, databases as tables. */}
            <PageLinkContext.Provider value={pageLinks}>
              <MarkdownDocEditor
                // Its extensions are set at start: locking or unlocking
                // starts it again (from the saved text: toggleLock flushes).
                key={editable ? "edit" : "read"}
                value={page.body}
                ariaLabel={t("bodyLabel")}
                readOnly={!editable}
                onChange={(markdown) => queue({ body: markdown })}
                onBlur={() => void flush()}
                // Pictures and files in the wiki's own folder (public links,
                // like the rules').
                onUploadImage={(file, original) =>
                  uploadReportImage(WIKI_FILES_FOLDER, file, original)
                }
                onUploadFile={(file) => uploadDocFile(WIKI_FILES_FOLDER, file)}
                columns
                toolbar={false}
              />
            </PageLinkContext.Provider>
          </div>
        )}

        {!isDatabase && subpages.length > 0 && (
          <section className="mx-auto mt-4 flex w-full max-w-3xl flex-col gap-2 px-6 sm:px-16">
            <h2 className="text-muted-foreground text-meta font-medium">
              {t("subpages")}
            </h2>
            <WikiPageRows pages={pages} parentId={page.id} />
          </section>
        )}
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteTitle", { name })}
        description={
          under > 0
            ? t("deleteDescChildren", { count: under })
            : t("deleteDesc")
        }
        confirmText={t("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          setDeleting(false)
          clearTimeout(timer.current)
          pending.current = {}
          try {
            await writer.remove(page.id)
            router.push(parent ? wikiHref(parent) : "/wiki")
          } catch {
            toast.error(t("deleteFailed"))
          }
        }}
      />
    </div>
  )
}
