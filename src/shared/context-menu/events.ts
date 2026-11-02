/** Window events the menu sends to the rest of the app. */

/** Opens the ⌘K search; `detail.query` is typed into it. */
export const OPEN_SEARCH_EVENT = "krty:open-search"

export type OpenSearchDetail = { query?: string }

export function openAppSearch(query?: string) {
  window.dispatchEvent(
    new CustomEvent<OpenSearchDetail>(OPEN_SEARCH_EVENT, { detail: { query } }),
  )
}
