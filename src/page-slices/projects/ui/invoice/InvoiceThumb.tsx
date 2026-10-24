"use client"

import { cn } from "@/lib/utils"
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
