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
  childrenOf,
  newPropId,
  rememberPage,
  trailOf,
  useWikiPage,
  useWikiPages,
  useWikiWriter,
  wikiHref,
  type WikiPage,
  type WikiPatch,
} from "../model/data"
import { PageHead } from "./PageHead"
import { WikiCrumbs } from "./WikiCrumbs"
import { RowProps, WikiDatabase } from "./WikiDatabase"
import { WikiPageRows } from "./WikiPageRows"

/** Typing pauses this long before the page saves itself. */
const AUTOSAVE_MS = 800

/**
 * One wiki page: its title and body edited in place (saved as you type, for
 * everyone), its subpages under it. ← goes to the parent page.
 */
export function WikiPageView({ id }: { id: string }) {
  const t = useT("wiki")
  const { data: page, isLoading, isError } = useWikiPage(id)
  const { data: pages = [] } = useWikiPages()

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (isError || !page)
    return (
      <EmptyState
        icon={<RiBookClosedLine className="size-5" />}
        title={isError ? t("loadFailed") : t("notFound")}
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

  // Home's "Baru dibuka".
  useEffect(() => rememberPage(page.id), [page.id])

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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("more")}
                    className="text-muted-foreground"
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem
                  onClick={() => void createSubpage("database")}
                >
                  <RiTableLine />
                  {t("newDatabase")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
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
              className={isDatabase ? "hidden" : undefined}
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
        >
          <textarea
            rows={1}
            maxLength={200}
            autoFocus={!page.title}
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
          {database && <RowProps db={database} row={meta} />}
        </PageHead>

        {isDatabase ? (
          // The table is wider than the text column, as in Notion.
          <div className="mx-auto mt-6 w-full max-w-5xl px-6 sm:px-16">
            <WikiDatabase db={meta} pages={pages} />
          </div>
        ) : (
          <div data-wiki-body className="mt-6">
            <MarkdownDocEditor
              value={page.body}
              ariaLabel={t("bodyLabel")}
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
            router.push(parent ? wikiHref(parent.id) : "/wiki")
          } catch {
            toast.error(t("deleteFailed"))
          }
        }}
      />
    </div>
  )
}
