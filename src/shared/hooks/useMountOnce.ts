"use client"

import { useState } from "react"

/** True from the first time `open` is true onwards: mount a lazy dialog on
 *  its first open and keep it mounted so the close animation plays. */
export function useMountOnce(open: boolean) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  return mounted
}
