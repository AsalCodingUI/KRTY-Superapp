import { PortalShell } from "@/page-slices/projects/ui/portal/PortalShell"
import { portalKey } from "@/shared/lib/portal-docs"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale } from "@/shared/i18n/server"
import { ogLocale, publicOrigin, SITE_NAME } from "@/shared/og/site"
import { PinForm } from "./PinForm"
import { portalSession } from "./session"

export const dynamic = "force-dynamic"

// A client link: never in search results. A chat app's preview shows the
// project's name only (opengraph-image.tsx), on the public client host;
// the PIN screen a crawler gets is fine.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const [session, origin, locale] = await Promise.all([
    portalSession(token),
    publicOrigin(),
    getLocale(),
  ])
  const title = session
    ? `Client portal · ${session.project.name}`
    : SITE_NAME
  const description = session
    ? `${session.project.name}'s client portal at Kretya Studio.`
    : "A link shared by Kretya Studio."
  return {
    metadataBase: new URL(origin),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    title,
    description,
    ...(session && {
      alternates: {
        canonical: `/p/${portalKey(session.project.name, session.portal.token)}`,
      },
    }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      locale: ogLocale(locale),
    },
    twitter: { card: "summary_large_image", title, description },
  }
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
