import { createClient } from "@/shared/api/supabase/client";
import type { AttendanceLog } from "../model/types";

export interface ClockInParams {
    userId: string
    status?: string
}

export async function clockIn(
    params: ClockInParams
): Promise<{ data: AttendanceLog | null; error: Error | null }> {
    try {
        const supabase = createClient()
        const { userId, status = "Present" } = params

        const now = new Date()
        const dateStr = now.toISOString().split("T")[0]

        const { data, error } = await supabase
            .from("attendance_logs")
            .insert({
                user_id: userId,
                date: dateStr,
                clock_in: now.toISOString(),
                status,
            })
            .select()
            .single()

        if (error) {
            return { data: null, error: new Error(error.message) }
        }

        return { data: data as AttendanceLog, error: null }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error : new Error("Failed to clock in"),
        }
    }
}
