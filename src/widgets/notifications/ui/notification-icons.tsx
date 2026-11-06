/**
 * Filled icons for the notification list and the open tab of the tab
 * bars: each is the filled twin of our outline glyph of the same thing
 * (same paths, src/components/icons). The glyph's outline is filled and
 * stroked at STROKE, so the silhouette is exactly the outline icon's; its
 * inner details are cut out at the same stroke width through a mask.
 */
import { STROKE, VIEWBOX } from "@/components/icons/custom"
import { useId } from "react"

type IconProps = { className?: string }

type Twin = {
  /** The outline glyph's outer shapes: filled and stroked. */
  shape: string
  /** Inner details, cut out as STROKE-wide lines. Lines that split the
   *  shape run past its edge; the rest
   *  stop one stroke inside it, so the edge stays whole. */
  lines?: string
  /** Openings cut out as areas (a door). */
  holes?: string
}

export function filledTwin(name: string, { shape, lines, holes }: Twin) {
  function Icon({ className }: IconProps) {
    const id = useId()
    const pen = {
      strokeWidth: STROKE,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    } as const
    return (
      <svg viewBox={VIEWBOX} aria-hidden className={className}>
        <mask
          id={id}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <path d={shape} fill="#fff" stroke="#fff" {...pen} />
          {lines && <path d={lines} fill="none" stroke="#000" {...pen} />}
          {holes && <path d={holes} fill="#000" />}
        </mask>
        <rect width="24" height="24" fill="currentColor" mask={`url(#${id})`} />
      </svg>
    )
  }
  Icon.displayName = name
  return Icon
}

/** The calendar body and rings (CalendarDays, CalendarCheck). */
const CALENDAR =
  "M3.75 8A3 3 0 0 1 6.75 5H17.25A3 3 0 0 1 20.25 8V17.5A3 3 0 0 1 17.25 20.5H6.75A3 3 0 0 1 3.75 17.5ZM8 3V6.5M16 3V6.5"
const CALENDAR_HEAD = "M5.75 10H18.25"

/** The file outline and its fold (FileText, Newspaper, File). */
const FILE =
  "M7.5 2.75H14.086a1 1 0 0 1 0.707 0.293L19.207 7.457a1 1 0 0 1 0.293 0.707V18.25a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3V5.75a3 3 0 0 1 3-3Z"
const FILE_FOLD = "M14.5 0.5V6.75a1 1 0 0 0 1 1H23"

const CIRCLE = "M21.25 12a9.25 9.25 0 1 1 -18.5 0 9.25 9.25 0 0 1 18.5 0Z"

