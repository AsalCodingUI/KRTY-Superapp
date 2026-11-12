"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { ProjectAvatar } from "@/components/project-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiInboxLine,
  RiPencilLine,
} from "@/shared/ui/lucide-icons"
import { PrefetchLink } from "@/components/prefetch-link"
import { useState } from "react"
import { toast } from "sonner"
import { closeLead } from "../lib/desktop"
import {
  hostOf,
  normalizeUrl,
  useLeadSites,
  useLeadWriter,
  type LeadSite,
} from "../model/data"
import { leadHref } from "./lead-tree"

type Editing = { site: LeadSite | null } | null

/**
 * Leads → Kelola situs: the studio's one list of sites (every PM and
 * stakeholder sees the same), in the panel's order: add, edit, remove.
 */
export function LeadsPage() {
  const t = useT("leads")
  const tc = useT("common")
  const { isImpersonating } = useUserProfile()
  const { data: sites = [], isLoading, isError } = useLeadSites()
  const writer = useLeadWriter()
  const [editing, setEditing] = useState<Editing>(null)
  const [removing, setRemoving] = useState<LeadSite | null>(null)
  // Viewing as someone: their list, read-only.
  const readOnly = Boolean(isImpersonating)

  // The built-in defaults (no table yet) can't be changed.
  const builtIn = sites.some((s) => s.builtIn)
  const canEdit = (site: LeadSite) => !readOnly && !site.builtIn

  const act = async (op: Promise<unknown>) => {
    try {
      await op
    } catch {
      toast.error(t("saveFailed"))
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("manage")}
        actions={
          !readOnly &&
          !builtIn && (
            <Button onClick={() => setEditing({ site: null })}>
              <RiAddLine data-icon="inline-start" />
              {t("addSite")}
            </Button>
          )
        }
      />
      {builtIn && (
        <p className="text-muted-foreground text-meta pb-3">
          {t("builtInNote")}
        </p>
      )}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<RiInboxLine className="size-5" />}
          title={t("loadFailed")}
        />
      ) : sites.length === 0 ? (
        <EmptyState
          icon={<RiInboxLine className="size-5" />}
          title={t("empty")}
          description={t("emptyDesc")}
        />
      ) : (
        <GroupedList className="text-sm">
          {sites.map((site) => (
            <ListRow
              key={site.id}
              className="group/site flex min-h-14 items-center gap-3 py-2"
            >
              <ProjectAvatar
                id={site.id}
                name={site.name}
                className="size-6 rounded-md text-xs"
              />
              <PrefetchLink
                href={leadHref(site.id)}
                className="flex min-w-0 flex-1 flex-col"
              >
                <span className="truncate">{site.name}</span>
                <span className="text-muted-foreground text-meta truncate">
                  {hostOf(site.url)}
                </span>
              </PrefetchLink>
              <div className="flex shrink-0 items-center gap-0.5">
                {canEdit(site) && (
                  <>
                    <RowAction
                      label={t("rename")}
                      onClick={() => setEditing({ site })}
                    >
                      <RiPencilLine />
                    </RowAction>
                    <RowAction
                      label={t("remove")}
                      destructive
                      onClick={() => setRemoving(site)}
                    >
                      <RiDeleteBinLine />
                    </RowAction>
                  </>
                )}
              </div>
            </ListRow>
          ))}
        </GroupedList>
      )}

      <SiteDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async ({ name, url }) => {
          const site = editing?.site
          if (site) {
            await writer.update(site.id, name, url)
            // A new address: the open view reloads it next time.
            if (url !== site.url) void closeLead(site.id)
          }
          else
            await writer.add(
              name,
              url,
              Math.max(0, ...sites.map((s) => s.position)) + 1,
            )
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("removeTitle", { name: removing?.name ?? "" })}
        description={t("removeDesc")}
        confirmText={t("remove")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={() => {
          if (!removing) return
          const id = removing.id
          setRemoving(null)
          void act(writer.remove(id).then(() => closeLead(id)))
        }}
      />
    </div>
  )
}

function RowAction({
  label,
  destructive,
  onClick,
  children,
}: {
  label: string
  destructive?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
            className={cn(
              "text-muted-foreground",
              destructive
                ? "hover:text-destructive-ink"
                : "hover:text-foreground",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Add a site (name + https address), or edit one. */
function SiteDialog({
  editing,
  onClose,
  onSave,
}: {
  editing: Editing
  onClose: () => void
  onSave: (value: { name: string; url: string }) => Promise<void>
}) {
  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {editing && (
          <SiteForm
            key={editing.site?.id ?? "new"}
            site={editing.site}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SiteForm({
  site,
  onClose,
  onSave,
}: {
  site: LeadSite | null
  onClose: () => void
  onSave: (value: { name: string; url: string }) => Promise<void>
}) {
  const t = useT("leads")
  const tc = useT("common")
  const [name, setName] = useState(site?.name ?? "")
  const [url, setUrl] = useState(site?.url ?? "")
  const [saving, setSaving] = useState(false)
  const [urlError, setUrlError] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeUrl(url)
    if (!normalized) return setUrlError(true)
    setSaving(true)
    try {
      await onSave({ name, url: normalized })
      onClose()
    } catch {
      toast.error(t("saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{site ? t("rename") : t("addSite")}</DialogTitle>
      </DialogHeader>
      <form
        id="lead-site-form"
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <div className="gap-field flex flex-col">
          <Label htmlFor="lead-name">{t("name")}</Label>
          <Input
            id="lead-name"
            required
            autoFocus
            maxLength={60}
            value={name}
            placeholder={t("namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="gap-field flex flex-col">
          <Label htmlFor="lead-url">{t("url")}</Label>
          <Input
            id="lead-url"
            required
            inputMode="url"
            value={url}
            aria-invalid={urlError || undefined}
            placeholder={t("urlPlaceholder")}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError(false)
            }}
          />
          {urlError && (
            <p className="text-destructive-ink text-meta">
              {t("urlInvalid")}
            </p>
          )}
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {tc("cancel")}
        </Button>
        <Button type="submit" form="lead-site-form" disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}
          {t("save")}
        </Button>
      </DialogFooter>
    </>
  )
}
