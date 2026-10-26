"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { surfaceClassName } from "@/components/panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiFileCopyLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNowStrict } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import { clientUrl } from "@/shared/lib/client-site"
import { portalKey } from "@/shared/lib/portal-docs"
import { supabase } from "./data"

type PortalRow = {
  token: string
  last_seen_at: string | null
  locked_until: string | null
}

const randomPin = () =>
  String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(
    6,
    "0",
  )

/**
 * The project's client portal in Settings: turn it on with a 6-digit PIN,
 * copy the link and PIN for the client, change the PIN (signs the client
 * out) or turn it off (the link stops working). The PIN is only shown
 * right after it's set; it's stored hashed.
 */
export function ClientPortalCard({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const key = ["project-portal", projectId]
  const { data: portal, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_portals" as never)
        .select("token, last_seen_at, locked_until")
        .eq("project_id" as never, projectId as never)
        .maybeSingle()
      return (data as PortalRow | null) ?? null
    },
  })
  const [pinDialog, setPinDialog] = useState(false)
  const [pin, setPin] = useState("")
  const [saving, setSaving] = useState(false)
  // The PIN just set, shown once so it can be passed on.
  const [fresh, setFresh] = useState<{ link: string; pin: string } | null>(null)
  const [disabling, setDisabling] = useState(false)

  // The readable link: /p/<project-name>-<code>.
  // On the public client site (no VPN needed).
  const link = (code: string) => clientUrl(`/p/${portalKey(projectName, code)}`)
  const invite = (l: string, p: string) =>
    t("portalInviteText", { name: projectName, link: l, pin: p })

  // Safari refuses a copy that isn't straight from a click (after an
  // awaited save): the PIN stays on the card to copy by hand then.
  const copy = (text: string, message = t("reportLinkCopied")) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(message))
      .catch(() => {})

  const save = async () => {
    if (!/^\d{6}$/.test(pin) || saving) return
    setSaving(true)
    const { data, error } = await supabase().rpc(
      "set_project_portal" as never,
      { p_project_id: projectId, p_pin: pin } as never,
    )
    setSaving(false)
    if (error || !data) return void toast.error(t("portalSaveFailed"))
    const l = link(data as unknown as string)
    setFresh({ link: l, pin })
    setPinDialog(false)
    await queryClient.invalidateQueries({ queryKey: key })
    void copy(invite(l, pin), t("portalInviteCopied"))
  }

  const disable = async () => {
    const { error } = await supabase().rpc(
      "disable_project_portal" as never,
      { p_project_id: projectId } as never,
    )
    if (error) return void toast.error(t("portalSaveFailed"))
    setFresh(null)
    toast.success(t("portalTurnedOff"))
    queryClient.invalidateQueries({ queryKey: key })
  }

  const openPinDialog = () => {
    setPin(randomPin())
    setPinDialog(true)
  }

  const locked =
    portal?.locked_until && new Date(portal.locked_until) > new Date()

  return (
    <section className={cn(surfaceClassName, "flex flex-col")}>
      <header className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-sm font-medium">{t("portalTitle")}</h2>
          <p className="text-muted-foreground text-[13px]">
            {isLoading
              ? "…"
              : portal
                ? locked
                  ? t("portalLockedNow")
                  : portal.last_seen_at
                    ? t("portalLastSeen", {
                        when: formatDistanceToNowStrict(
                          new Date(portal.last_seen_at),
                          { addSuffix: true, locale: dateLocale },
                        ),
                      })
                    : t("portalNeverSeen")
                : t("portalOffHint")}
          </p>
        </div>
        {portal ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="outline" onClick={openPinDialog}>
              {t("portalChangePin")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setDisabling(true)}
            >
              {t("portalDisable")}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={openPinDialog} disabled={isLoading}>
            {t("portalEnable")}
          </Button>
        )}
      </header>

      {portal && (
        <div className="flex flex-col gap-3 border-t px-4 py-3">
          <div className="flex gap-2">
            <Input readOnly value={link(portal.token)} className="text-xs" />
            <Button
              variant="outline"
              size="icon"
              aria-label={t("reportCopyLink")}
              onClick={() => copy(link(portal.token))}
            >
              <RiFileCopyLine />
            </Button>
          </div>
          {fresh && (
            <div className="bg-muted/60 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm">
              <span>
                {t("portalPinIs")}{" "}
                <span className="font-semibold tracking-widest tabular-nums">
                  {fresh.pin}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {t("portalPinShownOnce")}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copy(invite(fresh.link, fresh.pin), t("portalInviteCopied"))
                }
              >
                {t("portalCopyInvite")}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={pinDialog} onOpenChange={setPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {portal ? t("portalChangePin") : t("portalEnableTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={pin}
              aria-label={t("portalPin")}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="text-center text-lg tracking-[0.4em] tabular-nums"
            />
            <Button variant="outline" onClick={() => setPin(randomPin())}>
              {t("portalRandomPin")}
            </Button>
          </div>
          {portal && (
            <p className="text-muted-foreground text-xs">
              {t("portalChangePinHint")}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinDialog(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={save} disabled={!/^\d{6}$/.test(pin) || saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={disabling}
        onOpenChange={setDisabling}
        title={t("portalDisableTitle")}
        description={t("portalDisableDescription")}
        confirmText={t("portalDisable")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          await disable()
          setDisabling(false)
        }}
      />
    </section>
  )
}
