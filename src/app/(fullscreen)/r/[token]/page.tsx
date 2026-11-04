import { AppIcon } from "@/components/app-icon"
import { BrandBackdrop } from "@/components/brand-backdrop"
import {
  glassSurfaceClass,
  GlassLayer,
  ScreenControls,
  screenBackgroundClass,
  screenTitleClass,
} from "@/components/minimal-screen"
import { cn } from "@/lib/utils"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { PageTranslator } from "@/components/page-translator"
import { Markdown } from "@/components/markdown"
import { clientSafeMarkdown } from "@/shared/lib/storage-proxy"
import { getDateLocale, getLocale, getT } from "@/shared/i18n/server"
import { format, parseISO } from "date-fns"
import type { Metadata } from "next"
import { after } from "next/server"
import { notFound, redirect } from "next/navigation"
import { reportKey } from "@/shared/lib/portal-docs"
import { pendingReportView, saveReportView } from "@/shared/lib/report-views"
import { markdownExcerpt } from "@/shared/lib/og-text"
import { ogLocale, publicOrigin, SITE_NAME } from "@/shared/og/site"
import { sharedReport } from "./shared-report"

export const dynamic = "force-dynamic"

// A client link: never in search results, but chat apps may still unfurl
// it (title, a short excerpt and a share card from opengraph-image.tsx,
// all on the public client host). An unknown link gets the studio's card.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token: key } = await params
  const [report, origin, locale] = await Promise.all([
    sharedReport(key),
    publicOrigin(),
    getLocale(),
  ])
  const base: Metadata = {
    metadataBase: new URL(origin),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  }
  if (!report) {
    return {
      ...base,
      title: SITE_NAME,
      description: "A link shared by Kretya Studio.",
      openGraph: { siteName: SITE_NAME, type: "website", title: SITE_NAME },
      twitter: { card: "summary_large_image", title: SITE_NAME },
    }
  }
  const project = report.project?.name
  const title = project ? `${report.title} · ${project}` : report.title
  const description =
    markdownExcerpt(report.body) ||
    (project
      ? `A project report for ${project} from Kretya Studio.`
      : "A project report from Kretya Studio.")
  const canonical = `/r/${reportKey(project, report.share_token)}`
  return {
    ...base,
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: ogLocale(locale),
      publishedTime: report.report_date,
      modifiedTime: report.updated_at,
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

/**
 * One project report shared with a client (/r/<project-name>-<token>), read-only and
 * without an account. Read server-side by its token, so nothing else of
 * the project is reachable; turning the link off makes this a 404.
 */
export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token: key } = await params
  const report = await sharedReport(key)
  if (!report) notFound()

  // A short token wears the project's current name (renamed → redirect).
  if (report.share_token.length === 12) {
    const correct = reportKey(report.project?.name, report.share_token)
    if (key !== correct) redirect(`/r/${correct}`)
  }

  // A client opened it (not the team, a bot or a repeat visit): noted
  // after the page is sent, so it never slows the read down.
  const view = await pendingReportView(report.id, "link")
  if (view) after(() => saveReportView(view))

  const [t, locale] = await Promise.all([getT("projects"), getDateLocale()])
  const day = format(parseISO(report.report_date), "d MMMM yyyy", { locale })

  return (
    // The report as a card filling the screen on the brand backdrop (like a
    // brief); only the card's text scrolls.
    <main
      className={cn(
        screenBackgroundClass,
        "flex h-dvh flex-col items-center px-2 pb-2 sm:px-4 sm:pb-4",
      )}
    >
      <BrandBackdrop />
      <ScreenControls>
        <PageTranslator className="h-9 rounded-full px-3 text-sm" />
        <ThemeToggleButton className="size-9 rounded-full" />
      </ScreenControls>

      <header
        data-translate-root
        className="relative z-10 flex max-w-xl shrink-0 flex-col items-center gap-3 px-4 pt-5 pb-4 text-center sm:pt-6 sm:pb-5"
      >
        <AppIcon size={192} className="size-10 rounded-[12px]" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-muted-foreground text-meta">
            <span translate="no">
              Kretya Studio
              {report.project?.name ? ` · ${report.project.name}` : ""}
            </span>
            {` · ${day}`}
          </span>
          <h1 className={screenTitleClass}>{report.title}</h1>
        </div>
      </header>

      <article
        data-translate-root
        className={cn(
          glassSurfaceClass,
          "z-10 flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-[24px]",
        )}
      >
        <GlassLayer />
        <div className="scroll-pane pane-px-5 sm:pane-px-10 text-title min-h-0 flex-1 py-6 leading-7 sm:py-8">
          {report.body.trim() ? (
            <Markdown images>{clientSafeMarkdown(report.body)}</Markdown>
          ) : (
            <p className="text-muted-foreground text-sm">{t("reportsEmpty")}</p>
          )}
        </div>
      </article>
    </main>
  )
}
