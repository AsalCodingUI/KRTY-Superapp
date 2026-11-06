import { IconLab } from "./IconLab"

export const metadata = { title: "Icon lab" }

/**
 * Dev page: every app icon (@/components/icons), one tile each, no names.
 * Hover a tile for the Untitled UI glyph it's based on; a dot marks the
 * icons we've redrawn. The workbench for drawing our own set.
 */
export default function IconLabPage() {
  return <IconLab />
}
