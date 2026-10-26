"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "./data"
import { RowMenu } from "./ProjectLibrary"

type DesignLink = {
  id: string
  url: string
  title: string | null
  position: number
}

const linksKey = (projectId: string) => ["project-links", projectId] as const

/**
 * A readable name for a long design link. Figma puts the file name in the
 * path (`/design/<key>/Milxa-Brand-Kit?node-id=…`), so that becomes
 * "Milxa Brand Kit"; anything else shows its host and last path part.
 */
export function linkLabel(url: string) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split("/").filter(Boolean)
    if (/(^|\.)figma\.com$/.test(u.hostname) && parts.length >= 3) {
      // Figma writes "Brand Kit - QA" as "Brand-Kit---QA".
      return decodeURIComponent(parts[2])
        .replace(/---/g, " – ")
        .replace(/-/g, " ")
    }
    const last = parts.at(-1)
    return last
      ? `${u.hostname.replace(/^www\./, "")} / ${decodeURIComponent(last)}`
      : u.hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

const isFigma = (url: string) => {
  try {
    return /(^|\.)figma\.com$/.test(new URL(url).hostname)
  } catch {
    return false
  }
}

/** What kind of Figma link it is (shown small under the name). */
function linkKind(url: string) {
  try {
    const u = new URL(url)
    if (!/(^|\.)figma\.com$/.test(u.hostname)) return u.hostname
    const kind = u.pathname.split("/").filter(Boolean)[0]
    return kind === "proto"
      ? "Figma · Prototype"
      : kind === "board"
        ? "FigJam"
        : kind === "slides"
          ? "Figma · Slides"
          : "Figma"
  } catch {
    return ""
  }
}

/** Figma's mark, small and in its own colours. */
function FigmaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 57" aria-hidden className={className}>
      <path
        fill="#1abcfe"
        d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"
      />
      <path
        fill="#0acf83"
        d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"
      />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path
        fill="#f24e1e"
        d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"
      />
      <path
        fill="#a259ff"
        d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"
      />
    </svg>
  )
}

/** One design link: the mark, a readable name and its kind; opens in a new
 *  tab (the full URL on hover). Also used read-only in the client portal. */
export function DesignLinkAnchor({
  url,
  title,
}: {
  url: string
  title: string | null
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-2"
    >
      <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md">
        {isFigma(url) ? (
          <FigmaMark className="h-3.5 w-auto" />
        ) : (
          <Link2 className="text-muted-foreground size-3.5" />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{title || linkLabel(url)}</span>
        <span className="text-tertiary-foreground truncate text-xs">
          {linkKind(url)}
        </span>
      </span>
    </a>
  )
}

/**
 * The project's design links (Figma files, prototypes…), in the dashboard's
 * side panel: a readable name per link instead of the long URL, opening
 * in a new tab. Stakeholders and PMs add, rename and remove them.
 */
export function DesignLinks({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const { profile } = useUserProfile()
  const canManage = accessLevel(profile) !== "employee"
  const queryClient = useQueryClient()
  const { data: links = [] } = useQuery({
    queryKey: linksKey(projectId),
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_links" as never)
        .select("id, url, title, position")
        .eq("project_id" as never, projectId as never)
        .order("position" as never)
        .order("created_at" as never)
      return (data ?? []) as unknown as DesignLink[]
    },
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: linksKey(projectId) })

  const [editing, setEditing] = useState<DesignLink | "new" | null>(null)
  const [removing, setRemoving] = useState<DesignLink | null>(null)

  if (links.length === 0 && !canManage) return null

  return (
    <section className="border-border flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground flex items-center gap-2 [&_svg]:size-4">
          <Link2 aria-hidden="true" />
          {t("designLinks")}
        </h3>
        {canManage && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t("designLinkAdd")}
            className="text-muted-foreground"
            onClick={() => setEditing("new")}
          >
            <RiAddLine />
          </Button>
        )}
      </div>
      {links.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="text-muted-foreground hover:text-foreground text-left"
        >
          {t("designLinksEmpty")}
        </button>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {links.map((link) => (
            <li
              key={link.id}
              className="group/row hover:bg-muted/60 flex items-center gap-2 rounded-lg pr-1 transition-colors"
            >
              <DesignLinkAnchor url={link.url} title={link.title} />
              {canManage && (
                <RowMenu
                  label={link.title || linkLabel(link.url)}
                  items={[
                    {
                      label: t("designLinkCopy"),
                      onSelect: () =>
                        void navigator.clipboard
                          .writeText(link.url)
                          .then(() => toast.success(t("reportLinkCopied"))),
                    },
                    {
                      label: t("actionEdit"),
                      onSelect: () => setEditing(link),
                    },
                    {
                      label: tc("delete"),
                      destructive: true,
                      separatorBefore: true,
                      onSelect: () => setRemoving(link),
                    },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <LinkDialog
        projectId={projectId}
        link={editing}
        nextPosition={links.length}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("deleteNamedTitle", {
          name: removing ? removing.title || linkLabel(removing.url) : "",
        })}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!removing) return
          const { error } = await supabase()
            .from("project_links" as never)
            .delete()
            .eq("id" as never, removing.id as never)
          if (error) toast.error(t("designLinkSaveFailed"))
          setRemoving(null)
          void refresh()
        }}
      />
    </section>
  )
}

/** Add or edit one link: the URL, and a name (else it's read off the URL). */
function LinkDialog({
  projectId,
  link,
  nextPosition,
  onClose,
  onSaved,
}: {
  projectId: string
  link: DesignLink | "new" | null
  nextPosition: number
  onClose: () => void
  onSaved: () => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [opened, setOpened] = useState<typeof link>(null)
  // Fill the fields each time it opens.
  if (link !== opened) {
    setOpened(link)
    setUrl(link && link !== "new" ? link.url : "")
    setTitle(link && link !== "new" ? (link.title ?? "") : "")
  }

  const trimmed = url.trim()
  const valid = /^https?:\/\/\S+\.\S+/i.test(trimmed)

  const save = async () => {
    if (!valid || saving || !link) return
    setSaving(true)
    const db = supabase().from("project_links" as never)
    const row = { url: trimmed, title: title.trim() || null }
    const { error } =
      link === "new"
        ? await db.insert({
            ...row,
            project_id: projectId,
            position: nextPosition,
          } as never)
        : await db.update(row as never).eq("id" as never, link.id as never)
    setSaving(false)
    if (error) return void toast.error(t("designLinkSaveFailed"))
    onSaved()
    onClose()
  }

  return (
    <Dialog open={Boolean(link)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {link === "new" ? t("designLinkAdd") : t("designLinkEdit")}
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <Field>
            <FieldLabel htmlFor="design-link-url">
              {t("designLinkUrl")}
            </FieldLabel>
            <Input
              id="design-link-url"
              autoFocus
              inputMode="url"
              placeholder="https://www.figma.com/design/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={trimmed !== "" && !valid ? true : undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="design-link-title">
              {t("designLinkName")}
            </FieldLabel>
            <Input
              id="design-link-title"
              maxLength={80}
              placeholder={valid ? linkLabel(trimmed) : t("designLinkNameHint")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          {/* Enter in either field saves (the buttons sit outside). */}
          <button type="submit" hidden />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button onClick={save} disabled={!valid || saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
