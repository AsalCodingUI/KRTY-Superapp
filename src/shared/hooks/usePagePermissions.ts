"use client"

import { createClient } from "@/shared/api/supabase/client"
import useSWR from "swr"

export type PagePermissionsMap = Record<string, boolean>

const fetchPagePermissions = async (): Promise<PagePermissionsMap | null> => {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from("user_page_permissions")
        .select("page_slug, granted")
        .eq("user_id", user.id)

    if (error || !data || data.length === 0) return null

    const map: PagePermissionsMap = {}
    for (const row of data) {
        map[row.page_slug] = row.granted
    }
    return map
}

/**
 * Returns a map of page_slug → granted for the current user.
 * Returns null if no custom permissions exist — meaning role-based fallback applies.
 */
export function usePagePermissions() {
    const { data, isLoading } = useSWR<PagePermissionsMap | null>(
        "current-user-page-permissions",
        fetchPagePermissions,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        },
    )

    return {
        permissions: data ?? null,
        loading: isLoading,
        /**
         * Check if the user has access to a given page slug.
         * Returns null if no custom permissions are set (caller should fall back to role).
         */
        hasPermission: (slug: string): boolean | null => {
            if (data === undefined) return null // still loading
            if (data === null) return null // no custom permissions
            return data[slug] ?? false
        },
    }
}
