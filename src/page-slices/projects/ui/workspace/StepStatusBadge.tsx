import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

/** A process step's state: done → success, open → secondary. Shared by the
 *  project's process panel and the client portal so both read the same. */
export function StepStatusBadge({
  done,
  children,
}: {
  done: boolean
  children: ReactNode
}) {
  return <Badge variant={done ? "success" : "secondary"}>{children}</Badge>
}
