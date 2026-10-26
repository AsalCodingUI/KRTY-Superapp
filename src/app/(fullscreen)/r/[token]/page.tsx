import { AppIcon } from "@/components/app-icon"
import { Markdown } from "@/components/markdown"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { getDateLocale, getT } from "@/shared/i18n/server"
import { format, parseISO } from "date-fns"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

// A client link: never in search results, never shared further by previews.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type SharedReport = {
  title: string
  body: string
  report_date: string
  updated_at: string
  project: { name: string } | null
  author: { full_name: string | null } | null
}

/**
 * One project report shared with a client (/r/<token>), read-only and
 * without an account. Read server-side by its token, so nothing else of
 * the project is reachable; turning the link off makes this a 404.
 */
export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound()

  const { data } = await createAdminClient()
    .from("project_reports" as never)
    .select(
      "title, body, report_date, updated_at, project:projects ( name ), author:profiles!project_reports_author_id_fkey ( full_name )",
    )
    .eq("share_token" as never, token as never)
    .maybeSingle()
  const report = data as unknown as SharedReport | null
  if (!report) notFound()

  const [t, locale] = await Promise.all([getT("projects"), getDateLocale()])
  const day = format(parseISO(report.report_date), "d MMMM yyyy", { locale })

  return (
    <main className="bg-background text-foreground min-h-dvh">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center gap-3">
          <AppIcon size={96} className="size-8 rounded-lg" />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium">Kretya Studio</span>
            {report.project?.name && (
              <span className="text-muted-foreground truncate text-[13px]">
                {report.project.name}
              </span>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-2">
          <h1 className="text-heading text-2xl font-semibold tracking-tight text-balance">
            {report.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {[day, report.author?.full_name].filter(Boolean).join(" · ")}
          </p>
        </div>

        {report.body.trim() ? (
          <Markdown images>{report.body}</Markdown>
        ) : (
          <p className="text-muted-foreground text-sm">{t("reportsEmpty")}</p>
        )}
      </div>
    </main>
  )
}
