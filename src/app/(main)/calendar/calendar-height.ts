/**
 * Exactly the room left in the page sheet: viewport minus the top bar, any
 * banner, the breadcrumb header (3rem), the page's bottom padding (1.5rem)
 * and, from md, the sheet's bottom margin (0.75rem). So the page itself never
 * scrolls; only the calendar grid does.
 */
export const CALENDAR_HEIGHT =
  "h-[calc(100svh-var(--app-topbar-height)-var(--app-banner-height,0px)-4.5rem)] md:h-[calc(100svh-var(--app-topbar-height)-var(--app-banner-height,0px)-5.25rem)]"
