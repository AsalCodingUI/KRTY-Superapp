import { createClient } from "@/shared/api/supabase/client"
import { registerUndo, UndoStale } from "@/shared/undo"
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

async function isOfficeHoliday(holidayKey: string) {
  const { data, error } = await createClient()
    .from("calendar_events")
    .select("id")
    .eq("holiday_key", holidayKey)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

/**
 * ⌘Z for setting (`on`) or cancelling an office holiday — the same step as
 * the toast's own Undo (pass the returned id to `runUndo`). It only goes
 * back while the holiday is still the way this left it. Returns the id.
 */
export function registerOfficeHolidayUndo({
  on,
  holiday,
  holidayKey,
  userId,
  label,
  refresh,
}: {
  on: boolean
  holiday: IdHoliday
  holidayKey: string
  userId: string | null
  label: string
  refresh: () => unknown
}) {
  const to = async (set: boolean) => {
    if ((await isOfficeHoliday(holidayKey)) === set) throw new UndoStale()
    const ok = set
      ? await setOfficeHoliday(holiday, holidayKey, userId)
      : await unsetOfficeHoliday(holidayKey)
    await refresh()
    if (!ok) throw new Error("office holiday")
  }
  return registerUndo({ label, undo: () => to(!on), redo: () => to(on) })
}
