"use client"

import { useEffect, useState } from "react"

/**
 * True once the user has switched tabs at least once. Tab panels use it to
 * play their enter animation on switches only, not on the first page load.
 */
export function useTabSwitched(tab: string) {
  const [first] = useState(tab)
  const [switched, setSwitched] = useState(false)
  useEffect(() => {
    if (tab !== first) setSwitched(true)
  }, [tab, first])
  return switched
}

/** Classes for a tab panel: settles in when shown, after the first switch. */
export const TAB_ENTER = "animate-tab-enter motion-reduce:animate-none"
