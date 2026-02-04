import { createClient } from "@/shared/api/supabase/client"
import type { AttendanceLog } from "../model/types"

export async function clockOut(
  logId: string,
): Promise<{ data: AttendanceLog | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("attendance_logs")
      .update({
        clock_out: new Date().toISOString(),
      })
      .eq("id", logId)
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as AttendanceLog, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to clock out"),
    }
  }
}
