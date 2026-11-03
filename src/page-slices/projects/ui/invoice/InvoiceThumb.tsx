"use client"

import { cn } from "@/lib/utils"
import type {
  AgencyProfile,
  PaymentSnapshot,
} from "@/entities/finance/lib/invoice"
import { useEffect, useRef, useState } from "react"
import {
  INVOICE_WIDTH,
  InvoiceDocument,
  type InvoiceDocumentData,
} from "./InvoiceDocument"

/**
 * The top of an invoice on a card, like a PDF's first page in the library:
 * the real document, scaled to the tile's width. Never interactive.
 */
export function InvoiceThumb({
  data,
  className,
  children,
}: {
  data: InvoiceDocumentData
  className?: string
  /** Chips over the tile (status, currency). */
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        "bg-muted pointer-events-none relative aspect-[16/10] overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
    >
      {/* Same paper inset as the library's PDF tiles. */}
      <div className="flex h-full justify-center px-[14%] pt-[9%]">
        <div
          ref={ref}
          className="h-full w-full overflow-hidden rounded-t-[4px] bg-white shadow-(--elev-3)"
        >
          {width > 0 && (
            <div
              style={{
                width: INVOICE_WIDTH,
                transform: `scale(${width / INVOICE_WIDTH})`,
                transformOrigin: "top left",
              }}
            >
              <InvoiceDocument data={data} />
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/** An invoice with nothing on it but this payment method (for its previews). */
export function paymentDocData(
  agency: AgencyProfile,
  payment: PaymentSnapshot,
  qrUrl?: string | null,
): InvoiceDocumentData {
  return {
    number: "",
    issueDate: "",
    dueDate: "",
    status: "Draft",
    currency: "IDR",
    agency,
    client: null,
    lines: [],
    schedule: [],
    termsNote: "",
    payment,
    qrUrl,
  }
}

/**
 * The bottom of an invoice (totals and the payment method), the paper's
 * foot resting on the tile's bottom edge, cut off at the top since the
 * rest of the page is above it. Never interactive.
 */
export function InvoiceBottom({
  data,
  className,
  paperClassName,
  children,
  visible,
}: {
  data: InvoiceDocumentData
  className?: string
  /** Inset of the paper inside the tile. */
  paperClassName?: string
  /** Chips over the tile. */
  children?: React.ReactNode
  /** Show this much of the page (design px) and size to it, instead of
   *  filling the tile's height. */
  visible?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const scale = width / INVOICE_WIDTH

  return (
    <div
      className={cn(
        "bg-muted pointer-events-none relative overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex h-full justify-center px-[5%] pb-[6%]",
          paperClassName,
        )}
      >
        <div
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-b-[4px] bg-white shadow-(--elev-3)",
            !visible && "h-full",
          )}
          style={visible ? { height: visible * scale } : undefined}
        >
          {width > 0 && (
            <div
              className="absolute bottom-0 left-0"
              style={{
                width: INVOICE_WIDTH,
                transform: `scale(${scale})`,
                transformOrigin: "bottom left",
              }}
            >
              <InvoiceDocument data={data} />
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
