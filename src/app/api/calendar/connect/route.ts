import { NextResponse } from "next/server"
import { logError } from "@/shared/lib/utils/logger"

/**
 * GET - Check Google Calendar connection status
 */
export async function GET() {
  try {
    // Check if Google credentials are configured
    const hasCredentials = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    )

    return NextResponse.json({
      isConnected: hasCredentials,
    })
  } catch (error) {
    logError("Error checking Google Calendar connection:", error)
    return NextResponse.json(
      { isConnected: false, error: "Failed to check connection" },
      { status: 500 },
    )
  }
}
