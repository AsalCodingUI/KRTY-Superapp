"use client"

import { DateField } from "@/components/date-field"
import { AnimatePresence } from "motion/react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyValue } from "@/components/empty-value"
import { GroupedList, ListRow } from "@/components/grouped-list"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { siteConfig } from "@/app/siteConfig"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { cx } from "@/shared/lib/utils"
import type { MessageKey } from "@/shared/i18n/messages"
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
  { value: "employee", labelKey: "roleEmployee" },
  { value: "stakeholder", labelKey: "roleStakeholder" },
] as const
const JOB_TITLES = ["Admin", "Project Manager", "Designer", "Web Developer"]
const NO_TEAM = "__none__"
const EMPLOYMENT_LABEL_KEYS = {
  karyawan: "employmentKaryawan",
  magang: "employmentMagang",
} as const satisfies Record<string, MessageKey<"settings">>

/**
 * Pages that can be switched per member. Settings sections are gated by super
 * admin instead, so only the real app pages are listed.
 */
type NavKey = MessageKey<"nav">
const PAGE_LABELS: Record<string, NavKey> = {
  [siteConfig.baseLinks.dashboard]: "home",
  [siteConfig.baseLinks.calendar]: "calendar",
  [siteConfig.baseLinks.leave]: "leaveAttendance",
  [siteConfig.baseLinks.performance]: "performance",
  [siteConfig.baseLinks.projects]: "projects",
  [siteConfig.baseLinks.teams]: "team",
  [siteConfig.baseLinks.finance]: "finance",
}
const PAGES = [
  ...navigationConfig.main.map((item) => ({
    slug: item.href,
    name: item.name,
  })),
  { slug: siteConfig.baseLinks.finance, name: "Finance" },
].map((page) => ({ ...page, key: PAGE_LABELS[page.slug] }))

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

