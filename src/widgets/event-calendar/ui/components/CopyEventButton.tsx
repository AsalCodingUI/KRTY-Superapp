"use client"

import { Button } from "@/components/ui/button"
import { logError } from "@/shared/lib/utils/logger"
import { RiFileCopyLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id } from "date-fns/locale"
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
📍 ${event.location || "Tidak ada lokasi"}
🕐 ${format(event.start, "PPP p", { locale: id })} - ${format(event.end, "p", { locale: id })}
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
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      <RiFileCopyLine className="mr-2 h-4 w-4" />
      {copied ? "Tersalin!" : "Salin Detail"}
    </Button>
  )
}
