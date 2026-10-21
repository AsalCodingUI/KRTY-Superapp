import { cn } from "@/lib/utils"
import { CircleCheck, CircleDashed, CircleX } from "lucide-react"

/** Linear-style status glyph for leave requests. */
export function LeaveStatusIcon({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const Icon =
    status === "approved"
      ? CircleCheck
      : status === "rejected"
        ? CircleX
        : CircleDashed
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-4 shrink-0",
        status === "approved" && "text-success",
        status === "rejected" && "text-destructive",
        status === "pending" && "text-warning",
        className,
      )}
    />
  )
}
