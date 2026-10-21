"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { cx } from "@/shared/lib/utils"
import type { Database } from "@/shared/types/database.types"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "email"
  | "role"
  | "job_title"
  | "is_super_admin"
  | "avatar_url"
  | "hourly_rate"
  | "team_id"
  | "join_date"
  | "employment_type"
>
type Team = Pick<Database["public"]["Tables"]["teams"]["Row"], "id" | "name">
type Access = Record<string, Record<string, boolean>>

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "stakeholder", label: "Stakeholder" },
] as const
const JOB_TITLES = ["Admin", "Project Manager", "Designer", "Web Developer"]
const NO_TEAM = "__none__"
const EMPLOYMENT_LABELS: Record<string, string> = {
  karyawan: "Karyawan",
  magang: "Magang",
}

/**
 * Pages that can be switched per member. Settings sections are gated by super
 * admin instead, so only the real app pages are listed.
 */
const PAGES = navigationConfig.main.map((item) => ({
  slug: item.href,
  name: item.name,
}))

const PROFILE_COLUMNS =
  "id, full_name, email, role, job_title, is_super_admin, avatar_url, team_id, join_date, employment_type"

function useMembersData() {
  return useQuery({
    queryKey: ["settings", "members"],
    queryFn: async () => {
      const supabase = createClient()
      const [profiles, teams, permissions] = await Promise.all([
        supabase.from("profiles").select(PROFILE_COLUMNS).order("full_name"),
        supabase.from("teams").select("id, name").order("name"),
        supabase
          .from("user_page_permissions")
          .select("user_id, page_slug, granted"),
      ])
      if (profiles.error) throw profiles.error
      const access: Access = {}
      for (const row of (permissions.data ?? []) as {
        user_id: string
        page_slug: string
        granted: boolean
      }[]) {
        access[row.user_id] ??= {}
        access[row.user_id][row.page_slug] = row.granted
      }
      return {
        profiles: dedupeProfilesByEmail(profiles.data as Profile[]),
        teams: (teams.data ?? []) as Team[],
        access,
      }
    },
  })
}

function initialOf(profile: Pick<Profile, "full_name" | "email">) {
  return (profile.full_name || profile.email || "?").charAt(0).toUpperCase()
}

/** Label on the left, control on the right. */
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
    <div className="flex min-h-12 items-center justify-between gap-6 border-b py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

