import { cn } from "cn"
import * as React from "react"

/**
 * Clerk-style dialog layout shared by Dialog and AlertDialog: header and
 * footer sit on the muted shell, everything between them is a raised panel.
 * A confirm (header + footer only) puts the header in the panel instead.
 */
export const dialogShellClassName =
  "bg-dialog-shell text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100svh-4rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl text-sm shadow-2xl ring-1 duration-100 outline-none sm:max-w-[27.5rem]"

export const dialogPanelClassName =
  "bg-dialog-panel ring-foreground/10 flex min-h-0 flex-col gap-4 overflow-y-auto rounded-xl px-6 py-5 shadow-sm ring-1"

export function DialogSections({
  children,
  isHeader,
  isFooter,
}: {
  children: React.ReactNode
  isHeader: (el: React.ReactElement) => boolean
  isFooter: (el: React.ReactElement) => boolean
}) {
  // Fragments (e.g. `cond ? <>form + footer</> : ...`) count as their children.
  const flatten = (nodes: React.ReactNode): React.ReactNode[] =>
    React.Children.toArray(nodes).flatMap((node) =>
      React.isValidElement<{ children?: React.ReactNode }>(node) &&
      node.type === React.Fragment
        ? flatten(node.props.children)
        : [node],
    )
  const parts = flatten(children)
  const header = parts.filter((c) => React.isValidElement(c) && isHeader(c))
  const footer = parts.filter((c) => React.isValidElement(c) && isFooter(c))
  const body = parts.filter((c) => !header.includes(c) && !footer.includes(c))

  // Not built from header/body/footer: keep the content as written.
  if (header.length === 0 && footer.length === 0) {
    return <div className="flex min-h-0 flex-col gap-6 p-6">{body}</div>
  }

  const hasBody = body.length > 0
  return (
    <>
      {hasBody && header.length > 0 && (
        <div className="shrink-0 px-6 pt-5 pr-14 pb-4">{header}</div>
      )}
      {(hasBody || header.length > 0) && (
        <div
          data-slot="dialog-body"
          className={cn(dialogPanelClassName, !hasBody && "pr-14")}
        >
          {hasBody ? body : header}
        </div>
      )}
      {footer.length > 0 && (
        <div className="shrink-0 px-6 py-3.5">{footer}</div>
      )}
    </>
  )
}
