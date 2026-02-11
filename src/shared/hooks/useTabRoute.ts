"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type UseTabRouteOptions<T extends string> = {
  basePath: string
  tabs: readonly T[]
  defaultTab: T
  preserveQuery?: boolean
  mode?: "navigate" | "history"
}

export function useTabRoute<T extends string>({
  basePath,
  tabs,
  defaultTab,
  preserveQuery = false,
  mode = "navigate",
}: UseTabRouteOptions<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const deriveActiveTab = useCallback(() => {
    if (!pathname.startsWith(basePath)) return defaultTab
    const rest = pathname.slice(basePath.length).replace(/^\/+/, "")
    const segment = rest.split("/")[0]
    if (!segment) return defaultTab
    return (tabs.includes(segment as T) ? segment : defaultTab) as T
  }, [pathname, basePath, tabs, defaultTab])

  const [historyTab, setHistoryTab] = useState<T>(() => deriveActiveTab())

  useEffect(() => {
    if (mode !== "history") return
    setHistoryTab(deriveActiveTab())
  }, [mode, deriveActiveTab])

  useEffect(() => {
    if (mode !== "history") return
    const handlePopState = () => {
      setHistoryTab(deriveActiveTab())
    }
    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [mode, deriveActiveTab])

  const activeTab = mode === "history" ? historyTab : deriveActiveTab()

  const setActiveTab = useCallback(
    (nextTab: T) => {
      const nextPath =
        nextTab === defaultTab ? basePath : `${basePath}/${nextTab}`
      const query = preserveQuery ? searchParams.toString() : ""
      const href = query ? `${nextPath}?${query}` : nextPath
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
      if (href !== current && mode === "navigate") {
        router.push(href)
      }
      if (mode === "history") {
        setHistoryTab(nextTab)
        window.history.pushState({}, "", href)
      }
    },
    [
      basePath,
      defaultTab,
      mode,
      pathname,
      preserveQuery,
      router,
      searchParams,
    ],
  )

  return { activeTab, setActiveTab }
}