export function MembersAccessSettings() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { authProfile, refreshProfile } = useUserProfile()
  const { data, isLoading, error } = useMembersData()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [access, setAccess] = useState<Access>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    if (!data) return
    setProfiles(data.profiles)
    setAccess(data.access)
    setSelectedId((prev) => prev ?? data.profiles[0]?.id ?? null)
  }, [data])

  const teams = data?.teams ?? []
  const filtered = profiles.filter((p) =>
    `${p.full_name ?? ""} ${p.email ?? ""} ${p.job_title ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const selected = profiles.find((p) => p.id === selectedId) ?? null
  const isSelf = selected?.id === authProfile?.id

  // ── Mutations (same writes as the old Team Access / Permissions pages) ──
  const updateProfile = async (
    id: string,
    patch: Partial<
      Pick<
        Profile,
        | "role"
        | "job_title"
        | "team_id"
        | "is_super_admin"
        | "join_date"
        | "employment_type"
      >
    >,
  ) => {
    const key = `${id}:${Object.keys(patch)[0]}`
    setSavingKey(key)
    const previous = profiles
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    )
    const { error: err } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", id)
    if (err) {
      setProfiles(previous)
      toast.error("Gagal menyimpan perubahan.")
    } else {
      toast.success("Tersimpan.")
    }
    setSavingKey(null)
  }

  const togglePage = async (userId: string, slug: string, next: boolean) => {
    const key = `${userId}:${slug}`
    setSavingKey(key)
    setAccess((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? {}), [slug]: next },
    }))
    const { error: err } = await supabase.from("user_page_permissions").upsert(
      {
        user_id: userId,
        page_slug: slug,
        granted: next,
        granted_by: authProfile?.id,
      },
      { onConflict: "user_id,page_slug" },
    )
    if (err) {
      setAccess((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] ?? {}), [slug]: !next },
      }))
      toast.error("Gagal mengubah akses.")
    }
    setSavingKey(null)
  }

  const viewAs = async (userId: string) => {
    setSwitching(true)
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Gagal berpindah akun")
      }
      await refreshProfile()
      toast.success("Sekarang melihat sebagai anggota ini")
      // Leaves the settings modal and reloads as that member.
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal berpindah akun")
    } finally {
      setSwitching(false)
    }
  }

  const deleteMember = async () => {
    if (!deleteTarget) return
    const response = await fetch(`/api/admin/team-members/${deleteTarget.id}`, {
      method: "DELETE",
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast.error(payload?.error || "Gagal menghapus anggota")
      throw new Error(payload?.error)
    }
    const deletedIds: string[] = Array.isArray(
      payload?.data?.deleted_profile_ids,
    )
      ? payload.data.deleted_profile_ids
      : [deleteTarget.id]
    const remaining = profiles.filter((p) => !deletedIds.includes(p.id))
    setProfiles(remaining)
    setSelectedId(remaining[0]?.id ?? null)
    setDeleteTarget(null)
    toast.success("Anggota dihapus.")
  }

  if (error) {
    return (
      <p className="text-destructive p-6 text-sm">Gagal memuat data anggota.</p>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Member list */}
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="flex items-center gap-2 p-3">
          <InputGroup>
            <InputGroupAddon>
              <RiSearchLine />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari anggota"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <Button
            size="icon"
            variant="outline"
            aria-label="Tambah anggota"
            onClick={() => setAdding(true)}
          >
            <RiAddLine />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))
            : filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={cx(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    p.id === selectedId ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <Avatar className="size-7">
                    <AvatarImage src={p.avatar_url || undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {initialOf(p)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {p.full_name || p.email}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {p.job_title || "—"}
                    </span>
                  </span>
                  {p.role === "stakeholder" && (
                    <span
                      className="bg-primary size-1.5 shrink-0 rounded-full"
                      title="Stakeholder"
                    />
                  )}
                </button>
              ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground px-2 py-4 text-sm">
              Tidak ada anggota.
            </p>
          )}
        </div>
      </div>

      {/* Member detail */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-8 p-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={selected.avatar_url || undefined} alt="" />
                <AvatarFallback>{initialOf(selected)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium">
                  {selected.full_name || "Tanpa nama"}
                  {isSelf && <Badge variant="secondary">Kamu</Badge>}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {selected.email}
                </p>
              </div>
              {!isSelf && (
                <Button
                  variant="outline"
                  disabled={switching}
                  onClick={() => viewAs(selected.id)}
                >
                  <RiEyeLine data-icon="inline-start" />
                  Lihat sebagai
                </Button>
              )}
            </div>

            <section className="flex flex-col">
              <h3 className="text-muted-foreground mb-1 text-xs font-medium">
                Peran
              </h3>
              <Row
                label="Role"
                hint="Stakeholder bisa mengelola tim & project."
              >
                <Select
                  value={selected.role}
                  onValueChange={(v) =>
                    v &&
                    v !== selected.role &&
                    updateProfile(selected.id, { role: v as Profile["role"] })
                  }
                  disabled={savingKey === `${selected.id}:role`}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Jabatan">
                <Select
                  value={selected.job_title ?? null}
                  onValueChange={(v) =>
                    v && updateProfile(selected.id, { job_title: v })
                  }
                  disabled={savingKey === `${selected.id}:job_title`}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {JOB_TITLES.map((job) => (
                      <SelectItem key={job} value={job}>
                        {job}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Tim">
                <Select
                  value={selected.team_id ?? NO_TEAM}
                  onValueChange={(v) =>
                    v &&
                    updateProfile(selected.id, {
                      team_id: v === NO_TEAM ? null : v,
                    })
                  }
                  disabled={savingKey === `${selected.id}:team_id`}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value={NO_TEAM}>Tanpa tim</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Status">
                <Select
                  value={selected.employment_type ?? "karyawan"}
                  onValueChange={(v) =>
                    v && updateProfile(selected.id, { employment_type: v })
                  }
                  disabled={savingKey === `${selected.id}:employment_type`}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue>
                      {(v: string) => EMPLOYMENT_LABELS[v] ?? v}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
                    {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row
                label="Mulai kerja"
                hint="Sejak resmi jadi karyawan. Dipakai untuk jatah cuti."
              >
                <Input
                  key={`${selected.id}:${selected.join_date ?? ""}`}
                  type="date"
                  className="w-44"
                  defaultValue={selected.join_date ?? ""}
                  max={new Date().toISOString().slice(0, 10)}
                  disabled={savingKey === `${selected.id}:join_date`}
                  onBlur={(e) => {
                    const next = e.target.value || null
                    if (next !== (selected.join_date ?? null)) {
                      updateProfile(selected.id, { join_date: next })
                    }
                  }}
                />
              </Row>
              <Row
                label="Super admin"
                hint={
                  isSelf
                    ? "Tidak bisa mengubah status kamu sendiri."
                    : "Bisa membuka pengaturan anggota & akses."
                }
              >
                <Switch
                  checked={selected.is_super_admin === true}
                  disabled={
                    isSelf || savingKey === `${selected.id}:is_super_admin`
                  }
                  onCheckedChange={(checked) =>
                    updateProfile(selected.id, { is_super_admin: checked })
                  }
                  aria-label="Super admin"
                />
              </Row>
            </section>

            <section className="flex flex-col">
              <h3 className="text-muted-foreground mb-1 text-xs font-medium">
                Akses halaman
              </h3>
              {PAGES.map((page) => {
                const granted = access[selected.id]?.[page.slug] === true
                return (
                  <Row key={page.slug} label={page.name}>
                    <Switch
                      checked={granted}
                      disabled={savingKey === `${selected.id}:${page.slug}`}
                      onCheckedChange={(checked) =>
                        togglePage(selected.id, page.slug, checked)
                      }
                      aria-label={`Akses ${page.name}`}
                    />
                  </Row>
                )
              })}
            </section>

            {!isSelf && (
              <section className="flex items-center justify-between gap-6 border-t pt-6">
                <div>
                  <p className="text-sm">Hapus anggota</p>
                  <p className="text-muted-foreground text-xs">
                    Menghapus profil dan aksesnya. Tidak bisa dibatalkan.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteTarget(selected)}
                >
                  <RiDeleteBinLine data-icon="inline-start" />
                  Hapus
                </Button>
              </section>
            )}
          </div>
        ) : (
          !isLoading && (
            <p className="text-muted-foreground p-6 text-sm">
              Pilih anggota di sebelah kiri.
            </p>
          )
        )}
      </div>

      <AddMemberDialog
        open={adding}
        onOpenChange={setAdding}
        teams={teams}
        existingEmails={profiles.map((p) => (p.email ?? "").toLowerCase())}
        onAdded={(profile) => {
          setProfiles((prev) => dedupeProfilesByEmail([...prev, profile]))
          setSelectedId(profile.id)
        }}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Hapus anggota?"
        description={`${deleteTarget?.full_name || deleteTarget?.email} akan dihapus beserta aksesnya.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={deleteMember}
      />
    </div>
  )
}

