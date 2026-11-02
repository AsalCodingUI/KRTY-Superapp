import { CARD_SIZE, CARD_TYPE, renderShareCard, THUMB } from "@/shared/og/card"
import { cardThumbnail } from "@/shared/og/thumbnail"
import {
  firstMarkdownImage,
  markdownHeadings,
} from "@/shared/lib/og-text"
import { clientSafeMarkdown } from "@/shared/lib/storage-proxy"
import { format, parseISO } from "date-fns"
import { enUS } from "date-fns/locale"
import { sharedReport } from "./shared-report"

/*
 * The share card of /r/<key> (opengraph-image.tsx and twitter-image.tsx).
 * Its id is the report's last edit, so the card's URL changes with every
 * edit and chat apps fetch it again. An unknown or unshared link gets the
 * studio's own card, with nothing of any report.
 */

type Params = { token: string } | Promise<{ token: string }>

export async function reportCardMetadata({ params }: { params: Params }) {
  const report = await sharedReport((await params).token)
  if (!report) {
    return [
      { id: "card", size: CARD_SIZE, contentType: CARD_TYPE, alt: "Kretya Studio" },
    ]
  }
  const version = Math.floor(new Date(report.updated_at).getTime() / 1000)
  const project = report.project?.name
  return [
    {
      id: `v${Number.isFinite(version) ? version : 0}`,
      size: CARD_SIZE,
      contentType: CARD_TYPE,
      alt: `${report.title}${project ? ` · ${project}` : ""} · Kretya Studio`,
    },
  ]
}

export async function reportCardImage({ params }: { params: Params }) {
  const report = await sharedReport((await params).token)
  if (!report) return renderShareCard({ kind: "studio" })
  const body = clientSafeMarkdown(report.body)
  const picture = firstMarkdownImage(body)
  const [thumbnail, thumbnailLow] = await Promise.all([
    cardThumbnail(picture, THUMB),
    cardThumbnail(picture, THUMB, 0.5),
  ])
  return renderShareCard({
    kind: "report",
    project: report.project?.name ?? null,
    title: report.title,
    date: format(parseISO(report.report_date), "d MMM yyyy", { locale: enUS }),
    headings: markdownHeadings(body, 4),
    thumbnail,
    thumbnailLow,
  })
}
