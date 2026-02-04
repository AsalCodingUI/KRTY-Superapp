import { createClient } from "@/shared/api/supabase/client"
import { useCallback, useState } from "react"

export function useLeaveApproval() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleApprove = useCallback(
    async (id: number) => {
      if (!confirm("Approve this request?")) return

      setLoading(true)
      try {
        const { error } = await supabase
          .from("leave_requests")
          .update({ status: "approved" })
          .eq("id", id)

        if (error) throw error
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to approve"
        alert("Error approving: " + message)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  const handleReject = useCallback(
    async (id: number) => {
      if (!confirm("Reject this request?")) return

      setLoading(true)
      try {
        const { error } = await supabase
          .from("leave_requests")
          .update({ status: "rejected" })
          .eq("id", id)

        if (error) throw error
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to reject"
        alert("Error rejecting: " + message)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  return {
    loading,
    handleApprove,
    handleReject,
  }
}
