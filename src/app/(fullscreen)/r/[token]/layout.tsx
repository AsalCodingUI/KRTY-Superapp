import { publicOrigin } from "@/shared/og/site"
import type { Metadata } from "next"

// The share cards next to this layout (opengraph-image, twitter-image)
// resolve against this segment's metadataBase, so it must be the public
// client host here, not only in the page (crawlers can't reach the app's
// VPN-only host). Next uses localhost for them in development.
export async function generateMetadata(): Promise<Metadata> {
  return { metadataBase: new URL(await publicOrigin()) }
}

export default function SharedReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
