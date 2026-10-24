import { cn } from "cn"
import * as React from "react"

/**
 * Single-surface dialog layout shared by Dialog and AlertDialog (Resend /
 * Perplexity style): a small title with the close button in the corner,
 * the content right under it, actions at the bottom. No bands, no dividers.
 */
export const dialogShellClassName =
  "bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-96 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-96 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100svh-4rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl text-sm duration-250 outline-none sm:max-w-[27.5rem] shadow-(--elev-5) ease-out"

// The body scrolls, so it keeps 4px below its last field (and nested scroll
// wrappers get 4px all round) so focus rings are not clipped by the overflow.
export const dialogPanelClassName =
  "flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-1 [&>.overflow-auto]:-m-1 [&>.overflow-auto]:p-1 [&>.overflow-y-auto]:-m-1 [&>.overflow-y-auto]:p-1"

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
    return <div className="flex min-h-0 flex-col gap-5 p-5">{body}</div>
  }

  return (
    <>
      {header.length > 0 && (
        <div className="shrink-0 px-5 pt-5 pr-12">{header}</div>
      )}
      {body.length > 0 && (
        <div
          data-slot="dialog-body"
          className={cn(dialogPanelClassName, header.length === 0 && "pt-5")}
        >
          {body}
        </div>
      )}
      <div
        className={cn(
          "shrink-0 px-5 pb-5",
          footer.length > 0 ? "pt-4" : "pt-0",
        )}
      >
        {footer}
      </div>
    </>
  )
}
