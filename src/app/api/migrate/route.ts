import { createClient } from '@/shared/api/supabase/server';
import { logError } from "@/shared/lib/utils/logger"
import { NextResponse } from 'next/server';

/**
 * POST /api/migrate
 * Run database migrations
 * This is a one-time endpoint to add the event_type column
 */
export async function POST() {
    try {
        const supabase = await createClient();

        // Check if user is authenticated and is an admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('app_role')
            .eq('id', user.id)
            .single();

        if (profile?.app_role !== 'stakeholder') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        // Execute the migration SQL
        // Note: Supabase doesn't support DDL via the client, so we'll use the SQL editor approach
        // For now, we'll return instructions

        return NextResponse.json({
            success: false,
            message: 'Please run the following SQL in Supabase SQL Editor',
            sql: `
-- Add event_type column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Event';

-- Add index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
            `.trim()
        });

    } catch (error) {
        logError('Migration error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            sql: `
-- Add event_type column to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Event';

-- Add index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
            `.trim()
        }, { status: 500 });
    }
}
