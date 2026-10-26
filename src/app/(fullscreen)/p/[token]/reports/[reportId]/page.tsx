import { redirect } from "next/navigation"

/** Old report links: reports open as a window over the list now. */
export default async function PortalReportPage({
  params,
}: {
  params: Promise<{ token: string; reportId: string }>
}) {
  const { token, reportId } = await params
  redirect(`/p/${token}/reports?report=${encodeURIComponent(reportId)}`)
}
