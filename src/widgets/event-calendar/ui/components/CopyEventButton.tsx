"use client"

import { Button } from "@/components/ui/button"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { logError } from "@/shared/lib/utils/logger"
import { RiFileCopyLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useState } from "react"
import type { CalendarEvent } from "../types"

interface CopyEventButtonProps {
  event: CalendarEvent
  className?: string
}

export function CopyEventButton({ event, className }: CopyEventButtonProps) {
  const t = useT("calendar")
  const dateLocale = useDateLocale()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const eventDetails = `
📅 ${event.title}
📍 ${event.location || t("copyNoLocation")}
🕐 ${format(event.start, "PPP p", { locale: dateLocale })} - ${format(event.end, "p", { locale: dateLocale })}
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
    <Button variant="outline" onClick={handleCopy} className={className}>
      <RiFileCopyLine data-icon="inline-start" />
      {copied ? t("copyCopied") : t("copyDetails")}
    </Button>
  )
}
