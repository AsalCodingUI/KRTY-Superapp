"use server"

import { createAdminClient } from "@/shared/api/supabase/admin"
import { headers } from "next/headers"
import {
  portalByToken,
  signInToPortal,
  signOutOfPortal,
} from "@/shared/lib/portal"

export type UnlockResult =
  | { ok: true }
  | { ok: false; reason: "wrong" | "locked" | "missing" }

/** The visitor's address as the proxy passed it on (first hop). */
async function clientIp() {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null
  )
}

/** Checks the PIN (5 tries per visitor, then 15 minutes locked; many
 *  across visitors lock the portal) and signs in. */
export async function unlockPortal(
  token: string,
  pin: string,
): Promise<UnlockResult> {
  const portal = await portalByToken(token)
  if (!portal) return { ok: false, reason: "missing" }
  const { data } = await createAdminClient().rpc(
    "check_project_portal_pin" as never,
    {
      p_token: portal.token,
      p_pin: pin.trim(),
      p_ip: await clientIp(),
    } as never,
  )
  const result = data as unknown as string | null
  if (result !== "ok") {
    return {
      ok: false,
      reason:
        result === "locked"
          ? "locked"
          : result === "missing"
            ? "missing"
            : "wrong",
    }
  }
  await signInToPortal(portal)
  return { ok: true }
}

export async function leavePortal(token: string) {
  const portal = await portalByToken(token)
  if (portal) await signOutOfPortal(portal)
}
