"use client"

import { TimeSelect } from "@/components/time-select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/shared/api/supabase/client"
import {
  AUTO_CLOCK_OUT_DEFAULTS,
  AUTO_CLOCK_OUT_QUERY_KEY,
  useAutoClockOut,
  type AutoClockOut,
} from "@/shared/hooks/useAutoClockOut"
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

/**
 * The employee's own auto clock-out: a switch plus the time, in one compact
 * row of the Kehadiran toolbar. Each person decides for themselves.
 */
export function AttendanceSettings() {
  const t = useT("settings")
  const queryClient = useQueryClient()
  const { data, isLoading } = useAutoClockOut()
  const [saving, setSaving] = useState(false)
  const value = data ?? AUTO_CLOCK_OUT_DEFAULTS

  const save = async (next: AutoClockOut) => {
    setSaving(true)
    queryClient.setQueryData(AUTO_CLOCK_OUT_QUERY_KEY, next)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = user
      ? await supabase.from("attendance_preferences" as never).upsert({
          user_id: user.id,
          auto_clock_out: next.enabled,
          auto_clock_out_time: next.time,
          updated_at: new Date().toISOString(),
        } as never)
      : { error: new Error(t("notSignedIn")) }
    if (error) {
      queryClient.setQueryData(AUTO_CLOCK_OUT_QUERY_KEY, value)
      toast.error(t("saveSettingsFailed"))
    } else {
      toast.success(
        next.enabled
          ? t("autoClockOutOn", { time: next.time })
          : t("autoClockOutOff"),
      )
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <label className="flex cursor-pointer items-center gap-2">
        <Switch
          checked={value.enabled}
          disabled={isLoading || saving}
          onCheckedChange={(enabled) => save({ ...value, enabled })}
          aria-label={t("autoClockOut")}
        />
        <span className="whitespace-nowrap">{t("autoClockOut")}</span>
      </label>
      {value.enabled && (
        <TimeSelect
          className="w-28"
          value={value.time}
          step={30}
          disabled={isLoading || saving}
          onValueChange={(time) => save({ ...value, time })}
        />
      )}
    </div>
  )
}
