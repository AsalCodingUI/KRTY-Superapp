import { AppIcon } from "@/components/app-icon"
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
    <main className="bg-background text-foreground min-h-dvh">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center gap-3">
          <AppIcon size={96} className="size-8 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col" translate="no">
            <span className="text-sm font-medium">Kretya Studio</span>
            {report.project?.name && (
              <span className="text-muted-foreground truncate text-[13px]">
                {report.project.name}
              </span>
            )}
          </div>
          <div className="-mr-2 flex shrink-0 items-center gap-1">
            <PageTranslator />
            <ThemeToggleButton />
          </div>
        </header>

        <div data-translate-root className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading text-2xl font-semibold tracking-tight text-balance">
              {report.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {day}
            </p>
          </div>

          {report.body.trim() ? (
            <Markdown images>{clientSafeMarkdown(report.body)}</Markdown>
          ) : (
            <p className="text-muted-foreground text-sm">{t("reportsEmpty")}</p>
          )}
        </div>
      </div>
    </main>
  )
}
