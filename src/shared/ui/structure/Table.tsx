// Tremor Raw Table [v0.0.2]

import React from "react"

import { cx } from '@/shared/lib/utils'

/**
 * Root container for Table. Enables scrolling on small screens.
 */
const TableRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, forwardedRef) => (
  <div
    ref={forwardedRef}
  // Activate if table is used in a float environment
  // className="flow-root"
  >
    <div
      // make table scrollable on mobile
      className={cx("w-full overflow-auto whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </div>
  </div>
))

TableRoot.displayName = "TableRoot"

/**
 * Table component.
 * 
 * @example
 * ```tsx
 * <Table>
 *   <TableHead>
 *     <TableRow>
 *       <TableHeaderCell>Header</TableHeaderCell>
 *     </TableRow>
 *   </TableHead>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Data</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement> & { noBorder?: boolean }
>(({ className, noBorder, ...props }, forwardedRef) => (
  <div className={cx(
    "overflow-hidden",
    !noBorder && "rounded-md border border-border"
  )}>
    <table
      ref={forwardedRef}
      className={cx(
        // base
        "w-full caption-bottom",
        className,
      )}
      {...props}
    />
  </div>
))

Table.displayName = "Table"

const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    hideHeader?: boolean
  }
>(({ className, hideHeader, children, ...props }, forwardedRef) => {
  if (hideHeader) return null
  return <thead ref={forwardedRef} className={cx(className)} {...props}>{children}</thead>
})

TableHead.displayName = "TableHead"

const TableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, forwardedRef) => (
  <th
    ref={forwardedRef}
    className={cx(
      // base
      "border-b px-4 py-2.5 text-left text-xs font-medium",
      // text color
      "text-content-subtle dark:text-content-subtle",
      // background color
      "bg-muted/50 dark:bg-surface",
      // border color
      "border-border",
      className,
    )}
    {...props}
  />
))

TableHeaderCell.displayName = "TableHeaderCell"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, forwardedRef) => (
  <tbody
    ref={forwardedRef}
    className={cx(
      // base
      "divide-y",
      // divide color
      "divide-border",
      className,
    )}
    {...props}
  />
))

TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, forwardedRef) => (
  <tr
    ref={forwardedRef}
    className={cx(
      // base  
      "h-[40px]",
      "[&_td:last-child]:pr-4 [&_th:last-child]:pr-4",
      "[&_td:first-child]:pl-4 [&_th:first-child]:pl-4",
      className,
    )}
    {...props}
  />
))

TableRow.displayName = "TableRow"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, forwardedRef) => (
  <td
    ref={forwardedRef}
    className={cx(
      // base
      "px-4 py-2.5 text-sm",
      // text color
      "text-content-subtle dark:text-content-placeholder",
      className,
    )}
    {...props}
  />
))

TableCell.displayName = "TableCell"

const TableFoot = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, forwardedRef) => {
  return (
    <tfoot
      ref={forwardedRef}
      className={cx(
        // base
        "border-t text-left font-medium",
        // text color
        "text-content dark:text-content",
        // border color
        "border-border",
        className,
      )}
      {...props}
    />
  )
})

TableFoot.displayName = "TableFoot"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, forwardedRef) => (
  <caption
    ref={forwardedRef}
    className={cx(
      // base
      "mt-3 px-3 text-center text-sm",
      // text color
      "text-content-subtle dark:text-content-subtle",
      className,
    )}
    {...props}
  />
))

TableCaption.displayName = "TableCaption"

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow
}

