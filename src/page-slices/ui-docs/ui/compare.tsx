"use client"

import type { ReactNode } from "react"

/** A "Sebelum / Sesudah" pair for the /ui tabs: the old classes left, the
 *  app's tokens right. */
export function BeforeAfter({
  label,
  before,
  after,
}: {
  label: string
  before: ReactNode
  after: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">{label}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Sebelum", before],
            ["Sesudah", after],
          ] as const
        ).map(([title, node]) => (
          <div key={title} className="flex flex-col gap-2">
            <span className="text-tertiary-foreground text-meta">{title}</span>
            <div className="border-border flex flex-wrap items-start gap-3 rounded-xl border border-dashed p-5">
              {node}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
