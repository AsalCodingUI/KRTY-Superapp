"use client"

import {
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { restoreQueryCache, saveQueryCache } from "@/shared/lib/query-persist"

/** The longest the first queries wait for the saved data. */
const RESTORE_TIMEOUT = 1500

/**
 * QueryProvider wraps the application with TanStack Query client.
 * Configured with 5 minute stale time. Its data is kept on this device
 * (shared/lib/query-persist): queries wait for it on load (at most
 * RESTORE_TIMEOUT), show it at once, and refresh what's stale. Data no
 * page uses stays an hour (gcTime), so pages opened in that time open
 * from it next time too.
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        setRestoring(false)
      }
    }
    const timeout = setTimeout(finish, RESTORE_TIMEOUT)
    restoreQueryCache(queryClient)
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout)
        finish()
      })

    // Saved a few seconds after data changes, and when the page is left.
    let timer: ReturnType<typeof setTimeout> | null = null
    const save = () => {
      if (timer) clearTimeout(timer)
      timer = null
      if (done) void saveQueryCache(queryClient).catch(() => {})
    }
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return
      if (!timer) timer = setTimeout(save, 3000)
    })
    const onHide = () => {
      if (document.visibilityState === "hidden") save()
    }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", save)
    return () => {
      clearTimeout(timeout)
      if (timer) clearTimeout(timer)
      unsubscribe()
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", save)
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={restoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
