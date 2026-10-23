import { getT } from "@/shared/i18n/server"
import { createClient } from "@/shared/api/supabase/server"
import { logError } from "@/shared/lib/utils/logger"
import { canManageByRole } from "@/shared/lib/roles"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/migrate
 * Run database migrations
 * This is a one-time endpoint to add the event_type column
 */
export async function POST(request: NextRequest) {
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!canManageByRole(profile?.role)) {
      return NextResponse.json({ error: t("adminOnly") }, { status: 403 })
    }

    // Execute the migration SQL
    // Note: Supabase doesn't support DDL via the client, so we'll use the SQL editor approach
    // For now, we'll return instructions

    return NextResponse.json({
      success: false,
      message: t("migrateRunSql"),
      sql: `
-- Add event_type column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Event';

-- Add index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
            `.trim(),
    })
  } catch (error) {
    logError("Migration error:", error)
    return NextResponse.json(
      {
        error: t("migrateFailed"),
        sql: `
-- Add event_type column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Event';

-- Add index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
            `.trim(),
      },
      { status: 500 },
    )
  }
}
