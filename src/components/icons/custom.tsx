"use client"

import createIcon from "reicon-react/createIcon"

/**
 * The few glyphs Reicon doesn't ship (editor and layout symbols), drawn
 * here on Reicon's 24px grid with the app's stroke (STROKE, = the Outline
 * weight in index.tsx) so they sit with the rest. Line icons: round caps
 * and joins, no fill; the grips are dots. Filled reuses the outline (these
 * symbols have no filled form). Prefer a Reicon glyph when one exists.
 */

export const STROKE = 1.75

const line = (d: string) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`
const box = `<rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4.25" fill="none" stroke="currentColor" stroke-width="${STROKE}"/>`
const dot = (cx: number, cy: number) =>
  `<circle cx="${cx}" cy="${cy}" r="1.4" fill="currentColor"/>`
const glyph = (name: string, svg: string) =>
  createIcon(name, { O: svg, F: svg })

export const Circle = glyph(
  "Circle",
  `<circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="${STROKE}"/>`,
)
export const CircleDashed = glyph(
  "CircleDashed",
  `<circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="${STROKE}" stroke-linecap="round" stroke-dasharray="2.6 2.25"/>`,
)
export const Square = glyph("Square", box)
export const Columns2 = glyph("Columns2", box + line("M12 3.25v17.5"))
export const Columns3 = glyph(
  "Columns3",
  box + line("M9.1 3.25v17.5M14.9 3.25v17.5"),
)
export const Rows2 = glyph("Rows2", box + line("M3.25 12h17.5"))
export const Table = glyph(
  "Table",
  box + line("M3.25 9.25h17.5M3.25 14.75h17.5M9.25 9.25v11.5"),
)
export const Table2 = glyph(
  "Table2",
  box + line("M3.25 9.25h17.5M9.25 3.25v17.5M14.75 3.25v17.5"),
)
export const GripVertical = glyph(
  "GripVertical",
  dot(9, 6) + dot(15, 6) + dot(9, 12) + dot(15, 12) + dot(9, 18) + dot(15, 18),
)
export const GripHorizontal = glyph(
  "GripHorizontal",
  dot(6, 9) + dot(12, 9) + dot(18, 9) + dot(6, 15) + dot(12, 15) + dot(18, 15),
)
export const Heading = glyph("Heading", line("M6 4.5v15M18 4.5v15M6 12h12"))
export const Heading1 = glyph(
  "Heading1",
  line("M4 6v12M12 6v12M4 12h8M16.75 10.25 19.5 8.5v9.5"),
)
export const Heading2 = glyph(
  "Heading2",
  line(
    "M4 6v12M12 6v12M4 12h8M16.25 10.5c0-1.4 1.12-2.5 2.5-2.5s2.5 1 2.5 2.4c0 2.6-5 3.6-5 7.6h5",
  ),
)
export const Heading3 = glyph(
  "Heading3",
  line(
    "M4 6v12M12 6v12M4 12h8M16.6 8.9c.5-.6 1.3-.9 2.15-.9 1.4 0 2.4.9 2.4 2.1s-1 2.1-2.4 2.1c1.6 0 2.65.95 2.65 2.25 0 1.35-1.15 2.3-2.65 2.3-.9 0-1.7-.3-2.25-.9",
  ),
)
export const Pilcrow = glyph(
  "Pilcrow",
  line("M13 4.5v15M17 4.5v15M19 4.5H9.75a4.5 4.5 0 0 0 0 9H13"),
)
export const Strikethrough = glyph(
  "Strikethrough",
  line(
    "M16.5 5H9.6a3.1 3.1 0 0 0-2.9 4.2M14 12.25a3.9 3.9 0 0 1 0 7.75H6M4 12h16",
  ),
)
export const SeparatorHorizontal = glyph(
  "SeparatorHorizontal",
  line("M3.5 12h17M8.5 7.5 12 4l3.5 3.5M15.5 16.5 12 20l-3.5-3.5"),
)
export const Split = glyph(
  "Split",
  line(
    "M16 3.5h4.5V8M8 3.5H3.5V8M12 20.5v-7.3a4 4 0 0 0-1.17-2.83L3.5 3.5M20.5 3.5l-6.7 6.7",
  ),
)
export const ChevronsUp = glyph(
  "ChevronsUp",
  line("m7 11.5 5-5 5 5M7 17.5l5-5 5 5"),
)
export const ChevronsDownUp = glyph(
  "ChevronsDownUp",
  line("m7 19.5 5-5 5 5M7 4.5l5 5 5-5"),
)
