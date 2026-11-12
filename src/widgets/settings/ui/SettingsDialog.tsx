"use client"

import {
  appSoundName,
  NOTIFICATION_SOUNDS,
  notificationSound,
  playable,
  playNotificationSound,
  setNotificationSound,
  type NotificationSound,
} from "@/shared/lib/notification-sound"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Swatch } from "@/components/appearance-popover"
import { useDesktopShell } from "@/components/desktop-shell"
import { FillSlider } from "@/components/fill-slider"
import { useMacDownload } from "@/components/mac-download"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Monitor, Moon, Sun } from "@/components/icons"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useMacUpdate } from "@/shared/hooks/useMacApp"
import { useThemeTransition } from "@/shared/hooks/useThemeTransition"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useLocale, useSetLocale, useT } from "@/shared/i18n/client"
import { LOCALES } from "@/shared/i18n/config"
import {
  GRADIENT_PRESETS,
  NEUTRAL,
  readTint,
  sameTint,
  saveTint,
  TINT_PRESETS,
  type Tint,
} from "@/shared/lib/chrome-tint"
import {
  checkForUpdate,
  devicePlatform,
  installUpdate,
  invokeApp,
  tauri,
} from "@/shared/lib/desktop-app"
import {
  EMAIL_GROUP_KEYS,
  type EmailGroup,
} from "@/shared/lib/notification-email"
import {
  TEXT_SIZES,
  useDarkChrome,
  useTextSize,
} from "@/shared/lib/display-prefs"
import { useDesktopPrefs } from "@/widgets/menubar/ui/MenubarPopover"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, Palette, Play, SlidersHorizontal, X } from "@/components/icons"
import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"

import type { SettingsTab } from "../model/tabs"

const TABS = [
  { value: "general", icon: SlidersHorizontal },
  { value: "notifications", icon: Bell },
  { value: "appearance", icon: Palette },
] as const

/**
 * Settings in one window, the same on the web and in the Mac app: a rail of
 * sections on the left, plain rows (label, hint, control) on the right.
 */
