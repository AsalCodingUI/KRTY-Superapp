"use client"

import { tauri } from "@/shared/lib/desktop-app"

/**
 * Kretya Flow's lead web views (desktop/src-tauri/src/leads.rs): each site a
 * native web view laid over the page sheet. Outside the app (a browser, or
 * an app build before Leads) these do nothing.
 */
export const inApp = () => Boolean(tauri())

/** Shows `id` over `rect` (CSS pixels from the window's top left). True
 *  when the app did; false outside it or in a build without Leads. */
export async function showLead(
  id: string,
  url: string,
  rect: { x: number; y: number; width: number; height: number },
): Promise<boolean> {
  const t = tauri()
  if (!t) return false
  try {
    await t.core.invoke("lead_show", {
      id,
      url,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    })
    return true
  } catch {
    return false
  }
}

export async function hideLeads() {
  try {
    await tauri()?.core.invoke("lead_hide")
  } catch {}
}

export async function closeLead(id: string) {
  try {
    await tauri()?.core.invoke("lead_close", { id })
  } catch {}
}