/** Bell. */
export const BellFilled = filledTwin("BellFilled", {
  shape:
    "M18 8.83A6 6 0 0 0 6 8.83V13.23L4.55 14.98A0.9 0.9 0 0 0 5.25 16.45H18.75A0.9 0.9 0 0 0 19.45 14.98L18 13.23ZM9.75 19.95A2.6 2.6 0 0 0 14.25 19.95",
})
/** Megaphone (Announcement01). */
export const MegaphoneFilled = filledTwin("MegaphoneFilled", {
  shape:
    "M8.25 7.5H4.75a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3.5M8.25 7.5L15.39 4.14Q16.75 3.5 16.75 5V16Q16.75 17.5 15.39 16.86L8.25 13.5ZM4.75 13.5v5a1.75 1.75 0 0 0 3.5 0v-5M20.25 8v5",
})
/** CalendarCheck. */
export const CalendarCheckFilled = filledTwin("CalendarCheckFilled", {
  shape: CALENDAR,
  lines: `${CALENDAR_HEAD}M9.375 15.25L11.125 17L14.625 13.5`,
})
/** CalendarDays (the calendar tab). */
export const CalendarEventFilled = filledTwin("CalendarEventFilled", {
  shape: CALENDAR,
  lines: `${CALENDAR_HEAD}M7.75 15.25A0.25 0.25 0 0 0 8.25 15.25A0.25 0.25 0 0 0 7.75 15.25M11.75 15.25A0.25 0.25 0 0 0 12.25 15.25A0.25 0.25 0 0 0 11.75 15.25M15.75 15.25A0.25 0.25 0 0 0 16.25 15.25A0.25 0.25 0 0 0 15.75 15.25`,
})
/** Clock. */
export const ClockFilled = filledTwin("ClockFilled", {
  shape: CIRCLE,
  lines: "M12 7.103V12l3.265 2.176",
})
/** User. */
export const UserFilled = filledTwin("UserFilled", {
  shape:
    "M16 7.75a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 20.25v-.5a4.25 4.25 0 0 1 4.25-4.25h5.5A4.25 4.25 0 0 1 19 19.75v.5",
})
/** Star. */
export const StarFilled = filledTwin("StarFilled", {
  shape:
    "M12.918 3.758L14.794 8.114A1 1 0 0 0 15.62 8.714L20.343 9.152A1 1 0 0 1 20.911 10.899L17.347 14.03A1 1 0 0 0 17.032 15.001L18.075 19.627A1 1 0 0 1 16.589 20.707L12.511 18.286A1 1 0 0 0 11.489 18.286L7.411 20.707A1 1 0 0 1 5.925 19.627L6.968 15.001A1 1 0 0 0 6.653 14.03L3.089 10.899A1 1 0 0 1 3.657 9.152L8.38 8.714A1 1 0 0 0 9.206 8.114L11.082 3.758A1 1 0 0 1 12.918 3.758Z",
})
/** Bar chart in our square (BarChartSquare02). */
export const ChartFilled = filledTwin("ChartFilled", {
  shape:
    "M6.25 3.25h11.5a3 3 0 0 1 3 3v11.5a3 3 0 0 1-3 3H6.25a3 3 0 0 1-3-3V6.25a3 3 0 0 1 3-3Z",
  lines: "M7.5 15.25V17.25M12 11.25V17.25M16.5 6.75V17.25",
})
/** Message bubble with text (MessageTextCircle01). */
export const MessageFilled = filledTwin("MessageFilled", {
  shape:
    "M20.862 11.497a8.861 8.861 0 0 1 -13.292 7.673l-3.44 1.199a0.782 0.782 0 0 1 -1.001 -0.98l1.147 -3.44A8.861 8.861 0 1 1 20.862 11.497Z",
  lines: "M7.831 9.672h5.213M7.831 13.321h8.34",
})
/** CircleCheck (the tasks tab). */
export const CheckCircleFilled = filledTwin("CheckCircleFilled", {
  shape: CIRCLE,
  lines: "M7.919 12.272l2.721 2.721 5.713 -5.713",
})
/** Folder (FolderOpen in the app: the library tab and projects). */
export const FolderFilled = filledTwin("FolderFilled", {
  shape:
    "M3.5 7a3 3 0 0 1 3-3h2.65a2 2 0 0 1 1.6.8l1.1 1.4a2 2 0 0 0 1.6.8h4.05a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3Z",
})
/** Open book (BookOpen): two pages, the spine cut between them. */
export const BookFilled = filledTwin("BookFilled", {
  shape:
    "M12 20.967c-0.871 -1.415 -2.176 -1.904 -3.809 -1.904H5.199a2.449 2.449 0 0 1 -2.449 -2.449V5.732A2.449 2.449 0 0 1 5.199 3.283H7.647a4.353 4.353 0 0 1 4.353 4.353M12 20.967c0.871 -1.415 2.176 -1.904 3.809 -1.904h2.993a2.449 2.449 0 0 0 2.449 -2.449V5.732A2.449 2.449 0 0 0 18.801 3.283H16.353a4.353 4.353 0 0 0 -4.353 4.353",
  lines: "M12 5v18.5",
})
/** FileText (documents, contracts). */
export const FileFilled = filledTwin("FileFilled", {
  shape: FILE,
  lines: `${FILE_FOLD}M8 13.5h8M8 17h5`,
})
/** Newspaper (File06: the reports tab). */
export const NewspaperFilled = filledTwin("NewspaperFilled", {
  shape: FILE,
  lines: `${FILE_FOLD}M8 10.25h3M8 13.75h8M8 17.25h8`,
})
/** LayoutGrid: our square, the cross cut through into four tiles. */
export const GridFilled = filledTwin("GridFilled", {
  shape:
    "M6.339 3.25h11.324a3.089 3.089 0 0 1 3.089 3.089v11.324a3.089 3.089 0 0 1 -3.089 3.089h-11.324a3.089 3.089 0 0 1 -3.089 -3.089v-11.324a3.089 3.089 0 0 1 3.089 -3.089Z",
  lines: "M0.5 12h23M12 0.5v23",
})
/** Home: the house, its door cut open to the ground. */
export const HomeFilled = filledTwin("HomeFilled", {
  shape:
    "M3.292 19.617L3.292 10.311A1.633 1.633 0 0 1 3.88 9.059L10.955 3.181A1.633 1.633 0 0 1 13.045 3.181L20.12 9.059A1.633 1.633 0 0 1 20.708 10.311L20.708 19.617A1.633 1.633 0 0 1 19.075 21.25L4.925 21.25A1.633 1.633 0 0 1 3.292 19.617Z",
  holes: "M9.551 23v-6.104a2.449 2.449 0 0 1 4.898 0V23Z",
})
