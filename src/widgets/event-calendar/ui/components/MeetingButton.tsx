"use client"

import { Button } from "@/components/ui/button"
import { logError } from "@/shared/lib/utils/logger"
import { RiFileCopyLine, RiVideoOnLine } from "@/shared/ui/lucide-icons"
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
          size="sm"
          onClick={handleJoin}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
        >
          <RiVideoOnLine className="mr-2 h-4 w-4" />
          Gabung via Google Meet
        </Button>
        <button
          onClick={handleCopy}
          className="border-border hover:bg-muted rounded-lg border p-2 transition-colors"
          title="Salin tautan meeting"
        >
          <RiFileCopyLine className="text-foreground h-4 w-4" />
        </button>
      </div>

      {copied && (
        <p className="text-body-xs text-success mt-2">
          Tautan berhasil disalin!
        </p>
      )}

      <div className="mt-2">
        <p className="text-body-xs text-muted-foreground/70">
          Durasi panggilan grup dibatasi 1 jam
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
