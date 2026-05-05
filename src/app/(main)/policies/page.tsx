import { getPolicies } from "@/app/(main)/policies/actions/policy-actions"
import { PoliciesPage } from "@/page-slices/policies"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"

export const dynamic = "force-dynamic"

export default async function PoliciesRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null

  if (user) {
    const effectiveUserId = await resolveEffectiveUserId(
      supabase,
      user.id,
      user.email,
    )

    const { data: effectiveProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", effectiveUserId)
      .maybeSingle()

    role = effectiveProfile?.role ?? null
  }

  const { data: policies } = await getPolicies(canManageByRole(role))

  return <PoliciesPage role={role} policies={policies} />
}
