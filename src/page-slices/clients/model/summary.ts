import {
  OPEN_STATUSES as OPEN_INVOICE,
  toIdr,
  type FxRates,
} from "@/entities/finance/lib/money"
import { OPEN_STATUSES as OPEN_PROJECT } from "@/page-slices/projects/lib/status"
import type { ClientRow } from "./data"

/** Projects and money (in IDR) for one client. */
export function summarize(client: ClientRow, rates: FxRates) {
  let received = 0
  let open = 0
  for (const p of client.projects ?? []) {
    for (const inv of p.project_invoices ?? []) {
      if (inv.status === "Draft") continue
      received +=
        toIdr(inv.amount_paid_idr, inv.currency, inv.fx_rate, rates) ?? 0
      if (OPEN_INVOICE.includes(inv.status))
        open +=
          toIdr(
            Math.max(0, Number(inv.amount_idr) - Number(inv.amount_paid_idr)),
            inv.currency,
            inv.fx_rate,
            rates,
          ) ?? 0
    }
  }
  const projects = client.projects ?? []
  return {
    projects: projects.length,
    running: projects.filter((p) => OPEN_PROJECT.includes(p.status)).length,
    received,
    open,
  }
}
