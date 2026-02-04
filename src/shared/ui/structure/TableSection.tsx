import { cx } from "@/shared/lib/utils"
import React from "react"

interface TableSectionProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * TableSection - Consistent wrapper for all tables
 *
 * Provides standardized outer border, header, and layout for tables.
 * Based on Attendance History design pattern.
 *
 * @example
 * <TableSection title="Team Members" description="Manage your team">
 *   <Table>...</Table>
 * </TableSection>
 */
export function TableSection({
  title,
  description,
  actions,
  children,
  className,
}: TableSectionProps) {
  const hasHeader = Boolean(title || actions)

  return (
    <div className={cx("rounded-lg", "bg-surface dark:bg-surface", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between py-3">
          {title && (
            <div>
              <h3 className="text-content dark:text-content font-semibold">
                {title}
              </h3>
              {description && (
                <p className="text-body-sm text-content-subtle dark:text-content-placeholder mt-0.5">
                  {description}
                </p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {/* Content area - no extra padding, let children control their layout */}
      {children}
    </div>
  )
}

export type { TableSectionProps }
