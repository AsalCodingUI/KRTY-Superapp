"use client"

import { PageHeader } from "@/components/page-header"
import { SectionTitle } from "@/components/section-title"
import { listRowClassName } from "@/components/grouped-list"
import { PanelList, surfaceClassName } from "@/components/panel"
import { HoverHighlight } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, parseISO } from "date-fns"
import {
  Building2,
  Link2,
  Newspaper,
  CalendarCheck,
  CalendarDays,
  CircleCheckSolid,
  CircleDashed,
} from "@/components/icons"
import Link from "next/link"
import { useState } from "react"
import { ContextTarget, type CtxItem } from "@/shared/context-menu"
import { linkKey } from "@/shared/lib/url-params"
import type { PhaseRow, StepRow } from "../workspace/data"
import { PhaseRail } from "../workspace/PhaseRail"
import { ProjectProperties } from "../workspace/ProjectProperties"
import { StepStatusBadge } from "../workspace/StepStatusBadge"
import { DesignLinkAnchor, linkLabel } from "../workspace/DesignLinks"
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
      <PageHeader title={tn("projectDashboard")} />
      <ProjectProperties
        phases={phases}
        steps={steps}
        status={statusKey ? t(statusKey) : null}
        statusTone={project.status}
        start={day(project.start_date)}
        end={day(project.end_date)}
      />
      <div className="flex flex-col gap-4 pt-6">
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
                  <PanelList hover={false}>
                    {phaseSteps.map((step) => {
                      const done = step.status === "done"
                      return (
                        <div
                          key={step.id}
                          data-slot="list-row"
                          className={listRowClassName}
                        >
                          {done ? (
                            <CircleCheckSolid className="text-success size-4 shrink-0" />
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
                          <StepStatusBadge done={done}>
                            {done ? t("statusCompleted") : t("portalStepOpen")}
                          </StepStatusBadge>
                        </div>
                      )
                    })}
                  </PanelList>
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
                    prefetch={false}
                    href={`${base}/reports`}
                    className="text-muted-foreground hover:text-foreground text-meta transition-colors"
                  >
                    {t("portalSeeAll")}
                  </Link>
                </header>
                <PanelList>
                  {reports.map((r) => (
                    <ContextTarget
                      key={r.id}
                      type="portal-report"
                      label={r.title}
                      href={`${base}/reports?report=${linkKey(r.title, r.id)}`}
                      suppress={["button"]}
                      items={(): CtxItem[] => [
                        {
                          id: "open-here",
                          label: t("ctxPreview"),
                          icon: Newspaper,
                          onSelect: () => setOpenReport(r.id),
                        },
                      ]}
                    >
                      <button
                        type="button"
                        data-slot="list-row"
                        onClick={() => setOpenReport(r.id)}
                        className={cn(
                          listRowClassName,
                          "focus-visible:ring-focus-ring rounded-row text-left outline-none focus-visible:ring-2",
                        )}
                      >
                        <Newspaper className="text-muted-foreground size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {r.title}
                        </span>
                        <span className="text-tertiary-foreground text-meta shrink-0 tabular-nums">
                          {format(parseISO(r.report_date), "d MMM yyyy", {
                            locale: dateLocale,
                          })}
                        </span>
                      </button>
                    </ContextTarget>
                  ))}
                </PanelList>
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
                <SectionTitle variant="group" className="py-0">
                  <span className="inline-flex items-center gap-2 [&_svg]:size-3.5">
                    <Link2 aria-hidden="true" />
                    {t("designLinks")}
                  </span>
                </SectionTitle>
                <ul className="relative -mx-2 flex flex-col">
                  <HoverHighlight
                    itemSelector="[data-slot=list-row]"
                    className="bg-(--row-hover)"
                  />
                  {links.map((link) => (
                    <ContextTarget
                      key={link.id}
                      type="portal-link"
                      label={link.title || linkLabel(link.url)}
                      href={link.url}
                    >
                      <li
                        data-slot="list-row"
                        className="rounded-row relative flex pr-1"
                      >
                        <DesignLinkAnchor url={link.url} title={link.title} />
                      </li>
                    </ContextTarget>
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
