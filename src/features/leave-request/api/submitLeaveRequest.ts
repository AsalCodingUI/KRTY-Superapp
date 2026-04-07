import { createClient } from "@/shared/api/supabase/client"
import { format, startOfDay } from "date-fns"
import { LeaveFormData } from "../model"

export async function submitLeaveRequest(
  formData: LeaveFormData,
  userId: string,
) {
  const supabase = createClient()

  if (!formData.start_date || !formData.end_date) {
    throw new Error("Start date and end date are required")
  }

  let finalProofUrl = formData.proof_url

  // Upload proof file if provided
  if (formData.proof_file) {
    const fileExt = formData.proof_file.name.split(".").pop() || "jpg"
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("leave-proofs")
      .upload(fileName, formData.proof_file)

    if (uploadError) throw uploadError

    const { data: publicUrl } = supabase.storage
      .from("leave-proofs")
      .getPublicUrl(fileName)

    finalProofUrl = publicUrl.publicUrl
  }

  const payload = {
    start_date: format(startOfDay(formData.start_date), "yyyy-MM-dd"),
    end_date: format(startOfDay(formData.end_date), "yyyy-MM-dd"),
    leave_type: formData.leave_type,
    reason: formData.reason,
    proof_url: finalProofUrl,
    status: "pending",
  }

  if (formData.id) {
    const response = await fetch("/api/leave/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, id: formData.id }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(result?.error || "Failed to update leave request")
    }
  } else {
    const response = await fetch("/api/leave/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(result?.error || "Failed to submit leave request")
    }
  }
}
