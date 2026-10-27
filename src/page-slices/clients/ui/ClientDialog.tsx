"use client"

import { projectHref } from "@/shared/lib/url-params"
import {
  deleteClient,
  setClientArchived,
} from "@/app/(main)/clients/actions/client-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ListChip } from "@/components/grouped-list"
import { StatTiles } from "@/components/stat-tiles"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { rupiah, type FxRates } from "@/entities/finance/lib/money"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { ProjectStatusIcon } from "@/page-slices/projects/ui/ProjectStatusIcon"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiBuildingLine,
  RiCloseLine,
  RiMoreFill,
  RiPencilLine,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { clientKeys, type ClientRow } from "../model/data"
import { summarize } from "../model/summary"

/** One client: contact details, money, and every project for them. */
export function ClientDialog({
  client,
  rates,
  onEdit,
  onClose,
}: {
  client: ClientRow
  rates: FxRates
  onEdit: () => void
  onClose: () => void
}) {
  const t = useT("clients")
  const tp = useT("projects")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const sum = summarize(client, rates)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: clientKeys.all })

  const details: [string, React.ReactNode][] = [
    [t("fieldContact"), client.contact_name],
    [
      t("fieldEmail"),
      client.email && (
        <a href={`mailto:${client.email}`} className="hover:underline">
          {client.email}
        </a>
      ),
    ],
    [t("fieldPhone"), client.phone],
    [
      t("fieldWebsite"),
      client.website && (
        <a
          href={
            /^https?:\/\//i.test(client.website)
              ? client.website
              : `https://${client.website}`
          }
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline"
        >
          {client.website}
        </a>
      ),
    ],
    [t("fieldCountry"), client.country],
    [t("fieldCurrency"), client.currency],
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex max-h-[min(48rem,90svh)] w-full flex-col overflow-hidden p-0 sm:max-w-3xl"
      >
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b pr-3 pl-5">
          <RiBuildingLine className="text-muted-foreground size-4 shrink-0" />
          <DialogTitle className="min-w-0 truncate text-sm font-medium">
            {client.name}
          </DialogTitle>
          {client.archived_at && (
            <ListChip className="shrink-0">{t("archived")}</ListChip>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <RiPencilLine data-icon="inline-start" />
              {t("edit")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("actions")}
                    className="text-muted-foreground"
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  onClick={async () => {
                    const result = await setClientArchived(
                      client.id,
                      !client.archived_at,
                    )
                    if (!result.success) return toast.error(result.error)
                    toast.success(
                      client.archived_at ? t("restored") : t("archivedToast"),
                    )
                    refresh()
                  }}
                >
                  {client.archived_at ? t("restore") : t("archive")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("close")}
              className="text-muted-foreground"
              onClick={onClose}
            >
              <RiCloseLine />
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <StatTiles
            items={[
              {
                key: "projects",
                label: t("statProjects"),
                value: sum.projects,
                hint: t("statRunning", { n: sum.running }),
              },
              {
                key: "received",
                label: t("statReceived"),
                value: rupiah(sum.received),
              },
              { key: "open", label: t("statOpen"), value: rupiah(sum.open) },
            ]}
          />

          <section className="flex flex-col gap-2">
            <h3 className="text-heading text-sm font-medium">{t("details")}</h3>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 truncate text-right">
                    {value || (
                      <span className="text-tertiary-foreground">—</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {client.notes && (
              <p className="border-border text-muted-foreground mt-2 rounded-lg border px-3 py-2 text-sm whitespace-pre-line">
                {client.notes}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-heading text-sm font-medium">
              {t("projectsTitle")}{" "}
              <span className="text-tertiary-foreground font-normal tabular-nums">
                {client.projects.length}
              </span>
            </h3>
            {client.projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noProjects")}</p>
            ) : (
              <ul className="flex flex-col">
                {[...client.projects]
                  .sort((a, b) => b.end_date.localeCompare(a.end_date))
                  .map((p) => (
                    <li key={p.id}>
                      <Link
                        href={projectHref(p)}
                        prefetch={false}
                        className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm"
                      >
                        <ProjectStatusIcon status={p.status} />
                        <span className="min-w-0 flex-1 truncate">
                          {p.name}
                        </span>
                        <span className="text-muted-foreground text-[13px]">
                          {tp(STATUS_LABEL_KEYS[p.status])}
                        </span>
                        <span className="text-muted-foreground w-24 text-right text-[13px] tabular-nums">
                          {format(parseISO(p.end_date), "d MMM yyyy", {
                            locale: dateLocale,
                          })}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={t("deleteTitle", { name: client.name })}
          description={t("deleteDescription")}
          confirmText={t("delete")}
          cancelText={t("cancel")}
          variant="destructive"
          onConfirm={async () => {
            const result = await deleteClient(client.id)
            if (!result.success) return void toast.error(result.error)
            toast.success(t("deleted"))
            refresh()
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            onClose()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
