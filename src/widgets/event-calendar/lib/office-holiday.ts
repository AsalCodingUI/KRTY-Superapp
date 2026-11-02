import { createClient } from "@/shared/api/supabase/client"
import { idHolidayRange, type IdHoliday } from "@/shared/lib/id-holidays"
import { getEventTypeDefinition } from "./event-color-registry"

/**
 * Office holidays made from a national one: a "Company Holiday" row linked
 * by `holiday_key` (everyone sees it). Shared by the holiday dialog and the
 * calendar's right-click menu. Both resolve to false on failure.
 */

export const officeHolidayKey = (key: string) => ["holiday-office", key]

/** Turn the national holiday into an office holiday. */
export async function setOfficeHoliday(
  holiday: IdHoliday,
  holidayKey: string,
  userId: string | null,
) {
  const { start, end } = idHolidayRange(holiday.date)
  const { error } = await createClient()
    .from("calendar_events")
    .insert({
      title: holiday.name,
      description: holiday.description,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      all_day: true,
      event_type: "Company Holiday",
      color: getEventTypeDefinition("Company Holiday")?.color ?? "emerald",
      user_id: userId,
      holiday_key: holidayKey,
    })
  // 23505: someone set it already (unique holiday_key).
  return !error || error.code === "23505"
}

/** Undo it (delete the linked row). */
export async function unsetOfficeHoliday(holidayKey: string) {
  const { error } = await createClient()
    .from("calendar_events")
    .delete()
    .eq("holiday_key", holidayKey)
  return !error
}
