"use client"

import { AppIcon } from "@/components/app-icon"
import { useDesktopShell } from "@/components/desktop-shell"
import { useMacDownload } from "@/components/mac-download"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { MAC_RELEASE_QUERY_KEY, useMacUpdate } from "@/shared/hooks/useMacApp"
import { useT } from "@/shared/i18n/client"
import { invokeApp, tauri } from "@/shared/lib/desktop-app"
import { useDesktopPrefs } from "@/widgets/menubar/ui/MenubarPopover"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  Download,
  ExternalLink,
  Power,
  RefreshCw,
  Send,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"

type NotificationStatus = {
  status: "granted" | "denied" | "notDetermined" | "unknown"
  alertStyle: "banner" | "alert" | "none" | ""
  badges: boolean
  sounds: boolean
}

type Tone = "on" | "off" | "bad"

const NOTIF_KEY = ["mac-app", "notifications"] as const
const LOGIN_KEY = ["mac-app", "autostart"] as const

/**
 * Kretya Flow's own settings (/settings/app): notification permission,
 * running in the background and at login, the version and updates. Only
 * inside the Mac app; elsewhere a pointer to download it.
 */
export function AppSettingsPage() {
  const t = useT("desktopApp")
  const desktop = useDesktopShell()
  // The cookie says "in the app" from the first paint; the bridge itself
  // is only there once the page runs.
  const [bridge, setBridge] = useState<boolean | null>(null)
  useEffect(() => setBridge(Boolean(tauri())), [])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-10">
      <PageHeader className="pt-6 pb-4" title={t("pageTitle")} />
      {bridge === null ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : desktop && bridge ? (
        <InApp />
      ) : (
        <MacOnly />
      )}
    </div>
  )
}

function MacOnly() {
  const t = useT("desktopApp")
  const { start, busy, dialog } = useMacDownload()
  return (
    <Panel title={t("macOnlyTitle")}>
      <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <AppIcon size={192} className="squircle-mask size-12 shrink-0" />
        <p className="text-muted-foreground min-w-0 flex-1 text-sm">
          {t("macOnlyBody")}
        </p>
        <Button disabled={busy} onClick={() => void start("install")}>
          {busy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          {t("downloadMac")}
        </Button>
      </div>
      {dialog}
    </Panel>
  )
}

/** Re-reads macOS's answers whenever the window comes back to the front
 *  (after a trip to System Settings). */
function useRefreshOnFocus() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return
      void queryClient.invalidateQueries({ queryKey: NOTIF_KEY })
      void queryClient.invalidateQueries({ queryKey: LOGIN_KEY })
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [queryClient])
}

function InApp() {
  useRefreshOnFocus()
  return (
    <div className="flex flex-col gap-4">
      <NotificationsPanel />
      <BackgroundPanel />
      <AboutPanel />
    </div>
  )
}

function NotificationsPanel() {
  const t = useT("desktopApp")
  const queryClient = useQueryClient()
  const [asking, setAsking] = useState(false)
  const { data, isPending } = useQuery({
    queryKey: NOTIF_KEY,
    queryFn: async () =>
      (await invokeApp<NotificationStatus>("notification_status")) ?? {
        status: "unknown" as const,
        alertStyle: "" as const,
        badges: false,
        sounds: false,
      },
  })
  const status = data?.status ?? "unknown"
  const tone: Tone =
    status === "granted" ? "on" : status === "denied" ? "bad" : "off"
  const label = {
    granted: t("statusOn"),
    denied: t("statusDenied"),
    notDetermined: t("statusOff"),
    unknown: t("statusUnknown"),
  }[status]
  const hint = {
    granted: t("statusOnHint"),
    denied: t("statusDeniedHint"),
    notDetermined: t("statusOffHint"),
    unknown: "",
  }[status]

  const request = async () => {
    setAsking(true)
    const next = await invokeApp<NotificationStatus>(
      "request_notification_permission",
    )
    setAsking(false)
    if (next) queryClient.setQueryData(NOTIF_KEY, next)
    else void queryClient.invalidateQueries({ queryKey: NOTIF_KEY })
  }
  const openSettings = () =>
    void invokeApp("open_system_settings", { pane: "notifications" })
  const test = async () => {
    await invokeApp("notify", { title: t("testTitle"), body: t("testBody") })
    toast.success(t("testSent"))
  }

  return (
    <Panel title={t("notifSection")}>
      <div className="flex flex-col gap-4 p-4">
        <StatusRow
          icon={<Bell />}
          pending={isPending}
          tone={tone}
          label={label}
          hint={hint}
          action={
            status === "denied" ? (
              <Button size="sm" onClick={openSettings}>
                <ExternalLink data-icon="inline-start" />
                {t("openNotifSettings")}
              </Button>
            ) : status !== "granted" ? (
              <Button size="sm" disabled={asking} onClick={request}>
                {asking && <Spinner data-icon="inline-start" />}
                {t("turnOn")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={test}>
                <Send data-icon="inline-start" />
                {t("sendTest")}
              </Button>
            )
          }
        />
        {status === "granted" && data && (
          <div className="border-border grid grid-cols-3 divide-x rounded-lg border text-sm">
            <Detail
              label={t("styleLabel")}
              tone={data.alertStyle === "none" ? "off" : "on"}
              value={
                data.alertStyle === "alert"
                  ? t("styleAlert")
                  : data.alertStyle === "banner"
                    ? t("styleBanner")
                    : t("styleNone")
              }
            />
            <Detail
              label={t("badgesLabel")}
              tone={data.badges ? "on" : "off"}
              value={data.badges ? t("settingOn") : t("settingOff")}
            />
            <Detail
              label={t("soundsLabel")}
              tone={data.sounds ? "on" : "off"}
              value={data.sounds ? t("settingOn") : t("settingOff")}
            />
          </div>
        )}
        <HowTo
          title={t("notifHowTitle")}
          steps={[t("notifStep1"), t("notifStep2"), t("notifStep3")]}
          action={
            <Button size="sm" variant="ghost" onClick={openSettings}>
              <ExternalLink data-icon="inline-start" />
              {t("openNotifSettings")}
            </Button>
          }
        />
      </div>
    </Panel>
  )
}

function BackgroundPanel() {
  const t = useT("desktopApp")
  const queryClient = useQueryClient()
  const [, setPref] = useDesktopPrefs()
  const { data: enabled, isPending } = useQuery({
    queryKey: LOGIN_KEY,
    queryFn: async () => (await invokeApp<boolean>("get_autostart")) ?? false,
  })
  const toggle = async (next: boolean) => {
    queryClient.setQueryData(LOGIN_KEY, next)
    // The popover applies this setting at launch too; keep them in step.
    setPref("launchAtLogin", next)
    const now = await invokeApp<boolean>("set_autostart", { enabled: next })
    queryClient.setQueryData(LOGIN_KEY, now ?? next)
  }

  return (
    <Panel title={t("bgSection")}>
      <div className="flex flex-col gap-4 p-4">
        <p className="text-muted-foreground text-sm">{t("bgDescription")}</p>
        <StatusRow
          icon={<AppIcon size={96} variant="mark" className="size-4" />}
          tone="on"
          label={t("bgMenubar")}
          hint={t("bgMenubarHint")}
        />
        <StatusRow
          icon={<Power />}
          pending={isPending}
          tone={enabled ? "on" : "off"}
          label={t("loginLabel")}
          hint={enabled ? t("loginOnHint") : t("loginOffHint")}
          action={
            <Switch
              checked={Boolean(enabled)}
              disabled={isPending}
              onCheckedChange={(next) => void toggle(next)}
              aria-label={t("loginLabel")}
            />
          }
        />
        <HowTo
          title={t("loginHowTitle")}
          steps={[t("loginStep1"), t("loginStep2"), t("loginStep3")]}
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void invokeApp("open_system_settings", { pane: "login-items" })
              }
            >
              <ExternalLink data-icon="inline-start" />
              {t("openLoginItems")}
            </Button>
          }
        />
      </div>
    </Panel>
  )
}

