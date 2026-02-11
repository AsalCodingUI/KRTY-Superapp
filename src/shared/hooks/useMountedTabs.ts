"use client"

import { useEffect, useState } from "react"

export function useMountedTabs<T extends string>(activeTab: T) {
  const [mountedTabs, setMountedTabs] = useState<Set<T>>(
    () => new Set([activeTab]),
  )

  useEffect(() => {
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev
      const next = new Set(prev)
      next.add(activeTab)
      return next
    })
  }, [activeTab])

  const isMounted = (tab: T) => mountedTabs.has(tab)

  return { mountedTabs, isMounted }
}