export function SettingsDialog({
  tab,
  onTabChange,
  onClose,
}: {
  tab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  onClose: () => void
}) {
  const t = useT("prefs")
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(40rem,90svh)] w-full flex-col overflow-hidden p-0 sm:max-w-3xl sm:flex-row"
      >
        <nav className="border-border flex shrink-0 flex-col gap-1 border-b p-3 sm:w-52 sm:border-r sm:border-b-0 sm:p-4">
          <DialogTitle className="px-2 pt-1 pb-3 text-sm font-medium max-sm:hidden">
            {t("title")}
          </DialogTitle>
          <div className="flex gap-1 sm:flex-col">
            {TABS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-current={tab === value ? "page" : undefined}
                onClick={() => onTabChange(value)}
                className={cn(
                  "rounded-row flex h-9 items-center gap-2.5 px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] [&_svg]:size-4",
                  tab === value
                    ? "bg-foreground/[0.07] text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
                )}
              >
                <Icon aria-hidden />
                {t(value)}
              </button>
            ))}
          </div>
        </nav>
        <div className="scroll-pane relative min-h-0 flex-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("close")}
            className="text-muted-foreground absolute top-3 right-3"
            onClick={onClose}
          >
            <X />
          </Button>
          <div className="pane-px-6 sm:pane-px-8 pt-7 pb-8">
            <h2 className="text-heading text-title mb-4 font-medium">
              {t(tab)}
            </h2>
            {tab === "general" ? (
              <GeneralTab />
            ) : tab === "notifications" ? (
              <NotificationsTab />
            ) : (
              <AppearanceTab />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** One setting: what it is (and a line on it), its control on the right. */
function Row({
  label,
  hint,
  children,
  disabled,
}: {
  label: ReactNode
  hint?: ReactNode
  children?: ReactNode
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "border-border flex min-h-16 items-center gap-4 border-b py-3 last:border-b-0",
        disabled && "opacity-50",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">{label}</span>
        {hint && (
          <span className="text-muted-foreground text-meta leading-5">
            {hint}
          </span>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center">{children}</div>}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-meta mt-8 mb-1 font-medium first:mt-0">
      {children}
    </h3>
  )
}

/** In Kretya Flow with its bridge loaded (not just the cookie). */
function useInApp() {
  const desktop = useDesktopShell()
  const [bridge, setBridge] = useState(false)
  useEffect(() => setBridge(Boolean(tauri())), [])
  return desktop && bridge
}

// ---------------------------------------------------------------------------

function GeneralTab() {
  const t = useT("prefs")
  const locale = useLocale()
  const setLocale = useSetLocale()
  const inApp = useInApp()
  return (
    <div className="flex flex-col">
      <Row label={t("language")} hint={t("languageHint")}>
        <SegmentedControl
          fitContent
          value={locale}
          onChange={(value) => value !== locale && setLocale(value)}
          items={LOCALES.map((value) => ({
            value,
            label: value === "id" ? "Indonesia" : "English",
          }))}
        />
      </Row>
      {inApp ? (
        <>
          <OpenAtLoginRow />
          <VersionRow />
        </>
      ) : (
        <MacAppRow />
      )}
    </div>
  )
}

const LOGIN_KEY = ["mac-app", "autostart"] as const

function OpenAtLoginRow() {
  const t = useT("prefs")
  const queryClient = useQueryClient()
  const [, setPref] = useDesktopPrefs()
  const { data: enabled, isPending } = useQuery({
    queryKey: LOGIN_KEY,
    queryFn: async () => (await invokeApp<boolean>("get_autostart")) ?? false,
  })
  const toggle = async (next: boolean) => {
    queryClient.setQueryData(LOGIN_KEY, next)
    // The menubar applies this at launch too; keep them in step.
    setPref("launchAtLogin", next)
    const now = await invokeApp<boolean>("set_autostart", { enabled: next })
    queryClient.setQueryData(LOGIN_KEY, now ?? next)
  }
  return (
    <Row label={t("openAtLogin")} hint={t("openAtLoginHint")}>
      <Switch
        checked={Boolean(enabled)}
        disabled={isPending}
        onCheckedChange={(next) => void toggle(next)}
        aria-label={t("openAtLogin")}
      />
    </Row>
  )
}

function VersionRow() {
  const t = useT("prefs")
  const queryClient = useQueryClient()
  const { current, available, updater } = useMacUpdate()
  const { start, busy, dialog } = useMacDownload()
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)
  const phase = updater?.phase

  const check = async () => {
    setChecking(true)
    if (updater) await checkForUpdate()
    else await queryClient.invalidateQueries({ queryKey: ["mac-release"] })
    setChecking(false)
    setChecked(true)
  }

  let hint: ReactNode = checked && !available ? t("upToDate") : null
  let action: ReactNode = (
    <Button
      variant="outline"
      size="sm"
      disabled={checking || phase === "checking"}
      onClick={() => void check()}
    >
      {checking || phase === "checking" ? t("checking") : t("checkUpdate")}
    </Button>
  )
  if (phase === "downloading") {
    const pct = updater?.total
      ? `${Math.min(100, Math.round((updater.downloaded / updater.total) * 100))}%`
      : ""
    hint = t("downloading", { pct })
    action = <Spinner className="size-4" />
  } else if (phase === "ready" && updater?.version) {
    hint = t("updateAvailable", { version: updater.version })
    action = (
      <Button size="sm" onClick={() => void installUpdate()}>
        {t("restartToUpdate")}
      </Button>
    )
  } else if (available) {
    hint = t("updateAvailable", { version: available.version })
    action = (
      <Button
        size="sm"
        disabled={busy}
        onClick={() => void start("update", available)}
      >
        {t("downloadUpdate")}
      </Button>
    )
  }

  return (
    <>
      <Row label={`${t("version")} ${current ?? "…"}`} hint={hint ?? undefined}>
        {action}
      </Row>
      {dialog}
    </>
  )
}

function MacAppRow() {
  const t = useT("prefs")
  const { start, busy, dialog } = useMacDownload()
  const [windows, setWindows] = useState(false)
  useEffect(() => setWindows(devicePlatform() === "windows"), [])
  return (
    <>
      <Row
        label={windows ? t("windowsApp") : t("macApp")}
        hint={windows ? t("windowsAppHint") : t("macAppHint")}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void start("install")}
        >
          {busy && <Spinner data-icon="inline-start" />}
          {t("download")}
        </Button>
      </Row>
      {dialog}
    </>
  )
}

// ---------------------------------------------------------------------------

function NotificationsTab() {
  const t = useT("prefs")
  const inApp = useInApp()
  return (
    <div className="flex flex-col">
      {inApp && <MacNotificationRow />}
      <SoundRow inApp={inApp} />
      <SectionLabel>{t("emailSection")}</SectionLabel>
      <EmailPrefs />
    </div>
  )
}

type MacNotif = { status: "granted" | "denied" | "notDetermined" | "unknown" }
const NOTIF_KEY = ["mac-app", "notifications"] as const

function MacNotificationRow() {
  const t = useT("prefs")
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: NOTIF_KEY,
    queryFn: async () =>
      (await invokeApp<MacNotif>("notification_status")) ?? {
        status: "unknown" as const,
      },
  })
  const status = data?.status ?? "unknown"

  // Back from System Settings: ask macOS again.
  useEffect(() => {
    const refresh = () =>
      void queryClient.invalidateQueries({ queryKey: NOTIF_KEY })
    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [queryClient])

  const request = async () => {
    const next = await invokeApp<MacNotif>("request_notification_permission")
    if (next) queryClient.setQueryData(NOTIF_KEY, next)
  }
  const test = async () => {
    await invokeApp("notify", {
      title: t("testTitle"),
      body: t("testBody"),
      sound: appSoundName(),
    })
  }

  return (
    <Row
      label={t("macNotif")}
      hint={
        status === "granted"
          ? t("macNotifOn")
          : status === "denied"
            ? t("macNotifDenied")
            : t("macNotifOff")
      }
    >
      {status === "granted" ? (
        <Button variant="outline" size="sm" onClick={() => void test()}>
          {t("sendTest")}
        </Button>
      ) : status === "denied" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void invokeApp("open_system_settings", { pane: "notifications" })
          }
        >
          {t("openSystemSettings")}
        </Button>
      ) : (
        <Button size="sm" onClick={() => void request()}>
          {t("turnOn")}
        </Button>
      )}
    </Row>
  )
}

