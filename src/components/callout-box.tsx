import { cn } from "@/lib/utils"
import type { CalloutTone } from "@/shared/lib/doc-blocks"
import {
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"

/** Each tone's icon and tint (Radix scales, so dark mode follows). */
export const CALLOUT_STYLE: Record<
  CalloutTone,
  { icon: LucideIcon; box: string; ink: string }
> = {
  info: { icon: Info, box: "bg-blue-2 border-blue-4", ink: "text-blue-11" },
  success: {
    icon: CircleCheck,
    box: "bg-green-2 border-green-4",
    ink: "text-green-11",
  },
  warning: {
    icon: TriangleAlert,
    box: "bg-amber-2 border-amber-5",
    ink: "text-amber-11",
  },
  danger: {
    icon: OctagonAlert,
    box: "bg-red-2 border-red-4",
    ink: "text-red-11",
  },
}

/**
 * A callout's blocks, tight: no outer margins, ~6px between blocks (a bold
 * or heading line sits right on what follows), lists indented just enough
 * for their bullets to hang under the text. `&>*` are the blocks from
 * `<Markdown>`; the editor's sit two wrappers down (NodeViewContent).
 */
export const CALLOUT_BODY = cn(
  "[&>*]:my-1.5! [&>*:first-child]:mt-0! [&>*:last-child]:mb-0!",
  "[&>[data-node-view-content]>*>*]:my-1.5! [&>[data-node-view-content]>*>*:first-child]:mt-0! [&>[data-node-view-content]>*>*:last-child]:mb-0!",
  "[&_ol]:pl-[1.25em]! [&_ul]:pl-[1.25em]! [&_li]:pl-0.5! [&_li>p]:my-0! [&_ol]:space-y-0.5! [&_ul]:space-y-0.5! [&_li_ol]:my-0.5! [&_li_ul]:my-0.5!",
)

/**
 * A callout (see shared/lib/doc-blocks): a tinted box with its tone's
 * icon. Used by the editor and by `<Markdown>`, so both read the same; the
 * editor passes its own `icon` (the tone menu).
 */
export function CalloutBox({
  tone,
  icon,
  className,
  children,
}: {
  tone: CalloutTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  const style = CALLOUT_STYLE[tone] ?? CALLOUT_STYLE.info
  const Icon = style.icon
  return (
    <div
      data-callout={tone}
      className={cn(
        "my-4 flex gap-3 rounded-xl border py-3 pr-4 pl-3.5",
        style.box,
        className,
      )}
    >
      <div
        className={cn("flex h-7 shrink-0 items-center", style.ink)}
        contentEditable={false}
      >
        {icon ?? <Icon className="size-[18px]" aria-hidden />}
      </div>
      <div className={cn("min-w-0 flex-1", CALLOUT_BODY)}>
        {children}
      </div>
    </div>
  )
}
