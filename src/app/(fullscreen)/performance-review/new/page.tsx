import { createClient } from "@/shared/api/supabase/server"
import { redirect } from "next/navigation"
import ReviewFormClientPage from "./ClientPage"

export default async function NewReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 1. SECURITY: Cek apakah ada siklus aktif HARI INI
  const now = new Date().toISOString()
  const { data: activeCycle } = await supabase
    .from("review_cycles")
    .select("*")
    .lte("start_date", now)
    .gte("end_date", now)
    .eq("is_active", true)
    .single()

  // JIKA TIDAK ADA SIKLUS AKTIF -> TENDANG KE DASHBOARD
  if (!activeCycle) {
    // Bisa redirect ke halaman error atau balik ke performance dengan parameter error
    redirect("/performance?error=cycle_closed")
  }

  // 2. Ambil daftar colleagues (KECUALI STAKEHOLDER)
  // Sesuai aturan: "semua anggota kecuali feedback untuk stakeholder"
  const { data: colleagues } = await supabase
    .from("profiles")
    .select("id, full_name, job_title")
    .neq("id", user.id) // Jangan review diri sendiri di form ini
    .neq("role", "stakeholder") // Jangan review bos
    .order("full_name", { ascending: true })

  return <ReviewFormClientPage colleagues={colleagues || []} />
}
