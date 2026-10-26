import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"
import { portalKey } from "@/shared/lib/portal-docs"

export type PortalProject = {
  id: string
  name: string
  status: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  client_name: string | null
}

/**
 * The portal behind a link and its project, and whether this browser has
 * opened it with the current PIN. Once per request (layout and page both
 * ask); every page checks `signedIn` itself, since a page can be fetched
 * without its layout.
 */
export const portalSession = cache(async (token: string) => {
  const portal = await portalByToken(token)
  if (!portal) return null
  const { data } = await createAdminClient()
    .from("projects")
    .select("id, name, status, start_date, end_date, description, client_name")
    .eq("id", portal.project_id)
    .maybeSingle()
  if (!data) return null
  return {
    portal,
    project: data as PortalProject,
    signedIn: await isPortalSignedIn(portal),
  }
})

/**
 * A portal page's session, after putting the link right: a stale name in
 * it (the project was renamed) redirects to `/p/<name>-<code><section>`,
 * keeping the query.
 */
export async function portalPage(
  key: string,
  section: string,
  search?: Record<string, string | string[] | undefined>,
) {
  const session = await portalSession(key)
  if (!session) notFound()
  const correct = portalKey(session.project.name, session.portal.token)
  if (key !== correct) {
    const query = new URLSearchParams(
      Object.entries(search ?? {}).flatMap(([k, v]) =>
        v === undefined ? [] : [[k, Array.isArray(v) ? v[0] : v]],
      ),
    ).toString()
    redirect(`/p/${correct}${section}${query ? `?${query}` : ""}`)
  }
  return session
}
