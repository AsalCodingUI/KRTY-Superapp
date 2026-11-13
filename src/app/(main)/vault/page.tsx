import { LeadViewer } from "@/page-slices/leads/ui/LeadViewer"
import type { LeadSite } from "@/page-slices/leads/model/data"

export const dynamic = "force-dynamic"

/** The studio's password manager: Vaultwarden (self-hosted Bitwarden; the
 *  web vault encrypts everything on the device), opened in the app as a
 *  Leads site is. In a browser: a link to open it in a tab. */
const VAULT: LeadSite = {
  id: "vault",
  name: "Password",
  url: "https://vault.kretyastudio.com/",
  position: 0,
}

/** Password (PMs and stakeholders: access.ts). */
export default function VaultRoute() {
  return <LeadViewer id={VAULT.id} fixed={VAULT} />
}
