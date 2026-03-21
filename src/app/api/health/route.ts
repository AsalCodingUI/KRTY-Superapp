import { NextResponse } from "next/server"

/**
 * Health check endpoint for monitoring & deployment platforms.
 * Zeabur, uptime monitors, and load balancers can ping this.
 *
 * GET /api/health → { status: "ok", timestamp: "..." }
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 },
  )
}
