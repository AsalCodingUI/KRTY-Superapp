import { RouteMessages } from "@/shared/i18n/route-messages"

/** This route's own strings (shared/i18n/scopes.ts ROUTE_NAMESPACES). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RouteMessages namespaces={["contracts", "briefs"]}>{children}</RouteMessages>
  )
}
