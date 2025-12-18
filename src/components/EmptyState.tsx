import { Button } from "@/components/Button"
import { RiHammerLine } from "@remixicon/react"
import React from "react"

interface EmptyStateProps {
    title: string
    description: string
    subtitle?: string
    icon?: React.ReactNode
    action?: {
        label: string
        onClick: () => void
    }
    variant?: "default" | "compact"
}

export function EmptyState({
    title,
    description,
    subtitle,
    icon,
    action,
    variant = "default"
}: EmptyStateProps) {
    const isCompact = variant === "compact"

    return (
        <div className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed border p-10 text-center dark:border ${isCompact ? 'h-auto py-8' : 'h-[400px]'}`}>
            {icon !== null && (
                <div className="flex items-center justify-center">
                    {icon || <RiHammerLine className="size-6 text-content dark:text-content" />}
                </div>
            )}
            <h3 className={`${icon !== null ? 'mt-4' : ''} text-lg font-semibold text-content dark:text-content`}>
                {title}
            </h3>
            <p className="mt-2 text-sm text-content-subtle dark:text-content-placeholder max-w-sm">
                {description}
            </p>
            {subtitle && (
                <p className="mt-1 text-xs text-content-placeholder dark:text-content-subtle max-w-sm opacity-70">
                    {subtitle}
                </p>
            )}
            {action && (
                <Button variant="secondary" className="mt-6" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    )
}