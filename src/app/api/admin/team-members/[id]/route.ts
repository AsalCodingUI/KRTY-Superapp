import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const actorProfile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      is_super_admin: boolean | null
    }>(supabase, "id, email, is_super_admin, created_at", user.id, user.email)

    if (!actorProfile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (actorProfile.id === id) {
      return NextResponse.json(
        { error: "You cannot delete the account you are currently using." },
        { status: 400 },
      )
    }

    const adminSupabase = createAdminClient()

    const { data: targetProfile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", id)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    if (!targetProfile?.id) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    const normalizedEmail = targetProfile.email?.trim().toLowerCase() || null

    const { data: relatedProfiles, error: relatedProfilesError } =
      normalizedEmail
        ? await adminSupabase
            .from("profiles")
            .select("id, email")
            .eq("email", normalizedEmail)
        : await adminSupabase
            .from("profiles")
            .select("id, email")
            .eq("id", targetProfile.id)

    if (relatedProfilesError) {
      throw relatedProfilesError
    }

    const profileIdsToDelete = Array.from(
      new Set((relatedProfiles || []).map((profile) => profile.id)),
    )

    if (profileIdsToDelete.includes(actorProfile.id)) {
      return NextResponse.json(
        { error: "You cannot delete the account you are currently using." },
        { status: 400 },
      )
    }

    const { data: authUsers, error: authUsersError } =
      await adminSupabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

    if (authUsersError) {
      throw authUsersError
    }

    const matchingAuthUsers = authUsers.users.filter(
      (authUser) =>
        profileIdsToDelete.includes(authUser.id) ||
        (normalizedEmail !== null &&
          authUser.email?.toLowerCase() === normalizedEmail),
    )

    for (const matchingAuthUser of matchingAuthUsers) {
      const { error: deleteAuthError } =
        await adminSupabase.auth.admin.deleteUser(matchingAuthUser.id)

      if (deleteAuthError) {
        throw deleteAuthError
      }
    }

    const { error: deleteProfileError } = await adminSupabase
      .from("profiles")
      .delete()
      .in("id", profileIdsToDelete)

    if (deleteProfileError) {
      const message = deleteProfileError.message.toLowerCase()
      const relatedDataBlocked =
        message.includes("foreign key") || message.includes("violates")

      return NextResponse.json(
        {
          error: relatedDataBlocked
            ? "This account is still linked to other records and cannot be deleted yet."
            : "Failed to delete this account.",
        },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: targetProfile.id,
        deleted_profile_ids: profileIdsToDelete,
        email: normalizedEmail,
      },
    })
  } catch (error) {
    console.error("Delete team member API error", error)
    return NextResponse.json(
      { error: "Failed to delete team member." },
      { status: 500 },
    )
  }
}
