"use client"

import { tauri } from "@/shared/lib/desktop-app"

/**
 * What a sign-out leaves behind on this device, cleared (call it after
 * `auth.signOut()`, before the reload):
 * - Kretya Flow's Leads sites close and lose their sign-ins (cookies,
 *   storage: the studio's inboxes), see desktop/src-tauri/src/leads.rs;
 * - the search's recent results (useGlobalSearch's RECENT_KEY), names of
 *   people and projects the next person here shouldn't see.
 */
export async function afterSignOut() {
  try {
    localStorage.removeItem("global_search_recent")
  } catch {}
  try {
    await tauri()?.core.invoke("leads_reset")
  } catch {}
}
