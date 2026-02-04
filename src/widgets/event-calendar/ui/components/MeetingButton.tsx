"use client"

import { Button } from "@/components/ui"
import { logError } from "@/shared/lib/utils/logger"
import { RiFileCopyLine, RiVideoOnLine } from "@remixicon/react"
import { useState } from "react"

interface MeetingButtonProps {
  meetingUrl: string
  className?: string
}

export function MeetingButton({ meetingUrl, className }: MeetingButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(meetingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logError("Failed to copy:", err)
    }
  }

  const handleJoin = () => {
    window.open(meetingUrl, "_blank")
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleJoin}
          className="bg-surface-brand hover:bg-surface-brand-hover text-primary-fg flex-1"
        >
          <RiVideoOnLine className="mr-2 h-4 w-4" />
          Join with Google Meet
        </Button>
        <button
          onClick={handleCopy}
          className="border-border-border hover:bg-muted rounded-lg border p-2 transition-colors"
          title="Copy meeting link"
        >
          <RiFileCopyLine className="text-content h-4 w-4" />
        </button>
      </div>

      {copied && (
        <p className="text-body-xs text-success mt-2">
          Link copied to clipboard!
        </p>
      )}

      <div className="mt-2">
        <p className="text-body-xs text-content-muted">
          Your group call will be limited to 1 hour
        </p>
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-xs text-primary break-all hover:underline"
        >
          {meetingUrl}
        </a>
      </div>
    </div>
  )
}
