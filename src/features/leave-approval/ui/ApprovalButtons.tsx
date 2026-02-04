"use client"

import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { Button } from "@/shared/ui";

interface ApprovalButtonsProps {
    requestId: number
    status: string
    onApprove: (id: number) => void
    onReject: (id: number) => void
}

export function ApprovalButtons({ requestId, status, onApprove, onReject }: ApprovalButtonsProps) {
    if (status !== 'pending') return null

    return (
        <div className="flex justify-end gap-2">
            <Button
                variant="secondary"
                className="p-1 aspect-square text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20"
                title="Reject"
                onClick={() => onReject(requestId)}
            >
                <RiCloseLine className="size-4" />
            </Button>
            <Button
                variant="secondary"
                className="p-1 aspect-square text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/20"
                title="Approve"
                onClick={() => onApprove(requestId)}
            >
                <RiCheckLine className="size-4" />
            </Button>
        </div>
    )
}
