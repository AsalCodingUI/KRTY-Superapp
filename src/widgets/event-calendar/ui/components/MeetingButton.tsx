"use client"

import { Button } from "@/components/ui/button"
import { useT } from "@/shared/i18n/client"
import { logError } from "@/shared/lib/utils/logger"
import { RiFileCopyLine, RiVideoOnLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"

interface MeetingButtonProps {
  meetingUrl: string
  className?: string
}

export function MeetingButton({ meetingUrl, className }: MeetingButtonProps) {
  const t = useT("calendar")
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
        >
          <RiVideoOnLine data-icon="inline-start" />
          {t("meetingJoin")}
        </Button>
        <button
          onClick={handleCopy}
          className="hover:bg-muted bg-foreground/[0.03] rounded-lg p-2 transition-colors"
          title={t("meetingCopyLink")}
        >
          <RiFileCopyLine className="text-foreground h-4 w-4" />
        </button>
      </div>

      {copied && (
        <p className="text-success-ink mt-2 text-xs">
          {t("meetingLinkCopied")}
        </p>
      )}

      <div className="mt-2">
        <p className="text-tertiary-foreground text-xs">
          {t("meetingDurationNote")}
        </p>
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-xs break-all hover:underline"
        >
          {meetingUrl}
        </a>
      </div>
    </div>
  )
}