type AddForm = {
  full_name: string
  email: string
  role: "employee" | "stakeholder"
  job_title: string
  team_id: string
}
const EMPTY_FORM: AddForm = {
  full_name: "",
  email: "",
  role: "employee",
  job_title: "Designer",
  team_id: NO_TEAM,
}

/** One form for new members (the only place members are added). */
function AddMemberDialog({
  open,
  onOpenChange,
  teams,
  existingEmails,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teams: Team[]
  existingEmails: string[]
  onAdded: (profile: Profile) => void
}) {
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof AddForm>(key: K, value: AddForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (existingEmails.includes(form.email.trim().toLowerCase())) {
      toast.info("Email ini sudah terdaftar.")
      return
    }
    setSaving(true)
    try {
      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          team_id: form.team_id === NO_TEAM ? null : form.team_id,
          // Rates are handled in Finance later; not set here.
          hourly_rate: null,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || "Gagal menambah anggota")
      }
      onAdded(payload.data as Profile)
      toast.success("Anggota ditambahkan.")
      setForm(EMPTY_FORM)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah anggota")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah anggota</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-name">Nama lengkap</Label>
            <Input
              id="member-name"
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Jabatan</Label>
              <Select
                value={form.job_title}
                onValueChange={(v) => v && set("job_title", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map((job) => (
                    <SelectItem key={job} value={job}>
                      {job}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => v && set("role", v as AddForm["role"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tim</Label>
              <Select
                value={form.team_id}
                onValueChange={(v) => v && set("team_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEAM}>Tanpa tim</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              Tambah
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
