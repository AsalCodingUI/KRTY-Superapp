"use client"

import { Button } from "@/shared/ui"
import { RiCheckLine, RiCloseLine } from "@/shared/ui/lucide-icons"

interface ApprovalButtonsProps {
  requestId: number
  status: string
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

export function ApprovalButtons({
  requestId,
  status,
  onApprove,
  onReject,
}: ApprovalButtonsProps) {
  if (status !== "pending") return null

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="secondary"
        className="aspect-square p-1 text-foreground-danger hover:bg-surface-danger-light"
        title="Reject"
        onClick={() => onReject(requestId)}
      >
        <RiCloseLine className="size-4" />
      </Button>
      <Button
        variant="secondary"
        className="aspect-square p-1 text-foreground-success hover:bg-surface-success-light"
        title="Approve"
        onClick={() => onApprove(requestId)}
      >
        <RiCheckLine className="size-4" />
      </Button>
    </div>
  )
}
