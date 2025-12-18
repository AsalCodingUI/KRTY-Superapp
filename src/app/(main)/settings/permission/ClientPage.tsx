"use client"

import { EmptyState } from "@/components/EmptyState"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Select"
import { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const ROLES = ["stakeholder", "employee"]
const JOB_TITLES = ["Admin", "Project Manager", "Designer", "Web Developer"]

export default function PermissionClientPage({ initialData }: { initialData: Profile[] }) {
    const supabase = createClient()
    const router = useRouter()
    const [profiles, setProfiles] = useState(initialData)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    // Fungsi Update Role/Job Title
    const handleUpdate = async (id: string, field: "role" | "job_title", value: string) => {
        setLoadingId(id)

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ [field]: value })
                .eq("id", id)

            if (error) throw error

            // Update state lokal biar UI langsung berubah
            setProfiles((prev) =>
                prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
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
        <>
            <section aria-labelledby="permissions-title">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h3
                            id="permissions-title"
                            className="scroll-mt-10 font-semibold text-content dark:text-content"
                        >
                            User Permissions
                        </h3>
                        <p className="text-sm leading-6 text-content-subtle">
                            Manage access levels (Roles) and job titles for your team members.
                        </p>
                    </div>
                    {/* Tombol Add User DIHAPUS sesuai request */}
                </div>

                <ul
                    role="list"
                    className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800"
                >
                    {profiles.map((user) => {
                        const initials = user.full_name
                            ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                            : "U"

                        return (
                            <li
                                key={user.id}
                                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                {/* INFO USER */}
                                <div className="flex items-center gap-x-4 overflow-hidden">
                                    <span
                                        className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-input bg-muted text-xs font-medium text-content-subtle sm:flex dark:border dark:bg-surface dark:text-content-subtle"
                                        aria-hidden="true"
                                    >
                                        {initials}
                                    </span>
                                    <div className="truncate">
                                        <p className="truncate text-sm font-medium text-content dark:text-content">
                                            {user.full_name || "Unknown User"}
                                        </p>
                                        <p className="truncate text-xs text-content-subtle">{user.email}</p>
                                    </div>
                                </div>

                                {/* DROPDOWNS ACTION */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                                    {/* 1. SELECT JOB TITLE */}
                                    <div className="w-full sm:w-40">
                                        <span className="mb-1 block text-xs text-content-subtle sm:hidden">Job Title</span>
                                        <Select
                                            value={user.job_title || undefined}
                                            onValueChange={(val) => handleUpdate(user.id, "job_title", val)}
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
                                        <span className="mb-1 block text-xs text-content-subtle sm:hidden">Role</span>
                                        <Select
                                            value={user.role}
                                            onValueChange={(val) => handleUpdate(user.id, "role", val)}
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
        </>
    )
}