import { NextResponse } from "next/server"
import { logError } from "@/shared/lib/utils/logger"
import { getGoogleAccessToken, getGoogleEnv } from "@/shared/lib/google-calendar"

/**
 * GET - Check Google Calendar connection status
 */
export async function GET() {
  try {
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
      { isConnected: false, error: "Failed to check connection" },
      { status: 500 },
    )
  }
}
