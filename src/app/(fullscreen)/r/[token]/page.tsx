import { AppIcon } from "@/components/app-icon"
import { PageTranslator } from "@/components/page-translator"
import { Markdown } from "@/components/markdown"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { clientSafeMarkdown } from "@/shared/lib/storage-proxy"
import { getDateLocale, getT } from "@/shared/i18n/server"
import { format, parseISO } from "date-fns"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { reportKey, reportTokensOf } from "@/shared/lib/portal-docs"

export const dynamic = "force-dynamic"

// A client link: never in search results, never shared further by previews.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type SharedReport = {
  share_token: string
  title: string
  body: string
  report_date: string
  updated_at: string
  project: { name: string } | null
  author: { full_name: string | null } | null
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
  if (!/^[A-Za-z0-9_-]{12,120}$/.test(key)) notFound()

  // `<project-name>-<token>`, or a bare token (older links).
  const { data } = await createAdminClient()
    .from("project_reports" as never)
    .select(
      "share_token, title, body, report_date, updated_at, project:projects ( name ), author:profiles!project_reports_author_id_fkey ( full_name )",
    )
    .in("share_token" as never, reportTokensOf(key) as never)
    .limit(1)
    .maybeSingle()
  const report = data as unknown as SharedReport | null
  if (!report) notFound()

  // A short token wears the project's current name (renamed → redirect).
  if (report.share_token.length === 12) {
    const correct = reportKey(report.project?.name, report.share_token)
    if (key !== correct) redirect(`/r/${correct}`)
  }

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
          <PageTranslator className="-mr-2 shrink-0" />
        </header>

        <div data-translate-root className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading text-2xl font-semibold tracking-tight text-balance">
              {report.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {[day, report.author?.full_name].filter(Boolean).join(" · ")}
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
