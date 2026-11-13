import type { Namespace } from "./messages"
import { I18nScope } from "./client"
import { getClientMessages, getLocale } from "./server"

/**
 * A route's own strings (ROUTE_NAMESPACES in scopes.ts): the root layout
 * leaves them out, so every other page loads lighter; this route's layout
 * sends them. One line per layout:
 *
 *   export default function Layout({ children }) {
 *     return <RouteMessages namespaces={["calendar"]}>{children}</RouteMessages>
 *   }
 */
export async function RouteMessages({
  namespaces,
  children,
}: {
  namespaces: readonly Namespace[]
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <I18nScope messages={getClientMessages(locale, namespaces)}>
      {children}
    </I18nScope>
  )
}
