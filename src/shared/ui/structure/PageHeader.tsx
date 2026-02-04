"use client"

import { cx } from "@/shared/lib/utils"
import React from "react"

interface PageHeaderProps {
  /** Main title of the page */
  title: string
  /** Optional description below the title */
  description?: string
  /** Optional actions (buttons, filters, etc.) to display on the right */
  actions?: React.ReactNode
  /** Additional className for the container */
  className?: string
  /** Show a back button (optional) */
  backButton?: React.ReactNode
}

/**
 * PageHeader - A consistent header component for pages
 *
 * @example
 * <PageHeader
 *   title="Leave Management"
 *   description="Manage employee leave requests"
 *   actions={<Button>Request Leave</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  backButton,
}: PageHeaderProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex max-w-2xl items-center gap-2">
        {backButton}
        <div>
          <h1 className="text-heading-lg text-content">{title}</h1>
          {description && (
            <p className="text-body-sm text-content-subtle mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
