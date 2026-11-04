"use client"

import {
  removeBrief,
  setBriefProject,
} from "@/app/(main)/projects/actions/brief-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useProjectOptions } from "@/page-slices/projects/ui/ProjectLineage"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { briefMarkdown, briefProgress } from "@/shared/lib/briefs/brief"
import { clientUrl } from "@/shared/lib/client-site"
import { projectHref } from "@/shared/lib/url-params"
import { RiDeleteBinLine, RiMoreFill } from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import {
  Download,
  ExternalLink,
  FolderKanban,
  Link2,
  PencilRuler,
} from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { patchBrief, useBrief, useRefreshBriefs } from "../model/data"
import { BriefBuilder } from "./BriefBuilder"
import {
  BriefAnswersView,
  BriefStatusDot,
  SET_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  SetIcon,
} from "./shared"
import { cn } from "@/lib/utils"
import type { BriefSet } from "@/shared/lib/briefs/types"

const NONE = "__none"

/**
 * A brief, opened (?brief=<id>): its answers as question → answer, the
 * questions to edit, and its link, project and file.
 */
export function BriefDialog({
  briefId,
  canManage,
  onClose,
}: {
  briefId: string
  canManage: boolean
  onClose: () => void
}) {
  const t = useT("briefs")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const refresh = useRefreshBriefs()
  // Focus lands on the dialog itself, not the first link in the header.
  const popupRef = useRef<HTMLDivElement>(null)
  const { data: brief, isPending } = useBrief(briefId)
  const [building, setBuilding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: projects = [] } = useProjectOptions(canManage)
  const day = (value: string) =>
    format(parseISO(value), "d MMM yyyy, HH:mm", { locale: dateLocale })

  const copyLink = async () => {
    if (!brief) return
    await navigator.clipboard.writeText(clientUrl(`/b/${brief.token}`))
    toast.success(t("linkCopied"))
    if (brief.status === "draft") {
      await patchBrief(brief.id, { status: "sent" }).catch(() => {})
      void refresh()
    }
  }

  const download = () => {
    if (!brief) return
    const md = briefMarkdown({
      title: brief.title,
      client: brief.client?.name,
      sections: brief.sections,
      sets: brief.sets,
      answers: brief.answers,
      files: brief.files,
    })
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${brief.title.replace(/[^\w\- ]+/g, "").trim() || "brief"}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const link = async (projectId: string | null) => {
    if (!brief) return
    const result = await setBriefProject(brief.id, projectId)
    if (!result.success) return void toast.error(result.error)
    const name = projects.find((p) => p.id === projectId)?.name
    toast.success(name ? t("projectLinked", { name }) : t("projectUnlinked"))
    void refresh()
  }

  const progress = brief
    ? briefProgress(brief.sections, brief.sets, brief.answers, brief.files)
    : null
  // The client's projects first.
  const sortedProjects = brief
    ? [...projects].sort(
        (a, b) =>
          Number(b.client_name === brief.client?.name) -
          Number(a.client_name === brief.client?.name),
      )
    : projects

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={popupRef}
        initialFocus={popupRef}
        className="flex h-[88svh] flex-col gap-0 p-0 sm:max-w-5xl"
      >
        {isPending || !brief ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{t("title")}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-16">
              {isPending ? (
                <Spinner className="size-6" />
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("emptyTitle")}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="border-border flex flex-col gap-3 border-b px-5 pt-5 pb-4">
              <div className="flex items-start gap-4 pr-8">
                <DialogHeader className="min-w-0 flex-1 gap-1.5">
                  <DialogTitle className="truncate text-xl">
                    {brief.title}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <span className="text-foreground flex items-center gap-1.5">
                      <BriefStatusDot status={brief.status} />
                      {t(STATUS_LABEL_KEYS[brief.status])}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{brief.client?.name ?? t("clientPick")}</span>
                    {brief.project && (
                      <>
                        <span aria-hidden>·</span>
                        <Link
                          href={projectHref(brief.project)}
                          className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                          {brief.project.name}
                        </Link>
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex shrink-0 items-center gap-2">
                  {canManage && (
                    <Button variant="outline" onClick={() => setBuilding(true)}>
                      <PencilRuler data-icon="inline-start" />
                      {t("editForm")}
                    </Button>
                  )}
                  {canManage && (
                    <Button onClick={() => void copyLink()}>
                      <Link2 data-icon="inline-start" />
                      {t("copyLink")}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("moreActions")}
                        />
                      }
                    >
                      <RiMoreFill />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="max-h-80 min-w-56"
                    >
                      <DropdownMenuItem onClick={download}>
                        <Download />
                        {t("downloadMd")}
                      </DropdownMenuItem>
                      {canManage && (
                        <>
                          <DropdownMenuItem
                            render={
                              <a
                                href={clientUrl(`/b/${brief.token}`)}
                                target="_blank"
                                rel="noreferrer"
                              />
                            }
                          >
                            <ExternalLink />
                            {t("openLink")}
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <FolderKanban />
                              {t("linkProject")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-h-80 min-w-56 overflow-y-auto">
                              <DropdownMenuRadioGroup
                                value={brief.project_id ?? NONE}
                                onValueChange={(v) => {
                                  const next = v === NONE ? null : (v as string)
                                  if (next !== brief.project_id) void link(next)
                                }}
                              >
                                <DropdownMenuRadioItem
                                  value={NONE}
                                  closeOnClick
                                >
                                  {t("projectNone")}
                                </DropdownMenuRadioItem>
                                {sortedProjects.map((p) => (
                                  <DropdownMenuRadioItem
                                    key={p.id}
                                    value={p.id}
                                    closeOnClick
                                  >
                                    <span className="truncate">{p.name}</span>
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirmDelete(true)}
                          >
                            <RiDeleteBinLine />
                            {t("delete")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* One quiet line: how far, which sets, when. */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                {progress && (
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                      <span
                        className="bg-foreground block h-full rounded-full"
                        style={{
                          width: `${progress.total ? Math.round((progress.answered / progress.total) * 100) : 0}%`,
                        }}
                      />
                    </span>
                    {t("progress", {
                      answered: progress.answered,
                      total: progress.total,
                    })}
                  </span>
                )}
                <span className="flex flex-wrap items-center gap-1.5">
                  {[...brief.sets, ...brief.offers, ...brief.declined].map(
                    (s) => (
                      <span
                        key={s}
                        className={cn(
                          "inline-flex h-6 items-center gap-1.5 rounded-full px-2",
                          brief.sets.includes(s)
                            ? "bg-muted text-foreground"
                            : "border-border border border-dashed",
                          brief.declined.includes(s) && "line-through",
                        )}
                        title={
                          brief.offers.includes(s)
                            ? t("offerPending")
                            : brief.declined.includes(s)
                              ? t("offerDeclined")
                              : undefined
                        }
                      >
                        <SetIcon set={s as BriefSet} className="size-3" />
                        {t(SET_LABEL_KEYS[s as BriefSet])}
                        {brief.offers.includes(s) && (
                          <span className="text-tertiary-foreground">
                            · {t("setOffer")}
                          </span>
                        )}
                        {brief.accepted?.includes(s) && (
                          <span className="text-tertiary-foreground">
                            · {t("setAccepted")}
                          </span>
                        )}
                      </span>
                    ),
                  )}
                </span>
                <span className="ml-auto">
                  {brief.submitted_at
                    ? t("submittedOn", { date: day(brief.submitted_at) })
                    : brief.saved_at
                      ? t("savedOn", { date: day(brief.saved_at) })
                      : brief.opened_at
                        ? t("opened")
                        : t("notOpened")}
                </span>
              </div>
            </div>
            <BriefAnswersView brief={brief} />
            {building && (
              <BriefBuilder
                brief={brief}
                onClose={() => setBuilding(false)}
                onSaved={() => void refresh()}
              />
            )}
            <ConfirmDialog
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              title={t("deleteTitle", { name: brief.title })}
              description={t("deleteDescription")}
              confirmText={tc("delete")}
              cancelText={tc("cancel")}
              variant="destructive"
              onConfirm={async () => {
                const result = await removeBrief(brief.id)
                if (!result.success) return void toast.error(result.error)
                toast.success(t("deleted"))
                void refresh()
                onClose()
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
