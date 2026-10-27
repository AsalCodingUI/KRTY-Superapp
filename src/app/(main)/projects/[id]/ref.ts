import { createClient } from "@/shared/api/supabase/server"
import { linkKey, projectHref, whereRef } from "@/shared/lib/url-params"
import { notFound, redirect } from "next/navigation"

export { projectHref as projectPath } from "@/shared/lib/url-params"

/**
 * The project a URL names (`milxa-7b583164`, or a full id from an older
 * link). Anything but the current key — an id, an old name — redirects to
 * it, keeping the section and query.
 */
export async function resolveProjectRef(
  ref: string,
  section: string,
  search: Record<string, string | string[] | undefined>,
) {
  const supabase = await createClient()
  const query = whereRef(supabase.from("projects").select("id, name"), ref)
  const { data: project } = query ? await query.maybeSingle() : { data: null }
  if (!project) notFound()
  const canonical = linkKey(project.name, project.id)
  if (ref !== canonical) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(search))
      for (const v of [value].flat()) if (v !== undefined) params.append(key, v)
    redirect(
      `${projectHref(project, section)}${params.size ? `?${params}` : ""}`,
    )
  }
  return project
}
