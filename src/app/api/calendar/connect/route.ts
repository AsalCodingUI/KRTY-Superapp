import { getT } from "@/shared/i18n/server"
import { NextRequest, NextResponse } from "next/server"
import { logError } from "@/shared/lib/utils/logger"
import {
  getGoogleAccessToken,
  getGoogleEnv,
} from "@/shared/lib/google-calendar"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { createClient } from "@/shared/api/supabase/server"

/**
 * GET - Check Google Calendar connection status
 */
export async function GET(request: NextRequest) {
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { isConnected: false, error: t("unauthorized") },
        { status: 401 },
      )
    }

    const hasCredentials = !!getGoogleEnv()
    if (!hasCredentials) {
      return NextResponse.json({ isConnected: false })
    }

    const accessToken = await getGoogleAccessToken()
    const isConnected = Boolean(accessToken)

    return NextResponse.json({
      isConnected,
    })
  } catch (error) {
    logError("Error checking Google Calendar connection:", error)
    return NextResponse.json(
      { isConnected: false, error: t("calendarCheckFailed") },
      { status: 500 },
    )
  }
}
