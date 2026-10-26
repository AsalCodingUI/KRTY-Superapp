/**
 * Filled icons for the notification list, one per kind (24px grid, the
 * line icons' shapes filled in; inner details cut out with evenodd).
 */
type IconProps = { className?: string }

function Filled({ d, className }: { d: string } & IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  )
}

const CALENDAR =
  "M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1ZM5 8.5h14V10H5z"

const make = (d: string) =>
  function Icon({ className }: IconProps) {
    return <Filled d={d} className={className} />
  }

export const BellFilled = make(
  "M12 2a6 6 0 0 0-6 6v3.6l-1.7 3.1A1 1 0 0 0 5.2 16h13.6a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6Zm-3 16a3 3 0 0 0 6 0Z",
)
export const MegaphoneFilled = make(
  "M18.5 4.1a1 1 0 0 1 1.5.86v14.08a1 1 0 0 1-1.5.86L14 17.3V6.7l4.5-2.6ZM12.5 7v10H11v3a1 1 0 0 1-1 1H8.6a1 1 0 0 1-.97-.76L6.7 17H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4h6.5ZM22 10a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z",
)
export const CalendarCheckFilled = make(
  `${CALENDAR}M15.9 12.6l-4.6 4.6-2.7-2.7 1.06-1.06 1.64 1.64 3.54-3.54z`,
)
export const CalendarEventFilled = make(`${CALENDAR}M14 13.5h3v3h-3z`)
export const ClockFilled = make(
  "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20ZM11.25 6.5h1.5v5.19l3.28 3.28-1.06 1.06-3.72-3.72z",
)
export const UserFilled = make(
  "M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM3 20a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z",
)
export const StarFilled = make(
  "M12.9 2.9l2.4 4.9 5.4.8a1 1 0 0 1 .55 1.7l-3.9 3.8.92 5.4a1 1 0 0 1-1.45 1.05L12 18l-4.82 2.54a1 1 0 0 1-1.45-1.05l.92-5.4-3.9-3.8a1 1 0 0 1 .55-1.7l5.4-.8 2.4-4.9a1 1 0 0 1 1.8 0Z",
)
export const ChartFilled = make(
  "M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM7.25 12h1.5v5h-1.5zM11.25 7.5h1.5V17h-1.5zM15.25 10h1.5v7h-1.5z",
)
export const MessageFilled = make(
  "M5 3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-5.5L8.6 21.4A1 1 0 0 1 7 20.6V18H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM7 8.25h10v1.5H7zM7 11.75h7v1.5H7z",
)
export const CheckCircleFilled = make(
  "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20ZM16.3 8.6l-5.55 5.55-3-3-1.06 1.06 4.06 4.06 6.6-6.6z",
)
export const FolderFilled = make(
  "M2.5 6A2.5 2.5 0 0 1 5 3.5h4.38a2.5 2.5 0 0 1 1.77.73L12.92 6H19a2.5 2.5 0 0 1 2.5 2.5v9.5A2.5 2.5 0 0 1 19 20.5H5A2.5 2.5 0 0 1 2.5 18Z",
)
export const BookFilled = make(
  "M2 5a1 1 0 0 1 1-1h5a4 4 0 0 1 3.25 1.67V20.5A3 3 0 0 0 8.75 19H3a1 1 0 0 1-1-1ZM22 5a1 1 0 0 0-1-1h-5a4 4 0 0 0-3.25 1.67V20.5A3 3 0 0 1 15.25 19H21a1 1 0 0 0 1-1Z",
)
export const FileFilled = make(
  "M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.5 1.5V8a.5.5 0 0 0 .5.5h4.5ZM8 12.25h8v1.5H8zM8 16.25h8v1.5H8zM8 8.25h3v1.5H8z",
)
