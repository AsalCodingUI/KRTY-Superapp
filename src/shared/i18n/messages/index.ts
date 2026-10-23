import { common } from "./common"
import { nav } from "./nav"
import { shell } from "./shell"
import { auth } from "./auth"
import { dashboard } from "./dashboard"
import { leave } from "./leave"
import { calendar } from "./calendar"
import { teams } from "./teams"
import { performance } from "./performance"
import { projects } from "./projects"
import { calculator } from "./calculator"
import { sla } from "./sla"
import { settings } from "./settings"
import { policies } from "./policies"
import { finance } from "./finance"
import { clients } from "./clients"
import { processes } from "./processes"
import { invoices } from "./invoices"
import { api } from "./api"

/**
 * Every namespace, one file each (messages/<name>.ts). Add new namespaces
 * here; pages read them with useT("<name>") or getT("<name>").
 */
export const messages = {
  common,
  nav,
  shell,
  auth,
  dashboard,
  leave,
  calendar,
  teams,
  performance,
  projects,
  calculator,
  sla,
  settings,
  policies,
  finance,
  clients,
  processes,
  invoices,
  api,
}

export type Namespace = keyof typeof messages
export type MessageKey<N extends Namespace> = keyof (typeof messages)[N]["id"]