function AboutPanel() {
  const t = useT("desktopApp")
  const queryClient = useQueryClient()
  const { current, available, release } = useMacUpdate()
  const { start, busy, dialog } = useMacDownload()
  const [checked, setChecked] = useState(false)
  const [checking, setChecking] = useState(false)

  // From the update notification (…?download=1): straight to the download.
  const params = useSearchParams()
  const router = useRouter()
  const autoStarted = useRef(false)
  useEffect(() => {
    if (params.get("download") !== "1" || !available || autoStarted.current)
      return
    autoStarted.current = true
    router.replace("/settings/app")
    void start("update", available)
  }, [params, available, router, start])

  const check = async () => {
    setChecking(true)
    await queryClient.invalidateQueries({ queryKey: MAC_RELEASE_QUERY_KEY })
    setChecking(false)
    setChecked(true)
  }

  return (
    <Panel title={t("aboutSection")}>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <AppIcon size={192} className="squircle-mask size-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Kretya Flow</p>
            <p className="text-muted-foreground text-[13px] tabular-nums">
              {current ? t("versionLabel", { version: current }) : "…"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={checking || release.isFetching}
            onClick={check}
          >
            {checking ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {checking ? t("checking") : t("checkUpdate")}
          </Button>
        </div>
        {available ? (
          <div className="bg-primary/10 dark:bg-primary/15 flex items-center gap-3 rounded-lg px-3 py-2.5">
            <Dot tone="on" className="bg-primary" />
            <p className="min-w-0 flex-1 text-sm font-medium">
              {t("updateReady", { version: available.version })}
            </p>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void start("update", available)}
            >
              {busy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              {t("downloadUpdate")}
            </Button>
          </div>
        ) : (
          checked &&
          !checking && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Dot tone="on" />
              {t("upToDate")}
            </p>
          )
        )}
      </div>
      {dialog}
    </Panel>
  )
}

function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        tone === "on" &&
          "bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]",
        tone === "off" && "bg-muted-foreground/40",
        tone === "bad" && "bg-red-500 shadow-[0_0_0_3px_rgb(239_68_68/0.18)]",
        className,
      )}
    />
  )
}

function StatusRow({
  icon,
  tone,
  label,
  hint,
  action,
  pending,
}: {
  icon: ReactNode
  tone: Tone
  label: string
  hint?: string
  action?: ReactNode
  pending?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {pending ? (
          <Skeleton className="h-4 w-28" />
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium">
            <Dot tone={tone} />
            {label}
          </p>
        )}
        {hint && !pending && (
          <p className="text-muted-foreground mt-0.5 text-[13px]">{hint}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: Tone
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        <Dot tone={tone} />
        {value}
      </span>
    </div>
  )
}

function HowTo({
  title,
  steps,
  action,
}: {
  title: string
  steps: string[]
  action?: ReactNode
}) {
  return (
    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        {action && <div className="-my-1 -mr-1">{action}</div>}
      </div>
      <ol className="mt-2 flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px]">
            <span className="bg-background text-foreground border-border flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums">
              {i + 1}
            </span>
            <span className="text-muted-foreground pt-px">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
