// Tremor Raw Table [v0.0.2]

import React from "react"

import { cx } from "@/shared/lib/utils"

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
>(({ className, noBorder, ...props }, forwardedRef) => {
  void noBorder
  return (
    <div className="overflow-hidden">
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
  )
})

Table.displayName = "Table"

const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    hideHeader?: boolean
  }
>(({ className, hideHeader, children, ...props }, forwardedRef) => {
  if (hideHeader) return null
  return (
    <thead ref={forwardedRef} className={cx(className)} {...props}>
      {children}
    </thead>
  )
})

TableHead.displayName = "TableHead"

const TableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { disabled?: boolean }
>(({ className, disabled, ...props }, forwardedRef) => (
  <th
    ref={forwardedRef}
    className={cx(
      // base
      "text-label-sm border-b px-xl py-lg text-left whitespace-nowrap align-middle",
      "h-10",
      // text color
      disabled ? "text-foreground-disable" : "text-foreground-secondary",
      // background color
      "bg-surface-neutral-primary",
      // border color
      "border-neutral-primary",
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
      "divide-border-neutral-primary",
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
      "h-[40px] bg-surface-neutral-primary",
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
      "text-body-sm px-xl py-lg whitespace-nowrap overflow-hidden text-ellipsis align-middle",
      "h-10 max-h-10",
      // text color
      "text-foreground-primary",
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
      "text-body-sm mt-3 px-3 text-center",
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
  TableRow,
}
