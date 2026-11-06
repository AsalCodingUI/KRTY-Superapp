import { IconLab } from "./IconLab"

export const metadata = { title: "Icon lab" }

/**
 * Dev page: every icon the app has (@/components/icons, Untitled UI base),
 * one tile each, no names. Hover a tile to see what it was before
 * (Reicon Outline, the set before Untitled UI). The workbench for drawing
 * our own versions.
 */
export default function IconLabPage() {
  return <IconLab />
}
