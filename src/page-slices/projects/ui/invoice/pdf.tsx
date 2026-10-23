"use client"

import { createClient } from "@/shared/api/supabase/client"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { FINANCE_BUCKET } from "./data"
import {
  INVOICE_WIDTH,
  InvoiceDocument,
  type InvoiceDocumentData,
} from "./InvoiceDocument"

/** A4 in millimetres. */
const A4 = { width: 210, height: 297 }

/** Signed URL for a payment method's QR (private bucket), or null. */
export async function signQr(path: string | null | undefined) {
  if (!path) return null
  const { data } = await createClient()
    .storage.from(FINANCE_BUCKET)
    .createSignedUrl(path, 60 * 10)
  return data?.signedUrl ?? null
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Draws the invoice off screen and saves it as an A4 PDF, in one click: no
 * print dialog, no new tab. The page is a high-resolution picture of the
 * template (exactly what the preview shows).
 */
export async function downloadInvoicePdf(
  data: InvoiceDocumentData,
  fileName: string,
) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ])

  const host = document.createElement("div")
  host.style.cssText = `position:fixed;left:-${INVOICE_WIDTH * 2}px;top:0;width:${INVOICE_WIDTH}px;pointer-events:none;`
  document.body.appendChild(host)
  const root = createRoot(host)
  try {
    flushSync(() => root.render(<InvoiceDocument data={data} />))
    const page = host.firstElementChild as HTMLElement
    // Fonts and the logo / QR images must be in before the snapshot.
    await document.fonts.ready
    await Promise.all(
      Array.from(page.querySelectorAll("img")).map((img) =>
        img.decode().catch(() => undefined),
      ),
    )
    await nextFrame()

    const height = page.offsetHeight
    const image = await toJpeg(page, {
      pixelRatio: 2.5,
      quality: 0.95,
      backgroundColor: "#ffffff",
      width: INVOICE_WIDTH,
      height,
    })
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true })
    const scale = Math.min(A4.width / INVOICE_WIDTH, A4.height / height)
    const w = INVOICE_WIDTH * scale
    const h = height * scale
    pdf.addImage(image, "JPEG", (A4.width - w) / 2, 0, w, h)
    pdf.setProperties({ title: fileName })
    pdf.save(`${fileName.replace(/[\\/:*?"<>|]/g, "-")}.pdf`)
  } finally {
    root.unmount()
    host.remove()
  }
}
