"use client"

import {
  money as formatMoney,
  rupiah as formatRupiah,
  rupiahShort as formatRupiahShort,
} from "@/entities/finance/lib/money"
import * as React from "react"

const STORAGE_KEY = "finance_hide_money"
const MASK = "•••••"

type HideMoney = { hidden: boolean; toggle: () => void }

const HideMoneyContext = React.createContext<HideMoney>({
  hidden: false,
  toggle: () => {},
})

/** Lets a viewer hide every amount on Finance (screen sharing, open office). */
export function HideMoneyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = React.useState(false)

  React.useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      // Storage blocked: start visible.
    }
  }, [])

  const toggle = React.useCallback(() => {
    setHidden((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      } catch {
        // Storage blocked: the choice lasts for this visit only.
      }
      return next
    })
  }, [])

  const value = React.useMemo(() => ({ hidden, toggle }), [hidden, toggle])
  return (
    <HideMoneyContext.Provider value={value}>
      {children}
    </HideMoneyContext.Provider>
  )
}

export const useHideMoney = () => React.useContext(HideMoneyContext)

/** The money formatters, masked while amounts are hidden. */
export function useMoneyFormat() {
  const { hidden } = useHideMoney()
  return React.useMemo(
    () =>
      hidden
        ? {
            rupiah: () => `Rp ${MASK}`,
            rupiahShort: () => `Rp ${MASK}`,
            money: (_amount: number | null | undefined, currency: string) =>
              `${currency} ${MASK}`,
          }
        : {
            rupiah: formatRupiah,
            rupiahShort: formatRupiahShort,
            money: formatMoney,
          },
    [hidden],
  )
}
