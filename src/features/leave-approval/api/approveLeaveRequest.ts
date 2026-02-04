import { createClient } from "@/shared/api/supabase/client"

export async function approveLeaveRequest(requestId: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "approved" })
    .eq("id", requestId)

  if (error) throw error
}