/** The sound of a new notification, kept on this device; ▶ plays it. */
function SoundRow({ inApp }: { inApp: boolean }) {
  const t = useT("prefs")
  const [value, setValue] = useState<NotificationSound>("kretya")
  const [windows, setWindows] = useState(false)
  useEffect(() => {
    setValue(notificationSound())
    setWindows(devicePlatform() === "windows")
  }, [])
  const label = (s: NotificationSound) =>
    s === "system" && windows ? t("soundSystemWindows") : t(SOUND_LABEL[s])
  const options = NOTIFICATION_SOUNDS.filter((s) => inApp || s !== "system")
  const pick = (next: NotificationSound) => {
    setValue(next)
    setNotificationSound(next)
    playNotificationSound(next)
  }
  return (
    <Row label={t("sound")} hint={t("soundHint")}>
      <div className="flex items-center gap-1.5">
        <Select
          value={value}
          onValueChange={(v) => v && pick(v as NotificationSound)}
        >
          <SelectTrigger size="sm" aria-label={t("sound")} className="w-40">
            <SelectValue>{(v: NotificationSound) => label(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {options.map((s) => (
              <SelectItem key={s} value={s}>
                {label(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("soundPlay")}
          disabled={!playable(value)}
          onClick={() => playNotificationSound(value)}
        >
          <Play />
        </Button>
      </div>
    </Row>
  )
}

const SOUND_LABEL = {
  kretya: "soundKretya",
  chime: "soundChime",
  system: "soundSystem",
  none: "soundNone",
} as const

type EmailPrefsRow = { enabled: boolean; muted: string[] }

const GROUP_LABEL: Record<
  EmailGroup,
  {
    label: Parameters<ReturnType<typeof useT<"prefs">>>[0]
    hint: Parameters<ReturnType<typeof useT<"prefs">>>[0]
  }
> = {
  mentions: { label: "groupMentions", hint: "groupMentionsHint" },
  comments: { label: "groupComments", hint: "groupCommentsHint" },
  work: { label: "groupWork", hint: "groupWorkHint" },
  leave: { label: "groupLeave", hint: "groupLeaveHint" },
  calendar: { label: "groupCalendar", hint: "groupCalendarHint" },
  santuy: { label: "groupSantuy", hint: "groupSantuyHint" },
  finance: { label: "groupFinance", hint: "groupFinanceHint" },
  digest: { label: "groupDigest", hint: "groupDigestHint" },
  performance: { label: "groupPerformance", hint: "groupPerformanceHint" },
  announcements: {
    label: "groupAnnouncements",
    hint: "groupAnnouncementsHint",
  },
}

/** Email copies of notifications: one switch for all, then per group. */
function EmailPrefs() {
  const t = useT("prefs")
  const { profile } = useUserProfile()
  const userId = profile?.id
  const queryClient = useQueryClient()
  const key = ["notification-email-prefs", userId]
  const { data: prefs } = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: async (): Promise<EmailPrefsRow> => {
      const { data } = await createClient()
        .from("notification_email_prefs")
        .select("enabled, muted")
        .eq("user_id", userId!)
        .maybeSingle()
      // Nothing saved yet: on, nothing muted.
      return data ?? { enabled: true, muted: [] }
    },
  })

  const save = async (next: EmailPrefsRow) => {
    const before = prefs
    queryClient.setQueryData(key, next)
    const { error } = await createClient()
      .from("notification_email_prefs")
      .upsert({
        user_id: userId!,
        enabled: next.enabled,
        muted: next.muted,
        updated_at: new Date().toISOString(),
      })
    if (error) {
      queryClient.setQueryData(key, before)
      toast.error(t("saveFailed"))
    }
  }

  if (!prefs)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-5" />
      </div>
    )

  return (
    <div className="flex flex-col">
      <Row
        label={t("emailAll")}
        hint={t("emailAllHint", { email: profile?.email ?? "" })}
      >
        <Switch
          checked={prefs.enabled}
          onCheckedChange={(enabled) => void save({ ...prefs, enabled })}
          aria-label={t("emailAll")}
        />
      </Row>
      {EMAIL_GROUP_KEYS.map((group) => {
        const on = !prefs.muted.includes(group)
        const { label, hint } = GROUP_LABEL[group]
        return (
          <Row
            key={group}
            label={t(label)}
            hint={t(hint)}
            disabled={!prefs.enabled}
          >
            <Switch
              checked={prefs.enabled && on}
              disabled={!prefs.enabled}
              aria-label={t(label)}
              onCheckedChange={(next) =>
                void save({
                  ...prefs,
                  muted: next
                    ? prefs.muted.filter((g) => g !== group)
                    : [...prefs.muted, group],
                })
              }
            />
          </Row>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

type Mode = "system" | "light" | "dark"

const TEXT_SIZE_LABEL = {
  small: "textSmall",
  regular: "textRegular",
  large: "textLarge",
  xlarge: "textXLarge",
} as const

function AppearanceTab() {
  const t = useT("prefs")
  const { theme, setTheme } = useThemeTransition()
  const [mounted, setMounted] = useState(false)
  const [tint, setTint] = useState<Tint>(NEUTRAL)
  const [darkChrome, setDarkChrome] = useDarkChrome()
  const [textSize, setTextSize] = useTextSize()
  useEffect(() => {
    setTint(readTint())
    setMounted(true)
  }, [])
  const update = (next: Tint) => {
    setTint(next)
    saveTint(next)
  }

  return (
    <div className="flex flex-col">
      <Row label={t("mode")}>
        <SegmentedControl
          fitContent
          value={mounted ? ((theme as Mode | undefined) ?? "system") : "system"}
          onChange={(value: Mode) => setTheme(value)}
          items={[
            { value: "system", label: t("modeSystem"), icon: Monitor },
            { value: "light", label: t("modeLight"), icon: Sun },
            { value: "dark", label: t("modeDark"), icon: Moon },
          ]}
        />
      </Row>
      <Row label={t("darkSidebar")} hint={t("darkSidebarHint")}>
        <Switch
          checked={darkChrome}
          onCheckedChange={setDarkChrome}
          aria-label={t("darkSidebar")}
        />
      </Row>
      <Row label={t("textSize")}>
        <SegmentedControl
          fitContent
          value={textSize}
          onChange={setTextSize}
          items={TEXT_SIZES.map((value) => ({
            value,
            label: t(TEXT_SIZE_LABEL[value]),
          }))}
        />
      </Row>
      <div className="border-border flex flex-col gap-3 border-b py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{t("color")}</span>
          <span className="text-muted-foreground text-meta">
            {t("colorHint")}
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label={t("color")}
          className="flex flex-wrap gap-2.5 p-1"
        >
          {TINT_PRESETS.map((preset) => (
            <Swatch
              key={`${preset.h}-${preset.c}`}
              tint={preset}
              active={mounted && sameTint(tint, preset)}
              label={
                preset.c === 0 ? t("neutral") : `${t("color")} ${preset.h}°`
              }
              onSelect={() => update(preset)}
            />
          ))}
          {GRADIENT_PRESETS.map(({ name, tint: preset }) => (
            <Swatch
              key={name}
              tint={preset}
              active={mounted && sameTint(tint, preset)}
              label={name}
              onSelect={() => update(preset)}
            />
          ))}
        </div>
      </div>
      <div className="py-4">
        <FillSlider
          radiusClassName="rounded-lg"
          label={t("intensity")}
          value={Math.round(tint.c * 100)}
          onChange={(value) => update({ ...tint, c: value / 100 })}
        />
      </div>
    </div>
  )
}
