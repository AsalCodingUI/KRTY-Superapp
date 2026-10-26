"use client"

import { SegmentedControl } from "@/components/segmented-control"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

type Audience = "all" | "employees" | "people"

const LINK_RE = /^(\/|https?:\/\/)/

/**
 * An admin's announcement to the team (send_announcement): to everyone,
 * employees, or picked people. "Penting" also puts it in the app banner
 * until each person reads it.
 */
export function AnnouncementDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("shell")
  const tc = useT("common")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [link, setLink] = useState("")
  const [urgent, setUrgent] = useState(false)
  const [audience, setAudience] = useState<Audience>("all")
  const [picked, setPicked] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  const { data: people = [] } = useQuery({
    queryKey: ["announcement-people"],
    enabled: open && audience === "people",
    queryFn: async () => {
      const { data } = await createClient()
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .order("full_name")
      return (data ?? []) as {
        id: string
        full_name: string | null
        avatar_url: string | null
        job_title: string | null
      }[]
    },
  })

  const badLink = link.trim() !== "" && !LINK_RE.test(link.trim())
  const canSend =
    title.trim() !== "" &&
    !badLink &&
    (audience !== "people" || picked.length > 0)

  const reset = () => {
    setTitle("")
    setMessage("")
    setLink("")
    setUrgent(false)
    setAudience("all")
    setPicked([])
  }

  const send = async () => {
    if (!canSend || sending) return
    setSending(true)
    const { data, error } = await createClient().rpc("send_announcement", {
      p_title: title.trim(),
      p_message: message.trim(),
      p_link: link.trim() || null,
      p_urgent: urgent,
      p_audience: audience,
      p_user_ids: audience === "people" ? picked : null,
    } as never)
    setSending(false)
    if (error) {
      toast.error(t("announcementFailed"))
      return
    }
    toast.success(t("announcementSent", { n: Number(data ?? 0) }))
    reset()
    onOpenChange(false)
  }

  const toggle = (id: string, on: boolean) =>
    setPicked((list) => (on ? [...list, id] : list.filter((x) => x !== id)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("announcementCompose")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-title">{t("announcementTitle")}</Label>
            <Input
              id="ann-title"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-message">{t("announcementMessage")}</Label>
            <Textarea
              id="ann-message"
              value={message}
              maxLength={500}
              className="max-h-40"
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-link">{t("announcementLink")}</Label>
            <Input
              id="ann-link"
              value={link}
              placeholder="/leave"
              aria-invalid={badLink || undefined}
              onChange={(e) => setLink(e.target.value)}
            />
            <p
              className={
                badLink
                  ? "text-destructive text-xs"
                  : "text-muted-foreground text-xs"
              }
            >
              {badLink ? t("announcementBadLink") : t("announcementLinkHint")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("announcementAudience")}</Label>
            <SegmentedControl
              value={audience}
              onChange={setAudience}
              items={[
                { value: "all", label: t("announcementAll") },
                { value: "employees", label: t("announcementEmployees") },
                { value: "people", label: t("announcementPeople") },
              ]}
            />
            {audience === "people" && (
              <div className="border-border flex max-h-48 flex-col overflow-y-auto rounded-lg border p-1">
                {people.map((p) => {
                  const name = p.full_name || "?"
                  return (
                    <label
                      key={p.id}
                      className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5"
                    >
                      <Checkbox
                        checked={picked.includes(p.id)}
                        onCheckedChange={(on) => toggle(p.id, Boolean(on))}
                      />
                      <Avatar className="size-6">
                        <AvatarImage src={p.avatar_url || undefined} alt="" />
                        <AvatarFallback className="text-[10px]">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {name}
                      </span>
                      {p.job_title && (
                        <span className="text-tertiary-foreground shrink-0 text-xs">
                          {p.job_title}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
            {audience === "people" && picked.length === 0 && (
              <p className="text-muted-foreground text-xs">
                {t("announcementPickPeople")}
              </p>
            )}
          </div>
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {t("announcementUrgentLabel")}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("announcementUrgentHint")}
              </span>
            </span>
            <Switch checked={urgent} onCheckedChange={setUrgent} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={send} disabled={!canSend || sending}>
            {sending && <Spinner data-icon="inline-start" />}
            {t("announcementSend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
