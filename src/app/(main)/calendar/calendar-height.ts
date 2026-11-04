/**
 * Exactly the room left in the page sheet: viewport minus the top bar, the
 * tab row above the sheet (md up, web), any banner, the sheet's top and
 * bottom padding (1.5rem each) and, from md, the sheet's bottom margin
 * (0.75rem). So the page itself never scrolls; only the calendar grid does.
 */
export const CALENDAR_HEIGHT =
  "h-[calc(100svh-var(--app-topbar-height)-var(--app-banner-height,0px)-4.5rem)] md:h-[calc(100svh-var(--app-topbar-height)-var(--app-tabs-height,0px)-var(--app-banner-height,0px)-3.75rem)]"
