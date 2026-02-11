"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { EmptyState } from "@/shared/ui/information/EmptyState"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const ROLES = ["stakeholder", "employee"]
const JOB_TITLES = ["Admin", "Project Manager", "Designer", "Web Developer"]

export default function PermissionSettingsPage({
  initialData,
}: {
  initialData: Profile[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialData)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Fungsi Update Role/Job Title
  const handleUpdate = async (
    id: string,
    field: "role" | "job_title",
    value: string,
  ) => {
    setLoadingId(id)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", id)

      if (error) throw error

      // Update state lokal biar UI langsung berubah
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      )

      router.refresh() // Refresh data server
    } catch (error) {
      console.error("Gagal update:", error)
      alert("Gagal mengupdate data. Cek console.")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section aria-labelledby="permissions-title">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h3
            id="permissions-title"
            className="text-foreground-primary scroll-mt-10 font-semibold"
          >
            User Permissions
          </h3>
          <p className="text-foreground-secondary text-label-md">
            Manage access levels (Roles) and job titles for your team members.
          </p>
        </div>
        {/* Tombol Add User DIHAPUS sesuai request */}
      </div>

      <ul role="list" className="mt-6 divide-y divide-neutral-primary">
        {profiles.map((user) => {
          const initials = user.full_name
            ? user.full_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "U"

          return (
            <li
              key={user.id}
              className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* INFO USER */}
              <div className="flex items-center gap-x-4 overflow-hidden">
                <span
                  className="border-neutral-primary bg-surface-neutral-secondary text-foreground-secondary text-label-xs hidden size-10 shrink-0 items-center justify-center rounded-full border sm:flex"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <div className="truncate">
                  <p className="text-foreground-primary text-label-md truncate">
                    {user.full_name || "Unknown User"}
                  </p>
                  <p className="text-foreground-secondary text-body-xs truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* DROPDOWNS ACTION */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* 1. SELECT JOB TITLE */}
                <div className="w-full sm:w-40">
                  <span className="text-foreground-secondary text-body-xs mb-1 block sm:hidden">
                    Job Title
                  </span>
                  <Select
                    value={user.job_title || undefined}
                    onValueChange={(val) =>
                      handleUpdate(user.id, "job_title", val)
                    }
                    disabled={loadingId === user.id}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select Job" />
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

                {/* 2. SELECT ROLE */}
                <div className="w-full sm:w-36">
                  <span className="text-foreground-secondary text-body-xs mb-1 block sm:hidden">
                    Role
                  </span>
                  <Select
                    value={user.role}
                    onValueChange={(val) =>
                      handleUpdate(user.id, "role", val)
                    }
                    disabled={loadingId === user.id}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {/* Capitalize first letter */}
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {profiles.length === 0 && (
        <EmptyState
          title="No users found"
          description="User accounts will appear here once they are created"
          icon={null}
          variant="compact"
        />
      )}
    </section>
  )
}
