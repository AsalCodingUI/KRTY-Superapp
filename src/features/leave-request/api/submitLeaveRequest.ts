import { createClient } from "@/shared/api/supabase/client"
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
    user_id: userId,
    start_date: formData.start_date.toISOString(),
    end_date: formData.end_date.toISOString(),
    leave_type: formData.leave_type,
    reason: formData.reason,
    proof_url: finalProofUrl,
    status: "pending",
  }

  if (formData.id) {
    // Update existing request
    const { error } = await supabase
      .from("leave_requests")
      .update(payload)
      .eq("id", formData.id)

    if (error) throw error
  } else {
    // Create new request
    const { error } = await supabase.from("leave_requests").insert(payload)

    if (error) throw error
  }
}