/** Shared columns for the header row and every member row. */
const MEMBER_GRID =
  "grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_8rem_10rem_4rem] lg:grid-cols-[minmax(0,1fr)_8rem_10rem_10rem_4rem]"

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
  const t = useT("settings")
  const tc = useT("common")
  const tn = useT("nav")
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
      toast.error(t("saveChangesFailed"))
    } else {
      toast.success(t("saved"))
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
      toast.error(t("changeAccessFailed"))
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
        throw new Error(
          payload?.error ||
            t("switchAccountFailedStatus", { status: response.status }),
        )
      }
      await refreshProfile()
      toast.success(t("nowViewingAs"))
      // Reloads the app as that member.
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("switchAccountFailed"))
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
      toast.error(payload?.error || t("deleteMemberFailed"))
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
    toast.success(t("memberDeleted"))
  }

  if (error) {
    return (
      <p className="text-destructive p-6 text-sm">{t("loadMembersFailed")}</p>
    )
  }

  const totalPages = PAGES.length

  return (
    <div className="flex flex-col">
      {/* Toolbar: search left, add on the right. */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <InputGroup className="w-full sm:w-[260px]">
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t("searchMembers")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Button onClick={() => setAdding(true)}>
          <RiAddLine data-icon="inline-start" />
          {t("addMember")}
        </Button>
      </div>

      {/* Members: one aligned list; a row opens the member in a sheet. */}
      <GroupedList>
        <div
          className={cx(
            MEMBER_GRID,
            "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
          )}
        >
          <span>{t("colName")}</span>
          <span className="hidden md:block">{t("colRole")}</span>
          <span className="hidden md:block">{t("colJobTitle")}</span>
          <span className="hidden lg:block">{t("colTeam")}</span>
          <span className="text-right">{t("colAccess")}</span>
        </div>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <ListRow key={i} className={cx(MEMBER_GRID, "min-h-14")}>
              <span className="flex items-center gap-3">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-3.5 w-40" />
              </span>
            </ListRow>
          ))
        ) : (
          // Re-keyed on search so filtering doesn't animate every row.
          <AnimatePresence initial={false} key={query}>
            {filtered.map((p) => {
              const granted = PAGES.filter(
                (page) => access[p.id]?.[page.slug] === true,
              ).length
              const team = teams.find((t) => t.id === p.team_id)
              return (
                <ListRow
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedId(p.id)
                    }
                  }}
                  className={cx(
                    MEMBER_GRID,
                    "min-h-14 cursor-pointer outline-none",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-7">
                      <AvatarImage src={p.avatar_url || undefined} alt="" />
                      <AvatarFallback className="text-[11px]">
                        {initialOf(p)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-foreground flex items-center gap-2 truncate">
                        {p.full_name || p.email}
                        {p.is_super_admin && (
                          <Badge variant="info">{t("superAdmin")}</Badge>
                        )}
                      </span>
                      <span className="text-tertiary-foreground truncate text-[13px]">
                        {p.email}
                      </span>
                    </span>
                  </span>
                  <span className="hidden md:block">
                    <Badge variant="secondary">
                      {(() => {
                        const option = ROLE_OPTIONS.find(
                          (r) => r.value === p.role,
                        )
                        return option ? t(option.labelKey) : p.role
                      })()}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground hidden truncate md:block">
                    {p.job_title || <EmptyValue />}
                  </span>
                  <span className="text-muted-foreground hidden truncate lg:block">
                    {team?.name ?? <EmptyValue />}
                  </span>
                  <span className="text-right tabular-nums">
                    {granted}
                    <span className="text-tertiary-foreground">
                      {" "}
                      / {totalPages}
                    </span>
                  </span>
                </ListRow>
              )
            })}
          </AnimatePresence>
        )}
      </GroupedList>
      {!isLoading && filtered.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {t("noMembers")}
        </p>
      )}

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("memberDetail")}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5 pt-5 pb-6">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={selected.avatar_url || undefined} alt="" />
                  <AvatarFallback>{initialOf(selected)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {selected.full_name || t("noName")}
                    {isSelf && <Badge variant="secondary">{t("you")}</Badge>}
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
                    {t("viewAs")}
                  </Button>
                )}
              </div>

              <section className="flex flex-col">
                <h3 className="text-muted-foreground mb-1 text-xs font-medium">
                  {t("sectionRole")}
                </h3>
                <Row label={t("colRole")} hint={t("roleHint")}>
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
                          {t(r.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("colJobTitle")}>
                  <Select
                    value={selected.job_title ?? null}
                    onValueChange={(v) =>
                      v && updateProfile(selected.id, { job_title: v })
                    }
                    disabled={savingKey === `${selected.id}:job_title`}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder={t("selectJobTitle")} />
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
                <Row label={t("colTeam")}>
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
                      <SelectItem value={NO_TEAM}>{t("noTeam")}</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("status")}>
                  <Select
                    value={selected.employment_type ?? "karyawan"}
                    onValueChange={(v) =>
                      v && updateProfile(selected.id, { employment_type: v })
                    }
                    disabled={savingKey === `${selected.id}:employment_type`}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue>
                        {(v: string) =>
                          v in EMPLOYMENT_LABEL_KEYS
                            ? t(
                                EMPLOYMENT_LABEL_KEYS[
                                  v as keyof typeof EMPLOYMENT_LABEL_KEYS
                                ],
                              )
                            : v
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="end">
                      {Object.entries(EMPLOYMENT_LABEL_KEYS).map(
                        ([value, labelKey]) => (
                          <SelectItem key={value} value={value}>
                            {t(labelKey)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label={t("joinDate")} hint={t("joinDateHint")}>
                  <DateField
                    className="w-44"
                    value={selected.join_date}
                    max={new Date().toISOString().slice(0, 10)}
                    disabled={savingKey === `${selected.id}:join_date`}
                    onChange={(value) => {
                      const next = value || null
                      if (next !== (selected.join_date ?? null)) {
                        updateProfile(selected.id, { join_date: next })
                      }
                    }}
                  />
                </Row>
                <Row
                  label={t("superAdmin")}
                  hint={isSelf ? t("superAdminSelfHint") : t("superAdminHint")}
                >
                  <Switch
                    checked={selected.is_super_admin === true}
                    disabled={
                      isSelf || savingKey === `${selected.id}:is_super_admin`
                    }
                    onCheckedChange={(checked) =>
                      updateProfile(selected.id, { is_super_admin: checked })
                    }
                    aria-label={t("superAdmin")}
                  />
                </Row>
              </section>

              <section className="flex flex-col">
                <h3 className="text-muted-foreground mb-1 text-xs font-medium">
                  {t("pageAccess")}
                </h3>
                {PAGES.map((page) => {
                  const granted = access[selected.id]?.[page.slug] === true
                  return (
                    <Row
                      key={page.slug}
                      label={page.key ? tn(page.key) : page.name}
                    >
                      <Switch
                        checked={granted}
                        disabled={savingKey === `${selected.id}:${page.slug}`}
                        onCheckedChange={(checked) =>
                          togglePage(selected.id, page.slug, checked)
                        }
                        aria-label={t("pageAccessAria", { page: page.name })}
                      />
                    </Row>
                  )
                })}
              </section>

              {!isSelf && (
                <section className="flex items-center justify-between gap-6 border-t pt-6">
                  <div>
                    <p className="text-sm">{t("deleteMember")}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("deleteMemberHint")}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteTarget(selected)}
                  >
                    <RiDeleteBinLine data-icon="inline-start" />
                    {tc("delete")}
                  </Button>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

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
        title={t("deleteMemberTitle")}
        description={t("deleteMemberDescription", {
          name: deleteTarget?.full_name || deleteTarget?.email || "",
        })}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
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
  const t = useT("settings")
  const tc = useT("common")
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof AddForm>(key: K, value: AddForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (existingEmails.includes(form.email.trim().toLowerCase())) {
      toast.info(t("emailAlreadyRegistered"))
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
        throw new Error(payload?.error || t("addMemberFailed"))
      }
      onAdded(payload.data as Profile)
      toast.success(t("memberAdded"))
      setForm(EMPTY_FORM)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addMemberFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addMember")}</DialogTitle>
        </DialogHeader>
        <form
          id="add-member-form"
          onSubmit={submit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-name">{t("fullName")}</Label>
            <Input
              id="member-name"
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-email">{t("email")}</Label>
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
              <Label>{t("colJobTitle")}</Label>
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
              <Label>{t("colRole")}</Label>
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
                      {t(r.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("colTeam")}</Label>
              <Select
                value={form.team_id}
                onValueChange={(v) => v && set("team_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEAM}>{t("noTeam")}</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" form="add-member-form" disabled={saving}>
            {tc("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
