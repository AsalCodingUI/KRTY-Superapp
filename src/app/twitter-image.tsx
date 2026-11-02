import { renderShareCard } from "@/shared/og/card"

// The studio's card for any link without its own (the app, sign-in).
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Kretya Studio"

export default function Image() {
  return renderShareCard({ kind: "studio" })
}
