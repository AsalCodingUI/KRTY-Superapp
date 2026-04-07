"use client"

import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Database } from "@/shared/types/database.types"
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextInput,
} from "@/shared/ui"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
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
  | "krt_id"
  | "team_id"
>
type Team = Database["public"]["Tables"]["teams"]["Row"]

const ROLES = ["employee", "stakeholder"] as const
const JOB_TITLES = [
  "Admin",
  "Project Manager",
  "Designer",
  "Web Developer",
] as const

type FormState = {
  full_name: string
  email: string
  role: (typeof ROLES)[number]
  job_title: (typeof JOB_TITLES)[number]
  hourly_rate: string
  team_id: string
}

const INITIAL_FORM: FormState = {
  full_name: "",
  email: "",
  role: "employee",
  job_title: "Web Developer",
  hourly_rate: "",
  team_id: "",
}

function getRoleVariant(role: string | null) {
  return role === "stakeholder" ? "info" : "default"
}

function getJobTitleVariant(jobTitle: string | null) {
  switch (jobTitle) {
    case "Admin":
      return "warning"
    case "Project Manager":
      return "info"
    case "Designer":
      return "default"
    case "Web Developer":
      return "success"
    default:
      return "default"
  }
}

export default function TeamAccessSettingsPage({
  initialProfiles,
  teams,
}: {
  initialProfiles: Profile[]
  teams: Team[]
}) {
  const router = useRouter()
  const {
    authProfile,
    profile: effectiveProfile,
    isImpersonating,
    refreshProfile,
  } = useUserProfile()

  const [profiles, setProfiles] = useState(() =>
    dedupeProfilesByEmail(initialProfiles),
  )
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [loadingImpersonationId, setLoadingImpersonationId] = useState<
    string | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  )

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) =>
        (a.full_name || a.email || "").localeCompare(
          b.full_name || b.email || "",
          undefined,
          { sensitivity: "base" },
        ),
      ),
    [profiles],
  )

  const findExistingProfileByEmail = (email: string) =>
    profiles.find(
      (profile) => profile.email?.toLowerCase() === email.trim().toLowerCase(),
    )

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const existingLocalProfile = findExistingProfileByEmail(form.email)

      if (existingLocalProfile) {
        toast.info(
          `${existingLocalProfile.full_name || existingLocalProfile.email} already exists. Use "Login as" from the directory below.`,
        )
        return
      }

      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hourly_rate:
            form.hourly_rate.trim() === ""
              ? null
              : Number(form.hourly_rate.trim()),
          team_id: form.team_id || null,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (payload?.code === "PROFILE_ALREADY_EXISTS" && payload?.data) {
          const existingProfile = payload.data as Profile

          setProfiles((prev) => {
            if (prev.some((profile) => profile.id === existingProfile.id)) {
              return prev
            }
            return dedupeProfilesByEmail([...prev, existingProfile])
          })

          toast.info(
            `${existingProfile.full_name || existingProfile.email} already exists. You can use "Login as" from the directory.`,
          )
          return
        }

        throw new Error(payload?.error || "Failed to add team member")
      }

      setProfiles((prev) =>
        dedupeProfilesByEmail([...prev, payload.data as Profile]),
      )
      setForm(INITIAL_FORM)
      toast.success("Team member added.")
      router.refresh()
    } catch (error) {
      console.error("Failed to create team member", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to add team member",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleImpersonation = async (targetUserId: string | null) => {
    setLoadingImpersonationId(targetUserId || "stop")
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to switch user")
      }

      toast.success(
        targetUserId ? "Now viewing selected team member" : "Returned to your account",
      )
      await refreshProfile()
      router.refresh()
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to switch user", error)
      toast.error(error instanceof Error ? error.message : "Failed to switch user")
    } finally {
      setLoadingImpersonationId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeletingId(deleteTarget.id)
    try {
      const response = await fetch(`/api/admin/team-members/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete team member")
      }

      const deletedIds = Array.isArray(payload?.data?.deleted_profile_ids)
        ? (payload.data.deleted_profile_ids as string[])
        : [deleteTarget.id]
      const deletedEmail =
        typeof payload?.data?.email === "string"
          ? payload.data.email.toLowerCase()
          : deleteTarget.email?.toLowerCase()

      setProfiles((prev) =>
        prev.filter((profile) => {
          if (deletedIds.includes(profile.id)) return false
          if (deletedEmail && profile.email?.toLowerCase() === deletedEmail) {
            return false
          }
          return true
        }),
      )
      toast.success("Team member deleted.")
      setDeleteTarget(null)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete team member", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team member",
      )
      throw error
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="team-access-title">
      <div className="space-y-1">
        <h1
          id="team-access-title"
          className="text-heading-md text-foreground-primary"
        >
          Team Access
        </h1>
        <p className="text-body-sm text-foreground-secondary">
          Add team members from settings and jump into their workspace with super
          admin impersonation.
        </p>
      </div>

      {isImpersonating && effectiveProfile && authProfile && (
        <div className="flex items-center justify-between rounded-md border border-neutral-primary bg-surface-warning-light px-4 py-3">
          <p className="text-body-sm text-foreground-warning-on-color">
            Viewing as{" "}
            <strong>
              {effectiveProfile.full_name || effectiveProfile.email || "User"}
            </strong>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleImpersonation(null)}
            disabled={loadingImpersonationId === "stop"}
          >
            Return to my account
          </Button>
        </div>
      )}

      <div className="rounded-xxl border border-neutral-primary bg-surface-neutral-primary p-4">
        <div className="mb-4">
          <h2 className="text-label-md text-foreground-primary">
            Add Team Member
          </h2>
          <p className="text-body-sm text-foreground-secondary mt-1">
            This creates a managed profile directly from the app so you do not
            need to edit data manually.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <TextInput
              id="full_name"
              placeholder="e.g. Taufiq"
              value={form.full_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  role: value as FormState["role"],
                  job_title:
                    value === "stakeholder" ? "Admin" : prev.job_title,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Job Title</Label>
            <Select
              value={form.job_title}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  job_title: value as FormState["job_title"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job title" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TITLES.map((jobTitle) => (
                  <SelectItem key={jobTitle} value={jobTitle}>
                    {jobTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hourly_rate">Hourly Rate</Label>
            <TextInput
              id="hourly_rate"
              type="number"
              placeholder="Optional"
              value={form.hourly_rate}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hourly_rate: event.target.value,
                }))
              }
              min="0"
            />
          </div>

          <div className="grid gap-2">
            <Label>Team</Label>
            <Select
              value={form.team_id || "__none__"}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  team_id: value === "__none__" ? "" : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding member..." : "Add Team Member"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xxl border border-neutral-primary bg-surface-neutral-primary p-4">
        <div className="mb-4">
          <h2 className="text-label-md text-foreground-primary">
            Team Directory
          </h2>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Super admins can switch into any listed profile from here.
          </p>
        </div>

        {sortedProfiles.length === 0 ? (
          <EmptyState
            title="No team members yet"
            description="Add your first member to start managing access from settings."
          />
        ) : (
          <div className="space-y-3">
            {sortedProfiles.map((profile) => {
              const assignedTeam = profile.team_id
                ? teamMap.get(profile.team_id)
                : null
              const isCurrentView = effectiveProfile?.id === profile.id

              return (
                <div
                  key={profile.id}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-primary px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      initials={profile.full_name?.[0] || profile.email?.[0] || "?"}
                      src={profile.avatar_url || undefined}
                    />
                    <div className="space-y-2">
                      <div>
                        <p className="text-label-md text-foreground-primary">
                          {profile.full_name || "Unnamed user"}
                        </p>
                        <p className="text-body-sm text-foreground-secondary">
                          {profile.email || "-"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getRoleVariant(profile.role)}>
                          {profile.role}
                        </Badge>
                        <Badge variant={getJobTitleVariant(profile.job_title)}>
                          {profile.job_title || "No title"}
                        </Badge>
                        {profile.krt_id && <Badge>{profile.krt_id}</Badge>}
                        {assignedTeam?.name && <Badge>{assignedTeam.name}</Badge>}
                        {profile.is_super_admin && (
                          <Badge variant="warning">Super Admin</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {isCurrentView ? (
                      <Badge variant="success">Current View</Badge>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleImpersonation(profile.id)}
                      disabled={
                        loadingImpersonationId === profile.id ||
                        authProfile?.id === profile.id
                      }
                    >
                      {loadingImpersonationId === profile.id
                        ? "Switching..."
                        : authProfile?.id === profile.id
                          ? "Your account"
                          : "Login as"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(profile)}
                      disabled={
                        deletingId === profile.id || authProfile?.id === profile.id
                      }
                    >
                      {deletingId === profile.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="Delete team member?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.full_name || deleteTarget.email || "this user"} from the app. If the account already exists in auth, we will try to remove that too.`
            : "This action cannot be undone."
        }
        confirmText="Delete account"
        cancelText="Cancel"
        variant="destructive"
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
      />
    </section>
  )
}
