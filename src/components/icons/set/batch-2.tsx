/**
 * Kretya set, batch 2 (redrawn from the Untitled UI base, named after the
 * Untitled glyph). Same rules as the first 20 in ../custom: 24px grid,
 * 1.5 stroke, round caps and joins, live area 3–21, containers rx 3,
 * circles r 8.5, arrowheads open with ~5.75 legs. Shared sub-shapes
 * (square frame, card, file, folder, image mountain) are reused exactly.
 */
import { dots, glyph } from "../custom"

const FRAME =
  "M3.5 6.5a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3Z"
const CIRCLE = "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
const CARD =
  "M3 8.5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3ZM3 10h18"
const FILE =
  "M13.5 3.5H7.25A2.75 2.75 0 0 0 4.5 6.25v11.5a2.75 2.75 0 0 0 2.75 2.75h9.5a2.75 2.75 0 0 0 2.75-2.75V9.5ZM13.5 3.5v4a2 2 0 0 0 2 2h4"
const FOLDER =
  "M3.5 7.25a2.75 2.75 0 0 1 2.75-2.75h2.9a2 2 0 0 1 1.6.8l1.1 1.4a2 2 0 0 0 1.6.8h4.3a2.75 2.75 0 0 1 2.75 2.75v7.5a2.75 2.75 0 0 1-2.75 2.75H6.25a2.75 2.75 0 0 1-2.75-2.75Z"
const MOUNTAIN = "M6.25 20.5l8.19-8.19a1.5 1.5 0 0 1 2.12 0l3.94 3.94"
const SUN = "M10.75 9a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z"
const EYE =
  "M3.2 12.9a1.9 1.9 0 0 1 0-1.8C5.1 7.7 8.4 5.5 12 5.5s6.9 2.2 8.8 5.6a1.9 1.9 0 0 1 0 1.8c-1.9 3.4-5.2 5.6-8.8 5.6s-6.9-2.2-8.8-5.6Z"

