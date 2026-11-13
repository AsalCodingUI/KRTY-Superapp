"use client"

import { createContext, type ReactNode } from "react"

/**
 * How a document draws a link to one of the app's pages that stands on
 * its own line (the page-link block, ./page-link.tsx): the wiki gives a
 * chip with the page's icon and title, or the database's table in place.
 * Without a provider it's a plain link. Kept apart from the editor so a
 * page can provide it without loading Tiptap.
 */
export type PageLinkRenderer = (href: string, title: string) => ReactNode | null

export const PageLinkContext = createContext<PageLinkRenderer | null>(null)
