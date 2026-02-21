import { createClient } from "@/shared/api/supabase/server"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Configuration Error: Missing Webhook URL" },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { reviewee_id, cycle_id } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (!canManageByRole(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // --- STEP 1: Coba ambil data dengan filter strict (Cycle ID harus cocok) ---
    let query = supabase
      .from("performance_reviews")
      .select(`*, reviewer:profiles!reviewer_id(full_name, job_title)`)
      .eq("reviewee_id", reviewee_id)

    if (cycle_id) {
      query = query.eq("cycle_id", cycle_id)
    }

    const { data: reviews, error } = await query

    if (error) throw new Error(error.message)

    // If no reviews found, return empty result (NOT all reviews!)
    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: cycle_id
          ? `No reviews found for cycle ${cycle_id}`
          : "No reviews found for this user",
      })
    }

    // 3. Kirim Payload ke n8n
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meta: {
          reviewee_id,
          cycle_id,
          timestamp: new Date().toISOString(),
          total_reviews: reviews.length,
        },
        reviews,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logError("n8n webhook rejected request", undefined, {
        status: response.status,
        responseBody: errorText.slice(0, 1000),
      })
      return NextResponse.json({ error: "Failed to trigger workflow" }, { status: 502 })
    }

    return NextResponse.json({ success: true, count: reviews.length })
  } catch (error: unknown) {
    logError("Trigger n8n endpoint failed", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
