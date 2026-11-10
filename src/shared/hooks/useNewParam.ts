"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { replaceUrl } from "@/shared/lib/url-params"

/**
 * `?new=1` on a page: run `open` (its "new …" form) once it's `ready`, then
 * drop the param so a reload or Back doesn't open it again. The sidebar's
 * + menu links here (app-sidebar.tsx, NEW_ITEMS).
 */
export function useNewParam(open: () => void, ready = true) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const wanted = searchParams.get("new") === "1"
  const openRef = useRef(open)
  openRef.current = open
  useEffect(() => {
    if (!wanted || !ready) return
    openRef.current()
    const params = new URLSearchParams(searchParams.toString())
    params.delete("new")
    const query = params.toString()
    replaceUrl(query ? `${pathname}?${query}` : pathname)
  }, [wanted, ready, pathname, searchParams])
}
