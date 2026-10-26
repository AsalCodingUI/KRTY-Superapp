/** A quiet section heading inside a page, with an optional count. */
export function SectionTitle({
  children,
  extra,
  actions,
}: {
  children: React.ReactNode
  extra?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-6 pb-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-foreground text-sm">{children}</h2>
        {extra != null && (
          <span className="text-tertiary-foreground text-[13px] tabular-nums">
            {extra}
          </span>
        )}
      </div>
      {actions}
    </div>
  )
}
