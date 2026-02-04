-- Add recurrence support columns to calendar_events table
-- Run this in Supabase SQL Editor

-- Add is_recurring column (boolean, default false)
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurrence_rule column (text, stores RRule string)
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

-- Add comment for documentation
COMMENT ON COLUMN calendar_events.is_recurring IS 'Whether this event repeats (has recurrence)';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'RRule string for recurring events (RFC 5545 format)';
