"use client"

import { TimeSelect } from "@/components/time-select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { isAdminRole } from "@/shared/lib/roles"
import {
  useAutoClockOut,
  type AutoClockOut,
} from "@/shared/hooks/useAutoClockOut"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

const KEY = "auto_clock_out"
const DEFAULTS: AutoClockOut = { enabled: false, time: "17:00" }

export function AttendanceSettings() {
  const { profile } = useUserProfile()
  // Everyone sees the rule; only admins change it (RLS enforces this too).
  const canEdit = profile?.is_super_admin === true || isAdminRole(profile?.role)
  const queryClient = useQueryClient()
  const { data, isLoading } = useAutoClockOut()
  const [saving, setSaving] = useState(false)
  const value = data ?? DEFAULTS

  const save = async (next: AutoClockOut) => {
    setSaving(true)
    const queryKey = ["app-settings", KEY]
    queryClient.setQueryData(queryKey, next)
    const { error } = await createClient()
      .from("app_settings")
      .upsert({
        key: KEY,
        value: next,
        updated_at: new Date().toISOString(),
        updated_by: profile?.id ?? null,
      })
    if (error) {
      queryClient.setQueryData(queryKey, value)
      toast.error("Gagal menyimpan pengaturan.")
    } else {
      toast.success("Tersimpan.")
    }
    setSaving(false)
  }

  return (
    <div className="flex max-w-2xl flex-col">
      {!canEdit && (
        <p className="text-muted-foreground pb-2 text-sm">Diatur oleh admin.</p>
      )}
      <Row
        label="Clock out otomatis"
        hint="Sesi yang lupa ditutup akan di-clock out otomatis, dan anggotanya dapat notifikasi."
      >
        <Switch
          checked={value.enabled}
          disabled={!canEdit || isLoading || saving}
          onCheckedChange={(enabled) => save({ ...value, enabled })}
          aria-label="Clock out otomatis"
        />
      </Row>
      <Row
        label="Jam clock out"
        hint="Sesi Lembur, atau yang mulai setelah jam ini, ditutup pukul 23:59."
      >
        <TimeSelect
          className="w-28"
          value={value.time}
          step={30}
          disabled={!canEdit || !value.enabled || isLoading || saving}
          onValueChange={(time) => save({ ...value, time })}
        />
      </Row>
    </div>
  )
}

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-6 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}
