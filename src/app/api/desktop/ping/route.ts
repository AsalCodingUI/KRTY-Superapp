import { NextResponse } from "next/server"

/**
 * Kretya Flow's loader asks this before it opens the app: an answer that
 * isn't this one (a DNS record pointing elsewhere, a captive portal) shows
 * its "can't reach" screen instead of navigating to someone else's page.
 * Readable cross-origin (the loader runs at tauri://localhost); says
 * nothing but that this is the app.
 */
export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(
    { app: "kretya" },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  )
}
