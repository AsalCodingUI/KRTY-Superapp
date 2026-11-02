import { renderShareCard } from "@/shared/og/card"
import { portalSession } from "./session"

/*
 * The share card of a client portal (opengraph-image.tsx, twitter-image.tsx):
 * the project's name and nothing else (no phases, no reports), or the
 * studio's own card for an unknown link.
 */

type Params = { token: string } | Promise<{ token: string }>


export async function portalCardImage({ params }: { params: Params }) {
  const session = await portalSession((await params).token)
  return renderShareCard(
    session
      ? { kind: "portal", project: session.project.name }
      : { kind: "studio" },
  )
}
