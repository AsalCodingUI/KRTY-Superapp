"use client"

import { createContext, useContext } from "react"

/**
 * Where floating popups (select, popover, menu, tooltip) portal to; null is
 * the body. Lets a region with its own theme (a dark panel) keep it in its
 * popups.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export const usePortalContainer = () =>
  useContext(PortalContainerContext) ?? undefined
