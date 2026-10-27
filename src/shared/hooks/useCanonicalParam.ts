"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Rewrites `?name=` to its canonical value in place (an old id link becomes
 * the readable key) without adding a history entry.
 */
export function useCanonicalParam(
  name: string,
  current: string | null,
  canonical: string | null | undefined,
) {
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    if (!current || !canonical || current === canonical) return
    const params = new URLSearchParams(window.location.search)
    params.set(name, canonical)
    router.replace(`${pathname}?${params}`, { scroll: false })
  }, [name, current, canonical, pathname, router])
}
