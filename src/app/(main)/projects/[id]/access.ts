import { createClient } from "@/shared/api/supabase/server"
import { notFound, redirect } from "next/navigation"

/** RLS only returns projects the viewer may open (stakeholders, members). */
export async function assertProjectAccess(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .maybeSingle()
  if (!data) notFound()
}
