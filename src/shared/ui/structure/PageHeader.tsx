"use client"

import { cx } from '@/shared/lib/utils'
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
    backButton
}: PageHeaderProps) {
    return (
        <div className={cx("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div className="flex items-center gap-2 max-w-2xl">
                {backButton}
                <div>
                    <h1 className="text-xl font-semibold text-content">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-content-subtle">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    )
}
