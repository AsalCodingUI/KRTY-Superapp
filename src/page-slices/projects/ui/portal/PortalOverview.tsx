"use client"

import { PageHeader } from "@/components/page-header"
import { surfaceClassName } from "@/components/panel"
import { cn } from "@/lib/utils"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCheckLine } from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import {
  Building2,
  Link2,
  Newspaper,
  CalendarCheck,
  CalendarDays,
  CircleDashed,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { PhaseRow, StepRow } from "../workspace/data"
import { PhaseRail } from "../workspace/ProjectDashboard"
import { ProjectProperties } from "../workspace/ProjectProperties"
import { DesignLinkAnchor } from "../workspace/DesignLinks"
import { PortalReportDialog } from "./PortalReportDialog"
import type { PortalReport } from "./PortalReports"

const noop = () => {}

/**
 * The client's project home, laid out like the team's dashboard (title,
 * stat band, phase cards, the picked phase's steps, facts on the side),
 * read-only.
 */
export function PortalOverview({
  base,
  project,
  phases,
  steps,
  reports,
  links,
}: {
  base: string
  project: {
    id: string
    name: string
    status: string | null
    start_date: string | null
    end_date: string | null
    description: string | null
    client_name: string | null
  }
  phases: PhaseRow[]
  steps: StepRow[]
  /** The latest shared reports (a few). */
  reports: PortalReport[]
  /** Design links (Figma…) the team keeps on the project. */
  links: { id: string; url: string; title: string | null }[]
}) {
  const t = useT("projects")
  const tn = useT("nav")
  // A latest report opens right here, over the dashboard.
  const [openReport, setOpenReport] = useState<string | null>(null)
  const dateLocale = useDateLocale()
  const active = phases.find((p) => p.status === "active") ?? null
  const [selected, setSelected] = useState(
    (active ?? phases[phases.length - 1])?.id ?? null,
  )
  const current = phases.find((p) => p.id === selected) ?? phases[0]
  const phaseSteps = current
    ? steps.filter((s) => s.phase_id === current.id)
    : []
  const day = (d: string | null) =>
    d ? format(parseISO(d), "d MMM yyyy", { locale: dateLocale }) : null
  const statusKey =
    STATUS_LABEL_KEYS[project.status as keyof typeof STATUS_LABEL_KEYS]

  const facts = [
    {
      icon: CalendarDays,
      label: t("colStart"),
      value: day(project.start_date),
    },
    {
      icon: CalendarCheck,
      label: t("factsDeadline"),
      value: day(project.end_date),
    },
    { icon: Building2, label: t("factsClient"), value: project.client_name },
  ]

  return (
    <div className="flex flex-col">
      {/* The top bar names the project; the page names itself. */}
      <PageHeader className="pt-6 pb-4" title={tn("projectDashboard")} />
      <ProjectProperties
        phases={phases}
        steps={steps}
        status={statusKey ? t(statusKey) : null}
        statusTone={project.status}
        start={day(project.start_date)}
        end={day(project.end_date)}
      />
      <div className="flex flex-col gap-4 pt-6 pb-4">
        {phases.length > 0 && (
          <PhaseRail
            phases={phases}
            steps={steps}
            selectedId={current?.id ?? null}
            onSelect={setSelected}
            isAdmin={false}
            onAdd={noop}
            onActivate={noop}
            onRename={noop}
            onMove={noop}
            onDelete={noop}
            onSettings={noop}
            showMissingDue={false}
          />
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-4">
            {current && (
              <section className={cn(surfaceClassName, "flex flex-col")}>
                <header className="flex h-11 items-center border-b px-4">
                  <h2
                    className="min-w-0 truncate text-sm font-medium"
                    title={current.name}
                  >
                    {t("processTitle", { name: current.name })}
                  </h2>
                </header>
                {phaseSteps.length === 0 ? (
                  <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                    {t("stepsEmpty", { name: current.name })}
                  </p>
                ) : (
                  phaseSteps.map((step) => {
                    const done = step.status === "done"
                    return (
                      <div
                        key={step.id}
                        className="border-border/50 flex h-11 items-center gap-3 border-b px-4 text-sm last:border-b-0"
                      >
                        {done ? (
                          <span className="bg-success text-background flex size-4 shrink-0 items-center justify-center rounded-full">
                            <RiCheckLine className="size-3" />
                          </span>
                        ) : (
                          <CircleDashed className="text-muted-foreground size-4 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate",
                            done && "text-muted-foreground line-through",
                          )}
                        >
                          {step.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs",
                            done
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {done ? t("statusCompleted") : t("portalStepOpen")}
                        </span>
                      </div>
                    )
                  })
                )}
              </section>
            )}

            {reports.length > 0 && (
              <section className={cn(surfaceClassName, "flex flex-col")}>
                <header className="flex h-11 items-center justify-between gap-3 border-b px-4">
                  <h2 className="text-sm font-medium">
                    {t("portalLatestReports")}
                  </h2>
                  <Link
                    href={`${base}/reports`}
                    className="text-muted-foreground hover:text-foreground text-[13px] transition-colors"
                  >
                    {t("portalSeeAll")}
                  </Link>
                </header>
                {reports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setOpenReport(r.id)}
                    className="border-border/50 hover:bg-muted/40 flex h-11 items-center gap-3 border-b px-4 text-left text-sm transition-colors last:border-b-0"
                  >
                    <Newspaper className="text-muted-foreground size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <span className="text-tertiary-foreground shrink-0 text-[13px] tabular-nums">
                      {format(parseISO(r.report_date), "d MMM yyyy", {
                        locale: dateLocale,
                      })}
                    </span>
                  </button>
                ))}
              </section>
            )}
          </div>

          <aside
            className={cn(
              surfaceClassName,
              "flex flex-col gap-5 p-4 text-sm",
              !current && !reports.length && "lg:col-start-2",
            )}
          >
            <section className="flex flex-col gap-1.5">
              <h3 className="font-medium">{t("colProject")}</h3>
              <p
                className={cn(
                  "whitespace-pre-line",
                  project.description
                    ? "text-foreground/90"
                    : "text-muted-foreground",
                )}
              >
                {project.description || t("aboutEmpty")}
              </p>
            </section>
            <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground flex min-h-8 items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0">
                    <Icon aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </dt>
                  <dd
                    className={cn(
                      "flex min-h-8 min-w-0 items-center truncate",
                      !value && "text-tertiary-foreground",
                    )}
                  >
                    {value ?? t("factsNotSet")}
                  </dd>
                </div>
              ))}
            </dl>
            {links.length > 0 && (
              <section className="border-border flex flex-col gap-2 border-t pt-4">
                <h3 className="text-muted-foreground flex items-center gap-2 [&_svg]:size-4">
                  <Link2 aria-hidden="true" />
                  {t("designLinks")}
                </h3>
                <ul className="-mx-2 flex flex-col">
                  {links.map((link) => (
                    <li
                      key={link.id}
                      className="hover:bg-muted/60 flex rounded-lg pr-1 transition-colors"
                    >
                      <DesignLinkAnchor url={link.url} title={link.title} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
      <PortalReportDialog
        report={reports.find((r) => r.id === openReport) ?? null}
        onClose={() => setOpenReport(null)}
      />
    </div>
  )
}
