"use client"

import { Button } from "@/components/ui"
import { logError } from "@/shared/lib/utils/logger"
import { RiFileCopyLine } from "@remixicon/react"
import { format } from "date-fns"
import { useState } from "react"
import type { CalendarEvent } from "../types"

interface CopyEventButtonProps {
  event: CalendarEvent
  className?: string
}

export function CopyEventButton({ event, className }: CopyEventButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const eventDetails = `
📅 ${event.title}
📍 ${event.location || "No location"}
🕐 ${format(event.start, "PPP p")} - ${format(event.end, "p")}
${event.description ? `\n📝 ${event.description}` : ""}
${event.meetingUrl ? `\n🔗 ${event.meetingUrl}` : ""}
        `.trim()

    try {
      await navigator.clipboard.writeText(eventDetails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logError("Failed to copy:", err)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      <RiFileCopyLine className="mr-2 h-4 w-4" />
      {copied ? "Copied!" : "Copy Details"}
    </Button>
  )
}
