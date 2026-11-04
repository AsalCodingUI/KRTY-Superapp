import { I18nScope } from "@/shared/i18n/client"
import { getClientMessages, getLocale } from "@/shared/i18n/server"

/** The home page's own strings: the root layout leaves them out (ROUTE_NAMESPACES). */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <I18nScope messages={getClientMessages(locale, ["dashboard"])}>
      {children}
    </I18nScope>
  )
}
