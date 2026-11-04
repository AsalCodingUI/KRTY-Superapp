"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, formatDistanceToNow } from "date-fns"
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  Link2,
  Monitor,
  Smartphone,
  Tablet,
} from "@/components/icons"
import { useReportViews, type ReportView } from "./report-views-data"

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
} as const

/**
 * "Dibaca 3×" / "Belum dibuka" in a shared report's header: how often the
 * client opened it, and when (a popover with each visit).
 */
export function ReportViewsIndicator({
  projectId,
  reportId,
}: {
  projectId: string
  reportId: string
}) {
  const t = useT("projects")
  const { data, refetch } = useReportViews(projectId)
  const views = data?.get(reportId) ?? []
  const count = views.length
  const label = count
    ? t("reportViews", { count: String(count) })
    : t("reportViewsNone")

  return (
    <Popover onOpenChange={(open) => open && void refetch()}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={label}
            title={label}
            className="text-muted-foreground hover:text-foreground shrink-0 gap-1.5 px-2 font-normal"
          />
        }
      >
        {count ? (
          <Eye data-icon="inline-start" />
        ) : (
          <EyeOff data-icon="inline-start" />
        )}
        <span className="hidden tabular-nums sm:inline">{label}</span>
        {count > 0 && <span className="tabular-nums sm:hidden">{count}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
            <p className="text-sm font-medium">{t("reportViewsTitle")}</p>
            {count > 0 && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {label}
              </span>
            )}
          </div>
          {count === 0 ? (
            <p className="text-muted-foreground px-4 pb-3 text-[13px]">
              {t("reportViewsEmpty")}
            </p>
          ) : (
            <ul className="scroll-pane flex max-h-72 flex-col px-2 pb-2">
              {views.map((v) => (
                <ViewRow key={v.id} view={v} />
              ))}
            </ul>
          )}
          <p className="text-muted-foreground border-border border-t px-4 py-2.5 text-xs">
            {t("reportViewsHint")}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ViewRow({ view }: { view: ReportView }) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const at = new Date(view.viewed_at)
  const DeviceIcon = DEVICE_ICONS[view.device ?? "desktop"]
  const device =
    view.user_agent ||
    t(
      view.device === "mobile"
        ? "reportViewMobile"
        : view.device === "tablet"
          ? "reportViewTablet"
          : "reportViewDesktop",
    )
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13px]">
      <DeviceIcon className="text-muted-foreground size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="text-foreground truncate"
          title={format(at, "d MMM yyyy, HH:mm", { locale: dateLocale })}
        >
          {formatDistanceToNow(at, { addSuffix: true, locale: dateLocale })}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {[device, view.country].filter(Boolean).join(" · ")}
        </span>
      </div>
      <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
        {view.source === "portal" ? (
          <LayoutDashboard className="size-3.5" />
        ) : (
          <Link2 className="size-3.5" />
        )}
        {t(view.source === "portal" ? "reportViewPortal" : "reportViewLink")}
      </span>
    </li>
  )
}

/** The eye and count on a report's row in the list (nothing until read). */
export function ReportViewCount({
  projectId,
  reportId,
}: {
  projectId: string
  reportId: string
}) {
  const t = useT("projects")
  const count = useReportViews(projectId).data?.get(reportId)?.length ?? 0
  if (!count) return null
  const label = t("reportViews", { count: String(count) })
  return (
    <span
      className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs tabular-nums"
      title={label}
      aria-label={label}
    >
      <Eye className="size-3.5" />
      {count}
    </span>
  )
}
