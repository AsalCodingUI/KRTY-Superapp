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
  "M13.5 3.5H7.5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9.5ZM13.5 3.5v4a2 2 0 0 0 2 2h4"
const FOLDER =
  "M3.5 7a3 3 0 0 1 3-3h2.65a2 2 0 0 1 1.6.8l1.1 1.4a2 2 0 0 0 1.6.8h4.05a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3Z"
const MOUNTAIN = "M6.25 20.5l8.19-8.19a1.5 1.5 0 0 1 2.12 0l3.94 3.94"
const SUN = "M10.75 9a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z"
/** A lens of two r 9.75 arcs, tips at x 3 and 21 (Eye; EyeOff is this, cut). */
const EYE = "M3 12A9.75 9.75 0 0 1 21 12A9.75 9.75 0 0 1 3 12Z"

export const Code02 = glyph(
  "Code02",
  "M16.757 6.979 21.25 12 16.757 17.021M7.243 6.979 2.75 12l4.493 5.021M13.85 4.071l-3.7 15.857",
)
export const Columns02 = glyph("Columns02", `${FRAME}M12 3.5v17`)
export const Columns03 = glyph("Columns03", `${FRAME}M9.17 3.5v17M14.83 3.5v17`)
export const Copy04 = glyph(
  "Copy04",
  "M11.456 8.191H17.985A3.265 3.265 0 0 1 21.25 11.456V17.985A3.265 3.265 0 0 1 17.985 21.25H11.456A3.265 3.265 0 0 1 8.191 17.985V11.456A3.265 3.265 0 0 1 11.456 8.191ZM15.809 8.191v-2.176a3.265 3.265 0 0 0 -3.265 -3.265h-6.529a3.265 3.265 0 0 0 -3.265 3.265v6.529a3.265 3.265 0 0 0 3.265 3.265h2.176M14.721 12v5.441M12 14.721h5.441",
)
export const Copy06 = glyph(
  "Copy06",
  "M2.75 9.824a3.265 3.265 0 0 1 3.265 -3.265h8.162a3.265 3.265 0 0 1 3.265 3.265v8.162a3.265 3.265 0 0 1 -3.265 3.265H6.015a3.265 3.265 0 0 1 -3.265 -3.265ZM7.103 2.75h9.25a4.897 4.897 0 0 1 4.897 4.897v9.25",
)
export const Copy07 = glyph(
  "Copy07",
  "M2.75 11.456a3.265 3.265 0 0 1 3.265 -3.265h6.529a3.265 3.265 0 0 1 3.265 3.265v6.529a3.265 3.265 0 0 1 -3.265 3.265h-6.529a3.265 3.265 0 0 1 -3.265 -3.265ZM8.518 4.589A3.265 3.265 0 0 1 10.03 3.076M13.632 2.75L15.809 2.75M19.411 3.076A3.265 3.265 0 0 1 20.924 4.589M21.25 8.191L21.25 10.368M20.924 13.97A3.265 3.265 0 0 1 19.411 15.482",
)
export const CornerDownLeft = glyph(
  "CornerDownLeft",
  "M20.567 3.433V7.423a6.84 6.84 0 0 1 -6.84 6.84h-10.26M9.738 7.708 3.183 14.262 9.738 20.817",
)
export const CornerDownRight = glyph(
  "CornerDownRight",
  "M3.433 3.433V7.423a6.84 6.84 0 0 0 6.84 6.84h10.26M14.262 7.708 20.817 14.262 14.262 20.817",
)
export const CornerLeftUp = glyph(
  "CornerLeftUp",
  "M20.835 20.567H16.56a6.84 6.84 0 0 1 -6.84 -6.84v-10.26M3.165 9.738 9.72 3.183 16.275 9.738",
)
export const CreditCard01 = glyph("CreditCard01", CARD)
export const CreditCard02 = glyph("CreditCard02", `${CARD}M6.75 14.5h4`)
export const CurrencyDollarCircle = glyph(
  "CurrencyDollarCircle",
  `${CIRCLE}M9.38 14a1.75 1.75 0 0 0 1.75 1.75h1.62a1.88 1.88 0 0 0 0-3.75h-1.5a1.88 1.88 0 0 1 0-3.75h1.63A1.75 1.75 0 0 1 14.63 10M12 6.25v2M12 15.75v2`,
)
export const CursorClick01 = glyph(
  "CursorClick01",
  "M11.914 10.113L19.917 12.837A1.14 1.14 0 0 1 20.042 14.946L16.77 16.497A0.57 0.57 0 0 0 16.497 16.77L14.946 20.042A1.14 1.14 0 0 1 12.837 19.917L10.113 11.914A1.425 1.425 0 0 1 11.914 10.113ZM9.463 2.908L9.463 4.903M2.908 9.463L4.903 9.463M4.789 4.789L6.214 6.214M14.137 4.789L12.712 6.214M4.789 14.137L6.214 12.712",
)
export const Dataflow03 = glyph(
  "Dataflow03",
  "M2.75 4.292A1.542 1.542 0 0 1 4.292 2.75h2.056A1.542 1.542 0 0 1 7.889 4.292v2.056A1.542 1.542 0 0 1 6.347 7.889h-2.056A1.542 1.542 0 0 1 2.75 6.347ZM9.431 10.972A1.542 1.542 0 0 1 10.972 9.431h2.056a1.542 1.542 0 0 1 1.542 1.542v2.056a1.542 1.542 0 0 1 -1.542 1.542h-2.056A1.542 1.542 0 0 1 9.431 13.028ZM16.111 17.653a1.542 1.542 0 0 1 1.542 -1.542h2.056a1.542 1.542 0 0 1 1.542 1.542v2.056a1.542 1.542 0 0 1 -1.542 1.542h-2.056a1.542 1.542 0 0 1 -1.542 -1.542ZM7.889 5.319h8.479a2.569 2.569 0 0 1 2.569 2.569v1.542a2.569 2.569 0 0 1 -2.569 2.569H14.569M16.111 18.681H7.632a2.569 2.569 0 0 1 -2.569 -2.569v-1.542A2.569 2.569 0 0 1 7.632 12H9.431",
)
export const Divider = glyph(
  "Divider",
  "M2.76 2.76v1.087a3.261 3.261 0 0 0 3.261 3.261h11.957a3.261 3.261 0 0 0 3.261 -3.261v-1.087M2.76 21.24v-1.087a3.261 3.261 0 0 1 3.261 -3.261h11.957a3.261 3.261 0 0 1 3.261 3.261v1.087M2.76 12h0.011M7.38 12h0.011M12 12h0.011M16.619 12h0.011M21.239 12h0.011",
)
export const Dotpoints02 = glyph(
  "Dotpoints02",
  "M10 6h10.5M10 12h10.5M10 18h10.5M5.75 6a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5.75 18a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z",
)
export const DotsHorizontal = dots("DotsHorizontal", [5.5, 12, 18.5], [12])
export const DotsVertical = dots("DotsVertical", [12], [5.5, 12, 18.5])
export const Download01 = glyph(
  "Download01",
  "M2.75 15.265v2.721a3.265 3.265 0 0 0 3.265 3.265h11.971a3.265 3.265 0 0 0 3.265 -3.265V15.265M12 2.75v12.243M5.743 9.007 12 15.265l6.257 -6.257",
)
export const Edit04 = glyph(
  "Edit04",
  "M3.25 20.708l0.982 -4.473a2.182 2.182 0 0 1 0.589 -1.069L15.577 4.399a2.291 2.291 0 0 1 3.24 0l0.742 0.742a2.291 2.291 0 0 1 0 3.24l-10.767 10.756a2.182 2.182 0 0 1 -1.069 0.589ZM13.886 6.09l3.982 3.982M12.795 20.708c0.818 -0.818 1.636 -1.364 2.727 -1.364 1.636 0 2.182 1.364 3.545 1.364 0.818 0 1.636 -0.436 2.182 -1.364",
)
export const Edit05 = glyph(
  "Edit05",
  "M10.914 4.008H7.181A3.732 3.732 0 0 0 3.449 7.741v9.597a3.732 3.732 0 0 0 3.732 3.732h9.597A3.732 3.732 0 0 0 20.511 17.338v-4.265M8.781 15.205l0.533 -2.932a1.6 1.6 0 0 1 0.448 -0.853l8.104 -8.104a1.919 1.919 0 0 1 2.719 2.719l-8.104 8.104a1.6 1.6 0 0 1 -0.853 0.448Z",
)
export const Eraser = glyph(
  "Eraser",
  "M18.451 9.459L14.592 5.6A1.64 1.64 0 0 0 12.263 5.6L4.151 13.712A1.64 1.64 0 0 0 4.151 16.041L8.01 19.9A1.64 1.64 0 0 0 10.339 19.9L18.451 11.788A1.64 1.64 0 0 0 18.451 9.459ZM7.048 10.815L13.236 17.003M9.18 20.381H21.25",
)
export const Expand06 = glyph(
  "Expand06",
  "M2.88 8.58V2.88h5.7M2.88 2.88l6.27 6.27M21.12 8.58V2.88h-5.7M21.12 2.88l-6.27 6.27M2.88 15.42v5.7h5.7M2.88 21.12l6.27 -6.27M21.12 15.42v5.7h-5.7M21.12 21.12l-6.27 -6.27",
)
export const Eye = glyph("Eye", `${EYE}M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z`)
export const EyeOff = glyph(
  "EyeOff",
  "M9.441 6.162A10.021 10.021 0 0 1 21.25 12A10.021 10.021 0 0 1 18.783 15.515M14.559 17.838A10.021 10.021 0 0 1 2.75 12A10.021 10.021 0 0 1 5.217 8.485M11.805 15.073A3.083 3.083 0 0 1 8.927 12.195M12.195 8.927A3.083 3.083 0 0 1 15.073 11.805M3.521 3.521l16.958 16.958",
)
export const FaceSmile = glyph(
  "FaceSmile",
  `${CIRCLE}M8.5 14c.8 1.25 2 2 3.5 2s2.7-.75 3.5-2M9 9.25v1M15 9.25v1`,
)
export const File03 = glyph(
  "File03",
  "M3.838 6.015a3.265 3.265 0 0 1 3.265 -3.265h9.794a3.265 3.265 0 0 1 3.265 3.265v11.971a3.265 3.265 0 0 1 -3.265 3.265h-9.794a3.265 3.265 0 0 1 -3.265 -3.265ZM8.191 13.632v3.265M12 7.103v9.794M15.809 10.368v6.529",
)
export const File04 = glyph("File04", FILE)
export const File05 = glyph("File05", `${FILE}M8.5 13.25h7M8.5 16.5h4.5`)
export const File06 = glyph(
  "File06",
  `${FILE}M8.5 10h2.5M8.5 13.25h7M8.5 16.5h7`,
)
export const FilePlus02 = glyph(
  "FilePlus02",
  "M19.899 12.68L19.899 9.348L13.551 3L7.203 3A3.174 3.174 0 0 0 4.029 6.174L4.029 17.812A3.174 3.174 0 0 0 7.203 20.986L13.646 20.986M13.551 3L13.551 7.232A2.116 2.116 0 0 0 15.667 9.348L19.899 9.348M8.261 12.522h7.406M8.261 16.225h3.703M18.312 15.431v5.819M15.402 18.341h5.819",
)
export const FilterLines = glyph(
  "FilterLines",
  "M2.75 6.015h18.5M6.015 12h11.971M9.279 17.985h5.441",
)
export const Flag01 = glyph(
  "Flag01",
  "M4.629 21.25V3.5M4.629 3.5L16.211 3.5A1.59 1.59 0 0 1 17.472 6.064L16.519 7.294A1.59 1.59 0 0 0 16.519 9.244L17.472 10.473A1.59 1.59 0 0 1 16.211 13.037L4.629 13.037",
)
export const FlipBackward = glyph(
  "FlipBackward",
  "M3 9.854H16.347a4.903 4.903 0 0 1 0 9.806h-4.358M9.265 3.59 3 9.854l6.265 6.265",
)
export const FlipForward = glyph(
  "FlipForward",
  "M21 9.854H7.653a4.903 4.903 0 0 0 0 9.806h4.358M14.735 3.59 21 9.854l-6.265 6.265",
)
/** Same drawing as Folder in ../custom (one folder for every variant). */
export const Folder = glyph("Folder", FOLDER)
export const FolderDownload = glyph(
  "FolderDownload",
  "M2.75 6.559a3.265 3.265 0 0 1 3.265 -3.265h2.884a2.176 2.176 0 0 1 1.741 0.871l1.197 1.524a2.176 2.176 0 0 0 1.741 0.871h4.407a3.265 3.265 0 0 1 3.265 3.265v7.618a3.265 3.265 0 0 1 -3.265 3.265h-11.971a3.265 3.265 0 0 1 -3.265 -3.265ZM12 10.096v6.801M8.191 13.088l3.809 3.809 3.809 -3.809",
)
export const FolderPlus = glyph(
  "FolderPlus",
  `${FOLDER}M12 10.75v5.5M9.25 13.5h5.5`,
)
export const GitBranch01 = glyph(
  "GitBranch01",
  "M3.273 2.75v10.909a4.091 4.091 0 0 0 4.091 4.091h7.364M3.273 7.114h11.455M20.727 7.114a3 3 0 1 1 -6 0 3 3 0 0 1 6 0ZM20.727 17.75a3 3 0 1 1 -6 0 3 3 0 0 1 6 0Z",
)
export const Globe01 = glyph(
  "Globe01",
  `${CIRCLE}M3.5 12h17M12 3.5c-2.25 2.4-3.5 5.3-3.5 8.5s1.25 6.1 3.5 8.5c2.25-2.4 3.5-5.3 3.5-8.5S14.25 5.9 12 3.5Z`,
)
export const GoogleChrome = glyph(
  "GoogleChrome",
  `${CIRCLE}M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM12 8.5h7.75M15.03 13.75l-3.87 6.71M8.97 13.75 5.1 7.04`,
)
export const Hash01 = glyph(
  "Hash01",
  "M2.88 8.01h18.24M2.88 15.99h18.24M8.01 2.88v18.24M15.99 2.88v18.24",
)
export const Heading01 = glyph(
  "Heading01",
  "M5.73 3.45v17.1M18.27 3.45v17.1M5.73 12h12.54M3.45 3.45h4.56M15.99 3.45h4.56M3.45 20.55h4.56M15.99 20.55h4.56",
)
export const Heading02 = glyph(
  "Heading02",
  "M2.88 4.02v15.96M12 4.02v15.96M2.88 12h9.12M15.99 12.855a2.565 2.565 0 0 1 5.13 0c0 1.995 -5.13 3.42 -5.13 7.125h5.13",
)
export const HeadingSquare = glyph(
  "HeadingSquare",
  `${FRAME}M8.5 7.5v9M15.5 7.5v9M8.5 12h7`,
)
export const Heart = glyph(
  "Heart",
  "M12 6.205C10.316 3.995 7.054 3.154 4.739 5.153c-2.315 1.999 -2.631 5.262 -0.842 7.577 1.578 1.999 5.893 5.893 7.472 7.261a0.947 0.947 0 0 0 1.263 0c1.578 -1.368 5.893 -5.262 7.472 -7.261 1.789 -2.315 1.473 -5.577 -0.842 -7.577 -2.315 -1.999 -5.577 -1.158 -7.261 1.052Z",
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