export const Code02 = glyph(
  "Code02",
  "M16.5 7.25 20.75 12 16.5 16.75M7.5 7.25 3.25 12l4.25 4.75M13.75 4.5l-3.5 15",
)
export const Columns02 = glyph("Columns02", `${FRAME}M12 3.5v17`)
export const Columns03 = glyph("Columns03", `${FRAME}M9.17 3.5v17M14.83 3.5v17`)
export const Copy04 = glyph(
  "Copy04",
  "M8.5 11a2.5 2.5 0 0 1 2.5-2.5h7a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8.5 18ZM15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5M14.5 12v5M12 14.5h5",
)
export const Copy06 = glyph(
  "Copy06",
  "M3.5 10a3 3 0 0 1 3-3h7.5a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3H6.5a3 3 0 0 1-3-3ZM7.5 3.5h8.5a4.5 4.5 0 0 1 4.5 4.5v8.5",
)
export const Copy07 = glyph(
  "Copy07",
  "M3.5 11a2.5 2.5 0 0 1 2.5-2.5h7a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18ZM8.5 6A2.5 2.5 0 0 1 11 3.5M18 3.5A2.5 2.5 0 0 1 20.5 6M20.5 13a2.5 2.5 0 0 1-2.5 2.5M14.5 3.5h.01M20.5 9.5h.01",
)
export const CornerDownLeft = glyph(
  "CornerDownLeft",
  "M19.5 4.5V8a6 6 0 0 1-6 6h-9M10 8.25 4.25 14 10 19.75",
)
export const CornerDownRight = glyph(
  "CornerDownRight",
  "M4.5 4.5V8a6 6 0 0 0 6 6h9M14 8.25 19.75 14 14 19.75",
)
export const CornerLeftUp = glyph(
  "CornerLeftUp",
  "M19.75 19.5H16a6 6 0 0 1-6-6v-9M4.25 10 10 4.25 15.75 10",
)
export const CreditCard01 = glyph("CreditCard01", CARD)
export const CreditCard02 = glyph("CreditCard02", `${CARD}M6.75 14.5h4`)
export const CurrencyDollarCircle = glyph(
  "CurrencyDollarCircle",
  `${CIRCLE}M9.38 14a1.75 1.75 0 0 0 1.75 1.75h1.62a1.88 1.88 0 0 0 0-3.75h-1.5a1.88 1.88 0 0 1 0-3.75h1.63A1.75 1.75 0 0 1 14.63 10M12 6.25v2M12 15.75v2`,
)
export const CursorClick01 = glyph(
  "CursorClick01",
  "M11.15 9.57 18.17 11.96a1 1 0 0 1 .11 1.85l-2.87 1.36a.5.5 0 0 0-.24.24l-1.36 2.87a1 1 0 0 1-1.85-.11L9.57 11.15a1.25 1.25 0 0 1 1.58-1.58ZM9 3.25V5M3.25 9H5M4.9 4.9l1.25 1.25M13.1 4.9l-1.25 1.25M4.9 13.1l1.25-1.25",
)
export const Dataflow03 = glyph(
  "Dataflow03",
  "M3 4.5A1.5 1.5 0 0 1 4.5 3h2A1.5 1.5 0 0 1 8 4.5v2A1.5 1.5 0 0 1 6.5 8h-2A1.5 1.5 0 0 1 3 6.5ZM9.5 11A1.5 1.5 0 0 1 11 9.5h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2A1.5 1.5 0 0 1 9.5 13ZM16 17.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5ZM8 5.5h8.25a2.5 2.5 0 0 1 2.5 2.5v1.5a2.5 2.5 0 0 1-2.5 2.5H14.5M16 18.5H7.75a2.5 2.5 0 0 1-2.5-2.5v-1.5A2.5 2.5 0 0 1 7.75 12H9.5",
)
export const Divider = glyph(
  "Divider",
  "M3.5 3.5v1a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-1M3.5 20.5v-1a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v1M3.5 12h.01M7.75 12h.01M12 12h.01M16.25 12h.01M20.5 12h.01",
)
export const Dotpoints02 = glyph(
  "Dotpoints02",
  "M10 6h10.5M10 12h10.5M10 18h10.5M5.75 6a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5.75 18a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z",
)
export const DotsHorizontal = dots("DotsHorizontal", [5.5, 12, 18.5], [12])
export const DotsVertical = dots("DotsVertical", [12], [5.5, 12, 18.5])
export const Download01 = glyph(
  "Download01",
  "M3.5 15v2.5a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3V15M12 3.5v11.25M6.25 9.25 12 15l5.75-5.75",
)
export const Edit04 = glyph(
  "Edit04",
  "M4 20l.9-4.1a2 2 0 0 1 .54-.98L15.3 5.05a2.1 2.1 0 0 1 2.97 0l.68.68a2.1 2.1 0 0 1 0 2.97l-9.87 9.86a2 2 0 0 1-.98.54ZM13.75 6.6l3.65 3.65M12.75 20c.75-.75 1.5-1.25 2.5-1.25 1.5 0 2 1.25 3.25 1.25.75 0 1.5-.4 2-1.25",
)
export const Edit05 = glyph(
  "Edit05",
  "M11 4.5H7.5A3.5 3.5 0 0 0 4 8v9a3.5 3.5 0 0 0 3.5 3.5h9A3.5 3.5 0 0 0 20 17v-4M9 15l.5-2.75a1.5 1.5 0 0 1 .42-.8l7.6-7.6a1.8 1.8 0 0 1 2.55 2.55l-7.6 7.6a1.5 1.5 0 0 1-.8.42Z",
)
export const Eraser = glyph(
  "Eraser",
  "M4.49 13.01 11.51 5.99a1.75 1.75 0 0 1 2.48 0l4.52 4.52a1.75 1.75 0 0 1 0 2.48l-7.29 7.29a.75.75 0 0 1-.53.22h-.88a.75.75 0 0 1-.53-.22l-4.79-4.79a1.75 1.75 0 0 1 0-2.48ZM8 9.5l7 7M11 20.5h9.25",
)
export const Expand06 = glyph(
  "Expand06",
  "M4 9V4h5M4 4l5.5 5.5M20 9V4h-5M20 4l-5.5 5.5M4 15v5h5M4 20l5.5-5.5M20 15v5h-5M20 20l-5.5-5.5",
)
export const Eye = glyph("Eye", `${EYE}M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z`)
export const EyeOff = glyph(
  "EyeOff",
  "M9.42 5.88C10.25 5.63 11.12 5.5 12 5.5c3.6 0 6.9 2.2 8.8 5.6a1.9 1.9 0 0 1 0 1.8c-.52.93-1.15 1.78-1.86 2.51M14.58 18.12c-.83.25-1.7.38-2.58.38-3.6 0-6.9-2.2-8.8-5.6a1.9 1.9 0 0 1 0-1.8c.52-.93 1.15-1.78 1.86-2.51M9.88 9.88a3 3 0 1 0 4.24 4.24M4 4l16 16",
)
export const FaceSmile = glyph(
  "FaceSmile",
  `${CIRCLE}M8.5 14c.8 1.25 2 2 3.5 2s2.7-.75 3.5-2M9 9.25v1M15 9.25v1`,
)
export const File03 = glyph(
  "File03",
  "M4.5 6.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3ZM8.5 13.5v3M12 7.5v9M15.5 10.5v6",
)
export const File04 = glyph("File04", FILE)
export const File05 = glyph("File05", `${FILE}M8.5 13.25h7M8.5 16.5h4.5`)
export const File06 = glyph(
  "File06",
  `${FILE}M8.5 10h2.5M8.5 13.25h7M8.5 16.5h7`,
)
export const FilePlus02 = glyph(
  "FilePlus02",
  `${FILE}M12 11.5V17M9.25 14.25h5.5`,
)
export const FilterLines = glyph(
  "FilterLines",
  "M3.5 6.5h17M6.5 12h11M9.5 17.5h5",
)
export const Flag01 = glyph(
  "Flag01",
  "M5 20.75V4M5 4c1-.5 2.25-.75 3.5-.75 2.25 0 4.25 1.5 6.5 1.5 1.75 0 3.25-.25 4.5-.75v11c-1.25.5-2.75.75-4.5.75-2.25 0-4.25-1.5-6.5-1.5-1.25 0-2.5.25-3.5.75",
)
export const FlipBackward = glyph(
  "FlipBackward",
  "M3.75 10H16a4.5 4.5 0 0 1 0 9h-4M9 4.5 3.5 10 9 15.5",
)
export const FlipForward = glyph(
  "FlipForward",
  "M20.25 10H8a4.5 4.5 0 0 0 0 9h4M15 4.5l5.5 5.5-5.5 5.5",
)
/** Same drawing as Folder in ../custom (one folder for every variant). */
export const Folder = glyph("Folder", FOLDER)
export const FolderDownload = glyph(
  "FolderDownload",
  `${FOLDER}M12 10.25v6.25M9 13.75l3 3 3-3`,
)
export const FolderPlus = glyph(
  "FolderPlus",
  `${FOLDER}M12 10.75v5.5M9.25 13.5h5.5`,
)
export const GitBranch01 = glyph(
  "GitBranch01",
  "M4 3.5v10a3.75 3.75 0 0 0 3.75 3.75h6.75M4 7.5h10.5M20 7.5a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0ZM20 17.25a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0Z",
)
export const Globe01 = glyph(
  "Globe01",
  `${CIRCLE}M3.5 12h17M12 3.5c-2.25 2.4-3.5 5.3-3.5 8.5s1.25 6.1 3.5 8.5c2.25-2.4 3.5-5.3 3.5-8.5S14.25 5.9 12 3.5Z`,
)
export const GoogleChrome = glyph(
  "GoogleChrome",
  `${CIRCLE}M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM12 8.5h7.75M15.03 13.75l-3.87 6.71M8.97 13.75 5.1 7.04`,
)
export const Hash01 = glyph("Hash01", "M4 8.5h16M4 15.5h16M8.5 4v16M15.5 4v16")
export const Heading01 = glyph(
  "Heading01",
  "M6.5 4.5v15M17.5 4.5v15M6.5 12h11M4.5 4.5h4M15.5 4.5h4M4.5 19.5h4M15.5 19.5h4",
)
export const Heading02 = glyph(
  "Heading02",
  "M6 4.5v15M9.5 4.5v15M17.5 4.5v15M9.5 12h8M4 4.5h7.5M15.5 4.5h4M4 19.5h7.5M15.5 19.5h4",
)
export const HeadingSquare = glyph(
  "HeadingSquare",
  `${FRAME}M8.5 7.5v9M15.5 7.5v9M8.5 12h7`,
)
export const Heart = glyph(
  "Heart",
  "M12 6.5C10.4 4.4 7.3 3.6 5.1 5.5c-2.2 1.9-2.5 5-.8 7.2 1.5 1.9 5.6 5.6 7.1 6.9a.9.9 0 0 0 1.2 0c1.5-1.3 5.6-5 7.1-6.9 1.7-2.2 1.4-5.3-.8-7.2-2.2-1.9-5.3-1.1-6.9 1Z",
)
export const HelpCircle = glyph(
  "HelpCircle",
  `${CIRCLE}M9.6 9.4a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.4-2.5 3.4M12 16.75h.01`,
)
export const Image01 = glyph("Image01", `${FRAME}${MOUNTAIN}${SUN}`)
/** A closed two-peak landscape in the shared frame (Image01 keeps the
 *  shared open mountain and sun). */
export const Image04 = glyph(
  "Image04",
  `${FRAME}M7.21 15.36 9.22 12.11a.75.75 0 0 1 1.2-.11l.85.96a.5.5 0 0 0 .82-.1l1.42-2.7a.75.75 0 0 1 1.35.06l2.2 5.24a.75.75 0 0 1-.69 1.04H7.85a.75.75 0 0 1-.64-1.14Z`,
)
export const ImagePlus = glyph(
  "ImagePlus",
  `M12.5 3.5h-6a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-6M18 3.5v5M15.5 6h5${MOUNTAIN}${SUN}`,
)
