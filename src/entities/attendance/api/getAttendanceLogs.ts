import { createClient } from "@/shared/api/supabase/server"
import type { AttendanceLog } from "../model/types"

export interface GetAttendanceLogsParams {
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
}

export async function getAttendanceLogs(
    params: GetAttendanceLogsParams = {}
): Promise<{ data: AttendanceLog[] | null; error: Error | null }> {
    try {
        const supabase = await createClient()
        const { userId, startDate, endDate, limit } = params

        let query = supabase
            .from("attendance_logs")
            .select("*")
            .order("date", { ascending: false })
            .order("clock_in", { ascending: false })

        if (userId) {
            query = query.eq("user_id", userId)
        }

        if (startDate) {
            query = query.gte("date", startDate)
        }

        if (endDate) {
            query = query.lte("date", endDate)
        }

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            return { data: null, error: new Error(error.message) }
        }

        return { data: data as AttendanceLog[], error: null }
    } catch (error) {
        return {
            data: null,
            error:
                error instanceof Error
                    ? error
                    : new Error("Failed to fetch attendance logs"),
        }
    }
}
