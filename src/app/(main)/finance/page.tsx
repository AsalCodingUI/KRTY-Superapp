import { FinancePage } from "@/page-slices/finance/ui/FinancePage"

export const dynamic = "force-dynamic"

export default function FinanceRoute() {
  return <FinancePage tab="overview" />
}
