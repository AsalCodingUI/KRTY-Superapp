"use client"

import { RiCheckLine, RiCloseLine, RiTimeLine } from "@remixicon/react"
import { Badge } from "@/shared/ui";

interface LeaveStatusProps {
    status: 'pending' | 'approved' | 'rejected'
    showIcon?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function LeaveStatus({ status, showIcon = true, size = 'md' }: LeaveStatusProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved':
                return {
                    variant: 'success' as const,
                    icon: RiCheckLine,
                    label: 'Approved'
                }
            case 'rejected':
                return {
                    variant: 'error' as const,
                    icon: RiCloseLine,
                    label: 'Rejected'
                }
            case 'pending':
                return {
                    variant: 'warning' as const,
                    icon: RiTimeLine,
                    label: 'Pending'
                }
            default:
                return {
                    variant: 'zinc' as const,
                    icon: RiTimeLine,
                    label: status
                }
        }
    }

    const config = getStatusConfig(status)
    const Icon = config.icon

    const iconSizeClass = {
        sm: 'size-3',
        md: 'size-4',
        lg: 'size-5'
    }[size]

    return (
        <Badge variant={config.variant}>
            {showIcon && <Icon className={iconSizeClass} />}
            <span>{config.label}</span>
        </Badge>
    )
}
