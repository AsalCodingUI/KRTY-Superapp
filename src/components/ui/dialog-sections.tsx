import { cn } from "cn"
import * as React from "react"

/**
 * Single-surface dialog layout shared by Dialog and AlertDialog (Resend /
 * Perplexity style): a small title with the close button in the corner,
 * the content right under it, actions at the bottom. No bands, no dividers.
 */
/** On a phone every dialog is a sheet from the bottom edge: full width,
 *  rounded on top only, sliding up instead of zooming, with a grab handle
 *  centred on its top edge. */
export const dialogSheetOnMobileClassName =
  "max-sm:before:absolute max-sm:before:top-1.5 max-sm:before:left-1/2 max-sm:before:z-10 max-sm:before:h-1 max-sm:before:w-9 max-sm:before:-translate-x-1/2 max-sm:before:rounded-full max-sm:before:bg-foreground/20 max-sm:before:content-[''] max-sm:pt-2 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-none max-sm:max-h-[92svh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:pb-[env(safe-area-inset-bottom)] max-sm:duration-300 max-sm:ease-[cubic-bezier(0.32,0.72,0,1)] max-sm:data-open:zoom-in-100 max-sm:data-closed:zoom-out-100 max-sm:data-open:fade-in-100 max-sm:data-closed:fade-out-100 max-sm:data-open:slide-in-from-bottom max-sm:data-closed:slide-out-to-bottom"

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
