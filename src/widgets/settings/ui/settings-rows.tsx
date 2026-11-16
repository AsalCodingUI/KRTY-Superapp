import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/** One setting: what it is (and a line on it), its control on the right. */
export function Row({
  label,
  hint,
  children,
  disabled,
}: {
  label: ReactNode
  hint?: ReactNode
  children?: ReactNode
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "border-border flex min-h-16 items-center gap-4 border-b py-3 last:border-b-0",
        disabled && "opacity-50",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">{label}</span>
        {hint && (
          <span className="text-muted-foreground text-meta leading-5">
            {hint}
          </span>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center">{children}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-meta mt-8 mb-1 font-medium first:mt-0">
      {children}
    </h3>
  )
}
