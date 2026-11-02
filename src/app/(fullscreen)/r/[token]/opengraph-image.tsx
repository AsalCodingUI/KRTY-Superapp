import { reportCardImage, reportCardMetadata } from "./share-card"

// The link preview of a shared report (see share-card.ts).
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type Props = { params: { token: string } | Promise<{ token: string }> }

export async function generateImageMetadata(props: Props) {
  return reportCardMetadata(props)
}

export default async function Image(props: Props) {
  return reportCardImage(props)
}
