import * as React from "react"

import { cn } from "@/lib/utils"

interface TableSectionProps {
  title?: React.ReactNode
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  contentClassName?: string
}

/**
 * TableSection - Consistent wrapper for all tables
 *
 * Provides a standardized (borderless) header and layout for tables.
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
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
}: TableSectionProps) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <div
      data-slot="table-section"
      className={cn("text-card-foreground flex flex-col gap-1", className)}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex min-h-8 items-center justify-between gap-4 pb-1",
            headerClassName,
          )}
        >
          {title && (
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-foreground text-sm font-medium",
                  titleClassName,
                )}
              >
                {title}
              </h3>
              {description && (
                <p
                  className={cn(
                    "text-tertiary-foreground mt-1 text-sm",
                    descriptionClassName,
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {/* Content area - no extra padding, let children control their layout */}
      {contentClassName ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  )
}

export type { TableSectionProps }
