-- Add event_type column to calendar_events table
-- This column stores the type of event: Internal, WFH, Cuti, Event, 301Meeting, CompanyHoliday, etc.

ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Event';

-- Add index for filtering by event type
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
