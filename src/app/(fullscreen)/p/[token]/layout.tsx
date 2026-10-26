import { PortalShell } from "@/page-slices/projects/ui/portal/PortalShell"
import { portalKey } from "@/shared/lib/portal-docs"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PinForm } from "./PinForm"
import { portalSession } from "./session"

export const dynamic = "force-dynamic"

// A client link: never in search results, never shared further by previews.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

/**
 * A project's client portal (/p/<name>-<code>): the PIN first, then the app's own
 * chrome (sidebar, page sheet) around the few pages a client may open.
 */
export default async function ClientPortalLayout({
  params,
  children,
}: {
  params: Promise<{ token: string }>
  children: React.ReactNode
}) {
  const { token } = await params
  const session = await portalSession(token)
  if (!session) notFound()
  const { project } = session
  if (!session.signedIn) {
    return <PinForm token={token} projectName={project.name} />
  }
  return (
    <PortalShell
      // The link with the project's current name (pages fix a stale one).
      token={portalKey(project.name, session.portal.token)}
      project={{
        id: project.id,
        name: project.name,
        status: project.status,
      }}
    >
      {children}
    </PortalShell>
  )
}
