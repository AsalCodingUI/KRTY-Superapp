"use client"

import { AnimatePresence } from "motion/react"
import { EmptyValue } from "@/components/empty-value"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RiFileTextLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { SLA } from "./SLAColumns"

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_6.5rem_10rem]"

/** SLAs as one flat list. Active rows open the editor; archived can be restored. */
export function SLAList({
  slas,
  archived,
  canManage,
  onOpen,
  onArchive,
  onRestore,
  onDelete,
}: {
  slas: SLA[]
  archived: boolean
  canManage: boolean
  onOpen: (id: string) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}) {
  const t = useT("sla")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  if (slas.length === 0) {
    return (
      <EmptyState
        title={archived ? t("emptyArchiveTitle") : t("emptyTitle")}
        description={
          archived ? t("emptyArchiveDescription") : t("emptyDescription")
        }
        icon={<RiFileTextLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <GroupedList>
      <div
        className={cn(
          ROW_GRID,
          "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
        )}
      >
        <span>{t("colSla")}</span>
        <span className="hidden md:block">{t("colClient")}</span>
        <span className="text-right">
          {archived ? t("colArchived") : t("colCreated")}
        </span>
        <span className="hidden md:block" />
      </div>
      <AnimatePresence initial={false}>
        {slas.map((sla) => {
          const date = archived ? sla.archived_at : sla.created_at
          const title = sla.title || t("untitled")
          const client = sla.client_name?.trim()
          return (
            <ListRow key={sla.id} className={cn(ROW_GRID, "min-h-14")}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
                  <RiFileTextLine className="size-3.5" />
                </span>
                <div className="flex min-w-0 flex-col">
                  {archived ? (
                    <span className="text-foreground truncate">{title}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpen(sla.id)}
                      className="text-foreground truncate text-left outline-none after:absolute after:inset-0 focus-visible:underline"
                    >
                      {title}
                    </button>
                  )}
                  {client && (
                    <span className="text-tertiary-foreground truncate text-[13px] md:hidden">
                      {client}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden min-w-0 md:block">
                <Badge variant="secondary" className="max-w-full">
                  <span className="truncate">{client || t("noClient")}</span>
                </Badge>
              </div>
              <span className="text-muted-foreground text-right tabular-nums">
                {date ? (
                  format(new Date(date), "d MMM yyyy", { locale: dateLocale })
                ) : (
                  <EmptyValue />
                )}
              </span>
              <div className="hidden justify-end md:flex">
                {canManage && (
                  <ListRowActions className="relative z-10">
                    {archived ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestore(sla.id)}
                        >
                          {t("restore")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(sla.id)}
                        >
                          {tc("delete")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchive(sla.id)}
                      >
                        {t("archive")}
                      </Button>
                    )}
                  </ListRowActions>
                )}
              </div>
            </ListRow>
          )
        })}
      </AnimatePresence>
    </GroupedList>
  )
}
